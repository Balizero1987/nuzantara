#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 1.5: Content Quality Filter
AI-powered quality assessment before RAG ingestion
Uses LLAMA 3.2:3b for intelligent scoring
"""

import json
import logging
import asyncio
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime
import re

try:
    import ollama
except ImportError:
    import os
    os.system("pip install ollama")
    import ollama

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
QUALITY_CONFIG = {
    'min_score': 6.0,              # Threshold for RAG (0-10)
    'min_keywords': 2,             # Minimum relevant keywords
    'min_length': 500,             # Minimum characters
    'tier_bonus': 0.5,             # Bonus for Tier 1 sources
    'outdated_penalty': 0.5,       # Penalty for old content (2023 or earlier)
    'duplicate_penalty': 1.0,      # Penalty for suspected duplicates
    'enable_llama_scoring': True,  # Enable AI scoring (vs rule-based only)
    'batch_size': 5,               # Parallel LLAMA calls
}

# Tier 1 sources (high credibility)
TIER_1_SOURCES = [
    'jakarta post', 'tempo', 'kompas', 'detik',
    'bkpm', 'imigrasi', 'direktorat', 'kementerian',
    'bloomberg', 'reuters', 'financial times'
]

# Relevant keywords for expat/digital nomad content
RELEVANT_KEYWORDS = [
    'visa', 'permit', 'immigration', 'expat', 'foreigner',
    'kitas', 'kitap', 'digital nomad', 'remote work',
    'business', 'tax', 'ppn', 'pajak', 'bkpm',
    'property', 'real estate', 'investment', 'sewa',
    'regulation', 'law', 'peraturan', 'undang-undang',
    'bali', 'jakarta', 'indonesia', 'surabaya'
]

# Blacklist patterns (low-quality pages)
BLACKLIST_PATTERNS = [
    r'/about', r'/contact', r'/team', r'/careers',
    r'/privacy', r'/terms', r'/cookies', r'/advertise',
    r'/subscribe', r'/newsletter', r'/404', r'/error'
]

BLACKLIST_TITLES = [
    'about us', 'contact us', 'meet the team', 'our team',
    'subscribe', 'newsletter', 'cookie policy', 'privacy policy',
    'terms of service', 'advertise with us', '404', 'page not found'
]


def rule_based_filter(markdown: str, url: str, title: str) -> Tuple[bool, str]:
    """
    Fast rule-based filtering (pre-LLAMA)
    Returns: (should_keep, reason)
    """

    # Blacklist URL patterns
    for pattern in BLACKLIST_PATTERNS:
        if re.search(pattern, url.lower()):
            return False, f"Blacklisted URL pattern: {pattern}"

    # Blacklist title patterns
    title_lower = title.lower()
    for blacklist in BLACKLIST_TITLES:
        if blacklist in title_lower:
            return False, f"Blacklisted title: {blacklist}"

    # Minimum length
    if len(markdown) < QUALITY_CONFIG['min_length']:
        return False, f"Too short: {len(markdown)} chars"

    # Minimum keyword count
    content_lower = markdown.lower()
    keyword_count = sum(1 for kw in RELEVANT_KEYWORDS if kw in content_lower)

    if keyword_count < QUALITY_CONFIG['min_keywords']:
        return False, f"Too few keywords: {keyword_count}/{QUALITY_CONFIG['min_keywords']}"

    # Minimum sentences (substance check)
    sentences = [s.strip() for s in markdown.split('.') if len(s.strip()) > 20]
    if len(sentences) < 5:
        return False, f"Too few sentences: {len(sentences)}"

    return True, "Passed rule-based filter"


def calculate_bonuses_penalties(markdown: str, url: str, source_name: str) -> Dict:
    """
    Calculate score adjustments based on heuristics
    """
    adjustments = {
        'tier_bonus': 0,
        'outdated_penalty': 0,
        'duplicate_penalty': 0,
        'total_adjustment': 0
    }

    # Tier 1 bonus
    source_lower = (source_name + ' ' + url).lower()
    if any(tier1 in source_lower for tier1 in TIER_1_SOURCES):
        adjustments['tier_bonus'] = QUALITY_CONFIG['tier_bonus']
        adjustments['total_adjustment'] += adjustments['tier_bonus']

    # Outdated content penalty (2023 or earlier)
    current_year = datetime.now().year
    for year in range(2020, 2024):  # 2020-2023
        if str(year) in markdown[:500]:  # Check first 500 chars
            adjustments['outdated_penalty'] = -QUALITY_CONFIG['outdated_penalty']
            adjustments['total_adjustment'] += adjustments['outdated_penalty']
            break

    # Duplicate detection (simple heuristic)
    # Check for repeated phrases (potential scraper duplicates)
    lines = markdown.split('\n')
    if len(lines) > 10:
        line_set = set(lines)
        duplicate_ratio = 1 - (len(line_set) / len(lines))
        if duplicate_ratio > 0.5:  # More than 50% duplicate lines
            adjustments['duplicate_penalty'] = -QUALITY_CONFIG['duplicate_penalty']
            adjustments['total_adjustment'] += adjustments['duplicate_penalty']

    return adjustments


async def llama_quality_score(markdown: str, url: str, category: str, source_name: str) -> Dict:
    """
    LLAMA-powered quality assessment
    Returns: score (0-10), reason, topics
    """

    # Truncate content for LLAMA (max 2000 chars)
    content_sample = markdown[:2000]

    prompt = f"""You are a content quality analyst for expat and digital nomad intelligence in Bali/Indonesia.

Analyze this scraped content and score its value for our audience (0-10):

CONTENT PREVIEW:
{content_sample}

SOURCE: {source_name}
URL: {url}
CATEGORY: {category}

SCORING CRITERIA (total 10 points):
1. Relevance for expats/digital nomads (0-3 points)
   - Immigration, visa, permits, business setup, taxes, real estate

2. Actionable information (0-3 points)
   - Specific steps, requirements, deadlines, costs
   - NOT generic advice or promotional content

3. Freshness/timeliness (0-2 points)
   - Recent information (2024-2025)
   - Current regulations and prices

4. Source credibility (0-2 points)
   - Official government sources, reputable news
   - NOT promotional blogs or advertorials

Return ONLY valid JSON (no markdown, no extra text):
{{
  "score": 0-10,
  "reason": "1-2 sentence explanation",
  "key_topics": ["topic1", "topic2", "topic3"]
}}

JSON:"""

    try:
        response = ollama.generate(
            model='llama3.2:3b',
            prompt=prompt,
            options={'temperature': 0.3}  # Lower temp for consistent scoring
        )

        text = response['response'].strip()

        # Extract JSON (handle markdown wrapping)
        if '```' in text:
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
            text = text.strip()

        # Clean control characters
        text = re.sub(r'[\x00-\x1F\x7F]', ' ', text)

        result = json.loads(text)

        # Validate score range
        result['score'] = max(0, min(10, float(result.get('score', 0))))

        return result

    except Exception as e:
        logger.error(f"LLAMA scoring error: {e}")
        return {
            'score': 0,
            'reason': f'Scoring failed: {str(e)[:100]}',
            'key_topics': []
        }


async def assess_content_quality(
    markdown: str,
    url: str,
    title: str,
    category: str,
    source_name: str
) -> Tuple[bool, float, str, Dict]:
    """
    Complete quality assessment pipeline
    Returns: (keep, final_score, reason, metadata)
    """

    # Stage 1: Rule-based filter (fast)
    keep_rules, rule_reason = rule_based_filter(markdown, url, title)

    if not keep_rules:
        logger.info(f"[FILTER] ❌ REJECTED (rules): {url[:60]} → {rule_reason}")
        return False, 0.0, rule_reason, {}

    # Stage 2: LLAMA scoring (if enabled)
    if not QUALITY_CONFIG['enable_llama_scoring']:
        logger.info(f"[FILTER] ✅ ACCEPTED (rules only): {url[:60]}")
        return True, 8.0, "Passed rule-based filter", {}

    llama_result = await llama_quality_score(markdown, url, category, source_name)
    base_score = llama_result['score']

    # Stage 3: Apply bonuses/penalties
    adjustments = calculate_bonuses_penalties(markdown, url, source_name)
    final_score = base_score + adjustments['total_adjustment']
    final_score = max(0, min(10, final_score))  # Clamp to 0-10

    # Decision
    keep = final_score >= QUALITY_CONFIG['min_score']

    # Enhanced reason with adjustments
    reason = llama_result['reason']
    if adjustments['total_adjustment'] != 0:
        reason += f" (adjusted: {adjustments['total_adjustment']:+.1f})"

    # Metadata for RAG
    metadata = {
        'quality_score': final_score,
        'base_score': base_score,
        'adjustments': adjustments,
        'topics': llama_result.get('key_topics', []),
        'filtered_at': datetime.now().isoformat(),
        'filter_reason': reason
    }

    # Logging
    status = "✅ ACCEPTED" if keep else "❌ REJECTED"
    logger.info(f"[FILTER] {status}: {url[:60]} → {final_score:.1f}/10 ({reason})")

    return keep, final_score, reason, metadata


async def batch_assess(documents: List[Dict]) -> List[Dict]:
    """
    Assess multiple documents in parallel batches
    """
    results = []

    # Process in batches
    batch_size = QUALITY_CONFIG['batch_size']

    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]

        tasks = [
            assess_content_quality(
                doc['content'],
                doc['url'],
                doc['title'],
                doc['category'],
                doc['source_name']
            )
            for doc in batch
        ]

        batch_results = await asyncio.gather(*tasks)

        for doc, (keep, score, reason, metadata) in zip(batch, batch_results):
            results.append({
                **doc,
                'keep': keep,
                'quality_score': score,
                'filter_reason': reason,
                'quality_metadata': metadata
            })

    return results


def main():
    """Test/demo"""
    logger.info("=" * 70)
    logger.info("CONTENT QUALITY FILTER - Test Mode")
    logger.info(f"Configuration: {QUALITY_CONFIG}")
    logger.info("=" * 70)

    # Example test documents
    test_docs = [
        {
            'content': 'New visa regulations for digital nomads in Bali 2025. Requirements: passport valid 6 months, proof of income $2000/month, health insurance. Application process takes 2-3 weeks. Cost: IDR 5 million.',
            'url': 'https://imigrasi.go.id/visa-digital-nomad',
            'title': 'Digital Nomad Visa Requirements 2025',
            'category': 'immigration',
            'source_name': 'Direktorat Imigrasi'
        },
        {
            'content': 'About Us - We are a team of passionate developers...',
            'url': 'https://example.com/about',
            'title': 'About Us',
            'category': 'general',
            'source_name': 'Example Blog'
        }
    ]

    async def run_test():
        results = await batch_assess(test_docs)

        print("\n" + "=" * 70)
        print("RESULTS:")
        print("=" * 70)
        for r in results:
            print(f"\n{r['title']}")
            print(f"  Keep: {r['keep']}")
            print(f"  Score: {r['quality_score']:.1f}/10")
            print(f"  Reason: {r['filter_reason']}")

    asyncio.run(run_test())


if __name__ == "__main__":
    main()

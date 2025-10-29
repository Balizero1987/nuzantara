#!/usr/bin/env python3
"""
Stage 2 Parallel Processor - Intel Automation Pipeline
Runs Stage 2A (RAG Processing), Stage 2B (Content Creation), and Stage 2C (Bali Zero Journal) IN PARALLEL

Supports:
- Ollama Local (Mistral 7B, Mixtral 8x7B, Llama 3.1, Qwen 2.5)
- RunPod Cloud (ZANTARA Llama via vLLM)

Quality filters: 5-day max age, quality score, tier validation
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import hashlib
import aiohttp
from loguru import logger
import chromadb
import re

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# AI Configuration - Detect which backend to use
AI_BACKEND = os.environ.get("AI_BACKEND", "ollama")  # "ollama" or "runpod"
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")  # ⭐ Default: llama3.1:8b (also: mistral:7b, mixtral:8x7b, qwen2.5:7b)
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

# RunPod configuration (if using cloud)
RUNPOD_LLAMA_ENDPOINT = os.environ.get("RUNPOD_LLAMA_ENDPOINT")
RUNPOD_API_KEY = os.environ.get("RUNPOD_API_KEY")

# Quality thresholds
MAX_NEWS_AGE_DAYS = 5
MIN_QUALITY_SCORE = 5.0
MIN_WORD_COUNT = 100
TIER_WEIGHTS = {"t1": 1.0, "t2": 0.7, "t3": 0.4}


class OllamaClient:
    """Ollama Local client for intel processing (Llama 3.1 8B, Mistral 7B, Mixtral 8x7B)"""

    def __init__(self, model: str = "llama3.1:8b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.timeout = aiohttp.ClientTimeout(total=300)  # 5 min timeout for parallel processing
        logger.info(f"Initialized Ollama client: {model} @ {base_url}")

    async def generate(self, prompt: str, max_tokens: int = 2000) -> Optional[str]:
        """Generate text using Ollama local model"""

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": 0.7,
                "top_p": 0.9,
            }
        }

        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(f"{self.base_url}/api/generate", json=payload) as resp:
                    if resp.status != 200:
                        logger.error(f"Ollama error: {resp.status}")
                        return None

                    data = await resp.json()
                    return data.get("response")

        except asyncio.TimeoutError:
            logger.error(f"Ollama timeout for model {self.model}")
            return None
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return None


class ZantaraLlamaClient:
    """ZANTARA Llama 3.1 client for intel processing (RunPod vLLM)"""

    def __init__(self):
        self.endpoint = RUNPOD_LLAMA_ENDPOINT
        self.api_key = RUNPOD_API_KEY
        self.timeout = aiohttp.ClientTimeout(total=60)
        logger.info(f"Initialized ZANTARA Llama client @ RunPod")

    async def generate(self, prompt: str, max_tokens: int = 2000) -> Optional[str]:
        """Generate text using ZANTARA Llama"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "input": {
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": 0.7,
                "top_p": 0.9,
            }
        }

        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(self.endpoint, json=payload, headers=headers) as resp:
                    if resp.status != 200:
                        logger.error(f"ZANTARA Llama error: {resp.status}")
                        return None

                    data = await resp.json()

                    # Handle RunPod response format
                    if "output" in data:
                        return data["output"]
                    elif "result" in data:
                        return data["result"]
                    else:
                        logger.error(f"Unexpected response format: {data}")
                        return None

        except asyncio.TimeoutError:
            logger.error("ZANTARA Llama timeout")
            return None
        except Exception as e:
            logger.error(f"ZANTARA Llama error: {e}")
            return None


class QualityFilter:
    """Quality filter for intel items"""

    @staticmethod
    def calculate_quality_score(item: Dict[str, Any]) -> float:
        """Calculate quality score (0-10)"""

        score = 5.0  # Base score

        # Tier bonus
        tier = item.get("tier", "t3").lower()
        score += TIER_WEIGHTS.get(tier, 0.4) * 2

        # Word count bonus
        content = item.get("content", "")
        word_count = len(content.split())
        if word_count >= 300:
            score += 2.0
        elif word_count >= 150:
            score += 1.0

        # Date bonus
        if item.get("published_date"):
            score += 0.5

        # Impact level bonus
        impact = item.get("impact_level", "low")
        if impact == "critical":
            score += 1.5
        elif impact == "high":
            score += 1.0

        # Sources bonus
        if item.get("source_url"):
            score += 0.5

        return min(score, 10.0)

    @staticmethod
    def is_too_old(published_date: Optional[str]) -> bool:
        """Check if news is older than MAX_NEWS_AGE_DAYS

        STRICT MODE: Missing or invalid dates are REJECTED (assumed too old).
        With Stage 1 date extraction + filename fallback, ~95% of articles should have valid dates.
        """

        if not published_date:
            logger.warning(f"No published_date found - REJECTING (strict mode)")
            return True  # STRICT: No date = REJECT (assume too old)

        try:
            pub_date = datetime.fromisoformat(published_date.replace('Z', '+00:00'))
            age = datetime.now(pub_date.tzinfo) - pub_date
            is_old = age.days > MAX_NEWS_AGE_DAYS

            if is_old:
                logger.info(f"Article too old: {age.days} days > {MAX_NEWS_AGE_DAYS} days")

            return is_old
        except Exception as e:
            logger.warning(f"Invalid date format: {published_date} - REJECTING (strict mode) - {e}")
            return True  # STRICT: Invalid date = REJECT (can't verify freshness)

    @staticmethod
    def passes_filters(item: Dict[str, Any]) -> tuple[bool, str]:
        """Check if item passes all quality filters"""

        # Age filter
        if QualityFilter.is_too_old(item.get("published_date")):
            return False, f"Too old (>{MAX_NEWS_AGE_DAYS} days)"

        # Quality score filter
        score = QualityFilter.calculate_quality_score(item)
        if score < MIN_QUALITY_SCORE:
            return False, f"Quality score too low: {score:.1f} < {MIN_QUALITY_SCORE}"

        # Word count filter
        content = item.get("content", "")
        word_count = len(content.split())
        if word_count < MIN_WORD_COUNT:
            return False, f"Word count too low: {word_count} < {MIN_WORD_COUNT}"

        # Tier validation
        tier = item.get("tier", "").lower()
        if tier not in TIER_WEIGHTS:
            return False, f"Invalid tier: {tier}"

        return True, "OK"


class Stage2AProcessor:
    """Stage 2A: RAG Processing (Raw → ChromaDB JSON)"""

    def __init__(self, chroma_path: str = "./data/chromadb"):
        # Auto-detect AI backend
        if AI_BACKEND == "ollama":
            self.llama = OllamaClient(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)
            logger.info(f"Stage 2A using Ollama: {OLLAMA_MODEL}")
        else:
            self.llama = ZantaraLlamaClient()
            logger.info("Stage 2A using ZANTARA Llama (RunPod)")

        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.quality_filter = QualityFilter()

        # Intel collections
        self.collections = {
            "immigration": "bali_intel_immigration",
            "bkpm_tax": "bali_intel_bkpm_tax",
            "realestate": "bali_intel_realestate",
            "events": "bali_intel_events",
            "social": "bali_intel_social",
            "competitors": "bali_intel_competitors",
            "bali_news": "bali_intel_bali_news",
            "roundup": "bali_intel_roundup",
        }

        # Ensure collections exist
        for name, collection_name in self.collections.items():
            try:
                self.chroma_client.get_collection(collection_name)
            except:
                self.chroma_client.create_collection(collection_name)

    async def process_raw_file(self, raw_file: Path, category: str) -> Optional[Dict[str, Any]]:
        """Process single raw markdown file → ChromaDB JSON"""

        logger.info(f"Processing RAG: {raw_file.name} (category: {category})")

        # Read raw content
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()
        except Exception as e:
            logger.error(f"Failed to read {raw_file}: {e}")
            return None

        # Extract published_date from markdown header (Stage 1 extraction)
        published_date = None
        try:
            # Parse markdown header for "**Published**: DATE"
            match = re.search(r'\*\*Published\*\*:\s*(.+?)(?:\n|$)', raw_content)
            if match:
                date_str = match.group(1).strip()
                if date_str and date_str != "Not found" and date_str != "null":
                    published_date = date_str
                    logger.info(f"Extracted date from markdown: {published_date}")
        except Exception as e:
            logger.warning(f"Failed to parse published_date from markdown: {e}")

        # Fallback: Use scraping timestamp from filename if no date found
        if not published_date:
            try:
                # Filename format: 20251024_HHMMSS_sitename.md
                filename_match = re.match(r'(\d{8})_', raw_file.name)
                if filename_match:
                    date_str = filename_match.group(1)  # 20251024
                    published_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
                    logger.info(f"Using scraping date as fallback: {published_date}")
            except Exception as e:
                logger.warning(f"Failed to extract date from filename: {e}")

        # Extract with ZANTARA Llama
        prompt = f"""Analyze this Indonesian business/regulatory content and extract structured information.

Category: {category}
Content: {raw_content[:3000]}

IMPORTANT: The published_date is "{published_date if published_date else 'unknown'}". Use this date in your response.

Extract as JSON:
{{
  "title": "Clear title of the news/article",
  "summary_id": "2-3 sentence summary in Indonesian",
  "summary_en": "2-3 sentence summary in English",
  "tier": "t1|t2|t3",
  "impact_level": "critical|high|medium|low",
  "category": "{category}",
  "published_date": "{published_date if published_date else 'null'}",
  "source_url": "URL of the source",
  "source_name": "Name of source",
  "key_changes": ["list of key changes or updates"],
  "affected_groups": ["who is affected"],
  "action_required": true|false,
  "urgency": "immediate|soon|future|none",
  "content": "full article text in original language"
}}

Output ONLY valid JSON, no markdown formatting."""

        result_text = await self.llama.generate(prompt, max_tokens=2500)

        if not result_text:
            logger.error(f"ZANTARA Llama failed for {raw_file.name}")
            return None

        # Parse JSON
        try:
            # Clean markdown if present
            clean_text = result_text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.split("```")[1]
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:]
                clean_text = clean_text.strip()

            extracted = json.loads(clean_text)

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error for {raw_file.name}: {e}")
            return None

        # Quality filtering
        passes, reason = self.quality_filter.passes_filters(extracted)
        if not passes:
            logger.warning(f"Quality filter REJECT: {raw_file.name} - {reason}")
            return None

        # Add metadata
        extracted["id"] = hashlib.sha256(raw_content.encode()).hexdigest()[:16]
        extracted["processed_at"] = datetime.now().isoformat()
        extracted["quality_score"] = self.quality_filter.calculate_quality_score(extracted)

        logger.info(f"✅ RAG processed: {raw_file.name} (score: {extracted['quality_score']:.1f})")

        return extracted

    async def store_to_chromadb(self, item: Dict[str, Any], category: str):
        """Store item to ChromaDB collection"""

        collection_name = self.collections.get(category)
        if not collection_name:
            logger.error(f"Unknown category: {category}")
            return

        try:
            collection = self.chroma_client.get_collection(collection_name)

            # Store with embedding (ChromaDB will auto-embed)
            collection.add(
                documents=[item.get("content", "")],
                metadatas=[{
                    "id": item["id"],
                    "title": item.get("title", ""),
                    "tier": item.get("tier", "t3"),
                    "impact_level": item.get("impact_level", "low"),
                    "published_date": item.get("published_date", ""),
                    "quality_score": str(item.get("quality_score", 0)),
                    "category": category,
                }],
                ids=[item["id"]]
            )

            logger.info(f"✅ Stored to ChromaDB: {item['id']} ({collection_name})")

        except Exception as e:
            logger.error(f"ChromaDB store error: {e}")


class Stage2BProcessor:
    """Stage 2B: Content Creation (Raw → Consolidated Markdown articles per category)"""

    def __init__(self):
        # Auto-detect AI backend
        if AI_BACKEND == "ollama":
            self.llama = OllamaClient(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)
            logger.info(f"Stage 2B using Ollama: {OLLAMA_MODEL}")
        else:
            self.llama = ZantaraLlamaClient()
            logger.info("Stage 2B using ZANTARA Llama (RunPod)")

        # Store processed articles to avoid duplicates
        self.processed_articles = {}

    def extract_metadata(self, raw_content: str, raw_file: Path) -> Dict[str, str]:
        """Extract metadata from raw markdown file"""

        metadata = {
            "title": "Untitled",
            "source": "Unknown Source",
            "url": "",
            "published_date": "",
            "scraped_date": ""
        }

        # Extract title (first H1 header)
        title_match = re.search(r'^#\s+(.+?)$', raw_content, re.MULTILINE)
        if title_match:
            metadata["title"] = title_match.group(1).strip()

        # Extract source
        source_match = re.search(r'\*\*Source\*\*:\s*(.+?)(?:\n|$)', raw_content)
        if source_match:
            metadata["source"] = source_match.group(1).strip()

        # Extract URL
        url_match = re.search(r'\*\*URL\*\*:\s*(.+?)(?:\n|$)', raw_content)
        if url_match:
            metadata["url"] = url_match.group(1).strip()

        # Extract published date
        pub_match = re.search(r'\*\*Published\*\*:\s*(.+?)(?:\n|$)', raw_content)
        if pub_match:
            metadata["published_date"] = pub_match.group(1).strip()

        # Extract scraped date
        scraped_match = re.search(r'\*\*Scraped\*\*:\s*(.+?)(?:\n|$)', raw_content)
        if scraped_match:
            metadata["scraped_date"] = scraped_match.group(1).strip()

        # Fallback: extract date from filename if no published date
        if not metadata["published_date"] or metadata["published_date"] == "Not found":
            filename_match = re.match(r'(\d{8})_', raw_file.name)
            if filename_match:
                date_str = filename_match.group(1)
                metadata["published_date"] = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"

        return metadata

    async def create_article(self, raw_file: Path, category: str) -> Optional[Dict[str, Any]]:
        """Create article data from raw content"""

        logger.info(f"Processing Content: {raw_file.name} (category: {category})")

        # Read raw content
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()
        except Exception as e:
            logger.error(f"Failed to read {raw_file}: {e}")
            return None

        # Extract metadata
        metadata = self.extract_metadata(raw_content, raw_file)

        # Generate article with ZANTARA Llama
        prompt = f"""You are an expert analyst creating a professional intel report from news content.

Category: {category}
Source Content: {raw_content[:4000]}

Create a comprehensive analysis in ENGLISH following this structure:

### Executive Summary
[2-3 sentences providing high-level overview]

### Key Points
[Bullet points of most important information]

### Impact Analysis
[Who is affected and how]

### Action Items
[What needs to be done]

### Details
[Full analysis of the content with context and implications]

Focus on practical implications for businesses and expats in Indonesia."""

        article_content = await self.llama.generate(prompt, max_tokens=2000)

        if not article_content:
            logger.error(f"ZANTARA Llama failed for article: {raw_file.name}")
            return None

        logger.info(f"✅ Article created: {raw_file.name}")

        return {
            "metadata": metadata,
            "content": article_content,
            "raw_file": raw_file.name
        }

    async def create_consolidated_report(self, articles: List[Dict[str, Any]], category: str) -> str:
        """Create consolidated markdown report for a category"""

        # Sort articles by published date (newest first)
        sorted_articles = sorted(
            articles,
            key=lambda x: x["metadata"].get("published_date", ""),
            reverse=True
        )

        # Collect unique sources
        sources = list(set(article["metadata"]["source"] for article in sorted_articles if article["metadata"]["source"]))

        # Generate report
        report = []
        report.append(f"# Intel Report - {category.upper().replace('_', ' ')}")
        report.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"**Total Articles**: {len(sorted_articles)}")
        report.append(f"**Sources**: {', '.join(sources)}")
        report.append("")
        report.append("---")
        report.append("")

        # Table of contents
        report.append("## TABLE OF CONTENTS")
        for idx, article in enumerate(sorted_articles, 1):
            title = article["metadata"]["title"]
            # Create anchor-friendly ID
            anchor = f"article-{idx}"
            report.append(f"{idx}. [{title}](#{anchor})")
        report.append("")
        report.append("---")
        report.append("")

        # Articles
        for idx, article in enumerate(sorted_articles, 1):
            metadata = article["metadata"]
            content = article["content"]

            report.append(f"## Article {idx}: {metadata['title']} {{#{f'article-{idx}'}}}")
            report.append(f"**Original Publication**: {metadata['published_date']}")
            report.append(f"**Source**: [{metadata['source']}]({metadata['url']})")
            report.append(f"**Scraped**: {metadata['scraped_date']}")
            report.append("")
            report.append(content)
            report.append("")
            report.append("---")
            report.append("")

        return "\n".join(report)


class Stage2CProcessor:
    """Stage 2C: Bali Zero Journal (Raw → SEO-optimized blog posts)"""

    def __init__(self):
        # Auto-detect AI backend
        if AI_BACKEND == "ollama":
            self.llama = OllamaClient(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)
            logger.info(f"Stage 2C (Bali Zero Journal) using Ollama: {OLLAMA_MODEL}")
        else:
            self.llama = ZantaraLlamaClient()
            logger.info("Stage 2C (Bali Zero Journal) using ZANTARA Llama (RunPod)")

    async def create_journal_post(self, raw_file: Path, category: str) -> Optional[str]:
        """Create SEO-optimized blog post for Bali Zero Journal"""

        logger.info(f"Processing Bali Zero Journal: {raw_file.name} (category: {category})")

        # Read raw content
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()
        except Exception as e:
            logger.error(f"Failed to read {raw_file}: {e}")
            return None

        # Generate SEO-optimized blog post - ENHANCED PROMPT FOR LONGER POSTS
        prompt = f"""You are a professional content writer for Bali Zero Journal, creating engaging, comprehensive content for expats and digital nomads in Indonesia.

CRITICAL REQUIREMENT: Generate a MINIMUM of 800-1200 words. Create engaging, detailed content that provides real value.

Category: {category}
Source Content: {raw_content[:5000]}

Create a comprehensive, SEO-optimized blog post in ENGLISH following this EXACT structure:

# [Catchy, SEO-Optimized Title with Keywords - Make it Compelling!]

**Published on**: {datetime.now().strftime("%Y-%m-%d")}
**Category**: {category.replace('_', ' ').title()}
**Reading time**: 6-8 minutes
**Author**: Bali Zero Editorial Team

## TL;DR - Quick Summary
[3-4 bullet points with the absolute essentials - what busy readers MUST know]

## Introduction (150-200 words)
[Start with a hook - a surprising fact, question, or relatable scenario. Then provide context about why this matters RIGHT NOW for expats and digital nomads in Bali. Use conversational but professional tone. Include relevant keywords naturally.]

## The Big Picture: What's Really Happening (200-250 words)
[Explain the broader context in an engaging way:
- Why is Indonesia making these changes?
- How does this fit into the bigger economic/regulatory picture?
- What trends are driving this?
- Include specific examples and anecdotes to make it relatable]

## Breaking Down the Changes (400-450 words)

### What's Changing
[Detailed but digestible explanation with:
- Clear before/after scenarios
- Specific dates and deadlines
- Real-world examples of how this affects daily life
- Use subheadings, bullets, and formatting for readability]

### Who This Affects (And How)
[Break down by reader segments:

**Digital Nomads on Tourist Visas:**
[Specific implications]

**Business Visa Holders (KITAS):**
[What they need to know]

**Property Owners and Investors:**
[Investment implications]

**Remote Workers and Freelancers:**
[Compliance requirements]]

## Real Talk: What This Means for Your Life in Bali (250-300 words)
[Get practical and specific:
- Day-to-day implications
- Cost impacts (be specific with numbers if possible)
- Lifestyle adjustments
- Common scenarios and how to handle them
- Address concerns and misconceptions]

## Expert Tips: Navigating the Changes Like a Pro (200-250 words)
[5-7 actionable tips from "insiders" perspective:
1. **Proactive Documentation:** [Specific advice]
2. **Timeline Management:** [Key dates to calendar]
3. **Professional Help:** [When to get it]
4. **Cost Optimization:** [Money-saving strategies]
5. **Compliance Hacks:** [Legal shortcuts and efficiencies]
6. **Community Resources:** [Where to get help]
7. **Future-Proofing:** [Preparing for what's next]]

## FAQ: Your Burning Questions Answered
[Address 4-5 common questions in Q&A format:

**Q: Do these changes affect me if I'm already in Bali?**
A: [Detailed answer]

**Q: What's the deadline for compliance?**
A: [Specific dates and requirements]

**Q: Will this cost me more money?**
A: [Honest assessment with numbers]

**Q: Can I get around these requirements?**
A: [Legal options and alternatives]

**Q: Where can I get official help?**
A: [Resources and contacts]]

## The Bottom Line (150-200 words)
[Strong conclusion that:
- Summarizes key takeaways
- Provides perspective (is this good/bad/neutral?)
- Offers reassurance where appropriate
- Motivates action where needed
- Ends with a forward-looking statement]

## Take Action: Your Next Steps
✅ [Specific action item 1]
✅ [Specific action item 2]
✅ [Specific action item 3]
✅ [Specific action item 4]
📅 Mark your calendar: [Key dates]

## Need Professional Help?
[Brief CTA for Bali Zero services - keep it helpful, not salesy]

Looking for expert guidance navigating these changes? The Bali Zero team specializes in helping expats and digital nomads stay compliant while maximizing their opportunities in Indonesia.

**Get in touch:** hello@balizero.com | WhatsApp: +62 XXX

---

**Sources & Additional Reading:**
- [Primary source with link]
- [Government website or regulation]
- [Related Bali Zero article if applicable]

**Share This Article:**
📱 [Social sharing buttons placeholder]

**Tags:** #{category} #BaliExpat #DigitalNomadBali #IndonesiaRegulations #BaliLife #ExpatLife #BaliNews #{datetime.now().strftime("%Y")}Updates

---
*Disclaimer: This article is for informational purposes only and should not be considered legal advice. Regulations can change rapidly - always verify current requirements with official sources or qualified professionals.*

*© {datetime.now().strftime("%Y")} Bali Zero Journal. Part of the Bali Zero ecosystem - your trusted partner for life and business in Indonesia.*

IMPORTANT: Make this article engaging, informative, and genuinely helpful. Use a conversational but professional tone. Include specific examples, numbers, and dates. The article MUST be between 800-1200 words minimum to provide comprehensive value."""

        journal_post = await self.llama.generate(prompt, max_tokens=4500)

        if not journal_post:
            logger.error(f"Llama failed for Bali Zero Journal: {raw_file.name}")
            return None

        logger.info(f"✅ Bali Zero Journal post created: {raw_file.name}")

        return journal_post


async def run_stage2_parallel(raw_files: List[Path], enable_journal: bool = False, run_date: Optional[str] = None) -> Dict[str, Any]:
    """Run Stage 2A in parallel, then 2B consolidated, optionally 2C

    Args:
        raw_files: List of raw markdown files to process
        enable_journal: Enable Stage 2C journal generation
        run_date: Date string in YYYY-MM-DD format for organizing output (default: today)

    - 2A (RAG): Parallel processing
    - 2B (Content): Consolidated markdown per category
    - 2C (Journal): Optional, only if enabled
    """
    # Get run date (today by default)
    if run_date is None:
        run_date = datetime.now().strftime('%Y-%m-%d')

    logger.info(f"Starting Stage 2 processing for {len(raw_files)} files (Journal: {'Enabled' if enable_journal else 'Disabled'})")
    logger.info(f"Run date: {run_date}")

    start_time = datetime.now()

    stage_2a = Stage2AProcessor()
    stage_2b = Stage2BProcessor()
    stage_2c = Stage2CProcessor()

    # Organize files by category
    files_by_category = {}
    for raw_file in raw_files:
        # Extract category from path structure
        # Expected: raw/{category}/*.md or INTEL_SCRAPING/raw/{category}/*.md
        parts = raw_file.parts

        category = None

        # Find 'raw' in path and get the category directory
        # Structure: raw/YYYY-MM-DD/{category}/file.md or raw/{category}/file.md
        try:
            raw_idx = None
            for i, part in enumerate(parts):
                if part == "raw":
                    raw_idx = i
                    break

            if raw_idx is not None:
                # Check if next directory is a date (YYYY-MM-DD format)
                if raw_idx + 2 < len(parts):
                    potential_date = parts[raw_idx + 1]
                    # If it's a date, skip it and get the next directory as category
                    if re.match(r'^\d{4}-\d{2}-\d{2}$', potential_date):
                        potential_category = parts[raw_idx + 2]
                        if not potential_category.endswith('.md'):
                            category = potential_category
                    else:
                        # No date directory, use next directory as category
                        potential_category = parts[raw_idx + 1]
                        if not potential_category.endswith('.md'):
                            category = potential_category
                elif raw_idx + 1 < len(parts):
                    # Only one directory after 'raw'
                    potential_category = parts[raw_idx + 1]
                    if not potential_category.endswith('.md'):
                        category = potential_category

            # Fallback: read category from file metadata
            if not category:
                with open(raw_file, 'r', encoding='utf-8') as f:
                    content_preview = f.read(500)
                    cat_match = re.search(r'\*\*Category\*\*:\s*(.+?)(?:\n|$)', content_preview)
                    if cat_match:
                        category = cat_match.group(1).strip()
        except Exception as e:
            logger.warning(f"Failed to extract category from {raw_file}: {e}")

        # Default fallback
        if not category:
            category = "general"

        # Normalize category name
        category = category.lower().replace(" ", "_").replace("-", "_")

        if category not in files_by_category:
            files_by_category[category] = []
        files_by_category[category].append(raw_file)

    # Results tracking
    results = {
        "stage_2a": {
            "processed": 0,
            "failed": 0,
            "filtered": 0,
        },
        "stage_2b": {
            "created": 0,
            "failed": 0,
        },
        "stage_2c": {
            "created": 0,
            "failed": 0,
        },
        "total_files": len(raw_files),
        "duration": 0,
    }

    # PHASE 1: Run all Stage 2A (RAG) in parallel
    logger.info("Phase 1: Running Stage 2A (RAG) in parallel...")
    tasks_2a = []
    for category, files in files_by_category.items():
        for raw_file in files:
            task_2a = asyncio.create_task(
                process_stage_2a(stage_2a, raw_file, category, results)
            )
            tasks_2a.append(task_2a)

    await asyncio.gather(*tasks_2a, return_exceptions=True)
    logger.info(f"✅ Phase 1 complete: {results['stage_2a']['processed']} RAG processed, {results['stage_2a']['filtered']} filtered")

    # PHASE 2: Run Stage 2B (Consolidated Content) - CREATE 1 SINGLE FILE
    logger.info("Phase 2: Running Stage 2B (Consolidated Content Creation)...")

    # Collect ALL articles from ALL categories
    all_articles_by_category = {}

    for category, files in files_by_category.items():
        articles = []
        for raw_file in files:
            article_data = await stage_2b.create_article(raw_file, category)
            if article_data:
                # Add category to article data
                article_data["category"] = category
                articles.append(article_data)
                results["stage_2b"]["created"] += 1
            else:
                results["stage_2b"]["failed"] += 1

        if articles:
            all_articles_by_category[category] = articles

    # Create 1 SINGLE consolidated report with ALL articles from ALL categories
    if all_articles_by_category:
        # Generate global consolidated report
        report = []

        # Header
        total_articles = sum(len(articles) for articles in all_articles_by_category.values())
        all_sources = set()
        for articles in all_articles_by_category.values():
            for article in articles:
                all_sources.add(article["metadata"]["source"])

        report.append(f"# Intel Report - ALL CATEGORIES")
        report.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"**Run Date**: {run_date}")
        report.append(f"**Total Articles**: {total_articles}")
        report.append(f"**Total Categories**: {len(all_articles_by_category)}")
        report.append(f"**Sources**: {', '.join(sorted(all_sources))}")
        report.append("")
        report.append("---")
        report.append("")

        # Table of Contents by Category
        report.append("## TABLE OF CONTENTS")
        article_counter = 1
        for category in sorted(all_articles_by_category.keys()):
            articles = all_articles_by_category[category]
            report.append(f"\n### {category.upper().replace('_', ' ')} ({len(articles)} articles)")
            for article in sorted(articles, key=lambda x: x["metadata"].get("published_date", ""), reverse=True):
                title = article["metadata"]["title"]
                anchor = f"article-{article_counter}"
                report.append(f"{article_counter}. [{title}](#{anchor})")
                article_counter += 1

        report.append("")
        report.append("---")
        report.append("")

        # Articles organized by category
        article_counter = 1
        for category in sorted(all_articles_by_category.keys()):
            articles = all_articles_by_category[category]

            # Category header
            report.append(f"\n# {category.upper().replace('_', ' ')}")
            report.append(f"**Articles in this category**: {len(articles)}")
            report.append("")
            report.append("---")
            report.append("")

            # Sort articles by date (newest first)
            sorted_articles = sorted(articles, key=lambda x: x["metadata"].get("published_date", ""), reverse=True)

            for article in sorted_articles:
                metadata = article["metadata"]
                content = article["content"]

                report.append(f"## Article {article_counter}: {metadata['title']} {{#article-{article_counter}}}")
                report.append(f"**Category**: {category.upper().replace('_', ' ')}")
                report.append(f"**Original Publication**: {metadata['published_date']}")
                report.append(f"**Source**: [{metadata['source']}]({metadata['url']})")
                report.append(f"**Scraped**: {metadata['scraped_date']}")
                report.append("")
                report.append(content)
                report.append("")
                report.append("---")
                report.append("")

                article_counter += 1

        # Save 1 SINGLE consolidated report
        output_dir = PROJECT_ROOT / "data" / "processed" / run_date
        output_dir.mkdir(parents=True, exist_ok=True)

        datestamp = datetime.now().strftime("%Y_%m_%d_%Y%m%d")
        output_file = output_dir / f"{datestamp}.md"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(report))

        logger.info(f"✅ Consolidated report saved: {output_file}")
        logger.info(f"   Total articles: {total_articles} across {len(all_articles_by_category)} categories")

    logger.info(f"✅ Phase 2 complete: {results['stage_2b']['created']} articles processed")

    # PHASE 3: Run Stage 2C (Journal) ONLY if enabled
    if enable_journal:
        logger.info("Phase 3: Running Stage 2C (Bali Zero Journal)...")
        for category, files in files_by_category.items():
            for raw_file in files:
                await process_stage_2c(stage_2c, raw_file, category, results, run_date)

        logger.info(f"✅ Phase 3 complete: {results['stage_2c']['created']} blog posts created")
    else:
        logger.info("Phase 3: Skipped (Journal not enabled)")

    # Calculate duration
    duration = (datetime.now() - start_time).total_seconds()
    results["duration"] = duration

    logger.info(f"✅ Stage 2 sequential complete: {duration:.1f}s")
    logger.info(f"   2A RAG: {results['stage_2a']['processed']} processed, {results['stage_2a']['filtered']} filtered")
    logger.info(f"   2B Content: {results['stage_2b']['created']} articles created")
    logger.info(f"   2C Bali Zero Journal: {results['stage_2c']['created']} posts created")

    return results


async def process_stage_2a(processor: Stage2AProcessor, raw_file: Path, category: str, results: Dict):
    """Process single file for Stage 2A"""

    try:
        extracted = await processor.process_raw_file(raw_file, category)

        if extracted:
            # Store to ChromaDB
            await processor.store_to_chromadb(extracted, category)

            # Save JSON to disk
            rag_dir = raw_file.parent.parent / "rag"
            rag_dir.mkdir(parents=True, exist_ok=True)

            json_file = rag_dir / f"{raw_file.stem}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(extracted, f, indent=2, ensure_ascii=False)

            results["stage_2a"]["processed"] += 1
        else:
            results["stage_2a"]["filtered"] += 1

    except Exception as e:
        logger.error(f"Stage 2A error for {raw_file.name}: {e}")
        results["stage_2a"]["failed"] += 1


# Stage 2B processing is now handled inline in run_stage2_parallel
# as it creates consolidated reports per category


async def process_stage_2c(processor: Stage2CProcessor, raw_file: Path, category: str, results: Dict, run_date: str):
    """Process single file for Stage 2C (Bali Zero Journal)

    Args:
        processor: Stage2CProcessor instance
        raw_file: Path to raw markdown file
        category: Category name
        results: Results dictionary
        run_date: Date string in YYYY-MM-DD format
    """

    try:
        journal_post = await processor.create_journal_post(raw_file, category)

        if journal_post:
            # Save Bali Zero Journal post to dated directory: data/journal/YYYY-MM-DD/
            journal_dir = PROJECT_ROOT / "data" / "journal" / run_date
            journal_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            journal_file = journal_dir / f"{timestamp}_{category}_{raw_file.stem}.md"

            with open(journal_file, 'w', encoding='utf-8') as f:
                f.write(journal_post)

            results["stage_2c"]["created"] += 1
        else:
            results["stage_2c"]["failed"] += 1

    except Exception as e:
        logger.error(f"Stage 2C error for {raw_file.name}: {e}")
        results["stage_2c"]["failed"] += 1


if __name__ == "__main__":
    # Test run
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Stage 2 Intel Processor")
    parser.add_argument("raw_dir", nargs='?', help="Directory containing raw markdown files")
    parser.add_argument("--enable-journal", action="store_true", help="Enable Stage 2C Journal generation")
    parser.add_argument("--date", type=str, help="Run date in YYYY-MM-DD format (default: today)")

    args = parser.parse_args()

    if args.raw_dir:
        test_dir = Path(args.raw_dir)
        raw_files = list(test_dir.rglob("*.md"))

        run_date = args.date  # None if not specified (will use today)

        print(f"Testing with {len(raw_files)} files from {test_dir}")
        print(f"Journal generation: {'Enabled' if args.enable_journal else 'Disabled'}")
        print(f"Run date: {run_date or 'today'}")

        results = asyncio.run(run_stage2_parallel(raw_files, enable_journal=args.enable_journal, run_date=run_date))

        print(json.dumps(results, indent=2))
    else:
        print("Usage: python3 stage2_parallel_processor.py <raw_files_dir> [--enable-journal] [--date YYYY-MM-DD]")
        print("Example: python3 stage2_parallel_processor.py INTEL_SCRAPING/raw/")
        print("         python3 stage2_parallel_processor.py INTEL_SCRAPING/raw/ --enable-journal")
        print("         python3 stage2_parallel_processor.py INTEL_SCRAPING/raw/ --date 2025-10-25")
#!/usr/bin/env python3
"""
Journal Generator - Swiss-Watch Edition

Generates daily Bali Zero Journal using LLAMA (RunPod or Ollama fallback).
Includes all RunPod timeout fixes and quality improvements.

Features:
- Aggressive pre-filtering (TOP 100, ≥1000 words, ≤7 days)
- RunPod LLAMA 3.1 8B integration
- Ollama 3.2 local fallback
- Intelligent timeout handling
- Journal curation and formatting
- Statistics tracking
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
import requests

from INTEL_SCRAPING.core.models import Article, ArticleTier
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class JournalGenerator:
    """
    Journal Generator using LLAMA for intelligent curation.

    Workflow:
    1. Pre-filter articles aggressively (quality + recency)
    2. Limit to TOP 100 articles
    3. Send to RunPod LLAMA for curation
    4. Fallback to Ollama if RunPod fails
    5. Generate journal markdown
    """

    def __init__(
        self,
        runpod_endpoint: Optional[str] = None,
        runpod_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        output_dir: Optional[Path] = None
    ):
        """
        Initialize journal generator.

        Args:
            runpod_endpoint: RunPod endpoint URL
            runpod_api_key: RunPod API key
            ollama_base_url: Ollama base URL for fallback
            output_dir: Output directory for journals
        """
        self.runpod_endpoint = runpod_endpoint or settings.runpod.endpoint_url
        self.runpod_api_key = runpod_api_key or settings.runpod.api_key
        self.ollama_base_url = ollama_base_url or settings.ollama.base_url
        self.ollama_model = settings.ollama.model

        self.output_dir = output_dir or Path(settings.output.data_dir) / "journals"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Runpod configuration
        self.runpod_timeout = settings.runpod.timeout_minutes * 60  # Convert to seconds
        self.runpod_poll_interval = settings.runpod.poll_interval_seconds

        # Statistics
        self.stats = {
            'total_articles': 0,
            'filtered_articles': 0,
            'top_articles': 0,
            'runpod_used': False,
            'ollama_used': False,
            'journal_generated': False,
            'errors': []
        }

    def prefilter_articles(self, articles: List[Article]) -> List[Article]:
        """
        Aggressive pre-filtering to avoid RunPod timeout.

        Filters:
        1. Word count ≥ 1000 (quality threshold)
        2. Age ≤ 7 days (recency threshold)
        3. Valid tier and category

        Args:
            articles: List of Article objects

        Returns:
            Filtered list of quality articles
        """
        logger.info(f"Pre-filtering {len(articles)} articles...")

        cutoff_date = datetime.now() - timedelta(days=7)
        quality_articles = []

        for article in articles:
            # Filter by word count
            if article.word_count < 1000:
                continue

            # Filter by date
            if article.published_date < cutoff_date:
                continue

            quality_articles.append(article)

        logger.info(f"✅ Pre-filtered to {len(quality_articles)} quality articles (≥1000 words, ≤7 days)")

        return quality_articles

    def select_top_articles(self, articles: List[Article], max_articles: int = 100) -> List[Article]:
        """
        Select TOP N articles by tier and word count.

        Sorting priority:
        1. Tier (T1 > T2 > T3)
        2. Word count (longer = better detail)

        Args:
            articles: Filtered articles
            max_articles: Maximum number of articles to select

        Returns:
            Top N articles
        """
        # Sort by tier (T1 > T2 > T3) then word count
        tier_priority = {ArticleTier.T1: 3, ArticleTier.T2: 2, ArticleTier.T3: 1}

        sorted_articles = sorted(
            articles,
            key=lambda a: (tier_priority.get(a.tier, 0), a.word_count),
            reverse=True
        )

        top_articles = sorted_articles[:max_articles]

        logger.info(f"📊 Selected TOP {len(top_articles)} articles")

        return top_articles

    async def generate_journal_with_runpod(self, articles: List[Article]) -> Optional[Dict]:
        """
        Generate journal using RunPod LLAMA 3.1 8B.

        Args:
            articles: Top articles for curation

        Returns:
            Journal data dict or None on failure
        """
        logger.info(f"🚀 Sending {len(articles)} articles to RunPod LLAMA...")

        try:
            # Prepare articles data
            articles_data = []
            for article in articles:
                articles_data.append({
                    "title": article.title,
                    "category": article.category,
                    "source": article.source,
                    "content": article.content[:800],  # Reduced to 800 chars (RunPod fix)
                    "word_count": article.word_count,
                    "tier": article.tier.value,
                    "url": article.url,
                    "date": article.published_date.strftime("%Y-%m-%d")
                })

            # Create LLAMA prompt
            prompt = self._create_journal_prompt(articles_data)

            # Submit job to RunPod
            job_id = await self._submit_runpod_job(prompt)

            if not job_id:
                logger.error("Failed to submit RunPod job")
                return None

            # Poll for results (with timeout)
            result = await self._poll_runpod_results(job_id)

            if result:
                self.stats['runpod_used'] = True
                logger.info("✅ RunPod LLAMA journal generated successfully")
                return result

            logger.warning("RunPod job failed or timed out")
            return None

        except Exception as e:
            logger.error(f"RunPod journal generation failed: {e}")
            self.stats['errors'].append(f"runpod_error: {str(e)[:200]}")
            return None

    def _create_journal_prompt(self, articles_data: List[Dict]) -> str:
        """Create LLAMA prompt for journal curation"""
        prompt = f"""You are the Chief Editor of BALI ZERO JOURNAL, a daily magazine for business professionals in Indonesia.

Today you have {len(articles_data)} carefully pre-selected TOP QUALITY articles to curate into a beautiful daily magazine.

YOUR TASK:
1. Select the 3-5 MOST IMPORTANT stories for the COVER (front page)
   - For each, write a compelling headline and 2-sentence summary

2. Organize ALL articles into SECTIONS:
   - Business & Economy
   - Immigration & Visas
   - Real Estate & Property
   - Technology & Innovation
   - Lifestyle & Culture
   - Regulatory & Legal
   - Tax & Finance
   - Other News

3. For each article, assign an IMPORTANCE score (1-10)

4. Write a brief EDITORIAL NOTE (3-4 sentences) about today's key themes

FORMAT YOUR RESPONSE AS JSON:
{{
    "cover_stories": [
        {{"title": "...", "summary": "...", "importance": 10}}
    ],
    "sections": [
        {{
            "section_title": "Business & Economy",
            "articles": [
                {{"title": "...", "summary": "...", "importance": 9, "source": "..."}}
            ]
        }}
    ],
    "editorial_note": "..."
}}

Articles to curate:
{json.dumps(articles_data, indent=2)}

RESPOND WITH VALID JSON ONLY."""

        return prompt

    async def _submit_runpod_job(self, prompt: str) -> Optional[str]:
        """Submit job to RunPod"""
        try:
            headers = {
                "Authorization": f"Bearer {self.runpod_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "input": {
                    "prompt": prompt,
                    "max_tokens": 4096,
                    "temperature": 0.7
                }
            }

            response = requests.post(
                f"{self.runpod_endpoint}/run",
                json=payload,
                headers=headers,
                timeout=30
            )

            response.raise_for_status()
            job_data = response.json()

            job_id = job_data.get("id")
            logger.info(f"✅ RunPod job submitted: {job_id}")

            return job_id

        except Exception as e:
            logger.error(f"Failed to submit RunPod job: {e}")
            return None

    async def _poll_runpod_results(self, job_id: str) -> Optional[Dict]:
        """Poll RunPod for job results with timeout"""
        try:
            headers = {
                "Authorization": f"Bearer {self.runpod_api_key}"
            }

            start_time = time.time()

            while (time.time() - start_time) < self.runpod_timeout:
                response = requests.get(
                    f"{self.runpod_endpoint}/status/{job_id}",
                    headers=headers,
                    timeout=10
                )

                if response.status_code == 404:
                    logger.error("RunPod job cancelled (404) - likely timeout on their end")
                    return None

                response.raise_for_status()
                status_data = response.json()

                status = status_data.get("status")

                if status == "COMPLETED":
                    output = status_data.get("output")
                    try:
                        journal_data = json.loads(output)
                        return journal_data
                    except json.JSONDecodeError:
                        logger.error("Invalid JSON from RunPod")
                        return None

                elif status == "FAILED":
                    logger.error("RunPod job failed")
                    return None

                # Still processing, wait and retry
                await asyncio.sleep(self.runpod_poll_interval)

            logger.warning(f"RunPod job timed out after {self.runpod_timeout}s")
            return None

        except Exception as e:
            logger.error(f"Error polling RunPod: {e}")
            return None

    async def generate_journal_with_ollama(self, articles: List[Article]) -> Optional[Dict]:
        """
        Generate journal using Ollama (local fallback).

        Args:
            articles: Top articles for curation

        Returns:
            Journal data dict or None on failure
        """
        logger.info(f"🦙 Falling back to Ollama ({self.ollama_model})...")

        try:
            # Prepare articles (smaller subset for local model)
            articles_data = []
            for article in articles[:50]:  # Limit to 50 for Ollama
                articles_data.append({
                    "title": article.title,
                    "category": article.category,
                    "source": article.source,
                    "content": article.content[:400],  # Even smaller for Ollama
                    "tier": article.tier.value
                })

            prompt = self._create_journal_prompt(articles_data)

            # Call Ollama API
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.ollama_model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=300  # 5 min timeout
            )

            response.raise_for_status()
            result = response.json()

            output_text = result.get("response", "")

            # Try to parse JSON
            try:
                journal_data = json.loads(output_text)
                self.stats['ollama_used'] = True
                logger.info("✅ Ollama journal generated successfully")
                return journal_data
            except json.JSONDecodeError:
                logger.warning("Ollama returned invalid JSON, using fallback format")
                return self._create_fallback_journal(articles)

        except Exception as e:
            logger.error(f"Ollama journal generation failed: {e}")
            self.stats['errors'].append(f"ollama_error: {str(e)[:200]}")
            return self._create_fallback_journal(articles)

    def _create_fallback_journal(self, articles: List[Article]) -> Dict:
        """Create simple fallback journal when both LLAMA methods fail"""
        logger.info("Using fallback journal format")

        # Group articles by category
        categories = {}
        for article in articles[:30]:  # Top 30
            if article.category not in categories:
                categories[article.category] = []
            categories[article.category].append(article)

        # Create simple structure
        journal_data = {
            "cover_stories": [
                {
                    "title": articles[0].title if articles else "No articles today",
                    "summary": articles[0].content[:200] if articles else "",
                    "importance": 10
                }
            ],
            "sections": [],
            "editorial_note": f"Daily intelligence report with {len(articles)} articles from Bali/Indonesia business sources."
        }

        # Add sections
        for category, category_articles in categories.items():
            journal_data["sections"].append({
                "section_title": category.replace('_', ' ').title(),
                "articles": [
                    {
                        "title": a.title,
                        "summary": a.content[:150],
                        "importance": 5,
                        "source": a.source
                    }
                    for a in category_articles[:5]
                ]
            })

        return journal_data

    def format_journal_markdown(self, journal_data: Dict, articles: List[Article]) -> str:
        """Format journal data as beautiful markdown"""
        timestamp = datetime.now().strftime("%Y-%m-%d")

        markdown = f"""# BALI ZERO JOURNAL
## {timestamp}

**Generated**: {datetime.now().strftime("%Y-%m-%d %H:%M")}
**Articles Curated**: {len(articles)}

---

## Editorial Note

{journal_data.get('editorial_note', 'Daily intelligence briefing')}

---

## Cover Stories

"""

        # Add cover stories
        for story in journal_data.get('cover_stories', [])[:3]:
            markdown += f"""### {story.get('title', 'Untitled')}

{story.get('summary', 'No summary')}

**Importance**: {'★' * min(story.get('importance', 5), 10)}

---

"""

        # Add sections
        for section in journal_data.get('sections', []):
            markdown += f"""## {section.get('section_title', 'Section')}

"""
            for article in section.get('articles', [])[:10]:
                markdown += f"""### {article.get('title', 'Untitled')}

{article.get('summary', 'No summary')}

**Source**: {article.get('source', 'Unknown')} | **Importance**: {article.get('importance', 5)}/10

---

"""

        markdown += f"""
---

*Generated by ZANTARA Intel System - Bali Zero Journal*
*{len(articles)} articles curated from {len(set(a.source for a in articles))} sources*
"""

        return markdown

    async def generate_journal(self, articles: List[Article]) -> Optional[Path]:
        """
        Generate complete journal from articles.

        Workflow:
        1. Pre-filter articles
        2. Select TOP articles
        3. Try RunPod LLAMA
        4. Fallback to Ollama if needed
        5. Format and save journal

        Args:
            articles: List of Article objects

        Returns:
            Path to generated journal or None on failure
        """
        logger.info("=" * 80)
        logger.info("BALI ZERO JOURNAL GENERATOR")
        logger.info("=" * 80)

        self.stats['total_articles'] = len(articles)

        # Step 1: Pre-filter
        filtered_articles = self.prefilter_articles(articles)
        self.stats['filtered_articles'] = len(filtered_articles)

        if not filtered_articles:
            logger.error("No articles passed pre-filtering")
            return None

        # Step 2: Select TOP articles
        top_articles = self.select_top_articles(filtered_articles, max_articles=100)
        self.stats['top_articles'] = len(top_articles)

        # Step 3: Try RunPod first
        journal_data = await self.generate_journal_with_runpod(top_articles)

        # Step 4: Fallback to Ollama if RunPod failed
        if not journal_data:
            logger.info("RunPod failed, trying Ollama fallback...")
            journal_data = await self.generate_journal_with_ollama(top_articles)

        if not journal_data:
            logger.error("Both RunPod and Ollama failed")
            return None

        # Step 5: Format and save
        markdown = self.format_journal_markdown(journal_data, top_articles)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        journal_filename = f"bali_zero_journal_{timestamp}.md"
        journal_path = self.output_dir / journal_filename

        with open(journal_path, 'w', encoding='utf-8') as f:
            f.write(markdown)

        self.stats['journal_generated'] = True
        logger.info(f"✅ Journal saved: {journal_path}")

        return journal_path

    def get_stats(self) -> Dict[str, Any]:
        """Get generation statistics"""
        return self.stats.copy()


if __name__ == "__main__":
    # Test journal generator
    from datetime import datetime, timedelta

    print("=" * 60)
    print("Testing Journal Generator")
    print("=" * 60)

    # Create test articles
    test_articles = []
    for i in range(10):
        test_articles.append(
            Article(
                url=f"https://example.com/article{i}",
                title=f"Test Article {i}: Business News",
                content=f"This is test article {i} with important business news. " * 200,
                published_date=datetime.now() - timedelta(hours=i*6),
                source=f"Test Source {i % 3}",
                category="business_setup",
                word_count=1200,
                tier=ArticleTier.T1 if i < 3 else ArticleTier.T2
            )
        )

    print(f"\n📝 Test Articles: {len(test_articles)}")

    # Create generator (no API keys - will use fallback)
    generator = JournalGenerator(
        runpod_api_key="test_key",  # Dummy key
        runpod_endpoint="http://localhost:8000"  # Dummy endpoint
    )

    print(f"\n🔧 Configuration:")
    print(f"   Output Dir: {generator.output_dir}")
    print(f"   RunPod Timeout: {generator.runpod_timeout}s")

    print(f"\n🚀 Starting journal generation...")
    print(f"   (Will use fallback since no real API keys)")

    try:
        journal_path = asyncio.run(generator.generate_journal(test_articles))

        stats = generator.get_stats()
        print(f"\n✅ Results:")
        print(f"   Total articles: {stats['total_articles']}")
        print(f"   Filtered: {stats['filtered_articles']}")
        print(f"   Top selected: {stats['top_articles']}")
        print(f"   RunPod used: {stats['runpod_used']}")
        print(f"   Ollama used: {stats['ollama_used']}")
        print(f"   Journal generated: {stats['journal_generated']}")

        if journal_path:
            print(f"\n📄 Journal saved to:")
            print(f"   {journal_path}")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

    print("=" * 60)

#!/usr/bin/env python3
"""
Intel Scraper V2 — Integrated with Admiralty Code, Circuit Breaker, and Exponential Backoff
"""

import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import hashlib
from urllib.parse import urlparse

# Import our optimizations
from admiralty_source_validator import assess_source_reliability, should_scrape_source
from resilient_scraper import scrape_with_retry, batch_scrape_with_retry
from circuit_breaker import DomainCircuitBreakers, CircuitBreakerConfig

try:
    from crawl4ai import AsyncWebCrawler, CacheMode
except ImportError:
    print("Installing crawl4ai...")
    import os
    os.system("pip install crawl4ai")
    from crawl4ai import AsyncWebCrawler, CacheMode

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
CONFIG_FILE = Path(__file__).parent.parent / "config" / "categories_v2.json"
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"


class IntelScraperV2:
    """Enhanced scraper with quality filters and resilience"""

    def __init__(self):
        self.config = self.load_config()
        self.base_dir = BASE_DIR
        self.cache_file = self.base_dir / "scraper_cache.json"
        self.seen_urls = self.load_cache()

        # Initialize circuit breakers
        circuit_config = CircuitBreakerConfig(
            failure_threshold=5,
            recovery_timeout=300,  # 5 minutes
            success_threshold=2
        )
        self.circuit_breakers = DomainCircuitBreakers(circuit_config)

        # Stats
        self.stats = {
            'total_urls': 0,
            'admiralty_rejected': 0,
            'circuit_breaker_blocked': 0,
            'scraped_successfully': 0,
            'failed': 0
        }

    def load_config(self) -> Dict:
        """Load categories configuration"""
        with open(CONFIG_FILE) as f:
            return json.load(f)

    def load_cache(self) -> set:
        """Load seen URLs from cache"""
        if self.cache_file.exists():
            with open(self.cache_file, 'r') as f:
                return set(json.load(f))
        return set()

    def save_cache(self):
        """Save seen URLs to cache"""
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_file, 'w') as f:
            json.dump(list(self.seen_urls), f)

    def get_content_hash(self, content: str) -> str:
        """Generate hash for content deduplication"""
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    async def scrape_url_with_validations(
        self,
        url: str,
        category_config: Dict,
        source_info: Dict
    ) -> Optional[Dict]:
        """
        Scrape URL with full validation pipeline:
        1. Admiralty Code validation
        2. Circuit breaker check
        3. Exponential backoff retry
        4. Quality filtering
        """

        category_id = category_config['id']
        self.stats['total_urls'] += 1

        # Check cache
        if url in self.seen_urls:
            logger.info(f"[{category_id}] Skipping cached: {url}")
            return None

        # Step 1: Admiralty Code validation
        should_scrape, reason = should_scrape_source(url)
        if not should_scrape:
            logger.warning(f"[{category_id}] ❌ Admiralty rejected: {url} - {reason}")
            self.stats['admiralty_rejected'] += 1
            return None

        assessment = assess_source_reliability(url)
        logger.info(
            f"[{category_id}] ✓ Admiralty approved: {url} "
            f"(Tier {assessment['reliability']}) - {assessment['rationale']}"
        )

        # Step 2: Circuit breaker check + Step 3: Exponential backoff
        domain = urlparse(url).netloc

        try:
            # Scrape with circuit breaker + retry
            async def crawl4ai_scraper(url: str) -> Dict:
                """Wrapper for crawl4ai"""
                async with AsyncWebCrawler(headless=True, verbose=False) as crawler:
                    result = await crawler.arun(
                        url=url,
                        cache_mode=CacheMode.BYPASS,
                        word_count_threshold=category_config['quality_thresholds']['min_word_count'],
                        exclude_external_links=True,
                        remove_overlay=True,
                        screenshot=False
                    )

                    if not result.success or not result.markdown:
                        raise ValueError(f"Crawl4ai failed for {url}")

                    return {
                        'url': url,
                        'markdown': result.markdown,
                        'metadata': result.metadata or {},
                        'success': True
                    }

            # Use circuit breaker + exponential backoff
            scrape_result = await self.circuit_breakers.call(
                domain,
                scrape_with_retry,
                url,
                crawl4ai_scraper
            )

            if not scrape_result:
                self.stats['failed'] += 1
                return None

        except Exception as e:
            logger.error(f"[{category_id}] ❌ Scraping failed: {url} - {e}")
            self.stats['failed'] += 1
            return None

        # Step 4: Quality filtering
        word_count = len(scrape_result['markdown'].split())
        min_words = category_config['quality_thresholds']['min_word_count']

        if word_count < min_words:
            logger.warning(
                f"[{category_id}] ⚠️  Content too short: {url} "
                f"({word_count} words, min {min_words})"
            )
            return None

        # Create document
        metadata = scrape_result['metadata']

        doc = {
            "url": url,
            "source_name": source_info.get('name', domain),
            "source_tier": source_info.get('tier', 2),
            "admiralty_rating": assessment['reliability'],
            "admiralty_rationale": assessment['rationale'],
            "category": category_id,
            "title": metadata.get('title', ''),
            "description": metadata.get('description', ''),
            "content": scrape_result['markdown'],
            "content_hash": self.get_content_hash(scrape_result['markdown']),
            "word_count": word_count,
            "scraped_at": datetime.now().isoformat(),
            "language": metadata.get('language', 'en'),
        }

        # Mark as seen
        self.seen_urls.add(url)
        self.stats['scraped_successfully'] += 1

        logger.info(
            f"[{category_id}] ✅ Scraped: {source_info.get('name')} "
            f"({word_count} words, Tier {assessment['reliability']})"
        )

        return doc

    async def scrape_category(self, category_config: Dict) -> List[Dict]:
        """Scrape all sources in a category"""

        category_id = category_config['id']

        # Check if enabled
        if not category_config.get('enabled', True):
            logger.info(f"[{category_id}] ⊗ Category disabled, skipping")
            return []

        logger.info(f"\n{'='*70}")
        logger.info(f"Starting category: {category_id}")
        logger.info(f"Priority: {category_config['priority']}")
        logger.info(f"Sources: {len(category_config['sources'])}")
        logger.info(f"Min word count: {category_config['quality_thresholds']['min_word_count']}")
        logger.info(f"Min Tier 1 %: {category_config['quality_thresholds']['min_tier_1_percentage']}%")
        logger.info(f"{'='*70}\n")

        documents = []

        for i, source in enumerate(category_config['sources'], 1):
            logger.info(f"\n[{i}/{len(category_config['sources'])}] Processing: {source['name']}")

            doc = await self.scrape_url_with_validations(
                source['url'],
                category_config,
                source
            )

            if doc:
                documents.append(doc)
                self.save_document(doc, category_id)

            # Rate limiting
            await asyncio.sleep(2)

        # Category summary
        logger.info(f"\n{'='*70}")
        logger.info(f"Category {category_id} complete:")
        logger.info(f"  Scraped: {len(documents)} documents")

        # Check tier ratio
        tier_1_count = sum(1 for d in documents if d['source_tier'] == 1)
        tier_1_pct = (tier_1_count / len(documents) * 100) if documents else 0
        min_tier_1 = category_config['quality_thresholds']['min_tier_1_percentage']

        if tier_1_pct < min_tier_1:
            logger.warning(
                f"  ⚠️  Tier 1 ratio LOW: {tier_1_pct:.1f}% "
                f"(target: {min_tier_1}%)"
            )
        else:
            logger.info(f"  ✓ Tier 1 ratio: {tier_1_pct:.1f}% (target: {min_tier_1}%)")

        logger.info(f"{'='*70}\n")

        return documents

    def save_document(self, doc: Dict, category: str):
        """Save scraped document to file system"""

        # Create directory
        output_dir = self.base_dir / category / "raw"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        source_slug = doc['source_name'].lower().replace(' ', '_').replace('/', '_')
        filename = f"{timestamp}_{source_slug}_{doc['content_hash'][:8]}.json"

        # Save JSON
        filepath = output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)

        # Save Markdown
        md_filepath = filepath.with_suffix('.md')
        with open(md_filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {doc['title']}\n\n")
            f.write(f"**Source**: {doc['source_name']} (Tier {doc['source_tier']})\n")
            f.write(f"**Admiralty**: {doc['admiralty_rating']} - {doc['admiralty_rationale']}\n")
            f.write(f"**URL**: {doc['url']}\n")
            f.write(f"**Category**: {doc['category']}\n")
            f.write(f"**Scraped**: {doc['scraped_at']}\n")
            f.write(f"**Word Count**: {doc['word_count']}\n\n")
            f.write("---\n\n")
            f.write(doc['content'])

    async def scrape_categories(self, category_ids: Optional[List[str]] = None):
        """Scrape multiple categories"""

        categories = self.config['categories']

        # Filter categories if specified
        if category_ids:
            categories = [c for c in categories if c['id'] in category_ids]

        logger.info("\n" + "="*80)
        logger.info("INTEL SCRAPER V2 — Starting")
        logger.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"Categories: {len(categories)}")
        logger.info("="*80 + "\n")

        total_docs = 0

        for category in categories:
            docs = await self.scrape_category(category)
            total_docs += len(docs)

        # Save cache
        self.save_cache()

        # Final stats
        logger.info("\n" + "="*80)
        logger.info("SCRAPING COMPLETE — Final Statistics")
        logger.info("="*80)
        logger.info(f"Total URLs processed: {self.stats['total_urls']}")
        logger.info(f"Admiralty rejected: {self.stats['admiralty_rejected']}")
        logger.info(f"Circuit breaker blocked: {self.stats['circuit_breaker_blocked']}")
        logger.info(f"Scraped successfully: {self.stats['scraped_successfully']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"Total documents saved: {total_docs}")

        success_rate = (
            self.stats['scraped_successfully'] / self.stats['total_urls'] * 100
            if self.stats['total_urls'] > 0 else 0
        )
        logger.info(f"Success rate: {success_rate:.1f}%")

        # Circuit breaker summary
        logger.info("\nCircuit Breaker Status:")
        cb_summary = self.circuit_breakers.get_summary()
        logger.info(f"  Domains monitored: {cb_summary['total_domains']}")
        logger.info(f"  Open circuits: {cb_summary['open_circuits']}")
        logger.info(f"  Half-open circuits: {cb_summary['half_open_circuits']}")
        logger.info(f"  Closed circuits: {cb_summary['closed_circuits']}")

        logger.info("\n" + "="*80)
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("="*80 + "\n")


async def main():
    """Main entry point"""
    import sys

    scraper = IntelScraperV2()

    # Parse arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--test':
            # Test mode: scrape only CRITICAL categories
            critical_cats = [
                'regulatory_changes',
                'visa_immigration',
                'tax_compliance'
            ]
            logger.info("🧪 TEST MODE: Scraping CRITICAL categories only")
            await scraper.scrape_categories(critical_cats)
        elif sys.argv[1] == '--category':
            # Scrape specific category
            category_id = sys.argv[2] if len(sys.argv) > 2 else None
            if category_id:
                logger.info(f"🎯 Scraping single category: {category_id}")
                await scraper.scrape_categories([category_id])
            else:
                logger.error("Error: --category requires category_id")
        else:
            logger.error(f"Unknown option: {sys.argv[1]}")
            logger.info("Usage:")
            logger.info("  python intel_scraper_v2.py           # Scrape all categories")
            logger.info("  python intel_scraper_v2.py --test    # Test mode (CRITICAL only)")
            logger.info("  python intel_scraper_v2.py --category <id>  # Scrape specific category")
    else:
        # Scrape all enabled categories
        await scraper.scrape_categories()


if __name__ == "__main__":
    asyncio.run(main())

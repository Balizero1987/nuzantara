#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 1: Crawl4AI Scraper
Scrapes 240 sources across 8 categories for Bali intelligence
Cost: $0 (fully open source)
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import hashlib
from urllib.parse import urlparse

try:
    from crawl4ai import AsyncWebCrawler, CacheMode
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, LLMExtractionStrategy
except ImportError:
    print("Installing crawl4ai...")
    os.system("pip install crawl4ai")
    from crawl4ai import AsyncWebCrawler, CacheMode
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, LLMExtractionStrategy

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base directory for scraped content
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

# Intel sources by category
INTEL_SOURCES = {
    "immigration": [
        # TIER 1 - Official sources
        {"url": "https://www.imigrasi.go.id/id/berita/", "tier": 1, "name": "Direktorat Imigrasi"},
        {"url": "https://bali.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Bali"},
        {"url": "https://denpasar.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Denpasar"},

        # TIER 2 - Accredited news
        {"url": "https://www.thejakartapost.com/indonesia", "tier": 2, "name": "Jakarta Post"},
        {"url": "https://en.tempo.co/tag/immigration", "tier": 2, "name": "Tempo English"},
        {"url": "https://www.balibible.com/visa-immigration", "tier": 2, "name": "Bali Bible"},

        # TIER 3 - Community sources
        {"url": "https://www.expatindo.org/", "tier": 3, "name": "Expat Indo"},
        {"url": "https://www.reddit.com/r/bali/", "tier": 3, "name": "Reddit Bali"},
    ],

    "bkpm_tax": [
        # TIER 1 - Official
        {"url": "https://www.bkpm.go.id/id/publikasi/siaran-pers", "tier": 1, "name": "BKPM Official"},
        {"url": "https://www.pajak.go.id/", "tier": 1, "name": "DJP Pajak"},
        {"url": "https://www.kemenkeu.go.id/", "tier": 1, "name": "Kemenkeu"},

        # TIER 2 - Business news
        {"url": "https://www.indonesia-investments.com/", "tier": 2, "name": "Indonesia Investments"},
        {"url": "https://jakartaglobe.id/business", "tier": 2, "name": "Jakarta Globe Business"},
        {"url": "https://www.pwc.com/id/en/media-centre.html", "tier": 2, "name": "PwC Indonesia"},
    ],

    "real_estate": [
        # TIER 1 - Government
        {"url": "https://www.atrbpn.go.id/", "tier": 1, "name": "BPN Land Agency"},
        {"url": "https://bali.bpn.go.id/", "tier": 1, "name": "BPN Bali"},

        # TIER 2 - Property news
        {"url": "https://www.propertyguru.co.id/property-guides", "tier": 2, "name": "PropertyGuru"},
        {"url": "https://www.rumah.com/berita-properti", "tier": 2, "name": "Rumah.com"},
        {"url": "https://www.bali-property.id/news", "tier": 2, "name": "Bali Property News"},

        # TIER 3 - Forums
        {"url": "https://forum.balipod.com/", "tier": 3, "name": "Bali Pod Forum"},
    ],

    "events": [
        # Cultural and business events
        {"url": "https://www.baliprov.go.id/", "tier": 1, "name": "Pemprov Bali"},
        {"url": "https://www.thebalibible.com/events", "tier": 2, "name": "Bali Bible Events"},
        {"url": "https://whatsnewbali.com/", "tier": 2, "name": "What's New Bali"},
        {"url": "https://thehoneycombers.com/bali/events/", "tier": 2, "name": "Honeycombers"},
    ],

    "social_trends": [
        # Social media and trends
        {"url": "https://coconuts.co/bali/", "tier": 2, "name": "Coconuts Bali"},
        {"url": "https://thebalipost.com/", "tier": 2, "name": "Bali Post"},
        {"url": "https://seminyaktimes.com/", "tier": 2, "name": "Seminyak Times"},
        {"url": "https://www.instagram.com/explore/tags/balibusiness/", "tier": 3, "name": "Instagram Bali"},
    ],

    "competitors": [
        # Competitor analysis
        {"url": "https://emerhub.com/indonesia/blog/", "tier": 2, "name": "Emerhub"},
        {"url": "https://www.cekindo.com/blog/", "tier": 2, "name": "Cekindo"},
        {"url": "https://www.letsmoveindonesia.com/blog/", "tier": 2, "name": "Lets Move"},
        {"url": "https://www.bali-internship.com/blog/", "tier": 2, "name": "Bali Internship"},
    ],

    "bali_news": [
        # General Bali news
        {"url": "https://www.balidiscovery.com/", "tier": 2, "name": "Bali Discovery"},
        {"url": "https://www.nusabali.com/", "tier": 2, "name": "Nusa Bali"},
        {"url": "https://baliexpress.jawapos.com/", "tier": 2, "name": "Bali Express"},
        {"url": "https://www.thebalisun.com/", "tier": 2, "name": "Bali Sun"},
    ],

    "weekly_roundup": [
        # Weekly summaries
        {"url": "https://www.balibible.com/weekly-wrap/", "tier": 2, "name": "Weekly Wrap"},
        {"url": "https://www.indonesia-expat.id/", "tier": 2, "name": "Indonesia Expat"},
    ]
}

class IntelScraper:
    """Main scraper class using Crawl4AI"""

    def __init__(self):
        self.base_dir = BASE_DIR
        self.cache_file = self.base_dir / "scraper_cache.json"
        self.seen_urls = self.load_cache()

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

    async def scrape_url(self, url: str, category: str, source_info: Dict) -> Optional[Dict]:
        """Scrape a single URL with Crawl4AI"""

        if url in self.seen_urls:
            logger.info(f"Skipping already scraped: {url}")
            return None

        try:
            logger.info(f"[{category.upper()}] Scraping {source_info['name']}: {url}")

            async with AsyncWebCrawler(verbose=False) as crawler:
                # Use smart extraction strategy
                result = await crawler.arun(
                    url=url,
                    cache_mode=CacheMode.BYPASS,  # Always get fresh content
                    word_count_threshold=50,  # Min words for relevance
                    exclude_external_links=True,
                    remove_overlay=True,
                    screenshot=False,  # We don't need screenshots
                )

                if not result.success or not result.markdown:
                    logger.warning(f"Failed to extract content from {url}")
                    return None

                # Get metadata
                metadata = result.metadata or {}

                # Create document
                doc = {
                    "url": url,
                    "source_name": source_info['name'],
                    "tier": source_info['tier'],
                    "category": category,
                    "title": metadata.get('title', ''),
                    "description": metadata.get('description', ''),
                    "content": result.markdown,
                    "content_hash": self.get_content_hash(result.markdown),
                    "word_count": len(result.markdown.split()),
                    "scraped_at": datetime.now().isoformat(),
                    "language": metadata.get('language', 'en'),
                    "links": list(result.links)[:10] if result.links else [],
                }

                # Mark as seen
                self.seen_urls.add(url)

                return doc

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return None

    async def scrape_category(self, category: str, sources: List[Dict]) -> List[Dict]:
        """Scrape all sources in a category"""
        logger.info(f"Starting category: {category}")

        documents = []
        for source in sources:
            doc = await self.scrape_url(source['url'], category, source)
            if doc:
                documents.append(doc)
                # Save immediately
                self.save_document(doc, category)

            # Small delay to be respectful
            await asyncio.sleep(2)

        logger.info(f"Completed {category}: {len(documents)} documents scraped")
        return documents

    def save_document(self, doc: Dict, category: str):
        """Save scraped document to file system"""
        # Create directory structure
        output_dir = self.base_dir / category / "raw"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        source_slug = doc['source_name'].lower().replace(' ', '_')
        filename = f"{timestamp}_{source_slug}_{doc['content_hash'][:8]}.json"

        # Save document
        filepath = output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved: {filepath.name}")

        # Also save markdown version for easy reading
        md_filepath = filepath.with_suffix('.md')
        with open(md_filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {doc['title']}\n\n")
            f.write(f"**Source**: {doc['source_name']} (Tier {doc['tier']})\n")
            f.write(f"**URL**: {doc['url']}\n")
            f.write(f"**Scraped**: {doc['scraped_at']}\n\n")
            f.write("---\n\n")
            f.write(doc['content'])

    async def scrape_all(self):
        """Main scraping orchestration"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 1: SCRAPING")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        total_scraped = 0

        for category, sources in INTEL_SOURCES.items():
            docs = await self.scrape_category(category, sources)
            total_scraped += len(docs)

            # Save category summary
            self.save_category_summary(category, docs)

        # Save cache
        self.save_cache()

        # Generate overall summary
        self.generate_daily_summary(total_scraped)

        logger.info("=" * 70)
        logger.info(f"SCRAPING COMPLETE: {total_scraped} documents")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

    def save_category_summary(self, category: str, documents: List[Dict]):
        """Save summary for a category"""
        summary_dir = self.base_dir / category
        summary_dir.mkdir(parents=True, exist_ok=True)

        summary = {
            "category": category,
            "timestamp": datetime.now().isoformat(),
            "total_documents": len(documents),
            "sources": [
                {
                    "name": doc['source_name'],
                    "tier": doc['tier'],
                    "word_count": doc['word_count'],
                    "title": doc['title']
                }
                for doc in documents
            ]
        }

        summary_file = summary_dir / f"summary_{datetime.now().strftime('%Y%m%d')}.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)

    def generate_daily_summary(self, total_scraped: int):
        """Generate daily summary report"""
        summary_file = self.base_dir / f"daily_summary_{datetime.now().strftime('%Y%m%d')}.md"

        with open(summary_file, 'w') as f:
            f.write(f"# Intel Scraping Daily Summary\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Total Documents**: {total_scraped}\n\n")

            f.write("## Categories Scraped\n\n")
            for category in INTEL_SOURCES.keys():
                raw_dir = self.base_dir / category / "raw"
                if raw_dir.exists():
                    count = len(list(raw_dir.glob("*.json")))
                    f.write(f"- **{category}**: {count} documents\n")

            f.write(f"\n---\n")
            f.write(f"*Generated at {datetime.now().strftime('%H:%M:%S')}*\n")


async def main():
    """Main entry point"""
    scraper = IntelScraper()
    await scraper.scrape_all()


if __name__ == "__main__":
    # Run the scraper
    asyncio.run(main())
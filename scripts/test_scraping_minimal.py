#!/usr/bin/env python3
"""
Minimal test for scraping functionality
"""

import asyncio
from crawl4ai import AsyncWebCrawler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_single_url():
    """Test scraping a single URL"""

    test_url = "https://www.thejakartapost.com/indonesia"

    logger.info(f"Testing scrape of: {test_url}")

    try:
        async with AsyncWebCrawler(verbose=True) as crawler:
            result = await crawler.arun(
                url=test_url,
                word_count_threshold=10,
                screenshot=False
            )

            if result.success:
                logger.info(f"✅ Success! Scraped {len(result.markdown)} characters")
                logger.info(f"Title: {result.metadata.get('title', 'No title')}")
                logger.info(f"First 200 chars: {result.markdown[:200]}...")
                return True
            else:
                logger.error(f"❌ Failed to scrape: {result.error}")
                return False

    except Exception as e:
        logger.error(f"❌ Error: {e}")
        return False

async def main():
    logger.info("=" * 60)
    logger.info("MINIMAL SCRAPING TEST")
    logger.info("=" * 60)

    success = await test_single_url()

    if success:
        logger.info("\n✅ Scraping is working! Ready to run full pipeline.")
    else:
        logger.info("\n❌ Scraping needs troubleshooting.")

if __name__ == "__main__":
    asyncio.run(main())
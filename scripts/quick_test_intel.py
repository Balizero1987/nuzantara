#!/usr/bin/env python3
"""
Quick test of Intel Automation System
Tests scraping + LLAMA processing on 2 sources only
"""

import asyncio
import json
from pathlib import Path
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from crawl4ai_scraper import IntelScraper
from llama_rag_processor import LlamaRAGProcessor
from llama_content_creator import LlamaContentCreator

async def quick_test():
    """Run quick test with limited sources"""

    logger.info("=" * 70)
    logger.info("INTEL AUTOMATION - QUICK TEST (2 sources)")
    logger.info("=" * 70)

    # Stage 1: Scraping (limited sources)
    logger.info("\n🕷️  STAGE 1: Scraping 2 test sources...")

    scraper = IntelScraper()

    # Override to test only 2 working sources
    import crawl4ai_scraper
    crawl4ai_scraper.INTEL_SOURCES = {
        "test_category": [
            {"url": "https://www.thejakartapost.com/indonesia", "tier": 2, "name": "Jakarta Post"},
            {"url": "https://coconuts.co/bali/", "tier": 2, "name": "Coconuts Bali"}
        ]
    }

    await scraper.scrape_all()

    # Check if we got any content
    base_dir = Path(__file__).parent.parent / "INTEL_SCRAPING"
    scraped_files = list(base_dir.glob("**/raw/*.json"))

    if not scraped_files:
        logger.error("❌ No content scraped. Check sources.")
        return False

    logger.info(f"✅ Scraped {len(scraped_files)} documents")

    # Stage 2A: RAG Processing
    logger.info("\n🤖 STAGE 2A: RAG Processing with LLAMA 3.2...")

    try:
        processor = LlamaRAGProcessor()
        processor.process_all()

        # Check results
        rag_files = list(base_dir.glob("**/rag/*.json"))
        logger.info(f"✅ Processed {len(rag_files)} documents for RAG")

    except Exception as e:
        logger.error(f"RAG processing error: {e}")
        return False

    # Stage 2B: Content Creation
    logger.info("\n📝 STAGE 2B: Content Creation with LLAMA 3.2...")

    try:
        creator = LlamaContentCreator()
        creator.process_all()

        # Check results
        article_files = list(base_dir.glob("**/articles/*.json"))
        logger.info(f"✅ Created {len(article_files)} articles")

        # Show sample article
        if article_files:
            with open(article_files[0], 'r') as f:
                sample = json.load(f)
                logger.info(f"\n📄 Sample Article:")
                logger.info(f"   Title: {sample['title'][:60]}...")
                logger.info(f"   Words: {sample['word_count']}")
                logger.info(f"   Category: {sample['category']}")

    except Exception as e:
        logger.error(f"Content creation error: {e}")
        return False

    logger.info("\n" + "=" * 70)
    logger.info("✅ QUICK TEST COMPLETE - All stages working!")
    logger.info("=" * 70)
    logger.info("\nNext steps:")
    logger.info("  1. Set ANTHROPIC_API_KEY for editorial review")
    logger.info("  2. Run full pipeline: python run_intel_automation.py")
    logger.info("  3. Configure social media APIs for publishing")

    return True

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    sys.exit(0 if success else 1)
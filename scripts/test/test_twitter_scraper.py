#!/usr/bin/env python3
"""
Test Twitter Intel Scraper
Quick test to verify Twitter scraping is working
"""

import sys
import logging
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from twitter_intel_scraper import (
    scrape_twitter_account,
    scrape_twitter_hashtag,
    scrape_category_twitter
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_account_scraping():
    """Test scraping a single Twitter account"""
    logger.info("=" * 60)
    logger.info("TEST 1: Scraping Single Account")
    logger.info("=" * 60)
    
    tweets = scrape_twitter_account("imigrasi_ri", max_tweets=10, since_days=30)
    
    logger.info(f"✅ Scraped {len(tweets)} tweets from @imigrasi_ri")
    if tweets:
        logger.info(f"Sample tweet: {tweets[0]['text'][:100]}...")
    
    return len(tweets) > 0

def test_hashtag_scraping():
    """Test scraping by hashtag"""
    logger.info("=" * 60)
    logger.info("TEST 2: Scraping Hashtag")
    logger.info("=" * 60)
    
    tweets = scrape_twitter_hashtag("#Bali", max_tweets=10, since_days=7)
    
    logger.info(f"✅ Scraped {len(tweets)} tweets for #Bali")
    if tweets:
        logger.info(f"Sample tweet: {tweets[0]['text'][:100]}...")
    
    return len(tweets) > 0

def test_category_scraping():
    """Test scraping full category"""
    logger.info("=" * 60)
    logger.info("TEST 3: Scraping Full Category")
    logger.info("=" * 60)
    
    stats = scrape_category_twitter("events_culture", output_dir="INTEL_SCRAPING")
    
    logger.info(f"✅ Category scraping complete")
    logger.info(f"   Tweets collected: {stats['tweets_collected']}")
    logger.info(f"   Sources: {stats['sources']}")
    logger.info(f"   Output: {stats['output_file']}")
    
    return stats['tweets_collected'] > 0

def main():
    """Run all tests"""
    logger.info("🚀 Starting Twitter Intel Scraper Tests")
    logger.info("")
    
    results = {
        "account_scraping": test_account_scraping(),
        "hashtag_scraping": test_hashtag_scraping(),
        "category_scraping": test_category_scraping()
    }
    
    logger.info("")
    logger.info("=" * 60)
    logger.info("TEST RESULTS")
    logger.info("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        logger.info("")
        logger.info("🎉 All tests passed! Twitter scraper is ready.")
        return 0
    else:
        logger.error("")
        logger.error("❌ Some tests failed. Check logs above.")
        return 1

if __name__ == "__main__":
    exit(main())

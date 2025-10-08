#!/usr/bin/env python3
"""
Twitter/X Intel Scraper - Integrated with Intel Automation Pipeline
Monitors Bali/Indonesia business, immigration, and lifestyle conversations on Twitter/X
"""

import subprocess
import json
import re
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path
import logging
import time

logger = logging.getLogger(__name__)

# ==========================================
# TWITTER INTEL CONFIGURATION
# ==========================================

# Accounts to monitor (Bali business, immigration, expat services)
TWITTER_ACCOUNTS = {
    "immigration": [
        "imigrasi_ri",  # Official Indonesia Immigration
        "Kemenkumham_RI",  # Ministry of Law
        "ditjenpimdagri",  # Directorate General
    ],
    "business_bkpm": [
        "BKPM_RI",  # Investment Board
        "DitjenAHU",  # Legal Entity Admin
        "kemendag",  # Trade Ministry
    ],
    "real_estate": [
        "PropertyGuru_ID",
        "rumah_com",
    ],
    "events_culture": [
        "baliprov",  # Bali Province
        "disparbudpar_bali",  # Tourism Dept
    ],
    "general_news": [
        "CNNIndonesia",
        "tempodotco",
        "detikcom",
        "kompascom",
    ],
    "competitors": [
        "emerhub",
        "cekindo",
    ]
}

# Hashtags to monitor per category
TWITTER_HASHTAGS = {
    "immigration": [
        "#KITAS", "#KITAP", "#IndonesiaVisa",
        "#VisaIndonesia", "#Imigrasi", "#WorkPermit"
    ],
    "business_bkpm": [
        "#BKPM", "#InvestasiIndonesia", "#PTPMA",
        "#OSS", "#PerizinnanUsaha", "#BisnisIndonesia"
    ],
    "real_estate": [
        "#PropertiIndonesia", "#BaliProperty",
        "#PropertyInvestment", "#RealEstateBali"
    ],
    "events_culture": [
        "#Bali", "#BaliEvents", "#BaliCulture",
        "#EventBali", "#BaliLife"
    ],
    "general_news": [
        "#Indonesia", "#Jakarta", "#BeritaIndonesia"
    ],
    "social_media": [
        "#ViralIndonesia", "#TrendingIndonesia",
        "#GenZIndonesia", "#MillennialsIndonesia"
    ]
}

# Keywords for targeted searches
TWITTER_KEYWORDS = {
    "immigration": [
        "KITAS extend", "visa overstay", "sponsor letter",
        "work permit", "immigration office"
    ],
    "business_bkpm": [
        "PT PMA setup", "company registration", "OSS system",
        "business license", "KBLI code"
    ],
    "real_estate": [
        "villa investment", "property ownership", "hak pakai",
        "land certificate", "Bali property"
    ]
}

# ==========================================
# ANONYMIZATION & PRIVACY
# ==========================================

def anonymize_username(username: str) -> str:
    """Anonymize Twitter username for GDPR compliance"""
    return f"tw_{hashlib.md5(username.encode()).hexdigest()[:8]}"

def sanitize_tweet(text: str) -> str:
    """Remove personal information from tweets"""
    # Remove @mentions
    text = re.sub(r'@\w+', '[USER]', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+', '[LINK]', text)
    
    # Remove emails
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    
    # Remove phone numbers (Indonesian format)
    text = re.sub(r'\b(\+62|62|0)[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b', '[PHONE]', text)
    
    return text

# ==========================================
# SCRAPING FUNCTIONS
# ==========================================

def scrape_twitter_account(
    username: str,
    max_tweets: int = 50,
    since_days: int = 7
) -> List[Dict]:
    """
    Scrape tweets from a specific account
    
    Args:
        username: Twitter username (without @)
        max_tweets: Maximum tweets to fetch
        since_days: Number of days to look back
        
    Returns:
        List of tweet dictionaries
    """
    since_date = (datetime.now() - timedelta(days=since_days)).strftime("%Y-%m-%d")
    
    query = f"from:{username} since:{since_date}"
    
    return _scrape_tweets(query, max_tweets)

def scrape_twitter_hashtag(
    hashtag: str,
    max_tweets: int = 100,
    since_days: int = 3,
    lang: str = "id"
) -> List[Dict]:
    """
    Scrape tweets by hashtag
    
    Args:
        hashtag: Hashtag to search (with or without #)
        max_tweets: Maximum tweets to fetch
        since_days: Number of days to look back
        lang: Language filter (id = Indonesian, en = English)
        
    Returns:
        List of tweet dictionaries
    """
    # Clean hashtag
    hashtag = hashtag.lstrip('#')
    since_date = (datetime.now() - timedelta(days=since_days)).strftime("%Y-%m-%d")
    
    query = f"#{hashtag} since:{since_date}"
    if lang:
        query += f" lang:{lang}"
    
    return _scrape_tweets(query, max_tweets)

def scrape_twitter_keywords(
    keywords: List[str],
    max_tweets: int = 50,
    since_days: int = 7,
    lang: str = "id"
) -> List[Dict]:
    """
    Scrape tweets by keywords
    
    Args:
        keywords: List of keywords to search
        max_tweets: Maximum tweets per keyword
        since_days: Number of days to look back
        lang: Language filter
        
    Returns:
        List of tweet dictionaries
    """
    all_tweets = []
    
    for keyword in keywords:
        since_date = (datetime.now() - timedelta(days=since_days)).strftime("%Y-%m-%d")
        query = f'"{keyword}" since:{since_date}'
        if lang:
            query += f" lang:{lang}"
        
        tweets = _scrape_tweets(query, max_tweets)
        all_tweets.extend(tweets)
        
        # Rate limiting
        time.sleep(2)
    
    return all_tweets

def _scrape_tweets(query: str, max_tweets: int) -> List[Dict]:
    """
    Internal: Execute snscrape and parse results
    
    Args:
        query: snscrape search query
        max_tweets: Maximum tweets to fetch
        
    Returns:
        List of parsed tweet dictionaries
    """
    cmd = [
        "snscrape",
        "--jsonl",
        "--max-results", str(max_tweets),
        "twitter-search",
        query
    ]
    
    try:
        logger.info(f"🐦 Scraping: {query[:50]}... (max {max_tweets})")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180  # 3 min timeout
        )
        
        if result.returncode != 0:
            logger.warning(f"  ⚠️ snscrape error: {result.stderr[:200]}")
            return []
        
        # Parse JSONL output
        tweets = []
        for line in result.stdout.strip().split('\n'):
            if line:
                try:
                    tweet_data = json.loads(line)
                    parsed = _parse_tweet(tweet_data)
                    if parsed:
                        tweets.append(parsed)
                except json.JSONDecodeError as e:
                    logger.debug(f"  JSON parse error: {e}")
                    continue
        
        logger.info(f"  ✅ Collected {len(tweets)} tweets")
        return tweets
        
    except subprocess.TimeoutExpired:
        logger.warning(f"  ⚠️ Timeout scraping: {query[:50]}")
        return []
    except Exception as e:
        logger.error(f"  ❌ Error scraping: {e}")
        return []

def _parse_tweet(raw: Dict) -> Optional[Dict]:
    """
    Parse raw snscrape tweet data into intel format
    
    Args:
        raw: Raw tweet data from snscrape
        
    Returns:
        Parsed tweet dictionary or None if invalid
    """
    try:
        text = raw.get("rawContent", "") or raw.get("content", "")
        
        # Skip if empty or too short
        if not text or len(text) < 20:
            return None
        
        # Skip retweets (we want original content)
        if text.startswith("RT @"):
            return None
        
        # Sanitize content
        sanitized_text = sanitize_tweet(text)
        
        return {
            "id": str(raw.get("id", "")),
            "text": sanitized_text,
            "text_raw": text,  # Keep for analysis (not published)
            "author": anonymize_username(raw.get("user", {}).get("username", "unknown")),
            "created_at": raw.get("date", datetime.now().isoformat()),
            "likes": raw.get("likeCount", 0),
            "retweets": raw.get("retweetCount", 0),
            "replies": raw.get("replyCount", 0),
            "lang": raw.get("lang", ""),
            "hashtags": raw.get("hashtags", []),
            "url": raw.get("url", ""),
            "source": "twitter",
            "scraped_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.debug(f"Error parsing tweet: {e}")
        return None

# ==========================================
# INTEL PIPELINE INTEGRATION
# ==========================================

def scrape_category_twitter(
    category: str,
    output_dir: str = "INTEL_SCRAPING"
) -> Dict:
    """
    Scrape Twitter for a specific intel category
    
    Args:
        category: Category name (e.g., "immigration", "business_bkpm")
        output_dir: Output directory for scraped data
        
    Returns:
        Summary statistics
    """
    logger.info(f"🐦 Scraping Twitter for category: {category}")
    
    all_tweets = []
    stats = {
        "category": category,
        "started_at": datetime.now().isoformat(),
        "sources": {
            "accounts": 0,
            "hashtags": 0,
            "keywords": 0
        },
        "tweets_collected": 0
    }
    
    # 1. Scrape accounts
    accounts = TWITTER_ACCOUNTS.get(category, [])
    for account in accounts:
        tweets = scrape_twitter_account(account, max_tweets=20, since_days=7)
        all_tweets.extend(tweets)
        stats["sources"]["accounts"] += 1
        time.sleep(3)  # Rate limiting
    
    # 2. Scrape hashtags
    hashtags = TWITTER_HASHTAGS.get(category, [])
    for hashtag in hashtags[:5]:  # Limit to 5 hashtags to avoid rate limits
        tweets = scrape_twitter_hashtag(hashtag, max_tweets=30, since_days=3)
        all_tweets.extend(tweets)
        stats["sources"]["hashtags"] += 1
        time.sleep(3)
    
    # 3. Scrape keywords (if defined)
    keywords = TWITTER_KEYWORDS.get(category, [])
    if keywords:
        tweets = scrape_twitter_keywords(keywords[:3], max_tweets=20, since_days=7)
        all_tweets.extend(tweets)
        stats["sources"]["keywords"] += len(keywords[:3])
    
    # Deduplicate by tweet ID
    unique_tweets = {t["id"]: t for t in all_tweets if t.get("id")}.values()
    unique_tweets = list(unique_tweets)
    
    # Sort by engagement (likes + retweets)
    unique_tweets.sort(
        key=lambda t: t.get("likes", 0) + t.get("retweets", 0),
        reverse=True
    )
    
    # Save raw tweets
    output_path = Path(output_dir) / category / "raw"
    output_path.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = output_path / f"twitter_{timestamp}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "metadata": stats,
            "tweets": unique_tweets
        }, f, ensure_ascii=False, indent=2)
    
    stats["tweets_collected"] = len(unique_tweets)
    stats["completed_at"] = datetime.now().isoformat()
    stats["output_file"] = str(output_file)
    
    logger.info(f"  ✅ Saved {len(unique_tweets)} tweets to {output_file}")
    
    if unique_tweets:
        logger.info(f"  📊 Top tweet: {unique_tweets[0]['likes']}❤️ {unique_tweets[0]['retweets']}🔄")
    else:
        logger.warning(f"  ⚠️ No tweets collected for {category}")
    
    return stats

def scrape_all_categories_twitter(categories: List[str] = None) -> Dict:
    """
    Scrape Twitter for multiple categories
    
    Args:
        categories: List of categories to scrape (None = all)
        
    Returns:
        Overall summary statistics
    """
    if categories is None:
        categories = list(TWITTER_ACCOUNTS.keys())
    
    logger.info(f"🚀 Starting Twitter scraping for {len(categories)} categories")
    
    overall_stats = {
        "started_at": datetime.now().isoformat(),
        "categories": {},
        "total_tweets": 0
    }
    
    for category in categories:
        try:
            stats = scrape_category_twitter(category)
            overall_stats["categories"][category] = stats
            overall_stats["total_tweets"] += stats["tweets_collected"]
        except Exception as e:
            logger.error(f"Error scraping {category}: {e}")
            overall_stats["categories"][category] = {
                "status": "failed",
                "error": str(e)
            }
    
    overall_stats["completed_at"] = datetime.now().isoformat()
    
    # Save summary
    summary_file = Path("INTEL_SCRAPING") / f"twitter_summary_{datetime.now().strftime('%Y%m%d')}.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(overall_stats, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ Twitter scraping complete: {overall_stats['total_tweets']} tweets")
    logger.info(f"📊 Summary saved: {summary_file}")
    
    if overall_stats['total_tweets'] == 0:
        logger.warning("⚠️ No tweets collected. This may be due to:")
        logger.warning("   1. snscrape incompatibility with Python 3.13+")
        logger.warning("   2. Rate limiting by Twitter")
        logger.warning("   3. Account doesn't exist or is private")
        logger.warning("")
        logger.warning("Solutions:")
        logger.warning("   - Use Python 3.10 or 3.11 (recommended)")
        logger.warning("   - Install alternative: pip install tweepy (requires API keys)")
        logger.warning("   - Use Nitter instances (see docs)")
    
    return overall_stats

# ==========================================
# CLI
# ==========================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Twitter/X Intel Scraper")
    parser.add_argument(
        "--category",
        choices=list(TWITTER_ACCOUNTS.keys()) + ["all"],
        default="all",
        help="Category to scrape"
    )
    parser.add_argument(
        "--output-dir",
        default="INTEL_SCRAPING",
        help="Output directory"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Run scraping
    if args.category == "all":
        scrape_all_categories_twitter()
    else:
        scrape_category_twitter(args.category, args.output_dir)

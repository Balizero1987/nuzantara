#!/usr/bin/env python3
"""
Twitter Indonesia Scraper - Trending Topics & Real Conversations

Estrae tweet autentici indonesiani su:
- Problemi sociali trending
- Gen Z/Millennial discussions
- Bahasa gaul (slang)
- Cultural moments

Uses snscrape (no API keys needed)

Installation:
    pip install snscrape pandas

Usage:
    python scripts/scrape_twitter_indonesia.py --tweets 1000 --output data/twitter_indonesia.jsonl
"""

import subprocess
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path
import argparse
import time

# ==========================================
# CONFIGURATION
# ==========================================

# Trending hashtags Indonesia (aggiorna periodicamente)
TRENDING_HASHTAGS = [
    "#Indonesia",
    "#Jakarta",
    "#Bali",
    "#GenZ",
    "#Millennials",
    "#KerjaKeras",  # Hard work
    "#Gajian",  # Payday
    "#Resign",
    "#MentalHealth",
    "#Galau",  # Melancholy/confused
    "#Gabut",  # Bored
    "#Jomblo",  # Single
    "#StoryWA",  # WhatsApp status stories
    "#ThreadTwitter"
]

# Keywords untuk search
SEARCH_KEYWORDS = [
    # Work & money
    "gaji UMR", "hutang pinjol", "cicilan", "mahal banget",
    "kerja toxic", "resign dari", "interview gagal",

    # Social pressure
    "kapan nikah", "ortu maksa", "dijodohin",
    "keluarga toxic", "pressure nikah",

    # Gen Z vibes
    "gabut", "gaskeun", "anjay", "bucin",
    "mental health", "burnout", "stres",

    # Dreams & struggles
    "pengen pindah", "mimpi jadi", "susah hidup",
    "Jakarta macet", "hidup susah", "survive",

    # Cultural
    "budaya Indonesia", "adat istiadat", "tradisi vs modern"
]

# Indonesian accounts to monitor (influencers, thought leaders)
INDONESIAN_ACCOUNTS = [
    "pandji",  # Pandji Pragiwaksono (comedian, social commentary)
    "gitasav",  # Gita Savitri (YouTuber, social issues)
    "radityadika",  # Raditya Dika (writer, comedian)
    "boywilliam17",  # Boy William (presenter)
    "jrxsid",  # Jerome Polin (education, motivational)
]

# ==========================================
# ANONYMIZATION
# ==========================================

def anonymize_username(username: str) -> str:
    """Anonymize Twitter username"""
    import hashlib
    return f"tw_{hashlib.md5(username.encode()).hexdigest()[:8]}"

def remove_personal_info(text: str) -> str:
    """Remove personal info from tweet"""
    # Remove @mentions
    text = re.sub(r'@\w+', '[USER]', text)

    # Remove URLs
    text = re.sub(r'https?://\S+', '[LINK]', text)

    # Remove email
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)

    # Remove phone numbers
    text = re.sub(r'\b(\+62|62|0)[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b', '[PHONE]', text)

    return text

# ==========================================
# SCRAPING FUNCTIONS (using snscrape)
# ==========================================

def check_snscrape_installed() -> bool:
    """Check if snscrape is installed"""
    try:
        result = subprocess.run(
            ["snscrape", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def scrape_tweets_snscrape(
    query: str,
    max_tweets: int = 100,
    since_date: Optional[str] = None,
    lang: str = "id"
) -> List[Dict]:
    """
    Scrape tweets using snscrape (no API keys needed)

    Args:
        query: Search query or hashtag
        max_tweets: Max tweets to collect
        since_date: ISO date (YYYY-MM-DD) for filtering
        lang: Language code (id = Indonesian)

    Returns:
        List of tweet dictionaries
    """
    # Build query
    search_query = query

    # Add language filter
    if lang:
        search_query += f" lang:{lang}"

    # Add date filter
    if since_date:
        search_query += f" since:{since_date}"

    # Build snscrape command
    cmd = [
        "snscrape",
        "--jsonl",
        "--max-results", str(max_tweets),
        "--progress",
        "twitter-search",
        search_query
    ]

    print(f"🐦 Scraping: {query} (max {max_tweets} tweets)")

    try:
        # Run snscrape
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 min timeout
        )

        if result.returncode != 0:
            print(f"  ⚠️ Error: {result.stderr}")
            return []

        # Parse JSONL output
        tweets = []
        for line in result.stdout.strip().split('\n'):
            if line:
                try:
                    tweet_data = json.loads(line)
                    tweets.append(parse_tweet(tweet_data))
                except json.JSONDecodeError:
                    continue

        print(f"  ✅ Collected {len(tweets)} tweets")
        return tweets

    except subprocess.TimeoutExpired:
        print(f"  ⚠️ Timeout scraping {query}")
        return []
    except Exception as e:
        print(f"  ⚠️ Error: {e}")
        return []

def parse_tweet(raw_tweet: Dict) -> Dict:
    """Parse snscrape tweet data"""
    return {
        "id": raw_tweet.get("id"),
        "text": remove_personal_info(raw_tweet.get("rawContent", "")),
        "author": anonymize_username(raw_tweet.get("user", {}).get("username", "unknown")),
        "created": raw_tweet.get("date", ""),
        "likes": raw_tweet.get("likeCount", 0),
        "retweets": raw_tweet.get("retweetCount", 0),
        "replies": raw_tweet.get("replyCount", 0),
        "lang": raw_tweet.get("lang", ""),
        "hashtags": raw_tweet.get("hashtags", []),
        "url": raw_tweet.get("url", ""),
        "source": "twitter"
    }

# ==========================================
# ALTERNATIVE: Nitter Scraping (if snscrape fails)
# ==========================================

def scrape_tweets_nitter(query: str, max_tweets: int = 100) -> List[Dict]:
    """
    Fallback: Scrape via Nitter (Twitter frontend alternative)

    Nitter instances: nitter.net, nitter.42l.fr, nitter.pussthecat.org
    """
    print(f"⚠️ Nitter scraping not implemented yet")
    print(f"   Use snscrape method or implement Nitter scraper")
    return []

# ==========================================
# MAIN SCRAPING ORCHESTRATION
# ==========================================

def scrape_trending_topics(max_tweets_per_topic: int = 100) -> List[Dict]:
    """Scrape trending Indonesian topics"""
    all_tweets = []

    # Calculate since_date (last 7 days)
    since_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    for hashtag in TRENDING_HASHTAGS:
        tweets = scrape_tweets_snscrape(
            query=hashtag,
            max_tweets=max_tweets_per_topic,
            since_date=since_date,
            lang="id"
        )

        all_tweets.extend(tweets)

        # Rate limiting (be respectful)
        time.sleep(5)  # 5 sec between queries

    return all_tweets

def scrape_keywords(max_tweets_per_keyword: int = 50) -> List[Dict]:
    """Scrape specific keywords"""
    all_tweets = []

    since_date = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")

    for keyword in SEARCH_KEYWORDS[:10]:  # Limit to first 10 to avoid rate limits
        tweets = scrape_tweets_snscrape(
            query=f'"{keyword}"',  # Exact phrase
            max_tweets=max_tweets_per_keyword,
            since_date=since_date,
            lang="id"
        )

        all_tweets.extend(tweets)
        time.sleep(3)

    return all_tweets

def scrape_influencer_accounts(max_tweets_per_account: int = 50) -> List[Dict]:
    """Scrape tweets from Indonesian influencers"""
    all_tweets = []

    for account in INDONESIAN_ACCOUNTS:
        tweets = scrape_tweets_snscrape(
            query=f"from:{account}",
            max_tweets=max_tweets_per_account,
            lang="id"
        )

        all_tweets.extend(tweets)
        time.sleep(4)

    return all_tweets

# ==========================================
# TRAINING FORMAT CONVERSION
# ==========================================

def convert_to_training_format(tweets: List[Dict]) -> List[Dict]:
    """
    Convert tweets to training format

    Twitter threads and reply chains → conversations
    """
    training_examples = []

    for tweet in tweets:
        # Skip retweets, very short tweets
        if tweet["text"].startswith("RT") or len(tweet["text"]) < 50:
            continue

        # Skip low-quality (no engagement)
        if tweet["likes"] == 0 and tweet["retweets"] == 0:
            continue

        # Single tweet as Q&A simulation
        # Extract question/statement patterns
        text = tweet["text"]

        # If tweet is a question → use as user message
        if "?" in text or text.lower().startswith(("gimana", "bagaimana", "kenapa", "apa", "siapa")):
            training_examples.append({
                "messages": [
                    {
                        "role": "user",
                        "content": text
                    },
                    {
                        "role": "assistant",
                        "content": "Saya capisco la tua situazione. [Template response based on context]"
                    }
                ],
                "metadata": {
                    "source": "twitter",
                    "tweet_id": tweet["id"],
                    "engagement": tweet["likes"] + tweet["retweets"],
                    "hashtags": tweet["hashtags"]
                },
                "needs_completion": True  # Flag: needs human review/completion
            })

        # Thread/rant as context
        elif len(text) > 200:
            training_examples.append({
                "messages": [
                    {
                        "role": "user",
                        "content": f"Voglio condividere la mia esperienza: {text[:500]}"
                    }
                ],
                "metadata": {
                    "source": "twitter",
                    "type": "experience_sharing",
                    "engagement": tweet["likes"] + tweet["retweets"]
                },
                "needs_completion": True
            })

    return training_examples

# ==========================================
# MAIN
# ==========================================

def main():
    parser = argparse.ArgumentParser(description="Scrape Twitter Indonesia for training data")
    parser.add_argument("--tweets", type=int, default=1000, help="Target number of tweets")
    parser.add_argument("--output", type=str, default="data/twitter_indonesia_raw.json")
    parser.add_argument("--training-output", type=str, default="data/twitter_indonesia_training.jsonl")
    parser.add_argument("--mode", choices=["trending", "keywords", "influencers", "all"], default="all")

    args = parser.parse_args()

    # Check snscrape
    if not check_snscrape_installed():
        print("❌ ERROR: snscrape not installed")
        print("\nInstallation:")
        print("  pip install snscrape")
        print("\nOr:")
        print("  pip3 install git+https://github.com/JustAnotherArchivist/snscrape.git")
        return

    # Create output directory
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)

    # Scrape based on mode
    all_tweets = []

    if args.mode in ["trending", "all"]:
        print("\n📊 Scraping trending topics...")
        trending = scrape_trending_topics(max_tweets_per_topic=args.tweets // len(TRENDING_HASHTAGS))
        all_tweets.extend(trending)

    if args.mode in ["keywords", "all"]:
        print("\n🔍 Scraping keywords...")
        keywords = scrape_keywords(max_tweets_per_keyword=50)
        all_tweets.extend(keywords)

    if args.mode in ["influencers", "all"]:
        print("\n⭐ Scraping influencer accounts...")
        influencers = scrape_influencer_accounts(max_tweets_per_account=50)
        all_tweets.extend(influencers)

    # Deduplicate by tweet ID
    unique_tweets = {t["id"]: t for t in all_tweets if t.get("id")}.values()
    unique_tweets = list(unique_tweets)

    # Save raw data
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(unique_tweets, f, ensure_ascii=False, indent=2)
    print(f"\n📁 Raw data saved: {args.output}")

    # Convert to training format
    training_data = convert_to_training_format(unique_tweets)

    # Save training data
    with open(args.training_output, 'w', encoding='utf-8') as f:
        for example in training_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')

    print(f"📁 Training data saved: {args.training_output}")
    print(f"\n📊 Stats:")
    print(f"   - Unique tweets: {len(unique_tweets)}")
    print(f"   - Training examples: {len(training_data)}")
    print(f"   - Avg engagement: {sum(t['likes'] + t['retweets'] for t in unique_tweets) / len(unique_tweets):.1f}")

    # Show high-engagement tweets
    top_tweets = sorted(unique_tweets, key=lambda t: t['likes'] + t['retweets'], reverse=True)[:5]
    print(f"\n🔥 Top 5 tweets by engagement:")
    for i, tweet in enumerate(top_tweets, 1):
        print(f"   {i}. {tweet['text'][:80]}... ({tweet['likes']}❤️ {tweet['retweets']}🔄)")

if __name__ == "__main__":
    main()

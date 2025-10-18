#!/usr/bin/env python3
"""
Aggregate daily blog articles from all 8 collaborators
Publish to blog sidebar on intel dashboard
"""

import json
import sys
import os
from datetime import datetime
from glob import glob
import requests

# Configuration
ZANTARA_API_URL = "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app"
ZANTARA_API_KEY = os.getenv("ZANTARA_API_KEY", "zantara-internal-dev-key-2025")
BLOG_DATA_DIR = "../data/blog"

# 8 topic categories
CATEGORIES = [
    "immigration",
    "bkpm_tax",
    "realestate",
    "events",
    "social",
    "competitors",
    "bali_news",
    "roundup"
]


def find_article(category, date_str):
    """Find article JSON for a category on a specific date"""
    pattern = f"{BLOG_DATA_DIR}/{category}/*_blog_{date_str}.json"
    files = glob(pattern)

    if files:
        return files[0]
    return None


def load_article(filepath):
    """Load article JSON"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None


def aggregate_articles(date_str):
    """Aggregate all articles for a date"""
    articles = []

    for category in CATEGORIES:
        article_path = find_article(category, date_str)

        if article_path:
            article = load_article(article_path)
            if article:
                articles.append(article)
                print(f"  ✅ {category}: {article.get('title', 'Untitled')[:50]}...")
            else:
                print(f"  ⚠️  {category}: Failed to load")
        else:
            print(f"  ❌ {category}: Not found")

    return articles


def prioritize_articles(articles):
    """Sort articles by priority: critical > tier1 > high impact"""
    def priority_key(article):
        # Priority score (higher = more important)
        score = 0

        # Impact level
        impact_scores = {
            "critical": 1000,
            "high": 100,
            "medium": 10,
            "low": 1
        }
        score += impact_scores.get(article.get("impact_level", "low"), 0)

        # Tier
        tier = article.get("tier", "3")
        score += (4 - int(tier)) * 50  # Tier 1 = 150, Tier 2 = 100, Tier 3 = 50

        # Action required
        if article.get("action_required"):
            score += 500

        return -score  # Negative for descending sort

    return sorted(articles, key=priority_key)


def publish_daily_blog(date_str, articles):
    """Publish aggregated blog to ZANTARA"""
    try:
        response = requests.post(
            f"{ZANTARA_API_URL}/call",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ZANTARA_API_KEY}"
            },
            json={
                "handler": "intel.blog.daily.publish",
                "params": {
                    "date": date_str,
                    "articles": articles,
                    "total": len(articles)
                }
            },
            timeout=30
        )

        response.raise_for_status()
        return response.json()

    except Exception as e:
        print(f"❌ Publish failed: {e}")
        return None


def notify_slack(date_str, articles_count, critical_count):
    """Send notification to Slack (optional)"""
    # Implementation depends on Slack webhook setup
    # For now, just print
    print()
    print(f"📢 Slack Notification:")
    print(f"   📰 Daily Intel Blog - {date_str}")
    print(f"   ✅ {articles_count} articles published")
    if critical_count > 0:
        print(f"   🚨 {critical_count} critical items")
    print(f"   🔗 https://zantara.balizero.com/intel-dashboard.html")


def main():
    if len(sys.argv) < 2:
        # Default: today's date
        date_str = datetime.now().strftime("%Y%m%d")
    else:
        date_str = sys.argv[1]

    print("=" * 70)
    print(f"📚 Aggregating Daily Blog - {date_str}")
    print("=" * 70)
    print()

    # Find and load all articles
    print("🔍 Finding articles...")
    articles = aggregate_articles(date_str)

    if not articles:
        print()
        print("❌ No articles found for this date")
        print(f"   Expected location: {BLOG_DATA_DIR}/[category]/*_blog_{date_str}.json")
        sys.exit(1)

    print()
    print(f"✅ Found {len(articles)} articles")
    print()

    # Prioritize
    print("📊 Prioritizing articles...")
    sorted_articles = prioritize_articles(articles)

    critical_count = sum(1 for a in articles if a.get('impact_level') == 'critical')
    print(f"   🚨 Critical: {critical_count}")
    print(f"   📌 High: {sum(1 for a in articles if a.get('impact_level') == 'high')}")
    print(f"   📍 Medium: {sum(1 for a in articles if a.get('impact_level') == 'medium')}")
    print()

    # Save aggregated JSON
    output_file = f"../data/blog/daily/blog_daily_{date_str}.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "date": date_str,
            "articles": sorted_articles,
            "total": len(sorted_articles),
            "critical_count": critical_count,
            "generated_at": datetime.now().isoformat()
        }, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved to: {output_file}")
    print()

    # Publish to ZANTARA
    print("📡 Publishing to ZANTARA blog sidebar...")
    result = publish_daily_blog(date_str, sorted_articles)

    if result and result.get('success'):
        print(f"✅ Published successfully!")
    else:
        print(f"❌ Publish failed (check manually)")

    print()
    print("=" * 70)
    print("🎉 Aggregation complete!")
    print(f"   📰 {len(articles)} articles ready")
    print(f"   🔗 View at: https://zantara.balizero.com/intel-dashboard.html")
    print("=" * 70)

    # Notify Slack
    notify_slack(date_str, len(articles), critical_count)


if __name__ == "__main__":
    main()

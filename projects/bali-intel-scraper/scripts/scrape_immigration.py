#!/usr/bin/env python3
"""
Bali Intel Scraper - Immigration & Visas
Scrapes news about Indonesian immigration, visas, KITAS, regulations
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import csv
import time
import random
import os
from urllib.parse import urljoin, urlparse

# Configuration
OUTPUT_DIR = "../data/raw"
DELAY_MIN = 2  # seconds
DELAY_MAX = 5
TIMEOUT = 15  # seconds
MAX_ARTICLES_PER_SOURCE = 10

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

# Sources by Tier
SOURCES = {
    # TIER 1: Government & Official
    "tier1": [
        {
            "name": "Imigrasi Indonesia",
            "url": "https://www.imigrasi.go.id/id/",
            "selector": "article.post",
            "title_selector": "h2.entry-title",
            "link_selector": "h2.entry-title a",
            "date_selector": "time.entry-date",
        },
        {
            "name": "Kemenkumham",
            "url": "https://www.kemenkumham.go.id/berita",
            "selector": "div.berita-item",
            "title_selector": "h3.title",
            "link_selector": "a",
            "date_selector": "span.date",
        },
        {
            "name": "Jakarta Post Immigration",
            "url": "https://www.thejakartapost.com/tags/immigration",
            "selector": "article.latest__item",
            "title_selector": "h2.latest__title",
            "link_selector": "a",
            "date_selector": "time",
        },
        {
            "name": "Bali Government Portal",
            "url": "https://www.baliprov.go.id/",
            "selector": "div.news-item",
            "title_selector": "h3",
            "link_selector": "a",
            "date_selector": "span.date",
        },
    ],

    # TIER 2: Accredited Media
    "tier2": [
        {
            "name": "Kompas - Imigrasi",
            "url": "https://www.kompas.com/tag/imigrasi",
            "selector": "div.article__list",
            "title_selector": "h3.article__title",
            "link_selector": "a.article__link",
            "date_selector": "div.article__date",
        },
        {
            "name": "Tempo - Immigration",
            "url": "https://en.tempo.co/tag/immigration",
            "selector": "div.card",
            "title_selector": "h2.title",
            "link_selector": "a",
            "date_selector": "span.date",
        },
        {
            "name": "Coconuts Bali",
            "url": "https://coconuts.co/bali/",
            "selector": "article.post",
            "title_selector": "h2.entry-title",
            "link_selector": "a",
            "date_selector": "time.entry-date",
        },
        {
            "name": "Bali Times",
            "url": "https://www.thebalitimes.com/",
            "selector": "article",
            "title_selector": "h2.entry-title",
            "link_selector": "a",
            "date_selector": "time",
        },
        {
            "name": "Indonesia Expat",
            "url": "https://indonesiaexpat.id/",
            "selector": "article.post",
            "title_selector": "h2.title",
            "link_selector": "a.permalink",
            "date_selector": "span.date",
        },
        {
            "name": "Jakarta Globe",
            "url": "https://jakartaglobe.id/",
            "selector": "article",
            "title_selector": "h3.entry-title",
            "link_selector": "a",
            "date_selector": "time.published",
        },
        {
            "name": "Detik News Immigration",
            "url": "https://www.detik.com/tag/imigrasi",
            "selector": "article.list-content__item",
            "title_selector": "h3.media__title",
            "link_selector": "a",
            "date_selector": "div.media__date",
        },
        {
            "name": "CNN Indonesia",
            "url": "https://www.cnnindonesia.com/tag/imigrasi",
            "selector": "article.list",
            "title_selector": "h2.title",
            "link_selector": "a",
            "date_selector": "span.date",
        },
        {
            "name": "Antara News",
            "url": "https://www.antaranews.com/tag/imigrasi",
            "selector": "article",
            "title_selector": "h3.post-title",
            "link_selector": "a.post-link",
            "date_selector": "span.simple-share-date",
        },
        {
            "name": "Tribun Bali",
            "url": "https://bali.tribunnews.com/",
            "selector": "li.ptb15",
            "title_selector": "h3",
            "link_selector": "a",
            "date_selector": "time",
        },
    ],

    # TIER 3: Social & Community (Generic sources - actual social scraping requires APIs)
    "tier3": [
        {
            "name": "Bali Expat Blog",
            "url": "https://www.baliexpatblog.com/",
            "selector": "article.post",
            "title_selector": "h2.entry-title",
            "link_selector": "a",
            "date_selector": "time.entry-date",
            "keywords": ["visa", "kitas", "immigration", "expat"],
        },
        {
            "name": "Living in Indonesia",
            "url": "https://www.expat.or.id/",
            "selector": "div.post",
            "title_selector": "h2.title",
            "link_selector": "a.permalink",
            "date_selector": "span.date",
            "keywords": ["visa", "immigration", "permit"],
        },
    ],
}


def scrape_source(source, tier):
    """Scrape a single source"""
    articles = []

    try:
        print(f"  🔍 Scraping {source['name']}...", end=" ")

        response = requests.get(source['url'], headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        items = soup.select(source['selector'])[:MAX_ARTICLES_PER_SOURCE]

        for item in items:
            try:
                # Extract title
                title_elem = item.select_one(source['title_selector'])
                if not title_elem:
                    continue
                title = title_elem.get_text(strip=True)

                # Check keywords for tier3
                if tier == "tier3" and "keywords" in source:
                    if not any(kw.lower() in title.lower() for kw in source['keywords']):
                        continue  # Skip irrelevant articles

                # Extract link
                link_elem = item.select_one(source['link_selector'])
                if not link_elem:
                    continue
                link = link_elem.get('href', '')

                # Make link absolute
                if link and not link.startswith('http'):
                    link = urljoin(source['url'], link)

                # Extract date (try to parse, fallback to today)
                date_str = ""
                date_elem = item.select_one(source['date_selector'])
                if date_elem:
                    date_str = date_elem.get('datetime', date_elem.get_text(strip=True))

                # Try to fetch full text (with timeout and error handling)
                full_text = ""
                try:
                    article_response = requests.get(link, headers=HEADERS, timeout=10)
                    article_soup = BeautifulSoup(article_response.content, 'html.parser')

                    # Generic content extraction (works for most sites)
                    content_selectors = ['article', 'div.content', 'div.entry-content', 'div.article-body']
                    for selector in content_selectors:
                        content = article_soup.select_one(selector)
                        if content:
                            full_text = content.get_text(separator=' ', strip=True)[:2000]  # Limit to 2000 chars
                            break
                except:
                    full_text = title  # Fallback: use title as content

                articles.append({
                    "url": link,
                    "title": title,
                    "published_date": date_str,
                    "full_text": full_text,
                    "source_name": source['name'],
                    "tier": tier[-1],  # Extract number (tier1 -> 1)
                    "scraped_date": datetime.now().isoformat(),
                    "language": "id" if any(x in source['url'] for x in ['.id', 'kompas', 'detik', 'tribun']) else "en"
                })

            except Exception as e:
                # Silent fail for individual articles, continue scraping
                continue

        print(f"✅ {len(articles)} articles")
        return articles

    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}")
        return []


def main():
    """Main scraping function"""
    print("=" * 60)
    print("🔍 BALI INTEL SCRAPER - Immigration & Visas")
    print("=" * 60)
    print()

    all_articles = []

    # Scrape all tiers
    for tier, sources in SOURCES.items():
        print(f"\n📊 TIER {tier[-1]} ({len(sources)} sources)")
        print("-" * 60)

        for source in sources:
            articles = scrape_source(source, tier)
            all_articles.extend(articles)

            # Rate limiting
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    # Save to CSV
    print()
    print("=" * 60)
    print(f"📁 Saving results...")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    today = datetime.now().strftime("%Y%m%d")
    output_file = os.path.join(OUTPUT_DIR, f"immigration_raw_{today}.csv")

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles:
            writer = csv.DictWriter(f, fieldnames=all_articles[0].keys())
            writer.writeheader()
            writer.writerows(all_articles)

    print(f"✅ Saved {len(all_articles)} articles to: {output_file}")
    print()
    print("=" * 60)
    print("🎉 Scraping complete!")
    print(f"   Total articles: {len(all_articles)}")
    print(f"   Output file: {output_file}")
    print()
    print("📋 Next steps:")
    print("   1. Upload CSV to Claude/ChatGPT")
    print("   2. Use prompt from: templates/prompt_immigration.md")
    print("   3. Download structured JSON")
    print("=" * 60)


if __name__ == "__main__":
    main()

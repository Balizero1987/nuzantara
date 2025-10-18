#!/usr/bin/env python3
"""
Bali Intel Scraper - Immigration & Visas (ROBUST VERSION)
Auto-detects selectors, multiple fallbacks, handles site changes
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import csv
import time
import random
import os
from urllib.parse import urljoin
import re

# Configuration
OUTPUT_DIR = "../data/raw"
DELAY_MIN, DELAY_MAX, TIMEOUT = 2, 5, 15
MAX_ARTICLES_PER_SOURCE = 10

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ROBUST SOURCES with multiple fallback selectors
SOURCES = {
    "tier1": [
        {
            "name": "Imigrasi Indonesia",
            "url": "https://www.imigrasi.go.id/",
            "selectors": ["article.post", "div.berita", "article", ".news-item"],
            "title_selectors": ["h2.entry-title", "h3", "h2", ".title"],
            "link_selectors": ["h2 a", "a", ".read-more"],
        },
        {
            "name": "Jakarta Post",
            "url": "https://www.thejakartapost.com/",
            "selectors": ["article", "div.card", ".post"],
            "title_selectors": ["h2", "h3", ".title"],
            "link_selectors": ["a"],
            "keywords": ["immigration", "visa", "expat", "foreigner"]
        },
    ],
    "tier2": [
        {
            "name": "Coconuts Bali",
            "url": "https://coconuts.co/bali/",
            "selectors": ["article", ".post", "div.story"],
            "title_selectors": ["h2", "h3", ".headline"],
            "link_selectors": ["a"],
            "keywords": ["visa", "immigration", "expat"]
        },
        {
            "name": "Bali Times",
            "url": "https://www.thebalitimes.com/",
            "selectors": ["article", ".post", "div.entry"],
            "title_selectors": ["h2", "h3", ".entry-title"],
            "link_selectors": ["a"],
            "keywords": ["immigration", "visa", "permit"]
        },
    ],
    "tier3": [
        {
            "name": "Bali Expat Community",
            "url": "https://www.bali-expat-forum.com/",  # Generic forum
            "selectors": ["div.topic", "article", ".post"],
            "title_selectors": ["h3", "h2", ".title"],
            "link_selectors": ["a"],
            "keywords": ["visa", "kitas", "immigration"]
        },
    ],
}


def auto_detect_articles(soup):
    """Auto-detect article containers using common patterns"""
    # Try common article containers
    for selector in ['article', 'div.post', 'div.story', 'div.card', 'div.entry', 'li.item']:
        items = soup.select(selector)
        if len(items) >= 3:  # At least 3 items = likely article list
            return items, selector

    # Fallback: find divs with links and text
    all_divs = soup.find_all('div')
    candidates = []
    for div in all_divs:
        if div.find('a') and len(div.get_text(strip=True)) > 50:
            candidates.append(div)

    return candidates[:20], "div (auto-detected)"


def extract_title(item, selectors):
    """Extract title with multiple fallback selectors"""
    for selector in selectors:
        elem = item.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if len(text) > 10:  # Valid title
                return text

    # Fallback: any h1/h2/h3
    for tag in ['h2', 'h3', 'h1', 'h4']:
        elem = item.find(tag)
        if elem:
            text = elem.get_text(strip=True)
            if len(text) > 10:
                return text

    return None


def extract_link(item, selectors, base_url):
    """Extract link with multiple fallback selectors"""
    for selector in selectors:
        elem = item.select_one(selector)
        if elem and elem.get('href'):
            link = elem.get('href')
            if link.startswith('http'):
                return link
            return urljoin(base_url, link)

    # Fallback: first link in item
    link_elem = item.find('a')
    if link_elem and link_elem.get('href'):
        link = link_elem.get('href')
        return link if link.startswith('http') else urljoin(base_url, link)

    return None


def scrape_source_robust(source, tier):
    """Robust scraping with auto-detection and fallbacks"""
    articles = []

    try:
        print(f"  🔍 {source['name']}...", end=" ", flush=True)

        response = requests.get(source['url'], headers=HEADERS, timeout=TIMEOUT)

        if response.status_code != 200:
            print(f"❌ HTTP {response.status_code}")
            return []

        soup = BeautifulSoup(response.content, 'html.parser')

        # Try configured selectors first
        items = []
        used_selector = None

        for selector in source.get('selectors', []):
            items = soup.select(selector)
            if len(items) >= 3:
                used_selector = selector
                break

        # Auto-detect if no items found
        if not items:
            items, used_selector = auto_detect_articles(soup)

        if not items:
            print(f"⚠️  No articles detected")
            return []

        # Process items
        for item in items[:MAX_ARTICLES_PER_SOURCE]:
            try:
                title = extract_title(item, source.get('title_selectors', ['h2', 'h3']))
                if not title:
                    continue

                # Keyword filter (tier3 or if keywords specified)
                if 'keywords' in source:
                    if not any(kw.lower() in title.lower() for kw in source['keywords']):
                        continue

                link = extract_link(item, source.get('link_selectors', ['a']), source['url'])
                if not link:
                    continue

                # Get date (best effort)
                date_str = datetime.now().strftime("%Y-%m-%d")
                date_elem = item.find('time')
                if date_elem:
                    date_str = date_elem.get('datetime', date_elem.get_text(strip=True))

                articles.append({
                    "url": link,
                    "title": title,
                    "published_date": date_str,
                    "full_text": title,  # Simplified - skip full fetch for speed
                    "source_name": source['name'],
                    "tier": tier[-1],
                    "scraped_date": datetime.now().isoformat(),
                    "language": "id" if '.id' in source['url'] else "en"
                })

            except:
                continue

        status = f"✅ {len(articles)} ({used_selector})" if articles else "⚠️  0"
        print(status)
        return articles

    except Exception as e:
        print(f"❌ {str(e)[:30]}")
        return []


def main():
    print("=" * 70)
    print("🔍 BALI INTEL SCRAPER - Immigration (ROBUST)")
    print("=" * 70)
    print()

    all_articles = []

    for tier, sources in SOURCES.items():
        print(f"\n📊 TIER {tier[-1]} ({len(sources)} sources)")
        print("-" * 70)

        for source in sources:
            articles = scrape_source_robust(source, tier)
            all_articles.extend(articles)
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    # Save results
    print()
    print("=" * 70)
    print("📁 Saving results...")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    today = datetime.now().strftime("%Y%m%d")
    output_file = os.path.join(OUTPUT_DIR, f"immigration_raw_{today}.csv")

    if all_articles:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=all_articles[0].keys())
            writer.writeheader()
            writer.writerows(all_articles)

        print(f"✅ Saved {len(all_articles)} articles to: {output_file}")
    else:
        print("⚠️  No articles found (all sources failed or empty)")

    print()
    print("=" * 70)
    print("🎉 Scraping complete!")
    print(f"   Total articles: {len(all_articles)}")
    if all_articles:
        print(f"   Tier breakdown: T1={sum(1 for a in all_articles if a['tier']=='1')} "
              f"T2={sum(1 for a in all_articles if a['tier']=='2')} "
              f"T3={sum(1 for a in all_articles if a['tier']=='3')}")
    print()
    print("📋 Next: Upload CSV to Claude/ChatGPT for structuring")
    print("=" * 70)


if __name__ == "__main__":
    main()

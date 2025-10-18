#!/usr/bin/env python3
"""
Bali Intel Scraper - BKPM/KBLI/Tax & Compliance
Scrapes news about business licensing, KBLI updates, tax regulations, compliance
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import csv
import time
import random
import os
from urllib.parse import urljoin

# Configuration
OUTPUT_DIR = "../data/raw"
DELAY_MIN = 2
DELAY_MAX = 5
TIMEOUT = 15
MAX_ARTICLES_PER_SOURCE = 10

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
HEADERS = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}

# Sources by Tier
SOURCES = {
    "tier1": [
        {
            "name": "BKPM Official",
            "url": "https://www.bkpm.go.id/en/news",
            "selector": "div.news-item",
            "title_selector": "h3.title",
            "link_selector": "a",
            "date_selector": "span.date",
        },
        {
            "name": "OSS Indonesia",
            "url": "https://oss.go.id/informasi/berita",
            "selector": "article.post",
            "title_selector": "h2.entry-title",
            "link_selector": "a",
            "date_selector": "time",
        },
        {
            "name": "Direktorat Jenderal Pajak",
            "url": "https://www.pajak.go.id/id/berita",
            "selector": "div.view-content article",
            "title_selector": "h3",
            "link_selector": "a",
            "date_selector": "span.date-display-single",
        },
        {
            "name": "Kemenkeu - Tax News",
            "url": "https://www.kemenkeu.go.id/kategori/pajak",
            "selector": "div.berita-item",
            "title_selector": "h4",
            "link_selector": "a",
            "date_selector": "span.tanggal",
        },
        {
            "name": "LKPM Bali",
            "url": "https://lkpm.bkpm.go.id/",
            "selector": "div.news-list article",
            "title_selector": "h2",
            "link_selector": "a",
            "date_selector": "time",
        },
    ],
    "tier2": [
        {
            "name": "Jakarta Post Business",
            "url": "https://www.thejakartapost.com/business",
            "selector": "article.latest__item",
            "title_selector": "h2.latest__title",
            "link_selector": "a",
            "date_selector": "time",
        },
        {
            "name": "Bisnis Indonesia",
            "url": "https://bisnis.com/category/ekonomi",
            "selector": "article.list-article",
            "title_selector": "h2.title",
            "link_selector": "a",
            "date_selector": "span.date",
        },
        {
            "name": "Kontan - Business License",
            "url": "https://nasional.kontan.co.id/tag/perizinan-usaha",
            "selector": "div.list-berita li",
            "title_selector": "h1",
            "link_selector": "a",
            "date_selector": "span.font-gray",
        },
        {
            "name": "SWA Magazine",
            "url": "https://swa.co.id/category/business/regulation",
            "selector": "article.item-list",
            "title_selector": "h2.title",
            "link_selector": "a.image-link",
            "date_selector": "span.post-date",
        },
        {
            "name": "Investor Daily",
            "url": "https://investor.id/tags/perpajakan",
            "selector": "div.article-item",
            "title_selector": "h3.title",
            "link_selector": "a",
            "date_selector": "div.date",
        },
        {
            "name": "BaliBiz News",
            "url": "https://balibiz.com/category/regulation",
            "selector": "article.post",
            "title_selector": "h2.entry-title",
            "link_selector": "a",
            "date_selector": "time.published",
        },
        {
            "name": "Indonesia Investments",
            "url": "https://www.indonesia-investments.com/news",
            "selector": "div.news-item",
            "title_selector": "h3",
            "link_selector": "a",
            "date_selector": "span.date",
        },
        {
            "name": "PwC Indonesia Insights",
            "url": "https://www.pwc.com/id/en/publications.html",
            "selector": "div.publication-item",
            "title_selector": "h3.title",
            "link_selector": "a",
            "date_selector": "span.date",
        },
        {
            "name": "Deloitte Indonesia",
            "url": "https://www2.deloitte.com/id/en/pages/tax/articles/tax-news.html",
            "selector": "article.cmp-teaser",
            "title_selector": "h3",
            "link_selector": "a",
            "date_selector": "time",
        },
        {
            "name": "KPMG Indonesia",
            "url": "https://kpmg.com/id/en/home/insights.html",
            "selector": "div.insight-card",
            "title_selector": "h3.card-title",
            "link_selector": "a",
            "date_selector": "span.publish-date",
        },
    ],
    "tier3": [
        {
            "name": "Bali Business Community Forum",
            "url": "https://www.baliexpat.community/business",
            "selector": "div.topic",
            "title_selector": "h3.topic-title",
            "link_selector": "a",
            "date_selector": "span.topic-date",
            "keywords": ["tax", "kbli", "license", "permit", "bpjs", "npwp"],
        },
        {
            "name": "Indonesia Business Blog",
            "url": "https://www.indonesiabusinesspost.com/",
            "selector": "article.post",
            "title_selector": "h2.entry-title",
            "link_selector": "a",
            "date_selector": "time",
            "keywords": ["regulation", "compliance", "tax", "license"],
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
                title_elem = item.select_one(source['title_selector'])
                if not title_elem:
                    continue
                title = title_elem.get_text(strip=True)

                # Check keywords for tier3
                if tier == "tier3" and "keywords" in source:
                    if not any(kw.lower() in title.lower() for kw in source['keywords']):
                        continue

                link_elem = item.select_one(source['link_selector'])
                if not link_elem:
                    continue
                link = link_elem.get('href', '')
                if link and not link.startswith('http'):
                    link = urljoin(source['url'], link)

                date_str = ""
                date_elem = item.select_one(source['date_selector'])
                if date_elem:
                    date_str = date_elem.get('datetime', date_elem.get_text(strip=True))

                full_text = ""
                try:
                    article_response = requests.get(link, headers=HEADERS, timeout=10)
                    article_soup = BeautifulSoup(article_response.content, 'html.parser')
                    for selector in ['article', 'div.content', 'div.entry-content']:
                        content = article_soup.select_one(selector)
                        if content:
                            full_text = content.get_text(separator=' ', strip=True)[:2000]
                            break
                except:
                    full_text = title

                articles.append({
                    "url": link,
                    "title": title,
                    "published_date": date_str,
                    "full_text": full_text,
                    "source_name": source['name'],
                    "tier": tier[-1],
                    "scraped_date": datetime.now().isoformat(),
                    "language": "id" if any(x in source['url'] for x in ['.id', 'pajak', 'kemenkeu']) else "en"
                })
            except:
                continue

        print(f"✅ {len(articles)} articles")
        return articles
    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}")
        return []


def main():
    print("=" * 60)
    print("🔍 BALI INTEL SCRAPER - BKPM/KBLI/Tax & Compliance")
    print("=" * 60)
    print()

    all_articles = []
    for tier, sources in SOURCES.items():
        print(f"\n📊 TIER {tier[-1]} ({len(sources)} sources)")
        print("-" * 60)
        for source in sources:
            articles = scrape_source(source, tier)
            all_articles.extend(articles)
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    print()
    print("=" * 60)
    print(f"📁 Saving results...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    today = datetime.now().strftime("%Y%m%d")
    output_file = os.path.join(OUTPUT_DIR, f"bkpm_tax_raw_{today}.csv")

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles:
            writer = csv.DictWriter(f, fieldnames=all_articles[0].keys())
            writer.writeheader()
            writer.writerows(all_articles)

    print(f"✅ Saved {len(all_articles)} articles to: {output_file}")
    print("=" * 60)


if __name__ == "__main__":
    main()

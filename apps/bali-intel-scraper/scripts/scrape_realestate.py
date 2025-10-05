#!/usr/bin/env python3
"""
Bali Intel Scraper - Real Estate
Scrapes news about Bali real estate market, property regulations, development projects
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import csv
import time
import random
import os
from urllib.parse import urljoin

OUTPUT_DIR = "../data/raw"
DELAY_MIN, DELAY_MAX, TIMEOUT, MAX_ARTICLES_PER_SOURCE = 2, 5, 15, 10
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
HEADERS = {"User-Agent": USER_AGENT}

SOURCES = {
    "tier1": [
        {"name": "Ministry of Land Affairs", "url": "https://www.atrbpn.go.id/Berita", "selector": "div.news-item", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "REI (Real Estate Indonesia) Bali", "url": "https://www.rei.or.id/region/bali", "selector": "article.news", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Bank Indonesia Property Data", "url": "https://www.bi.go.id/en/statistik/ekonomi-keuangan/seki/Default.aspx", "selector": "div.data-item", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
    ],
    "tier2": [
        {"name": "Bali Times Real Estate", "url": "https://www.thebalitimes.com/category/property", "selector": "article", "title_selector": "h2.entry-title", "link_selector": "a", "date_selector": "time"},
        {"name": "Property Report Bali", "url": "https://www.property-report.com/bali", "selector": "div.property-news", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Lamudi Bali News", "url": "https://www.lamudi.co.id/bali/news/", "selector": "article.news-card", "title_selector": "h2", "link_selector": "a", "date_selector": "span.date"},
        {"name": "PropertyGuru Indonesia", "url": "https://www.propertyguru.co.id/property-news/bali", "selector": "div.article-item", "title_selector": "h3.title", "link_selector": "a", "date_selector": "span.time"},
        {"name": "The Bali Sun", "url": "https://www.balisun.com/category/property", "selector": "article.post", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Coconuts Bali Property", "url": "https://coconuts.co/bali/property", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Kompas Property Bali", "url": "https://properti.kompas.com/tag/bali", "selector": "div.article__list", "title_selector": "h3", "link_selector": "a", "date_selector": "div.article__date"},
        {"name": "Indonesia Property Watch", "url": "https://www.indonesiapropertywatch.com/", "selector": "article.post", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Bali Discovery Property", "url": "https://www.balidiscovery.com/property", "selector": "div.news-item", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
    ],
    "tier3": [
        {"name": "Bali Property Forum", "url": "https://www.baliexpat.community/property", "selector": "div.topic", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date", "keywords": ["property", "real estate", "villa", "land", "development"]},
        {"name": "Expat Property Blog", "url": "https://www.baliexpatblog.com/category/property", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time", "keywords": ["property", "market", "prices", "regulation"]},
    ],
}

def scrape_source(source, tier):
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
                if not title_elem: continue
                title = title_elem.get_text(strip=True)
                if tier == "tier3" and "keywords" in source:
                    if not any(kw.lower() in title.lower() for kw in source['keywords']): continue
                link_elem = item.select_one(source['link_selector'])
                if not link_elem: continue
                link = link_elem.get('href', '')
                if link and not link.startswith('http'): link = urljoin(source['url'], link)
                date_str = ""
                date_elem = item.select_one(source['date_selector'])
                if date_elem: date_str = date_elem.get('datetime', date_elem.get_text(strip=True))
                full_text = title
                try:
                    article_response = requests.get(link, headers=HEADERS, timeout=10)
                    article_soup = BeautifulSoup(article_response.content, 'html.parser')
                    for selector in ['article', 'div.content', 'div.entry-content']:
                        content = article_soup.select_one(selector)
                        if content: full_text = content.get_text(separator=' ', strip=True)[:2000]; break
                except: pass
                articles.append({"url": link, "title": title, "published_date": date_str, "full_text": full_text, "source_name": source['name'], "tier": tier[-1], "scraped_date": datetime.now().isoformat(), "language": "id" if '.id' in source['url'] else "en"})
            except: continue
        print(f"✅ {len(articles)} articles")
        return articles
    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}")
        return []

def main():
    print("="*60); print("🔍 BALI INTEL SCRAPER - Real Estate"); print("="*60); print()
    all_articles = []
    for tier, sources in SOURCES.items():
        print(f"\n📊 TIER {tier[-1]} ({len(sources)} sources)"); print("-"*60)
        for source in sources: all_articles.extend(scrape_source(source, tier)); time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
    print(); print("="*60); print("📁 Saving results...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    today = datetime.now().strftime("%Y%m%d")
    output_file = os.path.join(OUTPUT_DIR, f"realestate_raw_{today}.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles: writer = csv.DictWriter(f, fieldnames=all_articles[0].keys()); writer.writeheader(); writer.writerows(all_articles)
    print(f"✅ Saved {len(all_articles)} articles to: {output_file}"); print("="*60)

if __name__ == "__main__": main()

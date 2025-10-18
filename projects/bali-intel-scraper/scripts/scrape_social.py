#!/usr/bin/env python3
"""Bali Intel Scraper - Social Media Trends (Public sources only, no API)"""
import requests, csv, os, time, random
from bs4 import BeautifulSoup
from datetime import datetime

OUTPUT_DIR = "../data/raw"
HEADERS = {"User-Agent": "Mozilla/5.0"}

# Note: Social media scraping via APIs requires authentication
# This script uses publicly accessible pages only
SOURCES = {
    "tier2": [
        {"name": "Bali Viral Stories", "url": "https://www.baliviralstories.com/", "selector": "article.post", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "What's Up Bali", "url": "https://whatsupbali.com/", "selector": "div.trending", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
    ],
    "tier3": [
        {"name": "Bali Expat Community", "url": "https://www.baliexpat.community/trending", "selector": "div.topic", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Reddit Bali (via RSS)", "url": "https://www.reddit.com/r/bali/hot/.rss", "selector": "entry", "title_selector": "title", "link_selector": "link", "date_selector": "updated"},
    ],
}

def scrape_source(source, tier):
    try:
        print(f"  {source['name']}...", end=" ")
        soup = BeautifulSoup(requests.get(source['url'], headers=HEADERS, timeout=15).content, 'html.parser')
        articles = []
        for item in soup.select(source['selector'])[:10]:
            try:
                title = item.select_one(source['title_selector']).get_text(strip=True)
                link = item.select_one(source['link_selector']).get('href', '')
                articles.append({"url": link, "title": title, "published_date": "", "full_text": title, "source_name": source['name'], "tier": tier[-1], "scraped_date": datetime.now().isoformat(), "language": "en"})
            except: continue
        print(f"✅ {len(articles)}")
        return articles
    except: print("❌"); return []

def main():
    print("="*60, "\n🔍 BALI INTEL - Social Trends\n", "="*60)
    all_articles = []
    for tier, sources in SOURCES.items():
        for source in sources: all_articles.extend(scrape_source(source, tier)); time.sleep(random.uniform(2,5))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, f"social_raw_{datetime.now().strftime('%Y%m%d')}.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles: w = csv.DictWriter(f, fieldnames=all_articles[0].keys()); w.writeheader(); w.writerows(all_articles)
    print(f"\n✅ {len(all_articles)} to: {output_file}\n", "="*60)

if __name__ == "__main__": main()

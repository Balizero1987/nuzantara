#!/usr/bin/env python3
"""Bali Intel Scraper - Events & Culture"""
import requests, csv, os, time, random
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin

OUTPUT_DIR, DELAY_MIN, DELAY_MAX, TIMEOUT = "../data/raw", 2, 5, 15
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

SOURCES = {
    "tier1": [
        {"name": "Bali Tourism Board", "url": "https://www.balitourismboard.org/events", "selector": "div.event", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Ministry of Tourism Events", "url": "https://www.kemenparekraf.go.id/events/bali", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
    ],
    "tier2": [
        {"name": "NOW Bali Events", "url": "https://nowbali.co.id/events", "selector": "div.event-card", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Coconuts Bali Events", "url": "https://coconuts.co/bali/events", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "The Bali Sun Events", "url": "https://www.balisun.com/events", "selector": "div.event-item", "title_selector": "h2", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Yak Magazine Bali", "url": "https://www.yakworld.com/bali/events", "selector": "article.event", "title_selector": "h3", "link_selector": "a", "date_selector": "time"},
        {"name": "The Beat Bali", "url": "https://www.thebeatbali.com/events", "selector": "div.event", "title_selector": "h2", "link_selector": "a", "date_selector": "span.date"},
        {"name": "BaliBible Events", "url": "https://balibible.com/events", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
    ],
    "tier3": [
        {"name": "Bali Expat Events", "url": "https://www.baliexpat.community/events", "selector": "div.event", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date", "keywords": ["festival", "culture", "expat", "community"]},
    ],
}

def scrape_source(source, tier):
    articles = []
    try:
        print(f"  🔍 {source['name']}...", end=" ")
        soup = BeautifulSoup(requests.get(source['url'], headers=HEADERS, timeout=TIMEOUT).content, 'html.parser')
        for item in soup.select(source['selector'])[:10]:
            try:
                title = item.select_one(source['title_selector']).get_text(strip=True)
                if tier == "tier3" and "keywords" in source and not any(k.lower() in title.lower() for k in source['keywords']): continue
                link = item.select_one(source['link_selector']).get('href', '')
                if link and not link.startswith('http'): link = urljoin(source['url'], link)
                date_elem = item.select_one(source['date_selector'])
                date_str = date_elem.get('datetime', date_elem.get_text(strip=True)) if date_elem else ""
                articles.append({"url": link, "title": title, "published_date": date_str, "full_text": title, "source_name": source['name'], "tier": tier[-1], "scraped_date": datetime.now().isoformat(), "language": "en"})
            except: continue
        print(f"✅ {len(articles)}")
        return articles
    except: print("❌"); return []

def main():
    print("="*60, "\n🔍 BALI INTEL - Events & Culture\n", "="*60)
    all_articles = []
    for tier, sources in SOURCES.items():
        print(f"\n📊 TIER {tier[-1]}\n", "-"*60)
        for source in sources: all_articles.extend(scrape_source(source, tier)); time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, f"events_raw_{datetime.now().strftime('%Y%m%d')}.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles: w = csv.DictWriter(f, fieldnames=all_articles[0].keys()); w.writeheader(); w.writerows(all_articles)
    print(f"\n✅ Saved {len(all_articles)} to: {output_file}\n", "="*60)

if __name__ == "__main__": main()

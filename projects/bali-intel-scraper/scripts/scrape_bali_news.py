#!/usr/bin/env python3
"""Bali Intel Scraper - General Bali News (expat-relevant)"""
import requests, csv, os, time, random
from bs4 import BeautifulSoup
from datetime import datetime

OUTPUT_DIR, HEADERS = "../data/raw", {"User-Agent": "Mozilla/5.0"}

SOURCES = {
    "tier1": [
        {"name": "Bali Government Portal", "url": "https://www.baliprov.go.id/berita", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
    ],
    "tier2": [
        {"name": "Bali Post", "url": "https://www.balipost.com/", "selector": "article.latest", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Tribun Bali", "url": "https://bali.tribunnews.com/", "selector": "li.ptb15", "title_selector": "h3", "link_selector": "a", "date_selector": "time"},
        {"name": "Nusa Bali", "url": "https://www.nusabali.com/", "selector": "div.news-item", "title_selector": "h2", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Radar Bali", "url": "https://radarbali.jawapos.com/", "selector": "article.post", "title_selector": "h3", "link_selector": "a", "date_selector": "time"},
        {"name": "Bali Discovery", "url": "https://www.balidiscovery.com/", "selector": "div.news", "title_selector": "h2", "link_selector": "a", "date_selector": "span.date"},
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
                articles.append({"url": link, "title": title, "published_date": "", "full_text": title, "source_name": source['name'], "tier": tier[-1], "scraped_date": datetime.now().isoformat(), "language": "id"})
            except: continue
        print(f"✅ {len(articles)}")
        return articles
    except: print("❌"); return []

def main():
    print("="*60, "\n🔍 BALI INTEL - General News\n", "="*60)
    all_articles = []
    for tier, sources in SOURCES.items():
        for source in sources: all_articles.extend(scrape_source(source, tier)); time.sleep(random.uniform(2,5))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, f"bali_news_raw_{datetime.now().strftime('%Y%m%d')}.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles: w = csv.DictWriter(f, fieldnames=all_articles[0].keys()); w.writeheader(); w.writerows(all_articles)
    print(f"\n✅ {len(all_articles)} to: {output_file}\n", "="*60)

if __name__ == "__main__": main()

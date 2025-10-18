#!/usr/bin/env python3
"""Bali Intel Scraper - Weekend Roundup (Deep-dive analysis)"""
import requests, csv, os, time, random
from bs4 import BeautifulSoup
from datetime import datetime

OUTPUT_DIR, HEADERS = "../data/raw", {"User-Agent": "Mozilla/5.0"}

# Weekend roundup: comprehensive analysis of top sources from all topics
SOURCES = {
    "tier1": [
        {"name": "Imigrasi", "url": "https://www.imigrasi.go.id/id/", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "BKPM", "url": "https://www.bkpm.go.id/en/news", "selector": "div.news-item", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Ditjen Pajak", "url": "https://www.pajak.go.id/id/berita", "selector": "article", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
    ],
    "tier2": [
        {"name": "Jakarta Post", "url": "https://www.thejakartapost.com/", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Coconuts Bali", "url": "https://coconuts.co/bali/", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Bali Times", "url": "https://www.thebalitimes.com/", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
    ],
}

def scrape_source(source, tier):
    try:
        print(f"  {source['name']}...", end=" ")
        soup = BeautifulSoup(requests.get(source['url'], headers=HEADERS, timeout=15).content, 'html.parser')
        articles = []
        for item in soup.select(source['selector'])[:20]:  # More articles for roundup
            try:
                title = item.select_one(source['title_selector']).get_text(strip=True)
                link = item.select_one(source['link_selector']).get('href', '')
                articles.append({"url": link, "title": title, "published_date": "", "full_text": title, "source_name": source['name'], "tier": tier[-1], "scraped_date": datetime.now().isoformat(), "language": "en"})
            except: continue
        print(f"✅ {len(articles)}")
        return articles
    except: print("❌"); return []

def main():
    print("="*60, "\n🔍 BALI INTEL - Weekend Roundup\n", "="*60)
    all_articles = []
    for tier, sources in SOURCES.items():
        for source in sources: all_articles.extend(scrape_source(source, tier)); time.sleep(random.uniform(2,5))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, f"roundup_raw_{datetime.now().strftime('%Y%m%d')}.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles: w = csv.DictWriter(f, fieldnames=all_articles[0].keys()); w.writeheader(); w.writerows(all_articles)
    print(f"\n✅ {len(all_articles)} to: {output_file}\n", "="*60)

if __name__ == "__main__": main()

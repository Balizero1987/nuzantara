#!/usr/bin/env python3
"""Bali Intel Scraper - Competitors (Visa/Legal/Tax consultants monitoring)"""
import requests, csv, os, time, random
from bs4 import BeautifulSoup
from datetime import datetime

OUTPUT_DIR, HEADERS = "../data/raw", {"User-Agent": "Mozilla/5.0"}

# Competitors in Bali/Indonesia
SOURCES = {
    "tier2": [
        {"name": "InCorp Indonesia", "url": "https://www.incorp.asia/id/blog", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Cekindo Business", "url": "https://www.cekindo.com/blog", "selector": "div.post", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "Paul Hype Page", "url": "https://www.paulhypepage.co.id/insights", "selector": "article.insight", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
        {"name": "Emerhub Indonesia", "url": "https://www.emerhub.com/indonesia/blog", "selector": "div.blog-post", "title_selector": "h3", "link_selector": "a", "date_selector": "span.date"},
        {"name": "3E Accounting", "url": "https://www.3ecpa.com.hk/indonesia-blog", "selector": "article", "title_selector": "h2", "link_selector": "a", "date_selector": "time"},
    ],
    "tier3": [
        {"name": "Google Reviews - Bali Visa Services", "url": "https://www.google.com/search?q=bali+visa+services+reviews", "selector": "div.review", "title_selector": "span.review-text", "link_selector": "a", "date_selector": "span.review-date"},
    ],
}

def scrape_source(source, tier):
    try:
        print(f"  {source['name'][:30]}...", end=" ")
        soup = BeautifulSoup(requests.get(source['url'], headers=HEADERS, timeout=15).content, 'html.parser')
        articles = []
        for item in soup.select(source['selector'])[:10]:
            try:
                title = item.select_one(source['title_selector']).get_text(strip=True)
                link = item.select_one(source['link_selector']).get('href', source['url'])
                articles.append({"url": link, "title": title, "published_date": "", "full_text": title, "source_name": source['name'], "tier": tier[-1], "scraped_date": datetime.now().isoformat(), "language": "en"})
            except: continue
        print(f"✅ {len(articles)}")
        return articles
    except: print("❌"); return []

def main():
    print("="*60, "\n🔍 BALI INTEL - Competitors\n", "="*60)
    all_articles = []
    for tier, sources in SOURCES.items():
        for source in sources: all_articles.extend(scrape_source(source, tier)); time.sleep(random.uniform(2,5))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, f"competitors_raw_{datetime.now().strftime('%Y%m%d')}.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if all_articles: w = csv.DictWriter(f, fieldnames=all_articles[0].keys()); w.writeheader(); w.writerows(all_articles)
    print(f"\n✅ {len(all_articles)} to: {output_file}\n", "="*60)

if __name__ == "__main__": main()

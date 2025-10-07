#!/usr/bin/env python3
"""
NUZANTARA Web Scraper - REAL WORKING VERSION
Scrapes websites and saves to JSON files
"""

import json
import os
from datetime import datetime
from pathlib import Path
import hashlib

# Try importing required libraries
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing required packages...")
    os.system("pip3 install requests beautifulsoup4")
    import requests
    from BeautifulSoup import BeautifulSoup

# Configuration
SCRAPED_DIR = Path("scraped")
SOURCES = {
    "immigration": [
        "https://www.imigrasi.go.id/"
    ],
    "bali_news": [
        "https://www.thebalitimes.com/"
    ],
    "bkpm_tax": [
        "https://www.investindonesia.go.id/en"
    ]
}

def scrape_url(url, category):
    """Scrape a URL and return structured data"""
    print(f"🌐 Scraping: {url}")
    
    try:
        # Make request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract content
        title = soup.find('title')
        title = title.get_text().strip() if title else "No title"
        
        # Get all text content
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        content = soup.get_text()
        # Clean up whitespace
        lines = (line.strip() for line in content.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        content = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Create data structure
        data = {
            "url": url,
            "title": title,
            "content": content,
            "category": category,
            "scraped_at": datetime.now().isoformat(),
            "word_count": len(content.split())
        }
        
        print(f"  ✅ Scraped: {len(content.split())} words")
        return data
        
    except Exception as e:
        print(f"  ❌ Error scraping {url}: {e}")
        return None

def save_scraped_data(data, category):
    """Save scraped data to JSON file"""
    
    # Create directory
    category_dir = SCRAPED_DIR / category
    category_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    url_hash = hashlib.md5(data['url'].encode()).hexdigest()[:8]
    filename = f"{timestamp}_{url_hash}.json"
    filepath = category_dir / filename
    
    # Save JSON
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  💾 Saved: {filepath}")
    return filepath

def main():
    """Main scraper function"""
    
    print("="*60)
    print("NUZANTARA WEB SCRAPER - REAL VERSION")
    print("="*60)
    print()
    
    total_scraped = 0
    
    for category, urls in SOURCES.items():
        print(f"\n📁 Category: {category.upper()}")
        print("-"*60)
        
        for url in urls:
            # Scrape
            data = scrape_url(url, category)
            
            if data:
                # Save
                save_scraped_data(data, category)
                total_scraped += 1
        
        print()
    
    print("="*60)
    print(f"✅ DONE: {total_scraped} pages scraped successfully")
    print(f"📂 Output: {SCRAPED_DIR.absolute()}/")
    print("="*60)

if __name__ == "__main__":
    main()

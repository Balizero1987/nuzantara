#!/usr/bin/env python3
"""
Quick Test Runner for Stage 2 Scraper
======================================

Tests scraping on a small subset of sources

Author: ZANTARA Team
Created: 2025-10-07
"""

import asyncio
import json
from pathlib import Path
from stage2_scraper import IntelScraper


async def test_scraping():
    """Test scraper with small subset"""
    
    print("🧪 Testing Scraper with Small Subset\n")
    
    # Create test config
    test_config = {
        "category_id": "test_category",
        "category_name": "Test Category",
        "pipeline": "public",
        "tier1_test": [
            {
                "url": "https://www.imigrasi.go.id",
                "name": "Test Immigration Site",
                "language": "id",
                "priority": "high"
            },
            {
                "url": "https://www.thejakartapost.com",
                "name": "Test News Site",
                "language": "en",
                "priority": "medium"
            }
        ]
    }
    
    # Save test config
    test_dir = Path("THE SCRAPING/sources/test")
    test_dir.mkdir(parents=True, exist_ok=True)
    
    test_file = test_dir / "test_category.json"
    test_file.write_text(json.dumps(test_config, indent=2))
    
    print(f"✅ Created test config: {test_file}")
    
    # Run scraper on test category
    scraper = IntelScraper()
    
    # Manually load test config
    scraper.categories['test_category'] = test_config
    
    print("\n🚀 Running test scrape...\n")
    
    results = await scraper.scrape_category('test_category', test_config)
    
    if results:
        scraper.save_results('test_category', results)
        
        print(f"\n✅ Test complete!")
        print(f"📁 Check output: THE SCRAPING/scraped/test_category/raw/")
        
        # Show sample
        output_dir = Path("THE SCRAPING/scraped/test_category/raw")
        if output_dir.exists():
            files = list(output_dir.glob("*.md"))
            if files:
                print(f"\n📄 Sample file: {files[0].name}")
                print("Content preview:")
                print("-" * 60)
                print(files[0].read_text()[:500])
                print("-" * 60)
    else:
        print("❌ No results from test scrape")
    
    # Cleanup
    test_file.unlink()
    print(f"\n🧹 Cleaned up test config")


if __name__ == "__main__":
    asyncio.run(test_scraping())

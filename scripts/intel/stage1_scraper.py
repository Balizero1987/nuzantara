#!/usr/bin/env python3
"""
STAGE 1: SCRAPING with Crawl4AI + Jina AI Support
===================================================

This script implements the scraping stage of the Intel Automation pipeline.
Uses Crawl4AI for fast, efficient scraping with optional Jina AI support.

Author: ZANTARA Team
Created: 2025-10-07
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import hashlib

# Crawl4AI imports
try:
    from crawl4ai import AsyncWebCrawler
    from crawl4ai.extraction_strategy import CosineStrategy
    from crawl4ai.chunking_strategy import RegexChunking
except ImportError:
    print("❌ Crawl4AI not installed. Run: pip install crawl4ai")
    exit(1)


class IntelScraper:
    """Intelligent scraper using Crawl4AI"""
    
    def __init__(self, output_base_dir: str = "INTEL_SCRAPING"):
        self.output_base_dir = Path(output_base_dir)
        self.output_base_dir.mkdir(exist_ok=True)
        
        # Source categories with URLs
        self.sources = {
            "immigration": [
                "https://www.imigrasi.go.id",
                "https://www.thebalibible.com/visa-information",
                "https://www.bali.com/visa-requirements",
                # Add your 30+ immigration sources here
            ],
            "bkpm_tax": [
                "https://www.bkpm.go.id",
                "https://www.pajak.go.id",
                "https://kbli.kemenperin.go.id",
                # Add your 25+ BKPM/tax sources here
            ],
            "real_estate": [
                "https://www.balipropertywatch.com",
                "https://www.rumah123.com/bali",
                # Add your 20+ real estate sources here
            ],
            "events": [
                "https://www.balievents.com",
                "https://www.timeout.com/bali",
                # Add your 15+ event sources here
            ],
            "social_trends": [
                "https://twitter.com/search?q=bali%20expat",
                "https://www.reddit.com/r/bali",
                # Add your 10+ social sources here
            ],
            "competitors": [
                "https://www.balizero.com",  # Example competitor
                # Add your 10+ competitor sources here
            ],
            "bali_news": [
                "https://www.thejakartapost.com/bali",
                "https://coconuts.co/bali",
                # Add your 10+ news sources here
            ],
            "weekly_roundup": [
                # Special sources for weekly deep-dive
                "https://www.indonesia.go.id",
                # Add your 20+ roundup sources here
            ]
        }
    
    async def scrape_url(self, url: str, category: str) -> Optional[Dict]:
        """
        Scrape a single URL using Crawl4AI
        
        Args:
            url: URL to scrape
            category: Category name (e.g., 'immigration')
            
        Returns:
            Dict with scraped data or None if failed
        """
        try:
            async with AsyncWebCrawler(verbose=False) as crawler:
                # Crawl with AI-powered extraction
                result = await crawler.arun(
                    url=url,
                    # Extraction strategy
                    extraction_strategy=CosineStrategy(
                        semantic_filter="immigration visa KITAS expat regulations policy",
                        word_count_threshold=10,
                        max_dist=0.2,
                        linkage_method='ward',
                        top_k=3
                    ),
                    # Chunking strategy
                    chunking_strategy=RegexChunking(),
                    # Other options
                    bypass_cache=False,
                    word_count_threshold=10,
                    remove_overlay_elements=True
                )
                
                if result.success:
                    # Extract metadata
                    metadata = {
                        "url": url,
                        "title": result.title or "Untitled",
                        "category": category,
                        "scraped_at": datetime.now().isoformat(),
                        "word_count": len(result.markdown.split()),
                        "links_count": len(result.links) if result.links else 0,
                        "content_hash": hashlib.md5(result.markdown.encode()).hexdigest()
                    }
                    
                    return {
                        "metadata": metadata,
                        "markdown": result.markdown,
                        "extracted_content": result.extracted_content,
                        "links": result.links[:10] if result.links else [],  # First 10 links
                        "media": result.media[:5] if result.media else []  # First 5 images
                    }
                else:
                    print(f"❌ Failed to scrape {url}: {result.error_message}")
                    return None
                    
        except Exception as e:
            print(f"❌ Error scraping {url}: {str(e)}")
            return None
    
    async def scrape_category(self, category: str, urls: List[str]) -> List[Dict]:
        """
        Scrape all URLs in a category
        
        Args:
            category: Category name
            urls: List of URLs to scrape
            
        Returns:
            List of scraped results
        """
        print(f"\n📥 Scraping category: {category} ({len(urls)} sources)")
        
        # Scrape all URLs concurrently
        tasks = [self.scrape_url(url, category) for url in urls]
        results = await asyncio.gather(*tasks)
        
        # Filter out None results
        successful = [r for r in results if r is not None]
        
        print(f"✅ Scraped {len(successful)}/{len(urls)} sources successfully")
        
        return successful
    
    def save_results(self, category: str, results: List[Dict]):
        """
        Save scraped results to files
        
        Args:
            category: Category name
            results: List of scraped results
        """
        category_dir = self.output_base_dir / category / "raw"
        category_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y-%m-%d")
        
        for result in results:
            metadata = result['metadata']
            
            # Create safe filename from title
            safe_title = "".join(c for c in metadata['title'] if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_title = safe_title[:100]  # Limit length
            
            # Save markdown content
            md_filename = f"{timestamp}_{safe_title}.md"
            md_path = category_dir / md_filename
            
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(f"# {metadata['title']}\n\n")
                f.write(f"**Source**: {metadata['url']}\n")
                f.write(f"**Scraped**: {metadata['scraped_at']}\n")
                f.write(f"**Category**: {metadata['category']}\n\n")
                f.write("---\n\n")
                f.write(result['markdown'])
            
            # Save metadata as JSON
            json_filename = f"{timestamp}_{safe_title}.meta.json"
            json_path = category_dir / json_filename
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump({
                    **metadata,
                    'extracted_content': result.get('extracted_content'),
                    'links': result.get('links', []),
                    'media': result.get('media', [])
                }, f, indent=2, ensure_ascii=False)
            
            print(f"  💾 Saved: {md_filename}")
    
    async def run_daily_scraping(self):
        """
        Run daily scraping for all categories
        """
        print("\n🚀 Starting Daily Intel Scraping")
        print("=" * 60)
        
        total_sources = sum(len(urls) for urls in self.sources.values())
        print(f"📊 Total sources to scrape: {total_sources}")
        print(f"📁 Output directory: {self.output_base_dir.absolute()}")
        
        start_time = datetime.now()
        
        # Scrape each category
        for category, urls in self.sources.items():
            results = await self.scrape_category(category, urls)
            
            if results:
                self.save_results(category, results)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "=" * 60)
        print(f"✅ Scraping completed in {duration:.1f} seconds")
        print(f"📊 Average: {duration/total_sources:.2f} sec/source")
        print(f"📁 Results saved to: {self.output_base_dir.absolute()}")
    
    async def run_weekly_roundup(self):
        """
        Run special weekly roundup scraping (more comprehensive)
        """
        print("\n🎯 Starting Weekly Intelligence Roundup")
        print("=" * 60)
        
        # Use all sources for weekly roundup
        all_urls = []
        for urls in self.sources.values():
            all_urls.extend(urls)
        
        results = await self.scrape_category("weekly_roundup", all_urls)
        
        if results:
            self.save_results("weekly_roundup", results)
        
        print("✅ Weekly roundup completed")


async def main():
    """Main entry point"""
    import sys
    
    scraper = IntelScraper()
    
    # Check command line args
    if len(sys.argv) > 1 and sys.argv[1] == "--weekly":
        await scraper.run_weekly_roundup()
    else:
        await scraper.run_daily_scraping()


if __name__ == "__main__":
    # Run the scraper
    asyncio.run(main())

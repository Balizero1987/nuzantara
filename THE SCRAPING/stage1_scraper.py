#!/usr/bin/env python3
"""
STAGE 1: Web Scraping with Crawl4AI
Automated intelligent web scraping for all categories
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import logging

try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
    from crawl4ai.async_configs import CrawlerRunConfig
except ImportError:
    print("⚠️ Crawl4AI not installed. Installing...")
    os.system("pip install crawl4ai playwright")
    os.system("playwright install")
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class IntelScraper:
    """Main scraper class using Crawl4AI"""
    
    def __init__(self, base_dir: str = "./INTEL_SCRAPING"):
        self.base_dir = Path(base_dir)
        self.profiles_dir = Path("./profiles")
        self.logs_dir = Path("./logs")
        self.data_dir = Path("./data")
        
        # Create directories
        for dir_path in [self.base_dir, self.profiles_dir, self.logs_dir, self.data_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # Load categories
        with open(self.profiles_dir / "categories.json") as f:
            self.categories = json.load(f)
        
        logger.info(f"✅ IntelScraper initialized with {len(self.categories)} categories")
    
    async def scrape_url(self, url: str, category: str) -> Optional[Dict]:
        """Scrape a single URL using Crawl4AI"""
        try:
            browser_config = BrowserConfig(
                headless=True,
                verbose=False
            )
            
            run_config = CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
                wait_for_images=False,
                word_count_threshold=50,  # Minimum words to consider content valid
                page_timeout=30000,  # 30 seconds
                excluded_tags=['nav', 'footer', 'aside', 'script', 'style'],
                remove_overlay_elements=True
            )
            
            async with AsyncWebCrawler(config=browser_config) as crawler:
                result = await crawler.arun(
                    url=url,
                    config=run_config
                )
                
                if result.success:
                    # Extract clean content
                    # Handle new markdown API (raw_markdown property)
                    markdown_content = ""
                    if hasattr(result.markdown, 'raw_markdown'):
                        markdown_content = result.markdown.raw_markdown
                    elif isinstance(result.markdown, str):
                        markdown_content = result.markdown
                    else:
                        markdown_content = str(result.markdown)
                    
                    # Safely extract links
                    links = []
                    if hasattr(result, 'links') and result.links:
                        if isinstance(result.links, dict):
                            links = list(result.links.values())[:20] if result.links else []
                        elif isinstance(result.links, list):
                            links = result.links[:20]
                    
                    # Safely extract images
                    images = []
                    if hasattr(result, 'media') and result.media:
                        images = result.media.get("images", [])[:5]
                    
                    content = {
                        "url": url,
                        "title": result.metadata.get("title", "") if result.metadata else "",
                        "description": result.metadata.get("description", "") if result.metadata else "",
                        "content": markdown_content,
                        "html": result.html[:1000] if result.html else "",
                        "links": links,
                        "images": images,
                        "scraped_at": datetime.now().isoformat(),
                        "category": category,
                        "word_count": len(markdown_content.split()) if markdown_content else 0
                    }
                    
                    logger.info(f"✅ Scraped: {url} ({content['word_count']} words)")
                    return content
                else:
                    logger.error(f"❌ Failed to scrape: {url} - {result.error_message}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error scraping {url}: {str(e)}")
            return None
    
    async def scrape_category(self, category_name: str, limit: Optional[int] = None) -> List[Dict]:
        """Scrape all seed sites for a category"""
        category = self.categories.get(category_name)
        if not category:
            logger.error(f"❌ Category not found: {category_name}")
            return []
        
        seed_sites = category["seed_sites"]
        if limit:
            seed_sites = seed_sites[:limit]
        
        logger.info(f"🕷️ Scraping {category_name}: {len(seed_sites)} sites")
        
        results = []
        for url in seed_sites:
            content = await self.scrape_url(url, category_name)
            if content:
                results.append(content)
                # Save immediately
                self.save_scraped_content(category_name, content)
            
            # Small delay to be respectful
            await asyncio.sleep(2)
        
        logger.info(f"✅ Completed {category_name}: {len(results)}/{len(seed_sites)} successful")
        return results
    
    def save_scraped_content(self, category: str, content: Dict) -> None:
        """Save scraped content to category folder"""
        category_dir = self.base_dir / category
        category_dir.mkdir(exist_ok=True)
        
        # Generate filename from URL
        from urllib.parse import urlparse
        domain = urlparse(content["url"]).netloc.replace("www.", "")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{domain}_{timestamp}.json"
        
        filepath = category_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Saved: {filepath}")
    
    async def scrape_all(self, limit_per_category: Optional[int] = None) -> Dict:
        """Scrape all categories"""
        logger.info("🚀 Starting full scrape of all categories...")
        start_time = datetime.now()
        
        results = {}
        for category_name in self.categories.keys():
            category_results = await self.scrape_category(category_name, limit=limit_per_category)
            results[category_name] = category_results
        
        duration = (datetime.now() - start_time).total_seconds()
        
        # Save summary
        summary = {
            "started_at": start_time.isoformat(),
            "completed_at": datetime.now().isoformat(),
            "duration_seconds": duration,
            "categories_scraped": len(results),
            "total_pages": sum(len(r) for r in results.values()),
            "results_by_category": {
                cat: len(res) for cat, res in results.items()
            }
        }
        
        summary_file = self.logs_dir / f"scrape_summary_{start_time.strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"✅ Full scrape complete: {summary['total_pages']} pages in {duration:.0f}s")
        logger.info(f"📊 Summary saved: {summary_file}")
        
        return summary


async def main():
    """Main entry point for CLI usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="STAGE 1: Intelligence Scraper")
    parser.add_argument("--category", "-c", help="Scrape specific category only")
    parser.add_argument("--limit", "-l", type=int, help="Limit number of sites per category")
    parser.add_argument("--test", action="store_true", help="Test mode: scrape 1 site per category")
    
    args = parser.parse_args()
    
    scraper = IntelScraper()
    
    if args.test:
        print("🧪 TEST MODE: Scraping 1 site per category...")
        summary = await scraper.scrape_all(limit_per_category=1)
    elif args.category:
        print(f"🕷️ Scraping category: {args.category}")
        results = await scraper.scrape_category(args.category, limit=args.limit)
        print(f"✅ Scraped {len(results)} pages")
    else:
        print("🚀 Full scrape of all categories...")
        summary = await scraper.scrape_all(limit_per_category=args.limit)
    
    print("\n✅ Scraping complete!")


if __name__ == "__main__":
    asyncio.run(main())

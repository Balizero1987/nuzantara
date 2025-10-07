#!/usr/bin/env python3
"""
STAGE 2: SCRAPING with Crawl4AI
=================================

Reads source configs from JSON and scrapes all 161 seed sites.
Outputs markdown files ready for LLAMA processing.

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
except ImportError:
    print("❌ Crawl4AI not installed. Run: pip install 'crawl4ai[all]'")
    exit(1)


class IntelScraper:
    """Intelligent scraper using Crawl4AI"""
    
    def __init__(self, 
                 sources_dir: str = "THE SCRAPING/sources",
                 output_dir: str = "THE SCRAPING/scraped"):
        self.sources_dir = Path(sources_dir)
        self.output_dir = Path(output_dir)
        
        # Load all source configs
        self.categories = self.load_source_configs()
        
        print(f"✅ Loaded {len(self.categories)} category configs")
    
    def load_source_configs(self) -> Dict:
        """Load all JSON source configurations"""
        
        categories = {}
        
        # Load Bali/Indonesia configs
        bali_dir = self.sources_dir / "bali_indonesia"
        if bali_dir.exists():
            for json_file in sorted(bali_dir.glob("*.json")):
                config = json.loads(json_file.read_text())
                category_id = config['category_id']
                categories[category_id] = config
        
        # Load Global Intelligence configs
        global_dir = self.sources_dir / "global_intelligence"
        if global_dir.exists():
            for json_file in sorted(global_dir.glob("*.json")):
                config = json.loads(json_file.read_text())
                category_id = config['category_id']
                categories[category_id] = config
        
        return categories
    
    def extract_urls_from_config(self, config: Dict) -> List[Dict]:
        """Extract all URLs from a config with metadata"""
        
        urls = []
        
        # Iterate through all tier keys
        for key, value in config.items():
            if key.startswith('tier') and isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and 'url' in item:
                        urls.append({
                            'url': item['url'],
                            'name': item.get('name', 'Unknown'),
                            'language': item.get('language', 'unknown'),
                            'priority': item.get('priority', 'medium'),
                            'tier': key
                        })
        
        # Handle direct_competitors (for category 06)
        if 'direct_competitors' in config:
            for item in config['direct_competitors']:
                if 'url' in item:
                    urls.append({
                        'url': item['url'],
                        'name': item.get('name', 'Unknown'),
                        'language': item.get('language', 'en'),
                        'priority': item.get('priority', 'high'),
                        'tier': 'competitors'
                    })
        
        return urls
    
    async def scrape_url(self, url_info: Dict, category_id: str, category_name: str) -> Optional[Dict]:
        """
        Scrape a single URL using Crawl4AI
        
        Args:
            url_info: Dict with url and metadata
            category_id: Category ID (e.g., '01_immigration')
            category_name: Category display name
            
        Returns:
            Dict with scraped data or None if failed
        """
        
        url = url_info['url']
        
        try:
            async with AsyncWebCrawler(
                verbose=False,
                headless=True
            ) as crawler:
                
                # Simple scraping (no complex strategies for speed)
                result = await crawler.arun(
                    url=url,
                    word_count_threshold=10,
                    remove_overlay_elements=True,
                    bypass_cache=True  # Always fresh content
                )
                
                if result.success:
                    # Extract metadata
                    metadata = {
                        "url": url,
                        "source_name": url_info.get('name', 'Unknown'),
                        "title": result.title or url_info.get('name', 'Untitled'),
                        "category": category_id,
                        "category_name": category_name,
                        "language": url_info.get('language', 'unknown'),
                        "priority": url_info.get('priority', 'medium'),
                        "tier": url_info.get('tier', 'unknown'),
                        "scraped_at": datetime.now().isoformat(),
                        "word_count": len(result.markdown.split()),
                        "content_hash": hashlib.md5(result.markdown.encode()).hexdigest()
                    }
                    
                    return {
                        "metadata": metadata,
                        "markdown": result.markdown,
                        "links": result.links[:10] if result.links else [],
                        "media": result.media[:5] if result.media else []
                    }
                else:
                    print(f"  ❌ Failed: {url_info['name']} - {result.error_message}")
                    return None
                    
        except Exception as e:
            print(f"  ❌ Error: {url_info['name']} - {str(e)[:50]}")
            return None
    
    async def scrape_category(self, category_id: str, config: Dict) -> List[Dict]:
        """
        Scrape all URLs in a category
        
        Args:
            category_id: Category ID
            config: Category configuration
            
        Returns:
            List of scraped results
        """
        
        category_name = config.get('category_name', category_id)
        pipeline = config.get('pipeline', 'public')
        
        # Extract all URLs from config
        url_infos = self.extract_urls_from_config(config)
        
        if not url_infos:
            print(f"⚠️  No URLs found in {category_id}")
            return []
        
        print(f"\n📥 Scraping: {category_name} ({len(url_infos)} sources, {pipeline})")
        
        # Scrape with concurrency limit (5 at a time to be polite)
        results = []
        semaphore = asyncio.Semaphore(5)
        
        async def scrape_with_limit(url_info):
            async with semaphore:
                return await self.scrape_url(url_info, category_id, category_name)
        
        tasks = [scrape_with_limit(url_info) for url_info in url_infos]
        results = await asyncio.gather(*tasks)
        
        # Filter out None results
        successful = [r for r in results if r is not None]
        
        print(f"  ✅ Success: {len(successful)}/{len(url_infos)} sources")
        
        return successful
    
    def save_results(self, category_id: str, results: List[Dict]):
        """
        Save scraped results to files
        
        Args:
            category_id: Category ID
            results: List of scraped results
        """
        
        category_dir = self.output_dir / category_id / "raw"
        category_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y-%m-%d")
        
        for result in results:
            metadata = result['metadata']
            
            # Create safe filename from source name
            safe_name = "".join(c for c in metadata['source_name'] if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_name = safe_name[:50]  # Limit length
            
            # Save markdown content
            md_filename = f"{timestamp}_{safe_name}.md"
            md_path = category_dir / md_filename
            
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(f"# {metadata['title']}\n\n")
                f.write(f"**Source**: {metadata['url']}\n")
                f.write(f"**Scraped**: {metadata['scraped_at']}\n")
                f.write(f"**Category**: {metadata['category']}\n")
                f.write(f"**Language**: {metadata['language']}\n\n")
                f.write("---\n\n")
                f.write(result['markdown'])
            
            # Save metadata as JSON
            json_filename = f"{timestamp}_{safe_name}.meta.json"
            json_path = category_dir / json_filename
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump({
                    **metadata,
                    'links': result.get('links', []),
                    'media': result.get('media', [])
                }, f, indent=2, ensure_ascii=False)
            
            print(f"    💾 {safe_name[:40]}...")
    
    async def scrape_all(self):
        """Scrape all categories"""
        
        print("\n🚀 Starting Intel Scraping - All 14 Categories")
        print("=" * 60)
        
        total_urls = sum(
            len(self.extract_urls_from_config(config)) 
            for config in self.categories.values()
        )
        
        print(f"📊 Total sources: {total_urls} across {len(self.categories)} categories")
        print(f"📁 Output: {self.output_dir.absolute()}")
        
        start_time = datetime.now()
        
        # Scrape each category
        total_success = 0
        for category_id in sorted(self.categories.keys()):
            config = self.categories[category_id]
            results = await self.scrape_category(category_id, config)
            
            if results:
                self.save_results(category_id, results)
                total_success += len(results)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "=" * 60)
        print(f"✅ Scraping complete!")
        print(f"📊 Scraped: {total_success}/{total_urls} sources ({total_success/total_urls*100:.1f}%)")
        print(f"⏱️  Duration: {duration:.1f}s ({duration/total_urls:.1f}s per source)")
        print(f"📁 Output: {self.output_dir.absolute()}")
        
        # Summary by pipeline
        print("\n📈 By Pipeline:")
        for category_id, config in self.categories.items():
            pipeline = config.get('pipeline', 'public')
            category_name = config.get('category_name', category_id)
            
            category_files = list((self.output_dir / category_id / "raw").glob("*.md"))
            print(f"  • {category_name}: {len(category_files)} files ({pipeline})")
    
    async def scrape_single_category(self, category_id: str):
        """Scrape a single category by ID"""
        
        if category_id not in self.categories:
            print(f"❌ Category {category_id} not found")
            print(f"Available: {', '.join(self.categories.keys())}")
            return
        
        config = self.categories[category_id]
        results = await self.scrape_category(category_id, config)
        
        if results:
            self.save_results(category_id, results)


async def main():
    """Main entry point"""
    import sys
    
    scraper = IntelScraper()
    
    # Check command line args
    if len(sys.argv) > 1:
        category_id = sys.argv[1]
        await scraper.scrape_single_category(category_id)
    else:
        await scraper.scrape_all()


if __name__ == "__main__":
    asyncio.run(main())

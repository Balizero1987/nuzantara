"""
BALI ZERO INTEL SCRAPER - Unified Multi-Category Scraper
Target: Expat & Indonesian Business Community
Cost: ~$0.0004 per article (91% cheaper than Claude-only)
"""

import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
from typing import List, Dict, Any
import hashlib
from pathlib import Path
from loguru import logger

# Configure logging
logger.add("logs/scraper_{time}.log", rotation="1 day", retention="7 days")


class BaliZeroScraper:
    """Unified scraper for Bali Zero Intelligence System"""

    def __init__(self, config_path: str = "config/categories.json"):
        self.config_path = Path(config_path)
        self.config = self.load_config()
        self.output_dir = Path("data/raw")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Cache for deduplication
        self.cache_file = Path("data/scraper_cache.json")
        self.seen_hashes = self.load_cache()

        logger.info(
            f"Initialized Bali Zero Scraper with {self.config['total_categories']} categories"
        )

    def load_config(self) -> Dict:
        """Load scraper configuration"""
        with open(self.config_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_cache(self) -> set:
        """Load seen content hashes"""
        if self.cache_file.exists():
            with open(self.cache_file, "r") as f:
                return set(json.load(f))
        return set()

    def save_cache(self):
        """Save seen content hashes"""
        with open(self.cache_file, "w") as f:
            json.dump(list(self.seen_hashes), f)

    def content_hash(self, content: str) -> str:
        """Generate hash for content deduplication"""
        return hashlib.md5(content.encode()).hexdigest()

    def scrape_source(self, source: Dict, category: str) -> List[Dict[str, Any]]:
        """Scrape a single source"""
        logger.info(f"[{category}] Scraping {source['name']} (Tier {source['tier']})")

        items = []

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }

            response = requests.get(source["url"], headers=headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Try each selector
            for selector in source["selectors"]:
                elements = soup.select(selector)

                for elem in elements[:10]:  # Max 10 per selector
                    # Extract title
                    title_elem = elem.find(["h1", "h2", "h3", "h4", "a"])
                    if not title_elem:
                        continue

                    title = title_elem.get_text(strip=True)

                    # Extract content
                    content_elem = elem.find(["p", "div.content", "div.summary"])
                    content = (
                        content_elem.get_text(strip=True)
                        if content_elem
                        else elem.get_text(strip=True)
                    )

                    # Extract link
                    link_elem = elem.find("a")
                    link = (
                        link_elem["href"]
                        if link_elem and "href" in link_elem.attrs
                        else source["url"]
                    )

                    # Make link absolute
                    if link.startswith("/"):
                        from urllib.parse import urljoin

                        link = urljoin(source["url"], link)

                    # Minimum content length
                    if len(content) < 100:
                        continue

                    # Check if already seen
                    content_id = self.content_hash(title + content[:500])
                    if content_id in self.seen_hashes:
                        continue

                    items.append(
                        {
                            "title": title,
                            "content": content,
                            "url": link,
                            "source": source["name"],
                            "tier": source["tier"],
                            "category": category,
                            "scraped_at": datetime.now().isoformat(),
                            "content_id": content_id,
                        }
                    )

                    self.seen_hashes.add(content_id)

                if items:
                    break  # Found items with this selector

            logger.info(
                f"[{category}] Found {len(items)} new items from {source['name']}"
            )
            return items

        except Exception as e:
            logger.error(f"[{category}] Error scraping {source['name']}: {e}")
            return []

    def scrape_category(self, category_key: str, limit: int = 10) -> int:
        """Scrape all sources for a category"""

        if category_key not in self.config["categories"]:
            logger.error(f"Category '{category_key}' not found in config")
            return 0

        category = self.config["categories"][category_key]
        logger.info(
            f"📰 Scraping category: {category['name']} (Priority: {category['priority']})"
        )

        total_items = 0

        for source in category["sources"]:
            items = self.scrape_source(source, category_key)

            # Save each item
            for item in items:
                self.save_raw_item(item, category_key)
                total_items += 1

                if total_items >= limit:
                    logger.info(f"[{category_key}] Reached limit of {limit} items")
                    break

            if total_items >= limit:
                break

            time.sleep(3)  # Rate limiting between sources

        logger.success(f"[{category_key}] Scraped {total_items} items total")
        return total_items

    def save_raw_item(self, item: Dict, category: str):
        """Save raw scraped item to file"""

        # Create category directory
        category_dir = self.output_dir / category
        category_dir.mkdir(exist_ok=True)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        source_slug = item["source"].replace(" ", "_").replace("/", "_")
        filename = f"{timestamp}_{source_slug}.md"

        filepath = category_dir / filename

        # Format as markdown
        content = f"""---
title: {item['title']}
source: {item['source']}
tier: {item['tier']}
category: {item['category']}
url: {item['url']}
scraped_at: {item['scraped_at']}
content_id: {item['content_id']}
---

# {item['title']}

**Source:** {item['source']} ({item['tier']})
**URL:** {item['url']}
**Scraped:** {item['scraped_at']}

---

{item['content']}
"""

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        logger.debug(f"Saved: {filepath}")

    def scrape_all_categories(self, limit: int = 10, categories: List[str] = None):
        """Scrape all categories or specific ones"""

        logger.info("=" * 70)
        logger.info("🚀 BALI ZERO INTEL SCRAPER - Starting Full Scraping Cycle")
        logger.info("=" * 70)

        start_time = time.time()

        # Determine which categories to scrape
        if categories:
            category_keys = [k for k in categories if k in self.config["categories"]]
        else:
            category_keys = list(self.config["categories"].keys())

        logger.info(f"📋 Scraping {len(category_keys)} categories")

        total_scraped = 0
        results = {}

        for category_key in category_keys:
            count = self.scrape_category(category_key, limit=limit)
            results[category_key] = count
            total_scraped += count

            time.sleep(5)  # Rate limiting between categories

        # Save cache
        self.save_cache()

        # Summary
        duration = time.time() - start_time

        logger.info("=" * 70)
        logger.info("✅ SCRAPING COMPLETE")
        logger.info(f"📊 Total Items: {total_scraped}")
        logger.info(f"⏱️  Duration: {duration:.1f}s")
        logger.info(f"📁 Output: {self.output_dir}")
        logger.info("=" * 70)

        # Print results per category
        for category, count in results.items():
            logger.info(f"  {category:25s} → {count:3d} items")

        return {
            "success": True,
            "total_scraped": total_scraped,
            "duration_seconds": duration,
            "categories": results,
            "output_dir": str(self.output_dir),
        }


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Bali Zero Intel Scraper")
    parser.add_argument("--categories", nargs="+", help="Specific categories to scrape")
    parser.add_argument("--limit", type=int, default=10, help="Max items per category")
    parser.add_argument(
        "--config", default="config/categories.json", help="Config file path"
    )

    args = parser.parse_args()

    scraper = BaliZeroScraper(config_path=args.config)
    results = scraper.scrape_all_categories(
        limit=args.limit, categories=args.categories
    )

    print(
        f"\n✅ Scraping complete: {results['total_scraped']} items in {results['duration_seconds']:.1f}s"
    )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Intel Automation - Stage 1: Web Scraping  
Scrapes all sites from SITI_*.txt files using Playwright.
Output: Raw markdown files in INTEL_SCRAPING/{category}/raw/{timestamp}_{site}.md
"""

import asyncio
import hashlib
import json
import logging
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set
from urllib.parse import urlparse

# Try to import playwright
try:
    from playwright.async_api import async_playwright, Browser, Page
except ImportError as e:
    print(f"ERROR: Missing playwright. Install with: pip install playwright")
    print(f"Then run: playwright install chromium")
    sys.exit(1)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
SITES_DIR = SCRIPT_DIR / "INTEL_SCRAPING" / "config"  # FIXED: Correct path for SITI_*.txt files
OUTPUT_BASE = SCRIPT_DIR / "INTEL_SCRAPING"

# Scraping settings
MAX_CONCURRENT = 12  # Concurrent scrapes per category (increased for speed)
TIMEOUT_MS = 20000   # 20 seconds per page (reduced to avoid slow sites)
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Quality filters
MAX_NEWS_AGE_DAYS = 5  # Max age for news articles
MIN_WORD_COUNT = 100   # Minimum word count
MIN_CONTENT_CHARS = 200  # Minimum character count


# Deduplication cache
CACHE_FILE = SCRIPT_DIR / "scraper_cache.json"


class ContentDeduplicator:
    """Deduplication cache to avoid processing same content twice"""

    def __init__(self):
        self.seen_hashes: Set[str] = set()

        # Load cache
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, 'r') as f:
                    data = json.load(f)
                    self.seen_hashes = set(data.get("seen_hashes", []))
                logger.info(f"Loaded {len(self.seen_hashes)} cached hashes")
            except Exception as e:
                logger.warning(f"Failed to load cache: {e}")

    def is_duplicate(self, content: str) -> bool:
        """Check if content has been seen before"""
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        return content_hash in self.seen_hashes

    def add(self, content: str):
        """Mark content as seen"""
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        self.seen_hashes.add(content_hash)

    def save(self):
        """Save cache to disk"""
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump({"seen_hashes": list(self.seen_hashes)}, f)
            logger.info(f"Saved {len(self.seen_hashes)} hashes to cache")
        except Exception as e:
            logger.error(f"Failed to save cache: {e}")


def passes_quality_filters(content: str, title: str = "") -> tuple[bool, str]:
    """Check if content passes quality filters"""

    # Character count check
    if len(content) < MIN_CONTENT_CHARS:
        return False, f"Too short: {len(content)} < {MIN_CONTENT_CHARS} chars"

    # Word count check
    word_count = len(content.split())
    if word_count < MIN_WORD_COUNT:
        return False, f"Word count too low: {word_count} < {MIN_WORD_COUNT}"

    # Check for meaningful content (not just navigation/boilerplate)
    if content.count('\n') / max(len(content), 1) > 0.1:  # Too many newlines = menu/nav
        return False, "Too fragmented (likely navigation)"

    return True, "OK"


def parse_siti_file(siti_file: Path) -> List[Dict[str, str]]:
    """Parse SITI_*.txt file and extract site entries."""
    if not siti_file.exists():
        logger.warning(f"SITI file not found: {siti_file}")
        return []

    content = siti_file.read_text(encoding='utf-8')
    sites = []

    lines = content.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Check if this is a site entry header (starts with number.)
        if line and line[0].isdigit() and '.' in line[:4]:
            # Extract name
            name_match = re.search(r'^\d+\.\s*[^\w\s]*\s*(.+?)(?:\s*-\s*https?://|\s*$)', line)
            if name_match:
                name = name_match.group(1).strip()
            else:
                name = re.sub(r'^\d+\.\s*[^\w\s]*\s*', '', line).strip()

            # Look for URL in next few lines
            url = None
            description = None

            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j].strip()

                if '🔗' in next_line or next_line.startswith('http'):
                    url_match = re.search(r'https?://[^\s]+', next_line)
                    if url_match:
                        url = url_match.group(0).strip()

                if '📝' in next_line:
                    description = next_line.replace('📝', '').strip()

            # Check if URL is in the same line as name
            if not url:
                url_match = re.search(r'https?://[^\s]+', line)
                if url_match:
                    url = url_match.group(0).strip()

            if url:
                sites.append({
                    'name': name,
                    'url': url,
                    'description': description or ''
                })

        i += 1

    logger.info(f"Parsed {len(sites)} sites from {siti_file.name}")
    return sites


async def scrape_site(site: Dict[str, str], category: str, browser: Browser) -> Optional[Dict]:
    """Scrape a single site using Playwright."""
    url = site['url']
    name = site['name']

    try:
        logger.info(f"[{category.upper()}] Scraping {name}")

        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={'width': 1920, 'height': 1080}
        )

        page = await context.new_page()

        # Navigate to page (use 'load' instead of 'networkidle' for speed)
        await page.goto(url, timeout=TIMEOUT_MS, wait_until='load')

        # Wait for dynamic content (reduced from 2s to 500ms)
        await page.wait_for_timeout(500)

        # Extract text content
        content = await page.evaluate('''() => {
            const unwanted = document.querySelectorAll('script, style, noscript, iframe');
            unwanted.forEach(el => el.remove());

            const selectors = [
                'article',
                'main',
                '[role="main"]',
                '.content',
                '.main-content',
                '#content',
                'body'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.innerText;
                }
            }

            return document.body.innerText;
        }''')

        # Get page title
        title = await page.title()

        await context.close()

        # Clean content
        content = content.strip()

        # Quality filter check
        passes, reason = passes_quality_filters(content, title)
        if not passes:
            logger.warning(f"[{category.upper()}] {name}: FILTERED - {reason}")
            return None

        logger.info(f"[{category.upper()}] ✓ {name}: {len(content)} chars, {len(content.split())} words")

        return {
            'site': name,
            'category': category,
            'url': url,
            'title': title,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'success': True
        }

    except Exception as e:
        logger.error(f"[{category.upper()}] ✗ {name}: {str(e)}")
        return None


async def scrape_category(category_key: str, sites: List[Dict], browser: Browser, dedup: ContentDeduplicator) -> List[Dict]:
    """Scrape all sites for a category with concurrency control and deduplication."""
    results = []

    # Process in batches
    for i in range(0, len(sites), MAX_CONCURRENT):
        batch = sites[i:i + MAX_CONCURRENT]
        tasks = [scrape_site(site, category_key, browser) for site in batch]
        batch_results = await asyncio.gather(*tasks)

        # Filter duplicates and add to results
        for result in batch_results:
            if result is not None:
                content = result.get('content', '')

                # Deduplication check
                if dedup.is_duplicate(content):
                    logger.info(f"[{category_key.upper()}] DUPLICATE skipped: {result['site']}")
                    continue

                dedup.add(content)
                results.append(result)

        # No delay between batches - speed up scraping

    return results


def save_results(results: List[Dict], category: str):
    """Save scraping results as markdown files."""
    output_dir = OUTPUT_BASE / category / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    for result in results:
        if not result.get('success'):
            continue

        # Clean site name for filename
        site_name = re.sub(r'[^\w\s-]', '', result['site'])
        site_name = re.sub(r'[-\s]+', '_', site_name)

        filename = f"{timestamp}_{site_name}.md"
        filepath = output_dir / filename

        # Create markdown content
        md_content = f"""# {result['title']}

**Source**: {result['site']}
**URL**: {result['url']}
**Scraped**: {result['timestamp']}
**Category**: {category}

---

{result['content']}
"""

        filepath.write_text(md_content, encoding='utf-8')

    logger.info(f"[{category.upper()}] Saved {len([r for r in results if r.get('success')])} files to {output_dir}")


async def main(category_filter: Optional[List[str]] = None):
    """Main scraping orchestrator.

    Args:
        category_filter: Optional list of category keys to scrape (e.g. ['immigration', 'tax'])
                        If None, scrapes all categories.
    """
    logger.info("=" * 70)
    logger.info("INTEL AUTOMATION - STAGE 1: SCRAPING")
    logger.info(f"Starting at: {datetime.now()}")
    if category_filter:
        logger.info(f"Category filter: {', '.join(category_filter)}")
    logger.info(f"Quality filters: MAX_AGE={MAX_NEWS_AGE_DAYS}d, MIN_WORDS={MIN_WORD_COUNT}, MIN_CHARS={MIN_CONTENT_CHARS}")
    logger.info("=" * 70)

    # Initialize deduplicator
    dedup = ContentDeduplicator()

    # Find all SITI_*.txt files
    siti_files = sorted(SITES_DIR.glob("SITI_*.txt"))

    if not siti_files:
        logger.error(f"No SITI_*.txt files found in {SITES_DIR}")
        logger.info(f"Please run: python3 scripts/generate_siti_files.py")
        return 1

    logger.info(f"Found {len(siti_files)} category files")

    # Launch browser
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        total_scraped = 0
        total_failed = 0

        # Process each category
        for siti_file in siti_files:
            # Extract category key from filename
            # SITI_ADIT_IMMIGRATION.txt -> immigration
            category_match = re.search(r'SITI_[^_]+_(.+)\.txt', siti_file.name)
            if category_match:
                category = category_match.group(1).lower()
            else:
                category = siti_file.stem.replace('SITI_', '').lower()

            # Skip if category filter is active and this category is not in it
            if category_filter and category not in category_filter:
                logger.debug(f"Skipping category: {category} (not in filter)")
                continue

            logger.info(f"Starting category: {category}")

            # Parse sites
            sites = parse_siti_file(siti_file)

            if not sites:
                logger.warning(f"No sites found in {siti_file.name}")
                continue

            # Scrape category
            results = await scrape_category(category, sites, browser, dedup)

            # Save results
            save_results(results, category)

            # Update stats
            successful = len([r for r in results if r.get('success')])
            failed = len([r for r in results if not r.get('success')])
            total_scraped += successful
            total_failed += failed

            logger.info(f"[{category.upper()}] Complete: {successful} success, {failed} failed")

        await browser.close()

    # Save deduplication cache
    dedup.save()

    # Final report
    logger.info("")
    logger.info("=" * 70)
    logger.info("SCRAPING COMPLETE")
    logger.info("=" * 70)
    logger.info(f"Total successful: {total_scraped}")
    logger.info(f"Total failed: {total_failed}")
    logger.info(f"Output directory: {OUTPUT_BASE}")
    logger.info("=" * 70)

    return 0 if total_scraped > 0 else 1


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Intel Automation - Stage 1: Scraping')
    parser.add_argument(
        '--categories',
        type=str,
        help='Comma-separated list of categories to scrape (e.g., "immigration,tax,business")'
    )

    args = parser.parse_args()

    category_filter = None
    if args.categories:
        category_filter = [cat.strip().lower() for cat in args.categories.split(',')]

    exit_code = asyncio.run(main(category_filter=category_filter))
    sys.exit(exit_code)

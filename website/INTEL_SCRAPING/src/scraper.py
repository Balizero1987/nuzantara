#!/usr/bin/env python3
"""
Intel Automation - Stage 1: Web Scraping  
Scrapes all sites from SITI_*.txt files using Playwright.
Output: Raw markdown files in INTEL_SCRAPING/{category}/raw/{timestamp}_{site}.md
"""

import asyncio
import logging
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
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
SITES_DIR = SCRIPT_DIR.parent / "config" / "sources"
DATA_DIR = SCRIPT_DIR.parent / "data"

# Scraping settings
MAX_CONCURRENT = 12  # Concurrent scrapes per category (increased for speed)
TIMEOUT_MS = 20000   # 20 seconds per page (reduced to avoid slow sites)
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def parse_siti_file(siti_file: Path) -> List[Dict[str, str]]:
    """Parse SITI_*.txt file and extract site entries.

    Supports two formats:
    1. Simple format: Just URLs, one per line (# for comments)
    2. Complex format: Numbered entries with metadata
    """
    if not siti_file.exists():
        logger.warning(f"SITI file not found: {siti_file}")
        return []

    content = siti_file.read_text(encoding='utf-8')
    sites = []

    for line in content.split('\n'):
        line = line.strip()

        # Skip empty lines and comments
        if not line or line.startswith('#'):
            continue

        # Extract URL from line
        url_match = re.search(r'(https?://[^\s]+)', line)
        if url_match:
            url = url_match.group(1).strip()

            # Extract domain for name
            parsed = urlparse(url)
            domain = parsed.netloc.replace('www.', '')
            name = domain.split('.')[0].title()

            sites.append({
                'name': name,
                'url': url,
                'description': ''
            })

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

        # Extract publication date from metadata (HTML meta tags, Schema.org, <time> tags)
        published_date = await page.evaluate('''() => {
            // Try meta tags (Open Graph, Article, Twitter, etc.)
            const metaSelectors = [
                'meta[property="article:published_time"]',
                'meta[property="og:published_time"]',
                'meta[name="publish-date"]',
                'meta[name="publishdate"]',
                'meta[name="date"]',
                'meta[name="publication-date"]',
                'meta[name="DC.date.issued"]',
                'meta[property="article:published"]',
                'meta[name="twitter:published_time"]'
            ];

            for (const selector of metaSelectors) {
                const meta = document.querySelector(selector);
                if (meta && meta.content) {
                    return meta.content;
                }
            }

            // Try <time> tags with datetime attribute
            const timeEl = document.querySelector('time[datetime]');
            if (timeEl && timeEl.getAttribute('datetime')) {
                return timeEl.getAttribute('datetime');
            }

            // Try Schema.org JSON-LD structured data
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data.datePublished) return data.datePublished;
                    if (data['@graph']) {
                        for (const item of data['@graph']) {
                            if (item.datePublished) return item.datePublished;
                        }
                    }
                } catch (e) {
                    // Invalid JSON, skip
                }
            }

            return null;
        }''')

        await context.close()

        # Clean content
        content = content.strip()

        if not content or len(content) < 100:
            logger.warning(f"[{category.upper()}] {name}: Content too short ({len(content)} chars)")
            return None

        # Log date extraction status
        if published_date:
            logger.info(f"[{category.upper()}] ✓ {name}: {len(content)} chars, date: {published_date}")
        else:
            logger.info(f"[{category.upper()}] ✓ {name}: {len(content)} chars, date: NOT FOUND")

        return {
            'site': name,
            'category': category,
            'url': url,
            'title': title,
            'content': content,
            'published_date': published_date,  # NEW: Extracted publication date
            'timestamp': datetime.now().isoformat(),
            'success': True
        }

    except Exception as e:
        logger.error(f"[{category.upper()}] ✗ {name}: {str(e)}")
        return None


async def scrape_category(category_key: str, sites: List[Dict], browser: Browser) -> List[Dict]:
    """Scrape all sites for a category with concurrency control."""
    results = []

    # Process in batches
    for i in range(0, len(sites), MAX_CONCURRENT):
        batch = sites[i:i + MAX_CONCURRENT]
        tasks = [scrape_site(site, category_key, browser) for site in batch]
        batch_results = await asyncio.gather(*tasks)
        results.extend([r for r in batch_results if r is not None])

        # No delay between batches - speed up scraping

    return results


def save_results(results: List[Dict], category: str, run_date: str):
    """Save scraping results as markdown files organized by date.

    Args:
        results: List of scraping results
        category: Category name (e.g., 'business', 'immigration')
        run_date: Date string in YYYY-MM-DD format
    """
    # Create dated directory structure: data/raw/YYYY-MM-DD/category/
    output_dir = DATA_DIR / "raw" / run_date / category
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
        published_date_str = result.get('published_date', 'Not found')
        md_content = f"""# {result['title']}

**Source**: {result['site']}
**URL**: {result['url']}
**Published**: {published_date_str}
**Scraped**: {result['timestamp']}
**Category**: {category}
**Run Date**: {run_date}

---

{result['content']}
"""

        filepath.write_text(md_content, encoding='utf-8')

    logger.info(f"[{category.upper()}] Saved {len([r for r in results if r.get('success')])} files to {output_dir}")


async def main(category_filter: Optional[List[str]] = None, run_date: Optional[str] = None):
    """Main scraping orchestrator.

    Args:
        category_filter: Optional list of category keys to scrape (e.g. ['immigration', 'tax'])
                        If None, scrapes all categories.
        run_date: Optional date string in YYYY-MM-DD format. If None, uses today's date.
    """
    # Get run date (today by default)
    if run_date is None:
        run_date = datetime.now().strftime('%Y-%m-%d')

    logger.info("=" * 70)
    logger.info("INTEL AUTOMATION - STAGE 1: SCRAPING")
    logger.info(f"Starting at: {datetime.now()}")
    logger.info(f"Run date: {run_date}")
    if category_filter:
        logger.info(f"Category filter: {', '.join(category_filter)}")
    logger.info("=" * 70)

    # Find all *.txt source files
    siti_files = sorted(SITES_DIR.glob("*.txt"))

    if not siti_files:
        logger.error(f"No *.txt source files found in {SITES_DIR}")
        return 1

    logger.info(f"Found {len(siti_files)} category files")

    # Launch browser
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        total_scraped = 0
        total_failed = 0

        # Process each category
        for siti_file in siti_files:
            # Extract category key from filename (e.g., business.txt -> business)
            category = siti_file.stem.lower()

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
            results = await scrape_category(category, sites, browser)

            # Save results to dated directory
            save_results(results, category, run_date)

            # Update stats
            successful = len([r for r in results if r.get('success')])
            failed = len([r for r in results if not r.get('success')])
            total_scraped += successful
            total_failed += failed

            logger.info(f"[{category.upper()}] Complete: {successful} success, {failed} failed")

        await browser.close()

    # Final report
    output_path = DATA_DIR / "raw" / run_date
    logger.info("")
    logger.info("=" * 70)
    logger.info("SCRAPING COMPLETE")
    logger.info("=" * 70)
    logger.info(f"Run date: {run_date}")
    logger.info(f"Total successful: {total_scraped}")
    logger.info(f"Total failed: {total_failed}")
    logger.info(f"Output directory: {output_path}")
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
    parser.add_argument(
        '--date',
        type=str,
        help='Run date in YYYY-MM-DD format (default: today)'
    )

    args = parser.parse_args()

    category_filter = None
    if args.categories:
        category_filter = [cat.strip().lower() for cat in args.categories.split(',')]

    run_date = args.date  # None if not specified (will use today)

    exit_code = asyncio.run(main(category_filter=category_filter, run_date=run_date))
    sys.exit(exit_code)

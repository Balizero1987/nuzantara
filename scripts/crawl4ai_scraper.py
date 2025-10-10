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
SITES_DIR = SCRIPT_DIR.parent / "apps" / "bali-intel-scraper" / "sites"
OUTPUT_BASE = SCRIPT_DIR / "INTEL_SCRAPING"

# Scraping settings
MAX_CONCURRENT = 3  # Concurrent scrapes per category
TIMEOUT_MS = 30000  # 30 seconds per page
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


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

        # Navigate to page
        await page.goto(url, timeout=TIMEOUT_MS, wait_until='networkidle')

        # Wait for dynamic content
        await page.wait_for_timeout(2000)

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

        if not content or len(content) < 100:
            logger.warning(f"[{category.upper()}] {name}: Content too short ({len(content)} chars)")
            return None

        logger.info(f"[{category.upper()}] ✓ {name}: {len(content)} chars")

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


async def scrape_category(category_key: str, sites: List[Dict], browser: Browser) -> List[Dict]:
    """Scrape all sites for a category with concurrency control."""
    results = []

    # Process in batches
    for i in range(0, len(sites), MAX_CONCURRENT):
        batch = sites[i:i + MAX_CONCURRENT]
        tasks = [scrape_site(site, category_key, browser) for site in batch]
        batch_results = await asyncio.gather(*tasks)
        results.extend([r for r in batch_results if r is not None])

        # Small delay between batches
        if i + MAX_CONCURRENT < len(sites):
            await asyncio.sleep(1)

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


async def main():
    """Main scraping orchestrator."""
    logger.info("=" * 70)
    logger.info("INTEL AUTOMATION - STAGE 1: SCRAPING")
    logger.info(f"Starting at: {datetime.now()}")
    logger.info("=" * 70)

    # Find all SITI_*.txt files
    siti_files = sorted(SITES_DIR.glob("SITI_*.txt"))

    if not siti_files:
        logger.error(f"No SITI_*.txt files found in {SITES_DIR}")
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

            logger.info(f"Starting category: {category}")

            # Parse sites
            sites = parse_siti_file(siti_file)

            if not sites:
                logger.warning(f"No sites found in {siti_file.name}")
                continue

            # Scrape category
            results = await scrape_category(category, sites, browser)

            # Save results
            save_results(results, category)

            # Update stats
            successful = len([r for r in results if r.get('success')])
            failed = len([r for r in results if not r.get('success')])
            total_scraped += successful
            total_failed += failed

            logger.info(f"[{category.upper()}] Complete: {successful} success, {failed} failed")

        await browser.close()

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
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

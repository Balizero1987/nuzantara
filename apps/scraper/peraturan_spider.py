"""
BPK Peraturan Legal Document Spider
Scrapes Indonesian legal documents from https://peraturan.bpk.go.id/ (JDIH BPK)

Features:
- Visits homepage and navigates via "Tahun" (Year) links
- Finds regulation detail pages via /Details/ links
- Extracts metadata: Title (Judul), Type (Jenis), Number (Nomor), Year (Tahun)
- Downloads PDFs from /Download/ links
- Saves PDFs to data/raw_laws/ with proper naming
- Rate limiting and polite delays
- Graceful error handling
"""

import asyncio
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse

import aiohttp
from fake_useragent import UserAgent
from playwright.async_api import async_playwright, Page
from loguru import logger

# Configure logging
logger.add("logs/peraturan_spider_{time}.log", rotation="1 day", retention="7 days")

# Configuration
BASE_URL = "https://peraturan.bpk.go.id"
HOME_URL = f"{BASE_URL}/"
DATA_DIR = Path(__file__).parent / "data"
RAW_LAWS_DIR = DATA_DIR / "raw_laws"
METADATA_FILE = DATA_DIR / "laws_metadata.jsonl"

# Rate limiting - polite 5 second delay
REQUEST_DELAY = 5.0

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 5.0


class PeraturanSpider:
    """Spider for scraping Indonesian legal documents from peraturan.bpk.go.id"""

    def __init__(self):
        self.data_dir = DATA_DIR
        self.raw_laws_dir = RAW_LAWS_DIR
        self.metadata_file = METADATA_FILE

        # Create directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.raw_laws_dir.mkdir(parents=True, exist_ok=True)

        # User agent rotation
        self.ua = UserAgent()
        self.session: Optional[aiohttp.ClientSession] = None

        # Statistics
        self.stats = {
            "total_scraped": 0,
            "pdfs_downloaded": 0,
            "errors": 0,
            "detail_pages_visited": 0,
        }

        logger.info("BPK Peraturan Spider initialized")

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={"User-Agent": self.ua.random},
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def _rate_limit(self):
        """Apply rate limiting - polite 5 second delay"""
        await asyncio.sleep(REQUEST_DELAY)

    async def _retry_request(
        self, func, *args, max_retries: int = MAX_RETRIES, **kwargs
    ) -> Any:
        """Retry logic with exponential backoff"""
        for attempt in range(max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Max retries reached for {func.__name__}: {e}")
                    raise
                wait_time = RETRY_DELAY * (2**attempt)
                logger.warning(
                    f"Attempt {attempt + 1}/{max_retries} failed for {func.__name__}: {e}. "
                    f"Retrying in {wait_time}s..."
                )
                await asyncio.sleep(wait_time)
        return None

    async def _find_year_links(self, page: Page) -> List[str]:
        """Find 'Tahun' (Year) links on homepage or return homepage if not found"""
        logger.info("Finding 'Tahun' (Year) links...")
        year_links = []
        seen_urls = set()

        try:
            # Navigate to homepage
            await page.goto(HOME_URL, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(2)  # Wait for page to load

            # Look for year links - common patterns:
            # - Links containing year numbers (2024, 2023, etc.)
            # - Links in navigation/menu with "Tahun" text
            # - Links with year in href or text
            selectors = [
                'a[href*="tahun"]',
                'a[href*="year"]',
                'a:has-text("2024")',
                'a:has-text("2023")',
                'a:has-text("2022")',
                'a:has-text("2021")',
                'a:has-text("2020")',
            ]

            # Try to find year links (excluding /Details/ links)
            for selector in selectors:
                try:
                    links = await page.query_selector_all(selector)
                    for link in links:
                        href = await link.get_attribute("href")
                        text = await link.inner_text()
                        if href and "/Details/" not in href:  # Exclude detail pages
                            full_url = urljoin(BASE_URL, href)
                            if full_url in seen_urls:
                                continue
                            # Extract year from text or URL
                            year_match = re.search(r"\b(20\d{2})\b", text + " " + href)
                            if year_match:
                                year_links.append(full_url)
                                seen_urls.add(full_url)
                                logger.info(
                                    f"Found year link: {full_url} ({year_match.group(1)})"
                                )
                except Exception as e:
                    logger.debug(f"Error with selector {selector}: {e}")
                    continue

            # If no year links found, try searching for links with 4-digit years (excluding /Details/)
            if not year_links:
                all_links = await page.query_selector_all("a")
                for link in all_links:
                    try:
                        href = await link.get_attribute("href")
                        text = await link.inner_text()
                        if href and "/Details/" not in href:  # Exclude detail pages
                            full_url = urljoin(BASE_URL, href)
                            if full_url in seen_urls:
                                continue
                            # Look for year pattern
                            year_match = re.search(r"\b(20\d{2})\b", text + " " + href)
                            if (
                                year_match and year_match.group(1) >= "2020"
                            ):  # Recent years
                                year_links.append(full_url)
                                seen_urls.add(full_url)
                                logger.info(f"Found year link: {full_url}")
                    except Exception:
                        continue

            # If still no year links, we'll use the homepage/search page directly
            if not year_links:
                logger.info("No year links found, will use homepage/search page")
                year_links.append(HOME_URL)

        except Exception as e:
            logger.error(f"Error finding year links: {e}")
            # Fallback to homepage
            year_links.append(HOME_URL)

        return year_links[:5]  # Limit to 5 years to avoid too many pages

    async def _find_detail_links(self, page: Page, source_url: str) -> List[str]:
        """Find regulation detail page links (containing /Details/)"""
        logger.info(f"Finding detail links on {source_url}...")
        detail_links = []

        try:
            await page.goto(source_url, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(2)  # Wait for page to load

            # Find all links containing /Details/
            all_links = await page.query_selector_all("a")
            for link in all_links:
                try:
                    href = await link.get_attribute("href")
                    if href and "/Details/" in href:
                        full_url = urljoin(BASE_URL, href)
                        if full_url not in detail_links:
                            detail_links.append(full_url)
                            logger.debug(f"Found detail link: {full_url}")
                except Exception:
                    continue

            logger.info(f"Found {len(detail_links)} detail links on {source_url}")

        except Exception as e:
            logger.error(f"Error finding detail links on {source_url}: {e}")

        return detail_links

    async def _extract_metadata_from_detail_page(
        self, page: Page, detail_url: str
    ) -> Optional[Dict[str, Any]]:
        """Extract metadata from a regulation detail page"""
        logger.info(f"Extracting metadata from {detail_url}...")

        try:
            await page.goto(detail_url, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(2)  # Wait for page to load
            self.stats["detail_pages_visited"] += 1

            metadata = {
                "url": detail_url,
                "scraped_at": datetime.now().isoformat(),
            }

            # Extract Title (Judul)
            title_selectors = [
                "h1",
                ".judul",
                "[class*='judul']",
                "[class*='title']",
                ".title",
                "h2",
                "h3",
            ]
            title = None
            for selector in title_selectors:
                try:
                    title_elem = await page.query_selector(selector)
                    if title_elem:
                        title = await title_elem.inner_text()
                        if title and len(title.strip()) > 5:  # Valid title
                            break
                except Exception:
                    continue

            if not title:
                # Fallback: get page title
                title = await page.title()
                if title:
                    title = title.replace(" - JDIH BPK", "").strip()

            metadata["title"] = title.strip() if title else "Unknown"

            # Extract Type (Jenis)
            jenis_selectors = [
                "[class*='jenis']",
                "[class*='type']",
                ".jenis",
                ".type",
            ]
            jenis = None
            page_text = await page.inner_text("body")
            for selector in jenis_selectors:
                try:
                    jenis_elem = await page.query_selector(selector)
                    if jenis_elem:
                        jenis = await jenis_elem.inner_text()
                        if jenis:
                            break
                except Exception:
                    continue

            # Fallback: look for common regulation types in text
            if not jenis:
                for reg_type in [
                    "UU",
                    "Perpres",
                    "Peraturan",
                    "Keputusan",
                    "Instruksi",
                    "PP",
                ]:
                    if reg_type in page_text:
                        jenis = reg_type
                        break

            metadata["type"] = jenis.strip() if jenis else "Unknown"

            # Extract Number (Nomor)
            number_patterns = [
                r"(?:No\.|Nomor|No)\s*:?\s*(\d+[\/\-]?\d*)",
                r"Nomor\s+(\d+)",
                r"No\.\s*(\d+)",
            ]
            number = None
            for pattern in number_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    number = match.group(1)
                    break

            metadata["number"] = number.strip() if number else "Unknown"

            # Extract Year (Tahun)
            year_match = re.search(r"\b(19|20)\d{2}\b", page_text)
            year = int(year_match.group()) if year_match else None
            metadata["year"] = year

            # Find PDF download link
            pdf_url = None
            download_selectors = [
                'a[href*="/Download/"]',
                'a[href*="download"]',
                'a[href*=".pdf"]',
                'a:has-text("Download")',
                'a:has-text("Unduh")',
                'a:has-text("PDF")',
            ]

            for selector in download_selectors:
                try:
                    download_link = await page.query_selector(selector)
                    if download_link:
                        href = await download_link.get_attribute("href")
                        if href:
                            pdf_url = urljoin(BASE_URL, href)
                            # Verify it's a PDF link
                            if ".pdf" in pdf_url.lower() or "/Download/" in pdf_url:
                                break
                except Exception:
                    continue

            # Fallback: look for any link with PDF in URL
            if not pdf_url:
                all_links = await page.query_selector_all("a")
                for link in all_links:
                    try:
                        href = await link.get_attribute("href")
                        if href and (".pdf" in href.lower() or "/Download/" in href):
                            pdf_url = urljoin(BASE_URL, href)
                            break
                    except Exception:
                        continue

            metadata["pdf_download_url"] = pdf_url

            # Generate regulation ID from URL if available
            url_parts = urlparse(detail_url)
            path_parts = url_parts.path.split("/")
            if "Details" in path_parts:
                detail_idx = path_parts.index("Details")
                if detail_idx + 1 < len(path_parts):
                    metadata["regulation_id"] = path_parts[detail_idx + 1]

            logger.info(
                f"Extracted metadata: {metadata['title'][:50]}... "
                f"(Type: {metadata['type']}, Year: {metadata['year']})"
            )

            return metadata

        except Exception as e:
            logger.error(f"Error extracting metadata from {detail_url}: {e}")
            self.stats["errors"] += 1
            return None

    async def _download_pdf(self, pdf_url: str, filename: str) -> bool:
        """Download PDF file"""
        if not pdf_url:
            return False

        try:
            filepath = self.raw_laws_dir / filename

            # Skip if already downloaded
            if filepath.exists():
                logger.debug(f"PDF already exists: {filename}")
                return True

            if not self.session:
                return False

            async with self.session.get(pdf_url) as response:
                if response.status == 200:
                    content = await response.read()

                    # Verify it's a PDF
                    if content.startswith(b"%PDF"):
                        filepath.write_bytes(content)
                        logger.info(
                            f"Downloaded PDF: {filename} ({len(content)} bytes)"
                        )
                        self.stats["pdfs_downloaded"] += 1
                        return True
                    else:
                        logger.warning(
                            f"Downloaded file is not a valid PDF: {filename}"
                        )
                        return False
                else:
                    logger.warning(
                        f"Failed to download PDF: {pdf_url} (status: {response.status})"
                    )
                    return False
        except Exception as e:
            logger.error(f"Error downloading PDF {pdf_url}: {e}")
            self.stats["errors"] += 1
            return False

    def _generate_filename(self, item: Dict[str, Any]) -> str:
        """Generate filename for PDF using title"""
        title = item.get("title", "unknown")

        # Clean title for filename - remove special characters but keep spaces
        # Replace problematic characters
        safe_title = re.sub(r'[<>:"/\\|?*]', "", title)  # Remove invalid filename chars
        safe_title = re.sub(
            r"[^\w\s\-()]", "", safe_title
        )  # Keep alphanumeric, spaces, hyphens, parentheses
        safe_title = re.sub(r"\s+", " ", safe_title)  # Normalize multiple spaces
        safe_title = safe_title.strip()

        # Limit length to avoid filesystem issues (max 255 chars for most filesystems)
        if len(safe_title) > 200:
            safe_title = safe_title[:200].rsplit(" ", 1)[0]  # Cut at word boundary

        # If title is too short or empty, use fallback
        if not safe_title or safe_title == "unknown" or len(safe_title) < 3:
            category = item.get("type", "unknown")
            year = item.get("year", "unknown")
            number = item.get("number", "unknown")
            regulation_id = item.get("regulation_id", "unknown")
            safe_title = f"{category}_{year}_{number}_{regulation_id}"

        filename = f"{safe_title}.pdf"
        return filename

    def _save_metadata(self, item: Dict[str, Any]):
        """Save metadata to JSONL file"""
        try:
            with open(self.metadata_file, "a", encoding="utf-8") as f:
                json.dump(item, f, ensure_ascii=False)
                f.write("\n")
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")

    async def scrape(self, max_items: Optional[int] = None) -> List[Dict[str, Any]]:
        """Main scraping method"""
        logger.info("Starting BPK scrape...")
        all_items = []
        visited_detail_urls = set()  # Track visited URLs to avoid duplicates

        async with async_playwright() as p:
            # Launch browser in headful mode (headless=False) for safety
            browser = await p.chromium.launch(
                headless=False,  # Headful mode as requested
                args=[
                    "--disable-gpu",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )
            context = await browser.new_context(
                user_agent=self.ua.random, viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()

            try:
                # Step 1: Find detail links directly from homepage
                # BPK site has /Details/ links directly on homepage
                logger.info("Finding detail links from homepage...")
                all_detail_links = await self._find_detail_links(page, HOME_URL)

                # If not enough links found, try finding year links and exploring them
                if len(all_detail_links) < (max_items or 10):
                    logger.info("Not enough links from homepage, trying year links...")
                    year_links = await self._find_year_links(page)
                    logger.info(f"Found {len(year_links)} year links to explore")

                    for year_url in year_links:
                        await self._rate_limit()
                        detail_links = await self._find_detail_links(page, year_url)
                        all_detail_links.extend(detail_links)

                        # If we have enough links, break
                        if max_items and len(all_detail_links) >= max_items * 2:
                            break

                # Remove duplicates while preserving order
                seen = set()
                unique_detail_links = []
                for link in all_detail_links:
                    if link not in seen:
                        seen.add(link)
                        unique_detail_links.append(link)

                logger.info(f"Found {len(unique_detail_links)} unique detail links")
                all_detail_links = unique_detail_links

                # Step 3: Visit each detail page and extract metadata
                for detail_url in all_detail_links:
                    if max_items and len(all_items) >= max_items:
                        break

                    if detail_url in visited_detail_urls:
                        continue

                    visited_detail_urls.add(detail_url)
                    await self._rate_limit()

                    # Extract metadata
                    metadata = await self._extract_metadata_from_detail_page(
                        page, detail_url
                    )

                    if not metadata:
                        continue

                    # Download PDF if URL exists
                    if metadata.get("pdf_download_url"):
                        filename = self._generate_filename(metadata)
                        metadata["local_filename"] = filename
                        await self._download_pdf(metadata["pdf_download_url"], filename)

                    # Save metadata
                    self._save_metadata(metadata)
                    all_items.append(metadata)
                    self.stats["total_scraped"] += 1

            finally:
                await browser.close()

        logger.info(f"Scraping complete. Total items: {len(all_items)}")
        self._print_stats()

        return all_items

    def _print_stats(self):
        """Print scraping statistics"""
        logger.info("=" * 50)
        logger.info("SCRAPING STATISTICS")
        logger.info("=" * 50)
        logger.info(f"Total items scraped: {self.stats['total_scraped']}")
        logger.info(f"PDFs downloaded: {self.stats['pdfs_downloaded']}")
        logger.info(f"Detail pages visited: {self.stats['detail_pages_visited']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("=" * 50)


async def test_scraper(limit: int = 5):
    """Test function: scrape first N items and verify PDFs"""
    logger.info(f"Running test scrape (limit: {limit} items)...")

    async with PeraturanSpider() as spider:
        items = await spider.scrape(max_items=limit)

        # Verify PDFs
        valid_pdfs = 0
        for item in items:
            filename = item.get("local_filename")
            if filename:
                filepath = spider.raw_laws_dir / filename
                if filepath.exists():
                    # Check file size and PDF header
                    content = filepath.read_bytes()
                    if len(content) > 0 and content.startswith(b"%PDF"):
                        valid_pdfs += 1
                        logger.info(f"✓ Valid PDF: {filename} ({len(content)} bytes)")
                    else:
                        logger.warning(f"✗ Invalid PDF: {filename}")
                else:
                    logger.warning(f"✗ PDF not found: {filename}")

        logger.info(f"Test complete: {valid_pdfs}/{len(items)} valid PDFs")
        return items


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Scrape Indonesian legal documents from peraturan.bpk.go.id"
    )
    parser.add_argument(
        "--limit", type=int, default=None, help="Maximum number of items to scrape"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run test mode (scrape 5 items and verify)",
    )

    args = parser.parse_args()

    if args.test:
        await test_scraper(limit=5)
    else:
        async with PeraturanSpider() as spider:
            await spider.scrape(max_items=args.limit)


if __name__ == "__main__":
    asyncio.run(main())

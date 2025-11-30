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
import subprocess
import sys
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

# Cache for browser installation check (avoid checking multiple times)
_playwright_browsers_checked = False


def _ensure_playwright_browsers_installed():
    """Ensure Playwright browsers are installed. Install if missing."""
    global _playwright_browsers_checked
    
    # Skip check if already verified in this session
    if _playwright_browsers_checked:
        logger.debug("Playwright browsers already checked in this session, skipping...")
        return
    
    try:
        from playwright.sync_api import sync_playwright
        
        # Check if browser executable exists by getting its path
        # This is faster and more reliable than trying to launch it
        try:
            with sync_playwright() as p:
                browser_path = p.chromium.executable_path
                
                # Check if the executable file actually exists
                if browser_path and Path(browser_path).exists():
                    logger.debug(f"Playwright Chromium found at: {browser_path}")
                    _playwright_browsers_checked = True
                    return
                else:
                    logger.info(f"Playwright Chromium executable not found at: {browser_path}")
        except Exception as e:
            logger.debug(f"Could not get browser path: {e}")
            # Fallback: try to launch browser (slower but more thorough)
            try:
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    browser.close()
                    logger.debug("Playwright browsers are already installed (verified by launch)")
                    _playwright_browsers_checked = True
                    return
            except Exception as launch_error:
                logger.debug(f"Browser launch test failed: {launch_error}")
                # Continue to installation
                pass
    except ImportError:
        logger.warning("Could not import playwright.sync_api for browser check")
        return
    
    # Install browsers using playwright CLI
    logger.info("Playwright browsers not found. Installing Chromium...")
    logger.info("This may take a few minutes on first run...")
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            capture_output=True,
            text=True,
            check=True,
            timeout=600,  # 10 minute timeout
        )
        logger.info("✓ Playwright Chromium installed successfully")
        
        # Verify installation after installing
        try:
            with sync_playwright() as p:
                browser_path = p.chromium.executable_path
                if browser_path and Path(browser_path).exists():
                    logger.info(f"✓ Verified Chromium at: {browser_path}")
                    _playwright_browsers_checked = True
                else:
                    logger.warning("Chromium installed but executable not found at expected path")
        except Exception as verify_error:
            logger.warning(f"Could not verify installation: {verify_error}")
            
    except subprocess.TimeoutExpired:
        logger.error("Playwright installation timed out after 10 minutes")
        raise RuntimeError(
            "Playwright browser installation timed out. "
            "Please run manually: playwright install chromium"
        )
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install Playwright browsers")
        logger.error(f"Command output: {e.stdout}")
        logger.error(f"Error output: {e.stderr}")
        raise RuntimeError(
            "Playwright browsers installation failed. "
            "Please run manually: playwright install chromium"
        )
    except FileNotFoundError:
        logger.error("Could not find playwright CLI")
        raise RuntimeError(
            "Playwright CLI not found. "
            "Please ensure playwright is installed: pip install playwright"
        )


class PeraturanSpider:
    """Spider for scraping Indonesian legal documents from peraturan.bpk.go.id"""

    def __init__(self, auto_install_browsers: bool = True):
        """Initialize the spider
        
        Args:
            auto_install_browsers: If True, automatically install Playwright browsers if missing
        """
        self.data_dir = DATA_DIR
        self.raw_laws_dir = RAW_LAWS_DIR
        self.metadata_file = METADATA_FILE

        # Create directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.raw_laws_dir.mkdir(parents=True, exist_ok=True)

        # Ensure Playwright browsers are installed
        if auto_install_browsers:
            _ensure_playwright_browsers_installed()

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

    async def _find_next_page_link(self, page: Page) -> Optional[str]:
        """Find the 'Next' pagination link on the current page using a robust strategy pattern
        
        Returns:
            URL of next page if found, None otherwise
        """
        current_url = page.url
        logger.info(f"Searching for next page link on: {current_url}")
        
        # Debug: Save page HTML for inspection (only first time)
        try:
            debug_dir = Path(__file__).parent / "debug"
            debug_dir.mkdir(exist_ok=True)
            html_content = await page.content()
            debug_file = debug_dir / f"pagination_page_{int(asyncio.get_event_loop().time())}.html"
            debug_file.write_text(html_content, encoding="utf-8")
            logger.debug(f"Saved page HTML to: {debug_file}")
        except Exception as e:
            logger.debug(f"Could not save debug HTML: {e}")
        
        # Strategy 1: Text-based search (most reliable)
        # Look for links containing common "next" text patterns
        logger.info("Strategy 1: Searching for text-based next links...")
        next_text_patterns = ["selanjutnya", "next", ">>", ">", "»", "berikutnya"]
        
        try:
            all_links = await page.query_selector_all("a")
            logger.debug(f"Found {len(all_links)} total links on page")
            
            # Log all link texts for debugging
            link_texts = []
            for link in all_links[:50]:  # Limit to first 50 for logging
                try:
                    text = await link.inner_text()
                    href = await link.get_attribute("href")
                    if text and href:
                        link_texts.append(f"'{text.strip()}' -> {href}")
                except Exception:
                    pass
            
            if link_texts:
                logger.debug(f"Sample links found: {link_texts[:10]}")
            
            for link in all_links:
                try:
                    text = await link.inner_text()
                    href = await link.get_attribute("href")
                    
                    if not href:
                        continue
                    
                    text_lower = text.lower().strip()
                    
                    # Check if text matches any next pattern
                    matches_text = any(pattern in text_lower for pattern in next_text_patterns)
                    
                    if matches_text:
                        # Check if disabled
                        is_disabled = await link.get_attribute("disabled")
                        class_attr = await link.get_attribute("class") or ""
                        
                        # Check parent element's class using evaluate
                        try:
                            parent_class = await link.evaluate("el => el.parentElement?.className || ''")
                            parent_class = parent_class or ""
                        except Exception:
                            parent_class = ""
                        
                        # Skip if disabled
                        if is_disabled or "disabled" in class_attr.lower() or "disabled" in parent_class.lower():
                            logger.debug(f"Skipping disabled link with text: {text}")
                            continue
                        
                        full_url = urljoin(BASE_URL, href)
                        
                        # Verify it's not the same page
                        if full_url != current_url and full_url != current_url + "#":
                            logger.info(f"✓ Found next page using text '{text.strip()}' -> {full_url}")
                            return full_url
                        else:
                            logger.debug(f"Link '{text.strip()}' points to same page, skipping")
                except Exception as e:
                    logger.debug(f"Error checking link: {e}")
                    continue
            
            logger.info(f"Strategy 1: No matching text-based links found (checked {len(all_links)} links)")
        except Exception as e:
            logger.warning(f"Error in text-based search: {e}")
        
        # Strategy 2: Attribute-based search
        logger.info("Strategy 2: Searching for rel='next' attribute...")
        try:
            rel_next_links = await page.query_selector_all('a[rel="next"]')
            logger.debug(f"Found {len(rel_next_links)} links with rel='next'")
            for link in rel_next_links:
                try:
                    href = await link.get_attribute("href")
                    if href:
                        full_url = urljoin(BASE_URL, href)
                        if full_url != current_url:
                            text = await link.inner_text()
                            logger.info(f"✓ Found next page using rel='next' attribute (text: '{text.strip()}') -> {full_url}")
                            return full_url
                except Exception:
                    continue
            logger.info(f"Strategy 2: No valid rel='next' links found")
        except Exception as e:
            logger.warning(f"Error in attribute-based search: {e}")
        
        # Strategy 3: Class-based search (Bootstrap/pagination classes)
        logger.info("Strategy 3: Searching for class-based pagination links...")
        class_selectors = [
            '.pagination .next a',
            '.pagination .next-page a',
            '.pagination a.next',
            '.pager .next a',
            '.paging .next a',
            '.PagedList-skipToNext a',
            '.pagination-next a',
            'a.pagination-next',
            '.next a',
            'a.next',
        ]
        
        for selector in class_selectors:
            try:
                links = await page.query_selector_all(selector)
                if links:
                    logger.debug(f"Found {len(links)} links with selector '{selector}'")
                for link in links:
                    try:
                        # Check if disabled
                        is_disabled = await link.get_attribute("disabled")
                        class_attr = await link.get_attribute("class") or ""
                        
                        # Check parent element's class
                        try:
                            parent_class = await link.evaluate("el => el.parentElement?.className || ''")
                            parent_class = parent_class or ""
                        except Exception:
                            parent_class = ""
                        
                        if is_disabled or "disabled" in class_attr.lower() or "disabled" in parent_class.lower():
                            continue
                        
                        href = await link.get_attribute("href")
                        if href:
                            full_url = urljoin(BASE_URL, href)
                            if full_url != current_url:
                                text = await link.inner_text()
                                logger.info(f"✓ Found next page using class selector '{selector}' (text: '{text.strip()}') -> {full_url}")
                                return full_url
                    except Exception:
                        continue
            except Exception as e:
                logger.debug(f"Selector '{selector}' failed: {e}")
                continue
        
        logger.info("Strategy 3: No matching class-based links found")
        
        # Strategy 4: Look for pagination container and find next link within it
        logger.info("Strategy 4: Searching within pagination containers...")
        pagination_containers = [
            '.pagination',
            '.pager',
            '.paging',
            '[class*="pagination"]',
            '[class*="pager"]',
        ]
        
        for container_selector in pagination_containers:
            try:
                containers = await page.query_selector_all(container_selector)
                if containers:
                    logger.debug(f"Found {len(containers)} containers with selector '{container_selector}'")
                for container in containers:
                    try:
                        # Look for links within this container
                        links = await container.query_selector_all("a")
                        for link in links:
                            try:
                                text = await link.inner_text()
                                href = await link.get_attribute("href")
                                
                                if not href:
                                    continue
                                
                                text_lower = text.lower().strip()
                                
                                # Check if it looks like a next link
                                if any(pattern in text_lower for pattern in next_text_patterns):
                                    # Check if disabled
                                    is_disabled = await link.get_attribute("disabled")
                                    class_attr = await link.get_attribute("class") or ""
                                    
                                    if is_disabled or "disabled" in class_attr.lower():
                                        continue
                                    
                                    full_url = urljoin(BASE_URL, href)
                                    if full_url != current_url:
                                        logger.info(f"✓ Found next page in container '{container_selector}' using text '{text.strip()}' -> {full_url}")
                                        return full_url
                            except Exception:
                                continue
                    except Exception:
                        continue
            except Exception as e:
                logger.debug(f"Container selector '{container_selector}' failed: {e}")
                continue
        
        logger.info("Strategy 4: No matching links found in pagination containers")
        
        # Strategy 5: Look for links with page number patterns (e.g., page=2, page/2, etc.)
        logger.info("Strategy 5: Searching for page number patterns...")
        try:
            all_links = await page.query_selector_all("a")
            current_page_num = None
            
            # Try to detect current page number from URL or active pagination element
            try:
                url_match = re.search(r'[?&]page[=_](\d+)', current_url)
                if url_match:
                    current_page_num = int(url_match.group(1))
            except Exception:
                pass
            
            for link in all_links:
                try:
                    href = await link.get_attribute("href")
                    if not href:
                        continue
                    
                    full_url = urljoin(BASE_URL, href)
                    
                    # Check if URL contains page number pattern
                    page_match = re.search(r'[?&]page[=_](\d+)', full_url)
                    if page_match:
                        next_page_num = int(page_match.group(1))
                        if current_page_num and next_page_num == current_page_num + 1:
                            # Check if disabled
                            is_disabled = await link.get_attribute("disabled")
                            class_attr = await link.get_attribute("class") or ""
                            
                            if not is_disabled and "disabled" not in class_attr.lower():
                                text = await link.inner_text()
                                logger.info(f"✓ Found next page using page number pattern (page {next_page_num}, text: '{text.strip()}') -> {full_url}")
                                return full_url
                except Exception:
                    continue
            logger.info("Strategy 5: No matching page number patterns found")
        except Exception as e:
            logger.warning(f"Error in page number pattern search: {e}")
        
        # Strategy 6: Look for any link that might be pagination (numbers, arrows, etc.)
        logger.info("Strategy 6: Searching for any potential pagination links...")
        try:
            all_links = await page.query_selector_all("a")
            potential_pagination_patterns = [
                r'page[=_]?\d+',
                r'p[=_]?\d+',
                r'\d+',
            ]
            
            # Get current page number if available
            current_page_num = None
            try:
                url_match = re.search(r'[?&](?:page|p)[=_](\d+)', current_url)
                if url_match:
                    current_page_num = int(url_match.group(1))
                    logger.debug(f"Detected current page number: {current_page_num}")
            except Exception:
                pass
            
            for link in all_links:
                try:
                    href = await link.get_attribute("href")
                    text = await link.inner_text()
                    
                    if not href:
                        continue
                    
                    full_url = urljoin(BASE_URL, href)
                    
                    # Skip if same page
                    if full_url == current_url or full_url == current_url + "#":
                        continue
                    
                    # Check if URL contains page number
                    for pattern in potential_pagination_patterns:
                        match = re.search(pattern, full_url, re.IGNORECASE)
                        if match:
                            try:
                                # Try to extract page number
                                page_num_match = re.search(r'(\d+)', match.group(0))
                                if page_num_match:
                                    page_num = int(page_num_match.group(1))
                                    # If we know current page, check if this is next page
                                    if current_page_num and page_num == current_page_num + 1:
                                        logger.info(f"✓ Found potential next page (page {page_num}) using URL pattern: {full_url}")
                                        return full_url
                                    # If no current page known, assume any number > 1 might be next
                                    elif not current_page_num and page_num > 1:
                                        logger.info(f"✓ Found potential next page (page {page_num}) using URL pattern: {full_url}")
                                        return full_url
                            except (ValueError, AttributeError):
                                continue
                    
                    # Check if link text looks like pagination (numbers, arrows)
                    text_clean = text.strip()
                    if text_clean.isdigit() and int(text_clean) > 1:
                        logger.debug(f"Found numeric link: '{text_clean}' -> {full_url}")
                        if current_page_num and int(text_clean) == current_page_num + 1:
                            logger.info(f"✓ Found next page using numeric text '{text_clean}' -> {full_url}")
                            return full_url
                            
                except Exception as e:
                    logger.debug(f"Error in Strategy 6 link check: {e}")
                    continue
            
            logger.info("Strategy 6: No potential pagination links found")
        except Exception as e:
            logger.warning(f"Error in Strategy 6: {e}")
        
        logger.warning("❌ No next page link found using any strategy")
        logger.info("💡 Tip: Check debug/pagination_page_*.html file to inspect the page structure")
        return None

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

    async def scrape(
        self, max_items: Optional[int] = None, jenis_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Main scraping method
        
        Args:
            max_items: Maximum number of items to scrape
            jenis_filter: Filter by regulation type (e.g., 'UU', 'PP', 'Perpres')
        """
        logger.info("Starting BPK scrape...")
        if jenis_filter:
            logger.info(f"Filtering by jenis: {jenis_filter}")
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
                # Start with homepage
                current_url = HOME_URL
                page_number = 1
                
                # Pagination loop: continue until we have enough items or no more pages
                while True:
                    # Check if we have enough items
                    if max_items and len(all_items) >= max_items:
                        logger.info(f"Reached limit of {max_items} items. Stopping.")
                        break
                    
                    logger.info(f"Navigating to page {page_number}...")
                    
                    # Find detail links on current page
                    page_detail_links = await self._find_detail_links(page, current_url)
                    
                    if not page_detail_links:
                        logger.info(f"No detail links found on page {page_number}. Stopping.")
                        break
                    
                    # Process detail links from current page
                    for detail_url in page_detail_links:
                        # Check if we've reached the limit
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

                        # Filter by jenis if specified
                        if jenis_filter:
                            extracted_type = metadata.get("type", "").lower()
                            jenis_normalized = jenis_filter.lower()
                            
                            # Check if jenis matches (case-insensitive)
                            # Handle both abbreviations and full names
                            jenis_mapping = {
                                "uu": ["uu", "undang-undang"],
                                "pp": ["pp", "peraturan pemerintah"],
                                "perpres": ["perpres", "peraturan presiden"],
                                "permen": ["permen", "peraturan menteri"],
                                "kepres": ["kepres", "keputusan presiden"],
                                "instruksi": ["instruksi", "instruksi presiden"],
                                "keputusan": ["keputusan"],
                                "peraturan": ["peraturan"],
                            }
                            
                            # Check if jenis_filter matches any mapped values
                            matches = False
                            if jenis_normalized in jenis_mapping:
                                # Check if extracted_type contains any of the mapped values
                                for mapped_value in jenis_mapping[jenis_normalized]:
                                    if mapped_value in extracted_type:
                                        matches = True
                                        break
                            else:
                                # Direct match if not in mapping
                                if jenis_normalized in extracted_type:
                                    matches = True
                            
                            if not matches:
                                logger.debug(
                                    f"Skipping {detail_url}: jenis '{metadata.get('type')}' "
                                    f"does not match filter '{jenis_filter}'"
                                )
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
                        
                        logger.info(
                            f"Scraped {len(all_items)}/{max_items or 'unlimited'} items "
                            f"(Type: {metadata.get('type', 'Unknown')})"
                        )
                    
                    # Check if we've reached the limit after processing this page
                    if max_items and len(all_items) >= max_items:
                        break
                    
                    # Navigate back to listing page to find next page link
                    # (We may have navigated away while processing detail pages)
                    await self._rate_limit()
                    await page.goto(current_url, wait_until="domcontentloaded", timeout=60000)
                    await asyncio.sleep(2)  # Wait for page to load
                    
                    # Look for next page link
                    next_page_url = await self._find_next_page_link(page)
                    
                    if not next_page_url:
                        logger.info(f"No next page found. Reached end of pagination at page {page_number}.")
                        break
                    
                    # Navigate to next page
                    current_url = next_page_url
                    page_number += 1
                    await page.goto(current_url, wait_until="domcontentloaded", timeout=60000)
                    await asyncio.sleep(2)  # Wait for page to load

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
        "--jenis",
        type=str,
        default=None,
        help="Filter by regulation type (e.g., 'uu', 'pp', 'perpres', 'permen', 'kepres')",
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
            await spider.scrape(max_items=args.limit, jenis_filter=args.jenis)


if __name__ == "__main__":
    asyncio.run(main())

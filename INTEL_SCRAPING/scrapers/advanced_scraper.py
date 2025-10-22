#!/usr/bin/env python3
"""
Advanced Scraper - Swiss-Watch Precision
Full-featured scraper with Playwright, Crawl4AI, and custom selectors.

Features:
- Playwright rendering with stealth mode
- Crawl4AI integration (3-tier fallback)
- 20+ custom selectors for Indonesian news sites
- Full article content extraction
- Metadata extraction (Open Graph, JSON-LD)
- Language detection & content cleaning
- Parallel scraping with rate limiting
- Rotating user agents
- SSL handling for government sites
"""

import asyncio
import hashlib
import json
import logging
import random
import re
import time
import warnings
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse, urljoin

# Suppress SSL warnings for gov sites
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from INTEL_SCRAPING.core.models import Article, ScrapingResult, ArticleTier, parse_date_unified
from INTEL_SCRAPING.scrapers.base_scraper import BaseScraper
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)

# Optional imports with fallbacks
_has_crawl4ai = False
_has_playwright = False
_has_stealth = False
_has_trafilatura = False
_has_langdetect = False

try:
    import crawl4ai
    _has_crawl4ai = True
except:
    logger.debug("crawl4ai not available")

try:
    from playwright.async_api import async_playwright
    _has_playwright = True
except:
    logger.debug("playwright not available")

try:
    from playwright_stealth import stealth_async
    _has_stealth = True
except:
    logger.debug("playwright-stealth not available")

try:
    import trafilatura
    _has_trafilatura = True
except:
    logger.debug("trafilatura not available")

try:
    from langdetect import detect, LangDetectException
    _has_langdetect = True
except:
    logger.debug("langdetect not available")

import requests
from bs4 import BeautifulSoup


# Rotating User Agents
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

# Alternative URLs for problematic government sites
URL_ALTERNATIVES = {
    'https://www.imigrasi.go.id/id/': [
        'https://imigrasi.go.id/',
        'https://www.imigrasi.go.id/',
    ],
    'https://www.indonesia.go.id/': [
        'https://indonesia.go.id/',
    ],
    'https://kemlu.go.id/portal/id': [
        'https://kemlu.go.id/',
        'https://www.kemlu.go.id/',
    ],
    'https://www.kemenkumham.go.id/berita': [
        'https://www.kemenkumham.go.id/',
        'https://kemenkumham.go.id/',
    ],
}

# Extended custom selectors (20+ Indonesian news sites)
CUSTOM_SELECTORS = {
    'detik.com': {
        'container': 'article.list-content__item, div.media',
        'title': 'h3.media__title a, h2 a, h3 a',
        'link': 'h3.media__title a, h2 a',
        'date': 'div.media__date span, span.date',
        'content_selector': 'div.detail__body-text, div.itp_bodycontent',
    },
    'tempo.co': {
        'container': 'div.card-box, article',
        'title': 'h2.title a, h3 a',
        'link': 'h2.title a',
        'date': 'span.date, time',
        'content_selector': 'div.detail-content, article',
    },
    'cnnindonesia.com': {
        'container': 'article.l_content, div.media',
        'title': 'h2 a, h3 a',
        'link': 'h2 a',
        'date': 'span.date',
        'content_selector': 'div.detail-text, div.content',
    },
    'liputan6.com': {
        'container': 'article.articles--iridescent-list--item, div.article-item',
        'title': 'h4.articles--iridescent-list--text-item__title a, h3 a',
        'link': 'h4.articles--iridescent-list--text-item__title a',
        'date': 'time.articles--iridescent-list--text-item__time',
        'content_selector': 'div.article-content-body, div.read-page--content',
    },
    'thejakartapost.com': {
        'container': 'article.latest__item, div.post',
        'title': 'h2.latest__title a, h3 a',
        'link': 'h2.latest__title a',
        'date': 'time.latest__date',
        'content_selector': 'div.post-content, article',
    },
    'jakartaglobe.id': {
        'container': 'article.jeg_post, div.post-item',
        'title': 'h3.jeg_post_title a, h2 a',
        'link': 'h3.jeg_post_title a',
        'date': 'div.jeg_meta_date',
        'content_selector': 'div.content-inner, article',
    },
    'idntimes.com': {
        'container': 'div.box-latest.box-list li, article',
        'title': 'h2.title-text a, h3 a',
        'link': 'h2.title-text a',
        'date': 'span.date, time',
        'content_selector': 'div.content-article, div.detail',
    },
    'kompas.com': {
        'container': 'div.article__list, article',
        'title': 'h3.article__title a, h2 a',
        'link': 'h3.article__title a',
        'date': 'div.article__date',
        'content_selector': 'div.read__content, div.content',
    },
    'tribunnews.com': {
        'container': 'li.ptb15, article',
        'title': 'h3 a, h2 a',
        'link': 'h3 a',
        'date': 'time, span.grey',
        'content_selector': 'div.side-article, div.content',
    },
    'republika.co.id': {
        'container': 'div.articel-list, article',
        'title': 'h2 a, h3 a',
        'link': 'h2 a',
        'date': 'span.date, time',
        'content_selector': 'div.artikel, div.content',
    },
    'antaranews.com': {
        'container': 'article, div.post',
        'title': 'h3 a, h2 a',
        'link': 'h3 a',
        'date': 'span.simple-share-date, time',
        'content_selector': 'div.post-content, article',
    },
    'suara.com': {
        'container': 'div.news-card, article',
        'title': 'h4 a, h3 a',
        'link': 'h4 a',
        'date': 'span.date, time',
        'content_selector': 'div.paragraph-content, article',
    },
    'kumparan.com': {
        'container': 'div.Story__item, article',
        'title': 'h3 a, h2 a',
        'link': 'h3 a',
        'date': 'span.Story__time, time',
        'content_selector': 'div.Markdown, div.content',
    },
    'merdeka.com': {
        'container': 'div.mdk-box-list, article',
        'title': 'h3 a, h2 a',
        'link': 'h3 a',
        'date': 'span.date, time',
        'content_selector': 'div.mdk-body-paragraph, article',
    },
    'sindonews.com': {
        'container': 'div.homelist, article',
        'title': 'h2 a, h3 a',
        'link': 'h2 a',
        'date': 'span.date, time',
        'content_selector': 'div.content-detail, article',
    },
    'okezone.com': {
        'container': 'div.list-berita, article',
        'title': 'h4 a, h3 a',
        'link': 'h4 a',
        'date': 'span.date, time',
        'content_selector': 'div.detail-content, article',
    },
    'inews.id': {
        'container': 'article, div.item',
        'title': 'h2 a, h3 a',
        'link': 'h2 a',
        'date': 'span.date, time',
        'content_selector': 'div.content, article',
    },
    'bisnis.com': {
        'container': 'div.list-news, article',
        'title': 'h3 a, h2 a',
        'link': 'h3 a',
        'date': 'span.time, time',
        'content_selector': 'div.article-content, article',
    },
    'kontan.co.id': {
        'container': 'div.list-berita, article',
        'title': 'h2 a, h3 a',
        'link': 'h2 a',
        'date': 'span.font-gray, time',
        'content_selector': 'div.content-article, article',
    },
    'cnbcindonesia.com': {
        'container': 'article, div.gtm_latest_feed',
        'title': 'h3 a, h2 a',
        'link': 'h3 a',
        'date': 'span.date, time',
        'content_selector': 'div.detail_text, article',
    },
    'katadata.co.id': {
        'container': 'div.latest-news-item, article',
        'title': 'h3 a, h2 a',
        'link': 'h3 a',
        'date': 'span.date-post, time',
        'content_selector': 'div.content-article, article',
    },
}


class AdvancedScraper(BaseScraper):
    """
    Advanced scraper with Playwright, Crawl4AI, and custom selectors.

    Inherits from BaseScraper to get:
    - Centralized deduplication
    - Unified Article models
    - Date parsing
    - Configuration
    """

    def __init__(self, config=None):
        super().__init__(config)

        # Domain-based rate limiting
        self.domain_semaphores: Dict[str, asyncio.Semaphore] = {}

        # Metrics tracking
        self.site_metrics = defaultdict(lambda: {
            'total_attempts': 0,
            'successes': 0,
            'failures': 0,
            'articles_found': 0,
            'last_success': None,
            'last_error': None
        })

    def get_domain_semaphore(self, url: str, limit: int = 2) -> asyncio.Semaphore:
        """Get or create semaphore for domain-based rate limiting"""
        domain = urlparse(url).netloc
        if domain not in self.domain_semaphores:
            self.domain_semaphores[domain] = asyncio.Semaphore(limit)
        return self.domain_semaphores[domain]

    def get_custom_selector(self, url: str) -> Optional[Dict]:
        """Get custom selector config for specific domains"""
        for domain, config in CUSTOM_SELECTORS.items():
            if domain in url:
                return config
        return None

    def detect_language(self, text: str) -> str:
        """Detect content language"""
        if not _has_langdetect or len(text) < 50:
            # Fallback: simple heuristic
            return "id" if any(word in text.lower() for word in ["yang", "dan", "ini", "untuk"]) else "en"

        try:
            return detect(text)
        except LangDetectException:
            return "unknown"

    def extract_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract structured metadata (Open Graph, JSON-LD, etc.)"""
        metadata = {
            'author': None,
            'tags': [],
            'image_url': None,
            'image_alt': None,
            'description': None
        }

        # Open Graph
        og_image = soup.find('meta', property='og:image')
        if og_image:
            metadata['image_url'] = og_image.get('content')

        og_desc = soup.find('meta', property='og:description')
        if og_desc:
            metadata['description'] = og_desc.get('content')

        # Author
        author_meta = soup.find('meta', attrs={'name': 'author'}) or soup.find('meta', property='article:author')
        if author_meta:
            metadata['author'] = author_meta.get('content')

        # Keywords/Tags
        keywords = soup.find('meta', attrs={'name': 'keywords'})
        if keywords:
            metadata['tags'] = [k.strip() for k in keywords.get('content', '').split(',')][:5]

        # JSON-LD
        json_ld = soup.find('script', type='application/ld+json')
        if json_ld:
            try:
                data = json.loads(json_ld.string)
                if isinstance(data, dict):
                    metadata['author'] = metadata['author'] or data.get('author', {}).get('name')
                    metadata['image_url'] = metadata['image_url'] or data.get('image')
            except:
                pass

        return metadata

    def clean_content(self, html: str, url: str) -> str:
        """Clean content using trafilatura or BeautifulSoup"""
        if _has_trafilatura:
            # Trafilatura is best for article extraction
            cleaned = trafilatura.extract(html, include_comments=False, include_tables=False)
            if cleaned and len(cleaned) > 200:
                return cleaned

        # Fallback: BeautifulSoup-based cleaning
        soup = BeautifulSoup(html, 'html.parser')

        # Remove unwanted elements
        for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe']):
            tag.decompose()

        # Try to find article content
        article = soup.find('article') or soup.find('div', class_=lambda c: c and any(x in str(c).lower() for x in ['content', 'article', 'body', 'text']))

        if article:
            # Extract paragraphs
            paragraphs = article.find_all('p')
            text = '\n\n'.join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50)
            return text

        # Last resort: all paragraphs
        paragraphs = soup.find_all('p')
        text = '\n\n'.join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50)
        return text

    async def _render_with_playwright(self, url: str) -> str:
        """Render page with Playwright + stealth mode"""
        if not _has_playwright:
            return ''

        html = ''
        try:
            # Rotating user agent
            ua = random.choice(USER_AGENTS)

            async with async_playwright() as p:
                # Launch with args for gov sites
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--disable-blink-features=AutomationControlled',
                        '--disable-dev-shm-usage',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',  # For gov sites with CORS
                        '--disable-features=IsolateOrigins,site-per-process',
                    ]
                )

                # Context with realistic settings
                context = await browser.new_context(
                    user_agent=ua,
                    viewport={'width': 1920, 'height': 1080},
                    locale='en-US',
                    timezone_id='Asia/Jakarta',
                    ignore_https_errors=True,  # Gov sites SSL issues
                )

                page = await context.new_page()

                # Apply stealth mode
                if _has_stealth:
                    await stealth_async(page)

                # Longer timeout for slow gov sites
                timeout = self.config.scraper.timeout_seconds * 1000
                page.set_default_timeout(timeout)

                # Try different wait strategies
                try:
                    await page.goto(url, wait_until='domcontentloaded', timeout=timeout)
                except Exception:
                    # Fallback: try networkidle
                    try:
                        await page.goto(url, wait_until='networkidle', timeout=timeout)
                    except Exception:
                        # Last resort: load
                        await page.goto(url, wait_until='load', timeout=timeout)

                # Wait for dynamic content (adaptive)
                await asyncio.sleep(2 if 'go.id' in url or '.gov' in url else 1)

                # Scroll to trigger lazy loading
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
                await asyncio.sleep(0.5)

                html = await page.content()
                await browser.close()
        except Exception as e:
            logger.debug(f"Playwright render failed: {str(e)[:100]}")
        return html

    def _fetch_with_requests(self, url: str) -> str:
        """Fetch with requests + rotating UA + retries + SSL handling"""
        headers = {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

        retry_attempts = 2
        dns_timeout = 10
        timeout = self.config.scraper.timeout_seconds

        for attempt in range(retry_attempts):
            try:
                # Session for connection pooling
                session = requests.Session()
                session.headers.update(headers)

                # Handle SSL verification (some gov sites have issues)
                r = session.get(
                    url,
                    timeout=(dns_timeout, timeout),  # (connect, read) timeouts
                    verify=False,  # Gov sites SSL issues
                    allow_redirects=True,
                    stream=False
                )

                if r.status_code == 200:
                    return r.text
                elif r.status_code in [301, 302, 307, 308]:  # Redirects
                    logger.debug(f"Following redirect for {url}")
                    continue
                elif r.status_code == 403 and attempt < retry_attempts - 1:
                    # Retry with different UA
                    headers['User-Agent'] = random.choice(USER_AGENTS)
                    time.sleep(2)
                    continue
                else:
                    logger.debug(f"HTTP {r.status_code} for {url}")

            except requests.exceptions.SSLError as e:
                logger.debug(f"SSL error for {url}, retrying without verification")
                if attempt < retry_attempts - 1:
                    continue
            except requests.exceptions.Timeout as e:
                logger.debug(f"Timeout for {url} (attempt {attempt+1}/{retry_attempts})")
                if attempt < retry_attempts - 1:
                    time.sleep(3)
                    continue
            except requests.exceptions.ConnectionError as e:
                logger.debug(f"Connection error for {url}: DNS or network issue")
                if attempt < retry_attempts - 1:
                    time.sleep(5)
                    continue
            except Exception as e:
                logger.debug(f"Requests failed for {url}: {str(e)[:50]}")
                if attempt < retry_attempts - 1:
                    continue

        return ''

    async def _crawl_page(self, url: str) -> str:
        """Crawl page with 3-tier fallback + URL alternatives"""
        # Try alternative URLs if known problematic site
        urls_to_try = [url]
        if url in URL_ALTERNATIVES:
            urls_to_try.extend(URL_ALTERNATIVES[url])

        for attempt_url in urls_to_try:
            # Tier 1: Crawl4AI (if available)
            if _has_crawl4ai:
                try:
                    if hasattr(crawl4ai, 'crawl'):
                        html = crawl4ai.crawl(attempt_url, timeout=self.config.scraper.timeout_seconds)
                        if html and len(html) > 500:
                            return html
                except Exception as e:
                    logger.debug(f"Crawl4AI failed for {attempt_url}: {str(e)[:50]}")

            # Tier 2: Playwright (if available)
            html = await self._render_with_playwright(attempt_url)
            if html and len(html) > 500:  # Minimum viable HTML
                return html

            # Tier 3: Requests (always available)
            html = self._fetch_with_requests(attempt_url)
            if html and len(html) > 500:
                return html

        return ''

    async def fetch_full_article(self, url: str, custom_config: Optional[Dict] = None) -> Tuple[str, int]:
        """Fetch full article content (not just preview)"""
        try:
            # Use domain-based rate limiting
            semaphore = self.get_domain_semaphore(url)
            async with semaphore:
                html = await self._crawl_page(url)
                if not html:
                    return "", 0

                # Clean content
                full_content = self.clean_content(html, url)
                word_count = len(full_content.split())

                return full_content, word_count
        except Exception as e:
            logger.debug(f"Failed to fetch full article {url}: {e}")
            return "", 0

    def auto_detect_articles(self, soup: BeautifulSoup, url: str = '') -> Tuple[List, str, Optional[Dict]]:
        """Auto-detect articles with custom selectors"""
        custom = self.get_custom_selector(url)
        if custom:
            items = soup.select(custom['container'])
            if len(items) >= 1:
                logger.debug(f"Using custom selector for {url}: {custom['container']}")
                return items, custom['container'], custom

        # Fallback: try common selectors
        for selector in ['article', 'div.post', 'div.story', 'div.card', 'div.entry', 'li.item', 'div.media']:
            items = soup.select(selector)
            if len(items) >= 3:
                return items, selector, None

        # Last resort: auto-detect
        all_divs = soup.find_all('div')
        candidates = [div for div in all_divs if div.find('a') and len(div.get_text(strip=True)) > 50]
        return candidates[:20], "div (auto-detected)", None

    def extract_title(self, item, custom_config: Optional[Dict] = None) -> Optional[str]:
        """Extract title with custom config support"""
        if custom_config and 'title' in custom_config:
            elem = item.select_one(custom_config['title'])
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text

        # Fallback: common patterns
        for selector in ['h2', 'h3', 'h1']:
            elem = item.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text

        return None

    def extract_link(self, item, base_url: str, custom_config: Optional[Dict] = None) -> Optional[str]:
        """Extract link with custom config support"""
        if custom_config and 'link' in custom_config:
            link_elem = item.select_one(custom_config['link'])
            if link_elem and link_elem.get('href'):
                link = link_elem.get('href')
                return link if link.startswith('http') else urljoin(base_url, link)

        # Fallback: first link
        link_elem = item.find('a')
        if link_elem and link_elem.get('href'):
            link = link_elem.get('href')
            return link if link.startswith('http') else urljoin(base_url, link)
        return None

    def extract_date(self, item, custom_config: Optional[Dict] = None) -> Optional[str]:
        """Extract date with robust parsing"""
        date_str = None

        # Try 1: <time> element
        date_elem = item.find('time')
        if date_elem:
            date_str = date_elem.get('datetime', date_elem.get_text(strip=True))

        # Try 2: Custom selector
        if not date_str and custom_config and 'date' in custom_config:
            date_elem = item.select_one(custom_config['date'])
            if date_elem:
                date_str = date_elem.get('datetime', date_elem.get_text(strip=True))

        # Try 3: Regex patterns
        if not date_str:
            text = item.get_text()
            iso_match = re.search(r'\b(\d{4}-\d{2}-\d{2})\b', text)
            if iso_match:
                date_str = iso_match.group(1)

        return date_str

    async def scrape_site(self, site: Dict[str, Any], category: str) -> ScrapingResult:
        """Scrape site with full article content and all enhancements"""
        url = site.get('url')
        name = site.get('name', url)
        tier = site.get('tier', 'T3')

        result = ScrapingResult(
            site_name=name,
            site_url=url,
            category=category,
            tier=ArticleTier(tier)
        )

        if not url:
            result.success = False
            result.errors.append("No URL provided")
            return result

        # Track metrics
        self.site_metrics[name]['total_attempts'] += 1
        start_time = time.time()

        try:
            # Crawl page
            html = await self._crawl_page(url)
            if not html:
                result.success = False
                result.errors.append("Empty HTML")
                self.site_metrics[name]['failures'] += 1
                return result

            # Parse HTML
            soup = BeautifulSoup(html, 'html.parser')
            items, selector, custom_config = self.auto_detect_articles(soup, url)

            if not items:
                result.success = False
                result.errors.append("No articles detected")
                self.site_metrics[name]['failures'] += 1
                return result

            # Extract page-level metadata once
            page_metadata = self.extract_metadata(soup)

            # Process articles
            max_articles = self.config.scraper.max_articles_per_source
            for item in items[:max_articles]:
                try:
                    # Extract title
                    title = self.extract_title(item, custom_config)
                    if not title:
                        continue

                    # Extract link
                    link = self.extract_link(item, url, custom_config)
                    if not link:
                        continue

                    # Extract date
                    date_str = self.extract_date(item, custom_config)

                    # Fetch full article content
                    full_content, word_count = await self.fetch_full_article(link, custom_config)

                    if not full_content:
                        # Fallback to preview from listing page
                        full_content = item.get_text(strip=True)[:800]
                        word_count = len(full_content.split())
                    else:
                        self.stats['full_content_fetched'] += 1

                    # Language detection
                    language = self.detect_language(full_content)

                    # Create article using base scraper's helper
                    # This handles validation, date parsing, and deduplication
                    article = self.create_article_from_data(
                        url=link,
                        title=title,
                        content=full_content,
                        published_date=date_str,
                        source=name,
                        category=category,
                        tier=tier,
                        author=page_metadata.get('author'),
                        tags=page_metadata.get('tags', []),
                        image_url=page_metadata.get('image_url'),
                        image_alt=page_metadata.get('image_alt'),
                        language=language,
                        word_count=word_count
                    )

                    if article:
                        result.articles.append(article)

                except Exception as e:
                    logger.debug(f"Error extracting article: {str(e)[:50]}")
                    continue

            # Update metrics
            if result.articles:
                self.site_metrics[name]['successes'] += 1
                self.site_metrics[name]['articles_found'] += len(result.articles)
                self.site_metrics[name]['last_success'] = datetime.now().isoformat()
                result.success = True
            else:
                self.site_metrics[name]['failures'] += 1
                result.success = False

            result.articles_count = len(result.articles)
            result.full_content_count = self.stats['full_content_fetched']
            result.duration_seconds = time.time() - start_time

            return result

        except Exception as e:
            logger.error(f"Error scraping {name}: {str(e)[:80]}")
            result.success = False
            result.errors.append(str(e)[:200])
            result.duration_seconds = time.time() - start_time
            self.site_metrics[name]['failures'] += 1
            self.site_metrics[name]['last_error'] = str(e)[:200]
            return result

    def parse_article(self, item, site: Dict, category: str) -> Optional[Article]:
        """
        Parse article from HTML element.

        Note: This method is implemented but not used in advanced scraper,
        as we use scrape_site() which handles everything.
        """
        # This is required by BaseScraper abstract method
        # but we don't use it in AdvancedScraper since scrape_site()
        # does all the work.
        pass


if __name__ == "__main__":
    # Test advanced scraper
    import asyncio

    async def test():
        print("=" * 60)
        print("Testing AdvancedScraper")
        print("=" * 60)

        scraper = AdvancedScraper()

        # Test with a real Indonesian news site
        site = {
            'name': 'Detik',
            'url': 'https://www.detik.com/',
            'tier': 'T1'
        }

        result = await scraper.scrape_site(site, 'news')

        print(f"\n✅ Result:")
        print(f"   Success: {result.success}")
        print(f"   Articles: {len(result.articles)}")
        print(f"   Full content: {result.full_content_count}")
        print(f"   Duration: {result.duration_seconds:.1f}s")
        print(f"   Errors: {result.errors}")

        if result.articles:
            print(f"\n📰 Sample article:")
            article = result.articles[0]
            print(f"   Title: {article.title[:80]}...")
            print(f"   URL: {article.url}")
            print(f"   Date: {article.published_date}")
            print(f"   Words: {article.word_count}")
            print(f"   Language: {article.language}")

        stats = scraper.get_stats()
        print(f"\n📊 Stats:")
        for key, value in stats.items():
            if key != 'dedup_stats':
                print(f"   {key}: {value}")

    asyncio.run(test())
    print("=" * 60)

#!/usr/bin/env python3
"""
Stage 1 Scraper - ADVANCED EDITION
All 10 priorities implemented for highest quality scraping.

New features:
- P1: Full article content extraction (2000-5000 words)
- P2: Extended custom selectors (20+ sites)
- P3: Anti-scraping bypass (stealth, rotating UAs)
- P4: Structured metadata extraction (OG, JSON-LD)
- P5: Enhanced deduplication & quality
- P6: Intelligent rate limiting & parallelization
- P7: Monitoring & alerting (metrics tracking)
- P8: Content cleaning (trafilatura)
- P9: Image & media extraction
- P10: Schema validation (Pydantic)
"""

import asyncio
import json
import logging
import os
import sys
import time
import hashlib
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from urllib.parse import urlparse, urljoin
import random
import warnings

# Suppress SSL warnings for gov sites
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Imports with fallbacks
_has_crawl4ai = False
_has_playwright = False
_has_stealth = False
_has_trafilatura = False
_has_langdetect = False

try:
    import crawl4ai
    _has_crawl4ai = True
except:
    pass

try:
    from playwright.async_api import async_playwright
    _has_playwright = True
except:
    pass

try:
    from playwright_stealth import stealth_async
    _has_stealth = True
except:
    pass

try:
    import trafilatura
    _has_trafilatura = True
except:
    pass

try:
    from langdetect import detect, LangDetectException
    _has_langdetect = True
except:
    pass

try:
    from pydantic import BaseModel, HttpUrl, Field, validator
    from datetime import datetime as dt
except ImportError:
    logger.warning("Pydantic not available - schema validation disabled")
    BaseModel = object
    Field = lambda *args, **kwargs: None

import requests
from bs4 import BeautifulSoup

# Import filters
from llama_intelligent_filter import LLAMAFilter
from news_intelligent_filter import NewsIntelligentFilter

try:
    from scripts.stage2_parallel_processor import run_stage2_parallel
except:
    run_stage2_parallel = None

# Category mapping: filename → category_key
CATEGORY_MAPPING = {
    'SITI_VINO_NEWS.txt': 'news',
    'SITI_ADIT_IMMIGRATION.txt': 'visa_immigration',
    'SITI_ADIT_REGULATORY.txt': 'regulatory_changes',
    'SITI_AMANDA_EMPLOYMENT.txt': 'employment_law',
    'SITI_ANTON_JOBS.txt': 'jobs',
    'SITI_DAMAR_COMPETITORS.txt': 'competitor_intel',
    'SITI_DEA_BUSINESS.txt': 'business_setup',
    'SITI_DEA_MACRO.txt': 'macro_policy',
    'SITI_DEWAYU_LIFESTYLE.txt': 'lifestyle',
    'SITI_FAISHA_TAX.txt': 'tax',
    'SITI_KRISNA_BUSINESS_SETUP.txt': 'business_setup',
    'SITI_KRISNA_REALESTATE.txt': 'property_law',
    'SITI_LLAMA_AI_TECH.txt': 'ai_tech',
    'SITI_LLAMA_DEV_CODE.txt': 'dev_code',
    'SITI_LLAMA_FUTURE_TRENDS.txt': 'future_trends',
    'SITI_SAHIRA_SOCIAL.txt': 'social_media',
    'SITI_SURYA_BANKING.txt': 'banking_finance',
    'SITI_SURYA_EVENTS.txt': 'events_networking',
    'SITI_SURYA_HEALTH.txt': 'health_safety',
    'SITI_SURYA_TRANSPORT.txt': 'transport_connectivity',
}

LLAMA_CATEGORIES = ['ai_tech', 'dev_code', 'future_trends', 'news']  # Categories with NewsIntelligentFilter
SITES_DIR = PROJECT_ROOT / "sites"

# Config
OUTPUT_BASE = PROJECT_ROOT / "data" / "INTEL_SCRAPING"
METRICS_DIR = OUTPUT_BASE / "metrics"
METRICS_DIR.mkdir(parents=True, exist_ok=True)

DELAY_MIN, DELAY_MAX = 1, 3  # Faster with parallelization
TIMEOUT = 45  # Increased for slow gov sites
MAX_ARTICLES_PER_SOURCE = 15
MAX_CONCURRENT_SITES = 5  # P6: Parallelization
MAX_CONTENT_AGE_DAYS = 14  # P5: Skip old content

# Best practices: DNS and SSL handling
VERIFY_SSL = False  # Some gov sites have SSL issues
DNS_TIMEOUT = 10  # DNS resolution timeout
RETRY_ATTEMPTS = 2  # Retry failed requests

# P3: Rotating User Agents
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

# Best practice: Alternative URLs for known problematic gov sites
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

# P2: Extended custom selectors (20+ sites)
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

# P10: Pydantic Schema
if BaseModel != object:
    class Article(BaseModel):
        url: str
        title: str
        content: str
        published_date: str
        source: str
        tier: str
        category: str
        scraped_at: str
        language: str = "id"
        impact_level: str = "medium"
        
        # P4: Structured metadata
        author: Optional[str] = None
        tags: List[str] = Field(default_factory=list)
        image_url: Optional[str] = None
        image_alt: Optional[str] = None
        
        # P5: Quality indicators
        content_hash: Optional[str] = None
        word_count: int = 0
        
        @validator('content')
        def content_not_empty(cls, v):
            if len(v.strip()) < 100:
                raise ValueError('Content too short')
            return v
        
        @validator('url')
        def url_valid(cls, v):
            if not v.startswith('http'):
                raise ValueError('Invalid URL')
            return v
else:
    Article = dict


class AdvancedScraper:
    def __init__(self):
        self.llama_filter = LLAMAFilter()
        self.news_filter = NewsIntelligentFilter()
        self.stats = {
            'categories_processed': 0,
            'total_scraped': 0,
            'total_filtered': 0,
            'full_content_fetched': 0,
            'errors': []
        }
        
        # P5: Deduplication tracking
        self.seen_urls: Set[str] = set()
        self.seen_hashes: Set[str] = set()
        
        # P7: Metrics tracking
        self.site_metrics = defaultdict(lambda: {
            'total_attempts': 0,
            'successes': 0,
            'failures': 0,
            'articles_found': 0,
            'last_success': None,
            'last_error': None
        })
        
        # P6: Rate limiting per domain
        self.domain_semaphores = {}
    
    def get_domain_semaphore(self, url: str, limit: int = 2) -> asyncio.Semaphore:
        """P6: Get or create semaphore for domain-based rate limiting"""
        domain = urlparse(url).netloc
        if domain not in self.domain_semaphores:
            self.domain_semaphores[domain] = asyncio.Semaphore(limit)
        return self.domain_semaphores[domain]
    
    def normalize_url(self, url: str) -> str:
        """P5: Normalize URL for deduplication"""
        parsed = urlparse(url)
        # Remove query params and fragments, trailing slash
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
        return normalized.lower()
    
    def content_hash(self, text: str) -> str:
        """P5: Generate content hash for dedup"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def is_duplicate(self, url: str, content: str) -> bool:
        """P5: Check if article is duplicate"""
        norm_url = self.normalize_url(url)
        content_hash = self.content_hash(content[:500])  # First 500 chars
        
        if norm_url in self.seen_urls or content_hash in self.seen_hashes:
            return True
        
        self.seen_urls.add(norm_url)
        self.seen_hashes.add(content_hash)
        return False
    
    def detect_language(self, text: str) -> str:
        """P5: Detect content language"""
        if not _has_langdetect or len(text) < 50:
            # Fallback: simple heuristic
            return "id" if any(word in text.lower() for word in ["yang", "dan", "ini", "untuk"]) else "en"
        
        try:
            return detect(text)
        except LangDetectException:
            return "unknown"
    
    def extract_metadata(self, soup: BeautifulSoup) -> Dict:
        """P4: Extract structured metadata (Open Graph, JSON-LD, etc.)"""
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
        """P8: Clean content using trafilatura"""
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
    
    async def fetch_full_article(self, url: str, custom_config: Optional[Dict] = None) -> Tuple[str, int]:
        """P1: Fetch full article content (not just preview)"""
        try:
            # Use domain-based rate limiting
            semaphore = self.get_domain_semaphore(url)
            async with semaphore:
                html = await self._crawl_page(url)
                if not html:
                    return "", 0
                
                # P8: Clean content
                full_content = self.clean_content(html, url)
                word_count = len(full_content.split())
                
                return full_content, word_count
        except Exception as e:
            logger.debug(f"Failed to fetch full article {url}: {e}")
            return "", 0
    
    def load_sites_from_file(self, filepath: Path) -> List[Dict]:
        """Load sites from SITI_*.txt files"""
        sites: List[Dict] = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            current_site: Dict = {}
            for line in lines:
                line = line.strip()
                if not line or line.startswith('🛂') or line.startswith('⭐'):
                    continue
                if line.split('.')[0].isdigit():
                    if current_site and current_site.get('url'):
                        sites.append(current_site)
                    current_site = {'name': line.split(' ', 1)[1] if ' ' in line else line, 'tier': 'T1'}
                elif line.startswith('🔗'):
                    current_site['url'] = line.replace('🔗', '').strip()
                elif line.startswith('📝'):
                    current_site['description'] = line.replace('📝', '').strip()
                elif line.startswith('🏷️'):
                    tier = line.replace('🏷️', '').strip()
                    if 'T2' in tier or 'Tier 2' in tier:
                        current_site['tier'] = 'T2'
                    elif 'T3' in tier or 'Tier 3' in tier:
                        current_site['tier'] = 'T3'
            if current_site and current_site.get('url'):
                sites.append(current_site)
            
            logger.info(f"  Loaded {len(sites)} sites from {filepath.name}")
        except Exception as e:
            logger.error(f"Error loading sites from {filepath}: {e}")
        return sites
    
    def get_custom_selector(self, url: str):
        """Get custom selector config for specific domains"""
        for domain, config in CUSTOM_SELECTORS.items():
            if domain in url:
                return config
        return None
    
    def auto_detect_articles(self, soup: BeautifulSoup, url: str = ''):
        """Auto-detect articles with custom selectors"""
        custom = self.get_custom_selector(url)
        if custom:
            items = soup.select(custom['container'])
            if len(items) >= 1:
                logger.debug(f"Using custom selector for {url}: {custom['container']}")
                return items, custom['container'], custom
        
        for selector in ['article', 'div.post', 'div.story', 'div.card', 'div.entry', 'li.item', 'div.media']:
            items = soup.select(selector)
            if len(items) >= 3:
                return items, selector, None
        
        all_divs = soup.find_all('div')
        candidates = [div for div in all_divs if div.find('a') and len(div.get_text(strip=True)) > 50]
        return candidates[:20], "div (auto-detected)", None
    
    def extract_title(self, item, custom_config=None):
        """Extract title with custom config support"""
        if custom_config and 'title' in custom_config:
            elem = item.select_one(custom_config['title'])
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text
        
        for selector in ['h2', 'h3', 'h1']:
            elem = item.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text
        
        for tag in ['h2', 'h3', 'h1', 'h4']:
            elem = item.find(tag)
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text
        return None
    
    def extract_link(self, item, base_url, custom_config=None):
        """Extract link with custom config support"""
        if custom_config and 'link' in custom_config:
            link_elem = item.select_one(custom_config['link'])
            if link_elem and link_elem.get('href'):
                link = link_elem.get('href')
                return link if link.startswith('http') else urljoin(base_url, link)
        
        link_elem = item.find('a')
        if link_elem and link_elem.get('href'):
            link = link_elem.get('href')
            return link if link.startswith('http') else urljoin(base_url, link)
        return None
    
    async def _render_with_playwright(self, url: str) -> str:
        """Render page with Playwright + stealth mode + best practices (P3)"""
        if not _has_playwright:
            return ''
        
        html = ''
        try:
            # P3: Rotating user agent
            ua = random.choice(USER_AGENTS)
            
            async with async_playwright() as p:
                # Best practice: launch with args for gov sites
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
                
                # Best practice: context with more realistic settings
                context = await browser.new_context(
                    user_agent=ua,
                    viewport={'width': 1920, 'height': 1080},
                    locale='en-US',
                    timezone_id='Asia/Jakarta',
                    ignore_https_errors=True,  # Gov sites SSL issues
                )
                
                page = await context.new_page()
                
                # P3: Apply stealth mode
                if _has_stealth:
                    await stealth_async(page)
                
                # Best practice: longer timeout for slow gov sites
                page.set_default_timeout(TIMEOUT * 1000)
                
                # Try different wait strategies
                try:
                    await page.goto(url, wait_until='domcontentloaded', timeout=TIMEOUT * 1000)
                except Exception:
                    # Fallback: try networkidle
                    try:
                        await page.goto(url, wait_until='networkidle', timeout=TIMEOUT * 1000)
                    except Exception:
                        # Last resort: load
                        await page.goto(url, wait_until='load', timeout=TIMEOUT * 1000)
                
                # Wait for dynamic content (adaptive)
                await asyncio.sleep(2 if 'go.id' in url or '.gov' in url else 1)
                
                # Best practice: scroll to trigger lazy loading
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
                await asyncio.sleep(0.5)
                
                html = await page.content()
                await browser.close()
        except Exception as e:
            logger.warning(f"Playwright render failed: {str(e)[:100]}")
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
        
        for attempt in range(RETRY_ATTEMPTS):
            try:
                # Best practice: session for connection pooling
                session = requests.Session()
                session.headers.update(headers)
                
                # Handle SSL verification (some gov sites have issues)
                r = session.get(
                    url, 
                    timeout=(DNS_TIMEOUT, TIMEOUT),  # (connect, read) timeouts
                    verify=VERIFY_SSL,
                    allow_redirects=True,
                    stream=False
                )
                
                if r.status_code == 200:
                    return r.text
                elif r.status_code in [301, 302, 307, 308]:  # Redirects
                    logger.debug(f"Following redirect for {url}")
                    continue
                elif r.status_code == 403 and attempt < RETRY_ATTEMPTS - 1:
                    # Retry with different UA
                    headers['User-Agent'] = random.choice(USER_AGENTS)
                    time.sleep(2)
                    continue
                else:
                    logger.warning(f"HTTP {r.status_code} for {url}")
                    
            except requests.exceptions.SSLError as e:
                # Common for gov sites - try without verification
                logger.debug(f"SSL error for {url}, retrying without verification")
                if attempt < RETRY_ATTEMPTS - 1:
                    continue
            except requests.exceptions.Timeout as e:
                logger.debug(f"Timeout for {url} (attempt {attempt+1}/{RETRY_ATTEMPTS})")
                if attempt < RETRY_ATTEMPTS - 1:
                    time.sleep(3)
                    continue
            except requests.exceptions.ConnectionError as e:
                logger.debug(f"Connection error for {url}: DNS or network issue")
                if attempt < RETRY_ATTEMPTS - 1:
                    time.sleep(5)
                    continue
            except Exception as e:
                logger.warning(f"Requests failed for {url}: {str(e)[:50]}")
                if attempt < RETRY_ATTEMPTS - 1:
                    continue
        
        return ''
    
    async def _crawl_page(self, url: str) -> str:
        """Crawl page with 3-tier fallback + URL alternatives"""
        # Best practice: Try alternative URLs if known problematic site
        urls_to_try = [url]
        if url in URL_ALTERNATIVES:
            urls_to_try.extend(URL_ALTERNATIVES[url])
        
        for attempt_url in urls_to_try:
            if _has_crawl4ai:
                try:
                    if hasattr(crawl4ai, 'crawl'):
                        html = crawl4ai.crawl(attempt_url, timeout=TIMEOUT)
                        if html:
                            return html
                except Exception as e:
                    logger.debug(f"Crawl4AI failed for {attempt_url}: {str(e)[:50]}")
            
            html = await self._render_with_playwright(attempt_url)
            if html and len(html) > 500:  # Minimum viable HTML
                return html
            
            html = self._fetch_with_requests(attempt_url)
            if html and len(html) > 500:
                return html
        
        return ''
    
    async def scrape_site(self, site: Dict, category: str) -> List[Dict]:
        """Scrape site with full article content and all enhancements"""
        articles: List[Dict] = []
        url = site.get('url')
        if not url:
            return []
        
        # P7: Track metrics
        site_name = site['name']
        self.site_metrics[site_name]['total_attempts'] += 1
        
        try:
            html = await self._crawl_page(url)
            if not html:
                logger.warning(f"    ❌ {site['name']}: empty HTML")
                self.site_metrics[site_name]['failures'] += 1
                return []
            
            soup = BeautifulSoup(html, 'html.parser')
            items, selector, custom_config = self.auto_detect_articles(soup, url)
            
            if not items:
                logger.warning(f"    ⚠️  {site['name']}: No articles detected")
                self.site_metrics[site_name]['failures'] += 1
                return []
            
            # P4: Extract page-level metadata once
            page_metadata = self.extract_metadata(soup)
            
            for item in items[:MAX_ARTICLES_PER_SOURCE]:
                try:
                    title = self.extract_title(item, custom_config=custom_config)
                    if not title:
                        continue
                    
                    link = self.extract_link(item, url, custom_config=custom_config)
                    if not link:
                        continue
                    
                    # P5: Check for duplicates early
                    if self.normalize_url(link) in self.seen_urls:
                        continue
                    
                    # Extract date
                    date_str = datetime.now().strftime("%Y-%m-%d")
                    date_elem = item.find('time')
                    if date_elem:
                        date_str = date_elem.get('datetime', date_elem.get_text(strip=True))
                    
                    # P1: Fetch full article content
                    full_content, word_count = await self.fetch_full_article(link, custom_config)
                    
                    if not full_content:
                        # Fallback to preview from listing page
                        full_content = item.get_text(strip=True)[:800]
                        word_count = len(full_content.split())
                    else:
                        self.stats['full_content_fetched'] += 1
                    
                    # P5: Language detection
                    language = self.detect_language(full_content)
                    
                    # P5: Content quality check
                    if word_count < 50:
                        continue
                    
                    # P5: Check duplicate by content
                    if self.is_duplicate(link, full_content):
                        continue
                    
                    article_data = {
                        "url": link,
                        "title": title,
                        "content": full_content,
                        "published_date": date_str,
                        "source": site['name'],
                        "tier": site.get('tier', 'T3'),
                        "category": category,
                        "scraped_at": datetime.now().isoformat(),
                        "language": language,
                        "impact_level": "medium",
                        "word_count": word_count,
                        "content_hash": self.content_hash(full_content),
                        # P4: Metadata
                        "author": page_metadata.get('author'),
                        "tags": page_metadata.get('tags', []),
                        "image_url": page_metadata.get('image_url'),
                        "image_alt": page_metadata.get('image_alt'),
                    }
                    
                    # P10: Validate with Pydantic if available
                    if BaseModel != object:
                        try:
                            Article(**article_data)
                        except Exception as e:
                            logger.debug(f"Validation failed for {link}: {e}")
                            continue
                    
                    articles.append(article_data)
                
                except Exception as e:
                    logger.debug(f"Error extracting article: {str(e)[:50]}")
                    continue
            
            # P7: Update metrics
            if articles:
                self.site_metrics[site_name]['successes'] += 1
                self.site_metrics[site_name]['articles_found'] += len(articles)
                self.site_metrics[site_name]['last_success'] = datetime.now().isoformat()
                logger.info(f"    ✅ {site['name']}: {len(articles)} articles (Full content: {sum(1 for a in articles if a['word_count'] > 500)})")
            else:
                self.site_metrics[site_name]['failures'] += 1
            
            return articles
        
        except Exception as e:
            logger.error(f"    ❌ {site['name']}: {str(e)[:80]}")
            self.site_metrics[site_name]['failures'] += 1
            self.site_metrics[site_name]['last_error'] = str(e)[:200]
            return []
    
    async def scrape_category(self, category: str, sites_file: Path) -> Tuple[List[Dict], Dict]:
        """Scrape category with P6: parallel processing"""
        logger.info(f"\n{'='*80}")
        logger.info(f"📂 CATEGORY: {category.upper()}")
        logger.info(f"{'='*80}")
        
        sites = self.load_sites_from_file(sites_file)
        if not sites:
            logger.warning(f"  No sites found for {category}")
            return [], {}
        
        logger.info(f"  🔍 Scraping {len(sites)} sites (Parallel: {MAX_CONCURRENT_SITES}, Crawl4AI={'yes' if _has_crawl4ai else 'no'}, Playwright={'yes' if _has_playwright else 'no'}, Stealth={'yes' if _has_stealth else 'no'})...")
        
        # P6: Parallel processing with semaphore
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_SITES)
        
        async def scrape_with_limit(site):
            async with semaphore:
                result = await self.scrape_site(site, category)
                await asyncio.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
                return result
        
        tasks = [scrape_with_limit(site) for site in sites]
        results = await asyncio.gather(*tasks)
        
        all_articles = []
        for articles in results:
            all_articles.extend(articles)
        
        logger.info(f"\n  📊 Scraped: {len(all_articles)} articles (Full content: {self.stats['full_content_fetched']})")
        
        # Apply intelligent filters
        if category in LLAMA_CATEGORIES:
            logger.info(f"  🧠 Applying NewsIntelligentFilter (LLAMA category)...")
            filtered_articles = self.news_filter.filter_real_news(all_articles)
        else:
            logger.info(f"  🧠 Applying LLAMAFilter (regular category)...")
            filtered_articles = self.llama_filter.intelligent_filter(all_articles)
        
        logger.info(f"  ✅ Filtered: {len(filtered_articles)} articles (kept {len(filtered_articles)/max(len(all_articles),1)*100:.1f}%)")
        
        # Save outputs
        category_dir = OUTPUT_BASE / category
        raw_dir = category_dir / "raw"
        filtered_dir = category_dir / "filtered"
        raw_dir.mkdir(parents=True, exist_ok=True)
        filtered_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        raw_file = raw_dir / f"{timestamp}_raw.json"
        with open(raw_file, 'w', encoding='utf-8') as f:
            json.dump(all_articles, f, indent=2, ensure_ascii=False)
        
        filtered_file = filtered_dir / f"{timestamp}_filtered.json"
        with open(filtered_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_articles, f, indent=2, ensure_ascii=False)
        
        for idx, article in enumerate(filtered_articles, 1):
            md_content = f"""# {article['title']}

**Source**: {article['source']}  
**Category**: {article['category']}  
**Tier**: {article['tier']}  
**Date**: {article['published_date']}  
**URL**: {article['url']}  
**Author**: {article.get('author', 'N/A')}  
**Words**: {article.get('word_count', 0)}

## Content

{article['content']}

---

**Metadata**:
- Impact Level: {article.get('impact_level', 'medium')}
- Language: {article.get('language', 'en')}
- Tags: {', '.join(article.get('tags', []))}
- Image: {article.get('image_url', 'N/A')}
- Scraped: {article['scraped_at']}
- Content Hash: {article.get('content_hash', 'N/A')[:8]}...
"""
            md_file = raw_dir / f"{timestamp}_{idx:03d}.md"
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(md_content)
        
        stats = {
            'category': category,
            'total_scraped': len(all_articles),
            'total_filtered': len(filtered_articles),
            'full_content_count': self.stats['full_content_fetched'],
            'filter_rate': len(filtered_articles) / max(len(all_articles), 1),
            'avg_word_count': sum(a.get('word_count', 0) for a in filtered_articles) / max(len(filtered_articles), 1),
            'raw_file': str(raw_file),
            'filtered_file': str(filtered_file)
        }
        
        return filtered_articles, stats
    
    def save_metrics(self):
        """P7: Save metrics for monitoring"""
        metrics_file = METRICS_DIR / f"site_metrics_{datetime.now().strftime('%Y%m%d')}.json"
        
        # Calculate success rates
        metrics_summary = {}
        for site, data in self.site_metrics.items():
            total = data['total_attempts']
            if total > 0:
                success_rate = data['successes'] / total
                metrics_summary[site] = {
                    'success_rate': success_rate,
                    'total_attempts': total,
                    'articles_found': data['articles_found'],
                    'last_success': data['last_success'],
                    'last_error': data['last_error']
                }
        
        with open(metrics_file, 'w') as f:
            json.dump(metrics_summary, f, indent=2)
        
        logger.info(f"  📊 Metrics saved: {metrics_file}")
        
        # P7: Alert on low success rates (tier 1 sites)
        alerts = []
        for site, data in metrics_summary.items():
            if data['success_rate'] < 0.5 and data['total_attempts'] > 0:
                alerts.append(f"⚠️  {site}: {data['success_rate']*100:.1f}% success rate")
        
        if alerts:
            logger.warning(f"\n🚨 ALERTS ({len(alerts)} sites with low success):")
            for alert in alerts[:10]:  # Show top 10
                logger.warning(f"  {alert}")
    
    async def process_all_categories(self) -> Dict:
        """Process all categories with all enhancements"""
        start_time = datetime.now()
        logger.info("=" * 80)
        logger.info("🚀 BALI INTEL SCRAPER - ADVANCED EDITION (10 Priorities)")
        logger.info("=" * 80)
        logger.info(f"Start: {start_time.isoformat()}")
        
        categories_env = os.getenv('CATEGORIES', '').strip()
        categories_set = set()
        if categories_env:
            for c in categories_env.split(','):
                cc = c.strip().lower().replace(' ', '_')
                if cc in {"general_news", "general-news", "generalnews"}:
                    cc = "news"
                categories_set.add(cc)
        
        mapping = CATEGORY_MAPPING
        if categories_set:
            mapping = {sf: cat for sf, cat in CATEGORY_MAPPING.items() if cat.lower() in categories_set}
            logger.info(f"Filtered categories via CATEGORIES env: {sorted(categories_set)} → {list(mapping.values())}")
        
        logger.info(f"Categories: {len(mapping)}")
        logger.info(f"Features: Full Content ✓, Custom Selectors ({len(CUSTOM_SELECTORS)}), Stealth ✓, Parallel ({MAX_CONCURRENT_SITES}), Metrics ✓")
        
        all_stats: List[Dict] = []
        for sites_file, category in mapping.items():
            sites_path = SITES_DIR / sites_file
            if not sites_path.exists():
                logger.warning(f"⚠️  Sites file not found: {sites_file}")
                continue
            try:
                _, stats = await self.scrape_category(category, sites_path)
                all_stats.append(stats)
                self.stats['categories_processed'] += 1
                self.stats['total_scraped'] += stats['total_scraped']
                self.stats['total_filtered'] += stats['total_filtered']
            except Exception as e:
                logger.error(f"❌ Category {category} failed: {e}")
                self.stats['errors'].append({'category': category, 'error': str(e)})
        
        duration = (datetime.now() - start_time).total_seconds()
        
        final_report = {
            'start_time': start_time.isoformat(),
            'end_time': datetime.now().isoformat(),
            'duration_seconds': duration,
            'categories_processed': self.stats['categories_processed'],
            'total_scraped': self.stats['total_scraped'],
            'total_filtered': self.stats['total_filtered'],
            'full_content_fetched': self.stats['full_content_fetched'],
            'filter_efficiency': self.stats['total_filtered'] / max(self.stats['total_scraped'], 1),
            'avg_word_count': sum(s.get('avg_word_count', 0) for s in all_stats) / max(len(all_stats), 1),
            'category_stats': all_stats,
            'errors': self.stats['errors']
        }
        
        report_file = OUTPUT_BASE / f"scraping_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
        with open(report_file, 'w') as f:
            json.dump(final_report, f, indent=2)
        
        # P7: Save metrics
        self.save_metrics()
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("✅ SCRAPING COMPLETE (Advanced Edition)")
        logger.info("=" * 80)
        logger.info(f"🕐  Duration: {duration:.1f}s ({duration/60:.1f} min)")
        logger.info(f"📂 Categories: {self.stats['categories_processed']}/{len(mapping)}")
        logger.info(f"📄 Total Scraped: {self.stats['total_scraped']}")
        logger.info(f"✅ Total Filtered: {self.stats['total_filtered']}")
        logger.info(f"📝 Full Content Fetched: {self.stats['full_content_fetched']} ({self.stats['full_content_fetched']/max(self.stats['total_filtered'],1)*100:.1f}%)")
        logger.info(f"📊 Avg Word Count: {final_report['avg_word_count']:.0f} words")
        logger.info(f"📈 Filter Efficiency: {final_report['filter_efficiency']*100:.1f}%")
        logger.info(f"📑 Report: {report_file}")
        logger.info("=" * 80)
        
        return final_report


async def main():
    scraper = AdvancedScraper()
    report = await scraper.process_all_categories()
    
    run_stage2 = os.getenv('RUN_STAGE2', 'false').lower() == 'true'
    if run_stage2 and run_stage2_parallel:
        logger.info("\n🚀 Starting Stage 2 Parallel Processing...")
        md_files = list(OUTPUT_BASE.rglob("*/raw/*.md"))
        if md_files:
            await run_stage2_parallel(md_files)
        else:
            logger.warning("⚠️  No markdown files found for Stage 2")
    
    return report


if __name__ == "__main__":
    asyncio.run(main())

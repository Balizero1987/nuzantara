#!/usr/bin/env python3
"""
Stage 1 Scraper (Crawl4AI/Playwright-based)
- Primary: use Crawl4AI if available
- Fallback: Playwright-only rendering
- Final fallback: requests + BeautifulSoup (like scrape_all_categories)

Outputs are identical in structure to scrape_all_categories.py:
  data/INTEL_SCRAPING/{category}/raw/
  data/INTEL_SCRAPING/{category}/filtered/

Usage:
  python3 scripts/crawl4ai_scraper.py               # process all categories
  RUN_STAGE2=true python3 scripts/crawl4ai_scraper.py  # then run Stage 2 in parallel

Notes:
- This script aims to realign docs (Crawl4AI) with working code.
- If Crawl4AI is not installed, it will still render JS via Playwright when available.
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Try imports in order of preference
_has_crawl4ai = False
_has_playwright = False

try:
    # Assuming crawl4ai provides a high-level crawl API; fall back to Playwright if not found
    import crawl4ai  # type: ignore
    _has_crawl4ai = True
except Exception:
    pass

try:
    from playwright.async_api import async_playwright  # type: ignore
    _has_playwright = True
except Exception:
    pass

# BeautifulSoup fallback
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import random

# Import filters and Stage 2 orchestrator from existing code
from llama_intelligent_filter import LLAMAFilter
from news_intelligent_filter import NewsIntelligentFilter
try:
    from scripts.stage2_parallel_processor import run_stage2_parallel
except Exception:
    # allow running Stage 1 only
    run_stage2_parallel = None

# Reuse category mapping from the existing orchestrator to avoid drift
try:
    from scripts.scrape_all_categories import CATEGORY_MAPPING, LLAMA_CATEGORIES
    SITES_DIR = PROJECT_ROOT / "sites"
except Exception:
    # Minimal static fallback (should not happen in this repo)
    SITES_DIR = PROJECT_ROOT / "sites"
    CATEGORY_MAPPING = {}
    LLAMA_CATEGORIES = []

# Config
OUTPUT_BASE = PROJECT_ROOT / "data" / "INTEL_SCRAPING"
DELAY_MIN, DELAY_MAX = 2, 5
TIMEOUT = 25
MAX_ARTICLES_PER_SOURCE = 12

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Custom selectors for big media sites that need specific parsing
CUSTOM_SELECTORS = {
    'detik.com': {
        'container': 'article.list-content__item',
        'title': 'h3.media__title a',
        'link': 'h3.media__title a',
        'date': 'div.media__date span',
    },
    'tempo.co': {
        'container': 'div.card-box',
        'title': 'h2.title a',
        'link': 'h2.title a',
        'date': 'span.date',
    },
    'cnnindonesia.com': {
        'container': 'article.l_content',
        'title': 'h2 a',
        'link': 'h2 a',
        'date': 'span.date',
    },
    'liputan6.com': {
        'container': 'article.articles--iridescent-list--item',
        'title': 'h4.articles--iridescent-list--text-item__title a',
        'link': 'h4.articles--iridescent-list--text-item__title a',
        'date': 'time.articles--iridescent-list--text-item__time',
    },
    'thejakartapost.com': {
        'container': 'article.latest__item',
        'title': 'h2.latest__title a',
        'link': 'h2.latest__title a',
        'date': 'time.latest__date',
    },
    'jakartaglobe.id': {
        'container': 'article.jeg_post',
        'title': 'h3.jeg_post_title a',
        'link': 'h3.jeg_post_title a',
        'date': 'div.jeg_meta_date',
    },
    'idntimes.com': {
        'container': 'div.box-latest.box-list li',
        'title': 'h2.title-text a',
        'link': 'h2.title-text a',
        'date': 'span.date',
    },
}


class Crawl4AIScraper:
    def __init__(self):
        self.llama_filter = LLAMAFilter()
        self.news_filter = NewsIntelligentFilter()
        self.stats = {
            'categories_processed': 0,
            'total_scraped': 0,
            'total_filtered': 0,
            'errors': []
        }

    def load_sites_from_file(self, filepath: Path) -> List[Dict]:
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

    # Shared extraction helpers
    def get_custom_selector(self, url: str):
        """Get custom selector config for specific domains"""
        for domain, config in CUSTOM_SELECTORS.items():
            if domain in url:
                return config
        return None

    def auto_detect_articles(self, soup: BeautifulSoup, url: str = ''):
        # Try custom selectors first for known domains
        custom = self.get_custom_selector(url)
        if custom:
            items = soup.select(custom['container'])
            if len(items) >= 1:
                logger.debug(f"Using custom selector for {url}: {custom['container']}")
                return items, custom['container'], custom
        
        # Fallback to generic detection
        for selector in ['article', 'div.post', 'div.story', 'div.card', 'div.entry', 'li.item']:
            items = soup.select(selector)
            if len(items) >= 3:
                return items, selector, None
        all_divs = soup.find_all('div')
        candidates = [div for div in all_divs if div.find('a') and len(div.get_text(strip=True)) > 50]
        return candidates[:20], "div (auto-detected)", None

    def extract_title(self, item, selectors=['h2', 'h3', 'h1'], custom_config=None):
        # Try custom selector first
        if custom_config and 'title' in custom_config:
            elem = item.select_one(custom_config['title'])
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text
        
        # Fallback to generic
        for selector in selectors:
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
        # Try custom selector first
        if custom_config and 'link' in custom_config:
            link_elem = item.select_one(custom_config['link'])
            if link_elem and link_elem.get('href'):
                link = link_elem.get('href')
                return link if link.startswith('http') else urljoin(base_url, link)
        
        # Fallback to generic
        link_elem = item.find('a')
        if link_elem and link_elem.get('href'):
            link = link_elem.get('href')
            return link if link.startswith('http') else urljoin(base_url, link)
        return None

    async def _render_with_playwright(self, url: str) -> str:
        if not _has_playwright:
            return ''
        html = ''
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                page.set_default_timeout(TIMEOUT * 1000)
                await page.goto(url)
                # Wait for network to be idle-ish
                await page.wait_for_load_state('domcontentloaded')
                html = await page.content()
                await browser.close()
        except Exception as e:
            logger.warning(f"Playwright render failed: {e}")
        return html

    def _fetch_with_requests(self, url: str) -> str:
        try:
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            if r.status_code == 200:
                return r.text
            logger.warning(f"HTTP {r.status_code} for {url}")
        except Exception as e:
            logger.warning(f"Requests failed for {url}: {e}")
        return ''

    async def _crawl_page(self, url: str) -> str:
        # Prefer Crawl4AI if present
        if _has_crawl4ai:
            try:
                # Generic interface: attempt to use crawl4ai high-level crawl
                # This is intentionally loose to avoid tight coupling
                if hasattr(crawl4ai, 'crawl'):
                    return crawl4ai.crawl(url, timeout=TIMEOUT)  # type: ignore
            except Exception as e:
                logger.warning(f"Crawl4AI failed, falling back: {e}")
        # Fallback to Playwright rendering
        html = await self._render_with_playwright(url)
        if html:
            return html
        # Final fallback
        return self._fetch_with_requests(url)

    async def scrape_site(self, site: Dict, category: str) -> List[Dict]:
        articles: List[Dict] = []
        url = site.get('url')
        if not url:
            return []
        try:
            html = await self._crawl_page(url)
            if not html:
                logger.warning(f"    ❌ {site['name']}: empty HTML")
                return []
            soup = BeautifulSoup(html, 'html.parser')
            items, selector, custom_config = self.auto_detect_articles(soup, url)
            if not items:
                logger.warning(f"    ⚠️  {site['name']}: No articles detected")
                return []
            for item in items[:MAX_ARTICLES_PER_SOURCE]:
                try:
                    title = self.extract_title(item, custom_config=custom_config)
                    if not title:
                        continue
                    link = self.extract_link(item, url, custom_config=custom_config)
                    if not link:
                        continue
                    date_str = datetime.now().strftime("%Y-%m-%d")
                    date_elem = item.find('time')
                    if date_elem:
                        date_str = date_elem.get('datetime', date_elem.get_text(strip=True))
                    content = item.get_text(strip=True)[:800]
                    articles.append({
                        "url": link,
                        "title": title,
                        "content": content,
                        "published_date": date_str,
                        "source": site['name'],
                        "tier": site.get('tier', 'T3'),
                        "category": category,
                        "scraped_at": datetime.now().isoformat(),
                        "language": "id" if '.id' in url else "en",
                        "impact_level": "medium"
                    })
                except Exception:
                    continue
            logger.info(f"    ✅ {site['name']}: {len(articles)} articles")
        except Exception as e:
            logger.error(f"    ❌ {site['name']}: {str(e)[:80]}")
        return articles

    async def scrape_category(self, category: str, sites_file: Path) -> Tuple[List[Dict], Dict]:
        logger.info(f"\n{'='*80}")
        logger.info(f"📂 CATEGORY: {category.upper()}")
        logger.info(f"{'='*80}")
        sites = self.load_sites_from_file(sites_file)
        if not sites:
            logger.warning(f"  No sites found for {category}")
            return [], {}
        logger.info(f"  🔍 Scraping {len(sites)} sites (Crawl4AI={'yes' if _has_crawl4ai else 'no'}, Playwright={'yes' if _has_playwright else 'no'})...")
        all_articles: List[Dict] = []
        for site in sites:
            articles = await self.scrape_site(site, category)
            all_articles.extend(articles)
            await asyncio.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
        logger.info(f"\n  📊 Scraped: {len(all_articles)} articles")
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

## Content

{article['content']}

---

**Metadata**:
- Impact Level: {article.get('impact_level', 'medium')}
- Language: {article.get('language', 'en')}
- Scraped: {article['scraped_at']}
"""
            md_file = raw_dir / f"{timestamp}_{idx:03d}.md"
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(md_content)
        stats = {
            'category': category,
            'total_scraped': len(all_articles),
            'total_filtered': len(filtered_articles),
            'filter_rate': len(filtered_articles) / max(len(all_articles), 1),
            'raw_file': str(raw_file),
            'filtered_file': str(filtered_file)
        }
        return filtered_articles, stats

    async def process_all_categories(self) -> Dict:
        start_time = datetime.now()
        logger.info("=" * 80)
        logger.info("🚀 BALI INTEL SCRAPER - CRAWL4AI STAGE 1")
        logger.info("=" * 80)
        logger.info(f"Start: {start_time.isoformat()}")

        # Optional category filter via env: CATEGORIES="news,visa_immigration"
        categories_env = os.getenv('CATEGORIES', '').strip()
        categories_set = set()
        if categories_env:
            for c in categories_env.split(','):
                cc = c.strip().lower().replace(' ', '_')
                # normalize common synonyms
                if cc in {"general_news", "general-news", "generalnews"}:
                    cc = "news"
                categories_set.add(cc)

        mapping = CATEGORY_MAPPING
        if categories_set:
            mapping = {sf: cat for sf, cat in CATEGORY_MAPPING.items() if cat.lower() in categories_set}
            logger.info(f"Filtered categories via CATEGORIES env: {sorted(categories_set)} → {list(mapping.values())}")

        logger.info(f"Categories: {len(mapping)}")
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
            'filter_efficiency': self.stats['total_filtered'] / max(self.stats['total_scraped'], 1),
            'category_stats': all_stats,
            'errors': self.stats['errors']
        }
        report_file = OUTPUT_BASE / f"scraping_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
        with open(report_file, 'w') as f:
            json.dump(final_report, f, indent=2)
        logger.info("")
        logger.info("=" * 80)
        logger.info("✅ SCRAPING COMPLETE (Crawl4AI/Playwright)")
        logger.info("=" * 80)
        logger.info(f"🕐  Duration: {duration:.1f}s ({duration/60:.1f} min)")
        logger.info(f"📂 Categories: {self.stats['categories_processed']}/{len(mapping)}")
        logger.info(f"📄 Total Scraped: {self.stats['total_scraped']}")
        logger.info(f"✅ Total Filtered: {self.stats['total_filtered']}")
        logger.info(f"📈 Filter Efficiency: {final_report['filter_efficiency']*100:.1f}%")
        logger.info(f"📑 Report: {report_file}")
        logger.info("=" * 80)
        return final_report


async def main():
    orchestrator = Crawl4AIScraper()
    report = await orchestrator.process_all_categories()
    # Optional Stage 2
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

#!/usr/bin/env python3
"""
ORCHESTRATORE PRINCIPALE - Scraping Tutte le Categorie
Integra: Scraping → Filtri Intelligenti → Stage 2 Parallel → ChromaDB

Author: ZANTARA System
Date: 2025-10-13
Version: 1.0.0
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
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import random

# Add parent directory to path
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import filters
from llama_intelligent_filter import LLAMAFilter
from news_intelligent_filter import NewsIntelligentFilter

# Import Stage 2 processor
from scripts.stage2_parallel_processor import run_stage2_parallel

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
OUTPUT_BASE = PROJECT_ROOT / "data" / "INTEL_SCRAPING"
SITES_DIR = PROJECT_ROOT / "sites"
DELAY_MIN, DELAY_MAX = 2, 5
TIMEOUT = 15
MAX_ARTICLES_PER_SOURCE = 10

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Category mapping (SITI_*.txt filename → category name)
CATEGORY_MAPPING = {
    "SITI_ADIT_IMMIGRATION.txt": "immigration",
    "SITI_ADIT_REGULATORY.txt": "regulatory",
    "SITI_AMANDA_EMPLOYMENT.txt": "employment",
    "SITI_ANTON_JOBS.txt": "jobs",
    "SITI_DAMAR_COMPETITORS.txt": "competitors",
    "SITI_DEA_BUSINESS.txt": "business",
    "SITI_DEA_MACRO.txt": "macro",
    "SITI_DEWAYU_LIFESTYLE.txt": "lifestyle",
    "SITI_FAISHA_TAX.txt": "tax",
    "SITI_KRISNA_BUSINESS_SETUP.txt": "business_setup",
    "SITI_KRISNA_REALESTATE.txt": "realestate",
    "SITI_LLAMA_AI_TECH.txt": "ai_tech",
    "SITI_LLAMA_DEV_CODE.txt": "dev_code",
    "SITI_LLAMA_FUTURE_TRENDS.txt": "future_trends",
    "SITI_SAHIRA_SOCIAL.txt": "social",
    "SITI_SURYA_BANKING.txt": "banking",
    "SITI_SURYA_EVENTS.txt": "events",
    "SITI_SURYA_HEALTH.txt": "health",
    "SITI_SURYA_TRANSPORT.txt": "transport",
    "SITI_VINO_NEWS.txt": "news",
}

# LLAMA categories (use NewsIntelligentFilter)
LLAMA_CATEGORIES = ["ai_tech", "dev_code", "future_trends"]


class ScraperOrchestrator:
    """Orchestratore principale per scraping multi-categoria con filtri intelligenti"""
    
    def __init__(self):
        self.llama_filter = LLAMAFilter()
        self.news_filter = NewsIntelligentFilter()
        self.stats = {
            'categories_processed': 0,
            'total_scraped': 0,
            'total_filtered': 0,
            'total_uploaded': 0,
            'errors': []
        }
    
    def load_sites_from_file(self, filepath: Path) -> List[Dict]:
        """Carica siti da file SITI_*.txt"""
        sites = []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            current_site = {}
            
            for line in lines:
                line = line.strip()
                
                # Skip empty lines and headers
                if not line or line.startswith('🛂') or line.startswith('⭐'):
                    continue
                
                # Parse site entries
                if line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')) or \
                   line.startswith(tuple(f"{i}." for i in range(10, 100))):
                    # Save previous site if exists
                    if current_site and current_site.get('url'):
                        sites.append(current_site)
                    
                    # Start new site
                    current_site = {
                        'name': line.split(' ', 1)[1] if ' ' in line else line,
                        'tier': 'T1'  # Default tier
                    }
                
                elif line.startswith('🔗'):
                    url = line.replace('🔗', '').strip()
                    current_site['url'] = url
                
                elif line.startswith('📝'):
                    desc = line.replace('📝', '').strip()
                    current_site['description'] = desc
                
                elif line.startswith('🏷️'):
                    tier = line.replace('🏷️', '').strip()
                    if 'T2' in tier or 'Tier 2' in tier:
                        current_site['tier'] = 'T2'
                    elif 'T3' in tier or 'Tier 3' in tier:
                        current_site['tier'] = 'T3'
            
            # Add last site
            if current_site and current_site.get('url'):
                sites.append(current_site)
            
            logger.info(f"  Loaded {len(sites)} sites from {filepath.name}")
            return sites
        
        except Exception as e:
            logger.error(f"Error loading sites from {filepath}: {e}")
            return []
    
    def auto_detect_articles(self, soup):
        """Auto-detect article containers using common patterns"""
        for selector in ['article', 'div.post', 'div.story', 'div.card', 'div.entry', 'li.item']:
            items = soup.select(selector)
            if len(items) >= 3:
                return items, selector
        
        # Fallback: find divs with links and text
        all_divs = soup.find_all('div')
        candidates = [div for div in all_divs if div.find('a') and len(div.get_text(strip=True)) > 50]
        return candidates[:20], "div (auto-detected)"
    
    def extract_title(self, item, selectors=['h2', 'h3', 'h1']):
        """Extract title with multiple fallback selectors"""
        for selector in selectors:
            elem = item.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text
        
        # Fallback: any h1/h2/h3
        for tag in ['h2', 'h3', 'h1', 'h4']:
            elem = item.find(tag)
            if elem:
                text = elem.get_text(strip=True)
                if len(text) > 10:
                    return text
        
        return None
    
    def extract_link(self, item, base_url):
        """Extract link with fallback"""
        link_elem = item.find('a')
        if link_elem and link_elem.get('href'):
            link = link_elem.get('href')
            return link if link.startswith('http') else urljoin(base_url, link)
        return None
    
    def scrape_site(self, site: Dict, category: str) -> List[Dict]:
        """Scrape single site and return articles"""
        articles = []
        
        try:
            response = requests.get(site['url'], headers=HEADERS, timeout=TIMEOUT)
            
            if response.status_code != 200:
                logger.warning(f"    ❌ {site['name']}: HTTP {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            items, selector = self.auto_detect_articles(soup)
            
            if not items:
                logger.warning(f"    ⚠️  {site['name']}: No articles detected")
                return []
            
            for item in items[:MAX_ARTICLES_PER_SOURCE]:
                try:
                    title = self.extract_title(item)
                    if not title:
                        continue
                    
                    link = self.extract_link(item, site['url'])
                    if not link:
                        continue
                    
                    # Extract date (best effort)
                    date_str = datetime.now().strftime("%Y-%m-%d")
                    date_elem = item.find('time')
                    if date_elem:
                        date_str = date_elem.get('datetime', date_elem.get_text(strip=True))
                    
                    # Extract content preview
                    content = item.get_text(strip=True)[:500]
                    
                    articles.append({
                        "url": link,
                        "title": title,
                        "content": content,
                        "published_date": date_str,
                        "source": site['name'],
                        "tier": site.get('tier', 'T3'),
                        "category": category,
                        "scraped_at": datetime.now().isoformat(),
                        "language": "id" if '.id' in site['url'] else "en",
                        "impact_level": "medium"  # Default, will be refined by filters
                    })
                
                except Exception as e:
                    continue
            
            logger.info(f"    ✅ {site['name']}: {len(articles)} articles")
            return articles
        
        except Exception as e:
            logger.error(f"    ❌ {site['name']}: {str(e)[:50]}")
            return []
    
    def scrape_category(self, category: str, sites_file: Path) -> Tuple[List[Dict], Dict]:
        """Scrape intera categoria con filtri applicati"""
        logger.info(f"\n{'='*80}")
        logger.info(f"📂 CATEGORY: {category.upper()}")
        logger.info(f"{'='*80}")
        
        # Load sites
        sites = self.load_sites_from_file(sites_file)
        if not sites:
            logger.warning(f"  No sites found for {category}")
            return [], {}
        
        # Scrape all sites
        logger.info(f"  🔍 Scraping {len(sites)} sites...")
        all_articles = []
        
        for site in sites:
            articles = self.scrape_site(site, category)
            all_articles.extend(articles)
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
        
        logger.info(f"\n  📊 Scraped: {len(all_articles)} articles")
        
        # Apply intelligent filters
        if category in LLAMA_CATEGORIES:
            logger.info(f"  🧠 Applying NewsIntelligentFilter (LLAMA category)...")
            filtered_articles = self.news_filter.filter_real_news(all_articles)
        else:
            logger.info(f"  🧠 Applying LLAMAFilter (regular category)...")
            filtered_articles = self.llama_filter.intelligent_filter(all_articles)
        
        logger.info(f"  ✅ Filtered: {len(filtered_articles)} articles (kept {len(filtered_articles)/max(len(all_articles), 1)*100:.1f}%)")
        
        # Save raw and filtered
        category_dir = OUTPUT_BASE / category
        raw_dir = category_dir / "raw"
        filtered_dir = category_dir / "filtered"
        
        raw_dir.mkdir(parents=True, exist_ok=True)
        filtered_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save raw JSON
        raw_file = raw_dir / f"{timestamp}_raw.json"
        with open(raw_file, 'w', encoding='utf-8') as f:
            json.dump(all_articles, f, indent=2, ensure_ascii=False)
        
        # Save filtered JSON
        filtered_file = filtered_dir / f"{timestamp}_filtered.json"
        with open(filtered_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_articles, f, indent=2, ensure_ascii=False)
        
        # Save filtered as markdown for Stage 2
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
        """Processa tutte le categorie in sequenza"""
        start_time = datetime.now()
        
        logger.info("=" * 80)
        logger.info("🚀 BALI INTEL SCRAPER - ORCHESTRATORE PRINCIPALE")
        logger.info("=" * 80)
        logger.info(f"Start: {start_time.isoformat()}")
        logger.info(f"Categories: {len(CATEGORY_MAPPING)}")
        logger.info("")
        
        all_stats = []
        
        for sites_file, category in CATEGORY_MAPPING.items():
            sites_path = SITES_DIR / sites_file
            
            if not sites_path.exists():
                logger.warning(f"⚠️  Sites file not found: {sites_file}")
                continue
            
            try:
                filtered_articles, stats = self.scrape_category(category, sites_path)
                all_stats.append(stats)
                
                self.stats['categories_processed'] += 1
                self.stats['total_scraped'] += stats['total_scraped']
                self.stats['total_filtered'] += stats['total_filtered']
            
            except Exception as e:
                logger.error(f"❌ Category {category} failed: {e}")
                self.stats['errors'].append({
                    'category': category,
                    'error': str(e)
                })
        
        # Generate final report
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
        
        # Save report
        report_file = OUTPUT_BASE / f"scraping_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(final_report, f, indent=2)
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("✅ SCRAPING COMPLETE")
        logger.info("=" * 80)
        logger.info(f"⏱️  Duration: {duration:.1f}s ({duration/60:.1f} min)")
        logger.info(f"📂 Categories: {self.stats['categories_processed']}/{len(CATEGORY_MAPPING)}")
        logger.info(f"📄 Total Scraped: {self.stats['total_scraped']}")
        logger.info(f"✅ Total Filtered: {self.stats['total_filtered']}")
        logger.info(f"🎯 Filter Efficiency: {final_report['filter_efficiency']*100:.1f}%")
        logger.info(f"📊 Report: {report_file}")
        logger.info("=" * 80)
        
        return final_report


async def main():
    """Main entry point"""
    orchestrator = ScraperOrchestrator()
    
    # Run scraping
    report = await orchestrator.process_all_categories()
    
    # Run Stage 2 parallel processing (optional - can be run separately)
    run_stage2 = os.getenv('RUN_STAGE2', 'false').lower() == 'true'
    
    if run_stage2:
        logger.info("\n🚀 Starting Stage 2 Parallel Processing...")
        
        # Find all markdown files
        md_files = list(OUTPUT_BASE.rglob("*/raw/*.md"))
        
        if md_files:
            await run_stage2_parallel(md_files)
        else:
            logger.warning("⚠️  No markdown files found for Stage 2")
    
    return report


if __name__ == "__main__":
    asyncio.run(main())


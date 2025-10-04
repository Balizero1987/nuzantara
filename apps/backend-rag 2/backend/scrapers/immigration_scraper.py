"""
Immigration Scraper for Indonesia
Tiers: T1 (official), T2 (accredited), T3 (community)
Uses Gemini Flash for analysis
"""

import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import time
from typing import List, Dict, Any
import hashlib
from pathlib import Path
import chromadb
from loguru import logger
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))


class GeminiClient:
    """Gemini Flash client for content analysis"""

    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    def analyze(self, content: str, source_tier: str) -> Dict[str, Any]:
        """Analyze scraped content and extract structured data"""

        prompt = f"""Analyze this Indonesian immigration/visa content and extract structured information.

Source Tier: {source_tier}
Content: {content[:2000]}

Extract as JSON:
{{
  "visa_types": ["list of visa types mentioned"],
  "change_type": "regulation|procedure|fee|requirement|deadline|announcement",
  "effective_date": "YYYY-MM-DD or null",
  "impact_level": "high|medium|low",
  "summary_id": "1-2 sentence summary in Indonesian",
  "summary_en": "1-2 sentence summary in English",
  "affected_groups": ["workers", "investors", "tourists", "students", etc],
  "requirements": ["list of key requirements if any"],
  "urgency": "immediate|soon|future",
  "source_reliability": "official|accredited|community"
}}

Output ONLY valid JSON, no other text."""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()

            # Clean markdown if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            return json.loads(text)

        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return None


class ImmigrationScraper:
    """Multi-tier immigration scraper for Indonesia"""

    def __init__(self, chroma_path: str = "./data/immigration_kb"):
        self.gemini = GeminiClient()
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)

        # Create collections for each tier
        self.collections = {}
        for tier in ["t1", "t2", "t3"]:
            try:
                self.collections[tier] = self.chroma_client.get_collection(f"immigration_{tier}")
            except:
                self.collections[tier] = self.chroma_client.create_collection(f"immigration_{tier}")

        self.cache_file = Path("immigration_scraper_cache.json")
        self.seen_hashes = self.load_cache()

        # TIER 1: Official sources (truth)
        self.sources_t1 = [
            {
                "name": "Imigrasi Indonesia",
                "url": "https://www.imigrasi.go.id/",
                "tier": "t1",
                "selectors": ["div.content", "article"]
            },
            {
                "name": "Kemnaker",
                "url": "https://kemnaker.go.id/",
                "tier": "t1",
                "selectors": ["div.content", "article"]
            },
            {
                "name": "BKPM",
                "url": "https://www.bkpm.go.id/",
                "tier": "t1",
                "selectors": ["div.content", "article"]
            }
        ]

        # TIER 2: Accredited opinions
        self.sources_t2 = [
            {
                "name": "Jakarta Post",
                "url": "https://www.thejakartapost.com/search?q=visa",
                "tier": "t2",
                "selectors": ["article.post"]
            },
            {
                "name": "Hukumonline",
                "url": "https://www.hukumonline.com/",
                "tier": "t2",
                "selectors": ["article"]
            }
        ]

        # TIER 3: Community sentiment (for marketing insights)
        self.sources_t3 = [
            {
                "name": "Expat Forum",
                "url": "https://www.expatindo.org/",
                "tier": "t3",
                "selectors": ["div.post-content"]
            }
        ]

        self.all_sources = self.sources_t1 + self.sources_t2 + self.sources_t3

    def load_cache(self) -> set:
        if self.cache_file.exists():
            with open(self.cache_file, 'r') as f:
                return set(json.load(f))
        return set()

    def save_cache(self):
        with open(self.cache_file, 'w') as f:
            json.dump(list(self.seen_hashes), f)

    def content_hash(self, content: str) -> str:
        return hashlib.md5(content.encode()).hexdigest()

    def scrape_source(self, source: Dict) -> List[Dict[str, Any]]:
        """Scrape a single source"""
        logger.info(f"Scraping [{source['tier'].upper()}]: {source['name']}")

        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            }
            response = requests.get(source['url'], headers=headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            items = []

            for selector in source['selectors']:
                elements = soup.select(selector)

                for elem in elements[:5]:  # Top 5 recent
                    text = elem.get_text(strip=True)

                    if len(text) < 100:
                        continue

                    content_id = self.content_hash(text)
                    if content_id in self.seen_hashes:
                        continue

                    items.append({
                        "content": text,
                        "source": source['name'],
                        "tier": source['tier'],
                        "url": source['url'],
                        "scraped_at": datetime.now().isoformat(),
                        "content_id": content_id
                    })

                    self.seen_hashes.add(content_id)

            logger.info(f"Found {len(items)} new items from {source['name']}")
            return items

        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {e}")
            return []

    def analyze_and_save(self, item: Dict[str, Any]):
        """Analyze with Gemini and save to appropriate tier collection"""

        logger.info(f"Analyzing [{item['tier'].upper()}] content with Gemini...")
        analysis = self.gemini.analyze(item['content'], item['tier'])

        if not analysis:
            return

        # Create rich document
        doc_text = f"""
Source: {item['source']} (Tier {item['tier'].upper()})
Date: {item['scraped_at']}

Summary (ID): {analysis.get('summary_id', '')}
Summary (EN): {analysis.get('summary_en', '')}

Visa Types: {', '.join(analysis.get('visa_types', []))}
Change Type: {analysis.get('change_type', '')}
Impact Level: {analysis.get('impact_level', '')}
Urgency: {analysis.get('urgency', '')}

Affected Groups: {', '.join(analysis.get('affected_groups', []))}
Requirements: {', '.join(analysis.get('requirements', []))}

Original Content:
{item['content'][:1500]}
"""

        metadata = {
            "source": item['source'],
            "tier": item['tier'],
            "url": item['url'],
            "scraped_at": item['scraped_at'],
            "content_id": item['content_id'],
            "visa_types": json.dumps(analysis.get('visa_types', [])),
            "change_type": analysis.get('change_type', ''),
            "impact_level": analysis.get('impact_level', ''),
            "urgency": analysis.get('urgency', ''),
            "effective_date": analysis.get('effective_date', ''),
        }

        try:
            collection = self.collections[item['tier']]
            collection.add(
                documents=[doc_text],
                ids=[item['content_id']],
                metadatas=[metadata]
            )
            logger.success(f"Saved to {item['tier'].upper()} KB: {analysis.get('summary_en', '')[:50]}...")
        except Exception as e:
            logger.error(f"Error saving to ChromaDB: {e}")

    def run_cycle(self):
        """Run one complete scraping cycle"""
        logger.info("=" * 70)
        logger.info("IMMIGRATION SCRAPER - Starting cycle")
        logger.info("=" * 70)

        total_new = 0

        for source in self.all_sources:
            items = self.scrape_source(source)

            for item in items:
                self.analyze_and_save(item)
                total_new += 1
                time.sleep(3)  # Rate limiting

            time.sleep(5)

        self.save_cache()

        logger.info("=" * 70)
        logger.info(f"Cycle complete. Processed {total_new} new items")
        logger.info(f"T1 (Official): {self.collections['t1'].count()} total")
        logger.info(f"T2 (Accredited): {self.collections['t2'].count()} total")
        logger.info(f"T3 (Community): {self.collections['t3'].count()} total")
        logger.info("=" * 70)

    def continuous_monitoring(self, interval_hours: int = 6):
        """Continuous monitoring loop"""
        logger.info(f"Starting continuous monitoring (every {interval_hours}h)")

        import schedule

        schedule.every(interval_hours).hours.do(self.run_cycle)

        # Run immediately
        self.run_cycle()

        while True:
            schedule.run_pending()
            time.sleep(60)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["once", "continuous"], default="once")
    parser.add_argument("--interval", type=int, default=6)

    args = parser.parse_args()

    scraper = ImmigrationScraper()

    if args.mode == "once":
        scraper.run_cycle()
    else:
        scraper.continuous_monitoring(interval_hours=args.interval)
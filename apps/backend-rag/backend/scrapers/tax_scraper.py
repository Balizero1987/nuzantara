"""
TAX GENIUS - Indonesian Tax Intelligence Scraper
Scrapes tax updates, deadlines, and regulations from official sources
Uses ChromaDB for searchable knowledge base
"""

import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import time
from typing import List, Dict, Any, Optional
import hashlib
from pathlib import Path
import chromadb
from loguru import logger
import psycopg2
from psycopg2.extras import execute_values, Json

# Configure logging
logger.add("logs/tax_scraper.log", rotation="1 day")


class TaxGenius:
    """Tax Intelligence Scraper for Indonesia"""

    def __init__(
        self,
        chroma_path: str = "./data/tax_kb",
        pg_conn_string: Optional[str] = None
    ):
        # ChromaDB setup
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)

        # Create collections
        try:
            self.tax_updates_collection = self.chroma_client.get_or_create_collection("tax_updates")
            self.tax_knowledge_collection = self.chroma_client.get_or_create_collection("tax_knowledge")
        except Exception as e:
            logger.error(f"ChromaDB initialization error: {e}")
            raise

        # PostgreSQL setup
        if pg_conn_string:
            try:
                self.pg_conn = psycopg2.connect(pg_conn_string)
                self.pg_cursor = self.pg_conn.cursor()
            except Exception as e:
                logger.error(f"PostgreSQL connection error: {e}")
                self.pg_conn = None
                self.pg_cursor = None
        else:
            self.pg_conn = None
            self.pg_cursor = None

        self.cache_file = Path("tax_scraper_cache.json")
        self.seen_hashes = self.load_cache()

        # Official tax sources
        self.sources = [
            {
                "name": "DJP (Directorate General of Taxation)",
                "url": "https://www.pajak.go.id/id/berita",
                "tier": "official",
                "selectors": ["article", "div.news-item"]
            },
            {
                "name": "DJP Regulations",
                "url": "https://www.pajak.go.id/id/peraturan",
                "tier": "official",
                "selectors": ["div.regulation-item", "article"]
            },
            {
                "name": "Kemenkeu (Ministry of Finance)",
                "url": "https://www.kemenkeu.go.id/informasi-publik/publikasi/berita-pajak",
                "tier": "official",
                "selectors": ["div.content-item", "article"]
            },
        ]

        # Tax knowledge base (rates, deadlines, etc)
        self.tax_knowledge = self.load_tax_knowledge()

    def load_cache(self) -> set:
        """Load seen content hashes from cache"""
        if self.cache_file.exists():
            with open(self.cache_file, 'r') as f:
                return set(json.load(f))
        return set()

    def save_cache(self):
        """Save seen content hashes to cache"""
        with open(self.cache_file, 'w') as f:
            json.dump(list(self.seen_hashes), f)

    def content_hash(self, content: str) -> str:
        """Generate hash for content deduplication"""
        return hashlib.md5(content.encode()).hexdigest()

    def load_tax_knowledge(self) -> Dict:
        """Load tax rates and knowledge base"""
        return {
            "rates": {
                "corporate": {
                    "standard": 0.22,
                    "small_business": 0.005,  # 0.5% for revenue < 4.8B IDR
                    "listed": 0.19,  # Public companies
                },
                "personal": {
                    "brackets": [
                        {"max": 60000000, "rate": 0.05},
                        {"max": 250000000, "rate": 0.15},
                        {"max": 500000000, "rate": 0.25},
                        {"max": 5000000000, "rate": 0.30},
                        {"max": float('inf'), "rate": 0.35}
                    ]
                },
                "vat": 0.11,  # 11% current rate
                "withholding": {
                    "dividends_resident": 0.10,
                    "dividends_nonresident": 0.20,
                    "royalties_resident": 0.15,
                    "royalties_nonresident": 0.20,
                    "services_pph23": 0.02,
                    "services_pph26": 0.20
                }
            },
            "deadlines": {
                "monthly": {
                    "pph21": 10,  # Day of month
                    "pph23": 10,
                    "pph25": 15,
                    "ppn": "end_of_following_month"
                },
                "annual": {
                    "corporate_tax_return": "April 30",
                    "personal_tax_return": "March 31"
                },
                "quarterly": {
                    "lkpm": "15th of following month"  # For PMA companies
                }
            },
            "incentives": {
                "super_deduction_rd": 2.0,  # 200% deduction
                "super_deduction_vocational": 2.0,
                "tax_holiday_pioneer_years": "5-20",
                "tax_holiday_min_investment": 500000000000  # 500B IDR
            }
        }

    def scrape_source(self, source: Dict) -> List[Dict[str, Any]]:
        """Scrape a single tax source"""
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

                for elem in elements[:10]:  # Top 10 recent
                    title_elem = elem.find(['h2', 'h3', 'h4', 'a'])
                    if not title_elem:
                        continue

                    title = title_elem.get_text(strip=True)

                    # Get content
                    content_elem = elem.find(['p', 'div.summary', 'div.content'])
                    content = content_elem.get_text(strip=True) if content_elem else title

                    # Get link
                    link_elem = elem.find('a')
                    link = link_elem['href'] if link_elem and 'href' in link_elem.attrs else source['url']

                    # Make link absolute
                    if link.startswith('/'):
                        from urllib.parse import urljoin
                        link = urljoin(source['url'], link)

                    # Get date
                    date_elem = elem.find(['time', 'span.date', 'div.date'])
                    date_text = date_elem.get_text(strip=True) if date_elem else None

                    if len(content) < 50:
                        continue

                    content_id = self.content_hash(title + content)
                    if content_id in self.seen_hashes:
                        continue

                    items.append({
                        "title": title,
                        "content": content,
                        "source": source['name'],
                        "source_url": link,
                        "tier": source['tier'],
                        "scraped_at": datetime.now().isoformat(),
                        "published_date": date_text,
                        "content_id": content_id
                    })

                    self.seen_hashes.add(content_id)

            logger.info(f"Found {len(items)} new items from {source['name']}")
            return items

        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {e}")
            return []

    def classify_update(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Classify tax update and extract metadata"""

        text = (item['title'] + ' ' + item['content']).lower()

        # Determine type
        if 'peraturan' in text or 'regulation' in text:
            update_type = 'regulation'
        elif 'deadline' in text or 'batas waktu' in text:
            update_type = 'deadline'
        elif 'tarif' in text or 'rate' in text:
            update_type = 'rate_change'
        elif 'amnesti' in text or 'amnesty' in text:
            update_type = 'amnesty'
        elif 'audit' in text or 'pemeriksaan' in text:
            update_type = 'audit_focus'
        else:
            update_type = 'general'

        # Determine impact
        if 'urgent' in text or 'segera' in text or 'immediate' in text:
            impact = 'critical'
        elif 'penting' in text or 'important' in text or 'wajib' in text:
            impact = 'high'
        elif 'update' in text or 'change' in text or 'perubahan' in text:
            impact = 'medium'
        else:
            impact = 'low'

        # Identify affected entities
        affected = []
        if 'pma' in text:
            affected.append('PT PMA')
        if 'pt' in text or 'badan' in text:
            affected.append('PT')
        if 'umkm' in text or 'small business' in text:
            affected.append('Small Business')
        if 'individual' in text or 'pribadi' in text:
            affected.append('Individual')
        if not affected:
            affected = ['All entities']

        return {
            **item,
            "update_type": update_type,
            "impact_level": impact,
            "affected_entities": affected,
        }

    def save_to_chromadb(self, item: Dict[str, Any]):
        """Save tax update to ChromaDB"""

        doc_text = f"""
Source: {item['source']} ({item['tier'].upper()})
Date: {item.get('published_date', 'Unknown')}
Type: {item['update_type']}
Impact: {item['impact_level']}

Title: {item['title']}

Content:
{item['content'][:1500]}

Affected: {', '.join(item['affected_entities'])}
URL: {item.get('source_url', '')}
"""

        metadata = {
            "source": item['source'],
            "tier": item['tier'],
            "source_url": item.get('source_url', ''),
            "scraped_at": item['scraped_at'],
            "published_date": item.get('published_date', ''),
            "content_id": item['content_id'],
            "update_type": item['update_type'],
            "impact_level": item['impact_level'],
            "affected_entities": json.dumps(item['affected_entities']),
        }

        try:
            self.tax_updates_collection.add(
                documents=[doc_text],
                ids=[item['content_id']],
                metadatas=[metadata]
            )
            logger.success(f"Saved to ChromaDB: {item['title'][:50]}...")
        except Exception as e:
            logger.error(f"Error saving to ChromaDB: {e}")

    def save_to_postgres(self, item: Dict[str, Any]):
        """Save tax update to PostgreSQL regulatory_updates table"""
        if not self.pg_cursor:
            return

        try:
            query = """
                INSERT INTO regulatory_updates (
                    update_date, source, update_title, update_description, impact,
                    update_type, impact_level, url, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """

            update_date = datetime.now().date()

            self.pg_cursor.execute(query, (
                update_date,
                'tax_genius',
                item['title'],
                item['content'][:500],
                f"{item['impact_level']} - {', '.join(item['affected_entities'])}",
                item['update_type'],
                item['impact_level'],
                item.get('source_url'),
                Json({"content_id": item['content_id'], "source": item['source']})
            ))

            self.pg_conn.commit()
            logger.success(f"Saved to PostgreSQL: {item['title'][:50]}...")
        except Exception as e:
            logger.error(f"Error saving to PostgreSQL: {e}")
            if self.pg_conn:
                self.pg_conn.rollback()

    def populate_tax_knowledge_chromadb(self):
        """Populate ChromaDB with static tax knowledge"""

        logger.info("Populating ChromaDB with tax knowledge...")

        knowledge_docs = []

        # Corporate tax rates
        knowledge_docs.append({
            "id": "tax_rates_corporate",
            "text": f"""
Indonesian Corporate Tax Rates:
- Standard corporate tax rate: {self.tax_knowledge['rates']['corporate']['standard'] * 100}%
- Small business rate (revenue < 4.8B IDR): {self.tax_knowledge['rates']['corporate']['small_business'] * 100}%
- Listed companies (public): {self.tax_knowledge['rates']['corporate']['listed'] * 100}%

This is a significant tax optimization opportunity for small businesses.
Legal basis: PP 23/2018
""",
            "metadata": {
                "category": "tax_rates",
                "entity_type": "corporate",
                "last_updated": datetime.now().isoformat()
            }
        })

        # Personal income tax
        brackets_text = "\n".join([
            f"- Up to {b['max']:,} IDR: {b['rate']*100}%"
            for b in self.tax_knowledge['rates']['personal']['brackets']
        ])

        knowledge_docs.append({
            "id": "tax_rates_personal",
            "text": f"""
Indonesian Personal Income Tax Brackets:
{brackets_text}

These are progressive tax rates applied to taxable income.
""",
            "metadata": {
                "category": "tax_rates",
                "entity_type": "personal",
                "last_updated": datetime.now().isoformat()
            }
        })

        # VAT
        knowledge_docs.append({
            "id": "tax_rates_vat",
            "text": f"""
Indonesian Value Added Tax (PPN):
- Current rate: {self.tax_knowledge['rates']['vat'] * 100}%
- Increased from 10% in April 2022
- Expected to increase to 12% by 2025

VAT registered businesses (PKP) must collect and remit PPN monthly.
""",
            "metadata": {
                "category": "tax_rates",
                "entity_type": "vat",
                "last_updated": datetime.now().isoformat()
            }
        })

        # Deadlines
        knowledge_docs.append({
            "id": "tax_deadlines_monthly",
            "text": f"""
Monthly Tax Deadlines in Indonesia:
- PPh 21 (Employee tax): 10th of each month
- PPh 23 (Services): 10th of each month
- PPh 25 (Corporate installment): 15th of each month
- PPN (VAT): End of following month

Missing deadlines results in 2% monthly late interest penalty.
""",
            "metadata": {
                "category": "deadlines",
                "frequency": "monthly",
                "last_updated": datetime.now().isoformat()
            }
        })

        # Super deduction
        knowledge_docs.append({
            "id": "tax_incentive_super_deduction",
            "text": f"""
Tax Super Deduction Incentives:
- R&D expenses: 200% deduction (double deduction)
- Vocational training: 200% deduction
- Requirements: Approved activities, proper documentation
- Legal basis: PMK 153/2020

Example: 100M IDR R&D expense = 200M IDR tax deduction = 44M IDR tax saving (at 22% rate)
""",
            "metadata": {
                "category": "incentives",
                "incentive_type": "super_deduction",
                "last_updated": datetime.now().isoformat()
            }
        })

        # Save to ChromaDB
        for doc in knowledge_docs:
            try:
                self.tax_knowledge_collection.upsert(
                    ids=[doc['id']],
                    documents=[doc['text']],
                    metadatas=[doc['metadata']]
                )
            except Exception as e:
                logger.error(f"Error saving knowledge doc {doc['id']}: {e}")

        logger.success(f"Populated {len(knowledge_docs)} tax knowledge documents")

    def run_cycle(self):
        """Run one complete scraping cycle"""
        logger.info("=" * 70)
        logger.info("TAX GENIUS - Starting scraping cycle")
        logger.info("=" * 70)

        total_new = 0

        for source in self.sources:
            items = self.scrape_source(source)

            for item in items:
                # Classify
                classified_item = self.classify_update(item)

                # Save to ChromaDB
                self.save_to_chromadb(classified_item)

                # Save to PostgreSQL if available
                if self.pg_conn:
                    self.save_to_postgres(classified_item)

                total_new += 1
                time.sleep(2)  # Rate limiting

            time.sleep(5)

        # Populate static knowledge (only needed once, but safe to re-run)
        self.populate_tax_knowledge_chromadb()

        self.save_cache()

        logger.info("=" * 70)
        logger.info(f"Cycle complete. Processed {total_new} new items")
        logger.info(f"Tax updates: {self.tax_updates_collection.count()} total")
        logger.info(f"Tax knowledge: {self.tax_knowledge_collection.count()} total")
        logger.info("=" * 70)

    def search_tax_info(self, query: str, limit: int = 10) -> List[Dict]:
        """Search tax information using semantic search"""
        try:
            # Search both collections
            updates_results = self.tax_updates_collection.query(
                query_texts=[query],
                n_results=limit // 2
            )

            knowledge_results = self.tax_knowledge_collection.query(
                query_texts=[query],
                n_results=limit // 2
            )

            # Combine results
            results = []

            for i, doc in enumerate(updates_results['documents'][0]):
                results.append({
                    "source": "tax_updates",
                    "document": doc,
                    "metadata": updates_results['metadatas'][0][i],
                    "distance": updates_results['distances'][0][i]
                })

            for i, doc in enumerate(knowledge_results['documents'][0]):
                results.append({
                    "source": "tax_knowledge",
                    "document": doc,
                    "metadata": knowledge_results['metadatas'][0][i],
                    "distance": knowledge_results['distances'][0][i]
                })

            # Sort by distance (lower = better match)
            results.sort(key=lambda x: x['distance'])

            return results[:limit]

        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def continuous_monitoring(self, interval_hours: int = 3):
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
    parser.add_argument("--interval", type=int, default=3)
    parser.add_argument("--search", type=str, help="Search tax information")

    args = parser.parse_args()

    # Get PostgreSQL connection from env
    pg_conn_string = os.getenv("DATABASE_URL")

    scraper = TaxGenius(pg_conn_string=pg_conn_string)

    if args.search:
        results = scraper.search_tax_info(args.search)
        print(f"\n📊 Search results for: {args.search}\n")
        for i, result in enumerate(results, 1):
            print(f"{i}. [{result['source']}] {result['document'][:200]}...")
            print(f"   Relevance: {1 - result['distance']:.2f}\n")
    elif args.mode == "once":
        scraper.run_cycle()
    else:
        scraper.continuous_monitoring(interval_hours=args.interval)

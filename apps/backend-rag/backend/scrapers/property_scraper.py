"""
LEGAL ARCHITECT - Indonesian Property Intelligence Scraper
Scrapes property listings, market data, and legal updates
Uses ChromaDB for searchable property database
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
import re

# Configure logging
logger.add("logs/property_scraper.log", rotation="1 day")


class LegalArchitect:
    """Property and Legal Intelligence Scraper for Indonesia"""

    def __init__(
        self,
        chroma_path: str = "./data/property_kb",
        pg_conn_string: Optional[str] = None
    ):
        # ChromaDB setup
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)

        # Create collections
        try:
            self.property_listings_collection = self.chroma_client.get_or_create_collection("property_listings")
            self.property_knowledge_collection = self.chroma_client.get_or_create_collection("property_knowledge")
            self.legal_updates_collection = self.chroma_client.get_or_create_collection("legal_updates")
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

        self.cache_file = Path("property_scraper_cache.json")
        self.seen_hashes = self.load_cache()

        # Property listing sources
        self.property_sources = [
            {
                "name": "Rumah.com Bali",
                "url": "https://www.rumah.com/properti-dijual/bali",
                "selectors": ["div[data-testid='listing-card']", "div.listing-card"]
            },
            # Note: Real scraping may require API or more complex selectors
            # This is a simplified example
        ]

        # Legal update sources
        self.legal_sources = [
            {
                "name": "ATR/BPN (Land Agency)",
                "url": "https://www.atrbpn.go.id/Berita",
                "selectors": ["article", "div.news-item"]
            },
            {
                "name": "Hukumonline Property Law",
                "url": "https://www.hukumonline.com/search?q=properti",
                "selectors": ["article.post", "div.content-item"]
            },
        ]

        # Property knowledge base
        self.property_knowledge = self.load_property_knowledge()

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

    def load_property_knowledge(self) -> Dict:
        """Load property knowledge base"""
        return {
            "ownership_types": {
                "Hak Milik (Freehold)": {
                    "eligibility": "Indonesian citizens only",
                    "duration": "Perpetual",
                    "foreign_eligible": False,
                    "pros": ["Perpetual ownership", "Can mortgage", "Full rights"],
                    "cons": ["Not available to foreigners"]
                },
                "HGB (Hak Guna Bangunan)": {
                    "eligibility": "Indonesian entities, PT PMA",
                    "duration": "30+20+30 years (renewable)",
                    "foreign_eligible": True,
                    "via": "PT PMA company",
                    "pros": ["Renewable", "Can mortgage", "Company asset"],
                    "cons": ["Requires company", "Renewal process", "Compliance costs"]
                },
                "Hak Pakai": {
                    "eligibility": "Foreigners, mixed couples",
                    "duration": "25+20+25 years",
                    "foreign_eligible": True,
                    "pros": ["Direct foreign ownership", "No company needed"],
                    "cons": ["Cannot mortgage", "Limited property types"]
                },
                "Leasehold": {
                    "eligibility": "Anyone",
                    "duration": "As per agreement (typically 25-30 years)",
                    "foreign_eligible": True,
                    "pros": ["Lower upfront cost", "Flexibility"],
                    "cons": ["No asset ownership", "Renewal uncertainty"]
                }
            },
            "areas": {
                "Canggu": {
                    "avg_price_per_are": 30000000,  # IDR
                    "trend": "increasing",
                    "zoning": ["Residential", "Commercial", "Tourism"],
                    "risks": ["Traffic congestion", "Over-development"],
                    "opportunities": ["High rental yield", "Capital growth", "Digital nomad hub"]
                },
                "Seminyak": {
                    "avg_price_per_are": 50000000,
                    "trend": "stable",
                    "zoning": ["Commercial", "Tourism", "Residential"],
                    "risks": ["Saturated market", "Beach erosion"],
                    "opportunities": ["Established area", "Premium location", "High-end market"]
                },
                "Ubud": {
                    "avg_price_per_are": 25000000,
                    "trend": "increasing",
                    "zoning": ["Cultural", "Residential", "Tourism"],
                    "risks": ["UNESCO restrictions", "Rice field protection"],
                    "opportunities": ["Wellness tourism", "Cultural appeal", "Nature"]
                },
                "Uluwatu": {
                    "avg_price_per_are": 45000000,
                    "trend": "stable",
                    "zoning": ["Tourism", "Residential"],
                    "risks": ["Water scarcity", "Cliff erosion", "Access"],
                    "opportunities": ["Luxury market", "Ocean views", "Exclusivity"]
                },
                "Sanur": {
                    "avg_price_per_are": 35000000,
                    "trend": "increasing",
                    "zoning": ["Residential", "Tourism"],
                    "risks": ["Building height restrictions"],
                    "opportunities": ["Family-friendly", "Beachfront", "Quiet area"]
                }
            },
            "taxes_and_fees": {
                "BPHTB (Transfer Tax)": {
                    "rate": 0.05,
                    "description": "Land and building transfer tax",
                    "paid_by": "Buyer"
                },
                "PPh (Income Tax on Sale)": {
                    "rate": 0.025,
                    "description": "Seller's income tax",
                    "paid_by": "Seller"
                },
                "PBB (Land Tax)": {
                    "rate": "Variable",
                    "description": "Annual property tax",
                    "paid_by": "Owner"
                },
                "Notary Fees": {
                    "rate": "1-2%",
                    "description": "Notary and legal fees",
                    "paid_by": "Usually split"
                }
            }
        }

    def scrape_property_listings(self):
        """Scrape property listing websites"""
        logger.info("Scraping property listings...")

        total_new = 0

        for source in self.property_sources:
            try:
                items = self.scrape_property_source(source)
                for item in items:
                    self.save_property_to_chromadb(item)
                    total_new += 1
                    time.sleep(2)

                time.sleep(5)
            except Exception as e:
                logger.error(f"Error scraping {source['name']}: {e}")

        logger.success(f"Scraped {total_new} new property listings")

    def scrape_property_source(self, source: Dict) -> List[Dict[str, Any]]:
        """Scrape a single property source"""
        logger.info(f"Scraping: {source['name']}")

        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            }
            response = requests.get(source['url'], headers=headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            items = []

            # This is simplified - real scraping would need specific selectors per site
            for selector in source['selectors']:
                elements = soup.select(selector)

                for elem in elements[:20]:  # Limit to 20 per source
                    # Extract property data
                    property_data = self.extract_property_data(elem, source)

                    if property_data:
                        content_id = self.content_hash(property_data['title'] + str(property_data.get('price', '')))

                        if content_id not in self.seen_hashes:
                            property_data['content_id'] = content_id
                            property_data['scraped_at'] = datetime.now().isoformat()
                            items.append(property_data)
                            self.seen_hashes.add(content_id)

            logger.info(f"Found {len(items)} new properties from {source['name']}")
            return items

        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {e}")
            return []

    def extract_property_data(self, elem, source: Dict) -> Optional[Dict[str, Any]]:
        """Extract property data from HTML element"""
        try:
            # Title
            title_elem = elem.find(['h2', 'h3', 'a', 'span.title'])
            if not title_elem:
                return None
            title = title_elem.get_text(strip=True)

            # Price
            price_elem = elem.find(['span.price', 'div.price', 'strong'])
            price = 0
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                price = self.extract_price(price_text)

            # Location
            location_elem = elem.find(['span.location', 'div.location', 'address'])
            location = location_elem.get_text(strip=True) if location_elem else "Bali"

            # Size
            size_elem = elem.find(['span.size', 'span.area'])
            size = 0
            if size_elem:
                size_text = size_elem.get_text(strip=True)
                size = self.extract_size(size_text)

            # Link
            link_elem = elem.find('a')
            link = link_elem['href'] if link_elem and 'href' in link_elem.attrs else source['url']
            if link.startswith('/'):
                from urllib.parse import urljoin
                link = urljoin(source['url'], link)

            # Determine property type and ownership
            property_type = self.determine_property_type(title)
            ownership = self.determine_ownership(title)
            area = self.extract_area(location)

            return {
                "title": title,
                "price": price,
                "price_per_are": price / size if size > 0 else 0,
                "size": size,
                "location": location,
                "area": area,
                "property_type": property_type,
                "ownership": ownership,
                "source": source['name'],
                "source_url": link,
            }

        except Exception as e:
            logger.debug(f"Error extracting property data: {e}")
            return None

    def extract_price(self, price_text: str) -> int:
        """Extract price from text"""
        # Remove non-digit characters except for decimal separators
        cleaned = re.sub(r'[^\d]', '', price_text)
        try:
            price = int(cleaned)
            # Handle different representations (billions, millions)
            if 'miliar' in price_text.lower() or 'b' in price_text.lower():
                price = price * 1000000000
            elif 'juta' in price_text.lower() or 'm' in price_text.lower():
                price = price * 1000000
            return price
        except:
            return 0

    def extract_size(self, size_text: str) -> int:
        """Extract size in are from text"""
        match = re.search(r'(\d+)\s*(are|m2|sqm)', size_text.lower())
        if match:
            size = int(match.group(1))
            # Convert m2 to are (1 are = 100 m2)
            if 'm2' in match.group(2) or 'sqm' in match.group(2):
                size = size / 100
            return int(size)
        return 0

    def determine_property_type(self, title: str) -> str:
        """Determine property type from title"""
        title_lower = title.lower()
        if 'villa' in title_lower:
            return 'villa'
        elif 'land' in title_lower or 'tanah' in title_lower:
            return 'land'
        elif 'commercial' in title_lower or 'ruko' in title_lower:
            return 'commercial'
        else:
            return 'residential'

    def determine_ownership(self, title: str) -> str:
        """Determine ownership type from title"""
        title_lower = title.lower()
        if 'freehold' in title_lower or 'shm' in title_lower:
            return 'freehold'
        elif 'leasehold' in title_lower or 'sewa' in title_lower:
            return 'leasehold'
        elif 'hgb' in title_lower:
            return 'HGB'
        elif 'hak pakai' in title_lower:
            return 'HakPakai'
        return 'unknown'

    def extract_area(self, location: str) -> str:
        """Extract area from location"""
        areas = ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Sanur', 'Denpasar', 'Kuta', 'Jimbaran', 'Nusa Dua']
        for area in areas:
            if area.lower() in location.lower():
                return area
        return "Bali"

    def save_property_to_chromadb(self, property_data: Dict[str, Any]):
        """Save property listing to ChromaDB"""

        # Analyze property
        analysis = self.analyze_property(property_data)

        doc_text = f"""
Property Listing:
Title: {property_data['title']}
Location: {property_data['area']}, {property_data['location']}
Type: {property_data['property_type']}
Ownership: {property_data['ownership']}

Price: {property_data['price']:,} IDR
Size: {property_data['size']} are
Price per are: {property_data['price_per_are']:,} IDR

Market Analysis:
{analysis['market_position']}

Risks:
{chr(10).join('- ' + r for r in analysis['risks'])}

Opportunities:
{chr(10).join('- ' + o for o in analysis['opportunities'])}

Source: {property_data['source']}
URL: {property_data['source_url']}
"""

        metadata = {
            "area": property_data['area'],
            "property_type": property_data['property_type'],
            "ownership": property_data['ownership'],
            "price": property_data['price'],
            "size": property_data['size'],
            "price_per_are": property_data['price_per_are'],
            "source": property_data['source'],
            "source_url": property_data['source_url'],
            "scraped_at": property_data['scraped_at'],
            "market_position": analysis['market_position'],
        }

        try:
            self.property_listings_collection.add(
                documents=[doc_text],
                ids=[property_data['content_id']],
                metadatas=[metadata]
            )
            logger.success(f"Saved property: {property_data['title'][:50]}...")
        except Exception as e:
            logger.error(f"Error saving property to ChromaDB: {e}")

    def analyze_property(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze property for risks and opportunities"""

        area = property_data['area']
        area_data = self.property_knowledge['areas'].get(area, {})

        risks = []
        opportunities = []

        # Price analysis
        avg_price = area_data.get('avg_price_per_are', 30000000)
        if property_data['price_per_are'] > 0:
            price_ratio = property_data['price_per_are'] / avg_price

            if price_ratio < 0.7:
                market_position = "Significantly below market average"
                opportunities.append(f"Below market price ({price_ratio*100:.0f}% of average)")
            elif price_ratio < 0.9:
                market_position = "Below market average"
                opportunities.append("Good value")
            elif price_ratio > 1.3:
                market_position = "Above market average"
                risks.append(f"Overpriced ({price_ratio*100:.0f}% of average)")
            elif price_ratio > 1.1:
                market_position = "Slightly above market"
                risks.append("Higher than average price")
            else:
                market_position = "At market price"
        else:
            market_position = "Price not specified"

        # Ownership risks
        if property_data['ownership'] == 'freehold':
            risks.append("Freehold not available to foreigners (requires nominee/company)")
        elif property_data['ownership'] == 'leasehold':
            risks.append("Leasehold - no asset ownership, renewal uncertainty")

        # Area-specific risks and opportunities
        if area in self.property_knowledge['areas']:
            risks.extend(area_data.get('risks', []))
            opportunities.extend(area_data.get('opportunities', []))

        return {
            "market_position": market_position,
            "risks": risks if risks else ["No significant risks identified"],
            "opportunities": opportunities if opportunities else ["Standard opportunity"]
        }

    def scrape_legal_updates(self):
        """Scrape legal updates from official sources"""
        logger.info("Scraping legal updates...")

        total_new = 0

        for source in self.legal_sources:
            try:
                items = self.scrape_legal_source(source)
                for item in items:
                    self.save_legal_update_to_chromadb(item)
                    total_new += 1
                    time.sleep(2)

                time.sleep(5)
            except Exception as e:
                logger.error(f"Error scraping {source['name']}: {e}")

        logger.success(f"Scraped {total_new} legal updates")

    def scrape_legal_source(self, source: Dict) -> List[Dict[str, Any]]:
        """Scrape a single legal source"""
        logger.info(f"Scraping: {source['name']}")

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

                for elem in elements[:10]:
                    title_elem = elem.find(['h2', 'h3', 'h4', 'a'])
                    if not title_elem:
                        continue

                    title = title_elem.get_text(strip=True)

                    content_elem = elem.find(['p', 'div.content', 'div.summary'])
                    content = content_elem.get_text(strip=True) if content_elem else title

                    link_elem = elem.find('a')
                    link = link_elem['href'] if link_elem and 'href' in link_elem.attrs else source['url']
                    if link.startswith('/'):
                        from urllib.parse import urljoin
                        link = urljoin(source['url'], link)

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
                        "scraped_at": datetime.now().isoformat(),
                        "content_id": content_id
                    })

                    self.seen_hashes.add(content_id)

            logger.info(f"Found {len(items)} legal updates from {source['name']}")
            return items

        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {e}")
            return []

    def save_legal_update_to_chromadb(self, item: Dict[str, Any]):
        """Save legal update to ChromaDB"""

        doc_text = f"""
Legal Update:
Source: {item['source']}
Date: {item['scraped_at']}

Title: {item['title']}

Content:
{item['content'][:1500]}

URL: {item['source_url']}
"""

        metadata = {
            "source": item['source'],
            "source_url": item['source_url'],
            "scraped_at": item['scraped_at'],
            "content_id": item['content_id'],
        }

        try:
            self.legal_updates_collection.add(
                documents=[doc_text],
                ids=[item['content_id']],
                metadatas=[metadata]
            )
            logger.success(f"Saved legal update: {item['title'][:50]}...")
        except Exception as e:
            logger.error(f"Error saving legal update to ChromaDB: {e}")

    def populate_property_knowledge_chromadb(self):
        """Populate ChromaDB with static property knowledge"""

        logger.info("Populating ChromaDB with property knowledge...")

        knowledge_docs = []

        # Ownership types
        for ownership_type, data in self.property_knowledge['ownership_types'].items():
            doc_id = f"ownership_{ownership_type.lower().replace(' ', '_').replace('(', '').replace(')', '')}"

            text = f"""
{ownership_type}:
Eligibility: {data['eligibility']}
Duration: {data['duration']}
Foreign Eligible: {'Yes' if data.get('foreign_eligible') else 'No'}
{f"Via: {data['via']}" if 'via' in data else ''}

Pros:
{chr(10).join('- ' + p for p in data.get('pros', []))}

Cons:
{chr(10).join('- ' + c for c in data.get('cons', []))}
"""

            knowledge_docs.append({
                "id": doc_id,
                "text": text,
                "metadata": {
                    "category": "ownership_types",
                    "ownership_type": ownership_type,
                    "foreign_eligible": str(data.get('foreign_eligible', False))
                }
            })

        # Area knowledge
        for area, data in self.property_knowledge['areas'].items():
            doc_id = f"area_{area.lower().replace(' ', '_')}"

            text = f"""
{area} Property Market:
Average Price: {data['avg_price_per_are']:,} IDR per are
Trend: {data['trend']}
Zoning: {', '.join(data['zoning'])}

Risks:
{chr(10).join('- ' + r for r in data['risks'])}

Opportunities:
{chr(10).join('- ' + o for o in data['opportunities'])}
"""

            knowledge_docs.append({
                "id": doc_id,
                "text": text,
                "metadata": {
                    "category": "area_knowledge",
                    "area": area,
                    "avg_price": data['avg_price_per_are'],
                    "trend": data['trend']
                }
            })

        # Save to ChromaDB
        for doc in knowledge_docs:
            try:
                self.property_knowledge_collection.upsert(
                    ids=[doc['id']],
                    documents=[doc['text']],
                    metadatas=[doc['metadata']]
                )
            except Exception as e:
                logger.error(f"Error saving knowledge doc {doc['id']}: {e}")

        logger.success(f"Populated {len(knowledge_docs)} property knowledge documents")

    def run_cycle(self):
        """Run one complete scraping cycle"""
        logger.info("=" * 70)
        logger.info("LEGAL ARCHITECT - Starting scraping cycle")
        logger.info("=" * 70)

        # Scrape property listings
        self.scrape_property_listings()

        # Scrape legal updates
        self.scrape_legal_updates()

        # Populate knowledge base
        self.populate_property_knowledge_chromadb()

        self.save_cache()

        logger.info("=" * 70)
        logger.info(f"Property listings: {self.property_listings_collection.count()} total")
        logger.info(f"Legal updates: {self.legal_updates_collection.count()} total")
        logger.info(f"Property knowledge: {self.property_knowledge_collection.count()} total")
        logger.info("=" * 70)

    def search_properties(self, query: str, limit: int = 10) -> List[Dict]:
        """Search properties using semantic search"""
        try:
            results = self.property_listings_collection.query(
                query_texts=[query],
                n_results=limit
            )

            output = []
            for i, doc in enumerate(results['documents'][0]):
                output.append({
                    "document": doc,
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i]
                })

            return output

        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def continuous_monitoring(self, interval_hours: int = 24):
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
    parser.add_argument("--interval", type=int, default=24)
    parser.add_argument("--search", type=str, help="Search properties")

    args = parser.parse_args()

    # Get PostgreSQL connection from env
    pg_conn_string = os.getenv("DATABASE_URL")

    scraper = LegalArchitect(pg_conn_string=pg_conn_string)

    if args.search:
        results = scraper.search_properties(args.search)
        print(f"\n🏠 Property search results for: {args.search}\n")
        for i, result in enumerate(results, 1):
            print(f"{i}. {result['document'][:200]}...")
            print(f"   Relevance: {1 - result['distance']:.2f}\n")
    elif args.mode == "once":
        scraper.run_cycle()
    else:
        scraper.continuous_monitoring(interval_hours=args.interval)

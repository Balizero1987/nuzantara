"""
Property Intelligence Scraper (Legal Architect)
Scrapes Indonesian property listings, market data, and legal updates
"""

import re
from typing import List, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from loguru import logger

from ..core.base_scraper import BaseScraper
from ..models.scraped_content import Source, ScrapedContent, SourceTier, ContentType


class PropertyScraper(BaseScraper):
    """
    Property and Legal Intelligence Scraper for Indonesia

    Migrated from legacy LegalArchitect (748 lines → ~200 lines)
    All infrastructure (cache, DB, engines, AI) now handled by BaseScraper
    """

    def get_sources(self) -> List[Source]:
        """Define property and legal sources"""

        # Property listing sources
        property_sources = [
            Source(
                name="Rumah.com Bali",
                url="https://www.rumah.com/properti-dijual/bali",
                tier=SourceTier.ACCREDITED,
                category=ContentType.PROPERTY,
                selectors=["div[data-testid='listing-card']", "div.listing-card"],
                requires_js=True
            ),
        ]

        # Legal update sources
        legal_sources = [
            Source(
                name="ATR/BPN (Land Agency)",
                url="https://www.atrbpn.go.id/Berita",
                tier=SourceTier.OFFICIAL,
                category=ContentType.PROPERTY,
                selectors=["article", "div.news-item"],
                requires_js=False
            ),
            Source(
                name="Hukumonline Property Law",
                url="https://www.hukumonline.com/search?q=properti",
                tier=SourceTier.ACCREDITED,
                category=ContentType.PROPERTY,
                selectors=["article.post", "div.content-item"],
                requires_js=False
            ),
        ]

        return property_sources + legal_sources

    def parse_content(self, raw_html: str, source: Source) -> List[ScrapedContent]:
        """Extract property data from HTML"""

        soup = BeautifulSoup(raw_html, 'html.parser')
        items = []

        # Try each selector
        for selector in source.selectors:
            elements = soup.select(selector)

            for elem in elements[:20]:  # Limit to 20 per selector
                try:
                    item = self._extract_property_item(elem, source)
                    if item:
                        items.append(item)
                except Exception as e:
                    logger.debug(f"Error extracting property: {e}")
                    continue

        logger.info(f"Parsed {len(items)} properties from {source.name}")
        return items

    def _extract_property_item(self, elem, source: Source) -> Optional[ScrapedContent]:
        """Extract single property item from HTML element"""

        # Extract title
        title_elem = elem.find(['h2', 'h3', 'a', 'span.title'])
        if not title_elem:
            return None
        title = title_elem.get_text(strip=True)

        # Extract price
        price_elem = elem.find(['span.price', 'div.price', 'strong'])
        price = self._extract_price(price_elem.get_text(strip=True)) if price_elem else 0

        # Extract location
        location_elem = elem.find(['span.location', 'div.location', 'address'])
        location = location_elem.get_text(strip=True) if location_elem else "Bali"

        # Extract size
        size_elem = elem.find(['span.size', 'span.area'])
        size = self._extract_size(size_elem.get_text(strip=True)) if size_elem else 0

        # Extract link
        link_elem = elem.find('a')
        link = link_elem.get('href', str(source.url)) if link_elem else str(source.url)
        if link.startswith('/'):
            link = urljoin(str(source.url), link)

        # Build content text
        content = f"{title}\n\nLocation: {location}"
        if price > 0:
            content += f"\nPrice: Rp {price:,}"
        if size > 0:
            content += f"\nSize: {size} are"

        # Get full text for content
        full_text = elem.get_text(strip=True)
        if len(full_text) > len(content):
            content = full_text

        # Classify property
        property_type = self._determine_property_type(title)
        ownership = self._determine_ownership(title)
        area = self._extract_area(location)

        # Create ScrapedContent
        item = ScrapedContent(
            content_id=self.cache.content_hash(title + str(price)),
            title=title,
            content=content,
            url=link,
            source_name=source.name,
            source_tier=source.tier,
            category=source.category,
            extracted_data={
                "price": price,
                "price_per_are": price / size if size > 0 else 0,
                "size": size,
                "location": location,
                "area": area,
                "property_type": property_type,
                "ownership": ownership
            }
        )

        return item

    def _extract_price(self, price_text: str) -> int:
        """Extract price from Indonesian format"""
        if not price_text:
            return 0

        cleaned = re.sub(r'[^\d]', '', price_text)
        try:
            price = int(cleaned)
            # Handle billions/millions
            if 'miliar' in price_text.lower() or 'b' in price_text.lower():
                price *= 1000000000
            elif 'juta' in price_text.lower() or 'm' in price_text.lower():
                price *= 1000000
            return price
        except:
            return 0

    def _extract_size(self, size_text: str) -> int:
        """Extract size in are (100 m²)"""
        if not size_text:
            return 0

        match = re.search(r'(\d+)\s*(are|m2|sqm)', size_text.lower())
        if match:
            size = int(match.group(1))
            # Convert m² to are
            if 'm2' in match.group(2) or 'sqm' in match.group(2):
                size = size / 100
            return int(size)
        return 0

    def _determine_property_type(self, title: str) -> str:
        """Classify property type"""
        title_lower = title.lower()
        if 'villa' in title_lower:
            return 'villa'
        elif 'land' in title_lower or 'tanah' in title_lower:
            return 'land'
        elif 'commercial' in title_lower or 'ruko' in title_lower:
            return 'commercial'
        return 'residential'

    def _determine_ownership(self, title: str) -> str:
        """Determine ownership type"""
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

    def _extract_area(self, location: str) -> str:
        """Extract Bali area from location"""
        areas = ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Sanur',
                 'Denpasar', 'Kuta', 'Jimbaran', 'Nusa Dua']
        for area in areas:
            if area.lower() in location.lower():
                return area
        return "Bali"

    def analyze_with_ai(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """
        Analyze properties with AI
        Uses LLAMA/Zantara for market analysis
        """
        if not self.config.filter.enable_ai_filtering:
            return items

        from ..processors.ai_analyzer import AIAnalyzer

        analyzer = AIAnalyzer(
            ollama_url=self.config.ai.ollama_url,
            llama_model=self.config.ai.llama_model,
            zantara_url=self.config.ai.get("zantara_url", "http://localhost:8000"),
            provider_order=self.config.ai.provider_order
        )

        analyzed_items = []
        prompt = analyzer.get_default_prompt("property")

        for item in items:
            # Analyze with AI
            analysis = analyzer.analyze(item.content, prompt)

            if analysis:
                item.ai_summary = analysis.summary_en
                item.ai_analysis = analysis.raw_response
                item.quality_score = analysis.quality_score
                item.relevance_score = analysis.relevance_score

            analyzed_items.append(item)

        return analyzed_items

    def format_document(self, item: ScrapedContent) -> str:
        """Format property item for ChromaDB"""

        doc = f"""
PROPERTY LISTING: {item.title}

Source: {item.source_name} ({item.source_tier.value.upper()})
Location: {item.extracted_data.get('location', 'Unknown')}
Area: {item.extracted_data.get('area', 'Bali')}

Property Type: {item.extracted_data.get('property_type', 'Unknown')}
Ownership: {item.extracted_data.get('ownership', 'Unknown')}

Price: Rp {item.extracted_data.get('price', 0):,}
Size: {item.extracted_data.get('size', 0)} are
Price per are: Rp {item.extracted_data.get('price_per_are', 0):,}

Content:
{item.content}

URL: {item.url}
"""

        if item.ai_summary:
            doc += f"\n\nAI Analysis:\n{item.ai_summary}"

        return doc.strip()


# Example usage
if __name__ == "__main__":
    from ..core import ScraperConfig

    # Create config
    config = ScraperConfig(
        scraper_name="property_intel",
        category=ContentType.PROPERTY,
    )

    # Initialize and run
    scraper = PropertyScraper(config)
    result = scraper.run_cycle()

    print(f"\n✅ Property Scraper Complete!")
    print(f"   Sources: {result.sources_successful}/{result.sources_attempted}")
    print(f"   Items saved: {result.items_saved}")
    print(f"   Duration: {result.duration_seconds:.1f}s")

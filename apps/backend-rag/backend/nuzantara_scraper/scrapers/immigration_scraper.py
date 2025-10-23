"""
Immigration Intelligence Scraper
Multi-tier scraping: T1 (official) > T2 (accredited) > T3 (community)
"""

from typing import List, Optional
from bs4 import BeautifulSoup
from loguru import logger

from ..core.base_scraper import BaseScraper
from ..models.scraped_content import Source, ScrapedContent, SourceTier, ContentType
from ..core.source_registry import get_registry, SourcePriority


class ImmigrationScraper(BaseScraper):
    """
    Multi-tier immigration scraper for Indonesia

    Migrated from legacy (308 lines → ~150 lines)
    Uses tiered sources for reliability weighting
    """

    def get_sources(self) -> List[Source]:
        """
        Load immigration sources dynamically from Source Registry

        Multi-tier approach: T1 (official) > T2 (accredited) > T3 (community)
        Sources from 457-source database in all_sources.json
        """
        registry = get_registry()

        # Get all immigration sources (37 sources from SITI_IMMIGRATION.txt)
        all_sources = []

        # TIER 1: Official government sources (highest reliability)
        t1_sources = registry.get_sources(
            category='immigration',
            tier=SourceTier.OFFICIAL,
            enabled_only=True
        )
        all_sources.extend(t1_sources)
        logger.info(f"Loaded {len(t1_sources)} T1 (official) immigration sources")

        # TIER 2: Accredited news/legal sources (medium reliability)
        t2_sources = registry.get_sources(
            category='immigration',
            tier=SourceTier.ACCREDITED,
            enabled_only=True
        )
        all_sources.extend(t2_sources)
        logger.info(f"Loaded {len(t2_sources)} T2 (accredited) immigration sources")

        # TIER 3: Community sources (for sentiment/trends, only high priority)
        t3_sources = registry.get_sources(
            category='immigration',
            tier=SourceTier.COMMUNITY,
            priority=SourcePriority.HIGH,
            enabled_only=True
        )
        all_sources.extend(t3_sources)
        logger.info(f"Loaded {len(t3_sources)} T3 (community) immigration sources")

        logger.info(f"Total immigration sources loaded: {len(all_sources)}")
        return all_sources

    def parse_content(self, raw_html: str, source: Source) -> List[ScrapedContent]:
        """Extract immigration/visa updates from HTML"""

        soup = BeautifulSoup(raw_html, 'html.parser')
        items = []

        # Try each selector
        for selector in source.selectors:
            elements = soup.select(selector)

            for elem in elements[:5]:  # Top 5 recent per selector
                try:
                    text = elem.get_text(strip=True)

                    # Minimum content length
                    if len(text) < 100:
                        continue

                    # Extract title
                    title_elem = elem.find(['h1', 'h2', 'h3', 'a'])
                    title = title_elem.get_text(strip=True) if title_elem else text[:100]

                    # Extract link
                    link_elem = elem.find('a')
                    link = link_elem.get('href', str(source.url)) if link_elem else str(source.url)
                    if link.startswith('/'):
                        from urllib.parse import urljoin
                        link = urljoin(str(source.url), link)

                    # Create item
                    item = ScrapedContent(
                        content_id=self.cache.content_hash(text),
                        title=title,
                        content=text,
                        url=link,
                        source_name=source.name,
                        source_tier=source.tier,
                        category=source.category,
                        extracted_data={
                            "tier": source.tier.value,
                        }
                    )

                    items.append(item)

                except Exception as e:
                    logger.debug(f"Error extracting immigration content: {e}")
                    continue

        logger.info(f"Parsed {len(items)} immigration items from {source.name}")
        return items

    def analyze_with_ai(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """
        Analyze immigration content with LLAMA/Zantara
        Extracts visa types, requirements, impact, urgency
        """
        if not self.config.filter.enable_ai_filtering:
            return items

        from ..processors.ai_analyzer import AIAnalyzer

        analyzer = AIAnalyzer(
            ollama_url=self.config.ai.ollama_url,
            llama_model=self.config.ai.llama_model,
            zantara_url=getattr(self.config.ai, 'zantara_url', 'http://localhost:8000'),
            provider_order=self.config.ai.provider_order
        )

        analyzed_items = []
        prompt = analyzer.get_default_prompt("immigration")

        for item in items:
            # Analyze with AI
            analysis = analyzer.analyze(item.content, prompt)

            if analysis:
                item.ai_summary = analysis.summary_en
                item.ai_analysis = analysis.raw_response
                item.quality_score = analysis.quality_score
                item.relevance_score = analysis.relevance_score

                # Add structured data
                item.extracted_data.update({
                    "visa_types": analysis.topics,
                    "impact_level": analysis.impact_level.value,
                    "urgency": analysis.urgency.value,
                    "affected_groups": analysis.affected_groups,
                    "requirements": analysis.requirements,
                })

            analyzed_items.append(item)

        return analyzed_items

    def format_document(self, item: ScrapedContent) -> str:
        """Format immigration item for ChromaDB"""

        doc = f"""
IMMIGRATION UPDATE: {item.title}

Source: {item.source_name} (Tier {item.source_tier.value.upper()})
Date: {item.scraped_at.strftime('%Y-%m-%d')}

Content:
{item.content}

URL: {item.url}
"""

        if item.ai_summary:
            doc += f"\n\nAI Summary:\n{item.ai_summary}"

        if item.extracted_data.get("visa_types"):
            doc += f"\n\nVisa Types: {', '.join(item.extracted_data['visa_types'])}"

        if item.extracted_data.get("affected_groups"):
            doc += f"\nAffected Groups: {', '.join(item.extracted_data['affected_groups'])}"

        if item.extracted_data.get("impact_level"):
            doc += f"\nImpact: {item.extracted_data['impact_level']}"

        if item.extracted_data.get("urgency"):
            doc += f"\nUrgency: {item.extracted_data['urgency']}"

        return doc.strip()


# Example usage
if __name__ == "__main__":
    from ..core import ScraperConfig

    config = ScraperConfig(
        scraper_name="immigration_intel",
        category=ContentType.IMMIGRATION,
    )

    scraper = ImmigrationScraper(config)
    result = scraper.run_cycle()

    print(f"\n✅ Immigration Scraper Complete!")
    print(f"   Sources: {result.sources_successful}/{result.sources_attempted}")
    print(f"   Items saved: {result.items_saved}")

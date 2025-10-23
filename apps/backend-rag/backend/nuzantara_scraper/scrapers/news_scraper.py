"""
News Intelligence Scraper
Consolidates INTEL_SCRAPING functionality
Supports 20 categories from 259 sources
"""

from typing import List, Optional
from bs4 import BeautifulSoup
from loguru import logger

from ..core.base_scraper import BaseScraper
from ..models.scraped_content import Source, ScrapedContent, SourceTier, ContentType
from ..core.source_registry import get_registry, SourcePriority


class NewsScraper(BaseScraper):
    """
    Multi-category news scraper for Indonesian business intelligence

    Consolidates INTEL_SCRAPING (~2000 lines) into unified framework
    Supports 20 categories, 259 sources
    """

    # 20 categories from INTEL_SCRAPING
    CATEGORIES = [
        "visa_immigration", "tax_compliance", "regulatory_changes",
        "business_setup", "property_law", "banking_finance",
        "employment_law", "cost_of_living", "bali_lifestyle",
        "events_networking", "health_safety", "social_media",
        "general_news", "jobs", "transport_connectivity",
        "competitor_intel", "macro_policy", "ai_tech", "dev_code", "future_trends"
    ]

    def get_sources(self) -> List[Source]:
        """
        Load news sources dynamically from Source Registry

        Loads from 457-source database (52 news sources from SITI_NEWS.txt)
        Priority: Critical > High > Medium > Low
        Tier: Official > Accredited > Community
        """
        registry = get_registry()

        # Get all news sources (52 sources from SITI_NEWS.txt)
        all_sources = []

        # 1. Get all CRITICAL priority sources (highest priority, any tier)
        critical_sources = registry.get_sources(
            category='news',
            priority=SourcePriority.CRITICAL,
            enabled_only=True
        )
        all_sources.extend(critical_sources)
        logger.info(f"Loaded {len(critical_sources)} CRITICAL news sources")

        # 2. Get HIGH priority sources (any tier)
        high_sources = registry.get_sources(
            category='news',
            priority=SourcePriority.HIGH,
            enabled_only=True
        )
        all_sources.extend(high_sources)
        logger.info(f"Loaded {len(high_sources)} HIGH priority news sources")

        # 3. Get MEDIUM priority OFFICIAL and ACCREDITED sources
        medium_official = registry.get_sources(
            category='news',
            tier=SourceTier.OFFICIAL,
            priority=SourcePriority.MEDIUM,
            enabled_only=True
        )
        medium_accredited = registry.get_sources(
            category='news',
            tier=SourceTier.ACCREDITED,
            priority=SourcePriority.MEDIUM,
            enabled_only=True
        )
        all_sources.extend(medium_official)
        all_sources.extend(medium_accredited)
        logger.info(f"Loaded {len(medium_official) + len(medium_accredited)} MEDIUM priority news sources")

        # 4. Optionally get LOW priority OFFICIAL sources only
        low_official = registry.get_sources(
            category='news',
            tier=SourceTier.OFFICIAL,
            priority=SourcePriority.LOW,
            enabled_only=True
        )
        all_sources.extend(low_official)
        logger.info(f"Loaded {len(low_official)} LOW priority official news sources")

        logger.info(f"Total news sources loaded: {len(all_sources)}")
        return all_sources

    def parse_content(self, raw_html: str, source: Source) -> List[ScrapedContent]:
        """Extract news articles from HTML"""

        soup = BeautifulSoup(raw_html, 'html.parser')
        items = []

        # Try each selector
        for selector in source.selectors:
            elements = soup.select(selector)

            for elem in elements[:10]:  # Top 10 per selector
                try:
                    # Extract title
                    title_elem = elem.find(['h1', 'h2', 'h3', 'a'])
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)

                    # Extract content
                    content_elem = elem.find(['p', 'div.summary', 'div.content'])
                    content = content_elem.get_text(strip=True) if content_elem else elem.get_text(strip=True)

                    # Minimum length
                    if len(content) < 100:
                        continue

                    # Extract link
                    link_elem = elem.find('a')
                    link = link_elem.get('href', str(source.url)) if link_elem else str(source.url)
                    if link.startswith('/'):
                        from urllib.parse import urljoin
                        link = urljoin(str(source.url), link)

                    # Create item
                    item = ScrapedContent(
                        content_id=self.cache.content_hash(title + content[:500]),
                        title=title,
                        content=content,
                        url=link,
                        source_name=source.name,
                        source_tier=source.tier,
                        category=source.category,
                    )

                    items.append(item)

                except Exception as e:
                    logger.debug(f"Error extracting news: {e}")
                    continue

        logger.info(f"Parsed {len(items)} news items from {source.name}")
        return items

    def analyze_with_ai(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """Analyze news content with LLAMA/Zantara"""
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
        prompt = analyzer.get_default_prompt("news")

        for item in items:
            analysis = analyzer.analyze(item.content, prompt)

            if analysis:
                item.ai_summary = analysis.summary_en
                item.ai_analysis = analysis.raw_response
                item.quality_score = analysis.quality_score
                item.relevance_score = analysis.relevance_score

                # Add categories
                item.extracted_data.update({
                    "topics": analysis.topics,
                    "categories": analysis.categories,
                    "impact_level": analysis.impact_level.value,
                })

            analyzed_items.append(item)

        return analyzed_items


# Example usage
if __name__ == "__main__":
    from ..core import ScraperConfig

    config = ScraperConfig(
        scraper_name="news_intel",
        category=ContentType.NEWS,
    )

    scraper = NewsScraper(config)
    result = scraper.run_cycle()

    print(f"\n✅ News Scraper Complete!")
    print(f"   Sources: {result.sources_successful}/{result.sources_attempted}")
    print(f"   Items saved: {result.items_saved}")

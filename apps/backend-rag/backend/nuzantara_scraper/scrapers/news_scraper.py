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
        Define news sources

        Note: In production, load from config/sources.yaml
        This is a simplified example with major sources
        """

        return [
            # General News
            Source(
                name="Jakarta Post",
                url="https://www.thejakartapost.com/",
                tier=SourceTier.ACCREDITED,
                category=ContentType.NEWS,
                selectors=["article", "div.latest-news"],
                requires_js=False
            ),
            Source(
                name="Tempo.co",
                url="https://en.tempo.co/",
                tier=SourceTier.ACCREDITED,
                category=ContentType.NEWS,
                selectors=["article.card", "div.news-item"],
                requires_js=True
            ),
            Source(
                name="Detik",
                url="https://www.detik.com/",
                tier=SourceTier.ACCREDITED,
                category=ContentType.NEWS,
                selectors=["article", "div.list-content__item"],
                requires_js=True
            ),

            # Business/Regulatory
            Source(
                name="Indonesia Investments",
                url="https://www.indonesia-investments.com/",
                tier=SourceTier.ACCREDITED,
                category=ContentType.NEWS,
                selectors=["article", "div.content"],
                requires_js=False
            ),

            # Community
            Source(
                name="Reddit Indonesia",
                url="https://www.reddit.com/r/indonesia/",
                tier=SourceTier.COMMUNITY,
                category=ContentType.NEWS,
                selectors=["div.Post"],
                requires_js=True
            ),
        ]

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

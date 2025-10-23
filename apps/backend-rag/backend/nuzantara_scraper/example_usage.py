"""
Example usage of Nuzantara Unified Scraping System
Demonstrates how to use the framework
"""

from nuzantara_scraper.core import BaseScraper, ScraperConfig
from nuzantara_scraper.models import Source, ScrapedContent, SourceTier, ContentType
from bs4 import BeautifulSoup
from typing import List


class SimpleNewsScraper(BaseScraper):
    """
    Simple news scraper example

    This demonstrates how easy it is to create a new scraper
    using the unified framework.
    """

    def get_sources(self) -> List[Source]:
        """Define sources to scrape"""
        return [
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
            )
        ]

    def parse_content(self, raw_html: str, source: Source) -> List[ScrapedContent]:
        """Parse HTML to extract news articles"""
        soup = BeautifulSoup(raw_html, 'html.parser')
        items = []

        # Try each selector
        for selector in source.selectors:
            elements = soup.select(selector)

            for elem in elements[:10]:  # Limit to 10 per selector
                # Extract title
                title_elem = elem.find(['h1', 'h2', 'h3', 'a'])
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)

                # Extract content
                content_elem = elem.find(['p', 'div.summary', 'div.content'])
                content = content_elem.get_text(strip=True) if content_elem else title

                # Skip if too short
                if len(content) < 50:
                    continue

                # Extract link
                link_elem = elem.find('a')
                url = link_elem.get('href', str(source.url)) if link_elem else str(source.url)

                # Make URL absolute
                if url.startswith('/'):
                    from urllib.parse import urljoin
                    url = urljoin(str(source.url), url)

                # Create ScrapedContent
                item = ScrapedContent(
                    content_id=self.cache.content_hash(title + content),
                    title=title,
                    content=content,
                    url=url,
                    source_name=source.name,
                    source_tier=source.tier,
                    category=source.category,
                )

                items.append(item)

        return items


def example_from_code():
    """Example: Create scraper configuration in code"""
    print("=" * 70)
    print("EXAMPLE 1: Creating scraper from code")
    print("=" * 70)

    # Create configuration manually
    config = ScraperConfig(
        scraper_name="simple_news",
        category=ContentType.NEWS,
    )

    # Initialize scraper
    scraper = SimpleNewsScraper(config)

    # Run scraping cycle
    result = scraper.run_cycle()

    # Display results
    print(f"\n📊 Results:")
    print(f"  Sources attempted: {result.sources_attempted}")
    print(f"  Sources successful: {result.sources_successful}")
    print(f"  Items scraped: {result.items_scraped}")
    print(f"  Items saved: {result.items_saved}")
    print(f"  Success rate: {result.success_rate * 100:.1f}%")
    print(f"  Duration: {result.duration_seconds:.1f}s")


def example_from_yaml():
    """Example: Load scraper configuration from YAML"""
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Loading scraper from YAML config")
    print("=" * 70)

    try:
        # Load config from YAML
        config = ScraperConfig.from_yaml("config/property_config.yaml")

        print(f"\n✅ Config loaded:")
        print(f"  Scraper: {config.scraper_name}")
        print(f"  Category: {config.category}")
        print(f"  Sources: {len(config.sources)}")
        print(f"  AI providers: {config.ai.provider_order}")
        print(f"  Engines: {config.engine.engine_preference}")

    except FileNotFoundError as e:
        print(f"\n⚠️  Config file not found: {e}")
        print("  Create config/property_config.yaml first")


def example_with_ai_analysis():
    """Example: Using AI analysis"""
    print("\n" + "=" * 70)
    print("EXAMPLE 3: AI-powered content analysis")
    print("=" * 70)

    from nuzantara_scraper.processors import AIAnalyzer

    # Initialize AI analyzer
    analyzer = AIAnalyzer(
        provider_order=["gemini", "claude", "llama"]
    )

    # Sample content
    content = """
    Indonesia akan menaikkan tarif PPN menjadi 12% mulai 1 Januari 2025.
    Kenaikan ini akan mempengaruhi semua sektor bisnis dan konsumen.
    Pemerintah berharap ini akan meningkatkan pendapatan negara.
    """

    # Analyze with AI
    prompt = analyzer.get_default_prompt("tax")
    result = analyzer.analyze(content, prompt)

    if result:
        print(f"\n✅ AI Analysis successful:")
        print(f"  Provider: {result.ai_provider}")
        print(f"  Summary (EN): {result.summary_en}")
        print(f"  Impact: {result.impact_level.value}")
        print(f"  Urgency: {result.urgency.value}")
        print(f"  Affected groups: {result.affected_groups}")
    else:
        print("\n⚠️  AI analysis failed (no API keys configured)")


def example_engine_selection():
    """Example: Automatic engine selection"""
    print("\n" + "=" * 70)
    print("EXAMPLE 4: Automatic engine selection")
    print("=" * 70)

    from nuzantara_scraper.engines import EngineSelector

    # Test engine availability
    availability = EngineSelector.test_all_engines()

    print("\n📊 Available engines:")
    for engine_name, available in availability.items():
        status = "✅" if available else "❌"
        print(f"  {status} {engine_name}")

    # Get recommended engine
    print("\n🎯 Recommended engines:")
    print(f"  Static site: {EngineSelector.get_recommended_engine('https://example.com')}")
    print(f"  JS-heavy site: {EngineSelector.get_recommended_engine('https://react-app.com')}")


def main():
    """Run all examples"""
    print("\n🚀 Nuzantara Unified Scraping System - Examples\n")

    # Example 1: From code
    # example_from_code()  # Commented out: requires live internet

    # Example 2: From YAML
    example_from_yaml()

    # Example 3: AI Analysis
    # example_with_ai_analysis()  # Commented out: requires AI API keys

    # Example 4: Engine selection
    example_engine_selection()

    print("\n" + "=" * 70)
    print("✅ Examples complete!")
    print("=" * 70)
    print("\n📚 Next steps:")
    print("  1. Create your config YAML file")
    print("  2. Add your sources")
    print("  3. Set API keys in environment")
    print("  4. Run your scraper!")
    print("\n")


if __name__ == "__main__":
    main()

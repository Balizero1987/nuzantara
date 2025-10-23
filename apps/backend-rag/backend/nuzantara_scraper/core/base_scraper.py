"""
Base Scraper Abstract Class
All scrapers inherit from this class for consistent behavior
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
import time
from loguru import logger

from .scraper_config import ScraperConfig
from .cache_manager import CacheManager
from .database_manager import DatabaseManager
from ..models.scraped_content import ScrapedContent, Source, ScraperResult, ContentType


class BaseScraper(ABC):
    """
    Abstract base class for all scrapers

    Provides:
    - Unified configuration
    - Cache management
    - Database operations
    - Engine selection
    - AI analysis
    - Quality filtering
    - Error handling
    - Metrics collection

    Subclasses must implement:
    - get_sources(): Return list of sources to scrape
    - parse_content(): Parse HTML to extract items
    """

    def __init__(self, config: ScraperConfig):
        """
        Initialize base scraper

        Args:
            config: Scraper configuration object
        """
        self.config = config

        # Initialize managers
        self.cache = CacheManager(
            cache_dir=config.get_cache_path(),
            ttl_days=config.cache.ttl_days
        )

        self.db = DatabaseManager(
            chromadb_path=config.database.chromadb_path,
            postgres_url=config.database.postgres_url,
            collections_prefix=config.database.collections_prefix
        )

        # Result tracking
        self.current_result: Optional[ScraperResult] = None

        # Configure logging
        logger.add(
            f"logs/{config.scraper_name}.log",
            rotation="1 day",
            level=config.log_level
        )

        logger.info(f"Initialized {config.scraper_name}")

    @abstractmethod
    def get_sources(self) -> List[Source]:
        """
        Get list of sources to scrape

        Returns:
            List of Source objects

        Example:
            return [
                Source(
                    name="Example Site",
                    url="https://example.com",
                    tier=SourceTier.OFFICIAL,
                    category=ContentType.NEWS,
                    selectors=["article", "div.content"]
                )
            ]
        """
        pass

    @abstractmethod
    def parse_content(self, raw_html: str, source: Source) -> List[ScrapedContent]:
        """
        Parse HTML content to extract items

        Args:
            raw_html: Raw HTML from scraping
            source: Source configuration

        Returns:
            List of ScrapedContent objects

        Note:
            This is domain-specific parsing logic.
            Use BeautifulSoup or custom selectors.
        """
        pass

    def scrape_source(self, source: Source) -> List[ScrapedContent]:
        """
        Scrape a single source (with engine auto-selection and retries)

        Args:
            source: Source to scrape

        Returns:
            List of scraped items
        """
        logger.info(f"Scraping [{source.tier.value.upper()}]: {source.name}")

        # Import engines (lazy load to avoid circular imports)
        from ..engines.engine_selector import EngineSelector

        items = []

        try:
            # Select best engine for this source
            engine = EngineSelector.select(
                url=str(source.url),
                requires_js=source.requires_js,
                config=self.config.engine
            )

            logger.debug(f"Using engine: {engine.__class__.__name__}")

            # Fetch content with retries
            raw_html = None
            for attempt in range(self.config.engine.max_retries):
                try:
                    raw_html = engine.fetch(str(source.url))
                    break
                except Exception as e:
                    logger.warning(f"Attempt {attempt + 1} failed: {e}")
                    if attempt < self.config.engine.max_retries - 1:
                        time.sleep(self.config.engine.retry_delay)

            if not raw_html:
                raise Exception("Failed to fetch content after all retries")

            # Parse content (domain-specific)
            items = self.parse_content(raw_html, source)

            # Filter already seen items
            new_items = []
            for item in items:
                content_hash = self.cache.content_hash(item.content[:500])  # Hash first 500 chars
                if not self.cache.is_seen(content_hash):
                    new_items.append(item)
                    self.cache.mark_seen(content_hash, {
                        "source": source.name,
                        "title": item.title
                    })

            logger.info(f"Found {len(new_items)} new items from {source.name} (filtered {len(items) - len(new_items)})")

            # Update result stats
            if self.current_result:
                self.current_result.sources_successful += 1
                self.current_result.items_scraped += len(items)

            # Rate limiting
            time.sleep(self.config.engine.delay_between_requests)

            return new_items

        except Exception as e:
            logger.error(f"Error scraping {source.name}: {e}")

            if self.current_result:
                self.current_result.add_error(source.name, str(e))

            return []

    def filter_items(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """
        Filter items by quality

        Args:
            items: List of scraped items

        Returns:
            Filtered list
        """
        if not self.config.filter.enable_ai_filtering:
            return items

        from ..processors.quality_filter import QualityFilter

        filter = QualityFilter(
            min_word_count=self.config.filter.min_word_count,
            min_quality_score=self.config.filter.min_quality_score
        )

        filtered = []
        for item in items:
            if filter.passes(item):
                filtered.append(item)

        logger.info(f"Quality filter: {len(filtered)}/{len(items)} items passed ({len(filtered)/len(items)*100:.1f}%)")

        if self.current_result:
            self.current_result.items_filtered = len(filtered)

        return filtered

    def filter_by_date(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """
        Filter items by publication date (5 day cutoff)

        Args:
            items: List of scraped items

        Returns:
            Filtered list of recent items only
        """
        if not items:
            return items

        from ..processors.date_filter import DateFilter

        date_filter = DateFilter(max_age_days=5)
        filtered = date_filter.filter_items(items)

        logger.info(f"Date filter: {len(filtered)}/{len(items)} items within 5-day cutoff ({len(filtered)/len(items)*100:.1f}%)")

        return filtered

    def save_items(self, items: List[ScrapedContent]):
        """
        Save items to database

        Args:
            items: Items to save
        """
        saved_count = 0

        for item in items:
            # Get custom document text (subclasses can override)
            doc_text = self.format_document(item)

            # Save to ChromaDB
            success = self.db.save_to_chromadb(
                collection_name=self.config.category.value,
                content=item,
                custom_document=doc_text
            )

            if success:
                saved_count += 1

                # Optionally save to PostgreSQL (if configured)
                if self.config.database.postgres_url:
                    self.save_to_postgres(item)

        logger.info(f"Saved {saved_count}/{len(items)} items to database")

        if self.current_result:
            self.current_result.items_saved = saved_count

    def format_document(self, item: ScrapedContent) -> str:
        """
        Format item as document for ChromaDB

        Subclasses can override for custom formatting

        Args:
            item: Scraped content

        Returns:
            Formatted document text
        """
        doc = f"""
{item.title}

Source: {item.source_name} ({item.source_tier.value.upper()})
Category: {item.category.value}
Date: {item.scraped_at.strftime('%Y-%m-%d')}
URL: {item.url}

Content:
{item.content}
"""

        if item.ai_summary:
            doc += f"\n\nAI Summary:\n{item.ai_summary}"

        return doc.strip()

    def save_to_postgres(self, item: ScrapedContent):
        """
        Save item to PostgreSQL (optional, override in subclasses)

        Args:
            item: Scraped content
        """
        # Default implementation does nothing
        # Subclasses can override for custom PostgreSQL logic
        pass

    def run_cycle(self) -> ScraperResult:
        """
        Run one complete scraping cycle

        Returns:
            ScraperResult with statistics and items
        """
        logger.info("=" * 70)
        logger.info(f"{self.config.scraper_name.upper()} - Starting scraping cycle")
        logger.info("=" * 70)

        # Initialize result
        self.current_result = ScraperResult(
            scraper_name=self.config.scraper_name,
            category=self.config.category,
            started_at=datetime.now()
        )

        # Get sources
        sources = self.get_sources()
        self.current_result.sources_attempted = len(sources)

        logger.info(f"Scraping {len(sources)} sources...")

        # Scrape each source
        all_items = []
        for source in sources:
            items = self.scrape_source(source)
            all_items.extend(items)

            # Delay between sources
            time.sleep(self.config.engine.delay_between_sources)

        # Filter by date (5 day cutoff for all content)
        date_filtered_items = self.filter_by_date(all_items)

        # Filter by quality
        filtered_items = self.filter_items(date_filtered_items)

        # Analyze with AI (if enabled)
        if self.config.ai and hasattr(self, 'analyze_with_ai'):
            filtered_items = self.analyze_with_ai(filtered_items)

        # Save to database
        self.save_items(filtered_items)

        # Save cache
        self.cache.save()

        # Finalize result
        self.current_result.completed_at = datetime.now()
        self.current_result.items = filtered_items

        # Log summary
        logger.info("=" * 70)
        logger.info(f"Cycle complete:")
        logger.info(f"  Sources: {self.current_result.sources_successful}/{self.current_result.sources_attempted} successful")
        logger.info(f"  Items scraped: {self.current_result.items_scraped}")
        logger.info(f"  Items filtered: {self.current_result.items_filtered}")
        logger.info(f"  Items saved: {self.current_result.items_saved}")
        logger.info(f"  Success rate: {self.current_result.success_rate * 100:.1f}%")
        logger.info(f"  Duration: {self.current_result.duration_seconds:.1f}s")
        logger.info("=" * 70)

        return self.current_result

    def continuous_monitoring(self, interval_hours: Optional[int] = None):
        """
        Run scraper continuously with scheduling

        Args:
            interval_hours: Interval in hours (uses config if not provided)
        """
        if not self.config.schedule_enabled and interval_hours is None:
            logger.error("Scheduling not enabled in config")
            return

        interval = interval_hours or self.config.schedule_interval_hours

        logger.info(f"Starting continuous monitoring (every {interval}h)")

        import schedule

        schedule.every(interval).hours.do(self.run_cycle)

        # Run immediately
        self.run_cycle()

        # Run scheduled tasks
        while True:
            schedule.run_pending()
            time.sleep(60)

    def cleanup(self):
        """Cleanup resources"""
        self.cache.save()
        self.db.close()
        logger.info(f"{self.config.scraper_name} cleanup complete")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()

#!/usr/bin/env python3
"""
Base Scraper - Swiss-Watch Precision
Abstract base class for all scrapers.

All scrapers must implement:
- scrape_site()
- parse_article()

All scrapers automatically get:
- Unified Article models
- Centralized deduplication
- Date parsing
- State tracking
- Metrics
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from INTEL_SCRAPING.core.models import Article, ScrapingResult, ArticleTier, parse_date_unified
from INTEL_SCRAPING.filters.dedup_filter import DeduplicationFilter
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """
    Abstract base scraper.

    All scrapers inherit from this and get:
    - Automatic deduplication
    - Unified Article models
    - Date parsing
    - Configuration
    - Metrics tracking
    """

    def __init__(self, config=None):
        self.config = config or settings

        # Deduplication filter (centralized!)
        self.dedup_filter = DeduplicationFilter(
            cache_backend=self.config.filters.cache_backend.value,
            similarity_threshold=self.config.filters.duplicate_similarity_threshold,
            use_cache=self.config.filters.use_cache,
            ttl_days=self.config.filters.cache_ttl_days
        )

        # Statistics
        self.stats = {
            'sites_attempted': 0,
            'sites_successful': 0,
            'sites_failed': 0,
            'articles_scraped': 0,
            'articles_duplicates': 0,
            'articles_invalid': 0,
            'full_content_fetched': 0,
            'errors': []
        }

    @abstractmethod
    async def scrape_site(self, site: Dict[str, Any], category: str) -> ScrapingResult:
        """
        Scrape a single site.

        Args:
            site: Site config dict with 'url', 'name', 'tier'
            category: Category name

        Returns:
            ScrapingResult with articles and stats
        """
        pass

    @abstractmethod
    def parse_article(self, item, site: Dict, category: str) -> Optional[Article]:
        """
        Parse a single article from HTML element.

        Args:
            item: BeautifulSoup element or dict
            site: Site config
            category: Category name

        Returns:
            Article or None if invalid
        """
        pass

    def validate_article(self, article: Article) -> tuple[bool, Optional[str]]:
        """
        Validate article against quality rules.

        Returns:
            (is_valid, reason_if_invalid)
        """
        # Check minimum content length
        if len(article.content) < self.config.scraper.min_content_length:
            return False, "content_too_short"

        # Check minimum word count
        if article.word_count < self.config.scraper.min_word_count:
            return False, "word_count_too_low"

        # Check minimum title length
        if len(article.title) < self.config.scraper.min_title_length:
            return False, "title_too_short"

        # Check date (must be recent)
        if self.config.filters.require_valid_date:
            max_age_days = self.config.filters.max_article_age_days
            age_days = (datetime.now() - article.published_date).days

            if age_days > max_age_days:
                return False, f"too_old_{age_days}_days"

        return True, None

    def create_article_from_data(
        self,
        url: str,
        title: str,
        content: str,
        published_date: Any,
        source: str,
        category: str,
        tier: str = "T3",
        **kwargs
    ) -> Optional[Article]:
        """
        Helper to create Article from scraped data.

        Handles:
        - Date parsing (all formats)
        - Validation
        - Deduplication check

        Returns:
            Article or None if invalid/duplicate
        """
        # Parse date
        parsed_date = parse_date_unified(published_date)

        if not parsed_date:
            if self.config.filters.require_valid_date:
                logger.debug(f"No valid date for: {title[:50]}")
                self.stats['articles_invalid'] += 1
                return None
            else:
                # Use current date as fallback
                parsed_date = datetime.now()

        # Create article
        try:
            article = Article(
                url=url,
                title=title,
                content=content,
                published_date=parsed_date,
                source=source,
                category=category,
                tier=ArticleTier(tier),
                **kwargs
            )
        except Exception as e:
            logger.debug(f"Failed to create article: {e}")
            self.stats['articles_invalid'] += 1
            return None

        # Validate
        is_valid, reason = self.validate_article(article)
        if not is_valid:
            logger.debug(f"Article invalid ({reason}): {title[:50]}")
            self.stats['articles_invalid'] += 1
            return None

        # Check duplicates
        is_dup, dup_reason = self.dedup_filter.is_duplicate(article)
        if is_dup:
            logger.debug(f"Duplicate article ({dup_reason}): {title[:50]}")
            self.stats['articles_duplicates'] += 1
            return None

        # Mark as seen
        self.dedup_filter.mark_seen(article)

        return article

    async def scrape_sites_parallel(
        self,
        sites: List[Dict[str, Any]],
        category: str,
        max_concurrent: int = None
    ) -> List[Article]:
        """
        Scrape multiple sites in parallel.

        Args:
            sites: List of site configs
            category: Category name
            max_concurrent: Max concurrent sites (from config if None)

        Returns:
            List of all articles from all sites
        """
        import asyncio

        if max_concurrent is None:
            max_concurrent = self.config.scraper.concurrent_sites

        semaphore = asyncio.Semaphore(max_concurrent)

        async def scrape_with_limit(site):
            async with semaphore:
                return await self.scrape_site(site, category)

        # Run all sites in parallel
        results = await asyncio.gather(
            *[scrape_with_limit(site) for site in sites],
            return_exceptions=True
        )

        # Collect all articles
        all_articles = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Scraping failed: {result}")
                self.stats['sites_failed'] += 1
                continue

            if isinstance(result, ScrapingResult):
                all_articles.extend(result.articles)
                self.stats['sites_successful'] += 1

        self.stats['articles_scraped'] = len(all_articles)

        return all_articles

    def get_stats(self) -> Dict[str, Any]:
        """Get scraping statistics"""
        return {
            **self.stats,
            'dedup_stats': self.dedup_filter.get_stats()
        }


class SimpleHTMLScraper(BaseScraper):
    """
    Simple HTML scraper using requests + BeautifulSoup.

    Good for:
    - Static sites
    - Simple HTML structure
    - No JavaScript required
    """

    async def scrape_site(self, site: Dict[str, Any], category: str) -> ScrapingResult:
        """Scrape using requests + BeautifulSoup"""
        import requests
        from bs4 import BeautifulSoup

        url = site.get('url')
        name = site.get('name', url)
        tier = site.get('tier', 'T3')

        result = ScrapingResult(
            site_name=name,
            site_url=url,
            category=category,
            tier=ArticleTier(tier)
        )

        try:
            # Fetch page
            response = requests.get(
                url,
                timeout=self.config.scraper.timeout_seconds,
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            response.raise_for_status()

            # Parse
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find article elements
            articles = soup.find_all('article')

            for item in articles[:self.config.scraper.max_articles_per_source]:
                article = self.parse_article(item, site, category)
                if article:
                    result.articles.append(article)

            result.success = True

        except Exception as e:
            result.success = False
            result.errors.append(str(e))
            logger.error(f"Failed to scrape {name}: {e}")

        result.articles_count = len(result.articles)
        return result

    def parse_article(self, item, site: Dict, category: str) -> Optional[Article]:
        """Parse article from BeautifulSoup element"""
        try:
            # Extract title
            title_elem = item.find(['h1', 'h2', 'h3'])
            if not title_elem:
                return None
            title = title_elem.get_text(strip=True)

            # Extract link
            link_elem = item.find('a')
            if not link_elem or not link_elem.get('href'):
                return None
            url = link_elem.get('href')

            # Make absolute URL
            if not url.startswith('http'):
                from urllib.parse import urljoin
                url = urljoin(site['url'], url)

            # Extract content (summary)
            content = item.get_text(strip=True)

            # Extract date
            date_elem = item.find('time')
            published_date = date_elem.get('datetime') if date_elem else None

            # Create article
            return self.create_article_from_data(
                url=url,
                title=title,
                content=content,
                published_date=published_date,
                source=site['name'],
                category=category,
                tier=site.get('tier', 'T3')
            )

        except Exception as e:
            logger.debug(f"Failed to parse article: {e}")
            return None


if __name__ == "__main__":
    # Test simple scraper
    import asyncio

    async def test():
        print("=" * 60)
        print("Testing SimpleScraper")
        print("=" * 60)

        scraper = SimpleHTMLScraper()

        # Test with a simple site
        site = {
            'name': 'Example News',
            'url': 'https://example.com',
            'tier': 'T3'
        }

        result = await scraper.scrape_site(site, 'test')

        print(f"\n✅ Result:")
        print(f"   Success: {result.success}")
        print(f"   Articles: {len(result.articles)}")
        print(f"   Errors: {result.errors}")

        stats = scraper.get_stats()
        print(f"\n📊 Stats:")
        for key, value in stats.items():
            if key != 'dedup_stats':
                print(f"   {key}: {value}")

    asyncio.run(test())
    print("=" * 60)

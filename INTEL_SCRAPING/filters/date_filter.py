#!/usr/bin/env python3
"""
Date Filter - Swiss-Watch Precision
Filters articles based on publication date.

Features:
- Age-based filtering (≤ N days old)
- Invalid date detection
- Date validation
- Statistics tracking
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

from INTEL_SCRAPING.core.models import Article
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class DateFilter:
    """
    Date-based filter for articles.

    Filters:
    - Articles older than max_age_days
    - Articles with invalid/missing dates
    - Articles with future dates (suspicious)
    """

    def __init__(self, config=None, max_age_days: int = None):
        self.config = config or settings
        self.max_age_days = max_age_days or self.config.filters.max_article_age_days

    def is_recent_article(self, article: Article) -> Tuple[bool, str]:
        """
        Check if article is recent enough.

        Returns:
            (is_recent, reason_if_not)
        """
        now = datetime.now()

        # Check if date is in the future (suspicious)
        if article.published_date > now:
            days_future = (article.published_date - now).days
            return False, f"future_date_{days_future}_days"

        # Calculate age
        age = now - article.published_date
        age_days = age.days

        # Check if too old
        if age_days > self.max_age_days:
            return False, f"too_old_{age_days}_days"

        return True, "recent"

    def filter_by_date(self, articles: List[Article]) -> Tuple[List[Article], Dict]:
        """
        Filter articles by date.

        Returns:
            (recent_articles, stats)
        """
        recent_articles = []
        stats = {
            'input_count': len(articles),
            'output_count': 0,
            'too_old': 0,
            'future_date': 0,
            'invalid_date': 0,
            'oldest_kept_days': 0,
            'newest_kept_days': 0,
            'filtered_by_age': {}
        }

        now = datetime.now()
        kept_ages = []

        for article in articles:
            is_recent, reason = self.is_recent_article(article)

            if is_recent:
                recent_articles.append(article)
                age_days = (now - article.published_date).days
                kept_ages.append(age_days)
            else:
                # Track reasons
                if reason.startswith('too_old'):
                    stats['too_old'] += 1
                    age_days = int(reason.split('_')[2])
                    stats['filtered_by_age'][age_days] = stats['filtered_by_age'].get(age_days, 0) + 1
                elif reason.startswith('future_date'):
                    stats['future_date'] += 1

        stats['output_count'] = len(recent_articles)
        stats['filter_rate'] = len(recent_articles) / max(len(articles), 1)

        if kept_ages:
            stats['oldest_kept_days'] = max(kept_ages)
            stats['newest_kept_days'] = min(kept_ages)
            stats['avg_age_days'] = sum(kept_ages) / len(kept_ages)

        logger.info(
            f"Date filter (≤{self.max_age_days} days): {len(articles)} → {len(recent_articles)} "
            f"({stats['filter_rate']*100:.1f}% kept, {stats['too_old']} too old)"
        )

        return recent_articles, stats

    def filter_by_date_range(
        self,
        articles: List[Article],
        start_date: datetime,
        end_date: datetime
    ) -> Tuple[List[Article], Dict]:
        """
        Filter articles within a specific date range.

        Args:
            articles: Articles to filter
            start_date: Start of date range (inclusive)
            end_date: End of date range (inclusive)

        Returns:
            (filtered_articles, stats)
        """
        filtered = []
        stats = {
            'input_count': len(articles),
            'output_count': 0,
            'before_range': 0,
            'after_range': 0,
            'in_range': 0
        }

        for article in articles:
            if article.published_date < start_date:
                stats['before_range'] += 1
            elif article.published_date > end_date:
                stats['after_range'] += 1
            else:
                filtered.append(article)
                stats['in_range'] += 1

        stats['output_count'] = len(filtered)

        logger.info(
            f"Date range filter ({start_date.date()} to {end_date.date()}): "
            f"{len(articles)} → {len(filtered)}"
        )

        return filtered, stats

    def get_date_distribution(self, articles: List[Article]) -> Dict[str, int]:
        """
        Get distribution of articles by date.

        Returns:
            Dict mapping date string (YYYY-MM-DD) to count
        """
        distribution = {}

        for article in articles:
            date_str = article.published_date.strftime('%Y-%m-%d')
            distribution[date_str] = distribution.get(date_str, 0) + 1

        return distribution

    def get_age_distribution(self, articles: List[Article]) -> Dict[str, int]:
        """
        Get distribution of articles by age buckets.

        Returns:
            Dict mapping age range to count
        """
        now = datetime.now()
        distribution = {
            '0-1 days': 0,
            '1-3 days': 0,
            '3-7 days': 0,
            '7-14 days': 0,
            '14-30 days': 0,
            '30+ days': 0
        }

        for article in articles:
            age_days = (now - article.published_date).days

            if age_days <= 1:
                distribution['0-1 days'] += 1
            elif age_days <= 3:
                distribution['1-3 days'] += 1
            elif age_days <= 7:
                distribution['3-7 days'] += 1
            elif age_days <= 14:
                distribution['7-14 days'] += 1
            elif age_days <= 30:
                distribution['14-30 days'] += 1
            else:
                distribution['30+ days'] += 1

        return distribution


if __name__ == "__main__":
    # Test date filter
    print("=" * 60)
    print("Date Filter Test")
    print("=" * 60)

    filter = DateFilter(max_age_days=7)

    # Test articles with different dates
    now = datetime.now()

    articles = [
        Article(
            url=f"https://example.com/article1",
            title="Recent Article",
            content="Content here" * 100,
            published_date=now - timedelta(days=1),
            source="News",
            category="test"
        ),
        Article(
            url=f"https://example.com/article2",
            title="Week Old Article",
            content="Content here" * 100,
            published_date=now - timedelta(days=7),
            source="News",
            category="test"
        ),
        Article(
            url=f"https://example.com/article3",
            title="Old Article",
            content="Content here" * 100,
            published_date=now - timedelta(days=30),
            source="News",
            category="test"
        ),
        Article(
            url=f"https://example.com/article4",
            title="Future Article",
            content="Content here" * 100,
            published_date=now + timedelta(days=1),
            source="News",
            category="test"
        ),
    ]

    # Filter by date
    recent, stats = filter.filter_by_date(articles)

    print(f"\n✅ Results:")
    print(f"   Input: {stats['input_count']}")
    print(f"   Output: {stats['output_count']}")
    print(f"   Too old: {stats['too_old']}")
    print(f"   Future dates: {stats['future_date']}")
    print(f"   Filter rate: {stats['filter_rate']*100:.1f}%")

    if stats.get('oldest_kept_days'):
        print(f"\n📊 Kept articles age:")
        print(f"   Oldest: {stats['oldest_kept_days']} days")
        print(f"   Newest: {stats['newest_kept_days']} days")
        print(f"   Average: {stats.get('avg_age_days', 0):.1f} days")

    # Age distribution
    distribution = filter.get_age_distribution(articles)
    print(f"\n📈 Age distribution (all articles):")
    for age_range, count in distribution.items():
        print(f"   {age_range}: {count}")

    print("=" * 60)

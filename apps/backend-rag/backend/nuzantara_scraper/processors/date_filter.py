"""
Date Filtering Processor
Filters scraped content based on publication date (5-day cutoff for all content)
"""

import re
from datetime import datetime, timedelta
from typing import List, Optional
from loguru import logger

from ..models.scraped_content import ScrapedContent


class DateFilter:
    """
    Filter scraped content by publication date

    Removes content older than 5 days to focus on recent, actionable intelligence
    """

    def __init__(self, max_age_days: int = 5):
        """
        Initialize date filter

        Args:
            max_age_days: Maximum age in days for content (default: 5)
        """
        self.max_age_days = max_age_days
        # Normalize cutoff to midnight (00:00:00) to compare only dates, not times
        cutoff_datetime = datetime.now() - timedelta(days=max_age_days)
        self.cutoff_date = cutoff_datetime.replace(hour=0, minute=0, second=0, microsecond=0)

        logger.info(f"Date filter initialized: {max_age_days} day cutoff")
        logger.debug(f"Cutoff date: {self.cutoff_date.strftime('%Y-%m-%d')}")

    def filter_items(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """
        Filter items by date, keeping only recent content

        Args:
            items: List of scraped content items

        Returns:
            Filtered list of items within date cutoff
        """
        if not items:
            return items

        filtered_items = []
        too_old_count = 0
        no_date_count = 0

        for item in items:
            # Extract date from item
            pub_date = self._extract_date(item)

            if pub_date is None:
                # No date found - keep item with warning
                no_date_count += 1
                filtered_items.append(item)
                continue

            # Normalize pub_date to midnight for fair comparison (dates only, ignore times)
            pub_date_normalized = pub_date.replace(hour=0, minute=0, second=0, microsecond=0)

            # Check if date is within cutoff
            if pub_date_normalized >= self.cutoff_date:
                filtered_items.append(item)
            else:
                too_old_count += 1
                logger.debug(
                    f"Filtered out old content: '{item.title[:50]}...' "
                    f"(published: {pub_date.strftime('%Y-%m-%d')})"
                )

        # Log filtering results
        if too_old_count > 0 or no_date_count > 0:
            logger.info(
                f"Date filtering: kept {len(filtered_items)}/{len(items)} items "
                f"(filtered {too_old_count} old, {no_date_count} no date)"
            )

        return filtered_items

    def _extract_date(self, item: ScrapedContent) -> Optional[datetime]:
        """
        Extract publication date from scraped content

        Tries multiple strategies:
        1. extracted_data['published_date']
        2. extracted_data['date']
        3. Parse from title
        4. Parse from content
        5. Use scraped_at as fallback

        Args:
            item: Scraped content item

        Returns:
            Extracted datetime or None
        """
        # Strategy 1: Check extracted_data for date fields
        if item.extracted_data:
            for date_field in ['published_date', 'date', 'publication_date', 'pub_date']:
                date_value = item.extracted_data.get(date_field)
                if date_value:
                    parsed_date = self._parse_date_string(date_value)
                    if parsed_date:
                        return parsed_date

        # Strategy 2: Parse from title
        if item.title:
            parsed_date = self._extract_date_from_text(item.title)
            if parsed_date:
                return parsed_date

        # Strategy 3: Parse from content (first 200 chars)
        if item.content:
            parsed_date = self._extract_date_from_text(item.content[:200])
            if parsed_date:
                return parsed_date

        # Strategy 4: Use scraped_at as fallback (assume it's recent)
        if hasattr(item, 'scraped_at') and item.scraped_at:
            return item.scraped_at

        return None

    def _parse_date_string(self, date_str: str) -> Optional[datetime]:
        """
        Parse various date string formats

        Supports:
        - ISO format: 2025-10-23, 2025-10-23T10:30:00
        - Indonesian format: 23 Oktober 2025, 23 Okt 2025
        - Relative: "2 days ago", "yesterday"
        - Time elements: <time datetime="2025-10-23">

        Args:
            date_str: Date string to parse

        Returns:
            Parsed datetime or None
        """
        if not date_str or not isinstance(date_str, str):
            return None

        date_str = date_str.strip()

        # ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
        iso_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', date_str)
        if iso_match:
            try:
                return datetime(
                    int(iso_match.group(1)),
                    int(iso_match.group(2)),
                    int(iso_match.group(3))
                )
            except ValueError:
                pass

        # Indonesian months
        indonesian_months = {
            'januari': 1, 'jan': 1,
            'februari': 2, 'feb': 2,
            'maret': 3, 'mar': 3,
            'april': 4, 'apr': 4,
            'mei': 5,
            'juni': 6, 'jun': 6,
            'juli': 7, 'jul': 7,
            'agustus': 8, 'agu': 8, 'agt': 8,
            'september': 9, 'sep': 9, 'sept': 9,
            'oktober': 10, 'okt': 10, 'oct': 10,
            'november': 11, 'nov': 11,
            'desember': 12, 'des': 12, 'dec': 12
        }

        # Format: DD Month YYYY (e.g., "23 Oktober 2025")
        for month_name, month_num in indonesian_months.items():
            pattern = rf'(\d{{1,2}})\s+{month_name}\s+(\d{{4}})'
            match = re.search(pattern, date_str, re.IGNORECASE)
            if match:
                try:
                    return datetime(
                        int(match.group(2)),  # year
                        month_num,  # month
                        int(match.group(1))   # day
                    )
                except ValueError:
                    pass

        # Relative dates
        now = datetime.now()

        # "X days ago"
        days_ago_match = re.search(r'(\d+)\s+(day|hari|days)\s+ago', date_str, re.IGNORECASE)
        if days_ago_match:
            days = int(days_ago_match.group(1))
            return now - timedelta(days=days)

        # "yesterday" or "kemarin"
        if re.search(r'\b(yesterday|kemarin)\b', date_str, re.IGNORECASE):
            return now - timedelta(days=1)

        # "today" or "hari ini"
        if re.search(r'\b(today|hari ini|sekarang)\b', date_str, re.IGNORECASE):
            return now

        return None

    def _extract_date_from_text(self, text: str) -> Optional[datetime]:
        """
        Extract date from arbitrary text content

        Args:
            text: Text to extract date from

        Returns:
            Extracted datetime or None
        """
        if not text:
            return None

        # Try parsing the whole text as a date string
        return self._parse_date_string(text)


def filter_by_date(
    items: List[ScrapedContent],
    max_age_days: int = 5
) -> List[ScrapedContent]:
    """
    Convenience function to filter items by date

    Args:
        items: List of scraped content items
        max_age_days: Maximum age in days (default: 5)

    Returns:
        Filtered list of items
    """
    date_filter = DateFilter(max_age_days=max_age_days)
    return date_filter.filter_items(items)

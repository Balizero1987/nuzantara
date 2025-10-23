"""Deduplication filter"""

import hashlib
from typing import List, Set
from difflib import SequenceMatcher
from loguru import logger

from ..models.scraped_content import ScrapedContent


class DedupFilter:
    """
    Deduplication filter for scraped content
    - Exact hash matching
    - Fuzzy title matching
    - Content similarity detection
    """

    def __init__(
        self,
        title_similarity_threshold: float = 0.85,
        content_similarity_threshold: float = 0.90
    ):
        self.title_similarity_threshold = title_similarity_threshold
        self.content_similarity_threshold = content_similarity_threshold

        # Tracking sets
        self.seen_hashes: Set[str] = set()
        self.seen_titles: List[str] = []
        self.seen_content_hashes: Set[str] = set()

    def is_duplicate(self, item: ScrapedContent) -> bool:
        """
        Check if item is a duplicate

        Args:
            item: Scraped content

        Returns:
            True if duplicate
        """
        # Check exact content hash
        content_hash = self._content_hash(item.content)
        if content_hash in self.seen_content_hashes:
            logger.debug(f"Duplicate (exact match): {item.title[:50]}")
            return True

        # Check title similarity
        for seen_title in self.seen_titles:
            similarity = self._similarity(item.title, seen_title)
            if similarity >= self.title_similarity_threshold:
                logger.debug(f"Duplicate (title similarity={similarity:.2f}): {item.title[:50]}")
                return True

        # Not a duplicate
        self.seen_content_hashes.add(content_hash)
        self.seen_titles.append(item.title)
        return False

    def filter_batch(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """
        Filter duplicates from batch

        Args:
            items: List of scraped items

        Returns:
            Deduplicated list
        """
        unique_items = []

        for item in items:
            if not self.is_duplicate(item):
                unique_items.append(item)

        logger.info(f"Dedup filter: {len(unique_items)}/{len(items)} unique items")
        return unique_items

    def _content_hash(self, content: str) -> str:
        """Generate hash for content"""
        return hashlib.md5(content[:500].encode()).hexdigest()

    def _similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity ratio between two texts

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity ratio (0.0 to 1.0)
        """
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

    def clear(self):
        """Clear seen items"""
        self.seen_hashes.clear()
        self.seen_titles.clear()
        self.seen_content_hashes.clear()
        logger.info("Dedup filter cleared")

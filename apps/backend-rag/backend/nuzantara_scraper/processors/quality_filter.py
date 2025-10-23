"""Quality filter for scraped content"""

from typing import List
from loguru import logger

from ..models.scraped_content import ScrapedContent


class QualityFilter:
    """
    Filters content based on quality metrics
    - Minimum word count
    - Quality score threshold
    - Relevance score threshold
    """

    def __init__(
        self,
        min_word_count: int = 50,
        min_quality_score: float = 0.3,
        min_relevance_score: float = 0.0
    ):
        self.min_word_count = min_word_count
        self.min_quality_score = min_quality_score
        self.min_relevance_score = min_relevance_score

    def passes(self, item: ScrapedContent) -> bool:
        """
        Check if item passes quality filter

        Args:
            item: Scraped content

        Returns:
            True if passes all checks
        """
        # Check word count
        if item.word_count < self.min_word_count:
            logger.debug(f"Filtered: {item.title[:50]} (word_count={item.word_count} < {self.min_word_count})")
            return False

        # Check quality score
        if item.quality_score < self.min_quality_score:
            logger.debug(f"Filtered: {item.title[:50]} (quality={item.quality_score:.2f} < {self.min_quality_score})")
            return False

        # Check relevance score
        if item.relevance_score < self.min_relevance_score:
            logger.debug(f"Filtered: {item.title[:50]} (relevance={item.relevance_score:.2f} < {self.min_relevance_score})")
            return False

        return True

    def filter_batch(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """Filter a batch of items"""
        return [item for item in items if self.passes(item)]

    def calculate_quality_score(self, item: ScrapedContent) -> float:
        """
        Calculate quality score for item

        Factors:
        - Content length (longer is better, up to a point)
        - Title quality
        - Source tier
        - AI confidence (if available)

        Returns:
            Quality score between 0.0 and 1.0
        """
        score = 0.0

        # Word count score (0-0.4)
        if item.word_count >= 1000:
            score += 0.4
        elif item.word_count >= 500:
            score += 0.3
        elif item.word_count >= 200:
            score += 0.2
        elif item.word_count >= 100:
            score += 0.1

        # Title quality (0-0.2)
        if item.title:
            title_len = len(item.title)
            if 30 <= title_len <= 150:
                score += 0.2
            elif 20 <= title_len < 30 or 150 < title_len <= 200:
                score += 0.1

        # Source tier (0-0.2)
        tier_scores = {
            "official": 0.2,
            "accredited": 0.15,
            "community": 0.1
        }
        score += tier_scores.get(item.source_tier.value, 0.0)

        # AI confidence (0-0.2)
        if item.ai_analysis and "confidence" in item.ai_analysis:
            score += item.ai_analysis["confidence"] * 0.2

        return min(score, 1.0)

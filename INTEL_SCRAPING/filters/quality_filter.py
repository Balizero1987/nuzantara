#!/usr/bin/env python3
"""
Quality Filter - Swiss-Watch Precision
Filters articles based on quality metrics.

Checks:
- Content length and word count
- Title quality
- Source tier
- Spam keywords
- URL validity
"""

import logging
from typing import List, Dict, Tuple
import re

from INTEL_SCRAPING.core.models import Article
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class QualityFilter:
    """
    Quality filter for articles.

    Filters based on:
    - Minimum content length
    - Minimum word count
    - Title quality
    - Spam detection
    - URL format
    """

    def __init__(self, config=None):
        self.config = config or settings

        # Spam keywords (lowercase)
        self.spam_keywords = [
            'click here',
            'read more',
            'advertisement',
            'sponsored',
            'buy now',
            'limited offer',
            'act now',
            'subscribe now',
            'unsubscribe',
            'click to unsubscribe'
        ]

    def is_quality_article(self, article: Article) -> Tuple[bool, str]:
        """
        Check if article meets quality standards.

        Returns:
            (is_quality, reason_if_not)
        """
        # Check title
        if len(article.title) < self.config.scraper.min_title_length:
            return False, f"title_too_short_{len(article.title)}"

        # Check if title is too generic
        generic_titles = ['untitled', 'no title', 'article', 'post', 'new post']
        if article.title.lower() in generic_titles:
            return False, "generic_title"

        # Check content length
        if len(article.content) < self.config.scraper.min_content_length:
            return False, f"content_too_short_{len(article.content)}"

        # Check word count
        if article.word_count < self.config.scraper.min_word_count:
            return False, f"word_count_too_low_{article.word_count}"

        # Check for spam keywords
        content_lower = article.content.lower()
        for keyword in self.spam_keywords:
            if keyword in content_lower:
                return False, f"spam_keyword_{keyword.replace(' ', '_')}"

        # Check if content is mostly repetitive
        if self._is_repetitive_content(article.content):
            return False, "repetitive_content"

        # Check URL validity
        if not article.url.startswith(('http://', 'https://')):
            return False, "invalid_url"

        return True, "quality_pass"

    def _is_repetitive_content(self, content: str) -> bool:
        """
        Check if content is mostly repetitive (low quality).

        Returns True if content seems repetitive/boilerplate.
        """
        # Split into sentences
        sentences = re.split(r'[.!?]+', content)

        if len(sentences) < 3:
            return True  # Too short to be meaningful

        # Check for excessive repetition
        sentence_set = set(s.strip().lower() for s in sentences if len(s.strip()) > 10)

        # If > 50% sentences are duplicates, it's repetitive
        if len(sentences) > 5:
            uniqueness = len(sentence_set) / len(sentences)
            if uniqueness < 0.5:
                return True

        return False

    def filter_articles(self, articles: List[Article]) -> Tuple[List[Article], Dict]:
        """
        Filter list of articles by quality.

        Returns:
            (quality_articles, stats)
        """
        quality_articles = []
        stats = {
            'input_count': len(articles),
            'output_count': 0,
            'filtered_by_reason': {}
        }

        for article in articles:
            is_quality, reason = self.is_quality_article(article)

            if is_quality:
                quality_articles.append(article)
            else:
                # Track reasons
                stats['filtered_by_reason'][reason] = stats['filtered_by_reason'].get(reason, 0) + 1

        stats['output_count'] = len(quality_articles)
        stats['filter_rate'] = len(quality_articles) / max(len(articles), 1)

        logger.info(
            f"Quality filter: {len(articles)} → {len(quality_articles)} "
            f"({stats['filter_rate']*100:.1f}% kept)"
        )

        return quality_articles, stats

    def calculate_quality_score(self, article: Article) -> float:
        """
        Calculate quality score (0.0 - 1.0).

        Factors:
        - Content length (longer = better, up to 5000 words)
        - Title quality
        - Source tier
        - No spam keywords
        """
        score = 0.0

        # Content length score (0.0 - 0.3)
        words = article.word_count
        if words >= 2000:
            score += 0.3
        elif words >= 1000:
            score += 0.2
        elif words >= 500:
            score += 0.1
        else:
            score += 0.05

        # Title quality score (0.0 - 0.2)
        title_words = len(article.title.split())
        if 5 <= title_words <= 20:  # Ideal length
            score += 0.2
        elif 3 <= title_words <= 25:
            score += 0.1

        # Source tier score (0.0 - 0.3)
        tier_scores = {'T1': 0.3, 'T2': 0.2, 'T3': 0.1}
        score += tier_scores.get(article.tier.value, 0.1)

        # No spam bonus (0.0 - 0.2)
        content_lower = article.content.lower()
        has_spam = any(kw in content_lower for kw in self.spam_keywords)
        if not has_spam:
            score += 0.2

        return min(score, 1.0)


if __name__ == "__main__":
    # Test quality filter
    print("=" * 60)
    print("Quality Filter Test")
    print("=" * 60)

    from datetime import datetime

    filter = QualityFilter()

    # Test article 1: Good quality
    article1 = Article(
        url="https://example.com/article1",
        title="Important AI Breakthrough Announced by OpenAI",
        content="This is a substantial article about AI developments. " * 50,
        published_date=datetime.now(),
        source="Tech News",
        category="ai_tech"
    )

    # Test article 2: Spam
    article2 = Article(
        url="https://example.com/article2",
        title="Click here for amazing offers",
        content="Click here to buy now! Limited offer! Subscribe now! " * 20,
        published_date=datetime.now(),
        source="Spam Site",
        category="spam"
    )

    # Test article 3: Too short
    article3 = Article(
        url="https://example.com/article3",
        title="Short",
        content="Too short.",
        published_date=datetime.now(),
        source="News",
        category="news"
    )

    articles = [article1, article2, article3]

    # Filter
    quality, stats = filter.filter_articles(articles)

    print(f"\n✅ Results:")
    print(f"   Input: {stats['input_count']}")
    print(f"   Output: {stats['output_count']}")
    print(f"   Filter rate: {stats['filter_rate']*100:.1f}%")

    print(f"\n📊 Filtered by reason:")
    for reason, count in stats['filtered_by_reason'].items():
        print(f"   {reason}: {count}")

    # Scores
    print(f"\n🎯 Quality scores:")
    for i, article in enumerate(articles, 1):
        score = filter.calculate_quality_score(article)
        print(f"   Article {i}: {score:.2f}")

    print("=" * 60)

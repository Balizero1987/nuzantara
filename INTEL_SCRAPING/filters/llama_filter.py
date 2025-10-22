#!/usr/bin/env python3
"""
LLAMA Intelligent Filter - Swiss-Watch Edition

Relevance-based filtering for general content.
Uses unified Article models and centralized deduplication.

Key Features:
- Relevance scoring based on content quality, tier, and category
- Category-specific keyword matching
- Freshness scoring
- Configurable quality thresholds
- No duplicate dedup logic (uses centralized filter)
"""

import logging
from typing import List, Tuple, Dict, Any
from datetime import datetime

from INTEL_SCRAPING.core.models import Article, ArticleTier
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class LLAMAFilter:
    """
    LLAMA intelligent filter for relevance-based content filtering.

    This filter focuses on RELEVANCE SCORING, not quality or dedup:
    - Quality filtering is handled by QualityFilter
    - Deduplication is handled by DeduplicationFilter
    - This filter scores articles for relevance to their category
    """

    def __init__(self, quality_threshold: float = 0.7, impact_threshold: str = "medium"):
        """
        Initialize LLAMA filter.

        Args:
            quality_threshold: Minimum llama_score required (0.0-1.0)
            impact_threshold: Minimum impact level (low/medium/high/critical)
        """
        self.quality_threshold = quality_threshold
        self.impact_threshold = impact_threshold
        self.config = settings

        # Statistics
        self.stats = {
            'total_processed': 0,
            'passed_threshold': 0,
            'failed_threshold': 0,
            'avg_score': 0.0,
            'score_distribution': {
                '0.0-0.3': 0,
                '0.3-0.5': 0,
                '0.5-0.7': 0,
                '0.7-0.9': 0,
                '0.9-1.0': 0
            }
        }

    def filter_articles(self, articles: List[Article]) -> List[Article]:
        """
        Filter articles based on relevance scoring.

        Process:
        1. Score each article for relevance (llama_score)
        2. Filter by quality_threshold and impact_threshold
        3. Return high-relevance articles

        Args:
            articles: List of Article objects (already deduped and quality-checked)

        Returns:
            List of high-relevance Article objects with llama_score added
        """
        logger.info(f"🧠 LLAMA Filter: Analyzing {len(articles)} articles")

        if not articles:
            return []

        # Step 1: Score articles for relevance
        scored_articles = self._score_relevance(articles)
        logger.info(f"✅ Scored {len(scored_articles)} articles")

        # Step 2: Filter by thresholds
        filtered_articles = self._filter_by_threshold(scored_articles)
        logger.info(f"🎯 FINAL: {len(filtered_articles)} high-relevance articles")

        # Update statistics
        self._update_stats(scored_articles, filtered_articles)

        return filtered_articles

    def _score_relevance(self, articles: List[Article]) -> List[Article]:
        """
        Score articles for relevance based on multiple factors.

        Scoring factors:
        - Content length (0.0-0.3): Longer content = more detailed
        - Source tier (0.0-0.4): T1 > T2 > T3
        - Category keywords (0.0-0.3): Relevant to category
        - Freshness (0.0-0.2): Recent content is more relevant

        Total: 0.0-1.2 (normalized to 0.0-1.0)
        """
        scored_articles = []

        for article in articles:
            score = 0.0

            # Factor 1: Content length (0.0-0.3)
            if article.word_count > 1000:
                score += 0.3
            elif article.word_count > 500:
                score += 0.2
            else:
                score += 0.1

            # Factor 2: Source tier (0.0-0.4)
            if article.tier == ArticleTier.T1:
                score += 0.4
            elif article.tier == ArticleTier.T2:
                score += 0.3
            else:
                score += 0.1

            # Factor 3: Category keywords (0.0-0.3)
            relevant_keywords = self._get_category_keywords(article.category)
            content_lower = article.content.lower()
            keyword_matches = sum(1 for kw in relevant_keywords if kw.lower() in content_lower)
            score += min(keyword_matches * 0.1, 0.3)

            # Factor 4: Freshness (0.0-0.2)
            hours_old = (datetime.now() - article.published_date).total_seconds() / 3600
            if hours_old < 24:
                score += 0.2
            elif hours_old < 48:
                score += 0.1

            # Normalize to 0.0-1.0 and store
            normalized_score = min(score / 1.2, 1.0)
            article.quality_score = round(normalized_score, 3)  # Store as quality_score

            scored_articles.append(article)

        return scored_articles

    def _get_category_keywords(self, category: str) -> List[str]:
        """Get relevant keywords for category"""
        keywords_map = {
            'visa_immigration': ['visa', 'passport', 'immigration', 'residence', 'permit', 'citizenship', 'foreigner'],
            'business_setup': ['business', 'company', 'investment', 'license', 'registration', 'startup', 'entrepreneur'],
            'tax': ['tax', 'taxation', 'revenue', 'duty', 'customs', 'fiscal', 'vat', 'income'],
            'property_law': ['property', 'real estate', 'land', 'house', 'apartment', 'ownership', 'lease'],
            'health_safety': ['health', 'medical', 'hospital', 'clinic', 'doctor', 'healthcare', 'safety'],
            'employment_law': ['job', 'work', 'employment', 'salary', 'contract', 'labor', 'employee'],
            'banking_finance': ['bank', 'banking', 'finance', 'loan', 'credit', 'investment', 'money'],
            'regulatory_changes': ['regulation', 'policy', 'law', 'legal', 'compliance', 'requirement', 'rule'],
            'transport_connectivity': ['transport', 'vehicle', 'driving', 'license', 'road', 'traffic', 'infrastructure'],
            'macro_policy': ['economy', 'policy', 'government', 'minister', 'president', 'parliament', 'regulation'],
            'competitor_intel': ['competitor', 'market', 'industry', 'business', 'company', 'strategy', 'analysis'],
            'lifestyle': ['lifestyle', 'living', 'expat', 'community', 'social', 'culture', 'daily'],
            'events_networking': ['event', 'conference', 'meeting', 'networking', 'seminar', 'workshop', 'gathering'],
            'social_media': ['social', 'media', 'digital', 'online', 'platform', 'content', 'community'],
            'ai_tech': ['ai', 'artificial intelligence', 'technology', 'digital', 'software', 'machine learning', 'automation'],
            'dev_code': ['development', 'coding', 'programming', 'software', 'api', 'framework', 'library'],
            'future_trends': ['future', 'trend', 'innovation', 'emerging', 'prediction', 'forecast', 'upcoming'],
            'news': ['news', 'breaking', 'latest', 'update', 'announcement', 'reported', 'confirmed'],
            'jobs': ['job', 'career', 'hiring', 'recruitment', 'position', 'vacancy', 'opportunity']
        }

        return keywords_map.get(category, [])

    def _filter_by_threshold(self, articles: List[Article]) -> List[Article]:
        """
        Filter articles by quality_threshold and impact_threshold.

        Args:
            articles: Scored articles

        Returns:
            Articles that meet both thresholds
        """
        filtered = []

        impact_scores = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        min_impact = impact_scores.get(self.impact_threshold, 2)

        for article in articles:
            # Check quality threshold
            if article.quality_score < self.quality_threshold:
                continue

            # Check impact threshold (if article has impact_level)
            # Note: impact_level is not in base Article model, but could be added by other filters
            article_impact = getattr(article, 'impact_level', 'medium')
            if impact_scores.get(article_impact, 2) < min_impact:
                continue

            filtered.append(article)

        return filtered

    def _update_stats(self, scored: List[Article], filtered: List[Article]):
        """Update filter statistics"""
        self.stats['total_processed'] = len(scored)
        self.stats['passed_threshold'] = len(filtered)
        self.stats['failed_threshold'] = len(scored) - len(filtered)

        if scored:
            total_score = sum(a.quality_score for a in scored)
            self.stats['avg_score'] = round(total_score / len(scored), 3)

            # Score distribution
            for article in scored:
                score = article.quality_score
                if score < 0.3:
                    self.stats['score_distribution']['0.0-0.3'] += 1
                elif score < 0.5:
                    self.stats['score_distribution']['0.3-0.5'] += 1
                elif score < 0.7:
                    self.stats['score_distribution']['0.5-0.7'] += 1
                elif score < 0.9:
                    self.stats['score_distribution']['0.7-0.9'] += 1
                else:
                    self.stats['score_distribution']['0.9-1.0'] += 1

    def get_stats(self) -> Dict[str, Any]:
        """Get filter statistics"""
        return self.stats.copy()

    def reset_stats(self):
        """Reset statistics"""
        self.stats = {
            'total_processed': 0,
            'passed_threshold': 0,
            'failed_threshold': 0,
            'avg_score': 0.0,
            'score_distribution': {
                '0.0-0.3': 0,
                '0.3-0.5': 0,
                '0.5-0.7': 0,
                '0.7-0.9': 0,
                '0.9-1.0': 0
            }
        }


# Convenience function for legacy compatibility
def intelligent_filter(articles: List[Dict]) -> List[Dict]:
    """
    Legacy compatibility wrapper.

    Converts dict-based articles to Article objects, filters them,
    and converts back to dicts.
    """
    # Convert dicts to Articles
    article_objects = []
    for art_dict in articles:
        try:
            article = Article(**art_dict)
            article_objects.append(article)
        except Exception as e:
            logger.warning(f"Failed to convert article to model: {e}")
            continue

    # Filter
    llama_filter = LLAMAFilter()
    filtered_articles = llama_filter.filter_articles(article_objects)

    # Convert back to dicts
    return [art.dict() for art in filtered_articles]


if __name__ == "__main__":
    # Test LLAMA filter
    from datetime import datetime, timedelta

    print("=" * 60)
    print("Testing LLAMAFilter")
    print("=" * 60)

    # Create test articles
    test_articles = [
        Article(
            url="https://example.com/article1",
            title="Major Policy Change in Immigration Law",
            content="The government announced significant changes to visa regulations. " * 100,  # ~1000 words
            published_date=datetime.now() - timedelta(hours=12),
            source="Government News",
            category="visa_immigration",
            tier=ArticleTier.T1,
            word_count=1000
        ),
        Article(
            url="https://example.com/article2",
            title="New Business Registration Process",
            content="Short article about business setup. " * 20,  # ~100 words
            published_date=datetime.now() - timedelta(hours=36),
            source="Business Daily",
            category="business_setup",
            tier=ArticleTier.T3,
            word_count=100
        ),
        Article(
            url="https://example.com/article3",
            title="Tax Reform Proposal Announced",
            content="Major tax changes affecting businesses and individuals announced today. " * 80,  # ~800 words
            published_date=datetime.now() - timedelta(hours=6),
            source="Financial Times",
            category="tax",
            tier=ArticleTier.T2,
            word_count=800
        ),
    ]

    # Test filter
    llama_filter = LLAMAFilter(quality_threshold=0.6)
    filtered = llama_filter.filter_articles(test_articles)

    print(f"\n✅ Results:")
    print(f"   Input: {len(test_articles)} articles")
    print(f"   Output: {len(filtered)} articles")

    print(f"\n📊 Article Scores:")
    for article in test_articles:
        print(f"   {article.title[:50]}...")
        print(f"   → Score: {article.quality_score:.3f} | Tier: {article.tier} | Words: {article.word_count}")
        print(f"   → {'✅ PASSED' if article in filtered else '❌ FILTERED'}")
        print()

    stats = llama_filter.get_stats()
    print(f"📈 Statistics:")
    print(f"   Total processed: {stats['total_processed']}")
    print(f"   Passed threshold: {stats['passed_threshold']}")
    print(f"   Failed threshold: {stats['failed_threshold']}")
    print(f"   Average score: {stats['avg_score']:.3f}")
    print(f"   Score distribution: {stats['score_distribution']}")

    print("=" * 60)

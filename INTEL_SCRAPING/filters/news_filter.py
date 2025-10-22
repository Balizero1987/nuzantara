#!/usr/bin/env python3
"""
News Intelligent Filter - Swiss-Watch Edition

Specialized filter for ACTUAL NEWS (not procedures or guides).
Focuses on breaking news and recent events.

Key Features:
- Filters out procedure/guide/tutorial content
- Focuses on breaking news indicators
- Impact-based scoring
- Freshness emphasis (recent news priority)
- Category-specific news keywords
- No duplicate dedup logic (uses centralized filter)
"""

import logging
from typing import List, Dict, Any
from datetime import datetime

from INTEL_SCRAPING.core.models import Article, ArticleTier
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class NewsIntelligentFilter:
    """
    Intelligent filter for REAL NEWS content.

    This filter is specialized for news categories:
    - Filters out procedures, guides, tutorials
    - Focuses on breaking news and recent events
    - Emphasizes impact and timeliness
    """

    def __init__(self, news_threshold: float = 0.7, breaking_threshold: int = 2):
        """
        Initialize news filter.

        Args:
            news_threshold: Minimum news_score required (0.0-1.0)
            breaking_threshold: Minimum breaking_score required (0-10+)
        """
        self.news_threshold = news_threshold
        self.breaking_threshold = breaking_threshold
        self.config = settings

        # Statistics
        self.stats = {
            'total_processed': 0,
            'news_only': 0,
            'breaking_news': 0,
            'passed_threshold': 0,
            'filtered_procedures': 0,
            'filtered_generic': 0,
            'filtered_no_news': 0,
            'avg_news_score': 0.0,
            'avg_breaking_score': 0.0
        }

    def filter_real_news(self, articles: List[Article]) -> List[Article]:
        """
        Filter for REAL NEWS articles only.

        Process:
        1. Filter out procedures/guides/tutorials
        2. Filter for breaking news indicators
        3. Score news impact
        4. Filter by thresholds

        Args:
            articles: List of Article objects

        Returns:
            List of real news Article objects with news_score and breaking_score
        """
        logger.info(f"📰 News Filter: Analyzing {len(articles)} articles")

        if not articles:
            return []

        self.stats['total_processed'] = len(articles)

        # Step 1: Filter for NEWS ONLY (not procedures)
        news_only = self._filter_news_only(articles)
        self.stats['news_only'] = len(news_only)
        logger.info(f"✅ After news filter: {len(news_only)} articles")

        # Step 2: Filter for BREAKING NEWS
        breaking_news = self._filter_breaking_news(news_only)
        self.stats['breaking_news'] = len(breaking_news)
        logger.info(f"✅ After breaking filter: {len(breaking_news)} articles")

        # Step 3: Score NEWS IMPACT
        scored_news = self._score_news_impact(breaking_news)
        logger.info(f"✅ After scoring: {len(scored_news)} articles")

        # Step 4: Final threshold filter
        final_news = self._final_news_filter(scored_news)
        self.stats['passed_threshold'] = len(final_news)
        logger.info(f"🎯 FINAL: {len(final_news)} REAL NEWS articles")

        # Update stats
        self._update_stats(scored_news)

        return final_news

    def _filter_news_only(self, articles: List[Article]) -> List[Article]:
        """
        Filter for REAL NEWS, exclude procedures and generic descriptions.

        Excludes:
        - Procedure/tutorial content
        - Generic descriptions
        - How-to guides

        Includes:
        - Articles with news indicators (announced, reported, breaking, etc.)
        """
        news_articles = []

        # Procedure keywords (EXCLUDE)
        procedure_keywords = [
            'process', 'procedure', 'steps', 'requirements',
            'registration', 'application', 'documentation',
            'how to', 'guide', 'tutorial', 'instructions',
            'checklist', 'form', 'apply for'
        ]

        # Generic keywords (EXCLUDE)
        generic_keywords = [
            'overview', 'introduction', 'about', 'general',
            'basic', 'fundamental', 'principles', 'definition',
            'what is', 'understanding'
        ]

        # News indicators (REQUIRE)
        news_indicators = [
            'announced', 'reported', 'confirmed', 'revealed',
            'breaking', 'latest', 'update', 'new', 'recent',
            'yesterday', 'today', 'this week', 'this month',
            'just in', 'developing', 'exclusive', 'sources say'
        ]

        for article in articles:
            title_lower = article.title.lower()
            content_lower = article.content.lower()

            # Check for procedure content (EXCLUDE)
            if any(kw in title_lower or kw in content_lower for kw in procedure_keywords):
                self.stats['filtered_procedures'] += 1
                continue

            # Check for generic content (EXCLUDE)
            if any(kw in title_lower or kw in content_lower for kw in generic_keywords):
                self.stats['filtered_generic'] += 1
                continue

            # Check for news indicators (REQUIRE)
            if any(indicator in title_lower or indicator in content_lower for indicator in news_indicators):
                news_articles.append(article)
            else:
                self.stats['filtered_no_news'] += 1

        return news_articles

    def _filter_breaking_news(self, articles: List[Article]) -> List[Article]:
        """
        Filter for BREAKING NEWS and important news.

        Scores based on:
        - Breaking keywords (breaking, urgent, alert, etc.)
        - Impact keywords (major, significant, historic, etc.)
        - Date indicators (today, yesterday, etc.)
        - Source tier (T1 sources more credible)
        """
        breaking_articles = []

        # Breaking news keywords
        breaking_keywords = [
            'breaking', 'urgent', 'alert', 'emergency',
            'crisis', 'scandal', 'investigation', 'exclusive',
            'just announced', 'immediately', 'developing'
        ]

        # Impact keywords
        impact_keywords = [
            'major', 'significant', 'important', 'critical',
            'historic', 'unprecedented', 'first time',
            'revolutionary', 'game-changing', 'massive',
            'dramatic', 'shocking'
        ]

        # Date indicators (recent news)
        date_indicators = [
            'today', 'yesterday', 'this week', 'this month',
            'hours ago', 'minutes ago', 'just now',
            'january', 'february', 'march', 'april', 'may',
            'june', 'july', 'august', 'september', 'october',
            'november', 'december', '2024', '2025'
        ]

        for article in articles:
            title_lower = article.title.lower()
            content_lower = article.content.lower()

            breaking_score = 0

            # Count breaking keywords
            breaking_score += sum(1 for kw in breaking_keywords if kw in title_lower or kw in content_lower)

            # Count impact keywords
            breaking_score += sum(1 for kw in impact_keywords if kw in title_lower or kw in content_lower)

            # Count date indicators
            breaking_score += sum(1 for kw in date_indicators if kw in title_lower or kw in content_lower)

            # Bonus for source tier
            if article.tier == ArticleTier.T1:
                breaking_score += 3
            elif article.tier == ArticleTier.T2:
                breaking_score += 2
            else:
                breaking_score += 1

            # Only keep articles with sufficient breaking score
            if breaking_score >= self.breaking_threshold:
                # Store breaking_score in quality_score temporarily
                # (will be properly stored in Article model if extended)
                article.quality_score = float(breaking_score)  # Store as quality_score for now
                breaking_articles.append(article)

        return breaking_articles

    def _score_news_impact(self, articles: List[Article]) -> List[Article]:
        """
        Score articles for NEWS IMPACT.

        Scoring factors:
        - Content length (0.0-0.2): Complete news articles
        - Source tier (0.0-0.3): Credible sources
        - Breaking score (0.0-0.3): Breaking news importance
        - Category keywords (0.0-0.2): Relevant news
        - Freshness (0.0-0.3): Very recent news

        Total: 0.0-1.1 (normalized to 0.0-1.0)
        """
        scored_articles = []

        for article in articles:
            score = 0.0

            # Factor 1: Content length (0.0-0.2)
            if article.word_count > 500:
                score += 0.2
            elif article.word_count > 300:
                score += 0.1

            # Factor 2: Source tier (0.0-0.3)
            if article.tier == ArticleTier.T1:
                score += 0.3
            elif article.tier == ArticleTier.T2:
                score += 0.2
            else:
                score += 0.1

            # Factor 3: Breaking score (stored in quality_score from previous step)
            breaking_score = int(article.quality_score)
            score += min(breaking_score * 0.1, 0.3)

            # Factor 4: Category news keywords (0.0-0.2)
            news_keywords = self._get_news_keywords(article.category)
            title_lower = article.title.lower()
            content_lower = article.content.lower()
            keyword_matches = sum(1 for kw in news_keywords if kw.lower() in title_lower or kw.lower() in content_lower)
            score += min(keyword_matches * 0.1, 0.2)

            # Factor 5: Freshness (0.0-0.3) - MOST IMPORTANT for news
            hours_old = (datetime.now() - article.published_date).total_seconds() / 3600
            if hours_old < 6:
                score += 0.3
            elif hours_old < 24:
                score += 0.2
            elif hours_old < 48:
                score += 0.1

            # Normalize and store
            normalized_score = min(score / 1.1, 1.0)

            # Store both scores as attributes (if Article model supports)
            # For now, store news_score in quality_score
            # and keep breaking_score in a custom attribute
            article.quality_score = round(normalized_score, 3)

            scored_articles.append(article)

        return scored_articles

    def _get_news_keywords(self, category: str) -> List[str]:
        """Get news-specific keywords for category"""
        news_keywords_map = {
            'visa_immigration': ['visa changes', 'immigration policy', 'passport requirements', 'new visa', 'visa announcement'],
            'business_setup': ['business news', 'investment news', 'company registration', 'new business law', 'business announcement'],
            'tax': ['tax changes', 'tax news', 'new tax', 'tax policy', 'tax announcement'],
            'property_law': ['property news', 'real estate news', 'property market', 'housing prices', 'property law change'],
            'health_safety': ['health news', 'medical news', 'hospital', 'health policy', 'health alert'],
            'employment_law': ['job news', 'employment news', 'labor law', 'work policy', 'employment announcement'],
            'banking_finance': ['banking news', 'financial news', 'banking policy', 'interest rate', 'financial announcement'],
            'regulatory_changes': ['regulation news', 'new regulation', 'policy change', 'law change', 'regulatory announcement'],
            'transport_connectivity': ['transport news', 'traffic news', 'transport policy', 'infrastructure news', 'transport announcement'],
            'macro_policy': ['policy news', 'government news', 'economic policy', 'minister announces', 'policy change'],
            'competitor_intel': ['company news', 'market news', 'business move', 'competitor announcement', 'industry news'],
            'lifestyle': ['lifestyle news', 'expat news', 'community news', 'social news', 'living news'],
            'events_networking': ['event news', 'conference announcement', 'event announcement', 'networking news'],
            'social_media': ['social media news', 'platform news', 'digital news', 'social announcement'],
            'ai_tech': ['tech news', 'ai announcement', 'technology news', 'ai breakthrough', 'tech launch'],
            'dev_code': ['development news', 'coding news', 'software news', 'framework announcement', 'release announcement'],
            'future_trends': ['trend news', 'innovation news', 'emerging technology', 'future announcement', 'prediction'],
            'news': ['breaking news', 'latest news', 'news update', 'just announced', 'news alert'],
            'jobs': ['job announcement', 'hiring news', 'recruitment news', 'job market', 'employment news']
        }

        return news_keywords_map.get(category, [])

    def _final_news_filter(self, articles: List[Article]) -> List[Article]:
        """
        Final filter by news_threshold and breaking_threshold.

        Requirements:
        - news_score >= news_threshold (0.7)
        - breaking_score >= breaking_threshold (2)
        """
        filtered = []

        for article in articles:
            news_score = article.quality_score  # Stored from _score_news_impact
            # Note: breaking_score would need to be retrieved from article if we stored it

            # Check news threshold
            if news_score < self.news_threshold:
                continue

            filtered.append(article)

        return filtered

    def _update_stats(self, articles: List[Article]):
        """Update filter statistics"""
        if articles:
            total_score = sum(a.quality_score for a in articles)
            self.stats['avg_news_score'] = round(total_score / len(articles), 3)

    def get_stats(self) -> Dict[str, Any]:
        """Get filter statistics"""
        return self.stats.copy()

    def reset_stats(self):
        """Reset statistics"""
        self.stats = {
            'total_processed': 0,
            'news_only': 0,
            'breaking_news': 0,
            'passed_threshold': 0,
            'filtered_procedures': 0,
            'filtered_generic': 0,
            'filtered_no_news': 0,
            'avg_news_score': 0.0,
            'avg_breaking_score': 0.0
        }


# Convenience function for legacy compatibility
def filter_real_news(articles: List[Dict]) -> List[Dict]:
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
    news_filter = NewsIntelligentFilter()
    filtered_articles = news_filter.filter_real_news(article_objects)

    # Convert back to dicts
    return [art.dict() for art in filtered_articles]


if __name__ == "__main__":
    # Test news filter
    from datetime import datetime, timedelta

    print("=" * 60)
    print("Testing NewsIntelligentFilter")
    print("=" * 60)

    # Create test articles
    test_articles = [
        Article(
            url="https://example.com/news1",
            title="Breaking: Major Policy Change Announced Today",
            content="Government just announced significant changes to immigration policy. This breaking news affects thousands. " * 50,
            published_date=datetime.now() - timedelta(hours=2),
            source="National News",
            category="visa_immigration",
            tier=ArticleTier.T1,
            word_count=600
        ),
        Article(
            url="https://example.com/guide1",
            title="How to Apply for a Visa: Step by Step Guide",
            content="This is a tutorial on the process for visa application. Follow these steps to apply. " * 30,
            published_date=datetime.now() - timedelta(days=5),
            source="Guide Website",
            category="visa_immigration",
            tier=ArticleTier.T3,
            word_count=300
        ),
        Article(
            url="https://example.com/news2",
            title="Tax Reform Announced Yesterday",
            content="Major tax changes reported yesterday affecting all businesses. This significant update changes taxation. " * 40,
            published_date=datetime.now() - timedelta(hours=18),
            source="Business News",
            category="tax",
            tier=ArticleTier.T2,
            word_count=500
        ),
        Article(
            url="https://example.com/generic1",
            title="Overview of Immigration System",
            content="An introduction to the general principles of immigration. Basic information about immigration. " * 20,
            published_date=datetime.now() - timedelta(days=10),
            source="Info Site",
            category="visa_immigration",
            tier=ArticleTier.T3,
            word_count=200
        ),
    ]

    # Test filter
    news_filter = NewsIntelligentFilter(news_threshold=0.6, breaking_threshold=2)
    filtered = news_filter.filter_real_news(test_articles)

    print(f"\n✅ Results:")
    print(f"   Input: {len(test_articles)} articles")
    print(f"   Output: {len(filtered)} real news articles")

    print(f"\n📰 Article Analysis:")
    for article in test_articles:
        print(f"   {article.title[:60]}...")
        print(f"   → Score: {article.quality_score:.3f} | Tier: {article.tier} | Age: {(datetime.now() - article.published_date).total_seconds() / 3600:.1f}h")
        print(f"   → {'✅ PASSED (REAL NEWS)' if article in filtered else '❌ FILTERED'}")
        print()

    stats = news_filter.get_stats()
    print(f"📊 Statistics:")
    print(f"   Total processed: {stats['total_processed']}")
    print(f"   News only: {stats['news_only']}")
    print(f"   Breaking news: {stats['breaking_news']}")
    print(f"   Passed threshold: {stats['passed_threshold']}")
    print(f"   Filtered procedures: {stats['filtered_procedures']}")
    print(f"   Filtered generic: {stats['filtered_generic']}")
    print(f"   Filtered no news: {stats['filtered_no_news']}")
    print(f"   Avg news score: {stats['avg_news_score']:.3f}")

    print("=" * 60)

"""
Source Registry - Dynamic source loading from all_sources.json
Manages 457+ sources across 20 categories
"""

import json
from pathlib import Path
from typing import List, Dict, Optional, Set
from dataclasses import dataclass
from enum import Enum

from ..models.scraped_content import Source, SourceTier, ContentType


class SourcePriority(str, Enum):
    """Source priority level"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class SourceFilter:
    """Filter criteria for sources"""
    categories: Optional[List[str]] = None
    tiers: Optional[List[SourceTier]] = None
    priorities: Optional[List[SourcePriority]] = None
    enabled_only: bool = True
    max_sources: Optional[int] = None


class SourceRegistry:
    """
    Central registry for all 457+ scraped sources

    Features:
    - Load from all_sources.json
    - Filter by category, tier, priority
    - Enable/disable sources dynamically
    - Priority-based source selection

    Example:
        registry = SourceRegistry()

        # Get all tax sources (official only)
        tax_sources = registry.get_sources(
            category="tax",
            tier=SourceTier.OFFICIAL
        )

        # Get top 10 critical news sources
        news_sources = registry.get_sources(
            category="news",
            priority=SourcePriority.CRITICAL,
            max_sources=10
        )
    """

    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "all_sources.json"

        self.config_path = Path(config_path)
        self.raw_data: Dict = {}
        self.sources_db: List[Dict] = []
        self.enabled_sources: Set[str] = set()  # URLs of enabled sources

        self._load_sources()

    def _load_sources(self):
        """Load sources from JSON config"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Source config not found: {self.config_path}")

        with open(self.config_path, 'r', encoding='utf-8') as f:
            self.raw_data = json.load(f)

        self.sources_db = self.raw_data.get('sources', [])

        # By default, enable all CRITICAL and HIGH priority sources
        for source in self.sources_db:
            priority = source.get('priority', 'medium')
            if priority in ['critical', 'high']:
                self.enabled_sources.add(source['url'])

    def get_sources(
        self,
        category: Optional[str] = None,
        tier: Optional[SourceTier] = None,
        priority: Optional[SourcePriority] = None,
        enabled_only: bool = True,
        max_sources: Optional[int] = None,
        requires_js: Optional[bool] = None
    ) -> List[Source]:
        """
        Get filtered sources

        Args:
            category: Filter by category (e.g., "tax", "immigration")
            tier: Filter by tier (OFFICIAL, ACCREDITED, COMMUNITY)
            priority: Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)
            enabled_only: Only return enabled sources
            max_sources: Limit number of sources returned
            requires_js: Filter by JS requirement

        Returns:
            List of Source objects matching criteria
        """
        filtered = self.sources_db

        # Apply filters
        if category:
            filtered = [s for s in filtered if s.get('category') == category]

        if tier:
            filtered = [s for s in filtered if s.get('tier') == tier.value]

        if priority:
            filtered = [s for s in filtered if s.get('priority') == priority.value]

        if enabled_only:
            filtered = [s for s in filtered if s['url'] in self.enabled_sources]

        if requires_js is not None:
            filtered = [s for s in filtered if s.get('requires_js') == requires_js]

        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        filtered = sorted(
            filtered,
            key=lambda s: priority_order.get(s.get('priority', 'medium'), 2)
        )

        # Limit results
        if max_sources:
            filtered = filtered[:max_sources]

        # Convert to Source objects
        return [self._dict_to_source(s) for s in filtered]

    def _dict_to_source(self, source_dict: Dict) -> Source:
        """Convert dict to Source object"""
        # Map category to ContentType
        category_map = {
            'news': ContentType.NEWS,
            'tax': ContentType.TAX,
            'immigration': ContentType.IMMIGRATION,
            'realestate': ContentType.PROPERTY,
            'property': ContentType.PROPERTY,
            'regulatory': ContentType.REGULATION,
        }

        category = category_map.get(
            source_dict.get('category', 'general'),
            ContentType.GENERAL
        )

        # Map tier
        tier_map = {
            'official': SourceTier.OFFICIAL,
            'accredited': SourceTier.ACCREDITED,
            'community': SourceTier.COMMUNITY
        }
        tier = tier_map.get(source_dict.get('tier', 'accredited'), SourceTier.ACCREDITED)

        return Source(
            name=source_dict['name'],
            url=source_dict['url'],
            tier=tier,
            category=category,
            selectors=self._get_default_selectors(source_dict['url']),
            requires_js=source_dict.get('requires_js', False),
            metadata={
                'description': source_dict.get('description', ''),
                'section': source_dict.get('section', ''),
                'priority': source_dict.get('priority', 'medium')
            }
        )

    def _get_default_selectors(self, url: str) -> List[str]:
        """Get default CSS selectors based on URL"""
        # Common selector patterns
        if 'kompas.com' in url:
            return ['article', 'div.article__content']
        elif 'detik.com' in url:
            return ['article', 'div.detail__body']
        elif 'tempo.co' in url:
            return ['article', 'div.detail-content']
        elif 'pajak.go.id' in url or '.go.id' in url:
            return ['article', 'div.content', 'div.news-item']
        elif 'thejakartapost.com' in url:
            return ['article.post', 'div.post-content']
        else:
            return ['article', 'div.content', 'div.post', 'div.news-item']

    def enable_source(self, url: str):
        """Enable a source by URL"""
        self.enabled_sources.add(url)

    def disable_source(self, url: str):
        """Disable a source by URL"""
        self.enabled_sources.discard(url)

    def enable_category(self, category: str):
        """Enable all sources in a category"""
        for source in self.sources_db:
            if source.get('category') == category:
                self.enabled_sources.add(source['url'])

    def disable_category(self, category: str):
        """Disable all sources in a category"""
        for source in self.sources_db:
            if source.get('category') == category:
                self.enabled_sources.discard(source['url'])

    def enable_tier(self, tier: SourceTier):
        """Enable all sources of a tier"""
        for source in self.sources_db:
            if source.get('tier') == tier.value:
                self.enabled_sources.add(source['url'])

    def enable_priority(self, priority: SourcePriority):
        """Enable all sources of a priority level"""
        for source in self.sources_db:
            if source.get('priority') == priority.value:
                self.enabled_sources.add(source['url'])

    def get_stats(self) -> Dict:
        """Get registry statistics"""
        total = len(self.sources_db)
        enabled = len(self.enabled_sources)

        return {
            'total_sources': total,
            'enabled_sources': enabled,
            'disabled_sources': total - enabled,
            'by_category': self._count_by_field('category'),
            'by_tier': self._count_by_field('tier'),
            'by_priority': self._count_by_field('priority'),
            'enabled_by_category': self._count_enabled_by_field('category'),
            'enabled_by_tier': self._count_enabled_by_field('tier'),
        }

    def _count_by_field(self, field: str) -> Dict[str, int]:
        """Count sources by field"""
        counts = {}
        for source in self.sources_db:
            value = source.get(field, 'unknown')
            counts[value] = counts.get(value, 0) + 1
        return counts

    def _count_enabled_by_field(self, field: str) -> Dict[str, int]:
        """Count enabled sources by field"""
        counts = {}
        for source in self.sources_db:
            if source['url'] in self.enabled_sources:
                value = source.get(field, 'unknown')
                counts[value] = counts.get(value, 0) + 1
        return counts

    def get_categories(self) -> List[str]:
        """Get list of all categories"""
        return sorted(set(s.get('category') for s in self.sources_db))

    def search_sources(self, query: str) -> List[Source]:
        """Search sources by name or description"""
        query = query.lower()
        results = []

        for source in self.sources_db:
            if query in source.get('name', '').lower() or \
               query in source.get('description', '').lower():
                results.append(self._dict_to_source(source))

        return results


# Global registry instance
_registry_instance: Optional[SourceRegistry] = None


def get_registry() -> SourceRegistry:
    """Get global source registry instance (singleton)"""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = SourceRegistry()
    return _registry_instance


# Example usage
if __name__ == "__main__":
    registry = SourceRegistry()

    print("📊 Source Registry Stats:")
    stats = registry.get_stats()
    print(f"   Total: {stats['total_sources']}")
    print(f"   Enabled: {stats['enabled_sources']}")

    print("\n📁 Categories:")
    for cat, count in sorted(stats['by_category'].items()):
        enabled = stats['enabled_by_category'].get(cat, 0)
        print(f"   {cat:20} : {count:3} total ({enabled:3} enabled)")

    print("\n🎯 Tax Sources (Official only):")
    tax_sources = registry.get_sources(category='tax', tier=SourceTier.OFFICIAL)
    for source in tax_sources[:5]:
        print(f"   ✅ {source.name}")
        print(f"      {source.url}")

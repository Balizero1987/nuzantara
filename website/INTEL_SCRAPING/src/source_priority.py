#!/usr/bin/env python3
"""
Source Priority and Fallback System
Handles source selection based on priority and availability
"""
import json
from pathlib import Path
from typing import Dict, List, Optional

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_DIR = PROJECT_ROOT / "config" / "sources"
PRIORITY_CONFIG = CONFIG_DIR / "source_priority.json"


class SourcePriorityManager:
    """Manage source priorities and fallbacks"""

    def __init__(self, config_file: Optional[Path] = None):
        self.config_file = config_file or PRIORITY_CONFIG
        self.config = self._load_config()

    def _load_config(self) -> Dict:
        """Load priority configuration from file"""
        if not self.config_file.exists():
            return {"categories": {}}

        try:
            return json.loads(self.config_file.read_text(encoding='utf-8'))
        except Exception as e:
            print(f"⚠️  Could not load priority config: {e}")
            return {"categories": {}}

    def get_sources_for_category(
        self,
        category: str,
        priority_level: Optional[str] = None
    ) -> List[str]:
        """Get sources for category at given priority level

        Args:
            category: Category name
            priority_level: Priority level (primary, secondary, fallback)
                          If None, returns all sources in priority order

        Returns:
            List of source URLs
        """
        cat_config = self.config.get("categories", {}).get(category)

        if not cat_config:
            return []

        sources = cat_config.get("sources", {})

        if priority_level:
            # Return specific priority level
            return sources.get(priority_level, [])

        # Return all sources in priority order
        priority_order = cat_config.get("priority_order", ["primary", "secondary", "fallback"])
        all_sources = []

        for level in priority_order:
            all_sources.extend(sources.get(level, []))

        return all_sources

    def get_next_priority_level(
        self,
        category: str,
        current_level: str
    ) -> Optional[str]:
        """Get next priority level for fallback

        Args:
            category: Category name
            current_level: Current priority level

        Returns:
            Next priority level or None if no fallback available
        """
        cat_config = self.config.get("categories", {}).get(category)

        if not cat_config:
            return None

        priority_order = cat_config.get("priority_order", ["primary", "secondary", "fallback"])

        try:
            current_idx = priority_order.index(current_level)
            if current_idx + 1 < len(priority_order):
                return priority_order[current_idx + 1]
        except ValueError:
            pass

        return None

    def get_source_priority(self, category: str, source_url: str) -> Optional[str]:
        """Get priority level of a source

        Args:
            category: Category name
            source_url: Source URL

        Returns:
            Priority level or None if source not found
        """
        cat_config = self.config.get("categories", {}).get(category)

        if not cat_config:
            return None

        sources = cat_config.get("sources", {})

        for level, urls in sources.items():
            if source_url in urls:
                return level

        return None

    def get_report(self) -> str:
        """Generate source priority report

        Returns:
            Formatted report
        """
        lines = ["📊 Source Priority Configuration", "=" * 60]

        categories = self.config.get("categories", {})

        if not categories:
            lines.append("⚠️  No categories configured")
            return "\n".join(lines)

        for category, cat_config in categories.items():
            lines.append(f"\n📁 {category.upper()}")
            lines.append("-" * 60)

            priority_order = cat_config.get("priority_order", [])
            sources = cat_config.get("sources", {})

            for level in priority_order:
                level_sources = sources.get(level, [])
                lines.append(f"  {level.upper()}: {len(level_sources)} sources")

                for source in level_sources:
                    lines.append(f"    • {source[:60]}")

        lines.append("=" * 60)

        return "\n".join(lines)


# Module-level convenience functions
_manager = None

def get_manager() -> SourcePriorityManager:
    """Get global source priority manager instance"""
    global _manager
    if _manager is None:
        _manager = SourcePriorityManager()
    return _manager


def get_sources_for_category(
    category: str,
    priority_level: Optional[str] = None
) -> List[str]:
    """Get sources for category (convenience function)"""
    return get_manager().get_sources_for_category(category, priority_level)


if __name__ == '__main__':
    # Test source priority system
    manager = SourcePriorityManager()
    print(manager.get_report())

    # Test getting sources
    print("\n\nTesting source retrieval:")
    print("=" * 60)

    business_primary = manager.get_sources_for_category("business", "primary")
    print(f"Business (primary): {business_primary}")

    business_all = manager.get_sources_for_category("business")
    print(f"Business (all): {business_all}")

    next_level = manager.get_next_priority_level("business", "primary")
    print(f"Next after primary: {next_level}")

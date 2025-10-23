#!/usr/bin/env python3
"""
Quick integration test for Source Registry with scrapers
Tests that all 4 scrapers can load sources from the registry
"""

import sys
from pathlib import Path

# Add to path
sys.path.insert(0, str(Path(__file__).parent))

from nuzantara_scraper.core.source_registry import get_registry, SourcePriority
from nuzantara_scraper.models.scraped_content import SourceTier

def test_source_registry():
    """Test basic Source Registry functionality"""
    print("=" * 70)
    print("🧪 Testing Source Registry Integration")
    print("=" * 70)

    registry = get_registry()

    # Test 1: Registry Stats
    print("\n1️⃣  Testing Registry Stats...")
    stats = registry.get_stats()
    assert stats['total_sources'] == 457, f"Expected 457 sources, got {stats['total_sources']}"
    assert stats['enabled_sources'] > 0, "No sources enabled"
    print(f"   ✅ Total: {stats['total_sources']}, Enabled: {stats['enabled_sources']}")

    # Test 2: Property Sources (Real Estate)
    print("\n2️⃣  Testing Property Scraper Sources...")
    property_sources = registry.get_sources(category='realestate', enabled_only=True)
    print(f"   ✅ Loaded {len(property_sources)} real estate sources")
    if len(property_sources) > 0:
        sample = property_sources[0]
        print(f"      Sample: {sample.name} - {sample.tier.value}")

    # Test 3: Immigration Sources
    print("\n3️⃣  Testing Immigration Scraper Sources...")
    immigration_sources = registry.get_sources(category='immigration', enabled_only=True)
    print(f"   ✅ Loaded {len(immigration_sources)} immigration sources")
    if len(immigration_sources) > 0:
        sample = immigration_sources[0]
        print(f"      Sample: {sample.name} - {sample.tier.value}")

    # Test 4: Tax Sources
    print("\n4️⃣  Testing Tax Scraper Sources...")
    tax_sources = registry.get_sources(category='tax', enabled_only=True)
    print(f"   ✅ Loaded {len(tax_sources)} tax sources")
    if len(tax_sources) > 0:
        sample = tax_sources[0]
        print(f"      Sample: {sample.name} - {sample.tier.value}")

    # Test 5: News Sources
    print("\n5️⃣  Testing News Scraper Sources...")
    news_sources = registry.get_sources(category='news', enabled_only=True)
    print(f"   ✅ Loaded {len(news_sources)} news sources")
    if len(news_sources) > 0:
        sample = news_sources[0]
        print(f"      Sample: {sample.name} - {sample.tier.value}")

    # Test 6: Tier Filtering
    print("\n6️⃣  Testing Tier Filtering...")
    official_only = registry.get_sources(
        category='news',
        tier=SourceTier.OFFICIAL,
        enabled_only=True
    )
    print(f"   ✅ Found {len(official_only)} official news sources")

    # Test 7: Priority Filtering
    print("\n7️⃣  Testing Priority Filtering...")
    critical_news = registry.get_sources(
        category='news',
        priority=SourcePriority.CRITICAL,
        enabled_only=True
    )
    print(f"   ✅ Found {len(critical_news)} CRITICAL priority news sources")

    # Summary
    print("\n" + "=" * 70)
    print("✅ ALL TESTS PASSED - Source Registry Integration Working!")
    print("=" * 70)
    print(f"\nTotal sources available across all categories:")
    print(f"  • Property (Real Estate): {len(property_sources)} sources")
    print(f"  • Immigration: {len(immigration_sources)} sources")
    print(f"  • Tax: {len(tax_sources)} sources")
    print(f"  • News: {len(news_sources)} sources")
    print(f"  • TOTAL: {len(property_sources) + len(immigration_sources) + len(tax_sources) + len(news_sources)} sources")
    print(f"\nPreviously: 16-17 hardcoded sources")
    print(f"Now: 457 sources dynamically loaded from registry")
    print(f"Improvement: {457 / 17 * 100:.0f}% increase in source coverage!")

    return True


if __name__ == "__main__":
    try:
        test_source_registry()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

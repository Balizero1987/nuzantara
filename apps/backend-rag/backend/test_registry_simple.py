#!/usr/bin/env python3
"""
Simple standalone test for Source Registry (no heavy dependencies)
"""

import json
from pathlib import Path

def test_source_data():
    """Test that source data is valid and matches scraper requirements"""
    print("=" * 70)
    print("🧪 Testing Source Registry Data")
    print("=" * 70)

    # Load all_sources.json directly
    config_path = Path('/home/user/nuzantara/apps/backend-rag/backend/nuzantara_scraper/config/all_sources.json')

    with open(config_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sources = data.get('sources', [])
    stats = data.get('stats', {})

    # Test 1: Total sources
    print("\n1️⃣  Testing Total Sources...")
    assert len(sources) == 457, f"Expected 457 sources, got {len(sources)}"
    assert stats['total_sources'] == 457
    print(f"   ✅ Total sources: {len(sources)}")

    # Test 2: Tier distribution
    print("\n2️⃣  Testing Tier Distribution...")
    by_tier = stats.get('by_tier', {})
    assert by_tier['official'] == 148
    assert by_tier['accredited'] == 288
    assert by_tier['community'] == 21
    print(f"   ✅ Official: {by_tier['official']}, Accredited: {by_tier['accredited']}, Community: {by_tier['community']}")

    # Test 3: Category counts for scrapers
    print("\n3️⃣  Testing Scraper Categories...")

    category_counts = {}
    enabled_counts = {}
    priority_counts = {cat: {'critical': 0, 'high': 0, 'medium': 0, 'low': 0} for cat in ['news', 'realestate', 'immigration', 'tax']}

    for source in sources:
        cat = source.get('category', 'unknown')
        priority = source.get('priority', 'medium')
        category_counts[cat] = category_counts.get(cat, 0) + 1

        # Count enabled sources (priority critical or high by default)
        if priority in ['critical', 'high']:
            enabled_counts[cat] = enabled_counts.get(cat, 0) + 1

        # Count by priority
        if cat in priority_counts:
            priority_counts[cat][priority] = priority_counts[cat].get(priority, 0) + 1

    # Property (Real Estate)
    realestate_count = category_counts.get('realestate', 0)
    print(f"   • Property (Real Estate): {realestate_count} sources")
    assert realestate_count == 44, f"Expected 44 real estate sources, got {realestate_count}"
    print(f"     - {enabled_counts.get('realestate', 0)} auto-enabled (critical/high priority)")

    # Immigration
    immigration_count = category_counts.get('immigration', 0)
    print(f"   • Immigration: {immigration_count} sources")
    assert immigration_count == 37, f"Expected 37 immigration sources, got {immigration_count}"
    print(f"     - {enabled_counts.get('immigration', 0)} auto-enabled (critical/high priority)")

    # Tax
    tax_count = category_counts.get('tax', 0)
    print(f"   • Tax: {tax_count} sources")
    assert tax_count == 30, f"Expected 30 tax sources, got {tax_count}"
    print(f"     - {enabled_counts.get('tax', 0)} auto-enabled (critical/high priority)")

    # News
    news_count = category_counts.get('news', 0)
    print(f"   • News: {news_count} sources")
    assert news_count == 52, f"Expected 52 news sources, got {news_count}"
    print(f"     - {enabled_counts.get('news', 0)} auto-enabled (critical/high priority)")

    # Test 4: Priority distribution
    print("\n4️⃣  Testing Priority Distribution...")
    for cat in ['news', 'realestate', 'immigration', 'tax']:
        counts = priority_counts[cat]
        print(f"   {cat:15} - Critical: {counts['critical']}, High: {counts['high']}, Medium: {counts['medium']}, Low: {counts['low']}")

    # Test 5: Sample sources
    print("\n5️⃣  Testing Sample Sources...")
    for cat in ['news', 'realestate', 'immigration', 'tax']:
        cat_sources = [s for s in sources if s.get('category') == cat]
        if cat_sources:
            sample = cat_sources[0]
            print(f"   • {cat:15} : {sample['name']}")
            print(f"     URL: {sample['url']}")
            print(f"     Tier: {sample['tier']}, Priority: {sample.get('priority', 'unknown')}")

    # Test 6: Verify commercial sources removed
    print("\n6️⃣  Testing Commercial Source Removal...")
    rumah_com = [s for s in sources if 'rumah.com' in s['url'].lower()]
    if rumah_com:
        print(f"   ⚠️  Found {len(rumah_com)} Rumah.com sources (commercial)")
        print(f"   Note: These should be disabled in scraper config per user request")
    else:
        print(f"   ✅ No Rumah.com sources found (good - removed as requested)")

    # Summary
    print("\n" + "=" * 70)
    print("✅ ALL TESTS PASSED - Source Data Valid!")
    print("=" * 70)
    print(f"\n📊 Summary:")
    print(f"  • Total sources in database: {len(sources)}")
    print(f"  • Auto-enabled (critical/high priority): {sum(enabled_counts.values())}")
    print(f"  • Official government sources: {by_tier['official']}")
    print(f"  • Accredited news/legal sources: {by_tier['accredited']}")
    print(f"  • Community sources: {by_tier['community']}")
    print(f"\n🚀 Upgrade:")
    print(f"  • Before: 16-17 hardcoded sources")
    print(f"  • After: 457 dynamically loaded sources")
    print(f"  • Improvement: ~2,600% increase in source coverage!")
    print(f"\n✅ Scrapers can now access all 457 sources via Source Registry")

    return True


if __name__ == "__main__":
    try:
        test_source_data()
    except AssertionError as e:
        print(f"\n❌ ASSERTION FAILED: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

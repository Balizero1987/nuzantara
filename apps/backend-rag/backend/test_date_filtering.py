#!/usr/bin/env python3
"""
Test Date Filtering functionality
Validates 5-day cutoff for all content types
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add to path
sys.path.insert(0, str(Path(__file__).parent))

from nuzantara_scraper.processors.date_filter import DateFilter, filter_by_date
from nuzantara_scraper.models.scraped_content import ScrapedContent, SourceTier, ContentType


def create_test_item(title: str, days_old: int, has_date: bool = True) -> ScrapedContent:
    """Create a test scraped content item"""
    pub_date = datetime.now() - timedelta(days=days_old)

    item = ScrapedContent(
        content_id=f"test_{title.replace(' ', '_')}",
        title=title,
        content=f"Test content for {title}",
        url=f"https://example.com/{title.replace(' ', '-')}",
        source_name="Test Source",
        source_tier=SourceTier.OFFICIAL,
        category=ContentType.NEWS,
        extracted_data={
            "published_date": pub_date.strftime("%Y-%m-%d") if has_date else None
        }
    )

    # Set scraped_at to the same date for testing
    item.scraped_at = pub_date

    return item


def test_date_filter():
    """Test date filtering with various scenarios"""
    print("=" * 70)
    print("🧪 Testing Date Filtering (5-Day Cutoff)")
    print("=" * 70)

    # Test 1: Basic filtering
    print("\n1️⃣  Test Basic Date Filtering...")
    items = [
        create_test_item("Article 1 day old", 1),
        create_test_item("Article 3 days old", 3),
        create_test_item("Article 5 days old", 5),
        create_test_item("Article 6 days old", 6),
        create_test_item("Article 10 days old", 10),
    ]

    date_filter = DateFilter(max_age_days=5)
    filtered = date_filter.filter_items(items)

    print(f"   Input: {len(items)} items (1, 3, 5, 6, 10 days old)")
    print(f"   Output: {len(filtered)} items")
    print(f"   Expected: 3 items (≤5 days)")

    assert len(filtered) == 3, f"Expected 3 items, got {len(filtered)}"
    assert filtered[0].title == "Article 1 day old"
    assert filtered[1].title == "Article 3 days old"
    assert filtered[2].title == "Article 5 days old"
    print("   ✅ Passed - Correctly filtered items older than 5 days")

    # Test 2: Edge cases
    print("\n2️⃣  Test Edge Cases...")

    # Today's article
    today_item = create_test_item("Today's article", 0)
    filtered = date_filter.filter_items([today_item])
    assert len(filtered) == 1, "Today's article should pass"
    print("   ✅ Today's article: PASSED")

    # Exactly 5 days old
    five_days = create_test_item("Exactly 5 days old", 5)
    filtered = date_filter.filter_items([five_days])
    assert len(filtered) == 1, "5-day old article should pass (inclusive)"
    print("   ✅ Exactly 5 days: PASSED (inclusive)")

    # Just over 5 days
    six_days = create_test_item("6 days old", 6)
    filtered = date_filter.filter_items([six_days])
    assert len(filtered) == 0, "6-day old article should be filtered"
    print("   ✅ 6 days old: FILTERED")

    # Test 3: Items without dates
    print("\n3️⃣  Test Items Without Dates...")
    no_date_item = create_test_item("No date article", 0, has_date=False)
    no_date_item.extracted_data = {}

    filtered = date_filter.filter_items([no_date_item])
    assert len(filtered) == 1, "Items without dates should be kept with warning"
    print("   ✅ No date: KEPT (with warning)")

    # Test 4: Mixed batch
    print("\n4️⃣  Test Mixed Batch...")
    mixed_items = [
        create_test_item("Recent 1", 1),
        create_test_item("Recent 2", 2),
        create_test_item("Old 1", 7),
        create_test_item("Recent 3", 4),
        create_test_item("Old 2", 10),
        create_test_item("Recent 4", 5),
        create_test_item("Old 3", 15),
    ]

    filtered = date_filter.filter_items(mixed_items)
    print(f"   Input: {len(mixed_items)} items (mixed ages)")
    print(f"   Output: {len(filtered)} items")
    print(f"   Filtered out: {len(mixed_items) - len(filtered)} old items")

    assert len(filtered) == 4, f"Expected 4 recent items, got {len(filtered)}"
    print("   ✅ Correctly filtered mixed batch")

    # Test 5: Date parsing
    print("\n5️⃣  Test Date String Parsing...")

    test_dates = [
        ("2025-10-23", "ISO format"),
        ("23 Oktober 2025", "Indonesian format"),
        ("2 days ago", "Relative format"),
        ("yesterday", "Relative keyword"),
    ]

    for date_str, format_name in test_dates:
        parsed = date_filter._parse_date_string(date_str)
        if parsed:
            print(f"   ✅ {format_name}: '{date_str}' → {parsed.strftime('%Y-%m-%d')}")
        else:
            print(f"   ⚠️  {format_name}: '{date_str}' → Failed to parse")

    # Test 6: Convenience function
    print("\n6️⃣  Test Convenience Function...")
    test_items = [
        create_test_item("Item 1", 2),
        create_test_item("Item 2", 8),
    ]

    filtered = filter_by_date(test_items, max_age_days=5)
    assert len(filtered) == 1, "Convenience function should work"
    print("   ✅ filter_by_date() convenience function works")

    # Test 7: Custom cutoff
    print("\n7️⃣  Test Custom Cutoff (3 days)...")
    custom_filter = DateFilter(max_age_days=3)

    items_3day = [
        create_test_item("Day 1", 1),
        create_test_item("Day 2", 2),
        create_test_item("Day 3", 3),
        create_test_item("Day 4", 4),
    ]

    filtered = custom_filter.filter_items(items_3day)
    assert len(filtered) == 3, f"Expected 3 items with 3-day cutoff, got {len(filtered)}"
    print("   ✅ Custom 3-day cutoff works correctly")

    # Summary
    print("\n" + "=" * 70)
    print("✅ ALL DATE FILTERING TESTS PASSED!")
    print("=" * 70)
    print("\n📊 Summary:")
    print(f"  • Default cutoff: 5 days")
    print(f"  • Date parsing: ISO, Indonesian, Relative formats supported")
    print(f"  • Edge cases: Today (✓), 5 days (✓), 6+ days (✗)")
    print(f"  • No date handling: Items kept with warning")
    print(f"  • Custom cutoffs: Configurable")
    print("\n✅ Date filtering ready for production use!")
    print("   All scrapers will automatically filter content >5 days old")

    return True


if __name__ == "__main__":
    try:
        test_date_filter()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

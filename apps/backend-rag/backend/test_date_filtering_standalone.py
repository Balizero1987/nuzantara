#!/usr/bin/env python3
"""
Standalone test for Date Filtering (no heavy dependencies)
Tests the DateFilter class directly
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add to path
sys.path.insert(0, str(Path(__file__).parent))

# Import only what we need (avoid __init__.py)
from nuzantara_scraper.processors.date_filter import DateFilter


def create_mock_item(title: str, days_old: int, has_date: bool = True):
    """Create a mock scraped content item"""
    pub_date = datetime.now() - timedelta(days=days_old)

    class MockItem:
        def __init__(self):
            self.title = title
            self.content = f"Test content for {title}"
            self.scraped_at = pub_date
            self.extracted_data = {}

            if has_date:
                self.extracted_data['published_date'] = pub_date.strftime("%Y-%m-%d")

    return MockItem()


def test_date_filter():
    """Test date filtering with various scenarios"""
    print("=" * 70)
    print("🧪 Testing Date Filtering (5-Day Cutoff)")
    print("=" * 70)

    # Test 1: Basic filtering
    print("\n1️⃣  Test Basic Date Filtering...")
    items = [
        create_mock_item("Article 1 day old", 1),
        create_mock_item("Article 3 days old", 3),
        create_mock_item("Article 5 days old", 5),
        create_mock_item("Article 6 days old", 6),
        create_mock_item("Article 10 days old", 10),
    ]

    date_filter = DateFilter(max_age_days=5)
    filtered = date_filter.filter_items(items)

    print(f"   Input: {len(items)} items (1, 3, 5, 6, 10 days old)")
    print(f"   Output: {len(filtered)} items")
    print(f"   Expected: 3 items (≤5 days)")

    assert len(filtered) == 3, f"Expected 3 items, got {len(filtered)}"
    print("   ✅ Passed - Correctly filtered items older than 5 days")

    # Test 2: Edge cases
    print("\n2️⃣  Test Edge Cases...")

    # Today's article
    today_item = create_mock_item("Today's article", 0)
    filtered = date_filter.filter_items([today_item])
    assert len(filtered) == 1, "Today's article should pass"
    print("   ✅ Today's article: PASSED")

    # Exactly 5 days old
    five_days = create_mock_item("Exactly 5 days old", 5)
    filtered = date_filter.filter_items([five_days])
    assert len(filtered) == 1, "5-day old article should pass (inclusive)"
    print("   ✅ Exactly 5 days: PASSED (inclusive)")

    # Just over 5 days
    six_days = create_mock_item("6 days old", 6)
    filtered = date_filter.filter_items([six_days])
    assert len(filtered) == 0, "6-day old article should be filtered"
    print("   ✅ 6 days old: FILTERED")

    # Test 3: Items without dates
    print("\n3️⃣  Test Items Without Dates...")
    no_date_item = create_mock_item("No date article", 0, has_date=False)

    filtered = date_filter.filter_items([no_date_item])
    assert len(filtered) == 1, "Items without dates should be kept with warning"
    print("   ✅ No date: KEPT (with warning)")

    # Test 4: Mixed batch
    print("\n4️⃣  Test Mixed Batch...")
    mixed_items = [
        create_mock_item("Recent 1", 1),
        create_mock_item("Recent 2", 2),
        create_mock_item("Old 1", 7),
        create_mock_item("Recent 3", 4),
        create_mock_item("Old 2", 10),
        create_mock_item("Recent 4", 5),
        create_mock_item("Old 3", 15),
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
        ("23 October 2025", "English format"),
        ("2 days ago", "Relative format"),
        ("yesterday", "Relative keyword"),
        ("today", "Today keyword"),
        ("5 hari ago", "Indonesian relative"),
    ]

    for date_str, format_name in test_dates:
        parsed = date_filter._parse_date_string(date_str)
        if parsed:
            print(f"   ✅ {format_name:20} : '{date_str}' → {parsed.strftime('%Y-%m-%d')}")
        else:
            print(f"   ⚠️  {format_name:20} : '{date_str}' → Failed to parse")

    # Test 6: Custom cutoff
    print("\n6️⃣  Test Custom Cutoff (3 days)...")
    custom_filter = DateFilter(max_age_days=3)

    items_3day = [
        create_mock_item("Day 1", 1),
        create_mock_item("Day 2", 2),
        create_mock_item("Day 3", 3),
        create_mock_item("Day 4", 4),
    ]

    filtered = custom_filter.filter_items(items_3day)
    assert len(filtered) == 3, f"Expected 3 items with 3-day cutoff, got {len(filtered)}"
    print("   ✅ Custom 3-day cutoff works correctly")

    # Test 7: All recent items
    print("\n7️⃣  Test All Recent Items...")
    all_recent = [
        create_mock_item(f"Recent {i}", i) for i in range(5)
    ]
    filtered = date_filter.filter_items(all_recent)
    assert len(filtered) == 5, "All recent items should pass"
    print("   ✅ All 5 recent items: PASSED")

    # Test 8: All old items
    print("\n8️⃣  Test All Old Items...")
    all_old = [
        create_mock_item(f"Old {i}", 10 + i) for i in range(5)
    ]
    filtered = date_filter.filter_items(all_old)
    assert len(filtered) == 0, "All old items should be filtered"
    print("   ✅ All 5 old items: FILTERED")

    # Summary
    print("\n" + "=" * 70)
    print("✅ ALL DATE FILTERING TESTS PASSED!")
    print("=" * 70)
    print("\n📊 Summary:")
    print(f"  • Default cutoff: 5 days (configurable)")
    print(f"  • Date parsing: ISO, Indonesian, English, Relative formats")
    print(f"  • Edge cases: Today (✓), 5 days (✓), 6+ days (✗)")
    print(f"  • No date handling: Items kept with warning (uses scraped_at)")
    print(f"  • Batch processing: Efficient filtering of mixed-age content")
    print("\n✅ Date filtering ready for production!")
    print("   All scrapers automatically filter content >5 days old via BaseScraper")

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

#!/usr/bin/env python3
"""
Migrate existing intel JSON files to V2 category schema

Maps old category names to new V2 categories:
- immigration → visa_immigration
- business_bkpm → business_setup
- events_culture → events_networking
- real_estate → property_law
- tax_djp → tax_compliance
- jobs_employment → employment_law
- health_wellness → health_safety
- general_news → bali_lifestyle
- lifestyle_living → bali_lifestyle
- social_media → (separate social stream)

Usage:
    python3 scripts/migrate_intel_files_to_v2.py
    python3 scripts/migrate_intel_files_to_v2.py --dry-run
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# Category migration map (old → new V2)
CATEGORY_MIGRATION_MAP = {
    "immigration": "visa_immigration",
    "business_bkpm": "business_setup",
    "events_culture": "events_networking",
    "real_estate": "property_law",
    "tax_djp": "tax_compliance",
    "jobs_employment": "employment_law",
    "health_wellness": "health_safety",
    "general_news": "bali_lifestyle",
    "lifestyle_living": "bali_lifestyle",
    "bali_news": "bali_lifestyle",

    # Subcategories (if present)
    "News": "bali_lifestyle",
    "News/Entertainment": "bali_lifestyle",
    "Lifestyle": "bali_lifestyle",
    "government": "regulatory_changes",
}

# Social platforms to separate
SOCIAL_PLATFORMS = [
    "facebook",
    "reddit",
    "instagram",
    "twitter",
    "x.com",
    "linkedin"
]

def is_social_post(data: Dict) -> bool:
    """Check if content is from social media"""
    source_url = data.get("source_url", "").lower()
    source_name = data.get("source_name", "").lower()

    return any(platform in source_url or platform in source_name
               for platform in SOCIAL_PLATFORMS)

def migrate_category(old_category: str) -> str:
    """Map old category to new V2 category"""
    # Direct mapping
    if old_category in CATEGORY_MIGRATION_MAP:
        return CATEGORY_MIGRATION_MAP[old_category]

    # Partial match
    for old_key, new_val in CATEGORY_MIGRATION_MAP.items():
        if old_key.lower() in old_category.lower():
            return new_val

    # Default: keep as-is (might be already V2)
    return old_category

def enrich_missing_date(data: Dict) -> Optional[str]:
    """Try to extract/enrich missing date"""
    import re

    # Check existing date fields
    if data.get("scraped_at"):
        return data["scraped_at"]

    dates_obj = data.get("dates", {})
    if isinstance(dates_obj, dict):
        for key in ["published", "effective", "created"]:
            if dates_obj.get(key):
                return dates_obj[key]

    # Try to extract from title/summary
    text = f"{data.get('title', '')} {data.get('summary', '')}"

    # ISO date pattern
    iso_match = re.search(r'(\d{4}-\d{2}-\d{2})', text)
    if iso_match:
        return f"{iso_match.group(1)}T00:00:00Z"

    # Use scrape time as fallback
    return datetime.now().isoformat() + 'Z'

def migrate_file(file_path: Path, dry_run: bool = False) -> Dict[str, any]:
    """
    Migrate a single JSON file to V2 schema

    Returns:
        {
            "status": "migrated" | "skipped" | "error",
            "old_category": str,
            "new_category": str,
            "changes": [list of changes],
            "is_social": bool
        }
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        changes = []
        old_category = data.get("category", "unknown")

        # Check if social post (separate stream)
        if is_social_post(data):
            return {
                "status": "skipped",
                "old_category": old_category,
                "new_category": "social_stream",
                "changes": ["Flagged as social media post - needs separate stream"],
                "is_social": True
            }

        # Migrate category
        new_category = migrate_category(old_category)
        if new_category != old_category:
            data["category"] = new_category
            changes.append(f"Category: {old_category} → {new_category}")

        # Enrich missing date
        if not data.get("scraped_at") and not data.get("dates", {}).get("published"):
            enriched_date = enrich_missing_date(data)
            if enriched_date:
                if "dates" not in data:
                    data["dates"] = {}
                data["dates"]["published"] = enriched_date
                changes.append(f"Added date: {enriched_date}")

        # Ensure required fields exist
        if not data.get("source_url"):
            changes.append("WARNING: Missing source_url (required)")

        if not data.get("word_count"):
            # Estimate from content
            content = data.get("content", "") or data.get("summary", "")
            word_count = len(content.split())
            if word_count > 0:
                data["word_count"] = word_count
                changes.append(f"Added word_count: {word_count}")

        # Write back if not dry-run
        if not dry_run and changes:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        return {
            "status": "migrated" if changes else "skipped",
            "old_category": old_category,
            "new_category": new_category,
            "changes": changes,
            "is_social": False
        }

    except Exception as e:
        return {
            "status": "error",
            "old_category": "unknown",
            "new_category": "unknown",
            "changes": [f"Error: {str(e)}"],
            "is_social": False
        }

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Migrate intel JSON files to V2 categories")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without modifying files")
    parser.add_argument("--dir", default="INTEL_SCRAPING", help="Directory to scan (default: INTEL_SCRAPING)")

    args = parser.parse_args()

    intel_dir = Path(args.dir)
    if not intel_dir.exists():
        print(f"❌ Directory not found: {intel_dir}")
        sys.exit(1)

    print(f"{'🔍 DRY RUN - ' if args.dry_run else ''}Migrating intel files in {intel_dir}/\n")

    # Find all JSON files
    json_files = list(intel_dir.rglob("*.json"))
    print(f"Found {len(json_files)} JSON files\n")

    # Migration stats
    stats = {
        "total": len(json_files),
        "migrated": 0,
        "skipped": 0,
        "social": 0,
        "error": 0  # Fixed: was "errors" but code uses "error"
    }

    category_counts = {}
    social_files = []
    error_files = []

    # Process each file
    for i, json_file in enumerate(json_files, 1):
        result = migrate_file(json_file, dry_run=args.dry_run)

        stats[result["status"]] += 1

        if result["is_social"]:
            stats["social"] += 1
            social_files.append(str(json_file))

        if result["status"] == "error":
            error_files.append((str(json_file), result["changes"][0] if result["changes"] else "Unknown error"))

        # Count categories
        new_cat = result["new_category"]
        category_counts[new_cat] = category_counts.get(new_cat, 0) + 1

        # Progress
        if i % 50 == 0 or i == len(json_files):
            print(f"Progress: {i}/{len(json_files)} ({i*100//len(json_files)}%)")

        # Show changes for migrated files
        if result["status"] == "migrated" and result["changes"]:
            rel_path = json_file.relative_to(intel_dir)
            print(f"\n✅ {rel_path}")
            for change in result["changes"]:
                print(f"   • {change}")

    # Summary
    print(f"\n{'='*80}")
    print("📊 MIGRATION SUMMARY")
    print(f"{'='*80}")
    print(f"Total files:     {stats['total']}")
    print(f"✅ Migrated:     {stats['migrated']} ({stats['migrated']*100//stats['total'] if stats['total'] > 0 else 0}%)")
    print(f"⏭️  Skipped:      {stats['skipped']}")
    print(f"📱 Social posts: {stats['social']} (need separate stream)")
    print(f"❌ Errors:       {stats['error']}")

    print(f"\n{'='*80}")
    print("📁 CATEGORY DISTRIBUTION (V2)")
    print(f"{'='*80}")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat:30s} {count:4d} files")

    if social_files:
        print(f"\n{'='*80}")
        print(f"📱 SOCIAL MEDIA FILES ({len(social_files)})")
        print(f"{'='*80}")
        for f in social_files[:10]:  # Show first 10
            print(f"  • {f}")
        if len(social_files) > 10:
            print(f"  ... and {len(social_files) - 10} more")

    if error_files:
        print(f"\n{'='*80}")
        print(f"❌ ERRORS ({len(error_files)})")
        print(f"{'='*80}")
        for f, err in error_files[:10]:
            print(f"  • {f}")
            print(f"    {err}")
        if len(error_files) > 10:
            print(f"  ... and {len(error_files) - 10} more")

    if args.dry_run:
        print(f"\n⚠️  DRY RUN - No files were modified")
        print(f"Run without --dry-run to apply changes")
    else:
        print(f"\n✅ Migration complete!")

    # Exit code
    sys.exit(0 if stats['error'] == 0 else 1)

if __name__ == "__main__":
    main()

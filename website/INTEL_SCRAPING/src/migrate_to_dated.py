#!/usr/bin/env python3
"""
Migrate existing data to dated directory structure
One-time migration script
"""
import shutil
import re
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

def migrate_raw_data():
    """Migrate raw/category/ to raw/YYYY-MM-DD/category/"""
    print("📁 Migrating raw data...")

    # Find category directories (skip dated directories and .gitkeep)
    category_dirs = [d for d in RAW_DIR.iterdir()
                     if d.is_dir() and not re.match(r'\d{4}-\d{2}-\d{2}', d.name)]

    if not category_dirs:
        print("   ℹ️  No category directories to migrate")
        return

    # Use today's date for migration
    migration_date = datetime.now().strftime('%Y-%m-%d')
    target_dir = RAW_DIR / migration_date
    target_dir.mkdir(parents=True, exist_ok=True)

    for cat_dir in category_dirs:
        if cat_dir.name == '.':
            continue

        target_cat = target_dir / cat_dir.name

        if target_cat.exists():
            print(f"   ⚠️  {cat_dir.name}: Target exists, skipping")
            continue

        print(f"   ✅ Moving {cat_dir.name} → {migration_date}/{cat_dir.name}")
        shutil.move(str(cat_dir), str(target_cat))

    print(f"✅ Raw data migrated to {target_dir}")

def migrate_processed_data():
    """Migrate processed/*_YYYYMMDD.md to processed/YYYY-MM-DD/*.md"""
    print("\n📁 Migrating processed data...")

    # Find dated files (pattern: category_YYYYMMDD.md)
    dated_files = list(PROCESSED_DIR.glob("*_????????.md"))

    if not dated_files:
        print("   ℹ️  No dated files to migrate")
        return

    for file in dated_files:
        # Extract date from filename (category_20251024.md)
        match = re.search(r'(\d{4})(\d{2})(\d{2})\.md$', file.name)
        if not match:
            continue

        year, month, day = match.groups()
        file_date = f"{year}-{month}-{day}"

        # Create dated directory
        target_dir = PROCESSED_DIR / file_date
        target_dir.mkdir(parents=True, exist_ok=True)

        # Move file
        target_file = target_dir / file.name

        if target_file.exists():
            print(f"   ⚠️  {file.name}: Target exists, skipping")
            continue

        print(f"   ✅ Moving {file.name} → {file_date}/{file.name}")
        shutil.move(str(file), str(target_file))

    print("✅ Processed data migrated")

def main():
    print("=" * 60)
    print("INTEL SCRAPING - DATA MIGRATION TO DATED STRUCTURE")
    print("=" * 60)
    print(f"Data directory: {DATA_DIR}")
    print()

    migrate_raw_data()
    migrate_processed_data()

    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)
    print("\n⚠️  Note: Run this script only once!")
    print("Future runs will use dated structure automatically.")

if __name__ == '__main__':
    main()

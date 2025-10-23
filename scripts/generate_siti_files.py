#!/usr/bin/env python3
"""
Generate SITI_*.txt files from categories_v2.json
Each SITI file contains URLs for one category for the scraper to process.
"""

import json
import sys
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_FILE = PROJECT_ROOT / "shared" / "config" / "core" / "categories_v2.json"
OUTPUT_DIR = SCRIPT_DIR / "INTEL_SCRAPING" / "config"

# Create output directory
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def generate_siti_files():
    """Generate SITI_*.txt files from categories_v2.json"""

    print("=" * 70)
    print("GENERATING SITI_*.txt FILES")
    print("=" * 70)

    # Load categories config
    if not CONFIG_FILE.exists():
        print(f"ERROR: Config file not found: {CONFIG_FILE}")
        return 1

    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = json.load(f)

    categories = config.get("categories", [])

    if not categories:
        print("ERROR: No categories found in config")
        return 1

    print(f"Found {len(categories)} categories in config")
    print()

    total_sources = 0
    files_created = 0

    # Generate SITI file for each category
    for category in categories:
        category_id = category.get("id")
        category_name = category.get("name")
        enabled = category.get("enabled", True)
        sources = category.get("sources", [])

        if not enabled:
            print(f"SKIP: {category_id} (disabled)")
            continue

        if not sources:
            print(f"SKIP: {category_id} (no sources)")
            continue

        # Create SITI file
        siti_file = OUTPUT_DIR / f"SITI_{category_id}.txt"

        lines = []
        lines.append(f"# SITI_{category_id}.txt")
        lines.append(f"# Category: {category_name}")
        lines.append(f"# Sources: {len(sources)}")
        lines.append(f"# Generated: {Path(__file__).name}")
        lines.append("")
        lines.append("# Format: URL|source_name|tier")
        lines.append("")

        for source in sources:
            url = source.get("url", "").strip()
            name = source.get("name", "").strip()
            tier = source.get("tier", 2)  # Default tier 2

            # Convert tier number to t1/t2/t3
            if isinstance(tier, int):
                tier_str = f"t{tier}"
            else:
                tier_str = str(tier).lower()

            if url:
                lines.append(f"{url}|{name}|{tier_str}")

        # Write file
        with open(siti_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        print(f"✅ {category_id:25s} → {len(sources):3d} sources → {siti_file.name}")

        total_sources += len(sources)
        files_created += 1

    print()
    print("=" * 70)
    print(f"COMPLETE: {files_created} files created, {total_sources} total sources")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 70)

    return 0


if __name__ == "__main__":
    exit_code = generate_siti_files()
    sys.exit(exit_code)

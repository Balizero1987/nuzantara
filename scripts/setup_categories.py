#!/usr/bin/env python3
"""
Setup Categories V2 — Create directory structure for 14 new categories
"""

import json
import os
from pathlib import Path
from datetime import datetime

# Paths
CONFIG_FILE = Path(__file__).parent.parent / "config" / "categories_v2.json"
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

def load_config():
    """Load categories configuration"""
    with open(CONFIG_FILE) as f:
        return json.load(f)

def create_category_directories(category_id: str):
    """Create directory structure for a category"""
    category_dir = BASE_DIR / category_id

    # Create subdirectories
    subdirs = [
        "raw",           # Raw scraped content (JSON + MD)
        "articles_json", # Processed by LLAMA (normalized JSON)
        "articles_md",   # Human-readable summaries
        "rag"            # RAG-ready chunks (for ChromaDB)
    ]

    for subdir in subdirs:
        path = category_dir / subdir
        path.mkdir(parents=True, exist_ok=True)
        print(f"  ✓ Created {path.relative_to(BASE_DIR.parent)}")

    # Create README
    readme_path = category_dir / "README.md"
    with open(readme_path, 'w') as f:
        f.write(f"# {category_id}\n\n")
        f.write(f"Created: {datetime.now().strftime('%Y-%m-%d')}\n\n")
        f.write("## Directory Structure\n\n")
        f.write("- `raw/` — Raw scraped content (JSON + Markdown)\n")
        f.write("- `articles_json/` — LLAMA-processed JSON (normalized)\n")
        f.write("- `articles_md/` — Human-readable summaries\n")
        f.write("- `rag/` — RAG-ready chunks for ChromaDB\n\n")

    print(f"  ✓ Created README.md")

def generate_category_report(config):
    """Generate summary report of categories"""
    categories = config['categories']

    report = []
    report.append("=" * 80)
    report.append("CATEGORY SETUP REPORT")
    report.append("=" * 80)
    report.append("")
    report.append(f"Total Categories: {len(categories)}")
    report.append(f"Version: {config['version']}")
    report.append(f"Last Updated: {config['last_updated']}")
    report.append("")

    # Group by priority
    by_priority = {}
    for cat in categories:
        priority = cat['priority']
        if priority not in by_priority:
            by_priority[priority] = []
        by_priority[priority].append(cat)

    for priority in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
        if priority in by_priority:
            report.append(f"\n{priority} Priority ({len(by_priority[priority])} categories):")
            report.append("-" * 40)
            for cat in by_priority[priority]:
                content_type = cat.get('content_type', 'actionable')
                revenue = cat.get('revenue_impact', 'N/A')
                sources_count = len(cat['sources'])

                report.append(f"  • {cat['id']:25s} | Revenue: {revenue:10s} | Sources: {sources_count:2d} | {content_type}")

    report.append("")
    report.append("=" * 80)
    report.append("CONTENT TYPE DISTRIBUTION")
    report.append("=" * 80)

    actionable = [c for c in categories if c.get('content_type') != 'colore']
    colore = [c for c in categories if c.get('content_type') == 'colore']
    internal = [c for c in categories if c.get('internal_only', False)]

    report.append(f"Actionable (Revenue):  {len(actionable):2d} categories ({len(actionable)/len(categories)*100:.0f}%)")
    report.append(f"Colore (Engagement):   {len(colore):2d} categories ({len(colore)/len(categories)*100:.0f}%)")
    report.append(f"Internal/Strategic:    {len(internal):2d} categories ({len(internal)/len(categories)*100:.0f}%)")

    report.append("")
    report.append("=" * 80)
    report.append("SOURCES DISTRIBUTION")
    report.append("=" * 80)

    total_sources = sum(len(c['sources']) for c in categories)
    tier_1 = sum(1 for c in categories for s in c['sources'] if s.get('tier') == 1)
    tier_2 = sum(1 for c in categories for s in c['sources'] if s.get('tier') == 2)

    report.append(f"Total Sources: {total_sources}")
    report.append(f"Tier 1 (Gov):  {tier_1} ({tier_1/total_sources*100:.1f}%)")
    report.append(f"Tier 2 (News): {tier_2} ({tier_2/total_sources*100:.1f}%)")

    report.append("")
    report.append("=" * 80)

    return "\n".join(report)

def main():
    """Main setup script"""
    print("\n" + "=" * 80)
    print("BALI ZERO — Category Setup V2")
    print("=" * 80)
    print()

    # Load config
    print(f"Loading configuration from {CONFIG_FILE.name}...")
    config = load_config()

    categories = config['categories']
    print(f"Found {len(categories)} categories\n")

    # Create directories
    for i, category in enumerate(categories, 1):
        cat_id = category['id']
        priority = category['priority']
        enabled = category.get('enabled', True)

        status = "✓" if enabled else "○"
        print(f"{status} [{i:2d}/{len(categories)}] {cat_id:30s} [{priority:8s}]")

        if enabled:
            create_category_directories(cat_id)
        else:
            print(f"  ⊗ Skipped (disabled)")

    # Generate report
    print("\n" + "=" * 80)
    print("Generating category report...")
    report = generate_category_report(config)

    # Save report
    report_path = BASE_DIR / "CATEGORIES_REPORT.md"
    with open(report_path, 'w') as f:
        f.write(report)

    print(f"✓ Report saved to {report_path.relative_to(BASE_DIR.parent)}")

    # Print summary
    print("\n" + report)

    print("\n" + "=" * 80)
    print("✅ SETUP COMPLETE")
    print("=" * 80)
    print(f"\nNext steps:")
    print(f"  1. Review config: config/categories_v2.json")
    print(f"  2. Review report: INTEL_SCRAPING/CATEGORIES_REPORT.md")
    print(f"  3. Update scraper to use new categories")
    print()

if __name__ == "__main__":
    main()

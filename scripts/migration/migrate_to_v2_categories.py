#!/usr/bin/env python3
"""
Migrate scraper from old categories to new V2 categories
Reads config/categories_v2.json and updates crawl4ai_scraper.py
"""

import json
from pathlib import Path

# Load V2 categories
config_path = Path(__file__).parent.parent / "config" / "categories_v2.json"
with open(config_path, 'r') as f:
    config = json.load(f)

# Extract sources by category
intel_sources = {}
category_owners = {}

for cat in config['categories']:
    cat_id = cat['id']
    category_owners[cat_id] = cat['owner']

    sources = []
    for src in cat['sources']:
        sources.append({
            'url': src['url'],
            'tier': src['tier'],
            'name': src['name']
        })

    intel_sources[cat_id] = sources

# Generate Python code for scraper
print("# Generated from config/categories_v2.json")
print("# Last updated:", config['last_updated'])
print()
print("CATEGORY_OWNERS = {")
for cat_id, owner in category_owners.items():
    print(f'    "{cat_id}": "{owner}",')
print("}")
print()

print("# No special categories in V2 (all use standard pipeline)")
print("SPECIAL_CATEGORIES = set()")
print()

print("INTEL_SOURCES = {")
for cat_id, sources in intel_sources.items():
    print(f'    "{cat_id}": [')
    for src in sources:
        print(f"        {src},")
    print("    ],")
    print()
print("}")

print()
print(f"\n# Total categories: {len(intel_sources)}")
print(f"# Total sources: {sum(len(s) for s in intel_sources.values())}")

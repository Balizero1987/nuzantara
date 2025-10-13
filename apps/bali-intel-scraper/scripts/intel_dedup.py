#!/usr/bin/env python3
"""
INTEL SCRAPING - DEDUPLICATION

Detect and remove duplicate intel articles using:
- Canonical URL matching
- Content hash (domain + normalized title)

Target: <1% duplicates per 100 items

Usage:
    python3 scripts/intel_dedup.py
    python3 scripts/intel_dedup.py --dry-run
    python3 scripts/intel_dedup.py --remove
"""

import json
import hashlib
import sys
from pathlib import Path
from urllib.parse import urlparse
from typing import Dict, List, Tuple
from collections import defaultdict

def normalize_title(title: str) -> str:
    """
    Normalize title for duplicate detection
    - Lowercase
    - Remove punctuation
    - Strip whitespace
    """
    import re

    normalized = title.lower()
    normalized = re.sub(r'[^\w\s]', '', normalized)  # Remove punctuation
    normalized = re.sub(r'\s+', ' ', normalized)  # Normalize whitespace
    normalized = normalized.strip()

    return normalized

def get_canonical_url(url: str) -> str:
    """
    Get canonical URL (remove query params, fragments, www)
    """
    if not url:
        return ""

    parsed = urlparse(url)

    # Normalize domain (remove www)
    domain = parsed.netloc.replace('www.', '')

    # Canonical: scheme://domain/path (no query, no fragment)
    canonical = f"{parsed.scheme}://{domain}{parsed.path}"

    # Remove trailing slash
    canonical = canonical.rstrip('/')

    return canonical

def generate_content_hash(data: Dict) -> str:
    """
    Generate content hash: hash(domain + normalized_title)
    """
    source_url = data.get('source_url', '')
    title = data.get('title', '')

    if not source_url or not title:
        # Fallback: use content_hash if available
        return data.get('content_hash', '')

    # Extract domain
    parsed = urlparse(source_url)
    domain = parsed.netloc.replace('www.', '')

    # Normalize title
    norm_title = normalize_title(title)

    # Hash
    content_str = f"{domain}::{norm_title}"
    content_hash = hashlib.md5(content_str.encode()).hexdigest()[:16]

    return content_hash

def find_duplicates(intel_dir: Path) -> Dict[str, List[Tuple[Path, Dict]]]:
    """
    Find duplicates in intel directory

    Returns:
        {
            "hash_or_url": [(file_path, data), (file_path, data), ...],
            ...
        }
    """
    # Index: hash/url → list of (file, data)
    url_index = defaultdict(list)
    hash_index = defaultdict(list)

    json_files = list(intel_dir.rglob("*.json"))

    print(f"🔍 Scanning {len(json_files)} files for duplicates...\n")

    for i, json_file in enumerate(json_files, 1):
        if i % 100 == 0:
            print(f"Progress: {i}/{len(json_files)}")

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Skip non-article files (pipeline reports, cache, etc.)
            if 'source_url' not in data and 'title' not in data:
                continue

            # Index by canonical URL
            source_url = data.get('source_url', '')
            if source_url:
                canonical = get_canonical_url(source_url)
                if canonical:
                    url_index[canonical].append((json_file, data))

            # Index by content hash
            content_hash = generate_content_hash(data)
            if content_hash:
                hash_index[content_hash].append((json_file, data))

        except Exception as e:
            print(f"⚠️  Error reading {json_file}: {e}")
            continue

    # Find duplicates (entries with >1 file)
    duplicates = {}

    for canonical_url, files in url_index.items():
        if len(files) > 1:
            duplicates[f"URL:{canonical_url}"] = files

    for content_hash, files in hash_index.items():
        if len(files) > 1:
            key = f"HASH:{content_hash}"
            # Only add if not already found by URL
            if not any(key2.startswith("URL:") and any(f[0] in [x[0] for x in files] for x in duplicates.get(key2, []))
                       for key2 in duplicates):
                duplicates[key] = files

    return duplicates

def select_best_duplicate(files: List[Tuple[Path, Dict]]) -> int:
    """
    Select the best file to keep among duplicates

    Priority:
    1. Highest tier (Tier 1 > Tier 2)
    2. Longest word count
    3. Most recent scraped_at
    4. First alphabetically (stable)

    Returns:
        Index of best file in list
    """
    def score(item):
        path, data = item

        tier = data.get('tier', 999)  # Lower tier = better (Tier 1 = best)
        word_count = data.get('word_count', 0)
        scraped_at = data.get('scraped_at', '')

        # Score: (negative tier, word count, scraped date, -path for stability)
        return (-tier, word_count, scraped_at, str(path))

    files_with_scores = [(i, score((path, data))) for i, (path, data) in enumerate(files)]
    files_with_scores.sort(key=lambda x: x[1], reverse=True)

    return files_with_scores[0][0]  # Index of best file

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Intel Scraping Deduplication")
    parser.add_argument("--dir", default="INTEL_SCRAPING", help="Directory to scan")
    parser.add_argument("--dry-run", action="store_true", help="Show duplicates without removing")
    parser.add_argument("--remove", action="store_true", help="Remove duplicate files (keep best)")

    args = parser.parse_args()

    intel_dir = Path(args.dir)
    if not intel_dir.exists():
        print(f"❌ Directory not found: {intel_dir}")
        sys.exit(1)

    # Find duplicates
    duplicates = find_duplicates(intel_dir)

    if not duplicates:
        print("\n✅ No duplicates found!")
        sys.exit(0)

    # Report duplicates
    print(f"\n{'='*80}")
    print(f"🔍 DUPLICATE DETECTION RESULTS")
    print(f"{'='*80}")
    print(f"Total duplicate groups: {len(duplicates)}")
    print(f"Total duplicate files:  {sum(len(files) - 1 for files in duplicates.values())}")
    print(f"Duplicate rate:         {sum(len(files) - 1 for files in duplicates.values()) / max(sum(len(f) for f in duplicates.values()), 1) * 100:.1f}%")

    print(f"\n{'='*80}")
    print("📋 DUPLICATE GROUPS")
    print(f"{'='*80}\n")

    for i, (key, files) in enumerate(sorted(duplicates.items(), key=lambda x: -len(x[1])), 1):
        print(f"{i}. {key}")
        print(f"   Duplicates: {len(files)} files\n")

        best_idx = select_best_duplicate(files)

        for j, (file_path, data) in enumerate(files):
            is_best = j == best_idx
            marker = "✅ KEEP" if is_best else "❌ REMOVE"

            rel_path = file_path.relative_to(intel_dir)
            title = (data.get('title') or 'No title')[:60]
            tier = data.get('tier', '?')
            word_count = data.get('word_count', 0)

            print(f"   {marker} {rel_path}")
            print(f"       Title: {title}")
            print(f"       Tier: {tier}, Words: {word_count}")

        print()

    # Remove duplicates if requested
    if args.remove:
        print(f"\n{'='*80}")
        print("🗑️  REMOVING DUPLICATES")
        print(f"{'='*80}\n")

        removed_count = 0

        for key, files in duplicates.items():
            best_idx = select_best_duplicate(files)

            for j, (file_path, data) in enumerate(files):
                if j != best_idx:
                    try:
                        file_path.unlink()
                        print(f"✅ Removed: {file_path.relative_to(intel_dir)}")
                        removed_count += 1
                    except Exception as e:
                        print(f"❌ Error removing {file_path}: {e}")

        print(f"\n✅ Removed {removed_count} duplicate files")

    elif args.dry_run or not args.remove:
        print(f"\n⚠️  DRY RUN - No files were removed")
        print(f"Run with --remove to delete duplicates")

if __name__ == "__main__":
    main()

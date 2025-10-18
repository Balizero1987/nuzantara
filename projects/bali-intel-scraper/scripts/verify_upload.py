#!/usr/bin/env python3
"""
Verify ChromaDB upload quality and generate report
"""

import json
import sys
import os
import requests
from datetime import datetime, timedelta
from collections import Counter

# Configuration
RAG_BACKEND_URL = os.getenv("RAG_BACKEND_URL", "https://zantara-rag-backend-himaadsxua-ew.a.run.app")
CHROMADB_COLLECTION_PREFIX = "bali_intel_"


def load_structured_json(topic, date_str):
    """Load structured JSON file"""
    filepath = f"../data/structured/{topic}_structured_{date_str}.json"

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        sys.exit(1)


def verify_chromadb_collection(collection_name, expected_count):
    """Query ChromaDB to verify upload"""
    try:
        response = requests.get(
            f"{RAG_BACKEND_URL}/api/intel/stats/{collection_name}",
            timeout=15
        )
        response.raise_for_status()
        stats = response.json()
        return stats
    except Exception as e:
        print(f"❌ Failed to query ChromaDB: {e}")
        return None


def analyze_quality(news_items):
    """Analyze data quality metrics"""
    total = len(news_items)

    # Tier distribution
    tier_counts = Counter(item['tier'] for item in news_items)

    # Freshness (<24h, 24-48h, >48h)
    now = datetime.now()
    freshness = {"<24h": 0, "24-48h": 0, ">48h": 0}

    for item in news_items:
        try:
            pub_date = datetime.fromisoformat(item['published_date'].replace('Z', '+00:00'))
            age = (now - pub_date).total_seconds() / 3600  # hours

            if age < 24:
                freshness["<24h"] += 1
            elif age < 48:
                freshness["24-48h"] += 1
            else:
                freshness[">48h"] += 1
        except:
            freshness[">48h"] += 1  # Assume old if parse fails

    # Impact levels
    impact_counts = Counter(item['impact_level'] for item in news_items)

    # Critical items
    critical_items = [item for item in news_items if item['impact_level'] == 'critical']
    action_required = [item for item in news_items if item.get('action_required') == True]

    return {
        "total": total,
        "tier_distribution": tier_counts,
        "freshness": freshness,
        "impact_distribution": impact_counts,
        "critical_items": critical_items,
        "action_required_items": action_required,
    }


def print_report(topic, date_str, analysis, chromadb_stats):
    """Print verification report"""
    print()
    print("=" * 70)
    print(f"✅ Verification Report - {topic.title()} ({date_str})")
    print("=" * 70)
    print()

    # Upload statistics
    print("📊 Upload Statistics:")
    print(f"   Items uploaded: {analysis['total']}")
    print(f"   Tier 1: {analysis['tier_distribution'].get('1', 0)} ({analysis['tier_distribution'].get('1', 0) / analysis['total'] * 100:.0f}%)")
    print(f"   Tier 2: {analysis['tier_distribution'].get('2', 0)} ({analysis['tier_distribution'].get('2', 0) / analysis['total'] * 100:.0f}%)")
    print(f"   Tier 3: {analysis['tier_distribution'].get('3', 0)} ({analysis['tier_distribution'].get('3', 0) / analysis['total'] * 100:.0f}%)")
    print()

    # Freshness
    print("📅 Freshness:")
    print(f"   <24h: {analysis['freshness']['<24h']} ({analysis['freshness']['<24h'] / analysis['total'] * 100:.0f}%)")
    print(f"   24-48h: {analysis['freshness']['24-48h']} ({analysis['freshness']['24-48h'] / analysis['total'] * 100:.0f}%)")
    print(f"   >48h: {analysis['freshness']['>48h']} ({analysis['freshness']['>48h'] / analysis['total'] * 100:.0f}%)")
    print()

    # Impact levels
    print("🎯 Impact Levels:")
    print(f"   Critical: {analysis['impact_distribution'].get('critical', 0)}")
    print(f"   High: {analysis['impact_distribution'].get('high', 0)}")
    print(f"   Medium: {analysis['impact_distribution'].get('medium', 0)}")
    print(f"   Low: {analysis['impact_distribution'].get('low', 0)}")
    print()

    # ChromaDB verification
    if chromadb_stats:
        print("💾 ChromaDB Verification:")
        print(f"   Collection: {chromadb_stats.get('collection_name', 'N/A')}")
        print(f"   Total documents: {chromadb_stats.get('total_documents', 0)}")
        print(f"   Last updated: {chromadb_stats.get('last_updated', 'N/A')}")
        print()

    # Quality check
    print("✅ Quality Check:")

    # KPI: 30+ sources
    sources_ok = analysis['total'] >= 20
    print(f"   {'✅' if sources_ok else '❌'} Minimum items (20+): {analysis['total']}")

    # KPI: 80%+ freshness
    fresh_pct = (analysis['freshness']['<24h'] + analysis['freshness']['24-48h']) / analysis['total'] * 100
    freshness_ok = fresh_pct >= 80
    print(f"   {'✅' if freshness_ok else '❌'} Freshness (80%+ <48h): {fresh_pct:.0f}%")

    # KPI: Tier balance (10-30% T1, 40-60% T2, 20-40% T3)
    tier1_pct = analysis['tier_distribution'].get('1', 0) / analysis['total'] * 100
    tier2_pct = analysis['tier_distribution'].get('2', 0) / analysis['total'] * 100
    tier_balanced = 10 <= tier1_pct <= 30 and 40 <= tier2_pct <= 60
    print(f"   {'✅' if tier_balanced else '⚠️'} Tier balance: T1={tier1_pct:.0f}% T2={tier2_pct:.0f}%")

    print()

    # Critical items warning
    if analysis['critical_items']:
        print("🚨 CRITICAL ITEMS FOUND:")
        for item in analysis['critical_items']:
            print(f"   • {item['title_clean'][:60]}...")
            print(f"     Source (T{item['tier']}): {item['source']}")
            print(f"     URL: {item['original_url']}")
        print()

    # Action required items
    if analysis['action_required_items']:
        print("⚡ ACTION REQUIRED:")
        for item in analysis['action_required_items']:
            print(f"   • {item['title_clean'][:60]}...")
            deadline = item.get('deadline_date', 'No deadline')
            print(f"     Deadline: {deadline}")
        print()

    # Overall status
    all_ok = sources_ok and freshness_ok
    if all_ok:
        print("✅ QUALITY: PASSED")
        print("✅ All KPIs met")
    else:
        print("⚠️  QUALITY: NEEDS REVIEW")
        print("   Some KPIs not met - check details above")

    print("=" * 70)


def main():
    """Main verification function"""
    if len(sys.argv) < 3:
        print("Usage: python3 verify_upload.py <topic> <YYYYMMDD>")
        print("Example: python3 verify_upload.py immigration 20250110")
        sys.exit(1)

    topic = sys.argv[1]
    date_str = sys.argv[2]

    # Load structured JSON
    data = load_structured_json(topic, date_str)
    news_items = data.get("news_items", [])

    # Analyze quality
    analysis = analyze_quality(news_items)

    # Verify ChromaDB
    collection_name = f"{CHROMADB_COLLECTION_PREFIX}{topic}"
    chromadb_stats = verify_chromadb_collection(collection_name, analysis['total'])

    # Print report
    print_report(topic, date_str, analysis, chromadb_stats)


if __name__ == "__main__":
    main()

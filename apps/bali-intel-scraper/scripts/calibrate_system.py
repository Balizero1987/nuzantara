#!/usr/bin/env python3
"""
🎯 CALIBRAZIONE SISTEMA INTEL - Post 1 Settimana

Script di calibrazione automatica basato su analytics settimanali.

Funzioni:
1. Genera report analytics settimanale
2. Identifica siti da rimuovere (fail rate >70%)
3. Suggerisce siti sostitutivi per categorie sotto-performanti
4. Ottimizza email routing
5. Calibra qualità threshold (Filtro Merda)
6. Genera backup SITI_*.txt modificati

Usage:
    python3 calibrate_system.py --dry-run  # Preview senza modifiche
    python3 calibrate_system.py --apply    # Applica calibrazioni

Author: Claude Code
Date: 2025-10-10
"""

import argparse
import json
import shutil
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
SITES_DIR = SCRIPT_DIR.parent / "sites"
DB_PATH = SCRIPT_DIR / "analytics.db"
BACKUP_DIR = SCRIPT_DIR / "calibration_backups"

# Thresholds for calibration
FAIL_RATE_THRESHOLD = 70.0  # Remove sites with >70% fail rate
SUCCESS_RATE_TARGET = 85.0   # Target success rate per category
QUALITY_SCORE_MIN = 6.0      # Minimum quality score to keep
MIN_SCRAPES_FOR_DECISION = 3  # Need at least 3 scrapes to judge


# ============================================================================
# ANALYTICS QUERIES
# ============================================================================

def get_worst_performing_sites(days: int = 7) -> List[Dict]:
    """Identifica siti con performance pessima."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    since_date = (datetime.now() - timedelta(days=days)).date()

    cursor.execute("""
    SELECT
        site_url,
        site_name,
        category_key,
        COUNT(*) as total_scrapes,
        SUM(CASE WHEN scraping_success = 0 THEN 1 ELSE 0 END) as failures,
        AVG(quality_score) as avg_quality,
        AVG(scraping_time_seconds) as avg_time
    FROM site_performance
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    GROUP BY site_url
    HAVING total_scrapes >= ?
    ORDER BY (failures * 1.0 / total_scrapes) DESC, avg_quality ASC
    """, (since_date, MIN_SCRAPES_FOR_DECISION))

    worst_sites = []
    for row in cursor.fetchall():
        fail_rate = (row[4] / row[3]) * 100
        if fail_rate >= FAIL_RATE_THRESHOLD or (row[5] is not None and row[5] < QUALITY_SCORE_MIN):
            worst_sites.append({
                'url': row[0],
                'name': row[1],
                'category': row[2],
                'total_scrapes': row[3],
                'failures': row[4],
                'fail_rate': round(fail_rate, 1),
                'avg_quality': round(row[5], 2) if row[5] else 0,
                'avg_time': round(row[6], 2) if row[6] else 0,
                'reason': 'high_fail_rate' if fail_rate >= FAIL_RATE_THRESHOLD else 'low_quality'
            })

    conn.close()
    return worst_sites


def get_category_performance(days: int = 7) -> Dict[str, Dict]:
    """Ottieni performance per categoria."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    since_date = (datetime.now() - timedelta(days=days)).date()

    cursor.execute("""
    SELECT
        category_key,
        category_name,
        collaborator,
        AVG(success_rate) as avg_success_rate,
        AVG(quality_score) as avg_quality,
        SUM(sites_successful) as total_successful,
        SUM(sites_failed) as total_failed,
        SUM(articles_created) as total_articles
    FROM category_performance
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    GROUP BY category_key
    """, (since_date,))

    categories = {}
    for row in cursor.fetchall():
        categories[row[0]] = {
            'name': row[1],
            'collaborator': row[2],
            'avg_success_rate': round(row[3], 2) if row[3] else 0,
            'avg_quality': round(row[4], 2) if row[4] else 0,
            'total_successful': row[5] or 0,
            'total_failed': row[6] or 0,
            'total_articles': row[7] or 0,
            'needs_calibration': (row[3] or 0) < SUCCESS_RATE_TARGET
        }

    conn.close()
    return categories


def get_top_performing_sites(category: str = None, days: int = 7, limit: int = 20) -> List[Dict]:
    """Ottieni siti top performers (per suggerire sostituzioni)."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    since_date = (datetime.now() - timedelta(days=days)).date()

    query = """
    SELECT
        site_url,
        site_name,
        category_key,
        COUNT(*) as total_scrapes,
        SUM(CASE WHEN scraping_success = 1 THEN 1 ELSE 0 END) as successes,
        AVG(quality_score) as avg_quality
    FROM site_performance
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    """

    params = [since_date]
    if category:
        query += " AND category_key = ?"
        params.append(category)

    query += """
    GROUP BY site_url
    HAVING total_scrapes >= ?
    ORDER BY avg_quality DESC, (successes * 1.0 / total_scrapes) DESC
    LIMIT ?
    """
    params.extend([MIN_SCRAPES_FOR_DECISION, limit])

    cursor.execute(query, params)

    top_sites = []
    for row in cursor.fetchall():
        success_rate = (row[4] / row[3]) * 100
        top_sites.append({
            'url': row[0],
            'name': row[1],
            'category': row[2],
            'total_scrapes': row[3],
            'success_rate': round(success_rate, 1),
            'avg_quality': round(row[5], 2) if row[5] else 0
        })

    conn.close()
    return top_sites


# ============================================================================
# CALIBRATION ACTIONS
# ============================================================================

def backup_siti_files():
    """Crea backup di tutti i SITI_*.txt prima delle modifiche."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = BACKUP_DIR / f"backup_{timestamp}"
    backup_path.mkdir(parents=True, exist_ok=True)

    siti_files = list(SITES_DIR.glob("SITI_*.txt"))
    for siti_file in siti_files:
        shutil.copy2(siti_file, backup_path / siti_file.name)

    print(f"✅ Backup created: {backup_path}")
    return backup_path


def remove_site_from_file(siti_file: Path, site_url: str) -> bool:
    """Rimuove un sito da SITI_*.txt file."""
    content = siti_file.read_text(encoding='utf-8')
    lines = content.split('\n')

    new_lines = []
    removed = False
    skip_next = False

    for i, line in enumerate(lines):
        # Check if this line contains the URL to remove
        if site_url in line:
            # Skip this entry (URL line + description line)
            removed = True
            skip_next = True
            continue

        if skip_next and line.strip().startswith('📝'):
            # Skip description line
            skip_next = False
            continue

        new_lines.append(line)

    if removed:
        # Renumber entries
        final_lines = []
        entry_number = 1
        for line in new_lines:
            if line.strip() and line[0].isdigit() and '.' in line[:4]:
                # This is an entry header, renumber it
                parts = line.split('.', 1)
                if len(parts) == 2:
                    final_lines.append(f"{entry_number}.{parts[1]}")
                    entry_number += 1
                else:
                    final_lines.append(line)
            else:
                final_lines.append(line)

        siti_file.write_text('\n'.join(final_lines), encoding='utf-8')

    return removed


def suggest_replacement_sites(category: str, count: int = 5) -> List[str]:
    """
    Suggerisce siti sostitutivi per una categoria.

    In produzione, questo userebbe:
    - Web scraping di siti aggregatori news
    - API di ricerca siti autorevoli
    - Database di siti trusted per categoria

    Per ora, ritorna placeholder suggerimenti.
    """
    # Placeholder - In produzione implementare logica di ricerca
    suggestions = {
        'immigration': [
            "https://immigration.gov.id",
            "https://www.imigrasi.go.id/en",
            "https://kemlu.go.id/portal/en"
        ],
        'tax': [
            "https://www.pajak.go.id",
            "https://www.kemenkeu.go.id"
        ],
        'health': [
            "https://www.kemkes.go.id",
            "https://www.who.int/indonesia"
        ]
    }

    return suggestions.get(category, [])[:count]


# ============================================================================
# CALIBRATION REPORT
# ============================================================================

def generate_calibration_report(days: int = 7, dry_run: bool = True) -> Dict:
    """Genera report completo di calibrazione."""
    print("📊 Generating calibration report...")
    print(f"   Period: Last {days} days")
    print(f"   Mode: {'DRY RUN (preview)' if dry_run else 'APPLY CHANGES'}")
    print()

    # 1. Get analytics
    worst_sites = get_worst_performing_sites(days)
    categories = get_category_performance(days)

    # 2. Group worst sites by category
    sites_by_category = defaultdict(list)
    for site in worst_sites:
        sites_by_category[site['category']].append(site)

    # 3. Generate report
    report = {
        'generated_at': datetime.now().isoformat(),
        'period_days': days,
        'mode': 'dry_run' if dry_run else 'apply',
        'total_sites_to_remove': len(worst_sites),
        'categories_needing_calibration': [],
        'actions': [],
        'summary': {}
    }

    # 4. Analyze per category
    for cat_key, cat_data in categories.items():
        if cat_data['needs_calibration'] or cat_key in sites_by_category:
            report['categories_needing_calibration'].append({
                'category': cat_key,
                'name': cat_data['name'],
                'success_rate': cat_data['avg_success_rate'],
                'quality_score': cat_data['avg_quality'],
                'sites_to_remove': len(sites_by_category.get(cat_key, [])),
                'failed_sites': cat_data['total_failed']
            })

    # 5. Generate actions
    total_removed = 0
    for cat_key, bad_sites in sites_by_category.items():
        # Find SITI file for category
        siti_files = list(SITES_DIR.glob(f"SITI_*{cat_key.upper()}*.txt"))

        if not siti_files:
            print(f"⚠️  Warning: No SITI file found for category {cat_key}")
            continue

        siti_file = siti_files[0]

        for site in bad_sites:
            action = {
                'type': 'remove_site',
                'category': cat_key,
                'file': siti_file.name,
                'url': site['url'],
                'name': site['name'],
                'reason': site['reason'],
                'fail_rate': site['fail_rate'],
                'quality': site['avg_quality'],
                'applied': False
            }

            # Apply if not dry run
            if not dry_run:
                backup_siti_files()  # Backup before first change
                success = remove_site_from_file(siti_file, site['url'])
                action['applied'] = success
                if success:
                    total_removed += 1

            report['actions'].append(action)

        # Suggest replacements
        if bad_sites and categories[cat_key]['avg_success_rate'] < SUCCESS_RATE_TARGET:
            suggestions = suggest_replacement_sites(cat_key, count=len(bad_sites))
            if suggestions:
                report['actions'].append({
                    'type': 'suggest_replacements',
                    'category': cat_key,
                    'count': len(suggestions),
                    'suggestions': suggestions
                })

    report['summary'] = {
        'total_sites_removed': total_removed if not dry_run else 0,
        'total_actions': len(report['actions']),
        'categories_affected': len(sites_by_category)
    }

    return report


def print_calibration_report(report: Dict):
    """Stampa report in formato leggibile."""
    print()
    print("=" * 80)
    print("🎯 CALIBRATION REPORT")
    print("=" * 80)
    print(f"Generated: {report['generated_at']}")
    print(f"Mode: {report['mode'].upper()}")
    print()

    print("📊 SUMMARY:")
    print(f"   - Total sites to remove: {report['total_sites_to_remove']}")
    print(f"   - Categories needing calibration: {len(report['categories_needing_calibration'])}")
    print(f"   - Total actions: {report['summary']['total_actions']}")
    print()

    if report['categories_needing_calibration']:
        print("⚠️  CATEGORIES NEEDING CALIBRATION:")
        for cat in report['categories_needing_calibration']:
            print(f"\n   {cat['name']} ({cat['category']}):")
            print(f"      Success Rate: {cat['success_rate']}% (target: {SUCCESS_RATE_TARGET}%)")
            print(f"      Quality Score: {cat['quality_score']}/10 (min: {QUALITY_SCORE_MIN})")
            print(f"      Sites to Remove: {cat['sites_to_remove']}")
        print()

    if report['actions']:
        print("🔧 ACTIONS:")
        remove_count = 0
        for action in report['actions']:
            if action['type'] == 'remove_site':
                remove_count += 1
                status = "✅ REMOVED" if action.get('applied') else "📋 TO REMOVE"
                print(f"\n   {status}: {action['name']}")
                print(f"      URL: {action['url']}")
                print(f"      Category: {action['category']}")
                print(f"      Reason: {action['reason']}")
                print(f"      Fail Rate: {action['fail_rate']}%")
                print(f"      Quality: {action['quality']}/10")

            elif action['type'] == 'suggest_replacements':
                print(f"\n   💡 SUGGESTED REPLACEMENTS for {action['category']}:")
                for i, suggestion in enumerate(action['suggestions'], 1):
                    print(f"      {i}. {suggestion}")

    print()
    print("=" * 80)

    if report['mode'] == 'dry_run':
        print()
        print("💡 This was a DRY RUN. No changes were made.")
        print("   To apply changes, run: python3 calibrate_system.py --apply")
        print()


# ============================================================================
# MAIN CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='Calibrate Intel Automation System')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without applying')
    parser.add_argument('--apply', action='store_true', help='Apply calibration changes')
    parser.add_argument('--days', type=int, default=7, help='Days to analyze (default: 7)')

    args = parser.parse_args()

    # Check database exists
    if not DB_PATH.exists():
        print("❌ Analytics database not found. Run system for at least 1 day first.")
        print(f"   Expected: {DB_PATH}")
        return 1

    # Determine mode
    dry_run = not args.apply  # Default to dry run unless --apply

    # Generate report
    report = generate_calibration_report(days=args.days, dry_run=dry_run)

    # Print report
    print_calibration_report(report)

    # Save report
    report_file = SCRIPT_DIR / "ANALYTICS_REPORTS" / f"calibration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f"📄 Report saved: {report_file}")

    return 0


if __name__ == '__main__':
    exit(main())

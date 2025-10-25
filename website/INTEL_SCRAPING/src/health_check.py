#!/usr/bin/env python3
"""
Health Check Generator for Intel Scraping System
Generates HEALTH.md file with system status
"""
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
import json

PROJECT_ROOT = Path(__file__).parent.parent
HEALTH_FILE = PROJECT_ROOT / "HEALTH.md"
HEALTH_JSON = PROJECT_ROOT / "data" / "health.json"


def generate_health_check(
    run_date: str,
    categories: list,
    stats: Dict,
    success: bool,
    errors: list = None
) -> None:
    """Generate health check files (markdown + JSON)

    Args:
        run_date: Date of the run (YYYY-MM-DD)
        categories: List of categories processed
        stats: Statistics dictionary
        success: Overall success status
        errors: List of error messages (optional)
    """
    now = datetime.now()
    timestamp = now.strftime('%Y-%m-%d %H:%M:%S')

    # Calculate overall stats
    total_articles = stats.get('total_articles', 0)
    duration = stats.get('duration', 0)

    # Quality calculation
    scraping_stats = stats.get('stages', {}).get('scraping', {})
    processing_stats = stats.get('stages', {}).get('processing', {})

    articles_scraped = scraping_stats.get('articles_scraped', 0)
    articles_processed = processing_stats.get('stage_2b_created', 0)

    quality_score = 0
    if articles_scraped > 0:
        quality_score = (articles_processed / articles_scraped) * 100

    # Status emoji
    status_emoji = "✅" if success else "❌"
    status_text = "OK" if success else "FAILED"

    # Build markdown content
    markdown = f"""# Intel Scraping - Health Status

**Last Updated**: {timestamp}

## 📊 Current Status

{status_emoji} **Status**: {status_text}

## 📈 Latest Run

- **Date**: {run_date}
- **Duration**: {duration:.1f}s ({duration/60:.1f} min)
- **Categories**: {len(categories)}/{len(categories)} processed
- **Articles Scraped**: {articles_scraped}
- **Articles Processed**: {articles_processed}
- **Quality Score**: {quality_score:.1f}%

## 📋 Categories Processed

"""

    # Add categories with status
    for cat in categories:
        markdown += f"- ✅ {cat}\n"

    # Add errors if any
    if errors and len(errors) > 0:
        markdown += "\n## ⚠️ Errors\n\n"
        for error in errors:
            markdown += f"- {error}\n"

    markdown += f"""
## 🔍 Quick Stats

| Metric | Value |
|--------|-------|
| Scraping Success | {scraping_stats.get('success', False) and '✅' or '❌'} |
| Processing Success | {processing_stats.get('success', False) and '✅' or '❌'} |
| Total Duration | {duration:.1f}s |
| Avg per Category | {(duration / len(categories)) if len(categories) > 0 else 0:.1f}s |

---

*Generated automatically by Intel Scraping PRO*
*Last successful run: {timestamp}*
"""

    # Write markdown file
    HEALTH_FILE.write_text(markdown, encoding='utf-8')

    # Write JSON for programmatic access
    health_data = {
        'timestamp': timestamp,
        'run_date': run_date,
        'status': status_text,
        'success': success,
        'categories': categories,
        'stats': {
            'total_articles': total_articles,
            'articles_scraped': articles_scraped,
            'articles_processed': articles_processed,
            'quality_score': quality_score,
            'duration': duration
        },
        'errors': errors or []
    }

    HEALTH_JSON.parent.mkdir(parents=True, exist_ok=True)
    HEALTH_JSON.write_text(json.dumps(health_data, indent=2), encoding='utf-8')

    print(f"✅ Health check updated: {HEALTH_FILE}")


def get_health_status() -> Optional[Dict]:
    """Read current health status from JSON

    Returns:
        Health status dictionary or None if file doesn't exist
    """
    if HEALTH_JSON.exists():
        return json.loads(HEALTH_JSON.read_text(encoding='utf-8'))
    return None


if __name__ == '__main__':
    # Test with sample data
    generate_health_check(
        run_date='2025-10-25',
        categories=['business', 'immigration', 'ai_tech'],
        stats={
            'total_articles': 45,
            'duration': 287.3,
            'stages': {
                'scraping': {
                    'success': True,
                    'articles_scraped': 45
                },
                'processing': {
                    'success': True,
                    'stage_2b_created': 42
                }
            }
        },
        success=True,
        errors=[]
    )

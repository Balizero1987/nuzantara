#!/usr/bin/env python3
"""
HTML Email Report Generator for Intel Scraping
Generate beautiful HTML email reports with run summaries
"""
from datetime import datetime
from typing import Dict, List
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent


def generate_html_report(
    run_date: str,
    categories: List[str],
    stats: Dict,
    success: bool,
    errors: List[str] = None
) -> str:
    """Generate HTML email report

    Args:
        run_date: Date of the run (YYYY-MM-DD)
        categories: List of categories processed
        stats: Statistics dictionary
        success: Overall success status
        errors: List of error messages (optional)

    Returns:
        HTML email content
    """
    errors = errors or []
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Extract stats
    duration = stats.get('duration', 0)
    total_articles = stats.get('total_articles', 0)
    scraping_stats = stats.get('stages', {}).get('scraping', {})
    processing_stats = stats.get('stages', {}).get('processing', {})

    articles_scraped = scraping_stats.get('articles_scraped', 0)
    articles_processed = processing_stats.get('stage_2b_created', 0)

    quality_score = 0
    if articles_scraped > 0:
        quality_score = (articles_processed / articles_scraped) * 100

    # Status color
    status_color = "#28a745" if success else "#dc3545"
    status_text = "SUCCESS ✅" if success else "FAILED ❌"

    # Generate HTML
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }}
        .container {{
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid {status_color};
        }}
        .status {{
            display: inline-block;
            padding: 10px 20px;
            border-radius: 5px;
            background-color: {status_color};
            color: white;
            font-weight: bold;
            font-size: 18px;
        }}
        .stats {{
            margin: 20px 0;
        }}
        .stat-row {{
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }}
        .stat-label {{
            font-weight: 600;
            color: #666;
        }}
        .stat-value {{
            color: #333;
        }}
        .categories {{
            margin: 20px 0;
        }}
        .category-item {{
            padding: 8px;
            margin: 5px 0;
            background-color: #f8f9fa;
            border-left: 3px solid #28a745;
            border-radius: 3px;
        }}
        .errors {{
            margin: 20px 0;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
        }}
        .error-item {{
            padding: 5px 0;
            color: #856404;
        }}
        .footer {{
            text-align: center;
            padding-top: 20px;
            margin-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }}
        .progress-bar {{
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }}
        .progress-fill {{
            height: 100%;
            background-color: #28a745;
            text-align: center;
            color: white;
            font-size: 12px;
            line-height: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Intel Scraping Report</h1>
            <div class="status">{status_text}</div>
        </div>

        <div class="stats">
            <h2>📊 Run Statistics</h2>

            <div class="stat-row">
                <span class="stat-label">Run Date</span>
                <span class="stat-value">{run_date}</span>
            </div>

            <div class="stat-row">
                <span class="stat-label">Completed At</span>
                <span class="stat-value">{timestamp}</span>
            </div>

            <div class="stat-row">
                <span class="stat-label">Duration</span>
                <span class="stat-value">{duration:.1f}s ({duration/60:.1f} min)</span>
            </div>

            <div class="stat-row">
                <span class="stat-label">Articles Scraped</span>
                <span class="stat-value">{articles_scraped}</span>
            </div>

            <div class="stat-row">
                <span class="stat-label">Articles Processed</span>
                <span class="stat-value">{articles_processed}</span>
            </div>

            <div class="stat-row">
                <span class="stat-label">Quality Score</span>
                <span class="stat-value">{quality_score:.1f}%</span>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: {quality_score}%">{quality_score:.0f}%</div>
            </div>
        </div>

        <div class="categories">
            <h2>📁 Categories Processed</h2>
"""

    # Add categories
    for category in categories:
        html += f'            <div class="category-item">✅ {category}</div>\n'

    html += "        </div>\n"

    # Add errors if any
    if errors:
        html += """        <div class="errors">
            <h2>⚠️ Errors</h2>
"""
        for error in errors:
            html += f'            <div class="error-item">• {error}</div>\n'
        html += "        </div>\n"

    # Footer
    html += f"""
        <div class="footer">
            <p>Generated automatically by Intel Scraping PRO</p>
            <p>Last successful run: {timestamp}</p>
        </div>
    </div>
</body>
</html>
"""

    return html


def save_html_report(
    html_content: str,
    output_file: Path = None
) -> Path:
    """Save HTML report to file

    Args:
        html_content: HTML content
        output_file: Output file path (default: data/latest_report.html)

    Returns:
        Path to saved file
    """
    if output_file is None:
        output_file = PROJECT_ROOT / "data" / "latest_report.html"

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(html_content, encoding='utf-8')

    return output_file


if __name__ == '__main__':
    # Test HTML report generation
    test_stats = {
        'duration': 287.3,
        'total_articles': 45,
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
    }

    html = generate_html_report(
        run_date='2025-10-25',
        categories=['business', 'immigration', 'ai_tech'],
        stats=test_stats,
        success=True,
        errors=[]
    )

    output_file = save_html_report(html)
    print(f"✅ HTML report saved to: {output_file}")

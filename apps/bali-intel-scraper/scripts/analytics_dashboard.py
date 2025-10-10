#!/usr/bin/env python3
"""
📊 INTEL AUTOMATION - ANALYTICS DASHBOARD
==========================================

Dashboard analitica per monitorare e calibrare il sistema dopo 1 settimana.

Metriche monitorate:
- Success rate scraping per categoria
- Qualità contenuti (Filtro News Merda)
- Performance RAG embeddings
- Email delivery status
- Costi API Claude + RAG backend
- Timing esecuzione per stage
- Top performing sites per categoria
- Categorie da calibrare

Author: Claude Code
Date: 2025-10-10
"""

import json
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from collections import defaultdict, Counter
import statistics

# ============================================================================
# CONFIGURATION
# ============================================================================

DB_PATH = Path(__file__).parent / "analytics.db"
OUTPUT_BASE = Path(__file__).parent / "INTEL_SCRAPING"
REPORT_OUTPUT = Path(__file__).parent / "ANALYTICS_REPORTS"


# ============================================================================
# DATABASE SCHEMA
# ============================================================================

def init_database():
    """Inizializza database SQLite per analytics."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Table: daily_runs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_date DATE NOT NULL,
        workflow_run_id TEXT,
        total_duration_seconds INTEGER,
        stage1_duration INTEGER,
        stage2a_duration INTEGER,
        stage2b_duration INTEGER,
        total_sites_scraped INTEGER,
        total_articles_created INTEGER,
        total_emails_sent INTEGER,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Table: category_performance
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS category_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        category_key TEXT NOT NULL,
        category_name TEXT,
        collaborator TEXT,
        sites_attempted INTEGER,
        sites_successful INTEGER,
        sites_failed INTEGER,
        success_rate REAL,
        avg_scraping_time REAL,
        quality_score REAL,
        articles_created INTEGER,
        email_sent BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES daily_runs(id)
    )
    """)

    # Table: site_performance
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS site_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        category_key TEXT NOT NULL,
        site_url TEXT NOT NULL,
        site_name TEXT,
        scraping_success BOOLEAN,
        scraping_time_seconds REAL,
        content_length INTEGER,
        quality_score REAL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES daily_runs(id)
    )
    """)

    # Table: quality_metrics
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quality_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        category_key TEXT NOT NULL,
        total_scraped INTEGER,
        filtro_merda_rejected INTEGER,
        filtro_merda_rate REAL,
        avg_content_quality REAL,
        top_quality_sites TEXT,  -- JSON array
        low_quality_sites TEXT,  -- JSON array
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES daily_runs(id)
    )
    """)

    # Table: api_costs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        anthropic_api_calls INTEGER,
        anthropic_tokens_input INTEGER,
        anthropic_tokens_output INTEGER,
        anthropic_cost_usd REAL,
        rag_backend_calls INTEGER,
        rag_backend_embeddings INTEGER,
        rag_backend_cost_usd REAL,
        total_cost_usd REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES daily_runs(id)
    )
    """)

    # Table: email_delivery
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS email_delivery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        category_key TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        email_sent BOOLEAN,
        send_time TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES daily_runs(id)
    )
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialized")


# ============================================================================
# DATA COLLECTION
# ============================================================================

def log_daily_run(stats: Dict) -> int:
    """
    Registra statistiche del daily run.

    Args:
        stats: Dizionario statistiche da run_intel_automation.py

    Returns:
        run_id: ID del run inserito
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO daily_runs (
        run_date, workflow_run_id, total_duration_seconds,
        stage1_duration, stage2a_duration, stage2b_duration,
        total_sites_scraped, total_articles_created, total_emails_sent,
        status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now().date(),
        stats.get('workflow_run_id'),
        stats.get('total_duration', 0),
        stats.get('stages', {}).get('scraping', {}).get('duration', 0),
        stats.get('stages', {}).get('processing', {}).get('stage_2a_processed', 0),
        stats.get('stages', {}).get('processing', {}).get('stage_2b_created', 0),
        stats.get('stages', {}).get('scraping', {}).get('total_scraped', 0),
        stats.get('stages', {}).get('processing', {}).get('stage_2b_created', 0),
        stats.get('stages', {}).get('processing', {}).get('emails_sent', 0),
        'completed'
    ))

    run_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return run_id


def log_category_performance(run_id: int, category_key: str, perf_data: Dict):
    """Registra performance di una categoria."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO category_performance (
        run_id, category_key, category_name, collaborator,
        sites_attempted, sites_successful, sites_failed, success_rate,
        avg_scraping_time, quality_score, articles_created, email_sent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        category_key,
        perf_data.get('category_name'),
        perf_data.get('collaborator'),
        perf_data.get('sites_attempted', 0),
        perf_data.get('sites_successful', 0),
        perf_data.get('sites_failed', 0),
        perf_data.get('success_rate', 0.0),
        perf_data.get('avg_scraping_time', 0.0),
        perf_data.get('quality_score', 0.0),
        perf_data.get('articles_created', 0),
        perf_data.get('email_sent', False)
    ))

    conn.commit()
    conn.close()


def log_site_performance(run_id: int, category_key: str, site_data: Dict):
    """Registra performance di un singolo sito."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO site_performance (
        run_id, category_key, site_url, site_name,
        scraping_success, scraping_time_seconds, content_length,
        quality_score, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        category_key,
        site_data.get('url'),
        site_data.get('name'),
        site_data.get('success', False),
        site_data.get('scraping_time', 0.0),
        site_data.get('content_length', 0),
        site_data.get('quality_score', 0.0),
        site_data.get('error')
    ))

    conn.commit()
    conn.close()


def log_quality_metrics(run_id: int, category_key: str, quality_data: Dict):
    """Registra metriche di qualità contenuti."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO quality_metrics (
        run_id, category_key, total_scraped, filtro_merda_rejected,
        filtro_merda_rate, avg_content_quality, top_quality_sites, low_quality_sites
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        category_key,
        quality_data.get('total_scraped', 0),
        quality_data.get('rejected', 0),
        quality_data.get('rejection_rate', 0.0),
        quality_data.get('avg_quality', 0.0),
        json.dumps(quality_data.get('top_sites', [])),
        json.dumps(quality_data.get('low_sites', []))
    ))

    conn.commit()
    conn.close()


def log_api_costs(run_id: int, cost_data: Dict):
    """Registra costi API."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO api_costs (
        run_id, anthropic_api_calls, anthropic_tokens_input, anthropic_tokens_output,
        anthropic_cost_usd, rag_backend_calls, rag_backend_embeddings,
        rag_backend_cost_usd, total_cost_usd
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        cost_data.get('anthropic_calls', 0),
        cost_data.get('anthropic_input_tokens', 0),
        cost_data.get('anthropic_output_tokens', 0),
        cost_data.get('anthropic_cost', 0.0),
        cost_data.get('rag_calls', 0),
        cost_data.get('rag_embeddings', 0),
        cost_data.get('rag_cost', 0.0),
        cost_data.get('total_cost', 0.0)
    ))

    conn.commit()
    conn.close()


# ============================================================================
# ANALYTICS & REPORTING
# ============================================================================

def generate_weekly_report(days: int = 7) -> Dict:
    """
    Genera report analitico settimanale.

    Args:
        days: Numero di giorni da analizzare (default 7)

    Returns:
        Dizionario con analytics complete
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    since_date = (datetime.now() - timedelta(days=days)).date()

    report = {
        'period': f"Last {days} days",
        'generated_at': datetime.now().isoformat(),
        'summary': {},
        'categories': {},
        'top_sites': [],
        'worst_sites': [],
        'quality_insights': {},
        'cost_analysis': {},
        'recommendations': []
    }

    # 1. SUMMARY METRICS
    cursor.execute("""
    SELECT
        COUNT(*) as total_runs,
        AVG(total_duration_seconds) as avg_duration,
        SUM(total_sites_scraped) as total_sites,
        SUM(total_articles_created) as total_articles,
        SUM(total_emails_sent) as total_emails
    FROM daily_runs
    WHERE run_date >= ?
    """, (since_date,))

    row = cursor.fetchone()
    report['summary'] = {
        'total_runs': row[0],
        'avg_duration_minutes': round(row[1] / 60, 2) if row[1] else 0,
        'total_sites_scraped': row[2] or 0,
        'total_articles_created': row[3] or 0,
        'total_emails_sent': row[4] or 0
    }

    # 2. CATEGORY PERFORMANCE
    cursor.execute("""
    SELECT
        category_key,
        category_name,
        collaborator,
        AVG(success_rate) as avg_success_rate,
        AVG(quality_score) as avg_quality,
        SUM(articles_created) as total_articles,
        SUM(sites_successful) as successful_sites,
        SUM(sites_failed) as failed_sites
    FROM category_performance
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    GROUP BY category_key
    ORDER BY avg_quality DESC
    """, (since_date,))

    for row in cursor.fetchall():
        cat_key = row[0]
        report['categories'][cat_key] = {
            'name': row[1],
            'collaborator': row[2],
            'avg_success_rate': round(row[3], 2) if row[3] else 0,
            'avg_quality_score': round(row[4], 2) if row[4] else 0,
            'total_articles': row[5] or 0,
            'successful_sites': row[6] or 0,
            'failed_sites': row[7] or 0
        }

    # 3. TOP PERFORMING SITES (cross-category)
    cursor.execute("""
    SELECT
        site_url,
        site_name,
        category_key,
        AVG(quality_score) as avg_quality,
        COUNT(*) as scrape_count,
        SUM(CASE WHEN scraping_success = 1 THEN 1 ELSE 0 END) as success_count
    FROM site_performance
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    GROUP BY site_url
    HAVING success_count > 0
    ORDER BY avg_quality DESC
    LIMIT 20
    """, (since_date,))

    report['top_sites'] = [
        {
            'url': row[0],
            'name': row[1],
            'category': row[2],
            'avg_quality': round(row[3], 2) if row[3] else 0,
            'scrape_count': row[4],
            'success_rate': round((row[5] / row[4]) * 100, 1)
        }
        for row in cursor.fetchall()
    ]

    # 4. WORST PERFORMING SITES (da rimuovere o sostituire)
    cursor.execute("""
    SELECT
        site_url,
        site_name,
        category_key,
        AVG(quality_score) as avg_quality,
        COUNT(*) as scrape_count,
        SUM(CASE WHEN scraping_success = 0 THEN 1 ELSE 0 END) as fail_count
    FROM site_performance
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    GROUP BY site_url
    HAVING fail_count > 2
    ORDER BY fail_count DESC, avg_quality ASC
    LIMIT 20
    """, (since_date,))

    report['worst_sites'] = [
        {
            'url': row[0],
            'name': row[1],
            'category': row[2],
            'avg_quality': round(row[3], 2) if row[3] else 0,
            'scrape_count': row[4],
            'fail_rate': round((row[5] / row[4]) * 100, 1)
        }
        for row in cursor.fetchall()
    ]

    # 5. QUALITY INSIGHTS
    cursor.execute("""
    SELECT
        category_key,
        AVG(filtro_merda_rate) as avg_rejection_rate,
        AVG(avg_content_quality) as avg_quality
    FROM quality_metrics
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    GROUP BY category_key
    ORDER BY avg_rejection_rate DESC
    """, (since_date,))

    for row in cursor.fetchall():
        cat_key = row[0]
        report['quality_insights'][cat_key] = {
            'avg_rejection_rate': round(row[1], 2) if row[1] else 0,
            'avg_content_quality': round(row[2], 2) if row[2] else 0
        }

    # 6. COST ANALYSIS
    cursor.execute("""
    SELECT
        SUM(anthropic_cost_usd) as total_anthropic,
        SUM(rag_backend_cost_usd) as total_rag,
        SUM(total_cost_usd) as total_cost,
        AVG(total_cost_usd) as avg_daily_cost,
        SUM(anthropic_tokens_input) as total_input_tokens,
        SUM(anthropic_tokens_output) as total_output_tokens
    FROM api_costs
    WHERE run_id IN (SELECT id FROM daily_runs WHERE run_date >= ?)
    """, (since_date,))

    row = cursor.fetchone()
    report['cost_analysis'] = {
        'total_anthropic_usd': round(row[0], 2) if row[0] else 0,
        'total_rag_usd': round(row[1], 2) if row[1] else 0,
        'total_cost_usd': round(row[2], 2) if row[2] else 0,
        'avg_daily_cost_usd': round(row[3], 2) if row[3] else 0,
        'total_input_tokens': row[4] or 0,
        'total_output_tokens': row[5] or 0,
        'projected_monthly_cost_usd': round((row[3] * 30), 2) if row[3] else 0
    }

    # 7. GENERATE RECOMMENDATIONS
    report['recommendations'] = _generate_recommendations(report)

    conn.close()
    return report


def _generate_recommendations(report: Dict) -> List[str]:
    """Genera raccomandazioni basate su analytics."""
    recommendations = []

    # Categorie con basso success rate
    for cat_key, data in report['categories'].items():
        if data['avg_success_rate'] < 70:
            recommendations.append(
                f"⚠️ Categoria '{cat_key}': Success rate basso ({data['avg_success_rate']}%). "
                f"Rimuovere siti non funzionanti e sostituire."
            )

        if data['avg_quality_score'] < 6.0:
            recommendations.append(
                f"📉 Categoria '{cat_key}': Qualità media bassa ({data['avg_quality_score']}/10). "
                f"Rivedere SITI_*.txt e preferire fonti più autorevoli."
            )

    # Worst sites da rimuovere
    if len(report['worst_sites']) > 5:
        recommendations.append(
            f"🗑️ {len(report['worst_sites'])} siti con performance pessima. "
            f"Rimuovere e sostituire con alternative migliori."
        )

    # Cost optimization
    if report['cost_analysis']['projected_monthly_cost_usd'] > 100:
        recommendations.append(
            f"💰 Costo mensile proiettato: ${report['cost_analysis']['projected_monthly_cost_usd']}. "
            f"Considerare ottimizzazione lunghezza prompt o riduzione categorie."
        )

    return recommendations


def save_weekly_report_html(report: Dict, output_path: Path = None):
    """Salva report come HTML dashboard."""
    if not output_path:
        output_path = REPORT_OUTPUT / f"weekly_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"

    output_path.parent.mkdir(parents=True, exist_ok=True)

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Intel Automation - Weekly Analytics Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .metric-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .metric-value {{
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
        }}
        .metric-label {{
            color: #666;
            margin-top: 5px;
        }}
        .section {{
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background: #f8f9fa;
            font-weight: 600;
        }}
        .good {{ color: #10b981; }}
        .warning {{ color: #f59e0b; }}
        .bad {{ color: #ef4444; }}
        .recommendation {{
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Intel Automation - Weekly Analytics Dashboard</h1>
        <p>Period: {report['period']} | Generated: {report['generated_at']}</p>
    </div>

    <div class="summary">
        <div class="metric-card">
            <div class="metric-value">{report['summary']['total_runs']}</div>
            <div class="metric-label">Total Runs</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">{report['summary']['total_sites_scraped']}</div>
            <div class="metric-label">Sites Scraped</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">{report['summary']['total_articles_created']}</div>
            <div class="metric-label">Articles Created</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">{report['summary']['avg_duration_minutes']}m</div>
            <div class="metric-label">Avg Duration</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${report['cost_analysis']['total_cost_usd']}</div>
            <div class="metric-label">Total Cost</div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Category Performance</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Collaborator</th>
                    <th>Success Rate</th>
                    <th>Quality Score</th>
                    <th>Articles</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
"""

    for cat_key, data in sorted(report['categories'].items(), key=lambda x: x[1]['avg_quality_score'], reverse=True):
        success_class = 'good' if data['avg_success_rate'] >= 80 else ('warning' if data['avg_success_rate'] >= 60 else 'bad')
        quality_class = 'good' if data['avg_quality_score'] >= 7 else ('warning' if data['avg_quality_score'] >= 5 else 'bad')

        html += f"""
                <tr>
                    <td><strong>{data['name']}</strong></td>
                    <td>{data['collaborator']}</td>
                    <td class="{success_class}">{data['avg_success_rate']}%</td>
                    <td class="{quality_class}">{data['avg_quality_score']}/10</td>
                    <td>{data['total_articles']}</td>
                    <td>{'✅ Good' if data['avg_quality_score'] >= 7 else '⚠️ Review'}</td>
                </tr>
"""

    html += """
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🏆 Top Performing Sites</h2>
        <table>
            <thead>
                <tr>
                    <th>Site</th>
                    <th>Category</th>
                    <th>Quality Score</th>
                    <th>Success Rate</th>
                </tr>
            </thead>
            <tbody>
"""

    for site in report['top_sites'][:10]:
        html += f"""
                <tr>
                    <td>{site['name']}</td>
                    <td>{site['category']}</td>
                    <td class="good">{site['avg_quality']}/10</td>
                    <td class="good">{site['success_rate']}%</td>
                </tr>
"""

    html += """
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>⚠️ Worst Performing Sites (Consider Removing)</h2>
        <table>
            <thead>
                <tr>
                    <th>Site</th>
                    <th>Category</th>
                    <th>Quality Score</th>
                    <th>Fail Rate</th>
                </tr>
            </thead>
            <tbody>
"""

    for site in report['worst_sites'][:10]:
        html += f"""
                <tr>
                    <td>{site['name']}</td>
                    <td>{site['category']}</td>
                    <td class="bad">{site['avg_quality']}/10</td>
                    <td class="bad">{site['fail_rate']}%</td>
                </tr>
"""

    html += f"""
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>💰 Cost Analysis</h2>
        <p><strong>Total Cost (7 days):</strong> ${report['cost_analysis']['total_cost_usd']}</p>
        <p><strong>Average Daily Cost:</strong> ${report['cost_analysis']['avg_daily_cost_usd']}</p>
        <p><strong>Projected Monthly Cost:</strong> ${report['cost_analysis']['projected_monthly_cost_usd']}</p>
        <p><strong>Anthropic API:</strong> ${report['cost_analysis']['total_anthropic_usd']}
           ({report['cost_analysis']['total_input_tokens']} input + {report['cost_analysis']['total_output_tokens']} output tokens)</p>
        <p><strong>RAG Backend:</strong> ${report['cost_analysis']['total_rag_usd']}</p>
    </div>

    <div class="section">
        <h2>💡 Recommendations</h2>
"""

    for rec in report['recommendations']:
        html += f'<div class="recommendation">{rec}</div>\n'

    html += """
    </div>
</body>
</html>
"""

    output_path.write_text(html, encoding='utf-8')
    print(f"✅ HTML report saved: {output_path}")
    return output_path


# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Intel Automation Analytics Dashboard")
    parser.add_argument('--init', action='store_true', help='Initialize database')
    parser.add_argument('--report', type=int, default=7, help='Generate report for last N days')
    parser.add_argument('--json', action='store_true', help='Output JSON instead of HTML')

    args = parser.parse_args()

    if args.init:
        init_database()

    if args.report:
        print(f"📊 Generating analytics report for last {args.report} days...")
        report = generate_weekly_report(days=args.report)

        if args.json:
            json_path = REPORT_OUTPUT / f"weekly_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            json_path.parent.mkdir(parents=True, exist_ok=True)
            json_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
            print(f"✅ JSON report saved: {json_path}")
        else:
            html_path = save_weekly_report_html(report)
            print(f"\n📊 Open dashboard: {html_path}")

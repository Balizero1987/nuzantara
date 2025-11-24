"""
ZANTARA CRM - Analytics Router
Provides analytics and insights for CRM data
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional
from datetime import datetime, timedelta, date
import logging
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crm/analytics", tags=["crm-analytics"])


# ================================================
# DATABASE CONNECTION
# ================================================

def get_db_connection():
    """Get PostgreSQL connection"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise Exception("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)


# ================================================
# ENDPOINTS
# ================================================

@router.get("/dashboard")
async def get_dashboard_metrics(
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y"),
    team_member: Optional[str] = Query(None, description="Filter by team member email")
):
    """
    Get comprehensive dashboard metrics
    
    Returns:
    - Client metrics (new, active, total)
    - Practice metrics (active, completed, revenue)
    - Interaction metrics (volume, sentiment)
    - Team performance metrics
    """
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Parse period
        days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365
        }.get(period, 30)
        
        start_date = datetime.now() - timedelta(days=days)
        
        # Build team member filter
        team_filter = ""
        team_params = []
        if team_member:
            team_filter = " AND assigned_to = %s"
            team_params = [team_member]
        
        # Client Metrics
        cursor.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE created_at >= %s) as new_clients,
                COUNT(*) FILTER (WHERE status = 'active') as active_clients,
                COUNT(*) as total_clients
            FROM clients
            WHERE 1=1 {team_filter}
        """, [start_date] + team_params)
        client_metrics = cursor.fetchone()
        
        # Practice Metrics
        cursor.execute(f"""
            SELECT
                COUNT(*) FILTER (WHERE status IN ('in_progress', 'waiting_documents', 'submitted_to_gov')) as active_practices,
                COUNT(*) FILTER (WHERE status = 'completed' AND completion_date >= %s) as completed_recent,
                COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
                SUM(actual_price) FILTER (WHERE payment_status = 'paid') as total_revenue,
                SUM(actual_price) FILTER (WHERE payment_status = 'paid' AND created_at >= %s) as recent_revenue,
                AVG(EXTRACT(days FROM (completion_date - start_date))) FILTER (WHERE status = 'completed') as avg_completion_days
            FROM practices
            WHERE 1=1 {team_filter}
        """, [start_date, start_date] + team_params)
        practice_metrics = cursor.fetchone()
        
        # Interaction Metrics  
        cursor.execute(f"""
            SELECT
                COUNT(*) as total_interactions,
                COUNT(*) FILTER (WHERE interaction_date >= %s) as recent_interactions,
                COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_sentiment,
                COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_sentiment,
                COUNT(*) FILTER (WHERE sentiment = 'urgent') as urgent_items
            FROM interactions
            WHERE 1=1 {team_filter.replace('assigned_to', 'team_member')}
        """, [start_date] + [tm if tm else None for tm in team_params])
        interaction_metrics = cursor.fetchone()
        
        # Team Performance (if not filtered by team member)
        if not team_member:
            cursor.execute("""
                SELECT 
                    assigned_to,
                    COUNT(DISTINCT client_id) as clients_managed,
                    COUNT(*) as practices_handled,
                    SUM(actual_price) FILTER (WHERE payment_status = 'paid') as revenue_generated
                FROM practices
                WHERE assigned_to IS NOT NULL
                GROUP BY assigned_to
                ORDER BY revenue_generated DESC NULLS LAST
                LIMIT 5
            """)
            top_performers = cursor.fetchall()
        else:
            top_performers = []
        
        cursor.close()
        conn.close()
        
        return {
            "period": period,
            "period_days": days,
            "filtered_by": team_member,
            "metrics": {
                "clients": dict(client_metrics),
                "practices": dict(practice_metrics),
                "interactions": dict(interaction_metrics)
            },
            "team_performance": [dict(p) for p in top_performers] if top_performers else [],
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/revenue")
async def get_revenue_analytics(
    group_by: str = Query("month", description="Grouping: day, week, month, quarter"),
    period: str = Query("1y", description="Time period: 30d, 90d, 1y, all")
):
    """
    Get detailed revenue analytics
    
    Returns revenue trends, projections, and breakdowns
    """
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Determine date range
        if period == "all":
            date_filter = "1=1"
            params = []
        else:
            days = {"30d": 30, "90d": 90, "1y": 365}.get(period, 365)
            date_filter = "created_at >= %s"
            params = [datetime.now() - timedelta(days=days)]
        
        # Date truncation based on grouping
        date_trunc = {
            "day": "day",
            "week": "week", 
            "month": "month",
            "quarter": "quarter"
        }.get(group_by, "month")
        
        # Revenue over time
        cursor.execute(f"""
            SELECT
                DATE_TRUNC(%s, created_at) as period,
                COUNT(*) as num_practices,
                SUM(quoted_price) as total_quoted,
                SUM(actual_price) as total_actual,
                SUM(actual_price) FILTER (WHERE payment_status = 'paid') as total_paid,
                SUM(actual_price) FILTER (WHERE payment_status = 'partial') as total_partial,
                SUM(actual_price) FILTER (WHERE payment_status = 'unpaid') as total_unpaid
            FROM practices
            WHERE {date_filter}
            GROUP BY DATE_TRUNC(%s, created_at)
            ORDER BY period DESC
        """, [date_trunc] + params + [date_trunc])
        revenue_trend = cursor.fetchall()
        
        # Revenue by practice type
        cursor.execute(f"""
            SELECT
                pt.name as practice_type,
                pt.code as practice_code,
                COUNT(p.id) as count,
                SUM(p.actual_price) as total_revenue,
                AVG(p.actual_price) as avg_revenue
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE {date_filter} AND p.actual_price IS NOT NULL
            GROUP BY pt.name, pt.code
            ORDER BY total_revenue DESC
        """, params)
        revenue_by_type = cursor.fetchall()
        
        # Payment status breakdown
        cursor.execute(f"""
            SELECT
                payment_status,
                COUNT(*) as count,
                SUM(actual_price) as total_amount,
                AVG(actual_price) as avg_amount
            FROM practices
            WHERE {date_filter} AND actual_price IS NOT NULL
            GROUP BY payment_status
        """, params)
        payment_breakdown = cursor.fetchall()
        
        # Outstanding receivables
        cursor.execute("""
            SELECT
                SUM(actual_price - COALESCE(paid_amount, 0)) as total_outstanding,
                COUNT(*) as num_outstanding,
                AVG(EXTRACT(days FROM (NOW() - created_at))) as avg_days_outstanding
            FROM practices
            WHERE payment_status IN ('unpaid', 'partial')
                AND actual_price IS NOT NULL
        """)
        outstanding = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return {
            "period": period,
            "group_by": group_by,
            "revenue_trend": [dict(r) for r in revenue_trend],
            "revenue_by_type": [dict(r) for r in revenue_by_type],
            "payment_breakdown": [dict(p) for p in payment_breakdown],
            "outstanding_receivables": dict(outstanding),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get revenue analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/client-insights")
async def get_client_insights(
    segment: Optional[str] = Query(None, description="Segment: vip, active, inactive, prospect")
):
    """
    Get client segmentation and insights
    
    Returns client distribution, lifecycle metrics, and recommendations
    """
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Client segmentation
        cursor.execute("""
            SELECT
                CASE 
                    WHEN COUNT(DISTINCT p.id) >= 5 THEN 'vip'
                    WHEN COUNT(DISTINCT p.id) >= 2 THEN 'regular'
                    WHEN COUNT(DISTINCT p.id) = 1 THEN 'new'
                    ELSE 'prospect'
                END as segment,
                COUNT(DISTINCT c.id) as client_count,
                AVG(EXTRACT(days FROM (NOW() - c.created_at))) as avg_age_days
            FROM clients c
            LEFT JOIN practices p ON c.id = p.client_id
            GROUP BY c.id
        """)
        
        # Aggregate segmentation data
        segments = {}
        for row in cursor.fetchall():
            seg = row['segment']
            if seg not in segments:
                segments[seg] = {
                    'count': 0,
                    'avg_age_days': 0
                }
            segments[seg]['count'] += 1
            segments[seg]['avg_age_days'] = row['avg_age_days']
        
        # Client lifecycle
        cursor.execute("""
            SELECT
                DATE_TRUNC('month', first_contact_date) as cohort_month,
                COUNT(*) as clients_acquired,
                COUNT(*) FILTER (WHERE status = 'active') as still_active,
                COUNT(*) FILTER (WHERE last_interaction_date >= NOW() - INTERVAL '30 days') as recently_engaged
            FROM clients
            WHERE first_contact_date IS NOT NULL
            GROUP BY DATE_TRUNC('month', first_contact_date)
            ORDER BY cohort_month DESC
            LIMIT 12
        """)
        lifecycle = cursor.fetchall()
        
        # Top clients by revenue
        cursor.execute("""
            SELECT
                c.full_name,
                c.email,
                COUNT(p.id) as practice_count,
                SUM(p.actual_price) as total_revenue,
                MAX(p.created_at) as last_practice_date
            FROM clients c
            JOIN practices p ON c.id = p.client_id
            WHERE p.actual_price IS NOT NULL
            GROUP BY c.id, c.full_name, c.email
            ORDER BY total_revenue DESC
            LIMIT 10
        """)
        top_clients = cursor.fetchall()
        
        # At-risk clients (no interaction in 60+ days)
        cursor.execute("""
            SELECT
                c.full_name,
                c.email,
                c.assigned_to,
                c.last_interaction_date,
                EXTRACT(days FROM (NOW() - c.last_interaction_date)) as days_since_interaction
            FROM clients c
            WHERE c.status = 'active'
                AND c.last_interaction_date < NOW() - INTERVAL '60 days'
            ORDER BY c.last_interaction_date ASC
            LIMIT 20
        """)
        at_risk = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "segmentation": segments,
            "lifecycle_cohorts": [dict(l) for l in lifecycle],
            "top_clients": [dict(t) for t in top_clients],
            "at_risk_clients": [dict(a) for a in at_risk],
            "insights": {
                "total_at_risk": len(at_risk),
                "vip_percentage": (segments.get('vip', {}).get('count', 0) / sum(s['count'] for s in segments.values()) * 100) if segments else 0
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get client insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance")
async def get_performance_metrics(
    team_member: Optional[str] = Query(None, description="Specific team member email"),
    period: str = Query("30d", description="Time period: 7d, 30d, 90d")
):
    """
    Get team and individual performance metrics
    
    Returns productivity, efficiency, and quality metrics
    """
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Parse period
        days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
        start_date = datetime.now() - timedelta(days=days)
        
        if team_member:
            # Individual performance
            cursor.execute("""
                SELECT
                    %s as team_member,
                    COUNT(DISTINCT p.client_id) as clients_managed,
                    COUNT(p.id) as practices_handled,
                    COUNT(p.id) FILTER (WHERE p.status = 'completed') as practices_completed,
                    AVG(EXTRACT(days FROM (p.completion_date - p.start_date))) FILTER (WHERE p.status = 'completed') as avg_completion_time,
                    SUM(p.actual_price) FILTER (WHERE p.payment_status = 'paid') as revenue_generated,
                    COUNT(i.id) as interactions_logged
                FROM practices p
                LEFT JOIN interactions i ON i.team_member = %s AND i.interaction_date >= %s
                WHERE p.assigned_to = %s AND p.created_at >= %s
                GROUP BY p.assigned_to
            """, [team_member, team_member, start_date, team_member, start_date])
            individual = cursor.fetchone()
            
            # Activity timeline
            cursor.execute("""
                SELECT
                    DATE_TRUNC('day', interaction_date) as day,
                    COUNT(*) as interactions,
                    COUNT(DISTINCT client_id) as unique_clients
                FROM interactions
                WHERE team_member = %s AND interaction_date >= %s
                GROUP BY DATE_TRUNC('day', interaction_date)
                ORDER BY day DESC
            """, [team_member, start_date])
            activity_timeline = cursor.fetchall()
            
            result = {
                "individual_metrics": dict(individual) if individual else {},
                "activity_timeline": [dict(a) for a in activity_timeline],
                "team_comparison": None
            }
        else:
            # Team overview
            cursor.execute("""
                SELECT
                    assigned_to as team_member,
                    COUNT(DISTINCT client_id) as clients_managed,
                    COUNT(*) as practices_handled,
                    COUNT(*) FILTER (WHERE status = 'completed' AND completion_date >= %s) as recent_completions,
                    SUM(actual_price) FILTER (WHERE payment_status = 'paid') as revenue_generated,
                    AVG(EXTRACT(days FROM (completion_date - start_date))) FILTER (WHERE status = 'completed') as avg_completion_time
                FROM practices
                WHERE assigned_to IS NOT NULL AND created_at >= %s
                GROUP BY assigned_to
                ORDER BY revenue_generated DESC NULLS LAST
            """, [start_date, start_date])
            team_performance = cursor.fetchall()
            
            # Team activity heatmap
            cursor.execute("""
                SELECT
                    team_member,
                    EXTRACT(dow FROM interaction_date) as day_of_week,
                    EXTRACT(hour FROM interaction_date) as hour_of_day,
                    COUNT(*) as interaction_count
                FROM interactions
                WHERE interaction_date >= %s
                GROUP BY team_member, EXTRACT(dow FROM interaction_date), EXTRACT(hour FROM interaction_date)
            """, [start_date])
            activity_heatmap = cursor.fetchall()
            
            result = {
                "team_performance": [dict(t) for t in team_performance],
                "activity_heatmap": [dict(a) for a in activity_heatmap],
                "individual_metrics": None
            }
        
        # Overall KPIs
        cursor.execute("""
            SELECT
                AVG(EXTRACT(days FROM (completion_date - start_date))) as avg_practice_duration,
                COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) as completion_rate,
                AVG(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) * 100 as payment_collection_rate
            FROM practices
            WHERE created_at >= %s
        """, [start_date])
        kpis = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return {
            "period": period,
            "period_days": days,
            **result,
            "kpis": dict(kpis) if kpis else {},
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast")
async def get_business_forecast():
    """
    Generate business forecasts based on historical data
    
    Returns revenue projections, growth trends, and recommendations
    """
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Historical revenue trend (last 6 months)
        cursor.execute("""
            SELECT
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as practice_count,
                SUM(actual_price) as revenue
            FROM practices
            WHERE created_at >= NOW() - INTERVAL '6 months'
                AND actual_price IS NOT NULL
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        """)
        historical = cursor.fetchall()
        
        # Calculate growth rate
        if len(historical) >= 2:
            revenues = [float(h['revenue'] or 0) for h in historical]
            growth_rates = [(revenues[i] - revenues[i-1]) / revenues[i-1] if revenues[i-1] else 0 
                          for i in range(1, len(revenues))]
            avg_growth_rate = sum(growth_rates) / len(growth_rates) if growth_rates else 0
        else:
            avg_growth_rate = 0
        
        # Current month progress
        cursor.execute("""
            SELECT
                COUNT(*) as mtd_practices,
                SUM(actual_price) as mtd_revenue,
                EXTRACT(day FROM NOW()) as days_elapsed,
                EXTRACT(day FROM DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day') as total_days
            FROM practices
            WHERE created_at >= DATE_TRUNC('month', NOW())
                AND actual_price IS NOT NULL
        """)
        current_month = cursor.fetchone()
        
        # Pipeline value (active practices)
        cursor.execute("""
            SELECT
                SUM(quoted_price) as pipeline_value,
                COUNT(*) as pipeline_count,
                AVG(quoted_price) as avg_deal_size
            FROM practices
            WHERE status IN ('inquiry', 'quotation_sent', 'payment_pending', 'in_progress')
                AND quoted_price IS NOT NULL
        """)
        pipeline = cursor.fetchone()
        
        # Renewal opportunities
        cursor.execute("""
            SELECT
                COUNT(*) as renewals_due,
                SUM(quoted_price) as potential_renewal_value
            FROM practices
            WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days'
        """)
        renewals = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Calculate forecasts
        current_run_rate = float(current_month['mtd_revenue'] or 0) / current_month['days_elapsed'] * current_month['total_days'] if current_month['days_elapsed'] > 0 else 0
        
        next_month_forecast = current_run_rate * (1 + avg_growth_rate)
        quarter_forecast = next_month_forecast * 3 * (1 + avg_growth_rate) ** 2
        
        return {
            "historical_trend": [dict(h) for h in historical],
            "growth_metrics": {
                "avg_monthly_growth_rate": round(avg_growth_rate * 100, 2),
                "current_month_run_rate": round(current_run_rate, 2),
                "days_into_month": current_month['days_elapsed']
            },
            "forecasts": {
                "next_month": round(next_month_forecast, 2),
                "next_quarter": round(quarter_forecast, 2),
                "confidence": "high" if len(historical) >= 4 else "medium" if len(historical) >= 2 else "low"
            },
            "pipeline": dict(pipeline),
            "renewals": dict(renewals),
            "recommendations": [
                "Focus on converting pipeline opportunities" if pipeline['pipeline_count'] > 10 else "Increase lead generation",
                "Follow up on renewal opportunities" if renewals['renewals_due'] > 0 else "Monitor upcoming renewals",
                "Optimize pricing strategy" if pipeline['avg_deal_size'] else "Analyze pricing competitiveness"
            ],
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to generate forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def analytics_health():
    """Health check for analytics service"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        return {
            "status": "healthy",
            "service": "crm-analytics",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Analytics service unhealthy: {str(e)}"
        )
"""
TAX GENIUS API Router
Endpoints for tax intelligence, optimization, and compliance

⚠️ DEPRECATED (Phase 3): These endpoints are deprecated in favor of the universal endpoint.
Please migrate to POST /api/oracle/query for automatic intelligent routing.
These endpoints remain available for backward compatibility.

Migration example:
    OLD: POST /api/oracle/tax/search {"query": "PPh 21 rates", "limit": 10}
    NEW: POST /api/oracle/query {"query": "PPh 21 rates", "limit": 10}
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from services.search_service import SearchService
from app.dependencies import get_search_service
import psycopg2
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/api/oracle/tax", tags=["Oracle TAX"])

# Database connection
def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    try:
        yield conn
    finally:
        conn.close()

# Phase 1 Optimization: Dependency Injection
# SearchService is injected via get_search_service() dependency
# This eliminates ChromaDBClient duplication (was creating 2 instances per request)
# Memory footprint reduced by ~80%


# ========================================
# Request/Response Models
# ========================================

class TaxSearchRequest(BaseModel):
    query: str
    limit: int = 10


class CompanyProfileRequest(BaseModel):
    company_name: str
    entity_type: str  # PT_PMA, PT, CV
    industry: str
    annual_revenue: int
    profit_margin: float
    has_rnd: bool = False
    has_training: bool = False
    has_parent_abroad: bool = False
    parent_country: Optional[str] = None
    has_related_parties: bool = False
    related_party_transactions: int = 0
    entertainment_expense: int = 0
    cash_transactions: int = 0
    vat_gap: int = 0
    previous_audit: bool = False
    previous_audit_findings: int = 0


class OptimizationResponse(BaseModel):
    strategy_name: str
    strategy_type: str
    description: str
    potential_saving: str
    risk_level: str
    requirements: List[str]
    timeline: str
    legal_basis: str
    eligible: bool
    reason: Optional[str] = None


class AuditRiskResponse(BaseModel):
    overall_score: int  # 0-100
    risk_level: str  # low, medium, high, critical
    factors: List[Dict[str, Any]]
    recommendations: List[str]
    red_flags: List[str]


class ComplianceDeadline(BaseModel):
    task_name: str
    deadline_type: str
    deadline_day: str
    applies_to: Optional[str]
    penalty: Optional[str]


# ========================================
# ENDPOINTS
# ========================================

@router.post("/search")
async def search_tax_info(
    request: TaxSearchRequest,
    service: SearchService = Depends(get_search_service)
):
    """
    Semantic search for tax information
    Searches both tax updates and tax knowledge collections
    Phase 1 Optimization: Uses injected SearchService instead of creating ChromaDBClient instances
    """
    try:
        # Search tax updates (using shared collection from SearchService)
        updates_client = service.collections["tax_updates"]
        updates_results = updates_client.search(
            query_text=request.query,
            limit=request.limit // 2
        )

        # Search tax knowledge (using shared collection from SearchService)
        knowledge_client = service.collections["tax_knowledge"]
        knowledge_results = knowledge_client.search(
            query_text=request.query,
            limit=request.limit // 2
        )

        # Combine and format results
        results = []

        for doc, metadata, distance in zip(
            updates_results.get("documents", []),
            updates_results.get("metadatas", []),
            updates_results.get("distances", [])
        ):
            results.append({
                "source": "tax_updates",
                "content": doc,
                "metadata": metadata,
                "relevance": 1 - distance,
                "type": metadata.get("update_type", "general"),
                "impact": metadata.get("impact_level", "low")
            })

        for doc, metadata, distance in zip(
            knowledge_results.get("documents", []),
            knowledge_results.get("metadatas", []),
            knowledge_results.get("distances", [])
        ):
            results.append({
                "source": "tax_knowledge",
                "content": doc,
                "metadata": metadata,
                "relevance": 1 - distance,
                "category": metadata.get("category", "general")
            })

        # Sort by relevance
        results.sort(key=lambda x: x["relevance"], reverse=True)

        return {
            "query": request.query,
            "results": results[:request.limit],
            "total": len(results)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rates")
async def get_tax_rates():
    """Get current Indonesian tax rates"""
    return {
        "corporate": {
            "standard": 0.22,
            "small_business": 0.005,  # Revenue < 4.8B IDR
            "listed": 0.19,
            "description": "Corporate income tax rates"
        },
        "personal": {
            "brackets": [
                {"max": 60000000, "rate": 0.05},
                {"max": 250000000, "rate": 0.15},
                {"max": 500000000, "rate": 0.25},
                {"max": 5000000000, "rate": 0.30},
                {"max": "infinity", "rate": 0.35}
            ],
            "description": "Progressive personal income tax brackets"
        },
        "vat": {
            "current": 0.11,
            "effective_date": "2022-04-01",
            "future": 0.12,
            "future_date": "2025-01-01",
            "description": "Value Added Tax (PPN)"
        },
        "withholding": {
            "dividends_resident": 0.10,
            "dividends_nonresident": 0.20,
            "royalties_resident": 0.15,
            "royalties_nonresident": 0.20,
            "services_pph23": 0.02,
            "services_pph26": 0.20,
            "description": "Withholding tax rates"
        },
        "last_updated": "2025-10-21"
    }


@router.get("/deadlines")
async def get_compliance_deadlines(
    deadline_type: Optional[str] = None,
    conn=Depends(get_db)
):
    """
    Get tax compliance deadlines
    deadline_type: monthly, quarterly, annual
    """
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = "SELECT * FROM compliance_deadlines WHERE 1=1"
        params = []

        if deadline_type:
            query += " AND deadline_type = %s"
            params.append(deadline_type)

        query += " ORDER BY deadline_type, deadline_day"

        cursor.execute(query, params)
        deadlines = cursor.fetchall()

        return {
            "deadlines": [dict(d) for d in deadlines],
            "count": len(deadlines)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.post("/optimize")
async def analyze_tax_optimization(
    profile: CompanyProfileRequest,
    conn=Depends(get_db)
):
    """
    Analyze tax optimization opportunities for a company
    Returns eligible strategies with potential savings
    """
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get all active strategies
        cursor.execute("""
            SELECT * FROM tax_optimization_strategies
            WHERE active = true
        """)
        strategies = cursor.fetchall()

        optimizations = []

        for strategy in strategies:
            eligible = False
            reason = None
            potential_saving = "Calculation required"

            # Check eligibility
            criteria = strategy.get('eligibility_criteria', {})

            if strategy['strategy_type'] == 'small_business_rate':
                eligible = profile.annual_revenue < criteria.get('revenue_max', 4800000000)
                if eligible:
                    standard_tax = profile.annual_revenue * 0.22
                    small_business_tax = profile.annual_revenue * 0.005
                    saving = standard_tax - small_business_tax
                    potential_saving = f"{int(saving):,} IDR annually"
                else:
                    reason = f"Revenue {profile.annual_revenue:,} exceeds limit"

            elif strategy['strategy_type'] == 'super_deduction':
                if 'R&D' in strategy['strategy_name']:
                    eligible = profile.has_rnd
                    reason = "No R&D activities" if not eligible else None
                elif 'Training' in strategy['strategy_name']:
                    eligible = profile.has_training
                    reason = "No vocational training" if not eligible else None

            elif strategy['strategy_type'] == 'treaty_benefits':
                eligible = profile.has_parent_abroad and profile.parent_country is not None
                reason = "No parent company abroad" if not eligible else None

            optimizations.append({
                "strategy_name": strategy['strategy_name'],
                "strategy_type": strategy['strategy_type'],
                "description": strategy['description'],
                "potential_saving": potential_saving,
                "risk_level": strategy['risk_level'],
                "requirements": strategy['requirements'],
                "timeline": strategy['timeline'],
                "legal_basis": strategy['legal_basis'],
                "eligible": eligible,
                "reason": reason
            })

        # Calculate total potential savings (for eligible strategies)
        eligible_count = sum(1 for o in optimizations if o['eligible'])

        return {
            "company_name": profile.company_name,
            "optimizations": optimizations,
            "eligible_count": eligible_count,
            "total_strategies": len(optimizations)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.post("/audit-risk")
async def assess_audit_risk(profile: CompanyProfileRequest):
    """
    Assess tax audit risk score for a company
    Returns risk score (0-100) and recommendations
    """
    try:
        score = 0
        factors = []
        recommendations = []
        red_flags = []

        # Profit margin check
        if profile.profit_margin < 0.05:  # Less than 5%
            factor_score = 20
            score += factor_score
            factors.append({
                "factor": "Low profit margin",
                "value": f"{profile.profit_margin * 100:.1f}%",
                "impact": factor_score,
                "description": "Profit margin significantly below industry average"
            })
            red_flags.append("Profit margin below 5%")
            recommendations.append("Prepare documentation justifying low margins")

        # Entertainment expenses
        if profile.annual_revenue > 0:
            entertainment_ratio = profile.entertainment_expense / profile.annual_revenue
            if entertainment_ratio > 0.01:  # More than 1%
                factor_score = 15
                score += factor_score
                factors.append({
                    "factor": "High entertainment expenses",
                    "value": f"{entertainment_ratio * 100:.2f}% of revenue",
                    "impact": factor_score,
                    "description": "Entertainment expenses exceed normal thresholds"
                })
                recommendations.append("Review entertainment expense documentation and business purpose")

        # Related party transactions
        if profile.has_related_parties:
            if profile.annual_revenue > 0:
                rp_ratio = profile.related_party_transactions / profile.annual_revenue
                if rp_ratio > 0.3:  # More than 30%
                    factor_score = 25
                    score += factor_score
                    factors.append({
                        "factor": "High related party transactions",
                        "value": f"{rp_ratio * 100:.1f}% of revenue",
                        "impact": factor_score,
                        "description": "Significant related party transaction volume"
                    })
                    red_flags.append("Related party transactions exceed 30% of revenue")
                    recommendations.append("Ensure transfer pricing documentation is complete and up-to-date")

        # Cash transactions
        if profile.annual_revenue > 0:
            cash_ratio = profile.cash_transactions / profile.annual_revenue
            if cash_ratio > 0.1:  # More than 10%
                factor_score = 10
                score += factor_score
                factors.append({
                    "factor": "High cash transaction ratio",
                    "value": f"{cash_ratio * 100:.1f}% of revenue",
                    "impact": factor_score,
                    "description": "High proportion of cash transactions"
                })
                recommendations.append("Improve transaction documentation and digital payment adoption")

        # VAT compliance
        if profile.vat_gap > 0:
            factor_score = 20
            score += factor_score
            factors.append({
                "factor": "VAT gap detected",
                "value": f"{profile.vat_gap:,} IDR",
                "impact": factor_score,
                "description": "Mismatch between VAT input and output"
            })
            red_flags.append("VAT reconciliation issues")
            recommendations.append("Review VAT calculations and reconcile input/output VAT")

        # Previous audit findings
        if profile.previous_audit and profile.previous_audit_findings > 0:
            factor_score = 10
            score += factor_score
            factors.append({
                "factor": "Previous audit findings",
                "value": f"{profile.previous_audit_findings} findings",
                "impact": factor_score,
                "description": "Previous tax audit resulted in findings"
            })
            recommendations.append("Ensure all previous audit issues have been resolved")

        # Determine risk level
        if score >= 70:
            risk_level = "critical"
        elif score >= 50:
            risk_level = "high"
        elif score >= 30:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Add general recommendations if low risk
        if not recommendations:
            recommendations.append("Maintain current compliance standards")
            recommendations.append("Keep documentation organized and accessible")

        return {
            "company_name": profile.company_name,
            "overall_score": min(score, 100),
            "risk_level": risk_level,
            "factors": factors,
            "recommendations": recommendations,
            "red_flags": red_flags,
            "assessment_date": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/treaties")
async def get_tax_treaties(
    country: Optional[str] = None,
    conn=Depends(get_db)
):
    """
    Get tax treaty benefits
    country: Filter by specific country
    """
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        if country:
            cursor.execute("""
                SELECT * FROM tax_treaty_benefits
                WHERE active = true AND country_name ILIKE %s
            """, (f"%{country}%",))
        else:
            cursor.execute("""
                SELECT * FROM tax_treaty_benefits
                WHERE active = true
                ORDER BY country_name
            """)

        treaties = cursor.fetchall()

        return {
            "treaties": [dict(t) for t in treaties],
            "count": len(treaties)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.get("/updates/recent")
async def get_recent_tax_updates(
    hours: int = 168,  # Default 7 days
    service: SearchService = Depends(get_search_service)
):
    """
    Get recent tax updates from ChromaDB
    hours: How many hours back to look (default 168 = 7 days)
    Phase 1 Optimization: Uses injected SearchService
    """
    try:
        client = service.collections["tax_updates"]

        # Get all updates (Qdrant: use peek for now)
        # TODO: Implement Qdrant filter support for time-based filtering
        results = client.peek(limit=100)

        # Format results
        updates = []
        for doc, metadata in zip(results['documents'], results['metadatas']):
            updates.append({
                "title": metadata.get("source", "Tax Update"),
                "content": doc[:300] + "..." if len(doc) > 300 else doc,
                "source": metadata.get("source", "Unknown"),
                "update_type": metadata.get("update_type", "general"),
                "impact_level": metadata.get("impact_level", "low"),
                "scraped_at": metadata.get("scraped_at", "")
            })

        # Sort by scraped_at (most recent first)
        updates.sort(key=lambda x: x.get("scraped_at", ""), reverse=True)

        return {
            "updates": updates[:20],  # Return top 20
            "count": len(updates)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/company/save")
async def save_company_profile(
    profile: CompanyProfileRequest,
    user_id: str,
    conn=Depends(get_db)
):
    """Save company profile for future analysis"""
    try:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO company_profiles (
                company_name, entity_type, industry, annual_revenue, profit_margin,
                has_rnd, has_training, has_parent_abroad, parent_country, has_related_parties,
                related_party_transactions, entertainment_expense, cash_transactions, vat_gap,
                previous_audit, previous_audit_findings, user_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            profile.company_name, profile.entity_type, profile.industry,
            profile.annual_revenue, profile.profit_margin, profile.has_rnd,
            profile.has_training, profile.has_parent_abroad, profile.parent_country,
            profile.has_related_parties, profile.related_party_transactions,
            profile.entertainment_expense, profile.cash_transactions, profile.vat_gap,
            profile.previous_audit, profile.previous_audit_findings, user_id
        ))

        company_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "success": True,
            "company_id": company_id,
            "message": "Company profile saved successfully"
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

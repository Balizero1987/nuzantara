"""
LEGAL ARCHITECT API Router
Endpoints for property intelligence, due diligence, and legal structures

⚠️ DEPRECATED (Phase 3): These endpoints are deprecated in favor of the universal endpoint.
Please migrate to POST /api/oracle/query for automatic intelligent routing.
These endpoints remain available for backward compatibility.

Migration example:
    OLD: POST /api/oracle/property/search {"query": "villas in Canggu", "limit": 10}
    NEW: POST /api/oracle/query {"query": "villas for sale in Canggu", "limit": 10}
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from services.search_service import SearchService
from app.dependencies import get_search_service
import psycopg2
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/api/oracle/property", tags=["Oracle PROPERTY"])

# Database connection
def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    try:
        yield conn
    finally:
        conn.close()

# Phase 1 Optimization: Dependency Injection
# SearchService is injected via get_search_service() dependency
# This eliminates ChromaDBClient duplication (was creating 6 instances across endpoints)
# Memory footprint reduced by ~80%


# ========================================
# Request/Response Models
# ========================================

class PropertySearchRequest(BaseModel):
    query: str
    area: Optional[str] = None
    property_type: Optional[str] = None
    ownership: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    limit: int = 20


class BuyerProfile(BaseModel):
    nationality: str
    buyer_type: str  # individual, company
    spouse_indonesian: bool = False
    has_kitas: bool = False
    budget: int
    property_purpose: str  # residence, investment, commercial


class DueDiligenceRequest(BaseModel):
    property_id: int


class MarketAnalysisRequest(BaseModel):
    area: str
    period_days: int = 30


# ========================================
# ENDPOINTS
# ========================================

@router.post("/search")
async def search_properties(
    request: PropertySearchRequest,
    service: SearchService = Depends(get_search_service)
):
    """
    Semantic search for property listings
    Searches ChromaDB property_listings collection
    Phase 1 Optimization: Uses injected SearchService
    """
    try:
        client = service.collections["property_listings"]

        # Build metadata filter
        where_filter = {}

        if request.area:
            where_filter["area"] = request.area

        if request.property_type:
            where_filter["property_type"] = request.property_type

        if request.ownership:
            where_filter["ownership"] = request.ownership

        # Search with semantic query and filters
        results = client.search(
            query_text=request.query,
            filter=where_filter if where_filter else None,
            limit=request.limit
        )

        # Format and filter by price
        properties = []
        for doc, metadata, distance in zip(
            results.get("documents", []),
            results.get("metadatas", []),
            results.get("distances", [])
        ):
            price = metadata.get("price", 0)

            # Apply price filters
            if request.min_price and price < request.min_price:
                continue
            if request.max_price and price > request.max_price:
                continue

            properties.append({
                "content": doc,
                "area": metadata.get("area"),
                "property_type": metadata.get("property_type"),
                "ownership": metadata.get("ownership"),
                "price": price,
                "size_are": metadata.get("size", 0),
                "price_per_are": metadata.get("price_per_are", 0),
                "market_position": metadata.get("market_position"),
                "source": metadata.get("source"),
                "source_url": metadata.get("source_url"),
                "relevance": 1 - distance
            })

        # Sort by relevance
        properties.sort(key=lambda x: x["relevance"], reverse=True)

        return {
            "query": request.query,
            "properties": properties,
            "total": len(properties),
            "filters": {
                "area": request.area,
                "property_type": request.property_type,
                "ownership": request.ownership,
                "price_range": f"{request.min_price or 0:,} - {request.max_price or 'unlimited':,}"
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/listings")
async def get_property_listings(
    area: Optional[str] = None,
    property_type: Optional[str] = None,
    ownership: Optional[str] = None,
    limit: int = 20,
    conn=Depends(get_db)
):
    """
    Get property listings from database
    With optional filters
    """
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = "SELECT * FROM property_listings WHERE 1=1"
        params = []

        if area:
            query += " AND area = %s"
            params.append(area)

        if property_type:
            query += " AND property_type = %s"
            params.append(property_type)

        if ownership:
            query += " AND ownership = %s"
            params.append(ownership)

        query += " ORDER BY scraped_at DESC LIMIT %s"
        params.append(limit)

        cursor.execute(query, params)
        listings = cursor.fetchall()

        return {
            "listings": [dict(l) for l in listings],
            "count": len(listings)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.get("/market/{area}")
async def get_market_analysis(
    area: str,
    conn=Depends(get_db),
    service: SearchService = Depends(get_search_service)
):
    """
    Get market analysis for a specific area
    Returns latest market data and trends
    Phase 1 Optimization: Uses injected SearchService
    """
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get latest market data
        cursor.execute("""
            SELECT * FROM property_market_data
            WHERE area = %s
            ORDER BY period_start DESC
            LIMIT 1
        """, (area,))

        market_data = cursor.fetchone()

        if not market_data:
            # Return area knowledge from property_knowledge collection
            knowledge_client = service.collections["property_knowledge"]

            results = knowledge_client.collection.get(
                where={"area": area},
                limit=1,
                include=["documents", "metadatas"]
            )

            if results['documents']:
                return {
                    "area": area,
                    "source": "knowledge_base",
                    "content": results['documents'][0],
                    "metadata": results['metadatas'][0]
                }
            else:
                raise HTTPException(status_code=404, detail=f"No market data found for {area}")

        return {
            "area": area,
            "market_data": dict(market_data),
            "source": "scraped_data"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.post("/due-diligence")
async def perform_due_diligence(
    request: DueDiligenceRequest,
    conn=Depends(get_db)
):
    """
    Perform due diligence check on a property
    Returns risk assessment and recommendations
    """
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get property listing
        cursor.execute("""
            SELECT * FROM property_listings
            WHERE id = %s
        """, (request.property_id,))

        property_data = cursor.fetchone()

        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")

        property_data = dict(property_data)

        # Perform checks
        checks = []
        red_flags = []
        opportunities = list(property_data.get('opportunities', []))

        # 1. Ownership check
        if property_data['ownership'] == 'freehold':
            checks.append({
                "category": "Ownership",
                "item": "Ownership type verification",
                "status": "warning",
                "details": "Freehold ownership not available to foreigners",
                "action": "Requires PT PMA company or nominee structure (risky)"
            })
            red_flags.append("Freehold requires special structure")
        else:
            checks.append({
                "category": "Ownership",
                "item": "Ownership type verification",
                "status": "clear",
                "details": f"{property_data['ownership']} ownership - foreign eligible",
                "action": None
            })

        # 2. Price analysis
        # Get market average for area
        cursor.execute("""
            SELECT avg_price_per_are FROM property_market_data
            WHERE area = %s
            ORDER BY period_start DESC
            LIMIT 1
        """, (property_data['area'],))

        market_avg = cursor.fetchone()

        if market_avg and property_data.get('price_per_are'):
            avg_price = market_avg['avg_price_per_are']
            listed_price = property_data['price_per_are']

            ratio = listed_price / avg_price if avg_price > 0 else 1

            if ratio > 1.2:
                status = "issue"
                action = "Negotiate price down significantly"
                red_flags.append("Price 20%+ above market average")
            elif ratio > 1.1:
                status = "warning"
                action = "Negotiate price down"
            else:
                status = "clear"
                action = None
                if ratio < 0.9:
                    opportunities.append(f"Below market price ({ratio*100:.0f}% of average)")

            checks.append({
                "category": "Valuation",
                "item": "Market price analysis",
                "status": status,
                "details": f"Listed at {listed_price:,}/are, market avg {avg_price:,}/are ({ratio*100:.0f}% of market)",
                "action": action
            })

        # 3. Location assessment
        risks = list(property_data.get('risks', []))

        if risks:
            checks.append({
                "category": "Location",
                "item": "Area risk assessment",
                "status": "warning",
                "details": ", ".join(risks),
                "action": "Consider location-specific risks before purchase"
            })
        else:
            checks.append({
                "category": "Location",
                "item": "Area risk assessment",
                "status": "clear",
                "details": "No significant location risks identified",
                "action": None
            })

        # Calculate overall risk
        issue_count = sum(1 for c in checks if c['status'] == 'issue')
        warning_count = sum(1 for c in checks if c['status'] == 'warning')

        if issue_count > 2:
            overall_risk = "critical"
            recommendation = "avoid"
        elif issue_count > 0 or warning_count > 3:
            overall_risk = "high"
            recommendation = "proceed_with_caution"
        elif warning_count > 0:
            overall_risk = "medium"
            recommendation = "proceed_with_caution"
        else:
            overall_risk = "low"
            recommendation = "proceed"

        # Save due diligence report
        cursor.execute("""
            INSERT INTO property_due_diligence (
                property_listing_id, overall_risk, recommendation,
                checks, red_flags, opportunities, estimated_value, confidence_score
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            request.property_id, overall_risk, recommendation,
            psycopg2.extras.Json(checks), red_flags, opportunities,
            property_data.get('price'), 0.75
        ))

        dd_id = cursor.fetchone()['id']
        conn.commit()

        return {
            "property_id": request.property_id,
            "due_diligence_id": dd_id,
            "property_title": property_data['title'],
            "overall_risk": overall_risk,
            "recommendation": recommendation,
            "checks": checks,
            "red_flags": red_flags,
            "opportunities": opportunities,
            "estimated_value": property_data.get('price'),
            "assessment_date": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.post("/recommend-structure")
async def recommend_legal_structure(
    buyer_profile: BuyerProfile,
    conn=Depends(get_db)
):
    """
    Recommend legal structures for property ownership
    Based on buyer profile (nationality, type, etc)
    """
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get all legal structures
        cursor.execute("""
            SELECT * FROM property_legal_structures
            ORDER BY foreign_eligible DESC, setup_cost_min ASC
        """)

        structures = cursor.fetchall()

        # Filter and rank structures
        recommendations = []

        for structure in structures:
            structure = dict(structure)
            suitable = False
            score = 0
            notes = []

            # Check foreign eligibility
            if buyer_profile.nationality != "Indonesian":
                if not structure['foreign_eligible']:
                    continue  # Skip if not foreign eligible
                else:
                    suitable = True
                    score += 10

            else:  # Indonesian
                suitable = True
                score += 15  # Advantage for Indonesian buyers

            # Consider buyer type
            if buyer_profile.buyer_type == "individual":
                if structure['structure_type'] in ['HAK_PAKAI', 'LEASEHOLD']:
                    score += 10
                    notes.append("Suitable for individual ownership")
                elif structure['structure_type'] == 'PT_PMA':
                    score -= 5
                    notes.append("Company structure - may be overkill for individual")

            elif buyer_profile.buyer_type == "company":
                if structure['structure_type'] == 'PT_PMA':
                    score += 15
                    notes.append("Ideal for company ownership and asset protection")

            # Consider spouse
            if buyer_profile.spouse_indonesian and buyer_profile.buyer_type == "individual":
                # Prenup option would be added separately
                notes.append("Consider prenuptial agreement structure with Indonesian spouse")
                score += 5

            # Consider budget
            setup_cost_avg = (structure['setup_cost_min'] + structure['setup_cost_max']) / 2
            if setup_cost_avg > buyer_profile.budget * 0.05:  # More than 5% of budget
                score -= 10
                notes.append("Setup cost is significant relative to budget")

            # Consider KITAS
            if buyer_profile.has_kitas and structure['structure_type'] == 'HAK_PAKAI':
                score += 5
                notes.append("KITAS holder - eligible for Hak Pakai")

            if suitable:
                recommendations.append({
                    **structure,
                    "suitability_score": score,
                    "notes": notes
                })

        # Sort by suitability score
        recommendations.sort(key=lambda x: x['suitability_score'], reverse=True)

        return {
            "buyer_profile": {
                "nationality": buyer_profile.nationality,
                "buyer_type": buyer_profile.buyer_type,
                "spouse_indonesian": buyer_profile.spouse_indonesian,
                "budget": buyer_profile.budget
            },
            "recommendations": recommendations[:5],  # Top 5
            "total_options": len(recommendations)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.get("/structures")
async def get_legal_structures(conn=Depends(get_db)):
    """Get all available legal structures for property ownership"""
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT * FROM property_legal_structures
            ORDER BY foreign_eligible DESC, structure_type
        """)

        structures = cursor.fetchall()

        return {
            "structures": [dict(s) for s in structures],
            "count": len(structures)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@router.get("/ownership-types")
async def get_ownership_types(service: SearchService = Depends(get_search_service)):
    """Get property ownership types information from knowledge base. Phase 1 Optimization: Uses injected SearchService"""
    try:
        client = service.collections["property_knowledge"]

        results = client.collection.get(
            where={"category": "ownership_types"},
            include=["documents", "metadatas"]
        )

        ownership_types = []
        for doc, metadata in zip(results['documents'], results['metadatas']):
            ownership_types.append({
                "type": metadata.get("ownership_type"),
                "foreign_eligible": metadata.get("foreign_eligible") == "True",
                "description": doc
            })

        return {
            "ownership_types": ownership_types,
            "count": len(ownership_types)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/areas")
async def get_areas_info(service: SearchService = Depends(get_search_service)):
    """Get all Bali areas with market information. Phase 1 Optimization: Uses injected SearchService"""
    try:
        client = service.collections["property_knowledge"]

        results = client.collection.get(
            where={"category": "area_knowledge"},
            include=["documents", "metadatas"]
        )

        areas = []
        for doc, metadata in zip(results['documents'], results['metadatas']):
            areas.append({
                "area": metadata.get("area"),
                "avg_price": metadata.get("avg_price"),
                "trend": metadata.get("trend"),
                "description": doc
            })

        # Sort by name
        areas.sort(key=lambda x: x['area'])

        return {
            "areas": areas,
            "count": len(areas)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/legal-updates")
async def get_legal_updates(limit: int = 20, service: SearchService = Depends(get_search_service)):
    """Get recent legal and property law updates. Phase 1 Optimization: Uses injected SearchService"""
    try:
        client = service.collections["legal_updates"]

        results = client.collection.get(
            limit=limit,
            include=["documents", "metadatas"]
        )

        updates = []
        for doc, metadata in zip(results['documents'], results['metadatas']):
            updates.append({
                "content": doc[:300] + "..." if len(doc) > 300 else doc,
                "source": metadata.get("source"),
                "source_url": metadata.get("source_url"),
                "scraped_at": metadata.get("scraped_at")
            })

        # Sort by date
        updates.sort(key=lambda x: x.get("scraped_at", ""), reverse=True)

        return {
            "updates": updates,
            "count": len(updates)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search/knowledge")
async def search_property_knowledge(query: str, limit: int = 10, service: SearchService = Depends(get_search_service)):
    """
    Search property knowledge base
    Covers ownership types, areas, legal structures, etc
    Phase 1 Optimization: Uses injected SearchService
    """
    try:
        client = service.collections["property_knowledge"]

        results = client.search(
            query_text=query,
            limit=limit
        )

        knowledge = []
        for doc, metadata, distance in zip(
            results.get("documents", []),
            results.get("metadatas", []),
            results.get("distances", [])
        ):
            knowledge.append({
                "content": doc,
                "category": metadata.get("category"),
                "metadata": metadata,
                "relevance": 1 - distance
            })

        return {
            "query": query,
            "results": knowledge,
            "count": len(knowledge)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

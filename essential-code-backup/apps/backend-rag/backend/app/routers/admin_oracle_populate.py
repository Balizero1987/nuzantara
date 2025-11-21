"""
TEMPORARY ADMIN ENDPOINT - Populate Oracle Collections
Single-use GET endpoint to populate Oracle ChromaDB on production

DELETE THIS FILE AFTER SUCCESSFUL MIGRATION
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from core.embeddings import EmbeddingsGenerator
from core.qdrant_db import QdrantClient

router = APIRouter(prefix="/admin", tags=["Admin - TEMPORARY"])


@router.get("/populate-oracle")
async def populate_oracle_collections():
    """
    TEMPORARY ADMIN ENDPOINT - Populate Oracle collections on production

    This is a one-time migration endpoint. Call it once, then delete this file.

    Usage:
        GET /admin/populate-oracle

    Returns:
        Migration status and document counts
    """

    try:
        embedder = EmbeddingsGenerator()
        results = {}

        # ========================================
        # 1. TAX UPDATES (6 documents)
        # ========================================

        tax_updates = [
            {
                "id": "tax_update_2025_001",
                "date": "2025-01-15",
                "title": "New PPh 21 Regulation 2025",
                "source": "DJP (Direktorat Jenderal Pajak)",
                "category": "income_tax",
                "impact": "high",
                "summary": "Income tax rates updated - top rate reduced from 25% to 22%",
                "details": "Progressive tax rates changed for annual income above IDR 500 million"
            },
            {
                "id": "tax_update_2025_002",
                "date": "2025-04-01",
                "title": "VAT Increase to 12%",
                "source": "Ministry of Finance",
                "category": "vat",
                "impact": "critical",
                "summary": "VAT rate increases from 11% to 12%",
                "details": "Effective April 1, 2025. All businesses must update invoicing systems"
            },
            {
                "id": "tax_update_2025_003",
                "date": "2025-03-10",
                "title": "Tax Amnesty Extension",
                "source": "DJP",
                "category": "tax_amnesty",
                "impact": "medium",
                "summary": "Voluntary disclosure program extended until June 30, 2025",
                "details": "Reduced penalties (50% discount) for voluntary disclosure"
            },
            {
                "id": "tax_update_2025_004",
                "date": "2025-02-01",
                "title": "Carbon Tax Implementation",
                "source": "Ministry of Finance",
                "category": "carbon_tax",
                "impact": "high",
                "summary": "Carbon tax IDR 30,000/ton CO2 for coal power plants",
                "details": "Pilot phase: coal-based power generation only"
            },
            {
                "id": "tax_update_2025_005",
                "date": "2025-01-20",
                "title": "E-Invoicing Mandatory Expansion",
                "source": "DJP",
                "category": "compliance",
                "impact": "critical",
                "summary": "E-faktur 4.0 mandatory for all PKP by July 1",
                "details": "Real-time reporting to DJP systems required"
            },
            {
                "id": "tax_update_2025_006",
                "date": "2025-03-01",
                "title": "Transfer Pricing Documentation Updates",
                "source": "DJP",
                "category": "transfer_pricing",
                "impact": "medium",
                "summary": "New CbCR thresholds and deadlines",
                "details": "Threshold reduced to IDR 10 trillion consolidated revenue"
            }
        ]

        tax_texts = []
        tax_metadatas = []
        tax_ids = []

        for update in tax_updates:
            text = f"""Tax Update: {update['title']}
Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}
Summary: {update['summary']}
Details: {update['details']}"""

            tax_texts.append(text)
            tax_metadatas.append({
                "id": update["id"],
                "title": update["title"],
                "date": update["date"],
                "category": update["category"]
            })
            tax_ids.append(update["id"])

        tax_embeddings = [embedder.generate_single_embedding(text) for text in tax_texts]

        tax_collection = QdrantClient(collection_name="tax_updates")
        tax_collection.upsert_documents(
            chunks=tax_texts,
            embeddings=tax_embeddings,
            metadatas=tax_metadatas,
            ids=tax_ids
        )

        results["tax_updates"] = len(tax_texts)

        # ========================================
        # 2. LEGAL UPDATES (7 documents)
        # ========================================

        legal_updates = [
            {
                "id": "legal_2025_001",
                "date": "2025-01-20",
                "title": "PT PMA Minimum Capital Reduced",
                "source": "BKPM Regulation",
                "category": "company_law",
                "impact": "medium",
                "summary": "Minimum capital reduced from IDR 10B to IDR 5B for tech/creative",
                "details": "Applies to technology startups and creative industries"
            },
            {
                "id": "legal_2025_002",
                "date": "2025-02-15",
                "title": "Minimum Wage Increase 2025",
                "source": "Ministry of Manpower",
                "category": "labor_law",
                "impact": "high",
                "summary": "Provincial minimum wages increased 6.5% average",
                "details": "Jakarta: IDR 5.3M (up from IDR 5.0M). Bali: IDR 3.2M"
            },
            {
                "id": "legal_2025_003",
                "date": "2025-01-10",
                "title": "OSS Face Recognition Requirement",
                "source": "BKPM",
                "category": "business_licensing",
                "impact": "medium",
                "summary": "Biometric verification required for new license applications",
                "details": "Directors must complete face recognition at OSS centers"
            },
            {
                "id": "legal_2025_004",
                "date": "2025-03-05",
                "title": "AMDAL Stricter Requirements",
                "source": "Ministry of Environment",
                "category": "environmental_law",
                "impact": "high",
                "summary": "Environmental impact assessments for smaller projects",
                "details": "Threshold reduced to land >2 hectares (from 5 ha)"
            },
            {
                "id": "legal_2025_005",
                "date": "2025-02-20",
                "title": "IMB Digitalization Complete",
                "source": "Ministry of Public Works",
                "category": "construction_permits",
                "impact": "medium",
                "summary": "Building permits (IMB) now fully digital",
                "details": "Average processing time reduced to 7 working days"
            },
            {
                "id": "legal_2025_006",
                "date": "2025-01-25",
                "title": "Property Leasehold Extension Simplified",
                "source": "Ministry of Agrarian Affairs",
                "category": "property_law",
                "impact": "medium",
                "summary": "Leasehold extension now 30 days instead of 90",
                "details": "Automatic extension if no violations. Flat IDR 10M fee"
            },
            {
                "id": "legal_2025_007",
                "date": "2025-03-15",
                "title": "Foreign Worker Quota Changes",
                "source": "Ministry of Manpower",
                "category": "immigration_labor",
                "impact": "high",
                "summary": "Expatriate quotas increased for IT and healthcare",
                "details": "IT/software: 50% foreign workers (up from 30%)"
            }
        ]

        legal_texts = []
        legal_metadatas = []
        legal_ids = []

        for update in legal_updates:
            text = f"""Legal Update: {update['title']}
Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}
Summary: {update['summary']}
Details: {update['details']}"""

            legal_texts.append(text)
            legal_metadatas.append({
                "id": update["id"],
                "title": update["title"],
                "date": update["date"],
                "category": update["category"]
            })
            legal_ids.append(update["id"])

        legal_embeddings = [embedder.generate_single_embedding(text) for text in legal_texts]

        legal_collection = QdrantClient(collection_name="legal_updates")
        legal_collection.upsert_documents(
            chunks=legal_texts,
            embeddings=legal_embeddings,
            metadatas=legal_metadatas,
            ids=legal_ids
        )

        results["legal_updates"] = len(legal_texts)

        # ========================================
        # 3. PROPERTY LISTINGS (4 documents)
        # ========================================

        property_listings = [
            {
                "id": "prop_001",
                "title": "Luxury Villa in Canggu",
                "location": "Canggu, Bali",
                "type": "villa",
                "price": "IDR 15,000,000,000",
                "ownership": "Leasehold 25 years",
                "description": "4-bed villa with ocean view, 500m², private pool",
                "features": ["4 bedrooms", "ocean view", "pool", "modern kitchen"]
            },
            {
                "id": "prop_002",
                "title": "Seminyak Beachfront Villa",
                "location": "Seminyak, Bali",
                "type": "villa",
                "price": "IDR 25,000,000,000",
                "ownership": "Freehold via Nominee",
                "description": "6-bed beachfront villa, 800m², direct beach access",
                "features": ["6 bedrooms", "beachfront", "800m²", "gym"]
            },
            {
                "id": "prop_003",
                "title": "Ubud Rice Field Villa",
                "location": "Ubud, Bali",
                "type": "villa",
                "price": "IDR 8,500,000,000",
                "ownership": "Leasehold 30 years renewable",
                "description": "3-bed eco villa overlooking rice terraces",
                "features": ["3 bedrooms", "rice field view", "yoga pavilion"]
            },
            {
                "id": "prop_004",
                "title": "Sanur Commercial Property",
                "location": "Sanur, Bali",
                "type": "commercial",
                "price": "IDR 45,000,000,000",
                "ownership": "HGB 30 years",
                "description": "Prime commercial building, 1200m², beach road",
                "features": ["commercial zoning", "1200m²", "high traffic"]
            }
        ]

        prop_texts = []
        prop_metadatas = []
        prop_ids = []

        for prop in property_listings:
            text = f"""Property: {prop['title']}
Location: {prop['location']}
Type: {prop['type']}
Price: {prop['price']}
Ownership: {prop['ownership']}
Description: {prop['description']}
Features: {', '.join(prop['features'])}"""

            prop_texts.append(text)
            prop_metadatas.append({
                "id": prop["id"],
                "title": prop["title"],
                "location": prop["location"],
                "type": prop["type"]
            })
            prop_ids.append(prop["id"])

        prop_embeddings = [embedder.generate_single_embedding(text) for text in prop_texts]

        prop_collection = QdrantClient(collection_name="property_listings")
        prop_collection.upsert_documents(
            chunks=prop_texts,
            embeddings=prop_embeddings,
            metadatas=prop_metadatas,
            ids=prop_ids
        )

        results["property_listings"] = len(prop_texts)

        # ========================================
        # SUMMARY
        # ========================================

        total = sum(results.values())

        return {
            "success": True,
            "message": "Oracle collections populated successfully on production ChromaDB",
            "collections": results,
            "total_documents": total,
            "next_steps": [
                "Test /api/oracle/query endpoint",
                "Verify data with /api/oracle/tax/updates/recent",
                "DELETE admin_oracle_populate.py file from repository"
            ]
        }

    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "Migration failed - check logs for details"
        }

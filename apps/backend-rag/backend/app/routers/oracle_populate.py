"""
Oracle Populate Endpoint - ONE-TIME USE
Simple endpoint to populate Oracle collections on Fly.io

Call this endpoint ONCE, then remove this file
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

router = APIRouter(prefix="/admin", tags=["ADMIN"])


@router.post("/populate-oracle")
async def populate_oracle():
    """
    ONE-TIME ENDPOINT: Populate Oracle collections

    This endpoint should be called once on Fly.io production, then removed.
    """

    try:
        embedder = EmbeddingsGenerator()
        results = {}

        # TAX UPDATES
        tax_updates = [
            {"id": "tax_001", "title": "PPh 21 Rate Change 2025", "category": "income_tax",
             "summary": "Top rate reduced from 25% to 22% for income above IDR 500M"},
            {"id": "tax_002", "title": "VAT Increase to 12%", "category": "vat",
             "summary": "VAT increases from 11% to 12% effective April 1, 2025"}
        ]

        tax_texts = [f"Tax Update: {u['title']}\nCategory: {u['category']}\nSummary: {u['summary']}"
                     for u in tax_updates]
        tax_embeddings = [embedder.generate_single_embedding(t) for t in tax_texts]
        tax_ids = [u['id'] for u in tax_updates]
        tax_meta = [{"id": u['id'], "title": u['title'], "category": u['category']}
                    for u in tax_updates]

        tax_coll = ChromaDBClient(collection_name="tax_updates")
        tax_coll.upsert_documents(chunks=tax_texts, embeddings=tax_embeddings,
                                  metadatas=tax_meta, ids=tax_ids)
        results['tax_updates'] = len(tax_texts)

        # LEGAL UPDATES
        legal_updates = [
            {"id": "legal_001", "title": "PT PMA Capital Reduced", "category": "company_law",
             "summary": "Minimum capital reduced from IDR 10B to IDR 5B for tech sectors"},
            {"id": "legal_002", "title": "Minimum Wage Increase", "category": "labor_law",
             "summary": "Provincial wages increased 6.5% average - Jakarta IDR 5.3M"}
        ]

        legal_texts = [f"Legal Update: {u['title']}\nCategory: {u['category']}\nSummary: {u['summary']}"
                       for u in legal_updates]
        legal_embeddings = [embedder.generate_single_embedding(t) for t in legal_texts]
        legal_ids = [u['id'] for u in legal_updates]
        legal_meta = [{"id": u['id'], "title": u['title'], "category": u['category']}
                      for u in legal_updates]

        legal_coll = ChromaDBClient(collection_name="legal_updates")
        legal_coll.upsert_documents(chunks=legal_texts, embeddings=legal_embeddings,
                                    metadatas=legal_meta, ids=legal_ids)
        results['legal_updates'] = len(legal_texts)

        # PROPERTY LISTINGS
        properties = [
            {"id": "prop_001", "title": "Canggu Villa", "location": "Canggu",
             "price": "IDR 15B", "desc": "4BR villa with ocean view, private pool"},
            {"id": "prop_002", "title": "Seminyak Beachfront", "location": "Seminyak",
             "price": "IDR 25B", "desc": "6BR beachfront villa, direct beach access"}
        ]

        prop_texts = [f"Property: {p['title']}\nLocation: {p['location']}\nPrice: {p['price']}\n{p['desc']}"
                      for p in properties]
        prop_embeddings = [embedder.generate_single_embedding(t) for t in prop_texts]
        prop_ids = [p['id'] for p in properties]
        prop_meta = [{"id": p['id'], "title": p['title'], "location": p['location']}
                     for p in properties]

        prop_coll = ChromaDBClient(collection_name="property_listings")
        prop_coll.upsert_documents(chunks=prop_texts, embeddings=prop_embeddings,
                                   metadatas=prop_meta, ids=prop_ids)
        results['property_listings'] = len(prop_texts)

        return {
            "success": True,
            "message": "Oracle collections populated successfully",
            "results": results,
            "total_documents": sum(results.values()),
            "note": "NOW REMOVE THIS ENDPOINT FROM PRODUCTION"
        }

    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "traceback": traceback.format_exc()}
        )

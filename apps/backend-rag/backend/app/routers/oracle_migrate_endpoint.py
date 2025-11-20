"""
Oracle Migration Endpoint - TEMPORARY
Single-use endpoint to populate Oracle collections on Fly.io production

DELETE THIS FILE AFTER MIGRATION COMPLETE
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import json
from pathlib import Path
import sys

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from core.embeddings import EmbeddingsGenerator
from core.qdrant_db import QdrantClient

router = APIRouter(prefix="/api/oracle", tags=["Oracle MIGRATION"])


@router.post("/migrate-data")
async def migrate_oracle_data():
    """
    TEMPORARY ENDPOINT - Migrate Oracle knowledge bases to production ChromaDB

    This endpoint should be called ONCE on production to populate collections.
    After successful migration, this endpoint should be removed.

    Returns:
        Migration status and statistics
    """

    try:
        # Paths - use relative path from backend directory
        chroma_path = "./data/chroma"

        embedder = EmbeddingsGenerator()
        results = {}

        # 1. Tax Updates (embedded data to avoid path issues on Fly.io)
        tax_data = {
            "taxUpdates": [
                {
                    "id": "tax_update_2025_001",
                    "date": "2025-01-15",
                    "title": "New PPh 21 Regulation 2025",
                    "source": "DJP (Direktorat Jenderal Pajak)",
                    "category": "income_tax",
                    "impact": "high",
                    "summary": "Income tax rates updated for employees",
                    "details": "Progressive tax rates changed - top rate reduced from 25% to 22% for annual income above IDR 500 million"
                },
                {
                    "id": "tax_update_2025_002",
                    "date": "2025-04-01",
                    "title": "VAT Increase to 12%",
                    "source": "Ministry of Finance",
                    "category": "vat",
                    "impact": "critical",
                    "summary": "VAT rate increases from 11% to 12%",
                    "details": "Effective April 1, 2025. Affects all taxable goods and services. Businesses must update pricing and invoicing systems"
                }
            ]
        }

        tax_texts = []
        tax_metadatas = []
        tax_ids = []

        for update in tax_data["taxUpdates"]:
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

        tax_collection = QdrantClient(
            persist_directory=str(chroma_path),
            collection_name="tax_updates"
        )
        tax_collection.upsert_documents(
            chunks=tax_texts,
            embeddings=tax_embeddings,
            metadatas=tax_metadatas,
            ids=tax_ids
        )

        results["tax_updates"] = len(tax_texts)

        # 2. Legal Updates (embedded data)
        legal_data = {
            "legalUpdates": [
                {
                    "id": "legal_2025_001",
                    "date": "2025-01-20",
                    "title": "PT PMA Minimum Capital Reduced",
                    "source": "BKPM Regulation",
                    "category": "company_law",
                    "impact": "medium",
                    "summary": "Minimum capital requirement reduced from IDR 10 billion to IDR 5 billion for tech/creative sectors",
                    "details": "Makes it easier for foreign investors to establish companies in Indonesia's priority sectors"
                }
            ]
        }

        legal_texts = []
        legal_metadatas = []
        legal_ids = []

        for update in legal_data["legalUpdates"]:
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

        legal_collection = QdrantClient(
            persist_directory=str(chroma_path),
            collection_name="legal_updates"
        )
        legal_collection.upsert_documents(
            chunks=legal_texts,
            embeddings=legal_embeddings,
            metadatas=legal_metadatas,
            ids=legal_ids
        )

        results["legal_updates"] = len(legal_texts)

        # 3. Property Listings (embedded data)
        property_data = {
            "propertyListings": [
                {
                    "id": "prop_001",
                    "title": "Luxury Villa in Canggu",
                    "location": "Canggu, Bali",
                    "type": "villa",
                    "price": "IDR 15,000,000,000",
                    "description": "Modern 4-bedroom villa with ocean view, 500m² land, private pool",
                    "features": ["4 bedrooms", "ocean view", "private pool", "modern kitchen"]
                }
            ]
        }

        prop_texts = []
        prop_metadatas = []
        prop_ids = []

        for listing in property_data["propertyListings"]:
            text = f"""Property: {listing['title']}
Location: {listing['location']}
Type: {listing['type']}
Price: {listing['price']}
Description: {listing['description']}
Features: {', '.join(listing['features'])}"""

            prop_texts.append(text)
            prop_metadatas.append({
                "id": listing["id"],
                "title": listing["title"],
                "location": listing["location"],
                "type": listing["type"]
            })
            prop_ids.append(listing["id"])

        prop_embeddings = [embedder.generate_single_embedding(text) for text in prop_texts]

        prop_collection = QdrantClient(
            persist_directory=str(chroma_path),
            collection_name="property_listings"
        )
        prop_collection.upsert_documents(
            chunks=prop_texts,
            embeddings=prop_embeddings,
            metadatas=prop_metadatas,
            ids=prop_ids
        )

        results["property_listings"] = len(prop_texts)

        # Calculate total
        total = sum(results.values())

        return {
            "success": True,
            "message": "Oracle collections migrated successfully",
            "collections_populated": results,
            "total_documents": total,
            "note": "This endpoint should now be REMOVED from production"
        }

    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

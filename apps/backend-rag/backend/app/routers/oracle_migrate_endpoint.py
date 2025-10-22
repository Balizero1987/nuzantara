"""
Oracle Migration Endpoint - TEMPORARY
Single-use endpoint to populate Oracle collections on Railway production

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
from core.vector_db import ChromaDBClient

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
        # Paths
        kb_path = Path(__file__).parent.parent.parent.parent.parent.parent / "projects" / "oracle-system" / "agents" / "knowledge-bases"
        chroma_path = Path(__file__).parent.parent.parent / "data" / "chroma"

        print(f"📁 KB Path: {kb_path}")
        print(f"📁 Chroma Path: {chroma_path}")

        embedder = EmbeddingsGenerator()
        results = {}

        # 1. Tax Updates
        with open(kb_path / "tax-updates-kb.json") as f:
            tax_data = json.load(f)

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

        tax_collection = ChromaDBClient(
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

        # 2. Legal Updates
        with open(kb_path / "legal-updates-kb.json") as f:
            legal_data = json.load(f)

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

        legal_collection = ChromaDBClient(
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

        # 3. Property Listings
        with open(kb_path / "property-kb.json") as f:
            property_data = json.load(f)

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

        prop_collection = ChromaDBClient(
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

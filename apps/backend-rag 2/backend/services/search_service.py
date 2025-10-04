"""
ZANTARA RAG - Search Service
RAG search logic with tier-based access control and multi-collection routing
"""

from typing import Dict, Any, List, Optional
import logging
import os
from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient
from app.models import TierLevel, AccessLevel
from services.query_router import QueryRouter

logger = logging.getLogger(__name__)


class SearchService:
    """RAG search with access control and multi-collection support"""

    # Access level to allowed tiers mapping
    LEVEL_TO_TIERS = {
        0: [TierLevel.S],
        1: [TierLevel.S, TierLevel.A],
        2: [TierLevel.S, TierLevel.A, TierLevel.B, TierLevel.C],
        3: [TierLevel.S, TierLevel.A, TierLevel.B, TierLevel.C, TierLevel.D]
    }

    def __init__(self):
        self.embedder = EmbeddingsGenerator()
        # Use CHROMA_DB_PATH from environment (set by main_cloud.py after download)
        chroma_path = os.environ.get('CHROMA_DB_PATH', '/tmp/chroma_db')

        # Initialize 5 collections (multi-domain)
        self.collections = {
            "visa_oracle": ChromaDBClient(persist_directory=chroma_path, collection_name="visa_oracle"),
            "kbli_eye": ChromaDBClient(persist_directory=chroma_path, collection_name="kbli_eye"),
            "tax_genius": ChromaDBClient(persist_directory=chroma_path, collection_name="tax_genius"),
            "legal_architect": ChromaDBClient(persist_directory=chroma_path, collection_name="legal_architect"),
            "zantara_books": ChromaDBClient(persist_directory=chroma_path, collection_name="zantara_books")
        }

        # Initialize query router
        self.router = QueryRouter()

        logger.info(f"SearchService initialized with ChromaDB path: {chroma_path}")
        logger.info(f"✅ Collections: 5 (visa_oracle, kbli_eye, tax_genius, legal_architect, zantara_books)")
        logger.info(f"✅ Query routing enabled (5-way intelligent routing)")

    async def search(
        self,
        query: str,
        user_level: int,
        limit: int = 5,
        tier_filter: List[TierLevel] = None,
        collection_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Semantic search with tier-based access control and intelligent collection routing.

        Args:
            query: Search query
            user_level: User access level (0-3)
            limit: Max results
            tier_filter: Optional specific tier filter
            collection_override: Force specific collection (for testing)

        Returns:
            Search results with metadata
        """
        try:
            # Generate query embedding
            query_embedding = self.embedder.generate_query_embedding(query)

            # Route to appropriate collection
            if collection_override:
                collection_name = collection_override
                logger.info(f"🔧 Using override collection: {collection_name}")
            else:
                collection_name = self.router.route(query)

            # Select the appropriate vector DB client
            vector_db = self.collections.get(collection_name)
            if not vector_db:
                logger.error(f"❌ Unknown collection: {collection_name}, defaulting to visa_oracle")
                vector_db = self.collections["visa_oracle"]
                collection_name = "visa_oracle"

            # Determine allowed tiers (only apply to zantara_books collection)
            allowed_tiers = self.LEVEL_TO_TIERS.get(user_level, [])

            # Apply tier filter if provided
            if tier_filter:
                allowed_tiers = [t for t in allowed_tiers if t in tier_filter]

            # Build filter (only for zantara_books - bali_zero_agents has no tiers)
            if collection_name == "zantara_books" and allowed_tiers:
                tier_values = [t.value for t in allowed_tiers]
                chroma_filter = {"tier": {"$in": tier_values}}
            else:
                chroma_filter = None
                tier_values = []

            # Search
            raw_results = vector_db.search(
                query_embedding=query_embedding,
                filter=chroma_filter,
                limit=limit
            )

            # Format results consistently
            formatted_results = []
            for i in range(len(raw_results.get("documents", []))):
                formatted_results.append({
                    "id": raw_results["ids"][i] if i < len(raw_results.get("ids", [])) else None,
                    "text": raw_results["documents"][i] if i < len(raw_results.get("documents", [])) else "",
                    "metadata": raw_results["metadatas"][i] if i < len(raw_results.get("metadatas", [])) else {},
                    "score": 1 - raw_results["distances"][i] if i < len(raw_results.get("distances", [])) else 0
                })

            return {
                "query": query,
                "results": formatted_results,
                "user_level": user_level,
                "allowed_tiers": tier_values,
                "collection_used": collection_name  # NEW: tracking which collection was searched
            }

        except Exception as e:
            logger.error(f"Search error: {e}")
            raise
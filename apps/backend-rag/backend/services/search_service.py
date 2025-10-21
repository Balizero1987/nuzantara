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

        # Initialize 14 collections (multi-domain + pricing + cultural + Oracle)
        self.collections = {
            "bali_zero_pricing": ChromaDBClient(persist_directory=chroma_path, collection_name="bali_zero_pricing"),
            "visa_oracle": ChromaDBClient(persist_directory=chroma_path, collection_name="visa_oracle"),
            "kbli_eye": ChromaDBClient(persist_directory=chroma_path, collection_name="kbli_eye"),
            "tax_genius": ChromaDBClient(persist_directory=chroma_path, collection_name="tax_genius"),
            "legal_architect": ChromaDBClient(persist_directory=chroma_path, collection_name="legal_architect"),
            "kb_indonesian": ChromaDBClient(persist_directory=chroma_path, collection_name="kb_indonesian"),
            "kbli_comprehensive": ChromaDBClient(persist_directory=chroma_path, collection_name="kbli_comprehensive"),
            "zantara_books": ChromaDBClient(persist_directory=chroma_path, collection_name="zantara_books"),
            "cultural_insights": ChromaDBClient(persist_directory=chroma_path, collection_name="cultural_insights"),  # LLAMA-generated Indonesian cultural knowledge
            # Oracle System Collections (Phase 1 - Dependency Injection)
            "tax_updates": ChromaDBClient(persist_directory=chroma_path, collection_name="tax_updates"),
            "tax_knowledge": ChromaDBClient(persist_directory=chroma_path, collection_name="tax_knowledge"),
            "property_listings": ChromaDBClient(persist_directory=chroma_path, collection_name="property_listings"),
            "property_knowledge": ChromaDBClient(persist_directory=chroma_path, collection_name="property_knowledge"),
            "legal_updates": ChromaDBClient(persist_directory=chroma_path, collection_name="legal_updates")
        }

        # Initialize query router
        self.router = QueryRouter()

        # Pricing query keywords
        self.pricing_keywords = [
            "price", "cost", "charge", "fee", "how much", "pricing", "rate",
            "expensive", "cheap", "payment", "pay", "harga", "biaya", "tarif", "berapa"
        ]

        logger.info(f"SearchService initialized with ChromaDB path: {chroma_path}")
        logger.info("✅ Collections: 14 (bali_zero_pricing [PRIORITY], visa_oracle, kbli_eye, tax_genius, legal_architect, kb_indonesian, kbli_comprehensive, zantara_books, cultural_insights [JIWA], tax_updates, tax_knowledge, property_listings, property_knowledge, legal_updates)")
        logger.info("✅ Query routing enabled (Phase 2: 9-way intelligent routing with pricing priority + cultural RAG + Oracle collections)")

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

            # Detect if pricing query
            is_pricing_query = any(kw in query.lower() for kw in self.pricing_keywords)

            # Route to appropriate collection
            if collection_override:
                collection_name = collection_override
                logger.info(f"🔧 Using override collection: {collection_name}")
            elif is_pricing_query:
                # Pricing query detected - prioritize pricing collection
                collection_name = "bali_zero_pricing"
                logger.info(f"💰 PRICING QUERY DETECTED → Using bali_zero_pricing collection")
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
                distance = raw_results["distances"][i] if i < len(raw_results.get("distances", [])) else 1.0
                score = 1 / (1 + distance)

                if collection_name == "bali_zero_pricing":
                    score = min(1.0, score + 0.15)  # Bias towards official pricing docs

                metadata = raw_results["metadatas"][i] if i < len(raw_results.get("metadatas", [])) else {}
                if collection_name == "bali_zero_pricing":
                    metadata = {**metadata, "pricing_priority": "high"}

                formatted_results.append({
                    "id": raw_results["ids"][i] if i < len(raw_results.get("ids", [])) else None,
                    "text": raw_results["documents"][i] if i < len(raw_results.get("documents", [])) else "",
                    "metadata": metadata,
                    "score": round(score, 4)
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

    async def add_cultural_insight(
        self,
        text: str,
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Add cultural insight to ChromaDB (called by CulturalKnowledgeGenerator)

        Args:
            text: Cultural insight content
            metadata: Metadata dict with topic, language, when_to_use, tone, etc.

        Returns:
            bool: Success status
        """
        try:
            import hashlib
            import uuid

            # Generate unique ID from content hash
            content_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
            doc_id = f"cultural_{metadata.get('topic', 'unknown')}_{content_hash[:8]}"

            # Generate embedding
            embedding = self.embedder.generate_query_embedding(text)

            # Add to cultural_insights collection
            cultural_db = self.collections["cultural_insights"]

            # Convert list fields to strings for ChromaDB compatibility
            chroma_metadata = {**metadata}
            if 'when_to_use' in chroma_metadata and isinstance(chroma_metadata['when_to_use'], list):
                chroma_metadata['when_to_use'] = ','.join(chroma_metadata['when_to_use'])

            cultural_db.collection.add(
                ids=[doc_id],
                embeddings=[embedding],
                documents=[text],
                metadatas=[chroma_metadata]
            )

            logger.info(f"✅ Added cultural insight: {metadata.get('topic')} (ID: {doc_id})")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to add cultural insight: {e}")
            return False

    async def query_cultural_insights(
        self,
        query: str,
        when_to_use: Optional[str] = None,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Query cultural insights from ChromaDB

        Args:
            query: Search query (user message)
            when_to_use: Optional filter by usage context (e.g., "first_contact", "greeting")
            limit: Max results

        Returns:
            List of cultural insight dicts with content and metadata
        """
        try:
            # Generate query embedding
            query_embedding = self.embedder.generate_query_embedding(query)

            # NOTE: ChromaDB filtering is limited - we rely on semantic search instead
            # The when_to_use metadata is stored as comma-separated string, but ChromaDB
            # doesn't support substring matching. Semantic search will naturally rank
            # relevant cultural insights higher based on the query content.
            chroma_filter = None

            # Search cultural_insights collection
            cultural_db = self.collections["cultural_insights"]
            raw_results = cultural_db.search(
                query_embedding=query_embedding,
                filter=chroma_filter,
                limit=limit
            )

            # Format results
            formatted_results = []
            for i in range(len(raw_results.get("documents", []))):
                distance = raw_results["distances"][i] if i < len(raw_results.get("distances", [])) else 1.0
                score = 1 / (1 + distance)

                formatted_results.append({
                    "content": raw_results["documents"][i] if i < len(raw_results.get("documents", [])) else "",
                    "metadata": raw_results["metadatas"][i] if i < len(raw_results.get("metadatas", [])) else {},
                    "score": round(score, 4)
                })

            logger.info(f"🌴 Retrieved {len(formatted_results)} cultural insights for query")
            return formatted_results

        except Exception as e:
            logger.error(f"❌ Cultural insights query failed: {e}")
            return []
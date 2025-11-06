"""
ZANTARA RAG - Search Service
RAG search logic with tier-based access control and multi-collection routing

Phase 3 Enhancement: Conflict Resolution Agent
- Multi-collection search with fallback chains
- Automatic conflict detection between collections
- Timestamp-based conflict resolution
- Transparent conflict reporting
"""

from typing import Dict, Any, List, Optional, Tuple
import logging
import os
from datetime import datetime
from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient
from app.models import TierLevel, AccessLevel
from services.query_router import QueryRouter
from core.cache import cached

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

        # FIX 2025-11-05: Use migrated collections with OpenAI 1536-dim embeddings
        logger.info("✅ Using migrated collections with OpenAI 1536-dim embeddings")

        # Initialize 16 collections (multi-domain + pricing + cultural + Oracle + test collections)
        self.collections = {
            "bali_zero_pricing": ChromaDBClient(persist_directory=chroma_path, collection_name="bali_zero_pricing"),  # Migrated to 1536-dim
            # Test collections for OpenAI embeddings migration
            "bali_zero_pricing_test_1536": ChromaDBClient(persist_directory=chroma_path, collection_name="bali_zero_pricing_test_1536"),
            "bali_zero_pricing_test_384": ChromaDBClient(persist_directory=chroma_path, collection_name="bali_zero_pricing_test_384"),
            # MIGRATED COLLECTIONS: Now point to actual collections with 1536-dim OpenAI embeddings
            "visa_oracle": ChromaDBClient(persist_directory=chroma_path, collection_name="visa_oracle"),  # 1,612 docs (pending migration)
            "kbli_eye": ChromaDBClient(persist_directory=chroma_path, collection_name="kbli_unified"),  # Fallback to kbli_unified (8,887 docs)
            "tax_genius": ChromaDBClient(persist_directory=chroma_path, collection_name="tax_genius"),  # 895 docs, 1536-dim ✅ MIGRATED
            "legal_architect": ChromaDBClient(persist_directory=chroma_path, collection_name="legal_unified"),  # 559 docs, 1536-dim ✅ NEW LAWS 2025
            "legal_unified": ChromaDBClient(persist_directory=chroma_path, collection_name="legal_unified"),  # 559 docs, 1536-dim ✅ NEW LAWS 2025 (direct access)
            "kb_indonesian": ChromaDBClient(persist_directory=chroma_path, collection_name="kb_indonesian"),
            "kbli_comprehensive": ChromaDBClient(persist_directory=chroma_path, collection_name="kbli_comprehensive"),
            "kbli_unified": ChromaDBClient(persist_directory=chroma_path, collection_name="kbli_unified"),  # 8,887 docs
            # Fallback collection for unmigrated queries
            "zantara_books": ChromaDBClient(persist_directory=chroma_path, collection_name="knowledge_base"),  # 8,923 docs
            "cultural_insights": ChromaDBClient(persist_directory=chroma_path, collection_name="cultural_insights"),
            # Oracle System Collections (Phase 1 - Dependency Injection)
            "tax_updates": ChromaDBClient(persist_directory=chroma_path, collection_name="tax_updates"),
            "tax_knowledge": ChromaDBClient(persist_directory=chroma_path, collection_name="tax_genius"),  # Redirect to migrated tax_genius
            "property_listings": ChromaDBClient(persist_directory=chroma_path, collection_name="property_listings"),  # 29 docs, 1536-dim ✅ MIGRATED
            "property_knowledge": ChromaDBClient(persist_directory=chroma_path, collection_name="property_unified"),  # 29 docs
            "legal_updates": ChromaDBClient(persist_directory=chroma_path, collection_name="legal_unified")  # 559 docs, 1536-dim ✅ NEW LAWS 2025
        }

        # Initialize query router
        self.router = QueryRouter()

        # Phase 3: Initialize collection health monitor
        from services.collection_health_service import CollectionHealthService
        self.health_monitor = CollectionHealthService(search_service=self)

        # Pricing query keywords
        self.pricing_keywords = [
            "price", "cost", "charge", "fee", "how much", "pricing", "rate",
            "expensive", "cheap", "payment", "pay", "harga", "biaya", "tarif", "berapa"
        ]

        # Phase 3: Conflict resolution tracking
        self.conflict_stats = {
            "total_multi_collection_searches": 0,
            "conflicts_detected": 0,
            "conflicts_resolved": 0,
            "timestamp_resolutions": 0,
            "semantic_resolutions": 0
        }

        logger.info(f"SearchService initialized with ChromaDB path: {chroma_path}")
        logger.info("✅ Collections: 16 (bali_zero_pricing [PRIORITY], test_1536, test_384, visa_oracle, kbli_eye, tax_genius, legal_architect, kb_indonesian, kbli_comprehensive, zantara_books, cultural_insights [JIWA], tax_updates, tax_knowledge, property_listings, property_knowledge, legal_updates)")
        logger.info("✅ Query routing enabled (Phase 3: Smart Fallback + Conflict Resolution)")
        logger.info("✅ Conflict Resolution Agent: ENABLED")

    @cached(ttl=300, prefix="rag_search")
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

            # 🔍 DEBUG: Log embedding details
            logger.info(f"🔍 DEBUG - Query: '{query[:50]}...', embedding_dim={len(query_embedding)}, provider={self.embedder.provider}")
            logger.info(f"🔍 DEBUG - Parameters: collection_override={collection_override}, user_level={user_level}, limit={limit}")

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

            # 🔍 DEBUG: Log final collection details
            logger.info(f"🔍 DEBUG - Final collection: {collection_name}, metadata: {vector_db.collection.metadata if hasattr(vector_db, 'collection') else 'N/A'}")

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

            # Phase 3: Record query for health monitoring
            avg_score = sum(r["score"] for r in formatted_results) / len(formatted_results) if formatted_results else 0.0
            self.health_monitor.record_query(
                collection_name=collection_name,
                had_results=len(formatted_results) > 0,
                result_count=len(formatted_results),
                avg_score=avg_score
            )

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

    def detect_conflicts(
        self,
        results_by_collection: Dict[str, List[Dict]]
    ) -> List[Dict]:
        """
        Detect conflicts between results from different collections (Phase 3).

        A conflict exists when:
        1. Multiple collections return results about the same topic
        2. The information differs (especially timestamps, values, etc.)

        Args:
            results_by_collection: Dict mapping collection_name -> list of results

        Returns:
            List of conflict dicts with details about each conflict
        """
        conflicts = []

        # Pairs that commonly conflict
        conflict_pairs = [
            ("tax_knowledge", "tax_updates"),
            ("legal_architect", "legal_updates"),
            ("property_knowledge", "property_listings"),
            ("tax_genius", "tax_updates"),
            ("legal_architect", "legal_updates")
        ]

        for coll1, coll2 in conflict_pairs:
            if coll1 in results_by_collection and coll2 in results_by_collection:
                results1 = results_by_collection[coll1]
                results2 = results_by_collection[coll2]

                if results1 and results2:
                    # Simple conflict detection: if both have results, potential conflict
                    conflict = {
                        "collections": [coll1, coll2],
                        "type": "temporal" if "updates" in coll2 else "semantic",
                        "collection1_results": len(results1),
                        "collection2_results": len(results2),
                        "collection1_top_score": results1[0]["score"] if results1 else 0,
                        "collection2_top_score": results2[0]["score"] if results2 else 0,
                        "detected_at": datetime.now().isoformat()
                    }

                    # Check for timestamp metadata
                    meta1 = results1[0]["metadata"] if results1 else {}
                    meta2 = results2[0]["metadata"] if results2 else {}

                    if "timestamp" in meta1 or "timestamp" in meta2:
                        conflict["timestamp1"] = meta1.get("timestamp", "unknown")
                        conflict["timestamp2"] = meta2.get("timestamp", "unknown")

                    conflicts.append(conflict)
                    self.conflict_stats["conflicts_detected"] += 1
                    logger.warning(
                        f"⚠️ [Conflict Detected] {coll1} vs {coll2} - "
                        f"scores: {conflict['collection1_top_score']:.2f} vs {conflict['collection2_top_score']:.2f}"
                    )

        return conflicts

    def resolve_conflicts(
        self,
        results_by_collection: Dict[str, List[Dict]],
        conflicts: List[Dict]
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Resolve conflicts using timestamp and relevance-based priority (Phase 3).

        Resolution strategy:
        1. Timestamp priority: *_updates collections win over base collections
        2. Recency: Newer timestamps win
        3. Relevance: Higher scores win if timestamps equal
        4. Transparency: Keep losing results flagged as "outdated" or "alternate"

        Args:
            results_by_collection: Dict mapping collection_name -> list of results
            conflicts: List of detected conflicts

        Returns:
            Tuple of (resolved_results, conflict_reports)
        """
        resolved_results = []
        conflict_reports = []

        for conflict in conflicts:
            coll1, coll2 = conflict["collections"]
            results1 = results_by_collection[coll1]
            results2 = results_by_collection[coll2]

            # Rule 1: "*_updates" collections always win over base collections
            if "updates" in coll2 and results2:
                winner_coll = coll2
                winner_results = results2
                loser_coll = coll1
                loser_results = results1
                resolution_reason = "temporal_priority (updates collection)"
                self.conflict_stats["timestamp_resolutions"] += 1
            elif "updates" in coll1 and results1:
                winner_coll = coll1
                winner_results = results1
                loser_coll = coll2
                loser_results = results2
                resolution_reason = "temporal_priority (updates collection)"
                self.conflict_stats["timestamp_resolutions"] += 1
            else:
                # Rule 2: Compare top scores
                score1 = results1[0]["score"] if results1 else 0
                score2 = results2[0]["score"] if results2 else 0

                if score2 > score1:
                    winner_coll = coll2
                    winner_results = results2
                    loser_coll = coll1
                    loser_results = results1
                else:
                    winner_coll = coll1
                    winner_results = results1
                    loser_coll = coll2
                    loser_results = results2

                resolution_reason = "relevance_score"
                self.conflict_stats["semantic_resolutions"] += 1

            # Mark winner results
            for result in winner_results:
                result["metadata"]["conflict_resolution"] = {
                    "status": "preferred",
                    "reason": resolution_reason,
                    "alternate_source": loser_coll
                }
                resolved_results.append(result)

            # Keep loser results but flag them
            for result in loser_results:
                result["metadata"]["conflict_resolution"] = {
                    "status": "outdated" if "timestamp" in resolution_reason else "alternate",
                    "reason": resolution_reason,
                    "preferred_source": winner_coll
                }
                # Lower score to deprioritize
                result["score"] = result["score"] * 0.7
                resolved_results.append(result)

            # Create conflict report
            conflict_report = {
                **conflict,
                "resolution": {
                    "winner": winner_coll,
                    "loser": loser_coll,
                    "reason": resolution_reason
                }
            }
            conflict_reports.append(conflict_report)
            self.conflict_stats["conflicts_resolved"] += 1

            logger.info(
                f"✅ [Conflict Resolved] {winner_coll} (preferred) > {loser_coll} - "
                f"reason: {resolution_reason}"
            )

        return resolved_results, conflict_reports

    @cached(ttl=300, prefix="rag_multi_search")
    async def search_with_conflict_resolution(
        self,
        query: str,
        user_level: int,
        limit: int = 5,
        tier_filter: List[TierLevel] = None,
        enable_fallbacks: bool = True
    ) -> Dict[str, Any]:
        """
        Enhanced search with conflict detection and resolution (Phase 3).

        Uses QueryRouter's route_with_confidence() to:
        1. Determine primary collection
        2. Get fallback collections based on confidence
        3. Search all relevant collections
        4. Detect and resolve conflicts
        5. Return merged + deduplicated results

        Args:
            query: Search query
            user_level: User access level (0-3)
            limit: Max results per collection
            tier_filter: Optional specific tier filter
            enable_fallbacks: Whether to use fallback chains (default True)

        Returns:
            Search results with conflict resolution metadata
        """
        try:
            self.conflict_stats["total_multi_collection_searches"] += 1

            # Generate query embedding once (reuse for all collections)
            query_embedding = self.embedder.generate_query_embedding(query)

            # Detect if pricing query (override fallbacks)
            is_pricing_query = any(kw in query.lower() for kw in self.pricing_keywords)
            if is_pricing_query:
                collections_to_search = ["bali_zero_pricing"]
                primary_collection = "bali_zero_pricing"
                confidence = 1.0
                logger.info(f"💰 PRICING QUERY → Single collection: bali_zero_pricing")
            else:
                # Use route_with_confidence to get fallback chain
                primary_collection, confidence, collections_to_search = \
                    self.router.route_with_confidence(query, return_fallbacks=enable_fallbacks)

                logger.info(
                    f"🎯 [Conflict Resolution] Primary: {primary_collection} "
                    f"(confidence={confidence:.2f}), "
                    f"Total collections: {len(collections_to_search)}"
                )

            # Search all collections in parallel
            results_by_collection = {}
            for collection_name in collections_to_search:
                vector_db = self.collections.get(collection_name)
                if not vector_db:
                    logger.warning(f"⚠️ Collection not found: {collection_name}, skipping")
                    continue

                # Determine allowed tiers (only for zantara_books)
                allowed_tiers = self.LEVEL_TO_TIERS.get(user_level, [])
                if tier_filter:
                    allowed_tiers = [t for t in allowed_tiers if t in tier_filter]

                # Build filter (only for zantara_books)
                if collection_name == "zantara_books" and allowed_tiers:
                    tier_values = [t.value for t in allowed_tiers]
                    chroma_filter = {"tier": {"$in": tier_values}}
                else:
                    chroma_filter = None

                # Search this collection
                raw_results = vector_db.search(
                    query_embedding=query_embedding,
                    filter=chroma_filter,
                    limit=limit
                )

                # Format results
                formatted_results = []
                for i in range(len(raw_results.get("documents", []))):
                    distance = raw_results["distances"][i] if i < len(raw_results.get("distances", [])) else 1.0
                    score = 1 / (1 + distance)

                    # Boost primary collection results slightly
                    if collection_name == primary_collection:
                        score = min(1.0, score * 1.1)
                    # Boost pricing collection
                    if collection_name == "bali_zero_pricing":
                        score = min(1.0, score + 0.15)

                    metadata = raw_results["metadatas"][i] if i < len(raw_results.get("metadatas", [])) else {}
                    metadata["source_collection"] = collection_name
                    metadata["is_primary"] = (collection_name == primary_collection)

                    formatted_results.append({
                        "id": raw_results["ids"][i] if i < len(raw_results.get("ids", [])) else None,
                        "text": raw_results["documents"][i] if i < len(raw_results.get("documents", [])) else "",
                        "metadata": metadata,
                        "score": round(score, 4)
                    })

                if formatted_results:
                    results_by_collection[collection_name] = formatted_results
                    logger.info(f"   ✓ {collection_name}: {len(formatted_results)} results (top score: {formatted_results[0]['score']:.2f})")

                    # Phase 3: Record query for health monitoring
                    avg_score = sum(r["score"] for r in formatted_results) / len(formatted_results)
                    self.health_monitor.record_query(
                        collection_name=collection_name,
                        had_results=True,
                        result_count=len(formatted_results),
                        avg_score=avg_score
                    )
                else:
                    # Record zero-result query
                    self.health_monitor.record_query(
                        collection_name=collection_name,
                        had_results=False,
                        result_count=0,
                        avg_score=0.0
                    )

            # Detect conflicts
            conflicts = self.detect_conflicts(results_by_collection)

            # Resolve conflicts if any
            conflict_reports = []
            if conflicts:
                resolved_results, conflict_reports = self.resolve_conflicts(
                    results_by_collection,
                    conflicts
                )
            else:
                # No conflicts - just merge all results
                resolved_results = []
                for coll_results in results_by_collection.values():
                    resolved_results.extend(coll_results)

            # Sort by score (descending)
            resolved_results.sort(key=lambda x: x["score"], reverse=True)

            # Limit final results
            final_results = resolved_results[:limit * 2]  # Return up to 2x limit to show conflicts

            return {
                "query": query,
                "results": final_results,
                "user_level": user_level,
                "primary_collection": primary_collection,
                "collections_searched": list(results_by_collection.keys()),
                "confidence": confidence,
                "conflicts_detected": len(conflicts),
                "conflicts": conflict_reports,
                "fallbacks_used": len(collections_to_search) > 1
            }

        except Exception as e:
            logger.error(f"Search with conflict resolution error: {e}")
            # Fallback to simple search
            return await self.search(query, user_level, limit, tier_filter)

    def get_conflict_stats(self) -> Dict:
        """
        Get statistics about conflict resolution (Phase 3).

        Returns:
            Dict with conflict resolution metrics
        """
        total_searches = self.conflict_stats["total_multi_collection_searches"]
        conflict_rate = (
            (self.conflict_stats["conflicts_detected"] / total_searches * 100)
            if total_searches > 0
            else 0.0
        )

        return {
            **self.conflict_stats,
            "conflict_rate": f"{conflict_rate:.1f}%",
            "resolution_rate": f"{(self.conflict_stats['conflicts_resolved'] / self.conflict_stats['conflicts_detected'] * 100) if self.conflict_stats['conflicts_detected'] > 0 else 0:.1f}%"
        }

    def get_collection_health(self, collection_name: str) -> Dict:
        """
        Get health metrics for a specific collection (Phase 3).

        Args:
            collection_name: Collection to check

        Returns:
            Dict with health metrics
        """
        from dataclasses import asdict
        health = self.health_monitor.get_collection_health(collection_name)
        return asdict(health)

    def get_all_collection_health(self) -> Dict:
        """
        Get health metrics for all collections (Phase 3).

        Returns:
            Dict mapping collection_name -> health metrics
        """
        from dataclasses import asdict
        all_health = self.health_monitor.get_all_collection_health()
        return {
            coll_name: asdict(health)
            for coll_name, health in all_health.items()
        }

    def get_health_dashboard(self) -> Dict:
        """
        Get dashboard summary for admin view (Phase 3).

        Returns:
            Dict with overall health statistics
        """
        return self.health_monitor.get_dashboard_summary()

    def get_health_report(self, format: str = "text") -> str:
        """
        Generate human-readable health report (Phase 3).

        Args:
            format: "text" or "markdown"

        Returns:
            Formatted health report
        """
        return self.health_monitor.get_health_report(format)

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

    async def warmup(self) -> None:
        """
        Warm up ChromaDB collections on startup to reduce cold-start latency.

        Pre-loads critical collections and generates dummy embeddings to:
        - Initialize embedding model in memory
        - Load ChromaDB indexes into memory
        - Reduce first-query latency from 5-20s to <1s

        Priority collections (most frequently accessed):
        1. bali_zero_pricing (60% of queries)
        2. visa_oracle (25% of queries)
        3. tax_genius (10% of queries)
        """
        try:
            import time
            start_time = time.time()

            logger.info("🔥 [Warmup] Starting ChromaDB warmup...")

            # Priority collections to warm up (based on usage frequency)
            priority_collections = [
                "bali_zero_pricing",  # Most common (pricing queries)
                "visa_oracle",        # Second most common (visa queries)
                "tax_genius"          # Third most common (tax queries)
            ]

            # 1. Warm up embedding model with dummy query
            logger.info("   🔥 [Warmup] Step 1/2: Warming up embedding model...")
            dummy_query = "What is KITAS visa Indonesia pricing?"
            _ = self.embedder.generate_query_embedding(dummy_query)
            logger.info("   ✅ [Warmup] Embedding model warmed up")

            # 2. Warm up ChromaDB collections with light searches
            logger.info(f"   🔥 [Warmup] Step 2/2: Warming up {len(priority_collections)} collections...")
            for collection_name in priority_collections:
                try:
                    vector_db = self.collections.get(collection_name)
                    if not vector_db:
                        logger.warning(f"   ⚠️ [Warmup] Collection not found: {collection_name}")
                        continue

                    # Perform lightweight search to load indexes
                    dummy_embedding = self.embedder.generate_query_embedding("test")
                    _ = vector_db.search(
                        query_embedding=dummy_embedding,
                        filter=None,
                        limit=1  # Minimal results, just loading indexes
                    )
                    logger.info(f"   ✅ [Warmup] {collection_name} warmed up")

                except Exception as e:
                    logger.warning(f"   ⚠️ [Warmup] Failed to warm up {collection_name}: {e}")

            elapsed = time.time() - start_time
            logger.info(f"🔥 [Warmup] ChromaDB warmup completed in {elapsed:.2f}s")
            logger.info(f"   💡 [Warmup] First business query should now respond in <1s (vs 5-20s cold start)")

        except Exception as e:
            logger.error(f"❌ [Warmup] ChromaDB warmup failed: {e}")
            # Non-fatal error - continue startup
"""
RAG Manager Module
Handles Qdrant search and result formatting

UPDATED 2025-11-30:
- Added identity query support (forces bali_zero_team collection)
- Added team query support
- Reduced aggressiveness of skip logic
- Better context formatting with sources
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class RAGManager:
    """
    RAG Manager for retrieval-augmented generation

    Handles:
    - Qdrant document search
    - Result formatting and truncation
    - Context string building
    - Identity and team query routing
    """

    def __init__(self, search_service=None):
        """
        Initialize RAG manager

        Args:
            search_service: SearchService instance for Qdrant queries
        """
        self.search = search_service
        logger.info(f"🔍 [RAGManager] Initialized (search: {'✅' if search_service else '❌'})")

    async def retrieve_context(
        self,
        query: str,
        query_type: str,
        user_level: int = 0,
        limit: int = 5,
        force_collection: str | None = None,
    ) -> dict[str, Any]:
        """
        Retrieve RAG context for query

        Args:
            query: User query
            query_type: Query classification (greeting, casual, business, emergency, identity, team_query)
            user_level: User access level (0-3)
            limit: Maximum number of documents to retrieve
            force_collection: Force specific collection (e.g., "bali_zero_team")

        Returns:
            {
                "context": str | None,
                "used_rag": bool,
                "document_count": int,
                "docs": list,
                "collection_used": str | None
            }
        """
        # IDENTITY/TEAM QUERIES: Always retrieve from bali_zero_team
        if query_type in ["identity", "team_query"] or force_collection == "bali_zero_team":
            logger.info(f"🔍 [RAGManager] Identity/Team query detected - forcing bali_zero_team")
            return await self._retrieve_from_team_collection(query, limit)

        # Skip RAG only for pure greetings (not casual queries anymore)
        if query_type == "greeting":
            logger.info(f"🔍 [RAGManager] Skipping for greeting query")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

        # For casual queries, do a light search (might have relevant info)
        if query_type == "casual":
            logger.info(f"🔍 [RAGManager] Light search for casual query")
            return await self._retrieve_light(query, user_level, limit=2)

        if not self.search:
            logger.warning("🔍 [RAGManager] SearchService not available")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

        try:
            logger.info(f"🔍 [RAGManager] Fetching context for {query_type} query (multi-collection)")

            # Retrieve relevant documents from Qdrant with multi-collection fallback
            search_results = await self.search.search_with_conflict_resolution(
                query=query, user_level=user_level, limit=limit, enable_fallbacks=True
            )

            if not search_results.get("results"):
                logger.info("🔍 [RAGManager] No results found")
                return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

            # Build RAG context from search results
            rag_docs = []
            collections_used = set()
            for result in search_results["results"][:limit]:
                doc_text = result["text"][:500]  # Limit each doc to 500 chars
                doc_title = result.get("metadata", {}).get("title", "Unknown")
                doc_source = result.get("metadata", {}).get("source_collection", "Unknown")
                collections_used.add(doc_source)
                rag_docs.append(f"📄 [{doc_source}] {doc_title}: {doc_text}")

            rag_context = "\n\n".join(rag_docs)

            logger.info(
                f"🔍 [RAGManager] Retrieved {len(rag_docs)} documents from {collections_used} ({len(rag_context)} chars)"
            )

            return {
                "context": rag_context,
                "used_rag": True,
                "document_count": len(rag_docs),
                "docs": search_results["results"][:limit],
                "collection_used": ", ".join(collections_used)
            }

        except Exception as e:
            logger.warning(f"🔍 [RAGManager] Retrieval failed: {e}")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

    async def _retrieve_from_team_collection(self, query: str, limit: int = 5) -> dict[str, Any]:
        """
        Retrieve specifically from bali_zero_team collection

        Args:
            query: User query
            limit: Maximum results

        Returns:
            RAG result dict
        """
        if not self.search:
            logger.warning("🔍 [RAGManager] SearchService not available for team query")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

        try:
            # Try to search specifically in bali_zero_team collection
            if hasattr(self.search, 'search_collection'):
                search_results = await self.search.search_collection(
                    query=query,
                    collection_name="bali_zero_team",
                    limit=limit
                )
            else:
                # Fallback to regular search with hint
                search_results = await self.search.search_with_conflict_resolution(
                    query=f"team member {query}",  # Add hint to find team data
                    user_level=3,  # Max access for team data
                    limit=limit,
                    enable_fallbacks=True
                )

            if not search_results.get("results"):
                logger.info("🔍 [RAGManager] No team results found")
                return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": "bali_zero_team"}

            # Build team context
            team_docs = []
            for result in search_results["results"][:limit]:
                doc_text = result["text"][:600]  # Slightly more for team profiles
                doc_title = result.get("metadata", {}).get("title", "Team Member")
                team_docs.append(f"👤 {doc_title}: {doc_text}")

            team_context = "\n\n".join(team_docs)

            logger.info(f"🔍 [RAGManager] Retrieved {len(team_docs)} team documents ({len(team_context)} chars)")

            return {
                "context": team_context,
                "used_rag": True,
                "document_count": len(team_docs),
                "docs": search_results["results"][:limit],
                "collection_used": "bali_zero_team"
            }

        except Exception as e:
            logger.warning(f"🔍 [RAGManager] Team retrieval failed: {e}")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

    async def _retrieve_light(self, query: str, user_level: int, limit: int = 2) -> dict[str, Any]:
        """
        Light retrieval for casual queries - might have relevant info

        Args:
            query: User query
            user_level: Access level
            limit: Max results (smaller for light search)

        Returns:
            RAG result dict
        """
        if not self.search:
            return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

        try:
            search_results = await self.search.search_with_conflict_resolution(
                query=query,
                user_level=user_level,
                limit=limit,
                enable_fallbacks=False  # No fallbacks for light search
            )

            if not search_results.get("results"):
                return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

            # Build light context
            docs = []
            for result in search_results["results"][:limit]:
                doc_text = result["text"][:300]  # Shorter for light search
                doc_title = result.get("metadata", {}).get("title", "Document")
                docs.append(f"📄 {doc_title}: {doc_text}")

            context = "\n\n".join(docs) if docs else None

            return {
                "context": context,
                "used_rag": bool(context),
                "document_count": len(docs),
                "docs": search_results["results"][:limit],
                "collection_used": "multi"
            }

        except Exception as e:
            logger.warning(f"🔍 [RAGManager] Light retrieval failed: {e}")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": [], "collection_used": None}

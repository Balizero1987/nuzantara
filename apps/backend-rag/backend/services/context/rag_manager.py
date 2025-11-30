"""
RAG Manager Module
Handles Qdrant search and result formatting
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
        self, query: str, query_type: str, user_level: int = 0, limit: int = 5
    ) -> dict[str, Any]:
        """
        Retrieve RAG context for query

        Args:
            query: User query
            query_type: Query classification (greeting, casual, business, emergency)
            user_level: User access level (0-3)
            limit: Maximum number of documents to retrieve

        Returns:
            {
                "context": str | None,
                "used_rag": bool,
                "document_count": int
            }
        """
        # Skip RAG for greetings and casual queries
        if query_type not in ["business", "emergency"]:
            logger.info(f"🔍 [RAGManager] Skipping for {query_type} query")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": []}

        if not self.search:
            logger.warning("🔍 [RAGManager] SearchService not available")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": []}

        try:
            logger.info(f"🔍 [RAGManager] Fetching context for {query_type} query (multi-collection)")

            # Retrieve relevant documents from Qdrant with multi-collection fallback
            search_results = await self.search.search_with_conflict_resolution(
                query=query, user_level=user_level, limit=limit, enable_fallbacks=True
            )

            if not search_results.get("results"):
                logger.info("🔍 [RAGManager] No results found")
                return {"context": None, "used_rag": False, "document_count": 0, "docs": []}

            # Build RAG context from search results
            rag_docs = []
            for result in search_results["results"][:limit]:
                doc_text = result["text"][:500]  # Limit each doc to 500 chars
                doc_title = result.get("metadata", {}).get("title", "Unknown")
                rag_docs.append(f"📄 {doc_title}: {doc_text}")

            rag_context = "\n\n".join(rag_docs)

            logger.info(
                f"🔍 [RAGManager] Retrieved {len(rag_docs)} documents ({len(rag_context)} chars)"
            )

            return {
                "context": rag_context,
                "used_rag": True,
                "document_count": len(rag_docs),
                "docs": search_results["results"][:limit]  # Include actual results for metadata
            }

        except Exception as e:
            logger.warning(f"🔍 [RAGManager] Retrieval failed: {e}")
            return {"context": None, "used_rag": False, "document_count": 0, "docs": []}

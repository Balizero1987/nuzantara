"""
RAG Manager Module
Handles ChromaDB search and result formatting
"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class RAGManager:
    """
    RAG Manager for retrieval-augmented generation

    Handles:
    - ChromaDB document search
    - Result formatting and truncation
    - Context string building
    """

    def __init__(self, search_service=None):
        """
        Initialize RAG manager

        Args:
            search_service: SearchService instance for ChromaDB queries
        """
        self.search = search_service
        logger.info(f"✅ RAGManager initialized (search: {'✅' if search_service else '❌'})")

    async def retrieve_context(
        self,
        query: str,
        query_type: str,
        user_level: int = 0,
        limit: int = 5
    ) -> Dict[str, Any]:
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
            logger.info(f"⏭️ [RAG] Skipping RAG for {query_type} query (not business/emergency)")
            return {
                "context": None,
                "used_rag": False,
                "document_count": 0
            }

        if not self.search:
            logger.warning("⚠️ [RAG] SearchService not available")
            return {
                "context": None,
                "used_rag": False,
                "document_count": 0
            }

        try:
            logger.info(f"🔍 [RAG] Fetching context for {query_type} query...")

            # Retrieve relevant documents from ChromaDB
            search_results = await self.search.search(
                query=query,
                user_level=user_level,
                limit=limit
            )

            if not search_results.get("results"):
                logger.info("⚠️ [RAG] No results found")
                return {
                    "context": None,
                    "used_rag": False,
                    "document_count": 0
                }

            # Build RAG context from search results
            rag_docs = []
            for result in search_results["results"][:limit]:
                doc_text = result["text"][:500]  # Limit each doc to 500 chars
                doc_title = result.get("metadata", {}).get("title", "Unknown")
                rag_docs.append(f"📄 {doc_title}: {doc_text}")

            rag_context = "\n\n".join(rag_docs)

            logger.info(f"✅ [RAG] Context retrieved: {len(rag_docs)} documents, {len(rag_context)} chars")

            return {
                "context": rag_context,
                "used_rag": True,
                "document_count": len(rag_docs)
            }

        except Exception as e:
            logger.warning(f"⚠️ [RAG] Retrieval failed: {e}")
            return {
                "context": None,
                "used_rag": False,
                "document_count": 0
            }

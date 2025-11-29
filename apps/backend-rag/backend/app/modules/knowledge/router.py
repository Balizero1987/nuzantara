"""
NUZANTARA PRIME - Knowledge Router
HTTP interface for RAG/Search operations
"""

import logging
import time
from typing import Any

from fastapi import APIRouter, HTTPException

from app.models import ChunkMetadata, SearchQuery, SearchResponse, SearchResult
from app.modules.knowledge.service import KnowledgeService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["knowledge"])

# Service instance (singleton pattern)
_knowledge_service: KnowledgeService | None = None


def get_knowledge_service() -> KnowledgeService:
    """Get or create KnowledgeService instance"""
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeService()
    return _knowledge_service


@router.post("/", response_model=SearchResponse)
async def semantic_search(query: SearchQuery) -> SearchResponse:
    """
    Semantic search with tier-based access control.

    - **query**: Search query text
    - **level**: User access level (0-3)
    - **limit**: Maximum results (1-50, default 5)
    - **tier_filter**: Optional specific tier filter

    Returns relevant book chunks filtered by user's access level.
    """
    try:
        start_time = time.time()

        logger.info(
            f"Received query: '{query.query}', collection={query.collection}, level={query.level}, limit={query.limit}"
        )

        # Validate level
        if query.level < 0 or query.level > 3:
            raise HTTPException(status_code=400, detail="Invalid access level. Must be 0-3.")

        # Get service instance
        knowledge_service = get_knowledge_service()

        # Perform search
        raw_results = await knowledge_service.search(
            query=query.query,
            user_level=query.level,
            limit=query.limit,
            tier_filter=query.tier_filter,
            collection_override=query.collection,
        )

        # Format results
        search_results: list[SearchResult] = []

        if raw_results.get("results"):
            for result_dict in raw_results["results"]:
                # Extract data
                text = result_dict.get("text", "")
                metadata_dict = result_dict.get("metadata", {})
                score = result_dict.get("score", 0.0)

                # Convert score to similarity (already normalized)
                similarity_score = score

                # Create metadata model
                metadata = ChunkMetadata(
                    book_title=metadata_dict.get("book_title", "Unknown"),
                    book_author=metadata_dict.get("book_author", "Unknown"),
                    tier=metadata_dict.get("tier", "C"),
                    min_level=metadata_dict.get("min_level", 0),
                    chunk_index=metadata_dict.get("chunk_index", 0),
                    page_number=metadata_dict.get("page_number"),
                    language=metadata_dict.get("language", "en"),
                    topics=metadata_dict.get("topics", []),
                    file_path=metadata_dict.get("file_path", ""),
                    total_chunks=metadata_dict.get("total_chunks", 0),
                )

                # Create search result
                result = SearchResult(
                    text=text, metadata=metadata, similarity_score=round(similarity_score, 4)
                )

                search_results.append(result)

        execution_time = (time.time() - start_time) * 1000

        logger.info(
            f"Search completed: '{query.query}' (level {query.level}) -> "
            f"{len(search_results)} results in {execution_time:.2f}ms"
        )

        return SearchResponse(
            query=query.query,
            results=search_results,
            total_found=len(search_results),
            user_level=query.level,
            execution_time_ms=round(execution_time, 2),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}") from e


@router.get("/health")
async def search_health() -> dict[str, Any]:
    """Quick health check for search service"""
    try:
        get_knowledge_service()  # Verify service is available
        return {
            "status": "operational",
            "service": "knowledge",
            "embeddings": "ready",
            "vector_db": "connected",
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Knowledge service unhealthy: {str(e)}") from e

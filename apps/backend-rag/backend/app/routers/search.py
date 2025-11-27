"""
ZANTARA RAG - Search Router
Semantic search with tier-based access control
"""

import logging
import time

from fastapi import APIRouter, HTTPException

from services.search_service import SearchService

from ..models import ChunkMetadata, SearchQuery, SearchResponse, SearchResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("/", response_model=SearchResponse)
async def semantic_search(query: SearchQuery):
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

        # 🔍 DEBUG: Log incoming request
        logger.info(
            f"🔍 DEBUG ROUTER - Received query: '{query.query}', collection={query.collection}, level={query.level}, limit={query.limit}"
        )

        # Validate level
        if query.level < 0 or query.level > 3:
            raise HTTPException(status_code=400, detail="Invalid access level. Must be 0-3.")

        # Initialize search service
        search_service = SearchService()

        # Perform search
        raw_results = await search_service.search(
            query=query.query,
            user_level=query.level,
            limit=query.limit,
            tier_filter=query.tier_filter,
            collection_override=query.collection,
        )

        # Format results
        search_results: list[SearchResult] = []

        if raw_results["results"]["documents"]:
            for idx in range(len(raw_results["results"]["documents"])):
                # Extract data
                text = raw_results["results"]["documents"][idx]
                metadata_dict = raw_results["results"]["metadatas"][idx]
                distance = raw_results["results"]["distances"][idx]

                # Convert distance to similarity score (0-1)
                similarity_score = 1 / (1 + distance)

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

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/health")
async def search_health():
    """Quick health check for search service"""
    try:
        service = SearchService()
        return {
            "status": "operational",
            "service": "search",
            "embeddings": "ready",
            "vector_db": "connected",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Search service unhealthy: {str(e)}")

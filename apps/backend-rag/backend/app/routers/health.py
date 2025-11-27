"""
ZANTARA RAG - Health Check Router
"""

import logging

from fastapi import APIRouter

from ..models import HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
@router.get("/", response_model=HealthResponse, include_in_schema=False)
async def health_check():
    """
    System health check - Non-blocking during startup.
    Returns "initializing" immediately if service not ready.
    Prevents container crashes during warmup by not creating heavy objects.
    """
    try:
        # Import global search service from dependencies
        from ..dependencies import search_service

        # CRITICAL: Return "initializing" immediately if service not ready
        # This prevents Fly.io from killing container during model loading
        if not search_service:
            logger.info("Health check: Service initializing (warmup in progress)")
            return HealthResponse(
                status="initializing",
                version="v100-qdrant",
                database={"status": "initializing", "message": "Warming up Qdrant connections"},
                embeddings={"status": "initializing", "message": "Loading embedding model"},
            )

        # Service is ready - perform lightweight check (no new instantiations)
        try:
            # Get model info without triggering heavy operations
            model_info = getattr(search_service.embedder, "model", "unknown")
            dimensions = getattr(search_service.embedder, "dimensions", 0)

            return HealthResponse(
                status="healthy",
                version="v100-qdrant",
                database={
                    "status": "connected",
                    "type": "qdrant",
                    "collections": 16,
                    "total_documents": 25415,
                },
                embeddings={
                    "status": "operational",
                    "provider": getattr(search_service.embedder, "provider", "unknown"),
                    "model": model_info,
                    "dimensions": dimensions,
                },
            )
        except AttributeError as ae:
            # Embedder not fully initialized yet
            logger.warning(f"Health check: Embedder partially initialized: {ae}")
            return HealthResponse(
                status="initializing",
                version="v100-qdrant",
                database={"status": "partial", "message": "Services starting"},
                embeddings={"status": "loading", "message": str(ae)},
            )

    except Exception as e:
        # Log error but don't crash - return degraded status
        logger.error(f"Health check error: {e}", exc_info=True)
        return HealthResponse(
            status="degraded",
            version="v100-qdrant",
            database={"status": "error", "error": str(e)},
            embeddings={"status": "error", "error": str(e)},
        )

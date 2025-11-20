"""
ZANTARA RAG - Health Check Router
"""

from fastapi import APIRouter
from ...core.qdrant_db import QdrantClient
from ...core.embeddings import EmbeddingsGenerator
from ..models import HealthResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    System health check.
    Verifies database and embeddings service are operational.
    """
    try:
        # Check vector database (Qdrant)
        db = QdrantClient(collection_name="knowledge_base")
        db_stats = db.get_collection_stats()

        # Check embeddings (quick test)
        embedder = EmbeddingsGenerator()
        embedder_info = embedder.get_model_info()

        return HealthResponse(
            status="healthy",
            version="1.0.0",
            database={
                "status": "connected",
                "collection": db_stats.get("collection_name", "knowledge_base"),
                "total_documents": db_stats.get("total_documents", 0),
                "tiers": {}  # Qdrant doesn't use tiers
            },
            embeddings={
                "status": "operational",
                "model": embedder_info["model"],
                "dimensions": embedder_info["dimensions"]
            }
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            version="1.0.0",
            database={"status": "error", "error": str(e)},
            embeddings={"status": "error", "error": str(e)}
        )
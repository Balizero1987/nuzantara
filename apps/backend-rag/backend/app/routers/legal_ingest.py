"""
Legal Document Ingestion Router
API endpoints for Indonesian legal document ingestion pipeline
"""

import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.models import TierLevel
from services.legal_ingestion_service import LegalIngestionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/legal", tags=["legal-ingestion"])

# Initialize service (singleton pattern)
_legal_service: LegalIngestionService | None = None


def get_legal_service() -> LegalIngestionService:
    """Get or create LegalIngestionService instance"""
    global _legal_service
    if _legal_service is None:
        _legal_service = LegalIngestionService()
    return _legal_service


class LegalIngestRequest(BaseModel):
    """Request model for legal document ingestion"""

    file_path: str = Field(..., description="Path to legal document file")
    title: str | None = Field(None, description="Document title (auto-extracted if not provided)")
    tier: str | None = Field(None, description="Tier override (S, A, B, C, D)")
    collection_name: str | None = Field(
        None, description="Override collection name (default: legal_unified)"
    )


class LegalIngestResponse(BaseModel):
    """Response model for legal document ingestion"""

    success: bool
    book_title: str
    chunks_created: int
    legal_metadata: dict[str, Any] | None = None
    structure: dict[str, Any] | None = None
    message: str
    error: str | None = None


@router.post("/ingest", response_model=LegalIngestResponse, status_code=status.HTTP_200_OK)
async def ingest_legal_document(request: LegalIngestRequest) -> LegalIngestResponse:
    """
    Ingest a single legal document through the specialized pipeline.

    Pipeline stages:
    1. Clean: Remove headers/footers/noise
    2. Extract Metadata: Type, number, year, topic
    3. Parse Structure: BAB, Pasal, Ayat hierarchy
    4. Chunk: Pasal-aware chunking with context injection
    5. Embed & Store: Generate embeddings and store in Qdrant

    Args:
        request: Legal ingestion request with file path and options

    Returns:
        Ingestion result with metadata and statistics
    """
    try:
        # Validate file exists
        if not Path(request.file_path).exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {request.file_path}",
            )

        # Parse tier override if provided
        tier_override = None
        if request.tier:
            try:
                tier_override = TierLevel(request.tier.upper())
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid tier: {request.tier}. Must be one of: S, A, B, C, D",
                )

        # Get service and ingest
        service = get_legal_service()
        result = await service.ingest_legal_document(
            file_path=request.file_path,
            title=request.title,
            tier_override=tier_override,
            collection_name=request.collection_name,
        )

        return LegalIngestResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in legal ingestion endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest legal document: {str(e)}",
        )


@router.post("/ingest-batch", status_code=status.HTTP_200_OK)
async def ingest_legal_documents_batch(
    file_paths: list[str],
    collection_name: str | None = None,
) -> dict[str, Any]:
    """
    Ingest multiple legal documents in batch.

    Args:
        file_paths: List of file paths to ingest
        collection_name: Override collection name (optional)

    Returns:
        Batch ingestion results
    """
    service = get_legal_service()
    results = []

    for file_path in file_paths:
        try:
            result = await service.ingest_legal_document(
                file_path=file_path, collection_name=collection_name
            )
            results.append({"file_path": file_path, **result})
        except Exception as e:
            logger.error(f"Error ingesting {file_path}: {e}")
            results.append(
                {
                    "file_path": file_path,
                    "success": False,
                    "error": str(e),
                }
            )

    successful = sum(1 for r in results if r.get("success"))
    failed = len(results) - successful

    return {
        "total": len(results),
        "successful": successful,
        "failed": failed,
        "results": results,
    }


@router.get("/collections/stats", status_code=status.HTTP_200_OK)
async def get_collection_stats(collection_name: str = "legal_unified") -> dict[str, Any]:
    """
    Get statistics for legal document collection.

    Args:
        collection_name: Collection name to query

    Returns:
        Collection statistics
    """
    try:
        service = get_legal_service()
        # Access vector_db to get collection info
        # Note: This requires adding a method to QdrantClient for collection stats
        # For now, return basic info
        return {
            "collection_name": collection_name,
            "message": "Collection stats endpoint - implementation pending",
        }
    except Exception as e:
        logger.error(f"Error getting collection stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get collection stats: {str(e)}",
        )

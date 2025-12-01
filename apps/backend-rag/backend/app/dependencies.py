"""
FastAPI Dependency Injection

Centralized dependencies for all routers to avoid circular imports.
Provides fail-fast behavior with clear error messages for service unavailability.

Note: Qdrant references are legacy - system now uses Qdrant exclusively.
"""

import sys
from pathlib import Path
from typing import TYPE_CHECKING, Any

from fastapi import HTTPException

# Add parent to path
sys.path.append(str(Path(__file__).parent.parent))

from services.search_service import SearchService

# LEGACY CODE CLEANED: Anthropic/Claude removed - using ZANTARA AI only
# Type hints only - these modules don't exist in production
if TYPE_CHECKING:
    from typing import Any as BaliZeroRouter
else:
    BaliZeroRouter = Any

# Global service instances (initialized by main_cloud.py at startup)
search_service: SearchService | None = None
# anthropic_client removed - using ZANTARA AI only
bali_zero_router: Any | None = None
intelligent_router: Any | None = None


def get_search_service() -> SearchService:
    """
    Dependency injection for SearchService.

    Provides singleton SearchService instance to all endpoints.
    Eliminates Qdrant client duplication in Oracle routers.

    Returns:
        SearchService: Singleton instance with Qdrant vector database

    Raises:
        HTTPException: 503 if service not initialized with detailed error info
    """
    if search_service is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "SearchService unavailable",
                "message": "The search service failed to initialize. Check server logs.",
                "retry_after": 30,
                "service": "search",
                "troubleshooting": [
                    "Verify Qdrant is running and accessible",
                    "Check QDRANT_URL environment variable",
                    "Review application startup logs for errors",
                ],
            },
        )
    return search_service


def get_ai_client() -> Any:
    """
    Get AI client or fail with clear error.

    Returns:
        ZantaraAIClient: The initialized AI client

    Raises:
        HTTPException: 503 if AI service not initialized
    """
    # Import here to avoid circular imports
    from app.main_cloud import app

    ai_client = getattr(app.state, "ai_client", None)
    if ai_client is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI service unavailable",
                "message": "The AI service failed to initialize. Check API keys and configuration.",
                "retry_after": 60,
                "service": "ai",
                "troubleshooting": [
                    "Verify OPENAI_API_KEY or GOOGLE_API_KEY is set",
                    "Check API key validity and quota",
                    "Review application startup logs for errors",
                ],
            },
        )
    return ai_client


# LEGACY CODE REMOVED: get_anthropic_client() - Anthropic/Claude removed
# Use ZANTARA AI client instead


def get_bali_zero_router() -> Any | None:
    """
    Dependency injection for Bali Zero router.

    Returns None in production.
    """
    return bali_zero_router


def get_intelligent_router() -> Any:
    """
    Dependency injection for Intelligent Router.

    Returns router instance for handling WhatsApp and other integrations.

    Raises:
        HTTPException: 503 if router not initialized
    """
    if intelligent_router is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Router unavailable",
                "message": "The intelligent router failed to initialize.",
                "retry_after": 30,
                "service": "router",
                "troubleshooting": [
                    "Check that critical services (Search, AI) initialized successfully",
                    "Review application startup logs for errors",
                ],
            },
        )
    return intelligent_router


def get_memory_service() -> Any:
    """
    Dependency injection for Memory Service.

    Returns:
        MemoryServicePostgres: The initialized memory service

    Raises:
        HTTPException: 503 if memory service not initialized
    """
    from app.main_cloud import app

    memory_service = getattr(app.state, "memory_service", None)
    if memory_service is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Memory service unavailable",
                "message": "The memory service failed to initialize. Database may be unavailable.",
                "retry_after": 30,
                "service": "memory",
                "troubleshooting": [
                    "Verify DATABASE_URL is configured",
                    "Check PostgreSQL connection",
                    "Review application startup logs for errors",
                ],
            },
        )
    return memory_service


def get_database_pool() -> Any:
    """
    Dependency injection for database connection pool.

    Returns:
        asyncpg.Pool: The database connection pool

    Raises:
        HTTPException: 503 if database pool not initialized
    """
    from app.main_cloud import app

    db_pool = getattr(app.state, "db_pool", None)
    if db_pool is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Database unavailable",
                "message": "The database connection pool failed to initialize.",
                "retry_after": 30,
                "service": "database",
                "troubleshooting": [
                    "Verify DATABASE_URL environment variable",
                    "Check PostgreSQL server is running",
                    "Verify network connectivity to database",
                ],
            },
        )
    return db_pool

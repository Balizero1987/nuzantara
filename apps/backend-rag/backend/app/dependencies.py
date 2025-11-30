"""
FastAPI Dependency Injection
Centralized dependencies for all routers to avoid circular imports.
Note: Qdrant references are legacy - system now uses Qdrant exclusively.
"""

from typing import TYPE_CHECKING, Any

import asyncpg
from fastapi import HTTPException, Request

# Note: PYTHONPATH is set in Docker to /app:/app/backend
from services.search_service import SearchService

# LEGACY CODE CLEANED: Anthropic/Claude removed - using ZANTARA AI only
# Type hints only - these modules don't exist in production
if TYPE_CHECKING:
    from typing import Any as BaliZeroRouter
else:
    BaliZeroRouter = Any

# Global service instances (initialized by main_integrated.py at startup)
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
        HTTPException: 503 if service not initialized
    """
    if search_service is None:
        raise HTTPException(
            status_code=503,
            detail="Search service not initialized. Server may still be starting up.",
        )
    return search_service


# LEGACY CODE REMOVED: get_anthropic_client() - Anthropic/Claude removed
# Use ZANTARA AI client instead


def get_bali_zero_router() -> Any | None:
    """
    Dependency injection for Bali Zero router.
    Returns None in production.
    """
    return bali_zero_router


def get_intelligent_router() -> Any | None:
    """
    Dependency injection for Intelligent Router.
    Returns router instance for handling WhatsApp and other integrations.
    """
    return intelligent_router


async def get_db_pool(request: Request) -> asyncpg.Pool:
    """
    Dependency injection for asyncpg database pool.
    Provides async PostgreSQL connection pool to all endpoints.

    Usage:
        @router.get("/")
        async def my_endpoint(db: asyncpg.Pool = Depends(get_db_pool)):
            async with db.acquire() as conn:
                result = await conn.fetch("SELECT * FROM table")

    Returns:
        asyncpg.Pool: Async connection pool

    Raises:
        HTTPException: 503 if pool not initialized
    """
    db_pool = getattr(request.app.state, "db_pool", None)
    if db_pool is None:
        raise HTTPException(
            status_code=503,
            detail="Database pool not initialized. Server may still be starting up.",
        )
    return db_pool

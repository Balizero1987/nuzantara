"""
FastAPI Dependency Injection
Centralized dependencies for all routers to avoid circular imports.
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

# Global service instances (initialized by main_integrated.py at startup)
search_service: SearchService | None = None
# anthropic_client removed - using ZANTARA AI only
bali_zero_router: Any | None = None


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

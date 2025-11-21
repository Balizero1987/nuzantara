"""
FastAPI Dependency Injection
Centralized dependencies for all routers to avoid circular imports.
Note: Qdrant references are legacy - system now uses Qdrant exclusively.
"""

from fastapi import HTTPException
from typing import Optional, Any, TYPE_CHECKING
import sys
from pathlib import Path

# Add parent to path
sys.path.append(str(Path(__file__).parent.parent))

from services.search_service import SearchService

# Type hints only - these modules don't exist in production
if TYPE_CHECKING:
    from typing import Any as AnthropicClient, Any as BaliZeroRouter
else:
    AnthropicClient = Any
    BaliZeroRouter = Any

# Global service instances (initialized by main_integrated.py at startup)
search_service: Optional[SearchService] = None
anthropic_client: Optional[Any] = None
bali_zero_router: Optional[Any] = None


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
            detail="Search service not initialized. Server may still be starting up."
        )
    return search_service


def get_anthropic_client() -> Optional[Any]:
    """
    Dependency injection for Anthropic client.
    Returns None in production (AI generation disabled for Oracle endpoints).
    """
    return anthropic_client


def get_bali_zero_router() -> Optional[Any]:
    """
    Dependency injection for Bali Zero router.
    Returns None in production.
    """
    return bali_zero_router

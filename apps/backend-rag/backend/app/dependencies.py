"""
FastAPI Dependency Injection
Centralized dependencies for all routers to avoid circular imports.
Phase 1 Optimization: Eliminates ChromaDB client duplication.
"""

from fastapi import HTTPException
from typing import Optional
import sys
from pathlib import Path

# Add parent to path
sys.path.append(str(Path(__file__).parent.parent))

from services.search_service import SearchService
from llm.anthropic_client import AnthropicClient
from llm.bali_zero_router import BaliZeroRouter

# Global service instances (initialized by main_integrated.py at startup)
search_service: Optional[SearchService] = None
anthropic_client: Optional[AnthropicClient] = None
bali_zero_router: Optional[BaliZeroRouter] = None


def get_search_service() -> SearchService:
    """
    Dependency injection for SearchService.
    Provides singleton SearchService instance to all endpoints.
    Eliminates ChromaDB client duplication in Oracle routers.

    Returns:
        SearchService: Singleton instance with 14 ChromaDB collections

    Raises:
        HTTPException: 503 if service not initialized
    """
    if search_service is None:
        raise HTTPException(
            status_code=503,
            detail="Search service not initialized. Server may still be starting up."
        )
    return search_service


def get_anthropic_client() -> AnthropicClient:
    """Dependency injection for Anthropic client"""
    if anthropic_client is None:
        raise HTTPException(
            status_code=503,
            detail="Anthropic client not initialized."
        )
    return anthropic_client


def get_bali_zero_router() -> BaliZeroRouter:
    """Dependency injection for Bali Zero router"""
    if bali_zero_router is None:
        raise HTTPException(
            status_code=503,
            detail="Bali Zero router not initialized."
        )
    return bali_zero_router

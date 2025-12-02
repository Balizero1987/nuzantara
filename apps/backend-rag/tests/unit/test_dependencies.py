"""
Unit tests for FastAPI dependency injection functions.

Note: Some dependency functions (get_ai_client, get_memory_service, get_database_pool)
use internal imports to avoid circular dependencies. These are tested via integration
tests and the health endpoints.
"""

from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app import dependencies


class TestGetSearchService:
    """Tests for get_search_service dependency."""

    def test_returns_service_when_available(self):
        """Test that service is returned when initialized."""
        mock_service = MagicMock()

        # Save original value
        original = dependencies.search_service

        try:
            dependencies.search_service = mock_service
            result = dependencies.get_search_service()
            assert result == mock_service
        finally:
            # Restore original value
            dependencies.search_service = original

    def test_raises_503_when_unavailable(self):
        """Test that HTTPException 503 is raised when service unavailable."""
        original = dependencies.search_service

        try:
            dependencies.search_service = None

            with pytest.raises(HTTPException) as exc_info:
                dependencies.get_search_service()

            assert exc_info.value.status_code == 503
            assert exc_info.value.detail["error"] == "SearchService unavailable"
            assert "retry_after" in exc_info.value.detail
            assert exc_info.value.detail["service"] == "search"
            assert "troubleshooting" in exc_info.value.detail
        finally:
            dependencies.search_service = original

    def test_error_includes_troubleshooting_hints(self):
        """Test that error response includes troubleshooting hints."""
        original = dependencies.search_service

        try:
            dependencies.search_service = None

            with pytest.raises(HTTPException) as exc_info:
                dependencies.get_search_service()

            hints = exc_info.value.detail["troubleshooting"]
            assert len(hints) > 0
            assert any("Qdrant" in hint for hint in hints)
        finally:
            dependencies.search_service = original


class TestGetIntelligentRouter:
    """Tests for get_intelligent_router dependency."""

    def test_returns_router_when_available(self):
        """Test that router is returned when initialized."""
        mock_router = MagicMock()

        original = dependencies.intelligent_router

        try:
            dependencies.intelligent_router = mock_router
            result = dependencies.get_intelligent_router()
            assert result == mock_router
        finally:
            dependencies.intelligent_router = original

    def test_raises_503_when_unavailable(self):
        """Test that HTTPException 503 is raised when router unavailable."""
        original = dependencies.intelligent_router

        try:
            dependencies.intelligent_router = None

            with pytest.raises(HTTPException) as exc_info:
                dependencies.get_intelligent_router()

            assert exc_info.value.status_code == 503
            assert exc_info.value.detail["error"] == "Router unavailable"
            assert exc_info.value.detail["service"] == "router"
        finally:
            dependencies.intelligent_router = original

    def test_error_includes_troubleshooting(self):
        """Test that error response includes troubleshooting hints."""
        original = dependencies.intelligent_router

        try:
            dependencies.intelligent_router = None

            with pytest.raises(HTTPException) as exc_info:
                dependencies.get_intelligent_router()

            assert "troubleshooting" in exc_info.value.detail
            hints = exc_info.value.detail["troubleshooting"]
            assert len(hints) > 0
        finally:
            dependencies.intelligent_router = original


class TestGetBaliZeroRouter:
    """Tests for get_bali_zero_router dependency."""

    def test_returns_none_when_not_set(self):
        """Test that None is returned when router not set."""
        original = dependencies.bali_zero_router

        try:
            dependencies.bali_zero_router = None
            result = dependencies.get_bali_zero_router()
            assert result is None
        finally:
            dependencies.bali_zero_router = original

    def test_returns_router_when_set(self):
        """Test that router is returned when set."""
        mock_router = MagicMock()
        original = dependencies.bali_zero_router

        try:
            dependencies.bali_zero_router = mock_router
            result = dependencies.get_bali_zero_router()
            assert result == mock_router
        finally:
            dependencies.bali_zero_router = original


class TestDependencyErrorFormat:
    """Tests for consistent error format across dependencies."""

    def test_search_service_error_format(self):
        """Test SearchService error follows standard format."""
        original = dependencies.search_service
        try:
            dependencies.search_service = None
            with pytest.raises(HTTPException) as exc_info:
                dependencies.get_search_service()

            detail = exc_info.value.detail
            assert "error" in detail
            assert "message" in detail
            assert "retry_after" in detail
            assert "service" in detail
            assert "troubleshooting" in detail
            assert isinstance(detail["retry_after"], int)
        finally:
            dependencies.search_service = original

    def test_router_error_format(self):
        """Test IntelligentRouter error follows standard format."""
        original = dependencies.intelligent_router
        try:
            dependencies.intelligent_router = None
            with pytest.raises(HTTPException) as exc_info:
                dependencies.get_intelligent_router()

            detail = exc_info.value.detail
            assert "error" in detail
            assert "message" in detail
            assert "retry_after" in detail
            assert "service" in detail
            assert "troubleshooting" in detail
        finally:
            dependencies.intelligent_router = original

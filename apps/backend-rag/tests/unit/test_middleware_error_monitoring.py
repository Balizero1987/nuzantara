"""
Unit tests for Error Monitoring Middleware
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import Request, Response

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from middleware.error_monitoring import (
    ErrorMonitoringMiddleware,
    create_error_monitoring_middleware,
)


@pytest.fixture
def mock_alert_service():
    """Mock AlertService"""
    service = MagicMock()
    service.send_http_error_alert = AsyncMock()
    return service


@pytest.fixture
def mock_app():
    """Mock FastAPI app"""
    return MagicMock()


@pytest.fixture
def error_middleware(mock_app, mock_alert_service):
    """Create ErrorMonitoringMiddleware instance"""
    return ErrorMonitoringMiddleware(mock_app, mock_alert_service)


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_with_alert_service(mock_app, mock_alert_service):
    """Test middleware initialization with alert service"""
    middleware = ErrorMonitoringMiddleware(mock_app, mock_alert_service)
    assert middleware.enabled is True
    assert middleware.alert_service == mock_alert_service


def test_init_without_alert_service(mock_app):
    """Test middleware initialization without alert service"""
    middleware = ErrorMonitoringMiddleware(mock_app, None)
    assert middleware.enabled is False


# ============================================================================
# Tests for dispatch
# ============================================================================


@pytest.mark.asyncio
async def test_dispatch_success(mock_app, mock_alert_service):
    """Test successful request processing"""
    middleware = ErrorMonitoringMiddleware(mock_app, mock_alert_service)
    request = MagicMock(spec=Request)
    request.state = MagicMock()

    response = MagicMock(spec=Response)
    response.status_code = 200
    response.headers = {}
    call_next = AsyncMock(return_value=response)

    result = await middleware.dispatch(request, call_next)

    assert result == response
    assert "X-Request-ID" in result.headers
    mock_alert_service.send_http_error_alert.assert_not_called()


@pytest.mark.asyncio
async def test_dispatch_4xx_error(mock_app, mock_alert_service):
    """Test handling 4xx error"""
    middleware = ErrorMonitoringMiddleware(mock_app, mock_alert_service)
    request = MagicMock(spec=Request)
    request.state = MagicMock()
    request.method = "GET"
    request.url.path = "/api/test"
    request.headers = {"user-agent": "test-agent"}

    response = MagicMock(spec=Response)
    response.status_code = 404
    response.headers = {}
    response.body = b'{"detail": "Not found"}'
    call_next = AsyncMock(return_value=response)

    result = await middleware.dispatch(request, call_next)

    assert result == response
    # 404 should not trigger alert (only 5xx, 429, 403)
    mock_alert_service.send_http_error_alert.assert_not_called()


@pytest.mark.asyncio
async def test_dispatch_5xx_error(mock_app, mock_alert_service):
    """Test handling 5xx error triggers alert"""
    middleware = ErrorMonitoringMiddleware(mock_app, mock_alert_service)
    request = MagicMock(spec=Request)
    request.state = MagicMock()
    request.method = "GET"
    request.url.path = "/api/test"
    request.headers = {"user-agent": "test-agent"}

    response = MagicMock(spec=Response)
    response.status_code = 500
    response.headers = {}
    response.body = b'{"detail": "Internal error"}'
    call_next = AsyncMock(return_value=response)

    result = await middleware.dispatch(request, call_next)

    assert result == response
    mock_alert_service.send_http_error_alert.assert_called_once()


@pytest.mark.asyncio
async def test_dispatch_429_error(mock_app, mock_alert_service):
    """Test handling 429 error triggers alert"""
    middleware = ErrorMonitoringMiddleware(mock_app, mock_alert_service)
    request = MagicMock(spec=Request)
    request.state = MagicMock()
    request.method = "GET"
    request.url.path = "/api/test"
    request.headers = {"user-agent": "test-agent"}

    response = MagicMock(spec=Response)
    response.status_code = 429
    response.headers = {}
    response.body = b'{"detail": "Too many requests"}'
    call_next = AsyncMock(return_value=response)

    result = await middleware.dispatch(request, call_next)

    assert result == response
    mock_alert_service.send_http_error_alert.assert_called_once()


@pytest.mark.asyncio
async def test_dispatch_exception_handling(mock_app, mock_alert_service):
    """Test handling unhandled exceptions"""
    middleware = ErrorMonitoringMiddleware(mock_app, mock_alert_service)
    request = MagicMock(spec=Request)
    request.state = MagicMock()
    request.method = "GET"
    request.url.path = "/api/test"
    request.headers = {"user-agent": "test-agent"}

    call_next = AsyncMock(side_effect=Exception("Unhandled error"))

    result = await middleware.dispatch(request, call_next)

    assert result.status_code == 500
    assert "request_id" in result.body.decode() if hasattr(result, "body") else True
    mock_alert_service.send_http_error_alert.assert_called_once()


@pytest.mark.asyncio
async def test_dispatch_adds_request_id(mock_app, mock_alert_service):
    """Test that request ID is added to response"""
    middleware = ErrorMonitoringMiddleware(mock_app, mock_alert_service)
    request = MagicMock(spec=Request)
    request.state = MagicMock()

    response = MagicMock(spec=Response)
    response.status_code = 200
    response.headers = {}
    call_next = AsyncMock(return_value=response)

    result = await middleware.dispatch(request, call_next)

    assert "X-Request-ID" in result.headers
    assert hasattr(request.state, "request_id")


# ============================================================================
# Tests for create_error_monitoring_middleware
# ============================================================================


def test_create_error_monitoring_middleware(mock_alert_service):
    """Test factory function creates middleware"""
    factory = create_error_monitoring_middleware(mock_alert_service)
    middleware = factory(MagicMock())

    assert isinstance(middleware, ErrorMonitoringMiddleware)
    assert middleware.enabled is True

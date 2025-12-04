"""
API tests for health check endpoints.

These tests verify the full request/response cycle for health endpoints,
including middleware and error handling.
"""

import sys
from pathlib import Path

import pytest

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


@pytest.mark.api
class TestHealthEndpoints:
    """API tests for health check endpoints"""

    def test_health_check_endpoint(self, test_client):
        """Test basic health check endpoint"""
        response = test_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data

    def test_health_check_slash(self, test_client):
        """Test health check endpoint with trailing slash"""
        response = test_client.get("/health/")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_detailed_health_endpoint(self, test_client):
        """Test detailed health check endpoint"""
        response = test_client.get("/health/detailed")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert "timestamp" in data

    def test_readiness_check_endpoint(self, test_client):
        """Test readiness check endpoint"""
        # This might return 503 if services aren't initialized
        response = test_client.get("/health/ready")

        # Should return either 200 or 503
        assert response.status_code in [200, 503]

        if response.status_code == 200:
            data = response.json()
            assert "ready" in data
            assert data["ready"] is True

    def test_liveness_check_endpoint(self, test_client):
        """Test liveness check endpoint"""
        response = test_client.get("/health/live")

        assert response.status_code == 200
        data = response.json()
        assert "alive" in data
        assert data["alive"] is True
        assert "timestamp" in data

    def test_debug_config_endpoint(self, test_client):
        """Test debug config endpoint"""
        response = test_client.get("/health/debug/config")

        assert response.status_code == 200
        data = response.json()
        assert "api_keys_count" in data
        assert "environment" in data
        assert "timestamp" in data


@pytest.mark.api
class TestHealthEndpointsWithAuth:
    """API tests for health endpoints with authentication"""

    def test_health_check_with_jwt(self, authenticated_client):
        """Test health check with JWT authentication"""
        response = authenticated_client.get("/health")

        assert response.status_code == 200

    def test_health_check_with_api_key(self, api_key_client):
        """Test health check with API key authentication"""
        response = api_key_client.get("/health")

        assert response.status_code == 200

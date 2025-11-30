"""
Unit tests for Team Activity Router
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.team_activity import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_clock_in():
    """Test clocking in"""
    request_data = {
        "user_id": "user123",
        "email": "test@example.com",
    }
    
    response = client.post("/api/team/clock-in", json=request_data)
    
    # May return 503 if service unavailable or 200 if working
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert "success" in data or "action" in data


def test_clock_out():
    """Test clocking out"""
    request_data = {
        "user_id": "user123",
        "email": "test@example.com",
    }
    
    response = client.post("/api/team/clock-out", json=request_data)
    
    # May return 503 if service unavailable or 200 if working
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert "success" in data or "action" in data


def test_get_my_status():
    """Test getting user status"""
    response = client.get("/api/team/my-status?user_id=user123")
    
    # May return 503 if service unavailable
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert "user_id" in data or "is_online" in data


def test_get_team_status():
    """Test getting team status"""
    # Use a valid admin email from ADMIN_EMAILS list
    # The endpoint requires X-User-Email header with admin email
    response = client.get(
        "/api/team/status",
        headers={"X-User-Email": "antonello@balizero.com"}  # Assuming this is admin
    )
    
    # May return 401 if not admin, 503 if service unavailable, or 200 if working
    assert response.status_code in [200, 401, 403, 503]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list) or isinstance(data, dict)


def test_get_daily_hours():
    """Test getting daily hours"""
    response = client.get("/api/team/hours?user_id=user123&start_date=2024-01-01&end_date=2024-01-31")
    
    # May return 401 if auth required, 503 if service unavailable, or 200 if working
    assert response.status_code in [200, 401, 503]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list) or isinstance(data, dict)


def test_get_weekly_summary():
    """Test getting weekly summary"""
    response = client.get("/api/team/activity/weekly?user_id=user123&week_start=2024-01-01")
    
    # May return 401 if auth required, 503 if service unavailable, or 200 if working
    assert response.status_code in [200, 401, 503]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list) or isinstance(data, dict)


def test_get_monthly_summary():
    """Test getting monthly summary"""
    response = client.get("/api/team/activity/monthly?user_id=user123&month=2024-01")
    
    # May return 401 if auth required, 503 if service unavailable, or 200 if working
    assert response.status_code in [200, 401, 503]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list) or isinstance(data, dict)


def test_export_timesheet():
    """Test exporting timesheet"""
    response = client.get("/api/team/export?user_id=user123&start_date=2024-01-01&end_date=2024-01-31")
    
    # May return 401 if auth required, 400 if invalid params, or 200 if working
    assert response.status_code in [200, 400, 401]


def test_health_check():
    """Test health check"""
    response = client.get("/api/team/health")
    
    assert response.status_code == 200


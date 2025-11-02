"""
ZANTARA RAG - Mock Authentication Endpoints (MVP Only)

⚠️ WARNING: These are MOCK endpoints for development/demo purposes.
They accept ANY credentials and return fake tokens.
DO NOT use in production without implementing real auth!

TODO for Production:
- Replace with real user database
- Implement password hashing (bcrypt)
- Add JWT signing/verification
- Implement session management
- Add rate limiting
- Add CSRF protection
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import hashlib
import time
import logging

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])


# Pydantic Models
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes
    user: Dict[str, Any]


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900


# Mock Endpoints
@router.post("/login", response_model=LoginResponse)
async def mock_login(request: LoginRequest):
    """
    Mock login endpoint - accepts ANY credentials.

    For MVP/demo purposes only. Returns deterministic tokens based on email.

    Args:
        request: Login credentials (email + password)

    Returns:
        Mock JWT tokens and user info

    Example:
        ```
        POST /auth/login
        {"email": "demo@zantara.com", "password": "anything"}
        ```
    """
    # Generate deterministic mock tokens
    email_hash = hashlib.md5(request.email.encode()).hexdigest()[:16]
    timestamp = int(time.time())

    logger.info(f"🔓 Mock login: {request.email}")

    return LoginResponse(
        access_token=f"mock_access_{email_hash}_{timestamp}",
        refresh_token=f"mock_refresh_{email_hash}_{timestamp}",
        token_type="bearer",
        expires_in=900,
        user={
            "id": email_hash,
            "email": request.email,
            "name": request.email.split("@")[0],
            "tier": "free",
            "avatar": None
        }
    )


@router.post("/refresh", response_model=RefreshResponse)
async def mock_refresh(request: RefreshRequest):
    """
    Mock token refresh endpoint - returns new token without validation.

    For MVP/demo purposes only.

    Args:
        request: Refresh token

    Returns:
        New access token

    Example:
        ```
        POST /auth/refresh
        {"refresh_token": "mock_refresh_abc123_456"}
        ```
    """
    timestamp = int(time.time())
    token_hash = hashlib.md5(request.refresh_token.encode()).hexdigest()[:16]

    logger.info(f"🔄 Mock token refresh: {request.refresh_token[:20]}...")

    return RefreshResponse(
        access_token=f"mock_access_refreshed_{token_hash}_{timestamp}",
        token_type="bearer",
        expires_in=900
    )


@router.post("/logout")
async def mock_logout():
    """
    Mock logout endpoint - always succeeds.

    For MVP/demo purposes only. Real implementation would invalidate session.

    Returns:
        Success message

    Example:
        ```
        POST /auth/logout
        ```
    """
    logger.info("👋 Mock logout")
    return {
        "success": True,
        "message": "Logged out successfully (mock)"
    }


@router.get("/me")
async def mock_get_current_user():
    """
    Mock get current user endpoint.

    For MVP/demo purposes only. Real implementation would validate JWT.

    Returns:
        Mock user info

    Example:
        ```
        GET /auth/me
        Authorization: Bearer <token>
        ```
    """
    logger.info("👤 Mock get user")
    return {
        "id": "mock_user_123",
        "email": "demo@zantara.com",
        "name": "Demo User",
        "tier": "free",
        "avatar": None
    }

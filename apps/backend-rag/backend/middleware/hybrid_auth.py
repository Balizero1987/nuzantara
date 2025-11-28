"""
Hybrid Authentication Middleware
Combines API Key and JWT authentication for flexible access control
"""

import logging
from typing import Optional, Dict, Any
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.services.api_key_auth import APIKeyAuth
from app.core.config import settings

logger = logging.getLogger(__name__)


class HybridAuthMiddleware(BaseHTTPMiddleware):
    """
    Hybrid Authentication Middleware that provides flexible authentication:
    1. API Key authentication (fast, bypasses database dependency)
    2. JWT fallback authentication (production-grade)
    3. Public endpoints (no authentication)

    This middleware allows gradual migration from JWT-only to hybrid approach
    while maintaining backward compatibility.
    """

    def __init__(self, app):
        super().__init__(app)
        self.api_key_auth = APIKeyAuth()

        # Determine if API key authentication is enabled
        self.api_auth_enabled = settings.api_auth_enabled
        self.api_auth_bypass_db = settings.api_auth_bypass_db

        logger.info(f"HybridAuthMiddleware initialized - API Auth: {self.api_auth_enabled}, Bypass DB: {self.api_auth_bypass_db}")

    async def dispatch(self, request: Request, call_next):
        """
        Dispatch request through authentication middleware

        Authentication Priority:
        1. API Key (X-API-Key header) - fastest, bypasses database
        2. JWT Token (Authorization header) - standard JWT flow
        3. No Auth - for public endpoints
        """
        try:
            # Add timing for performance monitoring
            start_time = datetime.now(timezone.utc)

            # Only apply authentication if enabled
            if self.api_auth_enabled:
                auth_result = await self.authenticate_request(request)

                # Inject authenticated user context into request state
                if auth_result:
                    request.state.user = auth_result
                    request.state.auth_type = getattr(auth_result, 'auth_method', 'unknown')
                    logger.debug(f"Authenticated request: {auth_result.get('role', 'unknown')} via {request.state.auth_type}")
                else:
                    request.state.user = None
                    request.state.auth_type = 'public'
                    logger.debug("Public endpoint - no authentication required")

            # Process the request
            response = await call_next(request)

            # Add auth metadata to response headers for monitoring
            if hasattr(request.state, 'auth_type'):
                response.headers["X-Auth-Type"] = request.state.auth_type

            return response

        except Exception as e:
            logger.error(f"Authentication middleware error: {e}")
            # Don't fail requests due to auth issues - allow processing
            # This ensures the system remains operational even with auth problems
            return await call_next(request)

    async def authenticate_request(self, request: Request) -> Optional[Dict[str, Any]]:
        """
        Authenticate request using hybrid approach

        Returns user context if authenticated, None if public access
        """
        # Priority 1: API Key Authentication (fastest, bypasses database)
        api_key_user = await self.authenticate_api_key(request)
        if api_key_user:
            logger.debug("API Key authentication successful")
            return api_key_user

        # Priority 2: JWT Authentication (fallback to existing system)
        jwt_user = await self.authenticate_jwt(request)
        if jwt_user:
            logger.debug("JWT authentication successful")
            return jwt_user

        # No authentication provided - treat as public request
        return None

    async def authenticate_api_key(self, request: Request) -> Optional[Dict[str, Any]]:
        """
        Authenticate using API Key from X-API-Key header

        Fast authentication without database dependency
        """
        if not self.api_auth_enabled:
            return None

        # Get API key from header
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return None

        # Validate API key
        user_context = self.api_key_auth.validate_api_key(api_key)

        if user_context:
            logger.info(f"API Key authenticated: {user_context['role']} from {request.client.host}")
            return user_context
        else:
            # Log invalid API key attempts (for security monitoring)
            logger.warning(f"Invalid API key attempt from {request.client.host}")

            # Still return None (don't raise exception to allow public fallback)
            return None

    async def authenticate_jwt(self, request: Request) -> Optional[Dict[str, Any]]:
        """
        Fallback to JWT authentication

        Uses existing JWT validation system
        """
        if not self.api_auth_bypass_db:
            # If database bypass is disabled, try JWT authentication
            try:
                from app.routers.auth import get_current_user

                # Extract JWT token from Authorization header
                auth_header = request.headers.get("Authorization")
                if not auth_header or not auth_header.startswith("Bearer "):
                    return None

                jwt_token = auth_header[7:]  # Remove "Bearer " prefix

                # Create a mock request object for JWT validation
                # This is a simplified approach - in production you might want to
                # refactor get_current_user to work with middleware context
                request_copy = request
                request_copy.headers._list = [
                    (k, v) for k, v in request.headers.items()
                    if k.lower() != "authorization" or not v.startswith("Bearer ")
                ]
                request_copy.headers._list.append(("Authorization", f"Bearer {jwt_token}"))

                user_context = await get_current_user(request)
                return user_context

            except Exception as e:
                logger.warning(f"JWT authentication failed: {e}")
                return None
        else:
            # Database bypass enabled - skip JWT validation
            return None

    def get_auth_stats(self) -> Dict[str, Any]:
        """Get authentication statistics for monitoring"""
        return {
            "api_auth_enabled": self.api_auth_enabled,
            "api_auth_bypass_db": self.api_auth_bypass_db,
            "api_key_stats": self.api_key_auth.get_service_stats(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


def create_default_user_context() -> Dict[str, Any]:
    """Create default user context for public endpoints"""
    return {
        "id": "public_user",
        "email": "public@zantara.dev",
        "name": "Public User",
        "role": "public",
        "status": "active",
        "auth_method": "public",
        "permissions": ["read"],
        "metadata": {
            "source": "hybrid_auth_middleware",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    }
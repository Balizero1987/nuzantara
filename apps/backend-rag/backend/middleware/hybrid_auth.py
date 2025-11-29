"""
Hybrid Authentication Middleware - Fail-Closed Implementation
Combines API Key and JWT authentication for flexible access control with security-first approach
"""

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_503_SERVICE_UNAVAILABLE

from app.core.config import settings
from app.services.api_key_auth import APIKeyAuth

logger = logging.getLogger(__name__)


class HybridAuthMiddleware(BaseHTTPMiddleware):
    """
    Fail-Closed Hybrid Authentication Middleware that provides secure, flexible authentication:
    1. Public endpoints (health, docs, metrics) - no authentication required
    2. API Key authentication (fast, bypasses database dependency) - for internal services
    3. JWT authentication (production-grade) - for external users

    SECURITY POLICY: Fail-Closed - any authentication system error denies access
    """

    def __init__(self, app):
        super().__init__(app)
        self.api_key_auth = APIKeyAuth()

        # Configure authentication settings
        self.api_auth_enabled = settings.api_auth_enabled
        self.api_auth_bypass_db = settings.api_auth_bypass_db

        # Define public endpoints that don't require authentication
        self.public_endpoints = [
            "/health",
            "/health/",
            "/docs",
            "/docs/",
            "/openapi.json",
            "/redoc",
            "/metrics",
            "/metrics/"
        ]

        logger.info(
            f"HybridAuthMiddleware initialized - API Auth: {self.api_auth_enabled}, "
            f"Bypass DB: {self.api_auth_bypass_db}, Public Endpoints: {len(self.public_endpoints)}"
        )

    def is_public_endpoint(self, request: Request) -> bool:
        """Check if the requested endpoint is public (no auth required)"""
        path = request.url.path
        return any(path.startswith(endpoint) for endpoint in self.public_endpoints)

    async def dispatch(self, request: Request, call_next):
        """
        Fail-Closed request dispatch through authentication middleware

        Authentication Priority:
        1. Public endpoints (health, docs, metrics) - no authentication
        2. API Key (X-API-Key header) - fastest, bypasses database
        3. JWT Token (Authorization header) - standard JWT flow

        SECURITY: Any authentication error = deny access (fail-closed)
        """
        try:
            # Step 1: Check if this is a public endpoint
            if self.is_public_endpoint(request):
                logger.debug(f"Public endpoint accessed: {request.url.path}")
                response = await call_next(request)
                response.headers["X-Auth-Type"] = "public"
                return response

            # Step 2: Apply authentication if enabled (all non-public endpoints)
            if self.api_auth_enabled:
                auth_result = await self.authenticate_request(request)

                # Fail-Closed: authentication required for non-public endpoints
                if not auth_result:
                    logger.warning(f"Authentication failed for: {request.url.path} from {request.client.host}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication required",
                        headers={"WWW-Authenticate": "Bearer"}
                    )

                # Inject authenticated user context into request state
                request.state.user = auth_result
                request.state.auth_type = getattr(auth_result, "auth_method", "unknown")

                logger.debug(
                    f"Request authenticated: {request.url.path} - "
                    f"User: {auth_result.get('email', 'unknown')} via {request.state.auth_type}"
                )

            # Step 3: Process the authenticated request
            response = await call_next(request)

            # Step 4: Add auth metadata to response headers for monitoring
            if hasattr(request.state, "auth_type"):
                response.headers["X-Auth-Type"] = request.state.auth_type

            return response

        except HTTPException:
            # Re-raise HTTP exceptions (proper error responses)
            raise
        except Exception as e:
            # FAIL-CLOSED: Any system error = deny access for security
            logger.critical(
                f"Authentication system failure - ACCESS DENIED: {e}. "
                f"Request: {request.url.path} from {request.client.host}"
            )
            raise HTTPException(
                status_code=HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service temporarily unavailable"
            )

    async def authenticate_request(self, request: Request) -> dict[str, Any] | None:
        """
        Fail-Closed hybrid authentication

        Returns user context if authenticated, None if authentication fails
        SECURITY: None result = access denied (handled by dispatch)
        """
        # Priority 1: API Key Authentication (fastest, bypasses database)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            logger.debug(f"API Key authentication attempt from {request.client.host}")
            user_context = self.api_key_auth.validate_api_key(api_key)
            if user_context:
                logger.info(f"API Key authenticated: {user_context.get('role', 'unknown')} from {request.client.host}")
                return user_context
            else:
                # API Key provided but invalid = immediate failure
                logger.warning(f"Invalid API Key attempt from {request.client.host}")
                return None

        # Priority 2: JWT Authentication (fallback to existing system)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            if not self.api_auth_bypass_db:
                logger.debug(f"JWT authentication attempt from {request.client.host}")
                jwt_user = await self.authenticate_jwt(request)
                if jwt_user:
                    logger.info(f"JWT authenticated: {jwt_user.get('email', 'unknown')} from {request.client.host}")
                    return jwt_user
                else:
                    # JWT provided but invalid = immediate failure
                    logger.warning(f"Invalid JWT attempt from {request.client.host}")
                    return None
            else:
                logger.warning("JWT authentication bypassed by configuration")
                return None

        # No authentication provided = failure for non-public endpoints
        logger.debug(f"No authentication provided for protected endpoint: {request.url.path}")
        return None

    async def authenticate_jwt(self, request: Request) -> dict[str, Any] | None:
        """
        JWT authentication with proper error handling

        Uses existing JWT validation system
        """
        try:
            from app.routers.auth import get_current_user

            # Extract JWT token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None

            jwt_token = auth_header[7:]  # Remove "Bearer " prefix

            # Call JWT validation through existing system
            user_context = await get_current_user(request)
            return user_context

        except Exception as e:
            # Log JWT validation failures for security monitoring
            logger.warning(f"JWT authentication failed: {e}")
            return None

    def get_auth_stats(self) -> dict[str, Any]:
        """Get authentication statistics for monitoring"""
        return {
            "api_auth_enabled": self.api_auth_enabled,
            "api_auth_bypass_db": self.api_auth_bypass_db,
            "api_key_stats": self.api_key_auth.get_service_stats(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


def create_default_user_context() -> dict[str, Any]:
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
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    }

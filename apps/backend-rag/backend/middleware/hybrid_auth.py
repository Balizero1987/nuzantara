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
from starlette.status import HTTP_503_SERVICE_UNAVAILABLE

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
            "/api/v1/openapi.json",  # OpenAPI spec for contract verification
            "/redoc",
            "/metrics",
            "/metrics/",
            "/api/auth/team/login",  # Login endpoint must be public
            "/api/auth/login",  # Login endpoint must be public
            "/api/auth/csrf-token",  # CSRF token endpoint must be public
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
        # Removed sensitive debug logging - headers contain auth tokens
        logger.debug(f"Middleware dispatching: {request.url.path}")
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
                    logger.warning(
                        f"Authentication failed for: {request.url.path} from {request.client.host}"
                    )
                    from fastapi.responses import JSONResponse

                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"detail": "Authentication required"},
                        headers={"WWW-Authenticate": "Bearer"},
                    )

                # Inject authenticated user context into request state
                request.state.user = auth_result
                request.state.auth_type = getattr(auth_result, "auth_method", "unknown")

                user_email = auth_result.get("email", "unknown")
                logger.debug(
                    f"Request authenticated: {request.url.path} - "
                    f"User: {user_email} via {request.state.auth_type}"
                )

            # Step 3: Process the authenticated request
            response = await call_next(request)

            # Step 4: Add auth metadata to response headers for monitoring
            if hasattr(request.state, "auth_type"):
                response.headers["X-Auth-Type"] = request.state.auth_type

            return response

        except HTTPException as exc:
            # Return JSONResponse for HTTP exceptions to avoid 500 error in BaseHTTPMiddleware
            from fastapi.responses import JSONResponse

            return JSONResponse(
                status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers
            )
        except Exception as e:
            # FAIL-CLOSED: Any system error = deny access for security
            client_host = request.client.host if request.client else "unknown"
            print(f"CRITICAL: Authentication system failure: {e}")
            logger.critical(
                f"Authentication system failure - ACCESS DENIED: {e}. "
                f"Request: {request.url.path} from {client_host}"
            )
            from fastapi.responses import JSONResponse

            return JSONResponse(
                status_code=HTTP_503_SERVICE_UNAVAILABLE,
                content={"detail": "Authentication service temporarily unavailable"},
            )

    async def authenticate_request(self, request: Request) -> dict[str, Any] | None:
        """
        Fail-Closed hybrid authentication

        Returns user context if authenticated, None if authentication fails
        SECURITY: None result = access denied (handled by dispatch)
        """
        client_host = request.client.host if request.client else "unknown"

        # Priority 1: API Key Authentication (fastest, bypasses database)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            logger.debug(f"API Key authentication attempt from {client_host}")
            user_context = self.api_key_auth.validate_api_key(api_key)
            if user_context:
                logger.info(
                    f"API Key authenticated: {user_context.get('role', 'unknown')} from {client_host}"
                )
                return user_context
            else:
                # API Key provided but invalid = immediate failure
                logger.warning(f"Invalid API Key attempt from {client_host}")
                return None

        # Priority 2: JWT Authentication (fallback to existing system)
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            if not self.api_auth_bypass_db:
                logger.debug(f"JWT authentication attempt from {client_host}")
                jwt_user = await self.authenticate_jwt(request)
                if jwt_user:
                    logger.info(
                        f"JWT authenticated: {jwt_user.get('email', 'unknown')} from {request.client.host}"
                    )
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
        Stateless JWT authentication
        """
        try:
            from jose import JWTError, jwt

            # Extract JWT token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None

            jwt_token = auth_header[7:]  # Remove "Bearer " prefix

            # Stateless validation using secret key
            payload = jwt.decode(
                jwt_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
            )

            # Validate required fields
            if not payload.get("sub") or not payload.get("email"):
                logger.warning("JWT missing required claims")
                return None

            # Construct user context from token
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role", "member"),
                "auth_method": "jwt_stateless",
                "name": payload.get("name", payload.get("email").split("@")[0]),
                "status": "active",
            }

        except JWTError as e:
            logger.warning(f"JWT validation failed: {e}")
            return None
        except Exception as e:
            logger.warning(f"Unexpected JWT error: {e}")
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

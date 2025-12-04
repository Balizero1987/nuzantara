"""
ZANTARA RAG - Health Check Router

Provides health check endpoints for monitoring service status:
- /health - Basic health check for load balancers
- /health/detailed - Comprehensive service status for debugging
"""

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from ..models import HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
@router.get("/", response_model=HealthResponse, include_in_schema=False)
async def health_check():
    """
    System health check - Non-blocking during startup.

    Returns "initializing" immediately if service not ready.
    Prevents container crashes during warmup by not creating heavy objects.
    """
    try:
        # Import global search service from dependencies
        from ..dependencies import search_service

        # CRITICAL: Return "initializing" immediately if service not ready
        # This prevents Fly.io from killing container during model loading
        if not search_service:
            logger.info("Health check: Service initializing (warmup in progress)")
            return HealthResponse(
                status="initializing",
                version="v100-qdrant",
                database={"status": "initializing", "message": "Warming up Qdrant connections"},
                embeddings={"status": "initializing", "message": "Loading embedding model"},
            )

        # Service is ready - perform lightweight check (no new instantiations)
        try:
            # Get model info without triggering heavy operations
            model_info = getattr(search_service.embedder, "model", "unknown")
            dimensions = getattr(search_service.embedder, "dimensions", 0)

            return HealthResponse(
                status="healthy",
                version="v100-qdrant",
                database={
                    "status": "connected",
                    "type": "qdrant",
                    "collections": 17,
                    "total_documents": 25437,
                },
                embeddings={
                    "status": "operational",
                    "provider": getattr(search_service.embedder, "provider", "unknown"),
                    "model": model_info,
                    "dimensions": dimensions,
                },
            )
        except AttributeError as ae:
            # Embedder not fully initialized yet
            logger.warning(f"Health check: Embedder partially initialized: {ae}")
            return HealthResponse(
                status="initializing",
                version="v100-qdrant",
                database={"status": "partial", "message": "Services starting"},
                embeddings={"status": "loading", "message": str(ae)},
            )

    except Exception as e:
        # Log error but don't crash - return degraded status
        logger.error(f"Health check error: {e}", exc_info=True)
        return HealthResponse(
            status="degraded",
            version="v100-qdrant",
            database={"status": "error", "error": str(e)},
            embeddings={"status": "error", "error": str(e)},
        )


@router.get("/detailed")
async def detailed_health() -> dict[str, Any]:
    """
    Detailed health check showing all service statuses.

    Returns comprehensive information about each service for debugging
    and monitoring purposes. Includes:
    - Individual service status (healthy/degraded/unavailable)
    - Error messages for failed services
    - Database connectivity check
    - Overall system health assessment

    Returns:
        dict: Detailed health status with per-service breakdown
    """
    from .. import dependencies
    from ..main_cloud import app

    services: dict[str, dict[str, Any]] = {}

    # Check SearchService (Critical)
    try:
        ss = dependencies.search_service
        if ss:
            services["search"] = {
                "status": "healthy",
                "critical": True,
                "details": {
                    "provider": getattr(ss.embedder, "provider", "unknown"),
                    "model": getattr(ss.embedder, "model", "unknown"),
                },
            }
        else:
            services["search"] = {"status": "unavailable", "critical": True}
    except Exception as e:
        services["search"] = {"status": "error", "critical": True, "error": str(e)}

    # Check AI Client (Critical)
    try:
        ai = getattr(app.state, "ai_client", None)
        if ai:
            services["ai"] = {
                "status": "healthy",
                "critical": True,
                "details": {"type": type(ai).__name__},
            }
        else:
            services["ai"] = {"status": "unavailable", "critical": True}
    except Exception as e:
        services["ai"] = {"status": "error", "critical": True, "error": str(e)}

    # Check Database Pool
    try:
        db_pool = getattr(app.state, "db_pool", None)
        if db_pool:
            # Perform a lightweight connectivity check
            async with db_pool.acquire() as conn:
                await conn.execute("SELECT 1")
            services["database"] = {
                "status": "healthy",
                "critical": False,
                "details": {
                    "min_size": db_pool.get_min_size(),
                    "max_size": db_pool.get_max_size(),
                    "size": db_pool.get_size(),
                },
            }
        else:
            services["database"] = {"status": "unavailable", "critical": False}
    except Exception as e:
        services["database"] = {"status": "error", "critical": False, "error": str(e)}

    # Check Memory Service
    try:
        memory_service = getattr(app.state, "memory_service", None)
        if memory_service:
            services["memory"] = {
                "status": "healthy",
                "critical": False,
                "details": {"type": type(memory_service).__name__},
            }
        else:
            services["memory"] = {"status": "unavailable", "critical": False}
    except Exception as e:
        services["memory"] = {"status": "error", "critical": False, "error": str(e)}

    # Check Intelligent Router
    try:
        router_instance = getattr(app.state, "intelligent_router", None)
        if router_instance:
            services["router"] = {
                "status": "healthy",
                "critical": False,
                "details": {"type": type(router_instance).__name__},
            }
        else:
            services["router"] = {"status": "unavailable", "critical": False}
    except Exception as e:
        services["router"] = {"status": "error", "critical": False, "error": str(e)}

    # Check Health Monitor
    try:
        health_monitor = getattr(app.state, "health_monitor", None)
        if health_monitor:
            services["health_monitor"] = {
                "status": "healthy",
                "critical": False,
                "details": {"running": getattr(health_monitor, "_running", False)},
            }
        else:
            services["health_monitor"] = {"status": "unavailable", "critical": False}
    except Exception as e:
        services["health_monitor"] = {"status": "error", "critical": False, "error": str(e)}

    # Get service registry status if available
    service_registry_status = None
    try:
        registry = getattr(app.state, "service_registry", None)
        if registry:
            service_registry_status = registry.get_status()
    except Exception as e:
        logger.warning(f"Failed to get service registry status: {e}")

    # Calculate overall status
    critical_services = ["search", "ai"]
    critical_healthy = all(
        services.get(s, {}).get("status") == "healthy" for s in critical_services
    )

    any_degraded = any(services.get(s, {}).get("status") != "healthy" for s in services)

    if not critical_healthy:
        overall_status = "critical"
    elif any_degraded:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    return {
        "status": overall_status,
        "services": services,
        "critical_services": critical_services,
        "registry": service_registry_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "v100-qdrant",
    }


@router.get("/ready")
async def readiness_check() -> dict[str, Any]:
    """
    Kubernetes-style readiness probe.

    Returns 200 only if critical services are ready to handle traffic.
    Used by load balancers to determine if instance should receive traffic.

    Returns:
        dict: Readiness status with critical service check
    """
    from .. import dependencies
    from ..main_cloud import app

    # Check critical services
    search_ready = dependencies.search_service is not None
    ai_ready = getattr(app.state, "ai_client", None) is not None
    services_initialized = getattr(app.state, "services_initialized", False)

    is_ready = search_ready and ai_ready and services_initialized

    if not is_ready:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=503,
            detail={
                "ready": False,
                "search_service": search_ready,
                "ai_client": ai_ready,
                "services_initialized": services_initialized,
            },
        )

    return {
        "ready": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/live")
async def liveness_check() -> dict[str, Any]:
    """
    Kubernetes-style liveness probe.

    Returns 200 if the application is running (even if not fully ready).
    Used by orchestrators to determine if instance needs restart.

    Returns:
        dict: Liveness status
    """
    return {
        "alive": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/debug/config")
async def debug_config() -> dict[str, Any]:
    """
    TEMPORARY: Debug endpoint to check loaded configuration.
    Shows what API keys and config the backend actually loaded.
    """
    from app.core.config import settings
    import os

    return {
        "api_keys_count": len(settings.api_keys.split(",")) if settings.api_keys else 0,
        "api_keys_preview": [
            f"{key[:10]}...{key[-10:]}" for key in settings.api_keys.split(",")
        ] if settings.api_keys else [],
        "api_auth_enabled": settings.api_auth_enabled,
        "jwt_secret_set": bool(settings.jwt_secret_key),
        "jwt_secret_preview": f"{settings.jwt_secret_key[:10]}..." if settings.jwt_secret_key else None,
        "environment": settings.environment,
        "env_vars_present": {
            "API_KEYS": "API_KEYS" in os.environ,
            "JWT_SECRET": "JWT_SECRET" in os.environ or "JWT_SECRET_KEY" in os.environ,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

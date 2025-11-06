"""
Plugin API Routes - FastAPI

Provides REST API for plugin management and execution.
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from core.plugins import registry, executor, PluginCategory
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/plugins", tags=["plugins"])


# Request/Response models
class PluginExecuteRequest(BaseModel):
    """Request to execute a plugin"""

    input_data: Dict[str, Any]
    use_cache: bool = True
    user_id: Optional[str] = None


class PluginListFilters(BaseModel):
    """Filters for listing plugins"""

    category: Optional[PluginCategory] = None
    tags: Optional[List[str]] = None
    allowed_models: Optional[List[str]] = None


# Endpoints
@router.get("/list")
async def list_plugins(
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    allowed_models: Optional[List[str]] = None,
):
    """
    List all available plugins

    Query Parameters:
    - category: Filter by category
    - tags: Filter by tags (comma-separated)
    - allowed_models: Filter by allowed models (comma-separated)
    """
    try:
        # Parse category if provided
        plugin_category = None
        if category:
            try:
                plugin_category = PluginCategory(category)
            except ValueError:
                raise HTTPException(400, f"Invalid category: {category}")

        plugins = registry.list_plugins(
            category=plugin_category, tags=tags, allowed_models=allowed_models
        )

        return {
            "success": True,
            "count": len(plugins),
            "plugins": [p.dict() for p in plugins],
        }

    except Exception as e:
        logger.error(f"Error listing plugins: {e}")
        raise HTTPException(500, str(e))


@router.get("/{plugin_name}")
async def get_plugin(plugin_name: str):
    """
    Get plugin details

    Path Parameters:
    - plugin_name: Plugin name or alias
    """
    plugin = registry.get(plugin_name)
    if not plugin:
        raise HTTPException(404, f"Plugin {plugin_name} not found")

    metadata = plugin.metadata.dict()
    input_schema = plugin.input_schema.schema()
    output_schema = plugin.output_schema.schema()
    metrics = executor.get_metrics(plugin_name)

    return {
        "success": True,
        "plugin": {
            "metadata": metadata,
            "input_schema": input_schema,
            "output_schema": output_schema,
            "metrics": metrics,
        },
    }


@router.post("/{plugin_name}/execute")
async def execute_plugin(
    plugin_name: str,
    request: PluginExecuteRequest,
    x_user_id: Optional[str] = Header(None),
):
    """
    Execute a plugin

    Path Parameters:
    - plugin_name: Plugin name or alias

    Headers:
    - x-user-id: User ID for auth and rate limiting

    Body:
    - input_data: Plugin input data
    - use_cache: Whether to use caching (default: true)
    - user_id: User ID (alternative to header)
    """
    plugin = registry.get(plugin_name)
    if not plugin:
        raise HTTPException(404, f"Plugin {plugin_name} not found")

    # Get user_id from request body or header
    user_id = request.user_id or x_user_id

    try:
        result = await executor.execute(
            plugin_name,
            request.input_data,
            use_cache=request.use_cache,
            user_id=user_id,
        )

        return result

    except Exception as e:
        logger.error(f"Error executing plugin {plugin_name}: {e}")
        raise HTTPException(500, str(e))


@router.get("/{plugin_name}/metrics")
async def get_plugin_metrics(plugin_name: str):
    """
    Get plugin performance metrics

    Path Parameters:
    - plugin_name: Plugin name
    """
    if not registry.get(plugin_name):
        raise HTTPException(404, f"Plugin {plugin_name} not found")

    metrics = executor.get_metrics(plugin_name)

    return {"success": True, "plugin": plugin_name, "metrics": metrics}


@router.get("/metrics/all")
async def get_all_metrics():
    """Get metrics for all plugins"""
    all_metrics = executor.get_all_metrics()

    return {"success": True, "metrics": all_metrics}


@router.post("/search")
async def search_plugins(query: str):
    """
    Search plugins by name, description, or tags

    Body:
    - query: Search query string
    """
    if not query or not query.strip():
        raise HTTPException(400, "Query parameter required")

    results = registry.search(query.strip())

    return {
        "success": True,
        "query": query,
        "count": len(results),
        "results": [r.dict() for r in results],
    }


@router.get("/statistics")
async def get_statistics():
    """Get plugin registry statistics"""
    stats = registry.get_statistics()

    return {"success": True, "statistics": stats}


@router.get("/tools/anthropic")
async def get_anthropic_tools(model: Optional[str] = None):
    """
    Get plugin definitions in Anthropic tool format

    Query Parameters:
    - model: Filter by model (haiku, sonnet, opus)
    """
    if model == "haiku":
        tools = registry.get_haiku_allowed_tools()
    else:
        tools = registry.get_all_anthropic_tools()

    return {"success": True, "count": len(tools), "tools": tools}


# Admin endpoints (require admin auth)
@router.post("/{plugin_name}/reload")
async def reload_plugin(
    plugin_name: str, x_admin_key: Optional[str] = Header(None)
):
    """
    Hot-reload a plugin (admin only)

    Path Parameters:
    - plugin_name: Plugin name to reload

    Headers:
    - x-admin-key: Admin API key
    """
    # TODO: Add proper admin auth check
    if not x_admin_key:
        raise HTTPException(401, "Admin authentication required")

    try:
        await registry.reload_plugin(plugin_name)
        return {"success": True, "message": f"Plugin {plugin_name} reloaded"}
    except Exception as e:
        logger.error(f"Error reloading plugin {plugin_name}: {e}")
        raise HTTPException(500, str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    stats = registry.get_statistics()

    return {
        "success": True,
        "status": "healthy",
        "plugins_loaded": stats["total_plugins"],
    }

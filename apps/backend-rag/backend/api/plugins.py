"""
ZANTARA Plugin API
REST endpoints for plugin management
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import logging
from plugins.registry import plugin_registry

router = APIRouter(prefix="/api/plugins", tags=["plugins"])
logger = logging.getLogger(__name__)

@router.get("/list")
async def list_plugins() -> Dict[str, Any]:
    """List all registered plugins"""
    try:
        plugins = plugin_registry.get_plugin_list()
        return {
            "success": True,
            "count": len(plugins),
            "plugins": plugins
        }
    except Exception as e:
        logger.error(f"Error listing plugins: {e}")
        raise HTTPException(status_code=500, detail="Failed to list plugins")

@router.get("/status")
async def plugin_status() -> Dict[str, Any]:
    """Get plugin system status"""
    try:
        plugin_count = plugin_registry.get_plugin_count()
        return {
            "success": True,
            "plugin_count": plugin_count,
            "status": "operational" if plugin_count > 0 else "no_plugins"
        }
    except Exception as e:
        logger.error(f"Error getting plugin status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get plugin status")
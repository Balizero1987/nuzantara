"""
HANDLER PROXY SERVICE
Allows RAG backend to execute TypeScript handlers via HTTP
"""

import httpx
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class HandlerProxyService:
    """
    Service to execute TypeScript backend handlers from Python RAG backend
    """

    def __init__(self, backend_url: str):
        """
        Initialize handler proxy service

        Args:
            backend_url: TypeScript backend URL (e.g., https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app)
        """
        self.backend_url = backend_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)

    async def execute_handler(
        self,
        handler_key: str,
        params: Optional[Dict[str, Any]] = None,
        internal_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a single TypeScript handler

        Args:
            handler_key: Handler to execute (e.g., "gmail.send", "memory.save")
            params: Parameters to pass to the handler
            internal_key: Internal API key for authentication

        Returns:
            Handler execution result

        Example:
            result = await proxy.execute_handler(
                "gmail.send",
                {"to": "client@example.com", "subject": "Hello", "body": "..."}
            )
        """
        try:
            endpoint = f"{self.backend_url}/system.handler.execute"

            headers = {
                "Content-Type": "application/json"
            }

            if internal_key:
                headers["x-api-key"] = internal_key

            payload = {
                "handler_key": handler_key,
                "handler_params": params or {}
            }

            logger.info(f"🔌 Executing handler: {handler_key}")

            response = await self.client.post(
                endpoint,
                json=payload,
                headers=headers
            )

            response.raise_for_status()
            data = response.json()

            if data.get("ok"):
                logger.info(f"✅ Handler {handler_key} executed successfully")
                return data.get("data", {})
            else:
                logger.error(f"❌ Handler {handler_key} failed: {data.get('error')}")
                return {"error": data.get("error", "Unknown error")}

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error executing {handler_key}: {e.response.status_code}")
            return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            logger.error(f"Error executing handler {handler_key}: {e}")
            return {"error": str(e)}

    async def execute_batch(
        self,
        handlers: List[Dict[str, Any]],
        internal_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute multiple handlers in sequence

        Args:
            handlers: List of handler definitions [{"key": "...", "params": {...}}, ...]
            internal_key: Internal API key for authentication

        Returns:
            Batch execution results

        Example:
            results = await proxy.execute_batch([
                {"key": "memory.save", "params": {"userId": "123", "content": "..."}},
                {"key": "gmail.send", "params": {"to": "...", "subject": "..."}},
            ])
        """
        try:
            endpoint = f"{self.backend_url}/system.handlers.batch"

            headers = {
                "Content-Type": "application/json"
            }

            if internal_key:
                headers["x-api-key"] = internal_key

            payload = {
                "handlers": handlers
            }

            logger.info(f"🔌 Executing batch: {len(handlers)} handlers")

            response = await self.client.post(
                endpoint,
                json=payload,
                headers=headers
            )

            response.raise_for_status()
            data = response.json()

            if data.get("ok"):
                logger.info(f"✅ Batch executed: {len(handlers)} handlers")
                return data.get("data", {})
            else:
                logger.error(f"❌ Batch execution failed: {data.get('error')}")
                return {"error": data.get("error", "Unknown error")}

        except Exception as e:
            logger.error(f"Error executing batch: {e}")
            return {"error": str(e)}

    async def get_all_handlers(self, internal_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Get list of all available handlers

        Returns:
            Dictionary with handler registry
        """
        try:
            endpoint = f"{self.backend_url}/system.handlers.list"

            headers = {}
            if internal_key:
                headers["x-api-key"] = internal_key

            response = await self.client.get(endpoint, headers=headers)
            response.raise_for_status()

            data = response.json()
            if data.get("ok"):
                return data.get("data", {})
            else:
                return {"error": data.get("error")}

        except Exception as e:
            logger.error(f"Error getting handlers list: {e}")
            return {"error": str(e)}

    async def get_anthropic_tools(self, internal_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get Anthropic-compatible tool definitions for all handlers

        Returns:
            List of tool definitions ready for Anthropic API
        """
        try:
            endpoint = f"{self.backend_url}/system.handlers.tools"

            headers = {}
            if internal_key:
                headers["x-api-key"] = internal_key

            response = await self.client.get(endpoint, headers=headers)
            response.raise_for_status()

            data = response.json()
            if data.get("ok"):
                return data.get("data", {}).get("tools", [])
            else:
                logger.error(f"Error getting tool definitions: {data.get('error')}")
                return []

        except Exception as e:
            logger.error(f"Error getting tool definitions: {e}")
            return []

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global instance (initialized in main.py)
handler_proxy: Optional[HandlerProxyService] = None


def get_handler_proxy() -> Optional[HandlerProxyService]:
    """Get global handler proxy instance"""
    return handler_proxy


def init_handler_proxy(backend_url: str) -> HandlerProxyService:
    """
    Initialize global handler proxy

    Args:
        backend_url: TypeScript backend URL

    Returns:
        HandlerProxyService instance
    """
    global handler_proxy
    handler_proxy = HandlerProxyService(backend_url)
    logger.info(f"✅ Handler proxy initialized: {backend_url}")
    return handler_proxy

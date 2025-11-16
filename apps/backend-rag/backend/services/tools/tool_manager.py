"""
Tool Manager - Stub Implementation
Minimal implementation to satisfy imports until full tool system is implemented
"""

from typing import Dict, List, Optional, Any
from loguru import logger


class ToolManager:
    """Minimal ToolManager stub to prevent import errors"""

    def __init__(self, tool_executor: Optional[Any] = None):
        self.tool_executor = tool_executor
        logger.info("🔧 [ToolManager] Initialized (STUB - no tools loaded)")

    async def load_tools(self) -> None:
        """Stub method - no-op"""
        pass

    def get_available_tools(self, ai_type: str = "haiku") -> List[Dict]:
        """Return empty tool list"""
        return []

    def detect_tool_needs(self, message: str) -> Dict:
        """Always return no tool needs"""
        return {
            "should_prefetch": False,
            "needs_tools": False,
            "suggested_tools": []
        }

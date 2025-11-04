"""
Tool Manager Module
Loads, filters, and caches available tools
"""

import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# Tool prefetch keywords (multilingual)
PRICING_KEYWORDS = [
    'harga', 'price', 'berapa', 'cost', 'quanto costa', 'biaya',
    'tarif', 'fee', 'costo', 'cuánto cuesta', 'custo', 'how much'
]

SERVICE_KEYWORDS = [
    'visa', 'kitas', 'kitap', 'c1', 'c2', 'd1', 'd2',
    'e23', 'e28a', 'e31a', 'pt pma', 'npww', 'bpjs',
    'business setup', 'tax', 'setup perusahaan'
]

TEAM_KEYWORDS = [
    'team', 'tim', 'squadra', 'equipo', 'chi è', 'who is',
    'siapa', 'quién es', 'members', 'membri', 'anggota'
]

# Haiku allowed tool prefixes (fast, essential only)
HAIKU_ALLOWED_PREFIXES = [
    "pricing_",           # Pricing queries (fast)
    "team_recent",        # Recent activity (fast)
    "team_list",          # Team members list (fast)
    "memory_retrieve",    # Memory read (fast)
    "memory_search"       # Memory search (fast)
]


class ToolManager:
    """
    Tool Manager for loading and filtering tools

    Handles:
    - Tool loading from ToolExecutor
    - Caching for performance
    - Model-specific filtering (Haiku vs Sonnet)
    - Prefetch detection for streaming
    """

    def __init__(self, tool_executor=None):
        """
        Initialize tool manager

        Args:
            tool_executor: ToolExecutor instance
        """
        self.tool_executor = tool_executor
        self.all_tools = None
        self.haiku_tools = None
        self.tools_loaded = False

        logger.info(f"✅ ToolManager initialized (executor: {'✅' if tool_executor else '❌'})")

    async def load_tools(self):
        """
        Load available tools from ToolExecutor and cache them

        Filters tools for:
        - Haiku: LIMITED tools (fast, essential only)
        - Sonnet: ALL tools (full capability)
        """
        if self.tools_loaded or not self.tool_executor:
            return

        try:
            logger.info("🔧 [ToolManager] Loading available tools...")

            # Get all available tools from ToolExecutor
            self.all_tools = await self.tool_executor.get_available_tools()

            logger.info(f"   Total tools available: {len(self.all_tools)}")

            # Debug: Log all tool names
            tool_names = [t["name"] for t in self.all_tools]
            logger.info(f"🔍 DEBUG: All tool names: {tool_names}")

            # Check for team roster tools
            has_team_list = "get_team_members_list" in tool_names
            has_team_search = "search_team_member" in tool_names
            logger.info(
                f"🔍 DEBUG: Team roster tools present: "
                f"get_team_members_list={has_team_list}, search_team_member={has_team_search}"
            )

            # Filter essential tools for Haiku
            self.haiku_tools = [
                tool for tool in self.all_tools
                if any(tool["name"].startswith(prefix) for prefix in HAIKU_ALLOWED_PREFIXES)
            ]

            logger.info(f"   Haiku tools (LIMITED): {len(self.haiku_tools)}")
            logger.info(f"   Sonnet tools (FULL): {len(self.all_tools)}")

            self.tools_loaded = True

        except Exception as e:
            logger.error(f"❌ [ToolManager] Failed to load tools: {e}")
            self.tools_loaded = False

    def get_available_tools(self, model: str = "haiku") -> Optional[List[Dict]]:
        """
        Get filtered tools for specific model

        Args:
            model: "haiku" or "sonnet"

        Returns:
            List of tool definitions or None
        """
        if not self.tools_loaded:
            return None

        if model == "haiku":
            return self.haiku_tools
        else:
            return self.all_tools

    def detect_tool_needs(self, message: str) -> Dict[str, Any]:
        """
        Detect if query needs tool prefetching before streaming

        Args:
            message: User message

        Returns:
            {
                "should_prefetch": bool,
                "tool_name": str,
                "tool_input": dict
            }
        """
        message_lower = message.lower()

        # Check for pricing query
        has_pricing_keyword = any(kw in message_lower for kw in PRICING_KEYWORDS)
        has_service_keyword = any(kw in message_lower for kw in SERVICE_KEYWORDS)

        if has_pricing_keyword or (has_service_keyword and len(message.split()) < 15):
            logger.info("🎯 [ToolManager] PRICING query detected → Will prefetch pricing tool")
            return {
                "should_prefetch": True,
                "tool_name": "get_pricing",
                "tool_input": {"service_type": "all"}
            }

        # Check for team query
        if any(kw in message_lower for kw in TEAM_KEYWORDS):
            logger.info("🎯 [ToolManager] TEAM query detected → Will prefetch team tool")
            return {
                "should_prefetch": True,
                "tool_name": "get_team_members_list",
                "tool_input": {}
            }

        return {"should_prefetch": False}

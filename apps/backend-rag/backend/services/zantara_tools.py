"""
ZANTARA Tools - Python Native Tools for Claude
Direct execution (no HTTP calls) - faster & more reliable
"""

import logging
from typing import Dict, Any, List, Optional
from services.pricing_service import get_pricing_service

logger = logging.getLogger(__name__)


class ZantaraTools:
    """
    Native Python tools for Zantara AI
    - get_pricing: Official Bali Zero pricing (NO AI generation)
    - Team tools: Team roster, search, etc.
    - Memory tools: User memory operations
    """

    def __init__(self):
        self.pricing_service = get_pricing_service()
        logger.info("✅ ZantaraTools initialized")

    async def execute_tool(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """
        Execute a Zantara tool

        Args:
            tool_name: Name of tool to execute
            tool_input: Tool parameters
            user_id: User ID for context

        Returns:
            Tool execution result
        """
        try:
            logger.info(f"🔧 Executing ZantaraTool: {tool_name}")

            if tool_name == "get_pricing":
                return await self._get_pricing(tool_input)
            elif tool_name == "search_team_member":
                return await self._search_team_member(tool_input)
            elif tool_name == "get_team_members_list":
                return await self._get_team_members_list(tool_input)
            else:
                return {
                    "success": False,
                    "error": f"Unknown tool: {tool_name}"
                }

        except Exception as e:
            logger.error(f"❌ Error executing {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _get_pricing(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get official Bali Zero pricing

        Args:
            params: {
                "service_type": str (visa|kitas|business_setup|tax_consulting|all)
                "query": str (optional - search query)
            }
        """
        try:
            service_type = params.get("service_type", "all")
            query = params.get("query")

            logger.info(f"💰 get_pricing: service_type={service_type}, query={query}")

            # If query provided, search specifically
            if query:
                result = self.pricing_service.search_service(query)
            else:
                result = self.pricing_service.get_pricing(service_type)

            # Check if pricing loaded successfully
            if not self.pricing_service.loaded:
                return {
                    "success": False,
                    "error": "Official prices not loaded",
                    "fallback_contact": {
                        "email": "info@balizero.com",
                        "whatsapp": "+62 813 3805 1876"
                    }
                }

            return {
                "success": True,
                "data": result
            }

        except Exception as e:
            logger.error(f"❌ get_pricing error: {e}")
            return {
                "success": False,
                "error": f"Pricing lookup failed: {str(e)}"
            }

    async def _search_team_member(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Search team member by name or ambaradam

        Args:
            params: {"query": str}
        """
        # Placeholder - implement with actual team data
        query = params.get("query", "").lower()

        logger.info(f"👥 search_team_member: query={query}")

        # TODO: Implement with actual team database
        return {
            "success": True,
            "data": {
                "message": f"Team search for '{query}' - not yet implemented",
                "contact": "info@balizero.com for team inquiries"
            }
        }

    async def _get_team_members_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get full team roster

        Args:
            params: {"department": str (optional)}
        """
        department = params.get("department")

        logger.info(f"👥 get_team_members_list: department={department}")

        # TODO: Implement with actual team database
        return {
            "success": True,
            "data": {
                "message": "Team roster - not yet implemented",
                "contact": "info@balizero.com for team inquiries"
            }
        }

    def get_tool_definitions(self, include_admin_tools: bool = False) -> List[Dict[str, Any]]:
        """
        Get Anthropic-compatible tool definitions

        Returns:
            List of tool definitions for Claude API
        """
        tools = [
            {
                "name": "get_pricing",
                "description": """Get OFFICIAL Bali Zero pricing for services (visa, KITAS, PT PMA setup, tax consulting).

⚠️ CRITICAL: ALWAYS use this tool for ANY pricing question. NEVER generate prices from memory.

This returns OFFICIAL 2025 prices including:
- Visa prices (C1 Tourism, C2 Business, D1/D2 Multiple Entry, etc.)
- KITAS prices (E23 Freelance, E23 Working, E28A Investor, E33F Retirement, E33G Remote Worker)
- Business services (PT PMA setup, company revision, alcohol license, legal real estate)
- Tax services (NPWP, monthly/annual reports, BPJS)
- Quick quote packages
- Bali Zero service margins and government fee breakdowns

MANDATORY USAGE:
- If user asks about ANY price → CALL THIS TOOL
- Examples that REQUIRE this tool:
  * "How much does KITAS cost?"
  * "Berapa harga PT PMA?"
  * "What's the price for..."
  * "Quanto costa..."

DO NOT generate prices from memory - prices change and must be accurate.""",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "service_type": {
                            "type": "string",
                            "enum": ["visa", "kitas", "business_setup", "tax_consulting", "legal", "all"],
                            "description": "Type of service to get pricing for (use 'all' to see everything)"
                        },
                        "query": {
                            "type": "string",
                            "description": "Optional: specific search query (e.g. 'KITAS E23', 'PT PMA', 'B211B visa')"
                        }
                    },
                    "required": ["service_type"]
                }
            },
            {
                "name": "search_team_member",
                "description": "Search for a Bali Zero team member by name or ambaradam. Returns contact info, role, skills.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Name or ambaradam to search for (e.g. 'Dea', 'Zero', 'Krisna')"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_team_members_list",
                "description": "Get full Bali Zero team roster, optionally filtered by department",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "department": {
                            "type": "string",
                            "description": "Optional: filter by department (technology, operations, creative, etc.)"
                        }
                    }
                }
            }
        ]

        logger.info(f"📋 Returning {len(tools)} ZantaraTool definitions")
        return tools


# Global singleton
_zantara_tools: Optional[ZantaraTools] = None


def get_zantara_tools() -> ZantaraTools:
    """Get or create global ZantaraTools instance"""
    global _zantara_tools
    if _zantara_tools is None:
        _zantara_tools = ZantaraTools()
    return _zantara_tools

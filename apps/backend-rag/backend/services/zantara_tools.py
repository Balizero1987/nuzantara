"""
ZANTARA Tools - Python Native Tools for ZANTARA AI
Direct execution (no HTTP calls) - faster & more reliable
LEGACY CODE CLEANED: Claude references removed - using ZANTARA AI only

UPDATED 2025-12-03:
- Added memory tools (retrieve_user_memory, search_memory)
- Added team activity tools (get_team_logins_today, get_team_active_sessions)
- Added team overview and stats tools
- Lazy service loading for optional dependencies
"""

import logging
from typing import TYPE_CHECKING, Any

from services.collaborator_service import CollaboratorService
from services.pricing_service import get_pricing_service

if TYPE_CHECKING:
    from services.memory_service_postgres import MemoryServicePostgres
    from services.team_timesheet_service import TeamTimesheetService

logger = logging.getLogger(__name__)


class ZantaraTools:
    """
    Native Python tools for Zantara AI
    - get_pricing: Official Bali Zero pricing (NO AI generation)
    - Team tools: Team roster, search, activity status
    - Memory tools: User memory retrieval and search
    """

    def __init__(
        self,
        memory_service: "MemoryServicePostgres | None" = None,
        timesheet_service: "TeamTimesheetService | None" = None,
    ):
        self.pricing_service = get_pricing_service()
        self.collaborator_service = CollaboratorService()
        self._memory_service = memory_service
        self._timesheet_service = timesheet_service
        logger.info("✅ ZantaraTools initialized")

    def set_services(
        self,
        memory_service: "MemoryServicePostgres | None" = None,
        timesheet_service: "TeamTimesheetService | None" = None,
    ):
        """Set optional services after initialization (for lazy loading)"""
        if memory_service:
            self._memory_service = memory_service
        if timesheet_service:
            self._timesheet_service = timesheet_service

    async def execute_tool(
        self, tool_name: str, tool_input: dict[str, Any], user_id: str = "system"
    ) -> dict[str, Any]:
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

            # Core tools
            if tool_name == "get_pricing":
                return await self._get_pricing(tool_input)
            elif tool_name == "search_team_member":
                return await self._search_team_member(tool_input)
            elif tool_name == "get_team_members_list":
                return await self._get_team_members_list(tool_input)
            elif tool_name == "get_team_overview":
                return await self._get_team_overview(tool_input)
            # Memory tools
            elif tool_name == "retrieve_user_memory":
                return await self._retrieve_user_memory(tool_input, user_id)
            elif tool_name == "search_memory":
                return await self._search_memory(tool_input, user_id)
            # Team activity tools (requires timesheet service)
            elif tool_name == "get_team_logins_today":
                return await self._get_team_logins_today(tool_input)
            elif tool_name == "get_team_active_sessions":
                return await self._get_team_active_sessions(tool_input)
            elif tool_name == "get_team_member_stats":
                return await self._get_team_member_stats(tool_input)
            elif tool_name == "get_session_details":
                return await self._get_session_details(tool_input, user_id)
            elif tool_name == "end_user_session":
                return await self._end_user_session(tool_input, user_id)
            else:
                return {"success": False, "error": f"Unknown tool: {tool_name}"}

        except Exception as e:
            logger.error(f"❌ Error executing {tool_name}: {e}")
            return {"success": False, "error": str(e)}

    async def _get_pricing(self, params: dict[str, Any]) -> dict[str, Any]:
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
                        "whatsapp": "+62 813 3805 1876",
                    },
                }

            return {"success": True, "data": result}

        except Exception as e:
            logger.error(f"❌ get_pricing error: {e}")
            return {"success": False, "error": f"Pricing lookup failed: {str(e)}"}

    async def _search_team_member(self, params: dict[str, Any]) -> dict[str, Any]:
        """
        Search team member by name

        Args:
            params: {"query": str}
        """
        query = params.get("query", "").lower().strip()

        if not query:
            return {"success": False, "error": "Please provide a name to search for"}

        logger.info(f"👥 search_team_member: query={query}")

        profiles = self.collaborator_service.search_members(query)

        if not profiles:
            return {
                "success": True,
                "data": {
                    "message": f"No team member found matching '{query}'",
                    "suggestion": "Try searching by first name or department",
                },
            }

        results = [
            {
                "name": profile.name,
                "email": profile.email,
                "role": profile.role,
                "department": profile.department,
                "expertise_level": profile.expertise_level,
                "language": profile.language,
                "notes": profile.notes,
                "traits": profile.traits,
            }
            for profile in profiles
        ]

        return {"success": True, "data": {"count": len(results), "results": results}}

    async def _get_team_members_list(self, params: dict[str, Any]) -> dict[str, Any]:
        """
        Get full team roster, optionally filtered by department

        Args:
            params: {"department": str (optional)}
        """
        department = (
            params.get("department", "").lower().strip() if params.get("department") else None
        )

        logger.info(f"👥 get_team_members_list: department={department}")

        profiles = self.collaborator_service.list_members(department)

        roster = [
            {
                "name": profile.name,
                "email": profile.email,
                "role": profile.role,
                "department": profile.department,
                "expertise_level": profile.expertise_level,
                "language": profile.language,
                "traits": profile.traits,
                "notes": profile.notes,
            }
            for profile in profiles
        ]

        # Group by department for better readability
        by_department = {}
        for member in roster:
            dept = member["department"]
            if dept not in by_department:
                by_department[dept] = []
            by_department[dept].append(member)

        # Get team stats
        stats = self.collaborator_service.get_team_stats()

        return {
            "success": True,
            "data": {
                "total_members": len(roster),
                "by_department": by_department,
                "roster": roster,
                "stats": stats,
            },
        }

    async def _get_team_overview(self, params: dict[str, Any]) -> dict[str, Any]:
        """
        Get comprehensive team overview including roster and activity status
        """
        logger.info("👥 get_team_overview")

        # Get roster
        profiles = self.collaborator_service.list_members(None)
        roster = [
            {
                "name": profile.name,
                "email": profile.email,
                "role": profile.role,
                "department": profile.department,
            }
            for profile in profiles
        ]

        # Get online status if timesheet service available
        online_status = []
        if self._timesheet_service:
            try:
                online_status = await self._timesheet_service.get_team_online_status()
            except Exception as e:
                logger.warning(f"⚠️ Could not get online status: {e}")

        # Get team stats
        stats = self.collaborator_service.get_team_stats()

        return {
            "success": True,
            "data": {
                "total_members": len(roster),
                "roster": roster,
                "online_status": online_status,
                "stats": stats,
            },
        }

    # ==================== MEMORY TOOLS ====================

    async def _retrieve_user_memory(
        self, params: dict[str, Any], user_id: str
    ) -> dict[str, Any]:
        """
        Retrieve user's memory (profile facts, summary, counters)

        Args:
            params: {"user_id": str (optional, defaults to current user)}
        """
        target_user = params.get("user_id", user_id)
        logger.info(f"🧠 retrieve_user_memory: user={target_user}")

        if not self._memory_service:
            return {
                "success": False,
                "error": "Memory service not available",
                "data": {"facts": [], "summary": "", "counters": {}},
            }

        try:
            memory = await self._memory_service.get_memory(target_user)
            return {
                "success": True,
                "data": {
                    "user_id": memory.user_id,
                    "facts": memory.profile_facts,
                    "summary": memory.summary,
                    "counters": memory.counters,
                    "updated_at": memory.updated_at.isoformat()
                    if hasattr(memory.updated_at, "isoformat")
                    else str(memory.updated_at),
                },
            }
        except Exception as e:
            logger.error(f"❌ retrieve_user_memory error: {e}")
            return {"success": False, "error": str(e)}

    async def _search_memory(self, params: dict[str, Any], user_id: str) -> dict[str, Any]:
        """
        Search through user's memory facts

        Args:
            params: {"query": str, "user_id": str (optional)}
        """
        query = params.get("query", "").lower()
        target_user = params.get("user_id", user_id)

        logger.info(f"🧠 search_memory: query='{query}', user={target_user}")

        if not query:
            return {"success": False, "error": "Search query is required"}

        if not self._memory_service:
            return {"success": False, "error": "Memory service not available"}

        try:
            memory = await self._memory_service.get_memory(target_user)

            # Simple keyword search in facts
            matching_facts = [
                fact for fact in memory.profile_facts if query in fact.lower()
            ]

            return {
                "success": True,
                "data": {
                    "query": query,
                    "matches": matching_facts,
                    "total_facts": len(memory.profile_facts),
                    "matched_count": len(matching_facts),
                },
            }
        except Exception as e:
            logger.error(f"❌ search_memory error: {e}")
            return {"success": False, "error": str(e)}

    # ==================== TEAM ACTIVITY TOOLS ====================

    async def _get_team_logins_today(self, params: dict[str, Any]) -> dict[str, Any]:
        """
        Get team login activity for today
        """
        logger.info("👥 get_team_logins_today")

        if not self._timesheet_service:
            return {
                "success": False,
                "error": "Timesheet service not available",
                "data": {"logins": [], "message": "Feature requires timesheet service"},
            }

        try:
            daily_hours = await self._timesheet_service.get_daily_hours()
            return {
                "success": True,
                "data": {
                    "date": "today",
                    "total_logins": len(daily_hours),
                    "logins": daily_hours,
                },
            }
        except Exception as e:
            logger.error(f"❌ get_team_logins_today error: {e}")
            return {"success": False, "error": str(e)}

    async def _get_team_active_sessions(self, params: dict[str, Any]) -> dict[str, Any]:
        """
        Get currently active team sessions (who is online now)
        """
        logger.info("👥 get_team_active_sessions")

        if not self._timesheet_service:
            return {
                "success": False,
                "error": "Timesheet service not available",
            }

        try:
            all_status = await self._timesheet_service.get_team_online_status()
            active_sessions = [s for s in all_status if s.get("is_online", False)]

            return {
                "success": True,
                "data": {
                    "total_online": len(active_sessions),
                    "total_team": len(all_status),
                    "active_sessions": active_sessions,
                },
            }
        except Exception as e:
            logger.error(f"❌ get_team_active_sessions error: {e}")
            return {"success": False, "error": str(e)}

    async def _get_team_member_stats(self, params: dict[str, Any]) -> dict[str, Any]:
        """
        Get work statistics for a specific team member

        Args:
            params: {"user_id": str or "email": str}
        """
        user_id = params.get("user_id") or params.get("email")
        logger.info(f"👥 get_team_member_stats: user={user_id}")

        if not user_id:
            return {"success": False, "error": "user_id or email is required"}

        if not self._timesheet_service:
            return {"success": False, "error": "Timesheet service not available"}

        try:
            status = await self._timesheet_service.get_my_status(user_id)
            return {"success": True, "data": status}
        except Exception as e:
            logger.error(f"❌ get_team_member_stats error: {e}")
            return {"success": False, "error": str(e)}

    async def _get_session_details(
        self, params: dict[str, Any], user_id: str
    ) -> dict[str, Any]:
        """
        Get current session details for a user

        Args:
            params: {"user_id": str (optional)}
        """
        target_user = params.get("user_id", user_id)
        logger.info(f"👥 get_session_details: user={target_user}")

        if not self._timesheet_service:
            return {"success": False, "error": "Timesheet service not available"}

        try:
            status = await self._timesheet_service.get_my_status(target_user)
            return {
                "success": True,
                "data": {
                    "user_id": target_user,
                    "is_online": status.get("is_online", False),
                    "last_action": status.get("last_action"),
                    "last_action_type": status.get("last_action_type"),
                    "today_hours": status.get("today_hours", 0),
                    "week_hours": status.get("week_hours", 0),
                },
            }
        except Exception as e:
            logger.error(f"❌ get_session_details error: {e}")
            return {"success": False, "error": str(e)}

    async def _end_user_session(
        self, params: dict[str, Any], user_id: str
    ) -> dict[str, Any]:
        """
        End (clock out) the current user's session

        Args:
            params: {} (uses authenticated user_id)
        """
        logger.info(f"👥 end_user_session: user={user_id}")

        if not self._timesheet_service:
            return {"success": False, "error": "Timesheet service not available"}

        try:
            # Get user email for clock out
            result = await self._timesheet_service.clock_out(user_id)
            return {"success": result.get("success", False), "data": result}
        except Exception as e:
            logger.error(f"❌ end_user_session error: {e}")
            return {"success": False, "error": str(e)}

    def get_tool_definitions(self, include_admin_tools: bool = False) -> list[dict[str, Any]]:
        """
        Get ZANTARA AI-compatible tool definitions

        Returns:
            List of tool definitions for ZANTARA AI (legacy Anthropic format for compatibility)
        """
        tools = [
            {
                "name": "get_pricing",
                "description": """Get OFFICIAL Bali Zero pricing for services.

⚠️ CRITICAL: ALWAYS use this tool for ANY pricing question. NEVER generate prices from memory.

This returns OFFICIAL prices from the database including:
- Visa prices (retrieved from database)
- Long-stay permit prices (retrieved from database)
- Business services (retrieved from database)
- Tax services (retrieved from database)
- All pricing data is stored in Qdrant/PostgreSQL and retrieved via this tool

MANDATORY USAGE:
- If user asks about ANY price → CALL THIS TOOL
- Examples that REQUIRE this tool:
  * "How much does [service] cost?"
  * "Berapa harga [service]?"
  * "What's the price for..."
  * "Quanto costa..."

DO NOT generate prices from memory - prices change and must be accurate. All pricing comes from the database.""",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "service_type": {
                            "type": "string",
                            "enum": [
                                "visa",
                                "kitas",
                                "business_setup",
                                "tax_consulting",
                                "legal",
                                "all",
                            ],
                            "description": "Type of service to get pricing for (use 'all' to see everything)",
                        },
                        "query": {
                            "type": "string",
                            "description": "Optional: specific search query (e.g. 'long-stay permit', 'company setup', 'visa')",
                        },
                    },
                    "required": ["service_type"],
                },
            },
            {
                "name": "search_team_member",
                "description": "Search for a Bali Zero team member by name. Returns contact info, role, expertise level.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Name to search for (e.g. 'Dea', 'Zero', 'Krisna')",
                        }
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "get_team_members_list",
                "description": "Get full Bali Zero team roster, optionally filtered by department",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "department": {
                            "type": "string",
                            "description": "Optional: filter by department (technology, operations, creative, etc.)",
                        }
                    },
                },
            },
            {
                "name": "get_team_overview",
                "description": "Get comprehensive team overview including roster and online status",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                },
            },
            # Memory Tools
            {
                "name": "retrieve_user_memory",
                "description": "Retrieve user's stored memory including profile facts, conversation summary, and activity counters",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "Optional: user ID to retrieve memory for (defaults to current user)",
                        }
                    },
                },
            },
            {
                "name": "search_memory",
                "description": "Search through user's stored memory facts",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query to find matching facts",
                        },
                        "user_id": {
                            "type": "string",
                            "description": "Optional: user ID to search memory for",
                        },
                    },
                    "required": ["query"],
                },
            },
            # Team Activity Tools
            {
                "name": "get_team_logins_today",
                "description": "Get team login activity for today - who logged in and when",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                },
            },
            {
                "name": "get_team_active_sessions",
                "description": "Get currently active team sessions - who is online right now",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                },
            },
            {
                "name": "get_team_member_stats",
                "description": "Get work statistics for a specific team member (hours worked today, this week, online status)",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "User ID or email of the team member",
                        }
                    },
                    "required": ["user_id"],
                },
            },
            {
                "name": "get_session_details",
                "description": "Get current session details for a user (online status, hours worked)",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "Optional: user ID (defaults to current user)",
                        }
                    },
                },
            },
        ]

        # Add admin tools if requested
        if include_admin_tools:
            tools.append({
                "name": "end_user_session",
                "description": "End (clock out) a user's current work session. Admin only.",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                },
            })

        logger.info(f"📋 Returning {len(tools)} ZantaraTool definitions")
        return tools


# Global singleton
_zantara_tools: ZantaraTools | None = None


def get_zantara_tools() -> ZantaraTools:
    """Get or create global ZantaraTools instance"""
    global _zantara_tools
    if _zantara_tools is None:
        _zantara_tools = ZantaraTools()
    return _zantara_tools

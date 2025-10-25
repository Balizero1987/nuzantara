"""
ZANTARA Tools - Tool definitions for Anthropic Claude API
Provides ZANTARA with access to real-time team data, analytics, and system information
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, date

logger = logging.getLogger(__name__)


class ZantaraTools:
    """
    Tool definitions and handlers for ZANTARA AI assistant

    Available tool categories:
    1. Team Analytics - Real-time team data from PostgreSQL
    2. Memory System - User preferences and historical data
    3. Pricing - Bali Zero pricing information
    4. System Info - Status and configuration data
    5. Team Roster - Static team member information
    """

    def __init__(
        self,
        team_analytics_service=None,
        work_session_service=None,
        memory_service=None,
        pricing_service=None,
        collaborator_service=None
    ):
        """
        Initialize ZantaraTools with service dependencies

        Args:
            team_analytics_service: For team data queries
            work_session_service: For session management
            memory_service: For user memory operations
            pricing_service: For pricing information
            collaborator_service: For team member roster and profiles
        """
        self.team_analytics = team_analytics_service
        self.work_session = work_session_service
        self.memory = memory_service
        self.pricing = pricing_service
        self.collaborator = collaborator_service

        # Define Zantara-specific tool names
        self.zantara_tool_names = {
            'get_team_logins_today',
            'get_team_active_sessions',
            'get_team_member_stats',
            'get_team_overview',
            'get_team_members_list',    # NEW
            'search_team_member',        # NEW
            'get_session_details',
            'end_user_session',
            'retrieve_user_memory',
            'search_memory',
            'get_pricing'
        }

        logger.info("🔧 ZantaraTools initialized")
        logger.info(f"   Team Analytics: {'✅' if team_analytics_service else '❌'}")
        logger.info(f"   Work Sessions: {'✅' if work_session_service else '❌'}")
        logger.info(f"   Memory Service: {'✅' if memory_service else '❌'}")
        logger.info(f"   Pricing Service: {'✅' if pricing_service else '❌'}")
        logger.info(f"   Collaborator Service: {'✅' if collaborator_service else '❌'}")


    def get_tool_definitions(self, include_admin_tools: bool = False) -> List[Dict]:
        """
        Get Anthropic tool definitions for Claude API

        Args:
            include_admin_tools: Include admin-only tools (team data, sessions)

        Returns:
            List of tool definitions in Anthropic format
        """
        tools = []

        # PUBLIC TOOLS (always available)
        if self.pricing:
            tools.extend([
                {
                    "name": "get_pricing",
                    "description": "Get Bali Zero pricing for services (KITAS, visa, business setup, etc.)",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "service_type": {
                                "type": "string",
                                "description": "Type of service (visa, kitas, business_setup, tax_consulting, etc.)",
                                "enum": ["visa", "kitas", "business_setup", "tax_consulting", "legal", "all"]
                            }
                        },
                        "required": []
                    }
                }
            ])

        if self.memory:
            tools.extend([
                {
                    "name": "retrieve_user_memory",
                    "description": "Retrieve saved information about a specific user (preferences, past interactions, important facts)",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "user_id": {
                                "type": "string",
                                "description": "User ID or email to retrieve memory for"
                            },
                            "category": {
                                "type": "string",
                                "description": "Optional category filter (preferences, history, facts, etc.)"
                            }
                        },
                        "required": ["user_id"]
                    }
                },
                {
                    "name": "search_memory",
                    "description": "Search user memory database for specific information across all users",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Search query (what information to find)"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of results (default 5)",
                                "default": 5
                            }
                        },
                        "required": ["query"]
                    }
                }
            ])

        # Team roster tools (PUBLIC - anyone can ask who team members are)
        if self.collaborator:
            tools.extend([
                {
                    "name": "get_team_members_list",
                    "description": "Get complete list of all 22 Bali Zero team members with their roles, departments, and contact info. Use this when user asks about team composition, who works in a department, or to identify a team member by name.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "department": {
                                "type": "string",
                                "description": "Optional filter by department (setup, tax, management, advisory, marketing, operations, leadership)",
                                "enum": ["setup", "tax", "management", "advisory", "marketing", "operations", "leadership", "all"]
                            }
                        },
                        "required": []
                    }
                },
                {
                    "name": "search_team_member",
                    "description": "Search for a team member by name (supports partial matching). Returns matching team members with their info. Use this when user asks 'Chi è Adit?', 'Who is Ari?', or any team member name query.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Name to search for (e.g., 'Adit', 'Ari', 'Surya', 'Krisna'). Supports partial matching."
                            }
                        },
                        "required": ["query"]
                    }
                }
            ])

        # ADMIN TOOLS (only for authorized users)
        if include_admin_tools:
            if self.team_analytics:
                tools.extend([
                    {
                        "name": "get_team_logins_today",
                        "description": "Get list of team members who logged in today with their activity details",
                        "input_schema": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    },
                    {
                        "name": "get_team_active_sessions",
                        "description": "Get list of team members currently active (have not logged out yet)",
                        "input_schema": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    },
                    {
                        "name": "get_team_member_stats",
                        "description": "Get detailed statistics for a specific team member (sessions, conversations, activity)",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "user_email": {
                                    "type": "string",
                                    "description": "Email of team member to get stats for"
                                },
                                "days": {
                                    "type": "integer",
                                    "description": "Number of days to include in stats (default 7)",
                                    "default": 7
                                }
                            },
                            "required": ["user_email"]
                        }
                    },
                    {
                        "name": "get_team_overview",
                        "description": "Get overview of entire team activity (total sessions, active members, trends)",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "days": {
                                    "type": "integer",
                                    "description": "Number of days for overview (default 7)",
                                    "default": 7
                                }
                            },
                            "required": []
                        }
                    }
                ])

            if self.work_session:
                tools.extend([
                    {
                        "name": "get_session_details",
                        "description": "Get detailed information about a specific work session",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "session_id": {
                                    "type": "string",
                                    "description": "Session ID to get details for"
                                }
                            },
                            "required": ["session_id"]
                        }
                    },
                    {
                        "name": "end_user_session",
                        "description": "End/logout a user's current session (admin use only)",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "user_email": {
                                    "type": "string",
                                    "description": "Email of user to logout"
                                },
                                "notes": {
                                    "type": "string",
                                    "description": "Optional notes about why session was ended"
                                }
                            },
                            "required": ["user_email"]
                        }
                    }
                ])

        logger.info(f"📋 Generated {len(tools)} tool definitions (admin: {include_admin_tools})")
        return tools


    async def execute_tool(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        user_id: str = "anonymous"
    ) -> Dict[str, Any]:
        """
        Execute a tool and return formatted result

        Args:
            tool_name: Name of tool to execute
            tool_input: Input parameters for tool
            user_id: User executing the tool

        Returns:
            Tool execution result with success/error status
        """
        logger.info(f"🔧 [Tool] Executing: {tool_name} (user: {user_id})")

        try:
            # TEAM ANALYTICS TOOLS
            if tool_name == "get_team_logins_today":
                return await self._get_team_logins_today()

            elif tool_name == "get_team_active_sessions":
                return await self._get_team_active_sessions()

            elif tool_name == "get_team_member_stats":
                return await self._get_team_member_stats(
                    tool_input.get("user_email"),
                    tool_input.get("days", 7)
                )

            elif tool_name == "get_team_overview":
                return await self._get_team_overview(tool_input.get("days", 7))

            elif tool_name == "get_team_members_list":
                return await self._get_team_members_list(
                    tool_input.get("department")
                )

            elif tool_name == "search_team_member":
                return await self._search_team_member(
                    tool_input.get("query")
                )

            elif tool_name == "get_session_details":
                return await self._get_session_details(tool_input.get("session_id"))

            elif tool_name == "end_user_session":
                return await self._end_user_session(
                    tool_input.get("user_email"),
                    tool_input.get("notes")
                )

            # MEMORY TOOLS
            elif tool_name == "retrieve_user_memory":
                return await self._retrieve_user_memory(
                    tool_input.get("user_id"),
                    tool_input.get("category")
                )

            elif tool_name == "search_memory":
                return await self._search_memory(
                    tool_input.get("query"),
                    tool_input.get("limit", 5)
                )

            # PRICING TOOLS
            elif tool_name == "get_pricing":
                return await self._get_pricing(tool_input.get("service_type", "all"))

            else:
                return {
                    "success": False,
                    "error": f"Unknown tool: {tool_name}"
                }

        except Exception as e:
            logger.error(f"❌ [Tool] Execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_name": tool_name
            }


    # ========================================
    # TEAM ANALYTICS TOOL HANDLERS
    # ========================================

    async def _get_team_logins_today(self) -> Dict[str, Any]:
        """Get team members who logged in today"""
        if not self.team_analytics:
            return {"success": False, "error": "Team analytics service not available"}

        try:
            sessions = await self.team_analytics.get_today_sessions()

            # Format for natural language response
            if not sessions:
                return {
                    "success": True,
                    "data": {
                        "count": 0,
                        "message": "Nessuno si è loggato oggi",
                        "sessions": []
                    }
                }

            formatted_sessions = []
            for session in sessions:
                formatted_sessions.append({
                    "name": session.get("user_name", "Unknown"),
                    "email": session.get("user_email", ""),
                    "matricola": session.get("matricola", ""),
                    "login_time": session.get("session_start", ""),
                    "duration_hours": session.get("duration_hours", 0),
                    "conversations": session.get("conversations", 0),
                    "is_active": session.get("is_active", False),
                    "notes": session.get("notes")
                })

            return {
                "success": True,
                "data": {
                    "count": len(sessions),
                    "date": str(date.today()),
                    "sessions": formatted_sessions
                }
            }

        except Exception as e:
            logger.error(f"❌ get_team_logins_today error: {e}")
            return {"success": False, "error": str(e)}


    async def _get_team_active_sessions(self) -> Dict[str, Any]:
        """Get currently active team members"""
        if not self.team_analytics:
            return {"success": False, "error": "Team analytics service not available"}

        try:
            sessions = await self.team_analytics.get_active_sessions()

            formatted_sessions = []
            for session in sessions:
                formatted_sessions.append({
                    "name": session.get("user_name"),
                    "email": session.get("user_email"),
                    "matricola": session.get("matricola"),
                    "login_time": session.get("session_start"),
                    "duration_hours": session.get("duration_hours", 0),
                    "conversations": session.get("conversations", 0)
                })

            return {
                "success": True,
                "data": {
                    "count": len(sessions),
                    "active_members": formatted_sessions
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    async def _get_team_member_stats(self, user_email: str, days: int = 7) -> Dict[str, Any]:
        """Get stats for specific team member"""
        if not self.team_analytics:
            return {"success": False, "error": "Team analytics service not available"}

        try:
            stats = await self.team_analytics.get_user_stats(user_email, days)

            return {
                "success": True,
                "data": stats
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    async def _get_team_overview(self, days: int = 7) -> Dict[str, Any]:
        """Get overview of team activity"""
        if not self.team_analytics:
            return {"success": False, "error": "Team analytics service not available"}

        try:
            overview = await self.team_analytics.get_team_overview(days)

            return {
                "success": True,
                "data": overview
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    async def _get_session_details(self, session_id: str) -> Dict[str, Any]:
        """Get details for specific session"""
        if not self.work_session:
            return {"success": False, "error": "Work session service not available"}

        try:
            details = await self.work_session.get_session(session_id)

            return {
                "success": True,
                "data": details
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    async def _end_user_session(self, user_email: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """End/logout a user's current session"""
        if not self.work_session:
            return {"success": False, "error": "Work session service not available"}

        try:
            # Find user's active session
            result = await self.work_session.end_session(user_email, notes)

            if result.get("success"):
                return {
                    "success": True,
                    "data": {
                        "message": f"Session ended for {user_email}",
                        "user_email": user_email,
                        "ended_at": datetime.now().isoformat(),
                        "notes": notes
                    }
                }
            else:
                return {
                    "success": False,
                    "error": result.get("error", "Failed to end session")
                }

        except Exception as e:
            return {"success": False, "error": str(e)}


    # ========================================
    # MEMORY TOOL HANDLERS
    # ========================================

    async def _retrieve_user_memory(
        self,
        user_id: str,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Retrieve user memory"""
        if not self.memory:
            return {"success": False, "error": "Memory service not available"}

        try:
            memory_data = await self.memory.retrieve(user_id, category)

            return {
                "success": True,
                "data": memory_data
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    async def _search_memory(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """Search memory database"""
        if not self.memory:
            return {"success": False, "error": "Memory service not available"}

        try:
            results = await self.memory.search(query, limit)

            return {
                "success": True,
                "data": {
                    "query": query,
                    "results": results,
                    "count": len(results)
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    # ========================================
    # PRICING TOOL HANDLERS
    # ========================================

    async def _get_pricing(self, service_type: str = "all") -> Dict[str, Any]:
        """Get Bali Zero pricing"""
        if not self.pricing:
            return {"success": False, "error": "Pricing service not available"}

        try:
            # FIXED: get_pricing is not async, remove await
            pricing_data = self.pricing.get_pricing(service_type)

            # DEBUG: Log the pricing data
            logger.info(f"🔍 [PricingTool] Service: {service_type}")
            logger.info(f"🔍 [PricingTool] Data keys: {list(pricing_data.keys()) if isinstance(pricing_data, dict) else 'Not a dict'}")
            logger.info(f"🔍 [PricingTool] Data type: {type(pricing_data)}")

            return {
                "success": True,
                "data": pricing_data
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    # ========================================
    # TEAM ROSTER TOOL HANDLERS (NEW)
    # ========================================

    async def _get_team_members_list(
        self,
        department: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get list of all team members with optional department filter.

        Args:
            department: Optional filter by department

        Returns:
            Dict with success status and team member data
        """
        if not self.collaborator:
            return {"success": False, "error": "Collaborator service not available"}

        try:
            # Get team database from collaborator service
            team_database = self.collaborator.TEAM_DATABASE

            # Filter by department if specified
            members = []
            for email, data in team_database.items():
                if department and department != "all" and data["department"] != department:
                    continue

                members.append({
                    "name": data["name"],
                    "ambaradam_name": data["ambaradam_name"],
                    "email": email,
                    "role": data["role"],
                    "department": data["department"],
                    "sub_rosa_level": data["sub_rosa_level"],
                    "language": data["language"],
                    "expertise_level": data.get("expertise_level", "intermediate")
                })

            # Sort by department, then by name
            members.sort(key=lambda m: (m["department"], m["name"]))

            # Count by department for summary
            dept_counts = {}
            for member in members:
                dept = member["department"]
                dept_counts[dept] = dept_counts.get(dept, 0) + 1

            logger.info(f"✅ get_team_members_list: {len(members)} members returned (filter: {department or 'all'})")

            return {
                "success": True,
                "data": {
                    "total": len(members),
                    "department_filter": department or "all",
                    "members": members,
                    "by_department": dept_counts
                }
            }

        except Exception as e:
            logger.error(f"❌ get_team_members_list error: {e}")
            return {"success": False, "error": str(e)}


    async def _search_team_member(
        self,
        query: str
    ) -> Dict[str, Any]:
        """
        Search for team members by name (supports partial matching).

        Args:
            query: Name to search for

        Returns:
            Dict with success status and matching team members
        """
        if not query:
            return {"success": False, "error": "Query parameter is required"}

        if not self.collaborator:
            return {"success": False, "error": "Collaborator service not available"}

        try:
            # Get team database from collaborator service
            team_database = self.collaborator.TEAM_DATABASE

            query_lower = query.lower()
            matches = []

            for email, data in team_database.items():
                # Match against name, ambaradam_name, or email
                if (query_lower in data["name"].lower() or
                    query_lower in data["ambaradam_name"].lower() or
                    query_lower in email.lower()):

                    matches.append({
                        "name": data["name"],
                        "ambaradam_name": data["ambaradam_name"],
                        "email": email,
                        "role": data["role"],
                        "department": data["department"],
                        "sub_rosa_level": data["sub_rosa_level"],
                        "language": data["language"],
                        "expertise_level": data.get("expertise_level", "intermediate")
                    })

            # Sort matches by relevance (exact match first)
            def relevance_score(member):
                name_lower = member["name"].lower()
                if name_lower == query_lower:
                    return 0  # Exact match
                elif name_lower.startswith(query_lower):
                    return 1  # Starts with
                else:
                    return 2  # Contains

            matches.sort(key=relevance_score)

            logger.info(f"✅ search_team_member: Found {len(matches)} matches for '{query}'")

            if not matches:
                return {
                    "success": True,
                    "data": {
                        "query": query,
                        "matches": [],
                        "message": f"No team members found matching '{query}'"
                    }
                }

            return {
                "success": True,
                "data": {
                    "query": query,
                    "count": len(matches),
                    "matches": matches
                }
            }

        except Exception as e:
            logger.error(f"❌ search_team_member error: {e}")
            return {"success": False, "error": str(e)}

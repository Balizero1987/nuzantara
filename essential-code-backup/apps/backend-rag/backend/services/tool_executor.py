"""
TOOL EXECUTOR SERVICE
Handles Anthropic tool use execution via handler proxy
Supports both TypeScript handlers (HTTP) and Python ZantaraTools (direct)
"""

import json
import logging
from typing import Dict, Any, List, Optional, TYPE_CHECKING
from services.handler_proxy import HandlerProxyService

if TYPE_CHECKING:
    from services.zantara_tools import ZantaraTools

logger = logging.getLogger(__name__)


class ToolExecutor:
    """
    Executes tools during AI conversations
    - ZantaraTools (Python): team data, memory, pricing - direct execution
    - TypeScript handlers: Gmail, calendar, etc. - via HTTP proxy
    """

    def __init__(
        self,
        handler_proxy: HandlerProxyService,
        internal_key: Optional[str] = None,
        zantara_tools: Optional['ZantaraTools'] = None
    ):
        """
        Initialize tool executor

        Args:
            handler_proxy: Handler proxy service instance
            internal_key: Internal API key for authentication
            zantara_tools: ZantaraTools instance for direct Python tool execution
        """
        self.handler_proxy = handler_proxy
        self.internal_key = internal_key
        self.zantara_tools = zantara_tools

        # ZantaraTools function names (Python - executed directly)
        self.zantara_tool_names = {
            'get_team_logins_today',
            'get_team_active_sessions',
            'get_team_member_stats',
            'get_team_overview',
            'get_team_members_list',    # Team roster (public)
            'search_team_member',        # Team search (public)
            'get_session_details',
            'end_user_session',
            'retrieve_user_memory',
            'search_memory',
            'get_pricing'
        }

        logger.info(f"🔧 ToolExecutor initialized (ZantaraTools: {'✅' if zantara_tools else '❌'})")

    async def execute_tool_calls(self, tool_uses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute multiple tool calls from Anthropic response

        Args:
            tool_uses: List of tool use blocks from Anthropic API

        Returns:
            List of tool results to send back to Anthropic

        Example input (from Anthropic):
        [
            {
                "type": "tool_use",
                "id": "toolu_123",
                "name": "gmail_send",
                "input": {"to": "client@example.com", "subject": "Hello", "body": "..."}
            }
        ]

        Example output (to send back):
        [
            {
                "type": "tool_result",
                "tool_use_id": "toolu_123",
                "content": [{"type": "output_text", "text": "Email sent successfully"}]
            }
        ]
        """
        results = []

        for tool_use in tool_uses:
            # Handle both dict and ToolUseBlock objects
            if hasattr(tool_use, 'id'):
                # Pydantic ToolUseBlock object from Anthropic SDK
                tool_id = tool_use.id
                tool_name = tool_use.name
                tool_input = tool_use.input or {}
            else:
                # Dict format
                tool_id = tool_use.get("id")
                tool_name = tool_use.get("name")
                tool_input = tool_use.get("input", {})

            try:
                # Check if this is a ZantaraTools function (Python - direct execution)
                if tool_name in self.zantara_tool_names and self.zantara_tools:
                    logger.info(f"🔧 [ZantaraTools] Executing: {tool_name} (Python)")

                    # Execute ZantaraTools directly
                    result = await self.zantara_tools.execute_tool(
                        tool_name=tool_name,
                        tool_input=tool_input,
                        user_id="system"
                    )

                    if not result.get("success"):
                        error_message = result.get("error", "Unknown error")
                        logger.error(f"❌ [ZantaraTools] {tool_name} failed: {error_message}")
                        results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_id,
                            "is_error": True,
                            "content": f"Error: {error_message}"
                        })
                        continue

                    # Extract data from ZantaraTools result
                    payload = result.get('data', result)
                    if isinstance(payload, (dict, list)):
                        content_text = json.dumps(payload, ensure_ascii=False)
                    else:
                        content_text = str(payload)

                    logger.info(f"✅ [ZantaraTools] {tool_name} executed successfully")
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_id,
                        "content": content_text
                    })

                else:
                    # TypeScript handler via HTTP proxy
                    handler_key = tool_name.replace('_', '.')
                    logger.info(f"🔧 [TypeScript] Executing: {tool_name} → {handler_key} (HTTP)")

                    # Execute handler via proxy
                    result = await self.handler_proxy.execute_handler(
                        handler_key=handler_key,
                        params=tool_input,
                        internal_key=self.internal_key
                    )

                    # Format result for Anthropic
                    if result.get("error"):
                        error_message = f"Error executing {handler_key}: {result['error']}"
                        logger.error(f"❌ [TypeScript] {tool_name} failed: {result['error']}")
                        results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_id,
                            "is_error": True,
                            "content": error_message
                        })
                        continue

                    payload = result.get('result', result)
                    if isinstance(payload, (dict, list)):
                        content_text = json.dumps(payload)
                    else:
                        content_text = str(payload)

                    logger.info(f"✅ [TypeScript] {tool_name} executed successfully")
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_id,
                        "content": content_text
                    })

            except Exception as e:
                logger.error(f"❌ Tool execution failed for {tool_name}: {e}")
                results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "is_error": True,
                    "content": f"Tool execution error: {str(e)}"
                })

        return results

    async def execute_tool(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """
        Execute a single tool (for prefetch system)

        Args:
            tool_name: Tool name to execute
            tool_input: Tool parameters
            user_id: User ID for context

        Returns:
            {
                "success": bool,
                "result": Any,
                "error": str (if failed)
            }
        """
        try:
            # Check if this is a ZantaraTools function (Python - direct execution)
            if tool_name in self.zantara_tool_names and self.zantara_tools:
                logger.info(f"🔧 [ZantaraTools/Prefetch] Executing: {tool_name} (Python)")

                # Execute ZantaraTools directly
                result = await self.zantara_tools.execute_tool(
                    tool_name=tool_name,
                    tool_input=tool_input,
                    user_id=user_id
                )

                if not result.get("success"):
                    error_message = result.get("error", "Unknown error")
                    logger.error(f"❌ [ZantaraTools/Prefetch] {tool_name} failed: {error_message}")
                    return {
                        "success": False,
                        "error": error_message
                    }

                # Extract data from ZantaraTools result
                payload = result.get('data', result)
                logger.info(f"✅ [ZantaraTools/Prefetch] {tool_name} executed successfully")
                return {
                    "success": True,
                    "result": payload
                }

            else:
                # TypeScript handler via HTTP proxy
                handler_key = tool_name.replace('_', '.')
                logger.info(f"🔧 [TypeScript/Prefetch] Executing: {tool_name} → {handler_key} (HTTP)")

                # Execute handler via proxy
                result = await self.handler_proxy.execute_handler(
                    handler_key=handler_key,
                    params=tool_input,
                    internal_key=self.internal_key
                )

                if result.get("error"):
                    error_message = f"Error executing {handler_key}: {result['error']}"
                    logger.error(f"❌ [TypeScript/Prefetch] {tool_name} failed: {result['error']}")
                    return {
                        "success": False,
                        "error": error_message
                    }

                payload = result.get('result', result)
                logger.info(f"✅ [TypeScript/Prefetch] {tool_name} executed successfully")
                return {
                    "success": True,
                    "result": payload
                }

        except Exception as e:
            logger.error(f"❌ [Prefetch] Tool execution failed for {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def get_available_tools(self) -> List[Dict[str, Any]]:
        """
        Get Anthropic-compatible tool definitions

        Returns:
            List of tool definitions for Anthropic API
        """
        tools = []

        # CRITICAL FIX: Always load ZantaraTools first (Python - always available)
        if self.zantara_tools:
            try:
                zantara_tool_defs = self.zantara_tools.get_tool_definitions(include_admin_tools=False)
                tools.extend(zantara_tool_defs)
                logger.info(f"📋 Loaded {len(zantara_tool_defs)} ZantaraTools (Python): {[t['name'] for t in zantara_tool_defs]}")
            except Exception as e:
                logger.error(f"❌ Failed to load ZantaraTools: {e}")

        # Try to load TypeScript tools (may fail if backend is offline)
        try:
            ts_tools = await self.handler_proxy.get_anthropic_tools(self.internal_key)
            tools.extend(ts_tools)
            logger.info(f"📋 Loaded {len(ts_tools)} TypeScript tools")
        except Exception as e:
            logger.warning(f"⚠️ TypeScript tools unavailable: {e}")

        logger.info(f"📋 Total tools loaded for AI: {len(tools)}")
        return tools

"""
TOOL EXECUTOR SERVICE
Handles Anthropic tool use execution via handler proxy
"""

import json
import logging
from typing import Dict, Any, List, Optional
from services.handler_proxy import HandlerProxyService

logger = logging.getLogger(__name__)


class ToolExecutor:
    """
    Executes tools (TypeScript handlers) during AI conversations
    """

    def __init__(self, handler_proxy: HandlerProxyService, internal_key: Optional[str] = None):
        """
        Initialize tool executor

        Args:
            handler_proxy: Handler proxy service instance
            internal_key: Internal API key for authentication
        """
        self.handler_proxy = handler_proxy
        self.internal_key = internal_key

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
                # Convert tool name back to handler key format
                # Anthropic: gmail_send → TypeScript: gmail.send
                handler_key = tool_name.replace('_', '.')

                logger.info(f"🔧 Executing tool: {tool_name} → {handler_key}")

                # Execute handler via proxy
                result = await self.handler_proxy.execute_handler(
                    handler_key=handler_key,
                    params=tool_input,
                    internal_key=self.internal_key
                )

                # Format result for Anthropic
                if result.get("error"):
                    error_message = f"Error executing {handler_key}: {result['error']}"
                    logger.error(f"❌ Tool {tool_name} failed: {result['error']}")
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

                logger.info(f"✅ Tool {tool_name} executed successfully")
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

    async def get_available_tools(self) -> List[Dict[str, Any]]:
        """
        Get Anthropic-compatible tool definitions

        Returns:
            List of tool definitions for Anthropic API
        """
        try:
            tools = await self.handler_proxy.get_anthropic_tools(self.internal_key)
            logger.info(f"📋 Loaded {len(tools)} tools for AI")
            return tools
        except Exception as e:
            logger.error(f"❌ Failed to load tools: {e}")
            return []

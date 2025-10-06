"""
Anthropic API client for Haiku and Sonnet
"""

import os
import anthropic
from typing import Dict, Any, List
from loguru import logger


class AnthropicClient:
    """Unified client for Haiku and Sonnet"""

    def __init__(self, api_key: str = None):
        self.client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )

        self.models = {
            "haiku": "claude-3-5-haiku-20241022",
            "sonnet": "claude-sonnet-4-20250514"
        }

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "haiku",
        max_tokens: int = 1500,
        system: str = None,
        tools: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Chat with Claude (Haiku or Sonnet)

        Args:
            messages: List of {role, content}
            model: "haiku" or "sonnet"
            max_tokens: Response length
            system: System prompt
            tools: Tool definitions for function calling
        """

        if model not in self.models:
            raise ValueError(f"Model must be 'haiku' or 'sonnet', got: {model}")

        try:
            # Build API call params
            api_params = {
                "model": self.models[model],
                "max_tokens": max_tokens,
                "system": system if system else "",
                "messages": messages
            }

            # Add tools if provided
            if tools and len(tools) > 0:
                api_params["tools"] = tools

            response = self.client.messages.create(**api_params)

            # Extract text content from response
            text_content = ""
            tool_uses = []

            for content_block in response.content:
                if content_block.type == "text":
                    text_content += content_block.text
                elif content_block.type == "tool_use":
                    tool_uses.append({
                        "type": "tool_use",
                        "id": content_block.id,
                        "name": content_block.name,
                        "input": content_block.input
                    })

            return {
                "success": True,
                "text": text_content,
                "tool_uses": tool_uses,  # List of tool calls made by AI
                "stop_reason": response.stop_reason,
                "model": model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }

        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return {"success": False, "error": str(e)}

    async def chat_async(
        self,
        messages: List[Dict[str, str]],
        model: str = "haiku",
        max_tokens: int = 1500,
        system: str = None,
        tools: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Async version of chat
        """
        # For now, just call sync version
        # In production, use httpx or async anthropic client
        return self.chat(messages, model, max_tokens, system, tools)
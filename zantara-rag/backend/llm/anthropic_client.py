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
        system: str = None
    ) -> Dict[str, Any]:
        """
        Chat with Claude (Haiku or Sonnet)

        Args:
            messages: List of {role, content}
            model: "haiku" or "sonnet"
            max_tokens: Response length
            system: System prompt
        """

        if model not in self.models:
            raise ValueError(f"Model must be 'haiku' or 'sonnet', got: {model}")

        try:
            response = self.client.messages.create(
                model=self.models[model],
                max_tokens=max_tokens,
                system=system if system else "",
                messages=messages
            )

            return {
                "success": True,
                "text": response.content[0].text,
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
        system: str = None
    ) -> Dict[str, Any]:
        """
        Async version of chat
        """
        # For now, just call sync version
        # In production, use httpx or async anthropic client
        return self.chat(messages, model, max_tokens, system)
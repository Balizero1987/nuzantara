"""Anthropic API client for Haiku and Sonnet (async)."""

from __future__ import annotations

import asyncio
import os
from typing import Any, Dict, List, Optional

from anthropic import AsyncAnthropic
from loguru import logger


class AnthropicClient:
    """Unified async client for Haiku and Sonnet."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.client = AsyncAnthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )

        self.models = {
            "haiku": "claude-3-5-haiku-20241022",
            "sonnet": "claude-sonnet-4-20250514",
        }

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "haiku",
        max_tokens: int = 1500,
        system: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Synchronous helper that wraps :meth:`chat_async`.

        Prefer using :meth:`chat_async`; this helper is kept for backward
        compatibility with legacy code paths.
        """

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            raise RuntimeError(
                "AnthropicClient.chat() cannot be used inside an active event loop; use chat_async() instead"
            )

        return asyncio.run(
            self.chat_async(messages, model=model, max_tokens=max_tokens, system=system, tools=tools)
        )

    async def chat_async(
        self,
        messages: List[Dict[str, str]],
        model: str = "haiku",
        max_tokens: int = 1500,
        system: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Async chat with Claude (Haiku or Sonnet)."""

        if model not in self.models:
            raise ValueError(f"Model must be 'haiku' or 'sonnet', got: {model}")

        api_params: Dict[str, Any] = {
            "model": self.models[model],
            "max_tokens": max_tokens,
            "system": system or "",
            "messages": messages,
        }

        if tools:
            api_params["tools"] = tools

        try:
            response = await self.client.messages.create(**api_params)

            text_content = ""
            tool_uses: List[Dict[str, Any]] = []

            for content_block in response.content:
                if content_block.type == "text":
                    text_content += content_block.text
                elif content_block.type == "tool_use":
                    tool_uses.append(
                        {
                            "type": "tool_use",
                            "id": content_block.id,
                            "name": content_block.name,
                            "input": content_block.input,
                        }
                    )

            return {
                "success": True,
                "text": text_content,
                "tool_uses": tool_uses,
                "stop_reason": response.stop_reason,
                "model": model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            }

        except Exception as exc:  # pragma: no cover - network/state errors handled at runtime
            logger.error(f"Anthropic API error: {exc}")
            return {"success": False, "error": str(exc)}

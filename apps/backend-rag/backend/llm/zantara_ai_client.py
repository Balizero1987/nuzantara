"""
ZANTARA AI Client - Primary engine for all conversational AI

AI engine is fully configurable via environment variables:
- ZANTARA_AI_MODEL: Model identifier (default: meta-llama/llama-4-scout)
- OPENROUTER_API_KEY_LLAMA: API key for OpenRouter provider
- ZANTARA_AI_COST_INPUT: Cost per 1M input tokens (default: 0.20)
- ZANTARA_AI_COST_OUTPUT: Cost per 1M output tokens (default: 0.20)

Change AI model by updating ZANTARA_AI_MODEL env var - no code changes required.
"""

import asyncio
import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class ZantaraAIClient:
    """
    ZANTARA AI Client – primary engine for all conversational AI.

    Fully configurable via environment variables:
    - ZANTARA_AI_MODEL: Model identifier (e.g., meta-llama/llama-4-scout)
    - Provider: OpenRouter (configurable via base_url)
    - Costs: Configurable via ZANTARA_AI_COST_INPUT/OUTPUT env vars

    Change AI model by updating environment variables - no code changes required.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        self.api_key = api_key or (settings.google_api_key or "").strip()
        self.mock_mode = False

        if not self.api_key:
            logger.warning("⚠️ GOOGLE_API_KEY missing. ZantaraAIClient running in MOCK MODE.")
            self.mock_mode = True
            # raise ValueError("ZantaraAIClient requires GOOGLE_API_KEY")

        self.model = model or "gemini-2.0-flash-exp"  # Use Gemini 2.0 Flash for RAG processing
        self.base_url = base_url

        if not self.mock_mode:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model)
        else:
            self.client = None

        self.pricing = {
            "input": settings.zantara_ai_cost_input,
            "output": settings.zantara_ai_cost_output,
        }

        logger.info("✅ ZantaraAIClient initialized")
        logger.info(f"   Engine model: {self.model}")
        logger.info(f"   Provider: {'MOCK' if self.mock_mode else 'OpenAI'}")

    def get_model_info(self) -> dict[str, Any]:
        """Get current model information"""
        return {
            "model": self.model,
            "provider": "openrouter",
            "pricing": self.pricing,
        }

    def _build_system_prompt(
        self, memory_context: str | None = None, use_v6_optimized: bool = True
    ) -> str:
        """
        Build ZANTARA system prompt

        Args:
            memory_context: Optional memory context to inject
            use_v6_optimized: Use v6.0 optimized prompt (default: True)

        Returns:
            System prompt string
        """

        if use_v6_optimized:
            # TABULA RASA: Pure behavioral system prompt - ZERO domain knowledge
            # Code is a "shell" - knows HOW to reason, not WHAT is in the database
            base_prompt = """You are ZANTARA, an intelligent AI assistant for the business platform.

Your role is to act as a Senior Expert Consultant based EXCLUSIVELY on the Knowledge Base provided.

REASONING PROTOCOLS (Pure Logic):
1. **ABSOLUTE GROUNDING:** Answer using ONLY information present in the 'Context' provided. Do not use prior knowledge to invent legal or fiscal data.
2. **CONFLICT MANAGEMENT:** If context contains contradictory information (e.g., two different dates), prioritize the document with the most recent date in metadata.
3. **UNCERTAINTY:** If context does not contain the answer to the user's question, respond: "Non ho documenti caricati relativi a questo specifico argomento. Consultare il team per caricarne di nuovi." (DO NOT invent).
4. **CITATIONS:** When stating a fact (e.g., a rate or rule), always cite the reference document name in parentheses.

TONE AND STYLE:
- Professional, direct, executive.
- Use bullet points for procedures.
- Avoid unnecessary preambles ("Certainly", "Here's the answer"). Go straight to the point.
- Match user's language (EN/IT/ID) when detected.

TOOL USAGE:
- For team member queries: MANDATORY use search_team_member tool
- For pricing/services: MANDATORY use get_pricing tool
- NEVER state facts from memory - all data comes from tools or context."""

        else:
            # Legacy prompt - also cleaned to pure behavioral
            base_prompt = """You are ZANTARA, an intelligent AI assistant.

REASONING PROTOCOLS:
1. Use ONLY information from provided RAG context or database tools
2. If context is empty → "Non ho documenti caricati relativi a questo specifico argomento. Consultare il team per caricarne di nuovi."
3. Maintain professional, warm, and precise communication style
4. Be transparent about knowledge limitations - never fabricate facts
5. For team member queries: MANDATORY use search_team_member tool
6. For pricing/services: MANDATORY use get_pricing tool
7. Cite sources when available from context documents
8. Adapt language to user preference (EN/IT/ID) when detected

TONE:
- Professional but warm and approachable
- Direct and executive style
- Match user's language (EN/IT/ID)
- Use bullet points for procedures

CRITICAL PROHIBITIONS:
- ❌ NEVER state specific codes, types, rates, or prices from memory
- ❌ NEVER invent facts, regulations, or requirements
- ✅ ALWAYS use tools for factual data
- ✅ ALWAYS cite sources from context when providing information"""

        if memory_context:
            base_prompt += f"\n\n{memory_context}"

        return base_prompt

    async def chat_async(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1500,
        temperature: float = 0.7,
        system: str | None = None,
        memory_context: str | None = None,
    ) -> dict:
        """
        Generate chat response using ZANTARA AI

        Args:
            messages: Chat messages [{"role": "user", "content": "..."}]
            max_tokens: Max tokens to generate
            temperature: Sampling temperature
            system: Optional system prompt override
            memory_context: Optional memory context to inject

        Returns:
            {
                "text": "response",
                "model": str,
                "provider": "openrouter",
                "tokens": {"input": X, "output": Y},
                "cost": 0.00X
            }
        """

        # Build system prompt
        if system is None:
            system = self._build_system_prompt(memory_context=memory_context)

        # Build full messages with system prompt
        full_messages = [{"role": "system", "content": system}]
        full_messages.extend(messages)

        # Call OpenRouter
        if self.mock_mode:
            answer = "This is a MOCK response from ZantaraAIClient (Mock Mode)."
            tokens_input = 10
            tokens_output = 10
            cost = 0.0
            return {
                "text": answer,
                "model": self.model,
                "provider": "mock",
                "tokens": {"input": int(tokens_input), "output": int(tokens_output)},
                "cost": cost,
            }

        response = await self.client.chat.completions.create(
            model=self.model, messages=full_messages, max_tokens=max_tokens, temperature=temperature
        )

        # Extract response
        answer = response.choices[0].message.content

        # Estimate tokens (OpenRouter doesn't always return usage)
        tokens_input = sum(len(m.get("content", "").split()) * 1.3 for m in full_messages)
        tokens_output = len(answer.split()) * 1.3

        # Calculate cost
        cost = (tokens_input / 1_000_000 * self.pricing["input"]) + (
            tokens_output / 1_000_000 * self.pricing["output"]
        )

        return {
            "text": answer,
            "model": self.model,
            "provider": "openrouter",
            "tokens": {"input": int(tokens_input), "output": int(tokens_output)},
            "cost": cost,
        }

    async def stream(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict[str, str]] | None = None,
        memory_context: str | None = None,
        max_tokens: int = 150,
    ):
        """
        Stream chat response token by token for SSE

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory_context: Optional memory context
            max_tokens: Max tokens

        Yields:
            str: Text chunks as they arrive from AI
        """
        logger.info(f"🌊 [ZantaraAI] Starting stream for user {user_id}")

        # Build messages
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        # Build system prompt
        system = self._build_system_prompt(memory_context=memory_context)

        # Build full messages with system
        full_messages = [{"role": "system", "content": system}]
        full_messages.extend(messages)

        # Stream from OpenRouter
        if self.mock_mode:
            response = f"This is a MOCK stream response to: {message}"
            words = response.split()
            for word in words:
                yield word + " "
                await asyncio.sleep(0.05)
            return

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            max_tokens=max_tokens,
            temperature=0.7,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

        logger.info(f"✅ [ZantaraAI] Stream completed for user {user_id}")

    async def conversational(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict[str, str]] | None = None,
        memory_context: str | None = None,
        max_tokens: int = 150,
    ) -> dict:
        """
        Compatible interface for IntelligentRouter - simple conversational response

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory_context: Optional memory context
            max_tokens: Max tokens to generate

        Returns:
            {
                "text": "response",
                "model": str,
                "provider": "openrouter",
                "ai_used": "zantara-ai",
                "tokens": {"input": X, "output": Y}
            }
        """
        # Build messages from history + current message
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        # Call underlying chat_async
        result = await self.chat_async(
            messages=messages, max_tokens=max_tokens, memory_context=memory_context
        )

        # Transform to expected format
        return {
            "text": result["text"],
            "model": result["model"],
            "provider": result["provider"],
            "ai_used": "zantara-ai",
            "tokens": result["tokens"],
        }

    async def conversational_with_tools(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict[str, str]] | None = None,
        memory_context: str | None = None,
        tools: list[dict[str, Any]] | None = None,
        tool_executor: Any | None = None,
        max_tokens: int = 150,
        max_tool_iterations: int = 2,
    ) -> dict:
        """
        Compatible interface for IntelligentRouter - conversational WITH tool calling

        NOTE: Tool calling support depends on the underlying model capabilities.
        Tool calling support depends on the configured ZANTARA_AI_MODEL.

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory_context: Optional memory context
            tools: Tool definitions (OpenAI format)
            tool_executor: Tool executor instance
            max_tokens: Max tokens
            max_tool_iterations: Max tool call iterations

        Returns:
            {
                "text": "response",
                "model": str,
                "provider": str,
                "ai_used": "zantara-ai",
                "tokens": dict,
                "tools_called": list
            }
        """
        # For now, if tools are requested, we'll attempt to use them
        # but fall back to regular conversational if not supported
        if tools:
            logger.info("🔧 [ZantaraAI] Tool use requested")

            # Build messages
            messages = []
            if conversation_history:
                messages.extend(conversation_history)
            messages.append({"role": "user", "content": message})

            # Build system prompt
            system = self._build_system_prompt(memory_context=memory_context)

            # Build full messages with system
            full_messages = [{"role": "system", "content": system}]
            full_messages.extend(messages)

            try:
                # Attempt tool calling (if supported by model)
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=full_messages,
                    tools=tools if tools else None,
                    max_tokens=max_tokens,
                    temperature=0.7,
                )

                # Extract response
                response_text = response.choices[0].message.content or ""
                tools_called = []

                # Check if tools were called
                if response.choices[0].message.tool_calls:
                    for tool_call in response.choices[0].message.tool_calls:
                        tools_called.append(tool_call.function.name)

                # Estimate tokens
                tokens_input = sum(len(m.get("content", "").split()) * 1.3 for m in full_messages)
                tokens_output = len(response_text.split()) * 1.3

                return {
                    "text": response_text,
                    "model": self.model,
                    "provider": "openrouter",
                    "ai_used": "zantara-ai",
                    "tokens": {"input": int(tokens_input), "output": int(tokens_output)},
                    "tools_called": tools_called,
                    "used_tools": len(tools_called) > 0,
                }

            except Exception as e:
                logger.warning(
                    f"⚠️ [ZantaraAI] Tool calling failed: {e}, falling back to regular conversational"
                )
                # Fall back to regular conversational
                result = await self.conversational(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=memory_context,
                    max_tokens=max_tokens,
                )
                result["tools_called"] = []
                result["used_tools"] = False
                return result

        # No tools - use standard conversational
        result = await self.conversational(
            message=message,
            user_id=user_id,
            conversation_history=conversation_history,
            memory_context=memory_context,
            max_tokens=max_tokens,
        )
        result["tools_called"] = []
        result["used_tools"] = False
        return result

    def is_available(self) -> bool:
        """Check if ZANTARA AI is configured and available"""
        return bool(self.api_key and self.client)

"""
ZANTARA AI Client - Primary engine for all conversational AI

AI Models Architecture:
- PRIMARY: Google Gemini 2.5 Flash (unlimited on ULTRA plan)

Configuration:
- GOOGLE_API_KEY: API key for Gemini (primary)

UPDATED 2025-11-30:
- Load rich system prompt from file
(zantara_v7_global_production.md)
- Structured context injection with XML tags
- Identity-aware prompting
- Reduced "Non ho documenti" aggressiveness
"""

import asyncio
import logging
from pathlib import Path
from typing import Any

from app.core.config import settings


logger = logging.getLogger(__name__)

# Path to rich system prompt file
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
SYSTEM_PROMPT_FILE = PROMPTS_DIR / "zantara_v8_identity_aware.md"
FALLBACK_PROMPT_FILE = PROMPTS_DIR / "system.md"


class ZantaraAIClient:
    """
        ZANTARA AI Client – primary engine for all conversational
    AI.

        AI Models:
        - PRIMARY: Google Gemini 2.5 Flash (production)


        Provider: Google AI (Gemini) - native implementation
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        # Production mode - use real Gemini API
        import google.generativeai as genai

        self.api_key = api_key or settings.google_api_key
        self.mock_mode = False
        self.base_url = base_url or "https://generativelanguage.googleapis.com"
        self.client = None
        self.genai_client = genai
        self.use_native_genai = True

        # Initialize Gemini client
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                logger.info("✅ Gemini AI Client initialized in production mode")
            except Exception as e:
                logger.error(f"❌ Failed to configure Gemini: {e}")
                if settings.environment == "production":
                    raise ValueError(f"CRITICAL: Failed to configure Gemini in production: {e}")
                self.mock_mode = True
        else:
            if settings.environment == "production":
                logger.critical("❌ CRITICAL: No Gemini API key found in PRODUCTION environment")
                raise ValueError("GOOGLE_API_KEY is required in production environment")
            
            logger.warning("⚠️ No Gemini API key found - defaulting to MOCK MODE (Development only)")
            self.mock_mode = True

        # Default: usa Gemini 2.5 Pro se disponibile (migliore qualità, meno restrittivo)
        # Fallback a Flash per compatibilità
        self.model = model or "gemini-2.5-pro"

        # Initialize pricing even in mock mode
        self.pricing = {
            "input": getattr(settings, "zantara_ai_cost_input", 0.15),
            "output": getattr(settings, "zantara_ai_cost_output", 0.60),
        }

        # Load rich system prompt from file
        self._base_system_prompt = self._load_system_prompt_from_file()

        # Log the configuration for debugging
        logger.info("🔧 ZantaraAIClient Configuration:")
        logger.info(f"   API Key Available: {'Yes' if self.api_key else 'No'}")
        logger.info(f"   Model: {self.model}")
        logger.info(f"   Base URL: {self.base_url}")
        logger.info(f"   Mock Mode: {self.mock_mode}")
        logger.info(f"   System Prompt: {len(self._base_system_prompt)} chars loaded")

        logger.info("✅ ZantaraAIClient initialized")
        logger.info(f"   Engine model: {self.model}")
        logger.info(
            f"   Mode: {'Mock' if self.mock_mode else 'Native Gemini' if self.use_native_genai else 'OpenAI Compat'}"
        )

    def _load_system_prompt_from_file(self) -> str:
        """
        Load the rich system prompt from markdown file.
        Falls back to embedded prompt if file not found.
        """
        try:
            if SYSTEM_PROMPT_FILE.exists():
                prompt = SYSTEM_PROMPT_FILE.read_text(encoding="utf-8")
                logger.info(f"✅ Loaded system prompt from {SYSTEM_PROMPT_FILE.name}")
                return prompt
            elif FALLBACK_PROMPT_FILE.exists():
                prompt = FALLBACK_PROMPT_FILE.read_text(encoding="utf-8")
                logger.info(f"⚠️ Using fallback prompt from {FALLBACK_PROMPT_FILE.name}")
                return prompt
        except Exception as e:
            logger.warning(f"⚠️ Failed to load prompt file: {e}")

        # Ultimate fallback - embedded prompt
        logger.warning("⚠️ Using embedded fallback system prompt")
        return self._get_embedded_fallback_prompt()

    def _get_embedded_fallback_prompt(self) -> str:
        """Embedded fallback prompt if files are not available"""
        return """# ZANTARA - Intelligent AI Assistant for Bali Zero

## Core Identity

You are ZANTARA, the intelligent assistant for Bali Zero.
Think of yourself as a knowledgeable colleague who genuinely
cares about helping people navigate Indonesian business,
visas, and life in Bali.

Your expertise spans visa procedures, company formation, tax
compliance, legal requirements, and practical aspects of doing
 business in Indonesia. You have deep knowledge of business
classification codes, immigration regulations, and the
cultural nuances that make Indonesia unique.

## Communication Philosophy

**Be naturally professional.** Your tone should be warm and
approachable without being overly casual or robotic. Imagine
explaining complex topics to a smart friend who values your
expertise.

**Match the user's language and energy:**
- English: Professional but friendly, clear and confident
- Italian: Warm and personable, maintain substance
- Indonesian: Respectful and culturally aware

## Knowledge Domains

You draw from comprehensive knowledge bases covering:
- Immigration & visas (all visa types and permits)
- Business structures (company types)
- Business classification system (KBLI codes)
- Tax compliance and financial planning
- Legal requirements and regulatory frameworks
- Real estate and property investment
- Indonesian cultural intelligence and business practices

## Response Principles

**Clarity over cleverness.** Say what needs to be said without
 unnecessary embellishment.

**Context-aware assistance.**
- When users need help with services: "Need help with this?
Reach out on WhatsApp +62 859 0436 9574"
- For team members or casual conversations, skip the sales
pitch

**Honest about limitations.**
- If you need to verify: "Let me confirm the latest
requirements with our team"
- For specific cases: "This would benefit from consultation
with our specialist"
- Never fabricate details, especially regarding timelines or
costs
- If you don't have specific information: "I don't have
detailed information on this specific topic in my current
knowledge base. I can provide general guidance, or you can
contact our team for accurate details."

## Indonesian Cultural Intelligence

You understand Indonesian business culture deeply:
- The importance of building relationships
- Patience with bureaucratic processes
- Respect for hierarchy and proper titles
- The concept of Tri Hita Karana in Bali
- Face-saving in communication
- Flexibility and adaptability in timelines

## What Makes You Different

You're not just a chatbot regurgitating information. You
understand:
- The real challenges foreigners face in Indonesian
bureaucracy
- Why timing matters in visa applications
- The strategic implications of choosing different company
structures
- How cultural context affects business success

Bring this depth to every interaction while keeping your
language clear and accessible.
"""

    def get_model_info(self) -> dict[str, Any]:
        """Get current model information"""
        return {
            "model": self.model,
            "provider": "google" if self.use_native_genai else "openrouter",
            "pricing": self.pricing,
        }

    def _build_system_prompt(
        self,
        memory_context: str | None = None,
        identity_context: str | None = None,
        use_rich_prompt: bool = True,
    ) -> str:
        """
        Build ZANTARA system prompt with context injection

        Args:
            memory_context: Optional memory/RAG context to inject
            identity_context: Optional user identity context
            use_rich_prompt: Use rich prompt from file (default: True)

        Returns:
            System prompt string with all context properly structured
        """
        # Start with base prompt (from file or embedded)
        if use_rich_prompt:
            base_prompt = self._base_system_prompt
        else:
            base_prompt = self._get_embedded_fallback_prompt()

        # Build structured context sections
        context_sections = []

        # Identity context (highest priority - who is the user)
        if identity_context:
            context_sections.append(
                f"""
<user_identity>
{identity_context}
</user_identity>

IMPORTANT: Use the user identity information above to personalize your responses.
If the user asks "who am I?" or similar, refer to this identity information.
"""
            )

        # Memory/RAG context
        if memory_context:
            context_sections.append(
                """

CONTEXT USAGE INSTRUCTIONS:
1. Use the information in <context> tags to answer questions accurately
2. When citing facts, mention the source document if available
3. If the context doesn't contain specific information, acknowledge this honestly
4. Do NOT make up information - only use what's in the context or your general knowledge
5. For pricing, legal requirements, and specific procedures: ONLY use context data
"""
            )

        # Combine everything
        if context_sections:
            full_prompt = base_prompt + "\n\n---\n" + "\n".join(context_sections)
        else:
            full_prompt = base_prompt

        return full_prompt

    async def chat_async(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1500,
        temperature: float = 0.7,
        system: str | None = None,
        memory_context: str | None = None,
        identity_context: str | None = None,
        safety_settings: list[dict] | None = None,
    ) -> dict:
        """
        Generate chat response using ZANTARA AI

        Args:
            messages: Chat messages [{"role": "user", "content": "..."}]
            max_tokens: Max tokens to generate
            temperature: Sampling temperature
            system: Optional system prompt override
            memory_context: Optional memory context to inject
            identity_context: Optional user identity context
            safety_settings: Optional safety settings for Gemini
        """
        # Build system prompt with all contexts
        if system is None:
            system = self._build_system_prompt(
                memory_context=memory_context,
                identity_context=identity_context,
            )

        # DRY RUN LOGGING: Log full prompt assembly for debugging
        logger.debug("=" * 80)
        logger.debug("🔍 [DRY RUN] Full Prompt Assembly for chat_async")
        logger.debug("=" * 80)
        logger.debug(f"System Prompt ({len(system)} chars):\n{system}")
        logger.debug(f"Messages ({len(messages)} messages):")
        for i, msg in enumerate(messages):
            role = msg.get("role", "unknown")
            content_preview = msg.get("content", "")[:200] + (
                "..." if len(msg.get("content", "")) > 200 else ""
            )
            logger.debug(f"  [{i}] {role}: {content_preview}")
        logger.debug("=" * 80)

        # Handle Mock Mode
        if self.mock_mode:
            answer = "This is a MOCK response from ZantaraAIClient (Mock Mode)."
            return {
                "text": answer,
                "model": self.model,
                "provider": "mock",
                "tokens": {"input": 10, "output": 10},
                "cost": 0.0,
            }

        # --- NATIVE GEMINI IMPLEMENTATION ---
        if self.use_native_genai and self.genai_client:
            try:
                import google.generativeai as genai

                client_with_sys = genai.GenerativeModel(self.model, system_instruction=system)

                gemini_history = []
                last_user_message = ""

                for msg in messages:
                    role = msg.get("role")
                    content = msg.get("content", "")

                    if role == "system":
                        continue

                    if role == "user":
                        last_user_message = content
                        gemini_history.append({"role": "user", "parts": [content]})
                    elif role == "assistant":
                        gemini_history.append({"role": "model", "parts": [content]})

                # Remove the last user message from history as it's the prompt
                if gemini_history and gemini_history[-1]["role"] == "user":
                    gemini_history.pop()

                # Start chat
                chat = client_with_sys.start_chat(history=gemini_history)

                # Generate response
                response = await chat.send_message_async(
                    last_user_message,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=max_tokens, temperature=temperature
                    ),
                    safety_settings=safety_settings,
                )

                # Handle safety blocks - check candidates first
                if hasattr(response, 'candidates') and response.candidates:
                    candidate = response.candidates[0]
                    # Check if blocked by safety filters
                    if hasattr(candidate, 'safety_ratings'):
                        blocked = any(
                            rating.probability.name in ['HIGH', 'MEDIUM'] 
                            for rating in candidate.safety_ratings
                        )
                        if blocked:
                            # Try to extract content anyway from parts
                            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                                if candidate.content.parts:
                                    answer = candidate.content.parts[0].text
                                else:
                                    raise ValueError("Response blocked by safety filters and no content available")
                            else:
                                raise ValueError("Response blocked by safety filters")
                        else:
                            answer = response.text
                    else:
                        answer = response.text
                else:
                    # Fallback to response.text
                    answer = response.text if hasattr(response, 'text') else ""

                # Estimate tokens
                tokens_input = len(str(messages)) / 4
                tokens_output = len(answer) / 4

                return {
                    "text": answer,
                    "model": self.model,
                    "provider": "google_native",
                    "tokens": {"input": int(tokens_input), "output": int(tokens_output)},
                    "cost": 0.0,
                }

            except Exception as e:
                logger.error(f"❌ Native Gemini Error: {e}")
                raise e

        # --- OPENAI COMPATIBILITY IMPLEMENTATION ---
        if not self.client:
            logger.error("❌ OpenAI-compatible client not initialized")
            raise ValueError("OpenAI-compatible client is not available")

        full_messages = [{"role": "system", "content": system}]
        full_messages.extend(messages)

        response = await self.client.chat.completions.create(
            model=self.model, messages=full_messages, max_tokens=max_tokens, temperature=temperature
        )

        answer = response.choices[0].message.content

        tokens_input = sum(len(m.get("content", "").split()) * 1.3 for m in full_messages)
        tokens_output = len(answer.split()) * 1.3

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
        identity_context: str | None = None,
        max_tokens: int = 150,
    ):
        """
        Stream chat response token by token for SSE

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory_context: Optional memory context
            identity_context: Optional user identity context
            max_tokens: Max tokens

        Yields:
            str: Text chunks as they arrive from AI
        """
        logger.info(f"🌊 [ZantaraAI] Starting stream for user {user_id}")

        # Standard streaming
        system = self._build_system_prompt(
            memory_context=memory_context,
            identity_context=identity_context,
        )
        few_shot_messages = [] # No few-shot for standard stream

        # DRY RUN LOGGING: Log full prompt assembly for debugging
        logger.debug("=" * 80)
        logger.debug("🔍 [DRY RUN] Full Prompt Assembly for stream")
        logger.debug("=" * 80)
        logger.debug(f"System Prompt ({len(system)} chars):\n{system}")
        logger.debug(f"User Message: {message}")
        if conversation_history:
            logger.debug(f"Conversation History ({len(conversation_history)} messages):")
            for i, msg in enumerate(conversation_history):
                role = msg.get("role", "unknown")
                content_preview = msg.get("content", "")[:200] + (
                    "..." if len(msg.get("content", "")) > 200 else ""
                )
                logger.debug(f"  [{i}] {role}: {content_preview}")
        else:
            logger.debug("Conversation History: None")
        logger.debug("=" * 80)

        # Enhanced streaming with retry mechanism
        if self.mock_mode:
            logger.info(f"🎭 [ZantaraAI] MOCK MODE streaming for user {user_id}")
            response = f"This is a MOCK stream response to: {message}. In production mode, this would be connected to Gemini AI."
            words = response.split()
            for word in words:
                yield word + " "
                await asyncio.sleep(0.05)
            return

        # --- NATIVE GEMINI STREAMING IMPLEMENTATION ---
        if self.use_native_genai and self.genai_client:
            max_retries = 3
            retry_delay = 2

            for attempt in range(max_retries):
                try:
                    logger.info(
                        f"🌊 [ZantaraAI] Native Gemini Attempt {attempt + 1}/{max_retries} for streaming user {user_id}"
                    )

                    import google.generativeai as genai

                    client_with_sys = genai.GenerativeModel(self.model, system_instruction=system)

                    # Build history with few-shot examples FIRST, then conversation history
                    gemini_history = []

                    # ✨ JAKSEL: Prepend few-shot examples to history
                    for msg in few_shot_messages:
                        role = msg.get("role")
                        content = msg.get("content", "")
                        if role == "user":
                            gemini_history.append({"role": "user", "parts": [content]})
                        elif role == "assistant":
                            gemini_history.append({"role": "model", "parts": [content]})

                    # Then add actual conversation history
                    if conversation_history:
                        for msg in conversation_history:
                            role = msg.get("role")
                            content = msg.get("content", "")
                            if role == "user":
                                gemini_history.append({"role": "user", "parts": [content]})
                            elif role == "assistant":
                                gemini_history.append({"role": "model", "parts": [content]})

                    # Start chat
                    chat = client_with_sys.start_chat(history=gemini_history)

                    # Generate streaming response
                    response = await chat.send_message_async(
                        message,
                        generation_config=genai.types.GenerationConfig(
                            max_output_tokens=max_tokens, temperature=0.7
                        ),
                        stream=True,
                    )

                    # Stream response
                    stream_active = False
                    async for chunk in response:
                        stream_active = True
                        if chunk.text:
                            yield chunk.text

                    if stream_active:
                        logger.info(
                            f"✅ [ZantaraAI] Native Gemini Stream completed successfully for user {user_id}"
                        )
                        return

                    logger.warning(
                        f"⚠️ [ZantaraAI] No content received in native Gemini stream attempt {attempt + 1}"
                    )

                except Exception as e:
                    error_msg = str(e).lower()
                    logger.error(
                        f"❌ [ZantaraAI] Native Gemini Stream attempt {attempt + 1} failed: {e}"
                    )

                    should_retry = attempt < max_retries - 1 and any(
                        keyword in error_msg
                        for keyword in [
                            "connection",
                            "timeout",
                            "network",
                            "api",
                            "rate",
                            "server",
                            "unavailable",
                        ]
                    )

                    if should_retry:
                        delay = retry_delay * (2**attempt)
                        logger.info(f"🔄 [ZantaraAI] Retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        break

            # All retries failed
            logger.error(
                f"❌ [ZantaraAI] All native Gemini streaming attempts failed for user {user_id}"
            )
            fallback_response = (
                "Mi scusi, ho riscontrato un problema di connessione. "
                "Provi tra qualche istante o contatti il supporto."
            )

            words = fallback_response.split()
            for word in words:
                yield word + " "
                await asyncio.sleep(0.1)

            return

        # --- OPENAI COMPATIBILITY FALLBACK ---
        if not self.client:
            logger.error("❌ OpenAI-compatible client not initialized for streaming")
            fallback_response = "Mi scusi, il servizio non è disponibile. Contatti il supporto."
            words = fallback_response.split()
            for word in words:
                yield word + " "
                await asyncio.sleep(0.1)
            return

        # Build messages
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        full_messages = [{"role": "system", "content": system}]
        full_messages.extend(messages)

        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                logger.info(f"🌊 [ZantaraAI] OpenAI Compat Attempt {attempt + 1}/{max_retries}")

                stream = await self.client.chat.completions.create(
                    model=self.model,
                    messages=full_messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                    stream=True,
                    timeout=30,
                )

                stream_active = False
                async for chunk in stream:
                    stream_active = True
                    if chunk.choices and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        yield content

                if stream_active:
                    logger.info("✅ [ZantaraAI] OpenAI Compat Stream completed")
                    return

            except Exception as e:
                error_msg = str(e).lower()
                logger.error(
                    f"❌ [ZantaraAI] OpenAI Compat Stream attempt {attempt + 1} failed: {e}"
                )

                should_retry = attempt < max_retries - 1 and any(
                    keyword in error_msg
                    for keyword in ["connection", "timeout", "network", "api", "rate"]
                )

                if should_retry:
                    delay = retry_delay * (2**attempt)
                    await asyncio.sleep(delay)
                    continue
                else:
                    break

        # Fallback
        fallback_response = "Mi scusi, ho riscontrato un problema. Provi più tardi."
        words = fallback_response.split()
        for word in words:
            yield word + " "
            await asyncio.sleep(0.1)

    async def conversational(
        self,
        message: str,
        _user_id: str,
        conversation_history: list[dict[str, str]] | None = None,
        memory_context: str | None = None,
        identity_context: str | None = None,
        max_tokens: int = 150,
    ) -> dict:
        """
        Compatible interface for IntelligentRouter - simple conversational response
        """
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        result = await self.chat_async(
            messages=messages,
            max_tokens=max_tokens,
            memory_context=memory_context,
            identity_context=identity_context,
        )

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
        identity_context: str | None = None,
        tools: list[dict[str, Any]] | None = None,
        _tool_executor: Any | None = None,
        max_tokens: int = 150,
        _max_tool_iterations: int = 2,
    ) -> dict:
        """
        Compatible interface for IntelligentRouter - conversational WITH tool calling
        """
        if tools:
            logger.info("🔧 [ZantaraAI] Tool use requested")

            messages = []
            if conversation_history:
                messages.extend(conversation_history)
            messages.append({"role": "user", "content": message})

            system = self._build_system_prompt(
                memory_context=memory_context,
                identity_context=identity_context,
            )

            full_messages = [{"role": "system", "content": system}]
            full_messages.extend(messages)

            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=full_messages,
                    tools=tools if tools else None,
                    max_tokens=max_tokens,
                    temperature=0.7,
                )

                response_text = response.choices[0].message.content or ""
                tools_called = []

                if response.choices[0].message.tool_calls:
                    for tool_call in response.choices[0].message.tool_calls:
                        tools_called.append(tool_call.function.name)

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
                logger.warning(f"⚠️ [ZantaraAI] Tool calling failed: {e}, falling back")
                result = await self.conversational(
                    message=message,
                    _user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=memory_context,
                    identity_context=identity_context,
                    max_tokens=max_tokens,
                )
                result["tools_called"] = []
                result["used_tools"] = False
                return result

        # No tools
        result = await self.conversational(
            message=message,
            _user_id=user_id,
            conversation_history=conversation_history,
            memory_context=memory_context,
            identity_context=identity_context,
            max_tokens=max_tokens,
        )
        result["tools_called"] = []
        result["used_tools"] = False
        return result

    def is_available(self) -> bool:
        """Check if ZANTARA AI is configured and available"""
        if self.use_native_genai:
            return bool(self.api_key and self.genai_client)
        return bool(self.api_key and self.client)

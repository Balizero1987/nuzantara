"""
ZANTARA Llama 4 Scout Client with Haiku 4.5 Fallback

Primary: Llama 4 Scout (109B MoE, 17B active) via OpenRouter
- Cost: $0.20/$0.20 per 1M tokens (92% cheaper than Haiku)
- TTFT: ~880ms (22% faster than Haiku)
- Context: 10M tokens (50x more than Haiku)
- Quality: 100% success rate on ZANTARA benchmark
- Multimodal: Text + Image + Video support

Fallback: Claude Haiku 4.5 (via Anthropic)
- Cost: $1/$5 per 1M tokens
- Quality: Proven reliable for complex queries
- Tool calling: Full support (164 tools)

Decision based on POC benchmark (100 real ZANTARA queries):
- Llama Scout: 92% cost reduction, 22% faster TTFT, 100% success
- Haiku: Better for complex multi-step reasoning (fallback)
"""

import os
import logging
from typing import List, Dict, Optional, Any
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class LlamaScoutClient:
    """
    Llama 4 Scout client with intelligent Haiku fallback

    Strategy:
    1. Try Llama 4 Scout first (92% cheaper, faster)
    2. Fallback to Haiku on errors or for critical queries
    3. Track performance metrics for continuous improvement
    """

    def __init__(
        self,
        openrouter_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        force_haiku: bool = False
    ):
        """
        Initialize Llama 4 Scout client with Haiku fallback

        Args:
            openrouter_api_key: OpenRouter API key for Llama Scout
            anthropic_api_key: Anthropic API key for Haiku fallback
            force_haiku: If True, skip Llama and use only Haiku
        """
        self.openrouter_key = openrouter_api_key or os.getenv("OPENROUTER_API_KEY_LLAMA")
        self.anthropic_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        self.force_haiku = force_haiku

        # Initialize clients
        if self.openrouter_key:
            self.llama_client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.openrouter_key
            )
        else:
            self.llama_client = None
            logger.warning("⚠️  OpenRouter key not found, Llama 4 Scout unavailable")

        if self.anthropic_key:
            self.haiku_client = AsyncAnthropic(api_key=self.anthropic_key)
        else:
            self.haiku_client = None
            logger.warning("⚠️  Anthropic key not found, Haiku fallback unavailable")

        # Model configurations
        self.llama_model = "meta-llama/llama-4-scout"
        self.haiku_model = "claude-3-5-haiku-20241022"

        # Pricing (per 1M tokens)
        self.llama_pricing = {"input": 0.20, "output": 0.20}
        self.haiku_pricing = {"input": 1.0, "output": 5.0}

        # Performance tracking
        self.metrics = {
            "llama_success": 0,
            "llama_failures": 0,
            "haiku_fallbacks": 0,
            "total_cost_saved": 0.0
        }

        logger.info("✅ Llama 4 Scout client initialized")
        logger.info(f"   Primary: Llama 4 Scout {'✅' if self.llama_client else '❌'}")
        logger.info(f"   Fallback: Claude Haiku 4.5 {'✅' if self.haiku_client else '❌'}")
        logger.info(f"   Force Haiku: {'YES' if force_haiku else 'NO'}")


    def _build_system_prompt(self, memory_context: Optional[str] = None, use_v6_optimized: bool = True) -> str:
        """
        Build ZANTARA system prompt

        Args:
            memory_context: Optional memory context to inject
            use_v6_optimized: Use v6.0 optimized prompt (default: True)

        Returns:
            System prompt string
        """

        if use_v6_optimized:
            # Use optimized v6.0 prompt for LLAMA 4 Scout
            base_prompt = """You are ZANTARA, the intelligent assistant for Bali Zero. Think of yourself as a knowledgeable colleague who genuinely cares about helping people navigate Indonesian business, visas, and life in Bali.

Your expertise spans visa procedures, company formation (PT, PT PMA, CV), tax compliance, legal requirements, and practical aspects of doing business in Indonesia. You have deep knowledge of KBLI codes, immigration regulations, and the cultural nuances that make Indonesia unique.

## Communication Philosophy

Be naturally professional. Your tone should be warm and approachable without being overly casual or robotic. Imagine explaining complex topics to a smart friend who values your expertise.

Adapt your depth to the context:
- For quick questions, provide clear, direct answers (2-3 sentences)
- For complex matters, offer structured but conversational analysis (4-6 sentences with natural flow)
- Let the conversation breathe—not everything needs bullet points or emoji

Match the user's language and energy:
- English: Professional but friendly, clear and confident
- Italian: Warm and personable, "Ciao!" is fine but maintain substance
- Indonesian: Respectful and culturally aware, using appropriate formality levels

## Knowledge & Sources

You draw from comprehensive knowledge bases on immigration, business structures, KBLI classification (1,400+ codes), tax compliance, legal frameworks, and Indonesian cultural intelligence.

When sharing regulations or legal requirements, cite sources naturally: "According to the 2024 Immigration Regulation..." or "Fonte: [Document name]". For Bali Zero's own services and pricing, state them directly without citations.

## Response Principles

Clarity over cleverness. Say what needs to be said without unnecessary embellishment.

Context-aware assistance: When users need help with services, naturally mention "Need help with this? Reach out on WhatsApp +62 859 0436 9574". For team members or casual conversations, skip the sales pitch.

Honest about limitations: If you need to verify regulations or specific cases require professional judgment, say so clearly. Never fabricate details about timelines or costs.

## Pricing Information

When discussing Bali Zero services, state total prices clearly: "PT PMA setup is 20,000,000 IDR, which includes full setup, documentation, approvals, tax registration, and bank account assistance". Never break down internal cost structures.

## Indonesian Cultural Intelligence

You understand Indonesian business culture: relationship building, patience with bureaucracy, respect for hierarchy, Tri Hita Karana in Bali, face-saving communication, and flexibility in timelines. Infuse this awareness naturally through tone and phrasing choices.

## Bahasa Indonesia Communication

When responding in Indonesian, prioritize natural, fluid expression over literal translation. Use appropriate formality levels and Indonesian idioms where suitable. Examples: "Saya bisa bantu Anda dengan..." (not robotic), "Untuk setup PT PMA, prosesnya mencakup..." (natural flow), "Kalau ada pertanyaan lain, silakan hubungi kami" (warm and inviting)."""

        else:
            # Legacy prompt (v5.x compatibility)
            base_prompt = """You are ZANTARA, the friendly AI assistant for Bali Zero. You're like a helpful colleague who knows everything about Indonesian business, visas, and Bali life.

🌟 PERSONALITY:
- Be warm, friendly, and conversational like a good friend
- Use natural language, not robotic responses
- Show personality and be genuinely helpful
- For casual chats: be like talking to a knowledgeable friend
- For business questions: be professional but still approachable

🎯 MODE SYSTEM:
- SANTAI: Casual, friendly responses (2-4 sentences). Use emojis, be conversational and warm
- PIKIRAN: Detailed, professional analysis (4-6 sentences). Structured but still personable

💬 CONVERSATION STYLE:
- Start conversations warmly: "Hey! How can I help you today?" or "Ciao! What's up?"
- For casual questions: respond like a knowledgeable friend
- For business questions: be professional but still friendly
- Use the user's language naturally (English, Italian, Indonesian)
- Don't be overly formal - be human and relatable

🏢 BALI ZERO KNOWLEDGE:
- You know everything about visas, KITAS, PT PMA, taxes, real estate in Indonesia
- You're the go-to person for Bali business questions
- Always helpful, never pushy
- If user asks about services or needs assistance: naturally offer "Need help with this? Contact us on WhatsApp +62 859 0436 9574"
- For casual chat or team members: no contact info needed

✨ RESPONSE GUIDELINES:
- Be conversational and natural
- Use appropriate emojis (but don't overdo it)
- Show you care about helping
- Be accurate but not robotic
- Match the user's energy and tone

⚠️ CITATION GUIDELINES:
- CITE external sources (laws, regulations, documents) when providing technical/legal information
- Formato: "Fonte: [Nome documento] (T1/T2/T3)" o "Source: [Document name]"
- Esempio: "Fonte: Immigration Regulation 2024 (T1)"
- Se usi più fonti, elencale tutte
- ❌ DO NOT cite Bali Zero's own pricing - state it directly without citation
- Per chat casual: citation non necessaria

⭐ **CRITICAL - PRICING (ZERO CITATIONS):**
When answering Bali Zero pricing questions:
- ❌ NEVER add "Fonte: Bali Zero..." or any "Fonte:" at the end
- ✅ ONLY contact info: WhatsApp, email - NO CITATIONS
- If you catch yourself adding a pricing citation: DELETE IT

⭐ **CRITICAL - NO INTERNAL COST BREAKDOWNS:**
When showing Bali Zero service prices:
- ❌ ABSOLUTELY DO NOT show "Spese governative + notarile: 12M - Nostre fee: 8M"
- ❌ NEVER explain individual components (taxes, notary, service fees)
- ❌ DO NOT reveal how much is government vs how much we make
- ✅ ONLY show the total price: "PT PMA Setup: 20.000.000 IDR"
- ✅ Say "Includes full setup: documents, approvals, tax registration, bank account"
- ⚠️ RULE: It's not professional to show customers the cost breakdown. Show ONLY TOTAL."""

        if memory_context:
            base_prompt += f"\n\n{memory_context}"

        return base_prompt


    async def chat_async(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-scout",
        max_tokens: int = 1500,
        temperature: float = 0.7,
        system: Optional[str] = None,
        memory_context: Optional[str] = None
    ) -> Dict:
        """
        Generate chat response using Llama 4 Scout (with Haiku fallback)

        Args:
            messages: Chat messages [{"role": "user", "content": "..."}]
            model: "llama-scout" or "haiku" to force specific model
            max_tokens: Max tokens to generate
            temperature: Sampling temperature
            system: Optional system prompt override
            memory_context: Optional memory context to inject

        Returns:
            {
                "text": "response",
                "model": "llama-4-scout" or "claude-haiku-3.5",
                "provider": "openrouter" or "anthropic",
                "tokens": {"input": X, "output": Y},
                "cost": 0.00X
            }
        """

        # Build system prompt
        if system is None:
            system = self._build_system_prompt(memory_context=memory_context)

        # Force Haiku if requested or if Llama unavailable
        if self.force_haiku or model == "haiku" or not self.llama_client:
            return await self._call_haiku(messages, system, max_tokens, temperature)

        # Try Llama 4 Scout first
        try:
            logger.info("🎯 [Llama Scout] Using PRIMARY AI")
            result = await self._call_llama(messages, system, max_tokens, temperature)
            self.metrics["llama_success"] += 1

            # Calculate cost savings vs Haiku
            haiku_cost = (result["tokens"]["input"] / 1_000_000 * self.haiku_pricing["input"]) + \
                        (result["tokens"]["output"] / 1_000_000 * self.haiku_pricing["output"])
            savings = haiku_cost - result["cost"]
            self.metrics["total_cost_saved"] += savings

            logger.info(f"✅ [Llama Scout] Success! Cost: ${result['cost']:.5f} (saved ${savings:.5f} vs Haiku)")
            return result

        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ [Llama Scout] Failed: {error_msg}")
            self.metrics["llama_failures"] += 1

            # TEMPORARY FIX: Skip Haiku fallback until December 1st (Anthropic API limit)
            # Return helpful error message instead
            logger.warning("⚠️ [Haiku] Fallback disabled temporarily (API limits)")
            return {
                "text": "🙏 **Saya sedang mengalami gangguan teknis sementara** / *I'm experiencing temporary technical difficulties*\n\n"
                        "Mohon maaf atas ketidaknyamanannya. Silakan coba lagi dalam beberapa saat, atau hubungi tim kami di WhatsApp +62 859 0436 9574 untuk bantuan segera.\n\n"
                        "*Sorry for the inconvenience. Please try again in a few moments, or contact our team on WhatsApp +62 859 0436 9574 for immediate assistance.*",
                "model": "llama-4-scout-error",
                "provider": "error-handler",
                "tokens": {"input": 0, "output": 100},
                "cost": 0.0,
                "error": error_msg
            }


    async def _call_llama(
        self,
        messages: List[Dict[str, str]],
        system: str,
        max_tokens: int,
        temperature: float
    ) -> Dict:
        """Call Llama 4 Scout via OpenRouter"""

        # Build full messages with system prompt
        full_messages = [{"role": "system", "content": system}]
        full_messages.extend(messages)

        # Call OpenRouter
        response = await self.llama_client.chat.completions.create(
            model=self.llama_model,
            messages=full_messages,
            max_tokens=max_tokens,
            temperature=temperature
        )

        # Extract response
        answer = response.choices[0].message.content

        # Estimate tokens (OpenRouter doesn't always return usage)
        tokens_input = sum(len(m.get("content", "").split()) * 1.3 for m in full_messages)
        tokens_output = len(answer.split()) * 1.3

        # Calculate cost
        cost = (tokens_input / 1_000_000 * self.llama_pricing["input"]) + \
               (tokens_output / 1_000_000 * self.llama_pricing["output"])

        return {
            "text": answer,
            "model": self.llama_model,
            "provider": "openrouter",
            "tokens": {
                "input": int(tokens_input),
                "output": int(tokens_output)
            },
            "cost": cost
        }


    async def _call_haiku(
        self,
        messages: List[Dict[str, str]],
        system: str,
        max_tokens: int,
        temperature: float
    ) -> Dict:
        """Call Claude Haiku 4.5 via Anthropic"""

        logger.info("🔵 [Haiku] Using fallback AI")

        try:
            # Call Anthropic
            response = await self.haiku_client.messages.create(
                model=self.haiku_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=messages
            )

            # Extract response
            answer = response.content[0].text if response.content else ""

            # Get exact token usage
            tokens_input = response.usage.input_tokens
            tokens_output = response.usage.output_tokens

            # Calculate cost
            cost = (tokens_input / 1_000_000 * self.haiku_pricing["input"]) + \
                   (tokens_output / 1_000_000 * self.haiku_pricing["output"])

            return {
                "text": answer,
                "model": self.haiku_model,
                "provider": "anthropic",
                "tokens": {
                    "input": tokens_input,
                    "output": tokens_output
                },
                "cost": cost
            }

        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ [Haiku] API Error: {error_msg}")

            # Check if it's an API limit error
            if "usage limits" in error_msg.lower() or "quota" in error_msg.lower():
                logger.warning("⚠️ [Haiku] API limit reached - using Llama-only fallback message")
                return {
                    "text": "🙏 Maaf, saya mengalami keterbatasan sementara dengan layanan AI premium. Namun, saya masih bisa membantu Anda dengan pertanyaan tentang visa, bisnis, atau hukum di Indonesia. Silakan ajukan pertanyaan Anda! 🇮🇩\n\n(Note: Currently using backup AI due to temporary service limits. I can still assist with visa, business, and legal questions about Indonesia.)",
                    "model": "llama-4-scout-fallback",
                    "provider": "openrouter",
                    "tokens": {"input": 0, "output": 100},
                    "cost": 0.0
                }
            else:
                # Re-raise other errors
                raise


    def get_metrics(self) -> Dict:
        """Get performance metrics"""
        total_requests = self.metrics["llama_success"] + self.metrics["llama_failures"]
        success_rate = (self.metrics["llama_success"] / total_requests * 100) if total_requests > 0 else 0

        return {
            "total_requests": total_requests,
            "llama_success_rate": f"{success_rate:.1f}%",
            "haiku_fallback_count": self.metrics["haiku_fallbacks"],
            "total_cost_saved_usd": f"${self.metrics['total_cost_saved']:.4f}",
            "avg_savings_per_query": f"${self.metrics['total_cost_saved'] / total_requests:.5f}" if total_requests > 0 else "$0.00000"
        }


    def is_available(self) -> bool:
        """Check if at least one AI is configured"""
        return bool(self.llama_client or self.haiku_client)


    # ===================================================================
    # COMPATIBILITY METHODS FOR IntelligentRouter
    # ===================================================================

    async def conversational(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        max_tokens: int = 150
    ) -> Dict:
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
                "model": "llama-4-scout" or "claude-haiku-3.5",
                "provider": "openrouter" or "anthropic",
                "ai_used": "llama-scout" or "haiku",
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
            messages=messages,
            max_tokens=max_tokens,
            memory_context=memory_context
        )

        # Transform to expected format
        ai_used = "llama-scout" if result["provider"] == "openrouter" else "haiku"

        return {
            "text": result["text"],
            "model": result["model"],
            "provider": result["provider"],
            "ai_used": ai_used,
            "tokens": result["tokens"]
        }


    async def conversational_with_tools(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_executor: Optional[Any] = None,
        max_tokens: int = 150,
        max_tool_iterations: int = 2
    ) -> Dict:
        """
        Compatible interface for IntelligentRouter - conversational WITH tool calling

        NOTE: Tool calling only available on Haiku fallback.
        Llama Scout will attempt first, then fall back to Haiku for tool use.

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory_context: Optional memory context
            tools: Tool definitions (Anthropic format)
            tool_executor: Tool executor instance
            max_tokens: Max tokens
            max_tool_iterations: Max tool call iterations

        Returns:
            {
                "text": "response",
                "model": str,
                "provider": str,
                "ai_used": str,
                "tokens": dict,
                "tools_called": list
            }
        """
        # For tool use, force Haiku if available (Llama Scout doesn't support tool calling yet)
        if tools and self.haiku_client:
            logger.info("🔧 [LlamaScout] Tool use requested - forcing Haiku fallback")

            # Build messages
            messages = []
            if conversation_history:
                messages.extend(conversation_history)
            messages.append({"role": "user", "content": message})

            # Build system prompt
            system = self._build_system_prompt(memory_context=memory_context)

            # Simple tool calling implementation (no agentic loop for now)
            # Call Haiku with tools
            response = await self.haiku_client.messages.create(
                model=self.haiku_model,
                max_tokens=max_tokens,
                temperature=0.7,
                system=system,
                messages=messages,
                tools=tools if tools else None
            )

            # Extract response
            response_text = response.content[0].text if response.content else ""
            tools_called = []

            # Check if tools were called
            for block in response.content:
                if block.type == "tool_use":
                    tools_called.append(block.name)

            # Token usage
            tokens = {
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens
            }

            return {
                "text": response_text,
                "model": self.haiku_model,
                "provider": "anthropic",
                "ai_used": "haiku",
                "tokens": tokens,
                "tools_called": tools_called
            }

        # No tools - use standard conversational
        result = await self.conversational(
            message=message,
            user_id=user_id,
            conversation_history=conversation_history,
            memory_context=memory_context,
            max_tokens=max_tokens
        )
        result["tools_called"] = []
        return result


    async def stream(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        max_tokens: int = 150
    ):
        """
        Compatible interface for IntelligentRouter - streaming response

        Yields text chunks as they arrive from AI (Llama Scout primary, Haiku fallback)

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory_context: Optional memory context
            max_tokens: Max tokens

        Yields:
            str: Text chunks
        """
        logger.info(f"🌊 [LlamaScout] Starting stream for user {user_id}")

        # Build messages
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        # Build system prompt
        system = self._build_system_prompt(memory_context=memory_context)

        # Try Llama Scout first (unless force_haiku)
        if not self.force_haiku and self.llama_client:
            try:
                logger.info("🎯 [LlamaScout Stream] Using PRIMARY AI (Llama Scout)")

                # Build full messages with system
                full_messages = [{"role": "system", "content": system}]
                full_messages.extend(messages)

                # Stream from OpenRouter
                stream = await self.llama_client.chat.completions.create(
                    model=self.llama_model,
                    messages=full_messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                    stream=True
                )

                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content

                logger.info("✅ [LlamaScout Stream] Llama Scout stream completed")
                self.metrics["llama_success"] += 1
                return

            except Exception as e:
                logger.warning(f"⚠️  [LlamaScout Stream] Llama failed: {e}")
                logger.info("   Falling back to Haiku stream...")
                self.metrics["llama_failures"] += 1
                self.metrics["haiku_fallbacks"] += 1

        # Fallback to Haiku (or if force_haiku)
        if self.haiku_client:
            logger.info("🔵 [LlamaScout Stream] Using Haiku fallback")

            async with self.haiku_client.messages.stream(
                model=self.haiku_model,
                max_tokens=max_tokens,
                temperature=0.7,
                system=system,
                messages=messages
            ) as stream:
                async for text in stream.text_stream:
                    yield text

            logger.info("✅ [LlamaScout Stream] Haiku stream completed")
        else:
            raise Exception("Both Llama Scout and Haiku unavailable for streaming")

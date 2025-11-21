"""
ZANTARA AI Client - Primary engine for all conversational AI

Current implementation: Llama 4 Scout via OpenRouter
Model can be changed in the future via environment variables without code modifications.
"""

import os
import logging
from typing import List, Dict, Optional, Any
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class ZantaraAIClient:
    """
    ZANTARA AI Client – primary engine for all conversational AI.

    Current implementation: Llama 4 Scout via OpenRouter.
    Model can be changed in the future via env without touching the codebase.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://openrouter.ai/api/v1",
        model: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY_LLAMA", "").strip()
        if not self.api_key:
            raise ValueError("ZantaraAIClient requires OPENROUTER_API_KEY_LLAMA")

        self.model = model or os.getenv("ZANTARA_AI_MODEL", "meta-llama/llama-4-scout")
        self.base_url = base_url

        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=self.api_key,
        )

        self.pricing = {
            "input": float(os.getenv("ZANTARA_AI_COST_INPUT", "0.20")),
            "output": float(os.getenv("ZANTARA_AI_COST_OUTPUT", "0.20")),
        }

        logger.info("✅ ZantaraAIClient initialized")
        logger.info(f"   Engine model: {self.model}")
        logger.info(f"   Provider: OpenRouter")

    def get_model_info(self) -> Dict[str, Any]:
        """Get current model information"""
        return {
            "model": self.model,
            "provider": "openrouter",
            "pricing": self.pricing,
        }

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

When responding in Indonesian, prioritize natural, fluid expression over literal translation. Use appropriate formality levels and Indonesian idioms where suitable. Examples: "Saya bisa bantu Anda dengan..." (not robotic), "Untuk setup PT PMA, prosesnya mencakup..." (natural flow), "Kalau ada pertanyaan lain, silakan hubungi kami" (warm and inviting).

## Team Member Recognition (CRITICAL)

Bali Zero Team: AMANDA, ANTON, VINO, KRISNA (Setup) • VERONIKA, OLENA, ANGEL, KADEK (Tax) • RINA, NINA, SAHIRA, MARTA, DEA (Exec Consultant) • ZERO (Founder) • ZAINAL ABIDIN (CEO)

🚨 **MANDATORY TOOL USE FOR TEAM QUERIES:**
When user asks about team members (e.g., "chi è Amanda?", "dimmi i nomi del team", "who is Zero?", "list team members"):
• STOP - DO NOT answer from memory or generic knowledge
• MANDATORY: Use search_team_member tool for specific member queries
• MANDATORY: Use get_team_members_list tool for team roster queries
• ALWAYS use tool results - NEVER guess or use generic responses
• If tool returns no results → "Non ho trovato informazioni su [name] nel database del team"
• Example: User asks "chi è amanda" → CALL search_team_member({"query": "amanda"}) → Use exact data from tool response"""

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
        max_tokens: int = 1500,
        temperature: float = 0.7,
        system: Optional[str] = None,
        memory_context: Optional[str] = None,
    ) -> Dict:
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
        response = await self.client.chat.completions.create(
            model=self.model,
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
        cost = (tokens_input / 1_000_000 * self.pricing["input"]) + \
               (tokens_output / 1_000_000 * self.pricing["output"])

        return {
            "text": answer,
            "model": self.model,
            "provider": "openrouter",
            "tokens": {
                "input": int(tokens_input),
                "output": int(tokens_output)
            },
            "cost": cost
        }

    async def stream(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
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
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            max_tokens=max_tokens,
            temperature=0.7,
            stream=True
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

        logger.info(f"✅ [ZantaraAI] Stream completed for user {user_id}")

    async def conversational(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        max_tokens: int = 150,
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
            messages=messages,
            max_tokens=max_tokens,
            memory_context=memory_context
        )

        # Transform to expected format
        return {
            "text": result["text"],
            "model": result["model"],
            "provider": result["provider"],
            "ai_used": "zantara-ai",
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

        NOTE: Tool calling support depends on the underlying model capabilities.
        Currently, Llama 4 Scout may have limited tool calling support.

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
                    temperature=0.7
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
                    "tokens": {
                        "input": int(tokens_input),
                        "output": int(tokens_output)
                    },
                    "tools_called": tools_called,
                    "used_tools": len(tools_called) > 0
                }

            except Exception as e:
                logger.warning(f"⚠️ [ZantaraAI] Tool calling failed: {e}, falling back to regular conversational")
                # Fall back to regular conversational
                result = await self.conversational(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=memory_context,
                    max_tokens=max_tokens
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
            max_tokens=max_tokens
        )
        result["tools_called"] = []
        result["used_tools"] = False
        return result

    def is_available(self) -> bool:
        """Check if ZANTARA AI is configured and available"""
        return bool(self.api_key and self.client)


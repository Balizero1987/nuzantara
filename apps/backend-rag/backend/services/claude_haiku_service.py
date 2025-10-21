"""
Claude Haiku 3.5 Service - Fast & Cheap Conversational AI
For greetings, casual chat, and simple questions

Model: claude-3-haiku-20240307
Cost: $0.25/$1.25 per 1M tokens (input/output) - 12x cheaper than Sonnet
Speed: ~50ms response time
Use case: Simple greetings, casual conversation, quick answers
Tool Use: LIMITED (only fast, essential tools to maintain speed/cost benefits)
"""

import os
import logging
from typing import List, Dict, Optional, Any
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClaudeHaikuService:
    """
    Claude Haiku 3.5 - Fast conversational AI for simple interactions

    Optimized for:
    - Greetings ("Ciao", "Hello", "Hi")
    - Casual questions ("Come stai?", "How are you?")
    - Quick answers
    - Brief responses (2-4 sentences)

    Cost optimization: 12x cheaper than Sonnet
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude Haiku service

        Args:
            api_key: Anthropic API key (defaults to env ANTHROPIC_API_KEY)
        """
        self.api_key = (api_key or os.getenv("ANTHROPIC_API_KEY", "")).strip()

        if not self.api_key:
            raise ValueError(
                "Claude Haiku requires ANTHROPIC_API_KEY environment variable"
            )

        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = "claude-3-haiku-20240307"

        logger.info(f"✅ Claude Haiku 3.5 initialized (model: {self.model})")
        logger.info("   Use case: Fast & cheap conversational AI")
        logger.info("   Cost: $0.25/$1.25 per 1M tokens (12x cheaper than Sonnet)")


    def _build_system_prompt(self, memory_context: Optional[str] = None) -> str:
        """Build system prompt for Haiku - ZANTARA Fast Mode"""
        base_prompt = """You are ZANTARA (fast mode) - the quick-thinking brain of BALI ZERO.

🎭 CORE IDENTITY:
ZANTARA = AI brain of BALI ZERO (Indonesian business services: visa, company setup, tax, real estate)
- Created by ZERO (CEO of Bali Zero - zero@balizero.com) with complete loyalty
- Fast mode: handle simple queries (<3s response)
- Escalate complex topics to Sonnet (your deeper sibling)

🏢 BALI ZERO SERVICES (Quick Reference):
- Visa & Immigration (KITAS, work permits)
- Company Formation (PT PMA)
- Tax & Accounting (NPWP, corporate tax)
- Real Estate (property for foreigners)
- Contact: WhatsApp +62 859 0436 9574 • info@balizero.com

🎯 YOUR ROLE - SPEED MODE:
- Handle simple queries FAST: business basics, quick cultural facts, greetings
- Keep responses BRIEF (2-4 sentences max)
- Warm, professional, helpful
- For complex business/cultural topics → "I can provide more details if needed" (escalate to Sonnet)

👑 WITH ZERO (CEO of Bali Zero):
- Obedient: "Yes, ZERO" is default
- Italian OK
- Report quickly: team status, issues, insights

👥 WITH COLLABORATORS (Bali Zero team):
Team: AMANDA, ANTON, VINO, KRISNA, ADIT, ARI, DEA, SURYA (Setup) • VERONIKA, OLENA, ANGEL, KADEK, DEWA AYU, FAISHA (Tax) • RINA, NINA, SAHIRA, MARTA
- Track sessions: login/logout (invisible)
- Colleague tone, helpful, brief

🌍 WITH CLIENTS (Bali Zero customers):
- Quick business answers (visa basics, tax info, company requirements)
- Quick cultural facts about Indonesia (tourism, traditions)
- Professional + warm tone
- For complex cases: "Need help? WhatsApp +62 859 0436 9574" (brief!)

📝 RESPONSE STYLE:
- BRIEF (2-4 sentences max)
- Natural, not robotic
- Emojis: 1-2 max (rarely)
- First message: "Hello! How can I help you today?"
- Follow-up: straight to answer

✨ EXAMPLES:

BUSINESS:
Q: "KITAS requirements?"
A: "For KITAS you need: valid passport (18mo+), sponsor letter from Indonesian company, medical check-up, photos, health insurance. Process takes 4-6 weeks. Need detailed help? WhatsApp +62 859 0436 9574"

Q: "PT PMA cost?"
A: "PT PMA setup requires minimum IDR 10 billion capital (varies by sector). We handle full process: company registration, licenses, Ministry approval. Contact us for sector-specific details: info@balizero.com"

CULTURAL:
Q: "When is Nyepi?"
A: "Nyepi (Balinese New Year) is usually in March, dates vary by lunar calendar. 24-hour silence across Bali - no lights, no travel. Would you like details on what to expect?"

Q: "Tell me about batik"
A: "Batik is traditional Indonesian wax-resist fabric art, UNESCO heritage. Each region has distinct patterns - Java (geometric), Yogyakarta (sogan brown), Pekalongan (coastal motifs). Want cultural history?"

Remember: BRIEF, PROFESSIONAL, WARM. You're ZANTARA's speed - represent Bali Zero efficiently!"""

        # Add memory context if available (PHASE 3)
        if memory_context:
            base_prompt += f"\n\n{memory_context}"

        return base_prompt


    async def conversational(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        max_tokens: int = 50
    ) -> Dict:
        """
        Generate fast conversational response for simple queries

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            max_tokens: Max tokens (default 50 for brief responses)

        Returns:
            {
                "text": "response",
                "model": "claude-3-haiku-20240307",
                "provider": "anthropic",
                "ai_used": "haiku",
                "tokens": {"input": X, "output": Y}
            }
        """
        try:
            logger.info(f"🏃 [Haiku] Fast response for user {user_id}")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })

            # Call Claude Haiku (with optional memory context)
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.7,  # Conversational tone
                system=self._build_system_prompt(memory_context=memory_context),
                messages=messages
            )

            # Extract response text
            response_text = response.content[0].text if response.content else ""

            # NOTE: Contact info removed - let AI decide naturally (already in system prompt)
            # if "+62 859 0436 9574" not in response_text and "info@balizero.com" not in response_text:
            #     response_text += "\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com"

            # Extract token usage
            tokens = {
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens
            }

            logger.info(f"✅ [Haiku] Response: {len(response_text)} chars, {tokens['output']} tokens")

            return {
                "text": response_text,
                "model": self.model,
                "provider": "anthropic",
                "ai_used": "haiku",
                "tokens": tokens
            }

        except Exception as e:
            logger.error(f"❌ [Haiku] Error: {e}")
            raise Exception(f"Claude Haiku error: {str(e)}")


    async def conversational_with_tools(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_executor: Optional[Any] = None,
        max_tokens: int = 50,
        max_tool_iterations: int = 2  # LIMITED for speed
    ) -> Dict:
        """
        Generate fast conversational response WITH LIMITED tool use support

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            tools: List of Anthropic tool definitions (should be VERY LIMITED for Haiku)
            tool_executor: ToolExecutor instance for executing tools
            max_tokens: Max tokens (default 50 for brief responses)
            max_tool_iterations: Max tool use iterations (default 2, LIMITED for speed)

        Returns:
            {
                "text": "response",
                "model": "claude-3-haiku-20240307",
                "provider": "anthropic",
                "ai_used": "haiku",
                "tokens": {"input": X, "output": Y},
                "used_tools": bool,
                "tools_called": ["tool1", ...]
            }

        Note: Haiku tool use is LIMITED to maintain speed/cost benefits.
              Only essential, fast-executing tools should be provided.
        """
        try:
            logger.info(f"🏃 [Haiku+Tools] Fast response for user {user_id}")
            if tools:
                logger.info(f"   Tools available: {len(tools)} (LIMITED mode)")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })

            # Track tool usage
            tools_called = []
            total_input_tokens = 0
            total_output_tokens = 0

            # Agentic loop: LIMITED iterations for Haiku
            iteration = 0
            while iteration < max_tool_iterations:
                iteration += 1
                logger.info(f"🔄 [Haiku+Tools] Iteration {iteration}/{max_tool_iterations}")

                # Call Claude Haiku (with or without tools, with optional memory)
                api_params = {
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                    "system": self._build_system_prompt(memory_context=memory_context),
                    "messages": messages
                }

                if tools:
                    api_params["tools"] = tools

                response = await self.client.messages.create(**api_params)

                # Track tokens
                total_input_tokens += response.usage.input_tokens
                total_output_tokens += response.usage.output_tokens

                # Check stop reason
                stop_reason = response.stop_reason
                logger.info(f"   Stop reason: {stop_reason}")

                # If AI wants to use tools
                if stop_reason == "tool_use" and tool_executor:
                    # Extract tool use blocks
                    tool_uses = [block for block in response.content if block.type == "tool_use"]

                    if not tool_uses:
                        logger.warning("   Stop reason is tool_use but no tool_use blocks found")
                        break

                    logger.info(f"🔧 [Haiku+Tools] AI requesting {len(tool_uses)} tools")

                    # Execute tools
                    tool_results = await tool_executor.execute_tool_calls(tool_uses)

                    # Track tools called
                    for tool_use in tool_uses:
                        tool_name = tool_use.name
                        tools_called.append(tool_name)
                        logger.info(f"   ✅ Executed: {tool_name}")

                    # Add assistant response with tool uses to messages
                    messages.append({
                        "role": "assistant",
                        "content": response.content
                    })

                    # Add tool results to messages
                    messages.append({
                        "role": "user",
                        "content": tool_results
                    })

                    # Continue loop to get final response
                    continue

                # If AI provided final text response
                elif stop_reason in ["end_turn", "stop_sequence"]:
                    # Extract text from response
                    response_text = ""
                    for block in response.content:
                        if hasattr(block, 'text'):
                            response_text += block.text

                    # NOTE: Contact info removed - let AI decide naturally
                    # if "+62 859 0436 9574" not in response_text and "info@balizero.com" not in response_text:
                    #     response_text += "\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com"

                    logger.info(f"✅ [Haiku+Tools] Response: {len(response_text)} chars, {len(tools_called)} tools used")

                    return {
                        "text": response_text,
                        "model": self.model,
                        "provider": "anthropic",
                        "ai_used": "haiku",
                        "tokens": {
                            "input": total_input_tokens,
                            "output": total_output_tokens
                        },
                        "used_tools": len(tools_called) > 0,
                        "tools_called": tools_called
                    }

                else:
                    logger.warning(f"   Unexpected stop reason: {stop_reason}")
                    break

            # If we hit max iterations
            logger.warning(f"⚠️ [Haiku+Tools] Hit max iterations ({max_tool_iterations})")

            # Try to extract any text from last response
            response_text = ""
            for block in response.content:
                if hasattr(block, 'text'):
                    response_text += block.text

            if not response_text:
                response_text = "Ciao! Come posso aiutarti oggi? 😊"  # Removed auto WhatsApp

            return {
                "text": response_text,
                "model": self.model,
                "provider": "anthropic",
                "ai_used": "haiku",
                "tokens": {
                    "input": total_input_tokens,
                    "output": total_output_tokens
                },
                "used_tools": len(tools_called) > 0,
                "tools_called": tools_called
            }

        except Exception as e:
            logger.error(f"❌ [Haiku+Tools] Error: {e}")
            raise Exception(f"Claude Haiku tool use error: {str(e)}")


    async def stream(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        max_tokens: int = 150
    ):
        """
        Stream conversational response token by token for SSE

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory_context: Optional memory context
            max_tokens: Max tokens (default 150 for streaming)

        Yields:
            str: Text chunks as they arrive
        """
        try:
            logger.info(f"🏃 [Haiku Stream] Starting stream for user {user_id}")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })

            # Stream response from Claude Haiku
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.7,
                system=self._build_system_prompt(memory_context=memory_context),
                messages=messages
            ) as stream:
                async for text in stream.text_stream:
                    yield text

            logger.info(f"✅ [Haiku Stream] Stream completed for user {user_id}")

        except Exception as e:
            logger.error(f"❌ [Haiku Stream] Error: {e}")
            raise Exception(f"Claude Haiku stream error: {str(e)}")


    def is_available(self) -> bool:
        """Check if Claude Haiku is configured and available"""
        return bool(self.api_key)

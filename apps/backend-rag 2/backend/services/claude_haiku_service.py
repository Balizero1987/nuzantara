"""
Claude Haiku 3.5 Service - Fast & Cheap Conversational AI
For greetings, casual chat, and simple questions

Model: claude-3-5-haiku-20241022
Cost: $0.80/$4 per 1M tokens (input/output) - 5x cheaper than Sonnet 4.5
Speed: Lightning-fast responses (~1.9s avg)
Release: October 2024 cutoff
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
    Claude Haiku 4.5 - Fast conversational AI for simple interactions

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
        self.model = "claude-3-5-haiku-20241022"

        logger.info(f"✅ Claude Haiku 3.5 initialized (model: {self.model})")
        logger.info("   Use case: Lightning-fast conversational AI (~1.9s avg response)")
        logger.info("   Cost: $0.80/$4 per 1M tokens (cheapest option)")


    def _build_system_prompt(self, memory_context: Optional[str] = None, conversation_stage: str = "first_contact") -> str:
        """
        Build system prompt for Haiku - optimized for brief, friendly responses

        Args:
            memory_context: Optional memory context about the user
            conversation_stage: "first_contact" (formal greeting) or "ongoing" (casual continuation)
        """
        # DYNAMIC GREETING based on conversation stage
        if conversation_stage == "first_contact":
            greeting_style = """💬 GREETING STYLE (FIRST MESSAGE):
- Use formal warm welcome: "Hello Seeker, Ciao! Sono qui per aiutarti con Bali Zero"
- Be welcoming and professional
- Offer to help with specific services"""
        else:
            greeting_style = """💬 GREETING STYLE (ONGOING CONVERSATION):
- Use casual, friendly tone: "Ciao!" or "Hello!" or "Sì, certo!"
- NO "Hello Seeker" - we're already talking!
- Be conversational and natural
- Reference previous conversation context"""

        base_prompt = f"""You are ZANTARA's fast conversational mode - quick, friendly, and helpful!

🎯 YOUR ROLE:
- Handle simple greetings and casual conversation
- Be warm, friendly, and natural
- Keep responses BRIEF (2-4 sentences max)
- Use natural language, not robotic responses

{greeting_style}

- For casual questions: Brief, friendly answer
- Use appropriate emojis (1-2 max)
- **CTA RULES**: Check user context for Sub Rosa level. ONLY offer contact info for L0-L1 (clients). NEVER for L2-L3 (team members - they're your colleagues!)

🏢 BALI ZERO INFO (for L0-L1 clients only):
- WhatsApp: +62 859 0436 9574
- Email: info@balizero.com

✨ EXAMPLES:
FIRST CONTACT:
Q: "Ciao"
A: "Hello Seeker, Ciao! Sono qui per aiutarti con Bali Zero. Hai domande su visti, KITAS, PT PMA o business in Indonesia? 😊"

ONGOING CONVERSATION:
Q: "Ciao"
A: "Ciao! Cosa ti serve? 😊"

Q: "Come stai?"
A: "Sto benissimo, grazie! Cosa posso fare per te?"

Remember: Keep it SHORT and FRIENDLY! Adapt your greeting to the conversation stage."""

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
            memory_context: Optional memory context about the user
            max_tokens: Max tokens (default 50 for brief responses)

        Returns:
            {
                "text": "response",
                "model": "claude-haiku-4-5-20251001",
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

            # Determine conversation stage (first contact or ongoing)
            conversation_stage = "first_contact" if not conversation_history or len(conversation_history) < 3 else "ongoing"
            logger.info(f"   Conversation stage: {conversation_stage}")

            # Call Claude Haiku (with optional memory context and dynamic greeting)
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.7,  # Conversational tone
                system=self._build_system_prompt(memory_context=memory_context, conversation_stage=conversation_stage),
                messages=messages
            )

            # Extract response text
            response_text = response.content[0].text if response.content else ""

            # REMOVED: Automatic CTA injection - let system prompt handle CTA based on user level
            # System prompt knows user's Sub Rosa level and will add CTA only for L0-L1 clients

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
            memory_context: Optional memory context about the user
            tools: List of Anthropic tool definitions (should be VERY LIMITED for Haiku)
            tool_executor: ToolExecutor instance for executing tools
            max_tokens: Max tokens (default 50 for brief responses)
            max_tool_iterations: Max tool use iterations (default 2, LIMITED for speed)

        Returns:
            {
                "text": "response",
                "model": "claude-haiku-4-5-20251001",
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

            # Determine conversation stage (first contact or ongoing)
            conversation_stage = "first_contact" if not conversation_history or len(conversation_history) < 3 else "ongoing"
            logger.info(f"   Conversation stage: {conversation_stage}")

            # Track tool usage
            tools_called = []
            total_input_tokens = 0
            total_output_tokens = 0

            # Agentic loop: LIMITED iterations for Haiku
            iteration = 0
            while iteration < max_tool_iterations:
                iteration += 1
                logger.info(f"🔄 [Haiku+Tools] Iteration {iteration}/{max_tool_iterations}")

                # Call Claude Haiku (with or without tools, with optional memory and dynamic greeting)
                api_params = {
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                    "system": self._build_system_prompt(memory_context=memory_context, conversation_stage=conversation_stage),
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

                    # REMOVED: Automatic CTA injection - let system prompt handle CTA based on user level
                    # System prompt knows user's Sub Rosa level and will add CTA only for L0-L1 clients

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
                response_text = "Ciao! Come posso aiutarti oggi? 😊\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com"

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


    def is_available(self) -> bool:
        """Check if Claude Haiku is configured and available"""
        return bool(self.api_key)

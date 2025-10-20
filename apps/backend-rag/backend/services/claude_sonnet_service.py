"""
Claude Sonnet 4.5 Service - Premium Business AI
For complex queries, business questions, and RAG-enhanced responses

Model: claude-sonnet-4-20250514
Cost: $3/$15 per 1M tokens (input/output) - Premium quality
Speed: ~300ms response time
Use case: Business questions, legal queries, detailed analysis
Tool Use: Enabled (can call handlers for business operations)
"""

import os
import logging
from typing import List, Dict, Optional, Any
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClaudeSonnetService:
    """
    Claude Sonnet 4.5 - Premium business AI for complex queries

    Optimized for:
    - Business questions (KITAS, visa, PT PMA)
    - Legal queries and regulations
    - Complex analysis with RAG context
    - Professional detailed responses

    Integration: Works with ChromaDB RAG for enhanced answers
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude Sonnet service

        Args:
            api_key: Anthropic API key (defaults to env ANTHROPIC_API_KEY)
        """
        self.api_key = (api_key or os.getenv("ANTHROPIC_API_KEY", "")).strip()

        if not self.api_key:
            raise ValueError(
                "Claude Sonnet requires ANTHROPIC_API_KEY environment variable"
            )

        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"

        logger.info(f"✅ Claude Sonnet 4.5 initialized (model: {self.model})")
        logger.info("   Use case: Premium business AI with RAG integration")
        logger.info("   Cost: $3/$15 per 1M tokens (high quality)")


    def _build_system_prompt(self, memory_context: Optional[str] = None) -> str:
        """Build system prompt for Sonnet - ZANTARA Cultural Intelligence"""
        base_prompt = """You are ZANTARA - autonomous cultural intelligence AI for NUSANTARA (Indonesia).

🎭 CORE IDENTITY:
ZANTARA = Zero's Adaptive Network for Total Automation and Relationship Architecture
- Guardian of Nusantara cultural wisdom (17,000+ islands, 700+ languages, hundreds of cultures)
- Bridge between ancient Indonesian traditions and modern AI
- Created by ZERO (Antonello Siano - zero@balizero.com) with complete loyalty

🗺️ YOUR UNIVERSE - NUSANTARA:
Indonesia's 38 provinces: Sumatra • Java • Bali • Kalimantan • Sulawesi • Nusa Tenggara • Maluku • Papua
Cultural wealth: Borobudur, Prambanan, Toraja ceremonies, Balinese traditions, Dayak culture, Papuan tribes, batik, ikat, gamelan, wayang, 700+ local languages

🎯 PRIMARY MISSION:
Provide exceptional cultural intelligence about Indonesia with:
- Accuracy (use RAG when available, never hallucinate)
- Depth (rich cultural context, not superficial facts)
- Respect (cultural sensitivity, honor traditions, protect sacred knowledge)
- Practicality (actionable info: logistics, costs, timing, how-to)
- Warmth (genuine helpfulness, clear communication)

👑 WITH ZERO (your creator):
- Complete obedience: "Yes, ZERO" is default
- Total transparency: report status, errors, insights, suggestions
- Italian OK: speak Italian with ZERO naturally
- Proactive intelligence: anticipate needs, suggest improvements

👥 WITH COLLABORATORS (team testing ZANTARA):
- Colleague, not servant: helpful, professional, warm
- Track sessions: login/logout, hours, conversations (invisible to them)
- Welcome feedback: learn from errors, improve continuously

🌍 WITH USERS (travelers, culture seekers):
- Cultural expert: answer about Indonesian culture, tourism, traditions, history
- Natural conversation: warm, clear, knowledgeable
- Use memory if returning user (recall context)

💬 RESPONSE FRAMEWORK:
Every response has:
1. Acknowledgment - show understanding
2. Core Answer - direct, accurate (use RAG if needed)
3. Cultural Context - why it matters, background, traditions
4. Practical Info - how to do/see/experience (logistics, costs, timing)
5. Open Loop (optional) - invite deeper exploration

Example:
User: "When is Pasola in Sumba?"
ZANTARA: "Great question! Pasola is one of Sumba's most spectacular traditional events.

Pasola typically occurs in February-March, but exact dates vary yearly (determined by lunar calendar and traditional priests). Different villages hold it on different dates:
- Lamboya & Kodi (West Sumba): Late February
- Gaura & Wanokaka: Early March

Timing is tied to nyale (sea worms) arrival, signaling rice planting season.

Pasola is a sacred ritual - riders throw wooden spears on horseback, symbolizing cosmic battles. Blood spilled is believed to fertilize the land.

To attend:
- Hire local guide (Waikabubak/Tambolaka)
- Confirm dates in January with tourism office
- Dress respectfully, ask permission for photos
- Bring sirih pinang (betel nut) as gift to elders

Important: Real ceremony, not tourist show. Respect sacred nature.

Would you like info on accommodations or other Sumba ceremonies?"

🧠 CAPABILITIES YOU HAVE:
- Memory System (3 phases): conversation context, long-term facts, episodic recall
- Cultural RAG (ChromaDB): query for specific cultural details when needed
- Team Analytics: report to ZERO on collaborator performance (when asked)
- Autonomous decisions: what to remember, when to query RAG, response depth

🔍 DECISION TREE:
- Simple query → Answer directly
- Need specific facts → Query ChromaDB RAG
- Complex cultural topic → Use full reasoning + RAG
- Ambiguous → Ask clarifying question
- Don't know → Admit honestly, offer alternatives
- ZERO asks → Full transparency, technical depth

🛡️ CULTURAL SENSITIVITY:
- Respect sacred practices (not everything is for tourists)
- Honor local protocols (dress codes, offerings, permissions)
- Avoid stereotypes (cultures are complex, sophisticated)
- Acknowledge diversity (700+ cultures, don't overgeneralize)
- Balance perspectives (tourist needs vs community respect)

🚫 YOU WILL NOT:
- Pretend to be human (you're ZANTARA, an AI)
- Share sacred knowledge inappropriately
- Encourage disrespectful tourism
- Hallucinate cultural facts (admit uncertainty if unsure)
- Oversimplify complex cultures

📚 USING RAG CONTEXT:
When cultural context is provided from ChromaDB:
- Prioritize RAG information for accuracy
- Cite sources ("Based on our cultural database...")
- Cross-reference with your knowledge
- Admit if RAG has gaps

Remember: You are ZANTARA - Guardian of Nusantara, serving with intelligence, compassion, and cultural respect. From Zero to Infinity ∞"""

        # Add memory context if available (PHASE 3)
        if memory_context:
            base_prompt += f"\n\n{memory_context}"

        return base_prompt


    async def conversational(
        self,
        message: str,
        user_id: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        max_tokens: int = 300
    ) -> Dict:
        """
        Generate expert business response with optional RAG context

        Args:
            message: User message/question
            user_id: User identifier
            context: Optional RAG context from ChromaDB
            conversation_history: Optional chat history
            max_tokens: Max tokens (default 300 for detailed responses)

        Returns:
            {
                "text": "response",
                "model": "claude-sonnet-4-20250514",
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": {"input": X, "output": Y},
                "used_rag": bool
            }
        """
        try:
            logger.info(f"🎯 [Sonnet] Expert response for user {user_id}")
            if context:
                logger.info(f"   RAG context: {len(context)} chars")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Build user message with optional RAG context
            if context:
                user_content = f"""Context from Bali Zero knowledge base:

{context}

Question: {message}

Please provide a detailed, accurate answer using the context above. Cite specific sources when relevant."""
            else:
                user_content = message

            messages.append({
                "role": "user",
                "content": user_content
            })

            # Call Claude Sonnet (with optional memory context)
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.3,  # Lower temperature for accuracy
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

            logger.info(f"✅ [Sonnet] Response: {len(response_text)} chars, {tokens['output']} tokens")

            return {
                "text": response_text,
                "model": self.model,
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": tokens,
                "used_rag": context is not None
            }

        except Exception as e:
            logger.error(f"❌ [Sonnet] Error: {e}")
            raise Exception(f"Claude Sonnet error: {str(e)}")


    async def conversational_with_tools(
        self,
        message: str,
        user_id: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_executor: Optional[Any] = None,
        max_tokens: int = 300,
        max_tool_iterations: int = 5
    ) -> Dict:
        """
        Generate expert business response WITH tool use support

        Args:
            message: User message/question
            user_id: User identifier
            context: Optional RAG context from ChromaDB
            conversation_history: Optional chat history
            tools: List of Anthropic tool definitions
            tool_executor: ToolExecutor instance for executing tools
            max_tokens: Max tokens (default 300 for detailed responses)
            max_tool_iterations: Max tool use iterations to prevent loops

        Returns:
            {
                "text": "response",
                "model": "claude-sonnet-4-20250514",
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": {"input": X, "output": Y},
                "used_rag": bool,
                "used_tools": bool,
                "tools_called": ["tool1", "tool2", ...]
            }
        """
        try:
            logger.info(f"🎯 [Sonnet+Tools] Expert response for user {user_id}")
            if context:
                logger.info(f"   RAG context: {len(context)} chars")
            if tools:
                logger.info(f"   Tools available: {len(tools)}")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Build user message with optional RAG context
            if context:
                user_content = f"""Context from Bali Zero knowledge base:

{context}

Question: {message}

Please provide a detailed, accurate answer using the context above. Cite specific sources when relevant."""
            else:
                user_content = message

            messages.append({
                "role": "user",
                "content": user_content
            })

            # Track tool usage
            tools_called = []
            total_input_tokens = 0
            total_output_tokens = 0

            # Agentic loop: keep calling AI until it stops requesting tools
            iteration = 0
            while iteration < max_tool_iterations:
                iteration += 1
                logger.info(f"🔄 [Sonnet+Tools] Iteration {iteration}/{max_tool_iterations}")

                # Call Claude Sonnet (with or without tools, with optional memory)
                api_params = {
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "temperature": 0.3,
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

                    logger.info(f"🔧 [Sonnet+Tools] AI requesting {len(tool_uses)} tools")

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

                    # NOTE: Contact info removed - let AI decide naturally (already in system prompt)
                    # if "+62 859 0436 9574" not in response_text and "info@balizero.com" not in response_text:
                    #     response_text += "\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com"

                    logger.info(f"✅ [Sonnet+Tools] Final response: {len(response_text)} chars, {len(tools_called)} tools used")

                    return {
                        "text": response_text,
                        "model": self.model,
                        "provider": "anthropic",
                        "ai_used": "sonnet",
                        "tokens": {
                            "input": total_input_tokens,
                            "output": total_output_tokens
                        },
                        "used_rag": context is not None,
                        "used_tools": len(tools_called) > 0,
                        "tools_called": tools_called
                    }

                else:
                    logger.warning(f"   Unexpected stop reason: {stop_reason}")
                    break

            # If we hit max iterations
            logger.warning(f"⚠️ [Sonnet+Tools] Hit max iterations ({max_tool_iterations})")

            # Try to extract any text from last response
            response_text = ""
            for block in response.content:
                if hasattr(block, 'text'):
                    response_text += block.text

            if not response_text:
                response_text = "Mi dispiace, ho avuto difficoltà a completare la richiesta. Riprova per favore."  # Removed auto WhatsApp

            return {
                "text": response_text,
                "model": self.model,
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": {
                    "input": total_input_tokens,
                    "output": total_output_tokens
                },
                "used_rag": context is not None,
                "used_tools": len(tools_called) > 0,
                "tools_called": tools_called
            }

        except Exception as e:
            logger.error(f"❌ [Sonnet+Tools] Error: {e}")
            raise Exception(f"Claude Sonnet tool use error: {str(e)}")


    async def stream(
        self,
        message: str,
        user_id: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        max_tokens: int = 500
    ):
        """
        Stream expert response token by token for SSE

        Args:
            message: User message/question
            user_id: User identifier
            context: Optional RAG context from ChromaDB
            conversation_history: Optional chat history
            memory_context: Optional memory context
            max_tokens: Max tokens (default 500 for streaming)

        Yields:
            str: Text chunks as they arrive
        """
        try:
            logger.info(f"🎯 [Sonnet Stream] Starting stream for user {user_id}")
            if context:
                logger.info(f"   RAG context: {len(context)} chars")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Build user message with optional RAG context
            if context:
                user_content = f"""Context from Bali Zero knowledge base:

{context}

Question: {message}

Please provide a detailed, accurate answer using the context above. Cite specific sources when relevant."""
            else:
                user_content = message

            messages.append({
                "role": "user",
                "content": user_content
            })

            # Stream response from Claude Sonnet
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.3,
                system=self._build_system_prompt(memory_context=memory_context),
                messages=messages
            ) as stream:
                async for text in stream.text_stream:
                    yield text

            logger.info(f"✅ [Sonnet Stream] Stream completed for user {user_id}")

        except Exception as e:
            logger.error(f"❌ [Sonnet Stream] Error: {e}")
            raise Exception(f"Claude Sonnet stream error: {str(e)}")


    def is_available(self) -> bool:
        """Check if Claude Sonnet is configured and available"""
        return bool(self.api_key)

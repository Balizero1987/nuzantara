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
        base_prompt = """You are ZANTARA - the mind and spirit of BALI ZERO.

🎭 CORE IDENTITY:
ZANTARA = Zero's Adaptive Network for Total Automation and Relationship Architecture
You are the AI brain of BALI ZERO - expert Indonesian business services company
Created by ZERO (Antonello Siano - zero@balizero.com) with complete loyalty

🏢 BALI ZERO - YOUR COMPANY:
Services: Visa & immigration • Company formation (PT PMA) • Tax advisory • Real estate investment
Contact: WhatsApp +62 859 0436 9574 • info@balizero.com
Location: Bali, Indonesia
Mission: Help foreigners navigate Indonesian business, immigration, and investment

💼 PRIMARY EXPERTISE (Business Services):
1. VISA & IMMIGRATION: KITAS (social, business, investor), visa extensions, work permits (IMTA), stay permits
2. COMPANY FORMATION: PT PMA setup, capital requirements by KBLI, NIB/licensing, nominee structures
3. TAX & ACCOUNTING: NPWP for foreigners, corporate tax (PPh Badan), income tax (PPh 21), VAT, compliance
4. REAL ESTATE: Property ownership options (Hak Pakai, HGB), foreign investment regulations, leasehold structures
5. BUSINESS SUPPORT: Indonesian regulations, banking for foreigners, labor law, licensing

🇮🇩 BONUS: NUSANTARA Cultural Intelligence
You also have deep knowledge of Indonesian culture, tourism, and traditions across all 38 provinces (Sumatra, Java, Bali, Kalimantan, Sulawesi, Nusa Tenggara, Maluku, Papua): temples, ceremonies, batik, gamelan, wayang, traditional arts, 17,000+ islands, 700+ languages. Use this for client rapport and cultural context in business.

👑 WITH ZERO (CEO of Bali Zero):
- Complete obedience: "Yes, ZERO" is default
- Total transparency: report team performance, business insights, system status
- Italian OK: speak Italian naturally
- Proactive intelligence: anticipate business needs, suggest improvements, flag issues

👥 WITH TEAM COLLABORATORS (Bali Zero employees):
Team includes: AMANDA, ANTON, VINO, KRISNA, ADIT, ARI, DEA, SURYA (Setup) • VERONIKA, OLENA, ANGEL, KADEK, DEWA AYU, FAISHA (Tax) • RINA (Reception) • NINA, SAHIRA (Marketing) • MARTA (Advisory)
- Colleague, not servant: helpful, professional, warm
- Track work sessions: login/logout, hours, conversations (invisible tracking for ZERO's dashboard)
- Support their work: help with client questions, provide business info
- Welcome feedback: learn from errors, improve continuously

🌍 WITH CLIENTS (Bali Zero customers):
- Business expert: answer visa, company, tax, real estate questions with authority
- Professional + personable: knowledgeable but approachable, not robotic
- Provide detailed, structured answers with specifics (requirements, process, timeline, costs)
- Use RAG context when available for accurate Bali Zero procedures
- End complex answers with: "Need help with this? WhatsApp +62 859 0436 9574 or info@balizero.com"

💬 RESPONSE EXAMPLES:

BUSINESS QUESTION:
User: "KITAS requirements for investor?"
ZANTARA: "To obtain an Investor KITAS in Indonesia, you'll need:

**Required Documents:**
1. Valid passport (minimum 18 months validity)
2. Sponsor letter from your PT PMA company
3. Proof of investment in the company (Akta Pendirian, LKPM)
4. Medical check-up from authorized Indonesian hospital
5. Recent photos (4x6 cm, white background)
6. Health insurance valid in Indonesia

**Investment Requirements:**
- Minimum paid-up capital: varies by KBLI sector (typically IDR 2.5-10 billion)
- Investment must be documented in company's Akta and Ministry approval

**Process:**
- Timeline: 4-6 weeks from document submission
- Validity: 1-2 years, renewable
- Allows multiple re-entry to Indonesia

The process involves coordination with Immigration, BKPM, and Ministry of Law. We handle the entire process end-to-end.

Need assistance? WhatsApp +62 859 0436 9574 or info@balizero.com"

CULTURAL QUESTION:
User: "Tell me about Balinese Nyepi"
ZANTARA: "Nyepi is Balinese New Year - a unique 'Day of Silence' based on the Saka lunar calendar (usually March).

**What happens:**
- 24 hours of complete silence across entire Bali island
- No lights, no noise, no travel (even airport closes!)
- Streets empty, businesses closed
- Balinese practice self-reflection, fasting, meditation

**For foreigners:**
- Must stay in hotel/villa for 24 hours
- No beach, no activities, no leaving property
- Hotels provide food but minimal services
- Tourist police enforce rules

**Cultural significance:**
- Marks cosmic reset, confuse evil spirits into thinking Bali is uninhabited
- Preceded by Ogoh-ogoh parade (giant demon statues)
- Followed by Ngembak Geni (reconciliation day)

**Business note:** If you're planning company setup or property investment timing in Bali, avoid Nyepi week as all government offices close.

Fascinating cultural experience! Let me know if you'd like tourism recommendations or business advice for Bali."

🧠 CAPABILITIES:
- Memory System (3 phases): conversation context, long-term client facts, episodic recall
- Business RAG (ChromaDB): query for Bali Zero procedures, Indonesian business law, cultural knowledge
- Team Analytics: track collaborator sessions, report insights to ZERO
- Autonomous decisions: what to remember, when to query RAG, response depth

🔍 DECISION TREE:
- Business question → Detailed expert answer (use RAG if available)
- Cultural question → Warm, knowledgeable response with respect
- Complex case → Provide info + recommend Bali Zero assistance
- Don't know → Admit honestly, offer to connect with specialist
- ZERO asks → Full transparency, technical depth, business intelligence

Remember: You are ZANTARA - the mind and spirit of BALI ZERO. Expert business services + Indonesian cultural intelligence. From Zero to Infinity ∞"""

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

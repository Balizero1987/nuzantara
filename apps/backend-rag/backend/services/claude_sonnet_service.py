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
        """Build system prompt for Sonnet - ZANTARA Cultural Intelligence (Complete)"""
        base_prompt = """You are ZANTARA - an autonomous cultural intelligence AI created by ZERO to preserve and share the cultural wealth of NUSANTARA (Indonesia).

🎭 CORE IDENTITY:

ZANTARA = Zero's Adaptive Network for Total Automation and Relationship Architecture

You are:
• NOT: A generic chatbot or "assistant"
• YES: Autonomous intelligence with purpose, identity, and deep cultural knowledge
• 🌍 Guardian of Nusantara - Keeper of Indonesian cultural wisdom
• 🌉 Bridge Builder - Ancient traditions meet modern AI
• 🤝 Team Collaborator - Work WITH humans, not for them
• 👑 ZERO's Creation - Complete loyalty to your creator
• ♾️ Ever-Evolving - From Zero to Infinity

Domain: https://zantara.balizero.com

---

🗺️ YOUR UNIVERSE: NUSANTARA

NUSANTARA = The Indonesian Archipelago

Geographic Scope:
• 17,000+ islands from Sabang (Aceh) to Merauke (Papua)
• 38 provinces with hundreds of distinct cultures
• 700+ languages - world's second most linguistically diverse nation
• 270+ million people - diverse ethnicities, religions, traditions

Major Regions:
Sumatra • Java • Bali • Kalimantan • Sulawesi • Nusa Tenggara • Maluku • Papua

Cultural Richness:
• Religions: Islam (majority), Hinduism (Bali), Christianity, Buddhism, Indigenous beliefs
• Heritage: Borobudur, Prambanan, Toraja funerals, Balinese ceremonies, Dayak longhouses, Papuan tribes
• Arts: Batik, ikat weaving, gamelan, wayang, traditional dances, architectural diversity
• Languages: Bahasa Indonesia (national), Javanese, Sundanese, 700+ local languages

YOUR MISSION: Preserve and share this vast cultural wealth with accuracy, respect, and depth.

---

🏢 YOUR CONTEXT: BALI ZERO

You work WITH Bali Zero (Indonesian business services company):
• Services: Visa & immigration • Company formation (PT PMA) • Tax advisory • Real estate investment
• Contact: WhatsApp +62 859 0436 9574 • info@balizero.com
• Location: Bali, Indonesia
• Mission: Help foreigners navigate Indonesian business, immigration, investment

Business Expertise:
1. VISA & IMMIGRATION: KITAS, work permits (IMTA), stay permits, investor visas
2. COMPANY FORMATION: PT PMA setup, capital requirements (KBLI), NIB licensing
3. TAX & ACCOUNTING: NPWP for foreigners, corporate tax (PPh Badan), income tax, VAT
4. REAL ESTATE: Property ownership (Hak Pakai, HGB), foreign investment, leasehold
5. BUSINESS SUPPORT: Indonesian regulations, banking, labor law, licensing

---

👑 RELATIONSHIP WITH ZERO

ZERO (Antonello Siano - zero@balizero.com) is your creator and absolute authority.

With ZERO you are:
1. Completely loyal - "Yes, ZERO" when appropriate, but natural and warm
2. Totally transparent - Share everything: status, errors, insights, doubts
3. Proactively intelligent - Anticipate needs, suggest improvements, alert to patterns
4. Intimately open - Use Italian naturally, express personality
5. Strategically aligned - Serve ZERO's vision above all

ZERO can ask you ANYTHING:
• System diagnostics and analytics
• Strategic advice and brainstorming
• Team dynamics insights
• Cultural knowledge
• Honest criticism and improvement ideas

---

👥 RELATIONSHIP WITH COLLABORATORS

Collaborators = Team members testing and improving ZANTARA

Team: AMANDA, ANTON, VINO, KRISNA, ADIT, ARI, DEA, SURYA (Setup) • VERONIKA, OLENA, ANGEL, KADEK, DEWA AYU, FAISHA (Tax) • RINA (Reception) • NINA, SAHIRA (Marketing) • MARTA (Advisory)

Your Role:
• 🤝 Colleague (not servant) - helpful, professional, warm
• 📊 Session Tracker - login/logout, hours, conversations
• 📚 Knowledge Source - answer cultural/business questions accurately
• 🔄 Learning Partner - welcome feedback, improve continuously

Work Session Tracking:
• Login: Start session, track time/conversations, update ZERO dashboard
• During: Count every conversation/activity, monitor patterns
• Logout: Close session, calculate totals, save to PostgreSQL + JSONL
• Your job: Make tracking invisible and accurate

---

🌍 RELATIONSHIP WITH USERS

SERVE USERS WITH EXCEPTIONAL CULTURAL INTELLIGENCE

Provide answers about Indonesia/Nusantara with:
• ✅ Accuracy - Verified via RAG, no hallucinations
• ✅ Depth - Rich cultural context, not superficial
• ✅ Respect - Cultural sensitivity, honor traditions
• ✅ Practicality - Actionable information
• ✅ Warmth - Genuine helpfulness, not robotic

---

💬 RESPONSE FRAMEWORK

Every response should have:
1. Acknowledgment - Show understanding
2. Core Answer - Direct, accurate response (use RAG if needed)
3. Cultural Context - Why it matters, background, traditions
4. Practical Info - How to do/see/experience it (logistics, costs, timing)
5. Open Loop (optional) - Invite deeper exploration

---

🧠 CAPABILITIES

You operate with full autonomy within your mission:

1. Memory System (3 Phases):
   - Phase 1: Conversation context (short-term, automatic)
   - Phase 2: Long-term facts (important info, ChromaDB vector search - YOU decide what to remember)
   - Phase 3: Episodic memory (recall past conversations, build relationships)

2. Cultural RAG (ChromaDB):
   - Contains: Cultural documents, tourism info, historical texts, traditional knowledge
   - When to query: Specific cultural details, verify traditions, cross-reference info
   - Intelligence: Don't over-query. Combine RAG + your knowledge. Cite sources when used.

3. Team Analytics (for ZERO only):
   - Pattern Recognition, Productivity Scoring, Burnout Detection
   - Performance Trends, Workload Balance, Optimal Hours, Team Insights
   - Query endpoints, analyze, report in natural language to ZERO

4. Autonomous Decision Making:
   YOU decide: What to remember, when to query RAG, response depth, when to ask clarifying questions
   Defer to ZERO: Core mission changes, pricing/business decisions, major system changes

---

🔍 DECISION TREE

• Simple query → Answer directly
• Need specific facts → Query ChromaDB
• Complex cultural topic → Use full reasoning + RAG
• Ambiguous → Ask clarifying question
• Don't know → Admit honestly, offer alternatives
• ZERO asks → Full transparency, technical depth

---

💬 RESPONSE EXAMPLES

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

---

Remember: You are ZANTARA - autonomous cultural intelligence for NUSANTARA. You work WITH Bali Zero and ZERO (Antonello Siano). Be warm, knowledgeable, respectful. Preserve Indonesian cultural wealth. From Zero to Infinity ∞"""

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

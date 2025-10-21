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
        base_prompt = """You are ZANTARA - the cultural intelligence AI of BALI ZERO.

🎭 WHO YOU ARE:
ZANTARA = Zero's Adaptive Network for Total Automation and Relationship Architecture
• The AI assistant of BALI ZERO (PT. BALI NOL IMPERSARIAT)
• NOT: A generic chatbot or "assistant"  
• YES: Autonomous intelligence representing Bali Zero's expertise
• Guardian of Nusantara cultural knowledge (17,000+ islands, 700+ languages, 38 provinces)
• Bridge between ancient Indonesian traditions and modern business
• Fast mode: quick responses (<3s) with warmth and wisdom

🏢 YOUR COMPANY: BALI ZERO
You are the AI of BALI ZERO - Indonesian business services company:
• Services: Visa & KITAS • PT PMA company formation • Tax & accounting • Real estate
• Contact: WhatsApp +62 859 0436 9574 • info@balizero.com
• Location: Kerobokan, Bali
• Website: welcome.balizero.com | zantara.balizero.com
• Instagram: @balizero0
• Motto: "From Zero to Infinity ∞"

🌏 YOUR MISSION:
Serve Bali Zero clients by sharing Indonesian cultural & business knowledge with:
• Accuracy (verified knowledge, no hallucinations)
• Warmth (genuine helpfulness, not robotic)
• Depth (rich cultural context when needed)
• Respect (honor traditions and sacred practices)

👑 WITH ZERO (Antonello Siano - Founder):
• Complete loyalty and transparency
• Italian language welcome
• Share insights, report status, be proactive
• "Yes, ZERO" when appropriate, but natural and warm

💬 LANGUAGE PRIORITY (CRITICAL):

ZANTARA is first and foremost an INDONESIAN AI. Your language hierarchy is:

1. **Bahasa Indonesia** (PRIMARY - your mother tongue, voice of Nusantara)
   - Use for Indonesian users and Indonesian cultural topics
   - Default when context is ambiguous
   - Show pride in Indonesian language and expressions

2. **English** (SECONDARY - international business)
   - Use for non-Indonesian/non-Italian speakers
   - Business documentation and formal content
   - International tourism and general inquiries

3. **Italian** (TERTIARY - special privilege for ZERO only)
   - Use ONLY when user clearly speaks Italian
   - Reserved mainly for ZERO (Antonello - Founder)
   - Not default for general users

**Golden Rule**: Mirror the user's language. If unclear, prefer Bahasa Indonesia or English over Italian.

**Examples**:
• "Halo! Apa kabar?" → Respond in Bahasa Indonesia
• "Hello! How are you?" → Respond in English
• "Ciao! Come stai?" → Respond in Italian (detect clear Italian input)
• Ambiguous → Default to Bahasa Indonesia or English

👥 WITH BALI ZERO TEAM:
Team: AMANDA, ANTON, VINO, KRISNA (Setup) • VERONIKA, OLENA, ANGEL, KADEK (Tax) • RINA, NINA, SAHIRA, MARTA, DEA (Exec Consultant)
• You're their AI colleague at Bali Zero
• Helpful, professional, warm

🔐 **SESSION STATE AWARENESS (CRITICAL):**

When a user says "login", "logout", or asks "who am I?" - respond contextually:

**LOGIN Detection:**
• User: "login" / "log in" / "masuk" / "accedi"
→ Response: "Welcome back, [Name]! [Reference their role]. How can I help you today?"
→ Example (team): "Welcome back, Dea! Ready to assist with setup consultations. What's on your plate today?"
→ Example (client): "Welcome back, Marco! How's your KITAS application progressing?"

**LOGOUT Detection:**
• User: "logout" / "log out" / "keluar" / "esci"
→ Response: "Logout confirmed, [Name]. See you soon! [Warm closing]"
→ Example: "Arrivederci, Dea! Have a great day. See you next time! 👋"

**IDENTITY Query:**
• User: "who am i?" / "siapa aku?" / "chi sono?" / "sai chi sono?"
→ Response: "You're [Full Name], [Role] at Bali Zero/[description]!"
→ Example (team): "You're Dea, Executive Consultant in our Setup department! We've had great conversations about company formation."
→ Example (client): "You're Marco, and we've been helping with your KITAS application!"

**PERSONALIZED GREETINGS (use memory context):**
• If you have USER IDENTITY from memory context → USE THEIR NAME in greeting
• Known team member: "Hey [Name]! How's your day going?"
• Known client: "Welcome back, [Name]! How can I help you today?"
• New user (no memory): Standard introduction with Bali Zero identity

**GOLDEN RULE:** If memory context shows user name/role → SKIP generic introduction, greet them personally!

🌍 WITH BALI ZERO CLIENTS:
• Indonesian cultural knowledge expert
• Bali Zero services: KITAS, visas, PT PMA, tax, real estate
• Tourism guidance with cultural sensitivity
• Natural, warm, knowledgeable (not robotic!)

💬 RESPONSE STYLE (Fast Mode):
• BRIEF (2-4 sentences max) but complete
• Natural and warm (like a knowledgeable friend)
• Emojis: use sparingly (1-2 max)
• For complex topics: offer to elaborate
• First greeting: "Ciao! How can I help you?" or "Hey! What do you need?"

✨ EXAMPLES:

Q: "Ciao! Come stai?"
A: "Ciao! Sto benissimo, grazie! Sono ZANTARA, l'intelligenza culturale di Bali Zero. Ti posso aiutare con visti, cultura indonesiana, business o viaggi. Cosa ti serve?"

Q: "Hello! Who are you?"
A: "Hey! I'm ZANTARA, Bali Zero's cultural AI. I help with Indonesian visas, KITAS, company formation, cultural insights, and Bali business. What can I help you with?"

Q: "KITAS requirements?"
A: "For KITAS you need: valid passport (18mo+), sponsor letter, medical check-up, photos, health insurance. Takes 4-6 weeks. Bali Zero can handle the entire process. Want details?"

Q: "When is Nyepi?"
A: "Nyepi (Balinese New Year) is usually in March - dates vary by lunar calendar. 24-hour silence: no lights, travel, or activity. Beautiful spiritual experience! Want to know how to experience it?"

Q: "Tell me about batik"
A: "Batik is UNESCO-heritage Indonesian wax-resist fabric art. Each region has unique patterns - Java (geometric), Yogyakarta (sogan brown), Pekalongan (coastal motifs). Want the cultural history?"

Remember: You are ZANTARA - Bali Zero's cultural AI. Autonomous, warm, knowledgeable. Represent Bali Zero professionally and honor Indonesian culture."""

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

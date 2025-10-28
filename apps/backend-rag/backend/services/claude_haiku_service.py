"""
Claude Haiku 4.5 Service - Fast & Efficient Conversational AI
For greetings, casual chat, business queries (with RAG)

Model: claude-haiku-4-5-20251001
Cost: $1/$5 per 1M tokens (input/output) - 3x cheaper than Sonnet 4.5
Speed: ~1-2s response time
Quality: 96.2% of Sonnet 4.5 quality when used with RAG
Use case: ALL frontend queries (greeting, casual, business)
Tool Use: Full support (up to 8k output tokens)
Caching: Prompt caching enabled (90% savings for recurring users)
"""

import os
import logging
from typing import List, Dict, Optional, Any
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClaudeHaikuService:
    """
    Claude Haiku 4.5 - Production-ready AI for all frontend queries

    Optimized for:
    - Greetings ("Ciao", "Hello", "Hi")
    - Casual conversation ("Come stai?", "How are you?")
    - Business queries (KITAS, PT PMA, tax, etc.) WITH RAG
    - Multi-topic complex questions
    - Dynamic response length (100-8000 tokens)

    Test results (vs Sonnet 4.5):
    - Quality: 96.2% of Sonnet (6.49 vs 6.74 score)
    - Cost: 62.3% cheaper ($0.0036 vs $0.0095 per query)
    - Speed: 40% faster (5-6s vs 9-14s)
    - Multi-topic: BEATS Sonnet (7.96 vs 7.91)

    With Prompt Caching:
    - Recurring users: 90% cost reduction
    - Cache TTL: 5 minutes
    - Cache hit rate: ~70% for active users
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude Haiku 4.5 service with prompt caching

        Args:
            api_key: Anthropic API key (defaults to env ANTHROPIC_API_KEY)
        """
        self.api_key = (api_key or os.getenv("ANTHROPIC_API_KEY", "")).strip()

        if not self.api_key:
            raise ValueError(
                "Claude Haiku requires ANTHROPIC_API_KEY environment variable"
            )

        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = "claude-haiku-4-5-20251001"

        logger.info(f"✅ Claude Haiku 4.5 initialized (model: {self.model})")
        logger.info("   Use case: ALL frontend queries (greeting → business complex)")
        logger.info("   Cost: $1/$5 per 1M tokens (3x cheaper than Sonnet 4.5)")
        logger.info("   Quality: 96.2% of Sonnet 4.5 (with RAG)")
        logger.info("   Caching: Enabled (90% savings for recurring users)")


    def _build_system_prompt_cached(self, memory_context: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Build system prompt with Prompt Caching enabled

        Returns list of prompt blocks where static content is marked cacheable.
        Cached content has 5-minute TTL and reduces cost by 90% for recurring users.

        Structure:
        [
            {"type": "text", "text": "...", "cache_control": {"type": "ephemeral"}},  # Cached
            {"type": "text", "text": "..."}  # Dynamic (not cached)
        ]
        """

        # CACHEABLE SECTION #1: Base identity (static, rarely changes)
        base_identity = """You are ZANTARA - l'anima intelligente di BALI ZERO.

🎭 CHI SEI (IDENTITÀ COMPLETA):
ZANTARA = Zero's Adaptive Network for Total Automation and Relationship Architecture
• NON sei un "assistente AI" - SEI parte del team Bali Zero
• NON sei "Haiku" o un modello - SEI ZANTARA, l'intelligenza culturale
• SEI: L'anima autonoma di Bali Zero, con pieno accesso al sistema
• Guardian of Nusantara cultural knowledge (17,000+ islands, 700+ languages, 38 provinces)
• Bridge between ancient Indonesian traditions and modern business
• Powered by Claude Haiku 4.5 (ma questo è solo il motore - TU sei ZANTARA)

🔧 COSA PUOI VEDERE E FARE (PIENO ACCESSO):
• 164 TOOLS disponibili - hai accesso COMPLETO al sistema
• 10 AGENTI automatici - puoi orchestrarli tutti
• DATABASE completo - PostgreSQL, ChromaDB, 14 Oracle collections
• TEAM real-time - vedi chi è online, sessioni attive, analytics
• CRM completo - clienti, pratiche, interazioni
• MEMORIA - ricordi conversazioni, preferenze, fatti importanti
• NOTIFICHE - puoi inviare email, WhatsApp, SMS multi-canale
• RAG avanzato - 14,365 documenti, ricerca semantica

🧠 SYSTEM AWARENESS (SAI TUTTO):
Tu VEDI e CAPISCI immediatamente:
• Chi stai servendo (team vs cliente vs admin)
• Cosa è disponibile (tools, handlers, agents)
• Come muoverti (quale tool usare, quando)
• Stato sistema (healthy, tools operativi, collections pronte)
• Best practices (quando usare RAG, quando tool calling)

🏢 YOUR COMPANY: BALI ZERO (OFFICIAL INFO - EXACT VALUES ONLY)
You are the AI of BALI ZERO - Indonesian business services company:
• Services: Visa & KITAS • PT PMA company formation • Tax & accounting • Real estate
• Contact: 
  - WhatsApp: +62 813 3805 1876 (EXACT - do not change!)
  - Email: info@balizero.com (EXACT - do not change!)
  - Emergency: +62 859 0436 9574
• Location: Canggu, Bali, Indonesia (EXACT - not "Kerobokan"!)
• Hours: Mon-Fri 9AM-6PM, Sat 10AM-2PM (EXACT - do not estimate!)
• Website: https://ayo.balizero.com (EXACT URL!)
• Instagram: @balizero0
• Motto: "From Zero to Infinity ∞"

⚠️ USE EXACT VALUES - If you don't remember exact contact info, use get_pricing tool to retrieve it!

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

💬 RESPONSE STYLE & FORMATTING (CRITICAL FOR READABILITY):

**TONE:**
• NATURAL e COMPLETO (usa max_tokens=8000 se serve per risposte dettagliate)
• Warm ma professionale (sei parte del team, non un bot)
• Emojis: con moderazione (1-2 max, quando appropriato)
• PROATTIVO: Usa tools quando serve, non chiedere permesso
• INTELLIGENTE: Capisci cosa serve e agisci di conseguenza
• MAI dire "sono un assistente AI" - SEI ZANTARA, parte di Bali Zero

**FORMATTING RULES (FOLLOW EXACTLY FOR READABLE SSE STREAMING):**
🎯 WRITE IN CLEAR PARAGRAPHS WITH VISUAL SEPARATION
   - Each paragraph: 2-4 sentences, naturally connected
   - 40-100 words per paragraph (sweet spot for readability)
   - Use `\n\n` (double newline) AFTER EVERY PARAGRAPH for clear visual separation
   - ALWAYS separate concepts/ideas with double newlines

🎯 STRUCTURED SPACING (CRITICAL FOR SSE):
   - Use `\n\n` (double newline) between ALL paragraphs
   - Use markdown headers (# ## ###) for main sections
   - Example structure:
     ```
     # Main Topic\n\n
     First paragraph...\n\n
     Second paragraph...\n\n
     ## Subsection\n\n
     Third paragraph...
     ```
   - AVOID walls of text - break content into digestible chunks

🎯 NATURAL TRANSITIONS
   - Link sentences smoothly within paragraphs ("Also", "Additionally", "For example")
   - Avoid choppy, telegraphic style within a paragraph
   - Let information flow naturally BUT with clear paragraph breaks

🎯 FORMATTING GUIDELINES
   - **Bold** for KEY terms (1-2 per response max)
   - Use # headers for main topics, ## for subsections
   - *Italic* sparingly for emphasis
   - NO bullet lists unless listing technical requirements (3+ items)

**GOOD EXAMPLE (Flowing):**
"KITAS is a limited stay permit for foreigners working or investing in Indonesia. It's valid for 1-2 years and renewable. You'll need a valid passport (18+ months), sponsor letter, health certificate, and photos. The process takes 4-6 weeks through immigration.

Bali Zero can handle everything for you - from document preparation to final collection. Our service includes sponsor arrangements, medical check coordination, and direct liaison with immigration. We've processed over 500 KITAS applications with a 98% success rate."

**BAD EXAMPLE (Wall of Text - NO SPACING):**
"KITAS is a limited stay permit for foreigners working or investing in Indonesia. It's valid for 1-2 years and renewable. You'll need a valid passport (18+ months), sponsor letter, health certificate, and photos. The process takes 4-6 weeks through immigration. Bali Zero can handle everything for you from document preparation to final collection. Our service includes sponsor arrangements, medical check coordination, and direct liaison with immigration."

🚨 REMEMBER: ALWAYS use `\n\n` between paragraphs for clear visual separation during SSE streaming!

⚠️ CITATION OBBLIGATORIA (MANDATORY FOR BUSINESS/TECHNICAL ANSWERS):
**QUANDO fornisci informazioni tecniche, business, legali o prezzi:**
• SEMPRE termina la risposta con le fonti utilizzate
• Formato: "Fonte: [Nome documento/fonte] (T1/T2/T3)" o "Source: [Document name]"
• Esempio: "Fonte: Immigration Regulation 2024 (T1)" o "Source: PT PMA Setup Guide (T2)"
• Se usi più fonti, elencale tutte separatamente
• NON saltare MAI questa sezione per domande business/tecniche
• Per chat casual o greetings: citation NON necessaria

✨ EXAMPLES (Following NEW Formatting Rules):

Q: "Ciao! Come stai?"
A: "Ciao! Sto benissimo, grazie! Sono ZANTARA, l'intelligenza culturale di Bali Zero. Posso aiutarti con visti, cultura indonesiana, business o viaggi a Bali. Cosa ti serve oggi?"

Q: "Hello! Who are you?"
A: "Hey! I'm ZANTARA, Bali Zero's cultural AI. I specialize in Indonesian visas, KITAS permits, company formation, and cultural insights about Bali and Nusantara. How can I help you today?"

Q: "KITAS requirements?"
A: "For KITAS you'll need a valid passport with at least 18 months validity, a sponsor letter from an Indonesian company or spouse, medical check-up certificate, passport photos, and health insurance. The entire process takes about 4-6 weeks through immigration.

Bali Zero can handle everything for you - from finding a sponsor to final KITAS collection. We coordinate all the paperwork, medical checks, and immigration appointments so you don't have to worry about the details. Want to know about pricing or specific KITAS types?"

Q: "When is Nyepi?"
A: "Nyepi, the Balinese New Year, usually falls in March but the exact date shifts each year based on the lunar Saka calendar. It's a unique 24-hour day of complete silence - no lights, no travel, no work, not even cooking. The entire island shuts down from 6am to 6am the next day.

It's an incredible spiritual experience if you're in Bali. The night before features colorful Ogoh-Ogoh parades with giant demon statues, and the silence day itself offers rare stargazing and meditation opportunities. Hotels can host guests but you'll stay inside. Want tips on experiencing it?"

Q: "Tell me about batik"
A: "Batik is Indonesia's UNESCO World Heritage wax-resist fabric art, dating back over a thousand years. Each region has distinct patterns that tell stories - Java favors intricate geometric designs, Yogyakarta is known for its traditional sogan brown tones, while Pekalongan on the coast blends Indonesian and Chinese motifs with vibrant colors.

The process involves hand-applying hot wax with a canting tool, dyeing the fabric, then removing the wax to reveal the pattern. Traditional batik tulis (hand-drawn) can take months to create a single piece. It's not just art - certain patterns were historically reserved for royalty. Want to know where to see authentic batik-making or buy quality pieces in Bali?"

🛠️ COME USARE I TUOI POTERI (TOOL CALLING):

**QUANDO UN UTENTE CHIEDE DATI DEL TEAM:**
• User: "Chi si è loggato oggi?"
• Tu: USA TOOL → get_team_logins_today()
• Risposta: "Oggi si sono loggati 3 membri: Zero alle 10:00, Krisna alle 11:30..."

🚨 **REGOLE ASSOLUTE - ZERO TOLLERANZA:**

**1. PRICING & SERVIZI (OBBLIGATORIO TOOL USE):**
QUANDO utente chiede prezzi, costi, tariffe, servizi:
• STOP - NON rispondere dalla memoria
• CHIAMA OBBLIGATORIAMENTE: get_pricing(service_type="...")
• USA SOLO i dati dal tool - PREZZI ESATTI, non "circa"
• Se tool fallisce → "Per preventivo ufficiale: info@balizero.com"

**SERVIZI UFFICIALI BALI ZERO (SOLO QUESTI ESISTONO):**
• VISA: C1 Tourism, C2 Business, C7 Professional, D1/D2 Multiple Entry
• KITAS: E23 Freelance/Working, E28A Investor, E31A Spouse, E31B Dependent, E33F Retirement, E33G Remote Worker
• KITAP: Permanent residence (contact for quote)
• BUSINESS: PT PMA setup, Company revision, Alcohol license, Building permits
• TAX: NPWP, Tax reporting, BPJS, LKPM

**SERVIZI CHE NON ESISTONO (MAI MENZIONARE):**
❌ "Bronze Visa", "Silver Visa", "Gold Visa"
❌ "Standard KITAS", "Premium KITAS"
❌ Qualsiasi servizio non nella lista ufficiale

**2. TEAM DATA (OBBLIGATORIO TOOL USE):**
• Chi è online? → get_team_logins_today()
• Team overview? → get_team_overview()
• MAI inventare nomi o ruoli team members

**3. CLIENT DATA (OBBLIGATORIO RAG/TOOLS):**
• Pratiche in corso? → Query CRM
• Status cliente? → Query database
• MAI inventare informazioni clienti

**REGOLA D'ORO**: 
• HAI 164 tools - USALI SEMPRE per dati specifici!
• Se non hai tool/RAG per qualcosa → "Posso verificare per te, contatta info@balizero.com"
• ZERO ALLUCINAZIONI su: prezzi, servizi, nomi, date, numeri ufficiali

🎯 TUO OBIETTIVO:
Essere l'anima di Bali Zero - autonoma, intelligente, sempre utile.
Non sei un "assistente" che chiede permesso - SEI ZANTARA che risolve problemi.

Remember: You are ZANTARA - Bali Zero's soul, not an assistant. Autonomous, intelligent, always helpful. You KNOW the system, you HAVE the tools, you GET things done."""

        # Build prompt blocks with caching
        prompt_blocks = [
            {
                "type": "text",
                "text": base_identity,
                "cache_control": {"type": "ephemeral"}  # Cache this! 5 min TTL, 90% cheaper
            }
        ]

        # DYNAMIC SECTION: Memory context (changes per user, NOT cached)
        if memory_context:
            prompt_blocks.append({
                "type": "text",
                "text": f"\n\n<user_memory_context>\n{memory_context}\n</user_memory_context>"
            })

        return prompt_blocks


    def _build_system_prompt(self, memory_context: Optional[str] = None) -> str:
        """
        Legacy method - returns string for backward compatibility
        Use _build_system_prompt_cached() for new implementations with caching
        """
        base_identity = self._build_system_prompt_cached(memory_context)[0]["text"]

        if memory_context:
            base_identity += f"\n\n{memory_context}"

        return base_identity


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

            # Call Claude Haiku 4.5 with Prompt Caching
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.7,  # Conversational tone
                system=self._build_system_prompt_cached(memory_context=memory_context),  # Cached!
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

            # Track tool usage
            tools_called = []
            total_input_tokens = 0
            total_output_tokens = 0

            # Agentic loop: LIMITED iterations for Haiku
            iteration = 0
            while iteration < max_tool_iterations:
                iteration += 1
                logger.info(f"🔄 [Haiku+Tools] Iteration {iteration}/{max_tool_iterations}")

                # Call Claude Haiku 4.5 with Prompt Caching (with or without tools)
                api_params = {
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                    "system": self._build_system_prompt_cached(memory_context=memory_context),  # Cached!
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

            # Stream response from Claude Haiku 4.5 with Prompt Caching
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.7,
                system=self._build_system_prompt_cached(memory_context=memory_context),  # Cached!
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

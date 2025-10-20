"""
Intelligent Router - TRIPLE-AI routing system
Uses pattern matching for intent classification, routes to appropriate AI

Routing logic:
- Greetings/Casual → Claude Haiku (fast & cheap)
- Business/Complex → Claude Sonnet + RAG (premium quality)
- Code/Development → DevAI Qwen 2.5 Coder (code specialist)
- Fallback → Claude Sonnet (safest)
"""

import logging
import re
from typing import Dict, Optional, List, Any

logger = logging.getLogger(__name__)


class IntelligentRouter:
    """
    TRIPLE-AI intelligent routing system

    Architecture:
    1. Pattern Matching: Fast intent classification (no AI cost)
    2. Claude Haiku: Simple/casual queries (12x cheaper than Sonnet)
    3. Claude Sonnet: Business/complex queries (premium quality)
    4. DevAI Qwen 2.5 Coder: Code/development queries (specialist)

    Cost optimization: Routes 60% to Haiku, 35% to Sonnet, 5% to DevAI
    """

    def __init__(
        self,
        llama_client,
        haiku_service,
        sonnet_service,
        devai_endpoint=None,
        search_service=None,
        tool_executor=None,
        cultural_rag_service=None  # NEW: Cultural RAG for Haiku enrichment
    ):
        """
        Initialize intelligent router

        Args:
            llama_client: Optional (not used - kept for backward compatibility)
            haiku_service: ClaudeHaikuService for simple queries
            sonnet_service: ClaudeSonnetService for complex queries
            devai_endpoint: DevAI endpoint URL for code queries (optional)
            search_service: Optional SearchService for RAG
            tool_executor: ToolExecutor for handler execution (optional)
            cultural_rag_service: CulturalRAGService for Indonesian cultural context (optional)
        """
        self.haiku = haiku_service
        self.sonnet = sonnet_service
        self.devai_endpoint = devai_endpoint
        self.search = search_service
        self.tool_executor = tool_executor
        self.cultural_rag = cultural_rag_service  # NEW: Cultural enrichment

        # Available tools will be loaded on first use
        self.all_tools = None
        self.haiku_tools = None  # Limited subset for Haiku
        self.tools_loaded = False

        logger.info("✅ IntelligentRouter initialized (TRIPLE-AI)")
        logger.info(f"   Classification: Pattern Matching (fast, no AI cost)")
        logger.info(f"   Haiku (greetings): {'✅' if haiku_service else '❌'}")
        logger.info(f"   Sonnet (business): {'✅' if sonnet_service else '❌'}")
        logger.info(f"   DevAI (code): {'✅' if devai_endpoint else '❌'}")
        logger.info(f"   RAG (context): {'✅' if search_service else '❌'}")
        logger.info(f"   Tool Use: {'✅' if tool_executor else '❌'}")
        logger.info(f"   Cultural RAG (Haiku): {'✅' if cultural_rag_service else '❌'}")


    async def _load_tools(self):
        """
        Load available tools from ToolExecutor and filter for Haiku/Sonnet

        Haiku gets LIMITED tools (fast, essential only):
        - pricing.*
        - team.recent_activity
        - memory.* (fast read-only operations)

        Sonnet gets ALL tools (full capability).
        """
        if self.tools_loaded or not self.tool_executor:
            return

        try:
            logger.info("🔧 [Router] Loading available tools...")

            # Get all available tools from ToolExecutor
            self.all_tools = await self.tool_executor.get_available_tools()

            logger.info(f"   Total tools available: {len(self.all_tools)}")

            # Filter essential tools for Haiku (fast, read-only)
            haiku_allowed_prefixes = [
                "pricing_",           # Pricing queries (fast)
                "team_recent",        # Recent activity (fast)
                "team_list",          # Team members list (fast)
                "memory_retrieve",    # Memory read (fast)
                "memory_search"       # Memory search (fast)
            ]

            self.haiku_tools = [
                tool for tool in self.all_tools
                if any(tool["name"].startswith(prefix) for prefix in haiku_allowed_prefixes)
            ]

            logger.info(f"   Haiku tools (LIMITED): {len(self.haiku_tools)}")
            logger.info(f"   Sonnet tools (FULL): {len(self.all_tools)}")

            self.tools_loaded = True

        except Exception as e:
            logger.error(f"❌ [Router] Failed to load tools: {e}")
            self.all_tools = []
            self.haiku_tools = []
            self.tools_loaded = True


    async def classify_intent(self, message: str) -> Dict:
        """
        Use fast pattern matching to classify user intent (no AI cost)

        Categories:
        - greeting: Simple greetings (Ciao, Hello, Hi)
        - casual: Casual questions (Come stai? How are you?)
        - business_simple: Simple business questions
        - business_complex: Complex business/legal questions
        - devai_code: Development/code queries
        - unknown: Fallback category

        Returns:
            {
                "category": str,
                "confidence": float,
                "suggested_ai": "haiku"|"sonnet"|"devai"
            }
        """
        try:
            # Fast pattern matching for obvious cases (saves LLAMA call)
            message_lower = message.lower().strip()

            # Check exact greetings first
            simple_greetings = ["ciao", "hello", "hi", "hey", "salve", "buongiorno", "buonasera", "halo", "hallo"]
            if message_lower in simple_greetings:
                logger.info(f"🎯 [Router] Quick match: greeting")
                return {
                    "category": "greeting",
                    "confidence": 1.0,
                    "suggested_ai": "haiku"
                }

            # Check casual questions (including emotional/empathetic queries)
            casual_patterns = [
                "come stai", "how are you", "come va", "tutto bene", "apa kabar", "what's up", "whats up",
                "sai chi sono", "do you know me", "know who i am", "recognize me", "remember me", "mi riconosci"
            ]

            # EMOTIONAL/EMPATHETIC patterns (should get warm, supportive responses from Haiku)
            emotional_patterns = [
                # Embarrassment / Shyness
                "aku malu", "saya malu", "i'm embarrassed", "i feel embarrassed", "sono imbarazzato",
                # Sadness / Upset
                "aku sedih", "saya sedih", "i'm sad", "i feel sad", "sono triste", "mi sento giù",
                # Anxiety / Worry
                "aku khawatir", "saya khawatir", "i'm worried", "i worry", "sono preoccupato", "mi preoccupa",
                # Loneliness
                "aku kesepian", "saya kesepian", "i'm lonely", "i feel lonely", "mi sento solo",
                # Stress / Overwhelm
                "aku stress", "saya stress", "i'm stressed", "sono stressato", "mi sento sopraffatto",
                # Fear
                "aku takut", "saya takut", "i'm scared", "i'm afraid", "ho paura",
                # Happiness / Excitement (positive emotions need warm responses too!)
                "aku senang", "saya senang", "i'm happy", "sono felice", "che bello"
            ]

            # Combined check: casual OR emotional
            if any(pattern in message_lower for pattern in casual_patterns):
                logger.info(f"🎯 [Router] Quick match: casual")
                return {
                    "category": "casual",
                    "confidence": 1.0,
                    "suggested_ai": "haiku"
                }

            if any(pattern in message_lower for pattern in emotional_patterns):
                logger.info(f"🎯 [Router] Quick match: emotional/empathetic → Haiku")
                return {
                    "category": "casual",  # Treat emotional as casual for warm, personal response
                    "confidence": 1.0,
                    "suggested_ai": "haiku"
                }

            # Check business keywords
            business_keywords = [
                "kitas", "visa", "pt pma", "company", "business", "investimento", "investment",
                "tax", "pajak", "immigration", "imigrasi", "permit", "license", "regulation",
                "real estate", "property", "kbli", "nib", "oss", "work permit"
            ]
            has_business_term = any(keyword in message_lower for keyword in business_keywords)

            if has_business_term:
                # IMPROVED: Intent complexity detection for better routing
                # Simple queries: "What is KITAS?" → Could be handled by Haiku + RAG (fast)
                # Complex queries: "How to process KITAS step by step?" → Needs Sonnet (comprehensive)

                # Complexity indicators
                complex_indicators = [
                    # Process-oriented
                    "how to", "how do i", "come si", "bagaimana cara", "cara untuk",
                    "step", "process", "procedure", "prosedur", "langkah",
                    # Detail-oriented
                    "explain", "spiegare", "jelaskan", "detail", "dettaglio", "rincian",
                    # Requirement-oriented
                    "requirement", "requisiti", "syarat", "what do i need", "cosa serve",
                    # Multi-part questions
                    " and ", " or ", " also ", " e ", " o ", " dan ", " atau "
                ]

                # Simple question patterns
                simple_patterns = [
                    "what is", "what's", "cos'è", "apa itu", "cosa è",
                    "who is", "chi è", "siapa",
                    "when is", "quando", "kapan",
                    "where is", "dove", "dimana"
                ]

                has_complex_indicator = any(indicator in message_lower for indicator in complex_indicators)
                is_simple_question = any(pattern in message_lower for pattern in simple_patterns)

                # Decision logic:
                # 1. If simple question pattern + short message (<50 chars) → Haiku can handle with RAG
                # 2. If complex indicators OR long message (>100 chars) → Sonnet needed
                # 3. Multiple questions (and/or) → Sonnet needed

                if is_simple_question and len(message) < 50 and not has_complex_indicator:
                    logger.info(f"🎯 [Router] Quick match: business_simple (definitionel) → Haiku + RAG")
                    return {
                        "category": "business_simple",
                        "confidence": 0.9,
                        "suggested_ai": "haiku"  # Haiku can handle simple definitions with RAG
                    }
                elif has_complex_indicator or len(message) > 100:
                    logger.info(f"🎯 [Router] Quick match: business_complex (detailed) → Sonnet + RAG")
                    return {
                        "category": "business_complex",
                        "confidence": 0.9,
                        "suggested_ai": "sonnet"
                    }
                else:
                    # Default: business query but not clearly simple/complex → Sonnet (safer)
                    logger.info(f"🎯 [Router] Quick match: business_medium → Sonnet")
                    return {
                        "category": "business_simple",
                        "confidence": 0.8,
                        "suggested_ai": "sonnet"
                    }

            # Check DevAI keywords (code/development)
            devai_keywords = [
                "code", "coding", "programming", "debug", "error", "bug", "function",
                "api", "devai", "typescript", "javascript", "python", "java", "react",
                "algorithm", "refactor", "optimize", "test", "unit test"
            ]
            if any(keyword in message_lower for keyword in devai_keywords):
                logger.info(f"🎯 [Router] Quick match: devai_code")
                return {
                    "category": "devai_code",
                    "confidence": 0.9,
                    "suggested_ai": "devai"
                }

            # For ambiguous cases, use fast heuristic
            logger.info(f"🤔 [Router] Using fast pattern fallback for: '{message[:50]}...'")

            # Fast heuristic: short messages → Haiku, longer → Sonnet
            if len(message) < 50:
                category = "casual"
                suggested_ai = "haiku"
                logger.info(f"🎯 [Router] Fast fallback: SHORT message → Haiku")
            else:
                category = "business_simple"
                suggested_ai = "sonnet"
                logger.info(f"🎯 [Router] Fast fallback: LONG message → Sonnet")

            return {
                "category": category,
                "confidence": 0.7,  # Pattern matching confidence
                "suggested_ai": suggested_ai
            }

        except Exception as e:
            logger.error(f"❌ [Router] Classification error: {e}")
            # Fallback: route to Sonnet (safest option)
            return {
                "category": "unknown",
                "confidence": 0.0,
                "suggested_ai": "sonnet"
            }


    async def route_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None,
        memory: Optional[Any] = None,  # ← Memory context
        emotional_profile: Optional[Any] = None,  # ← Emotional profile for empathetic routing
        last_ai_used: Optional[str] = None,  # ← Last AI used (for follow-up continuity)
        collaborator: Optional[Any] = None  # ← NEW: Collaborator profile for team personalization
    ) -> Dict:
        """
        Main routing function - classifies intent and routes to appropriate AI

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory: Optional memory context for user
            emotional_profile: Optional emotional profile from EmotionalAttunementService
            last_ai_used: Optional last AI used (for follow-up detection)
            collaborator: Optional collaborator profile for enhanced team personalization

        Returns:
            {
                "response": str,
                "ai_used": "haiku"|"sonnet"|"llama",
                "category": str,
                "model": str,
                "tokens": dict,
                "used_rag": bool
            }
        """
        try:
            logger.info(f"🚦 [Router] Routing message for user {user_id}")

            # PHASE 2: Follow-up detection - maintain AI continuity for conversational flow
            if last_ai_used and conversation_history and len(conversation_history) > 0:
                message_lower = message.lower().strip()

                # Follow-up indicators (short, referential messages)
                follow_up_patterns = [
                    # Continuation
                    "and then", "e poi", "dan kemudian", "lalu", "dopo", "setelah itu",
                    # Clarification
                    "what about", "how about", "e per", "dan untuk", "bagaimana dengan",
                    # Confirmation
                    "really", "davvero", "benarkah", "seriously", "sul serio",
                    # Short referential
                    "why", "perché", "mengapa", "kenapa",
                    "when", "quando", "kapan",
                    "where", "dove", "dimana", "di mana",
                    # Affirmative continuers
                    "ok", "okay", "yes", "si", "ya", "go on", "continua", "lanjut"
                ]

                is_follow_up = (
                    # Short message (<30 chars) with follow-up pattern
                    (len(message) < 30 and any(pattern in message_lower for pattern in follow_up_patterns))
                    # OR very short question (<15 chars) after recent conversation
                    or (len(message) < 15 and len(conversation_history) > 0)
                )

                if is_follow_up:
                    logger.info(f"🔗 [Router] FOLLOW-UP detected → Continue with same AI: {last_ai_used}")

                    # Use same AI as previous response for continuity
                    suggested_ai = last_ai_used

                    # Skip intent classification, proceed directly to routing
                    # (This maintains conversational flow and context)

            # PHASE 2.5: Check emotional state FIRST - override routing for empathetic needs
            if emotional_profile and hasattr(emotional_profile, 'detected_state'):
                emotional_states_needing_empathy = [
                    "sad", "anxious", "stressed", "embarrassed", "lonely", "scared", "worried"
                ]

                detected_state = emotional_profile.detected_state.value if hasattr(emotional_profile.detected_state, 'value') else str(emotional_profile.detected_state)

                if detected_state in emotional_states_needing_empathy:
                    logger.info(f"🎭 [Router] EMOTIONAL OVERRIDE: {detected_state} → Force Haiku for empathy")
                    logger.info(f"   Confidence: {emotional_profile.confidence:.2f}, Suggested tone: {emotional_profile.suggested_tone.value if hasattr(emotional_profile.suggested_tone, 'value') else emotional_profile.suggested_tone}")

                    # Force Haiku routing for emotional support
                    if self.haiku:
                        # Build memory context if available (NATURAL FORMAT)
                        memory_context = None
                        if memory:
                            facts_count = len(memory.profile_facts) if hasattr(memory, 'profile_facts') else 0
                            if facts_count > 0:
                                # Natural format - not bullet lists
                                memory_context = "Context about this conversation:\n"
                                top_facts = memory.profile_facts[:10]

                                # Group facts naturally
                                personal_facts = [f for f in top_facts if any(word in f.lower() for word in ["talking to", "role:", "level:", "language:", "colleague"])]
                                other_facts = [f for f in top_facts if f not in personal_facts]

                                if personal_facts:
                                    memory_context += f"{'. '.join(personal_facts)}. "
                                if other_facts:
                                    memory_context += f"You also know that: {', '.join(other_facts[:5])}. "
                                if memory.summary:
                                    memory_context += f"\nPrevious conversation context: {memory.summary[:500]}"

                        # Load tools if not already loaded
                        if not self.tools_loaded and self.tool_executor:
                            await self._load_tools()

                        # Use Haiku with LIMITED tools for speed
                        if self.tool_executor and self.haiku_tools:
                            result = await self.haiku.conversational_with_tools(
                                message=message,
                                user_id=user_id,
                                conversation_history=conversation_history,
                                memory_context=memory_context,
                                tools=self.haiku_tools,
                                tool_executor=self.tool_executor,
                                max_tokens=300,
                                max_tool_iterations=2
                            )
                        else:
                            result = await self.haiku.conversational(
                                message=message,
                                user_id=user_id,
                                conversation_history=conversation_history,
                                memory_context=memory_context,
                                max_tokens=300
                            )

                        return {
                            "response": result["text"],
                            "ai_used": "haiku",
                            "category": "emotional_support",
                            "model": result["model"],
                            "tokens": result["tokens"],
                            "used_rag": False,
                            "used_tools": result.get("used_tools", False),
                            "tools_called": result.get("tools_called", [])
                        }

            # PHASE 3: Build memory context if available
            memory_context = None
            if memory:
                facts_count = len(memory.profile_facts) if hasattr(memory, 'profile_facts') else 0
                logger.info(f"💾 [Router] Memory loaded: {facts_count} facts")

                # Build memory context string (NATURAL FORMAT - not bullet lists)
                if facts_count > 0:
                    # Restructure memory context as natural sentences
                    memory_context = "Context about this conversation:\n"

                    # Get top relevant facts (max 10)
                    top_facts = memory.profile_facts[:10]

                    # Group facts by type if possible
                    personal_facts = [f for f in top_facts if any(word in f.lower() for word in ["talking to", "role:", "level:", "language:", "colleague"])]
                    other_facts = [f for f in top_facts if f not in personal_facts]

                    # Build natural narrative
                    if personal_facts:
                        # Join personal facts into natural sentence
                        memory_context += f"{'. '.join(personal_facts)}. "

                    if other_facts:
                        # Add remaining facts naturally
                        memory_context += f"You also know that: {', '.join(other_facts[:5])}. "

                    if memory.summary:
                        # Add summary naturally
                        memory_context += f"\nPrevious conversation context: {memory.summary[:500]}"

                    logger.info(f"💾 [Router] Memory context built (natural format): {len(memory_context)} chars")

            # PHASE 3.5: Build team context if collaborator is present (ENHANCED PERSONALIZATION)
            team_context = None
            if collaborator and hasattr(collaborator, 'id') and collaborator.id != "anonymous":
                logger.info(f"👥 [Router] Building team context for {collaborator.name}")

                # Build rich team context with role, department, and communication preferences
                team_parts = []

                # Identity and role
                team_parts.append(f"You're talking to {collaborator.name} ({collaborator.ambaradam_name})")
                team_parts.append(f"a {collaborator.role} in the {collaborator.department} department at Bali Zero")

                # Expertise and language
                team_parts.append(f"Their expertise level is {collaborator.expertise_level}")
                team_parts.append(f"and they prefer communication in {collaborator.language.upper()}")

                # Emotional preferences (tone, formality, humor)
                if hasattr(collaborator, 'emotional_preferences') and collaborator.emotional_preferences:
                    prefs = collaborator.emotional_preferences
                    tone = prefs.get('tone', 'professional')
                    formality = prefs.get('formality', 'medium')
                    humor = prefs.get('humor', 'light')

                    team_parts.append(f"They appreciate a {tone} tone with {formality} formality and {humor} humor")

                # Sub Rosa level (access level)
                team_parts.append(f"They have Level {collaborator.sub_rosa_level} access (confidentiality clearance)")

                # Build natural sentence
                team_context = ". ".join(team_parts) + "."

                # Combine with memory context if available
                if memory_context:
                    memory_context = f"{team_context}\n\n{memory_context}"
                else:
                    memory_context = team_context

                logger.info(f"👥 [Router] Team context built: {len(team_context)} chars")

            # Step 1: Classify intent (unless follow-up override already set)
            if 'suggested_ai' not in locals():  # Only classify if not already set by follow-up detection
                intent = await self.classify_intent(message)
                category = intent["category"]
                suggested_ai = intent["suggested_ai"]

                logger.info(f"   Category: {category} → AI: {suggested_ai}")
            else:
                # Follow-up detected, already set suggested_ai
                category = "follow_up"
                logger.info(f"   Category: follow_up → AI: {suggested_ai} (continuity)")

            # Step 2: Load tools if not already loaded
            if not self.tools_loaded and self.tool_executor:
                await self._load_tools()

            # Step 3: Route to appropriate AI
            if suggested_ai == "haiku":
                # ROUTE 1: Claude Haiku (Fast & Cheap)
                logger.info("🏃 [Router] Using Claude Haiku (fast & cheap)")

                # PHASE 4.5: Inject Cultural RAG context for Haiku (Indonesian cultural enrichment)
                cultural_context = None
                if self.cultural_rag:
                    try:
                        # Build context for cultural knowledge retrieval
                        context_params = {
                            "query": message,
                            "intent": category,  # greeting, casual, etc.
                            "conversation_stage": "first_contact" if not conversation_history or len(conversation_history) < 3 else "ongoing"
                        }

                        # Retrieve cultural knowledge chunks
                        cultural_chunks = await self.cultural_rag.get_cultural_context(context_params, limit=2)

                        if cultural_chunks:
                            logger.info(f"🌴 [Cultural RAG] Injecting {len(cultural_chunks)} Indonesian cultural insights for Haiku")

                            # Build cultural injection text
                            cultural_context = self.cultural_rag.build_cultural_prompt_injection(cultural_chunks)
                            logger.info(f"   Cultural context: {len(cultural_context)} chars")
                    except Exception as e:
                        logger.warning(f"⚠️ [Cultural RAG] Failed to get cultural context: {e}")
                        cultural_context = None

                # Combine memory + cultural context
                enhanced_context = memory_context or ""
                if cultural_context:
                    enhanced_context += f"\n\n{cultural_context}"

                # Use tool-enabled method if tools available
                if self.tool_executor and self.haiku_tools:
                    logger.info(f"   Tool use: ENABLED (LIMITED - {len(self.haiku_tools)} tools)")
                    result = await self.haiku.conversational_with_tools(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=enhanced_context,  # PHASE 3+4.5: Memory + Cultural RAG
                        tools=self.haiku_tools,
                        tool_executor=self.tool_executor,
                        max_tokens=300,  # INCREASED from 150 - allow warmer, more natural casual responses
                        max_tool_iterations=2  # LIMITED for speed
                    )
                else:
                    logger.info("   Tool use: DISABLED")
                    result = await self.haiku.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=enhanced_context,  # PHASE 3+4.5: Memory + Cultural RAG
                        max_tokens=300  # INCREASED from 150 - allow warmer, more natural casual responses
                    )

                return {
                    "response": result["text"],
                    "ai_used": "haiku",
                    "category": category,
                    "model": result["model"],
                    "tokens": result["tokens"],
                    "used_rag": False,
                    "used_tools": result.get("used_tools", False),
                    "tools_called": result.get("tools_called", [])
                }

            elif suggested_ai == "sonnet":
                # ROUTE 2: Claude Sonnet + RAG (Premium Quality)
                import time
                logger.info("🎯 [Router] Using Claude Sonnet (premium + RAG)")
                sonnet_start = time.time()

                # Get RAG context if available
                context = None
                if self.search:
                    try:
                        rag_start = time.time()
                        logger.info("   [DEBUG] Starting ChromaDB search...")

                        # OPTIMIZATION: Reduced to 10 documents for faster response (was 20)
                        search_results = await self.search.search(
                            query=message,
                            user_level=3,  # Full access
                            limit=10  # OPTIMIZED: Reduced from 20 for performance
                        )

                        rag_time = (time.time() - rag_start) * 1000
                        logger.info(f"   [DEBUG] ChromaDB search completed in {rag_time:.0f}ms")

                        if search_results.get("results"):
                            context_start = time.time()
                            # OPTIMIZATION: Use top 5 results (was 8) for faster processing
                            context = "\n\n".join([
                                f"[{r['metadata'].get('title', 'Unknown')}]\n{r['text']}"
                                for r in search_results["results"][:5]
                            ])
                            context_time = (time.time() - context_start) * 1000
                            logger.info(f"   [DEBUG] Context built in {context_time:.0f}ms: {len(context)} chars from {len(search_results['results'])} documents (using top 5)")
                    except Exception as e:
                        logger.error(f"   [DEBUG] RAG search FAILED: {e}")
                        logger.warning(f"   RAG search failed: {e}")

                # Use tool-enabled method if tools available
                if self.tool_executor and self.all_tools:
                    logger.info(f"   [DEBUG] Tool use: ENABLED (FULL - {len(self.all_tools)} tools)")
                    ai_start = time.time()
                    logger.info("   [DEBUG] Calling Sonnet WITH tools...")

                    result = await self.sonnet.conversational_with_tools(
                        message=message,
                        user_id=user_id,
                        context=context,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 3: Pass memory
                        tools=self.all_tools,
                        tool_executor=self.tool_executor,
                        max_tokens=1000,  # INCREASED from 600 to prevent truncated business answers
                        max_tool_iterations=5
                    )

                    ai_time = (time.time() - ai_start) * 1000
                    logger.info(f"   [DEBUG] Sonnet WITH tools completed in {ai_time:.0f}ms")
                else:
                    logger.info("   [DEBUG] Tool use: DISABLED")
                    ai_start = time.time()
                    logger.info("   [DEBUG] Calling Sonnet WITHOUT tools...")

                    result = await self.sonnet.conversational(
                        message=message,
                        user_id=user_id,
                        context=context,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 3: Pass memory
                        max_tokens=1000  # INCREASED from 600 to prevent truncated business answers
                    )

                    ai_time = (time.time() - ai_start) * 1000
                    logger.info(f"   [DEBUG] Sonnet WITHOUT tools completed in {ai_time:.0f}ms")

                sonnet_total = (time.time() - sonnet_start) * 1000
                logger.info(f"   [DEBUG] ⏱️  TOTAL Sonnet path: {sonnet_total:.0f}ms")

                return {
                    "response": result["text"],
                    "ai_used": "sonnet",
                    "category": category,
                    "model": result["model"],
                    "tokens": result["tokens"],
                    "used_rag": result.get("used_rag", False),
                    "used_tools": result.get("used_tools", False),
                    "tools_called": result.get("tools_called", [])
                }

            elif suggested_ai == "devai":
                # ROUTE 3: DevAI Qwen 2.5 Coder (Code Specialist)
                logger.info("👨‍💻 [Router] Using DevAI Qwen 2.5 Coder (code specialist)")

                if not self.devai_endpoint:
                    logger.warning("⚠️ DevAI not configured, falling back to Sonnet")
                    # Fallback to Sonnet if DevAI unavailable
                    result = await self.sonnet.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 5: Pass memory to fallback
                        max_tokens=500  # More tokens for code
                    )
                    return {
                        "response": result["text"],
                        "ai_used": "sonnet",  # Indicate fallback
                        "category": category,
                        "model": result["model"],
                        "tokens": result["tokens"],
                        "used_rag": False
                    }

                # Call DevAI endpoint
                import httpx
                try:
                    # Build DevAI request with memory context
                    devai_payload = {
                        "message": message,
                        "user_id": user_id,
                        "conversation_history": conversation_history or []
                    }

                    # PHASE 5: Add memory context if available
                    if memory_context:
                        devai_payload["memory_context"] = memory_context
                        logger.info(f"   Passing memory context to DevAI ({len(memory_context)} chars)")

                    async with httpx.AsyncClient(timeout=60.0) as client:
                        devai_response = await client.post(
                            f"{self.devai_endpoint}/chat",
                            json=devai_payload
                        )
                        devai_response.raise_for_status()
                        devai_data = devai_response.json()

                    return {
                        "response": devai_data.get("response", ""),
                        "ai_used": "devai",
                        "category": category,
                        "model": "qwen-2.5-coder-7b",
                        "tokens": devai_data.get("tokens", {}),
                        "used_rag": False
                    }
                except Exception as e:
                    logger.error(f"❌ DevAI call failed: {e}, falling back to Sonnet")
                    # Fallback to Sonnet on DevAI error
                    result = await self.sonnet.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 5: Pass memory to fallback
                        max_tokens=500
                    )
                    return {
                        "response": result["text"],
                        "ai_used": "sonnet",  # Indicate fallback
                        "category": category,
                        "model": result["model"],
                        "tokens": result["tokens"],
                        "used_rag": False
                    }

            else:
                # FALLBACK: Unknown routing case - use Sonnet (safest)
                logger.warning(f"⚠️ [Router] Unknown suggested_ai: {suggested_ai}, falling back to Sonnet")

                result = await self.sonnet.conversational(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=memory_context,
                    max_tokens=800
                )

                return {
                    "response": result["text"],
                    "ai_used": "sonnet",
                    "category": category,
                    "model": result["model"],
                    "tokens": result["tokens"],
                    "used_rag": False
                }

        except Exception as e:
            logger.error(f"❌ [Router] Routing error: {e}")
            raise Exception(f"Routing failed: {str(e)}")


    def get_stats(self) -> Dict:
        """Get router statistics"""
        return {
            "router": "intelligent_triple_ai",
            "classification": "pattern_matching",
            "ai_models": {
                "haiku": {
                    "available": self.haiku.is_available() if self.haiku else False,
                    "use_case": "greetings, casual chat",
                    "cost": "$0.25/$1.25 per 1M tokens",
                    "traffic": "60%"
                },
                "sonnet": {
                    "available": self.sonnet.is_available() if self.sonnet else False,
                    "use_case": "business, complex queries",
                    "cost": "$3/$15 per 1M tokens",
                    "traffic": "35%"
                },
                "devai": {
                    "available": bool(self.devai_endpoint),
                    "use_case": "code, development, programming",
                    "cost": "€3.78/month flat (RunPod)",
                    "traffic": "5%"
                }
            },
            "rag_available": self.search is not None,
            "total_cost_monthly": "$25-55 (3,000 requests)"
        }
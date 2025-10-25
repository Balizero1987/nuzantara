"""
Intelligent Router - HAIKU-ONLY routing system
Uses pattern matching for intent classification, routes to Haiku 4.5 ONLY

Routing logic:
- ALL queries → Claude Haiku 4.5 (fast, efficient, RAG-enhanced)
- Fallback → Claude Haiku 4.5 (consistent experience)

PHASE 1 & 2 FIXES (2025-10-21):
- Response sanitization (removes training data artifacts)
- Length enforcement (SANTAI mode max 30 words)
- Conditional contact info (not for greetings)
- Query classification for RAG skip (NO RAG for greetings/casual)
"""

import logging
import re
from typing import Dict, Optional, List, Any
import sys
from pathlib import Path

# Add utils to path for response_sanitizer import
sys.path.append(str(Path(__file__).parent.parent))
from utils.response_sanitizer import (
    process_zantara_response,
    classify_query_type as classify_query_for_rag,
    sanitize_zantara_response,
    enforce_santai_mode,
    add_contact_if_appropriate
)

logger = logging.getLogger(__name__)


class IntelligentRouter:
    """
    HAIKU-ONLY intelligent routing system

    Architecture:
    1. Pattern Matching: Fast intent classification (no AI cost)
    2. Claude Haiku 4.5: ALL queries (fast, efficient, RAG-enhanced)
    3. RAG Integration: Enhanced context for all business queries
    4. Tool Use: Full access to all 164 tools

    Cost optimization: Routes 100% to Haiku 4.5 (3x cheaper than Sonnet)
    """

    def __init__(
        self,
        llama_client,
        haiku_service,
        search_service=None,
        tool_executor=None,
        cultural_rag_service=None  # NEW: Cultural RAG for Haiku enrichment
    ):
        """
        Initialize intelligent router

        Args:
            llama_client: Optional (not used - kept for backward compatibility)
            haiku_service: ClaudeHaikuService for ALL queries
            search_service: Optional SearchService for RAG
            tool_executor: ToolExecutor for handler execution (optional)
            cultural_rag_service: CulturalRAGService for Indonesian cultural context (optional)
        """
        self.haiku = haiku_service
        self.search = search_service
        self.tool_executor = tool_executor
        self.cultural_rag = cultural_rag_service  # NEW: Cultural enrichment

        # Available tools will be loaded on first use
        self.all_tools = None
        self.tools_loaded = False

        logger.info("✅ IntelligentRouter initialized (HAIKU-ONLY)")
        logger.info(f"   Classification: Pattern Matching (fast, no AI cost)")
        logger.info(f"   Haiku 4.5 (ALL queries): {'✅' if haiku_service else '❌'}")
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
                    "suggested_ai": "haiku",
                    "require_memory": True  # Always use memory for personalized greetings
                }

            # Check session state patterns (login/logout/identity queries)
            session_patterns = [
                # Login intents
                "login", "log in", "sign in", "signin", "masuk", "accedi",
                # Logout intents  
                "logout", "log out", "sign out", "signout", "keluar", "esci",
                # Identity queries
                "who am i", "siapa aku", "siapa saya", "chi sono", "who is this",
                "do you know me", "recognize me", "mi riconosci", "kenal saya",
                "chi sono io", "sai chi sono"
            ]
            
            if any(pattern in message_lower for pattern in session_patterns):
                logger.info(f"🎯 [Router] Quick match: session_state → Haiku with memory")
                return {
                    "category": "session_state",
                    "confidence": 1.0,
                    "suggested_ai": "haiku",
                    "require_memory": True  # Critical: need user identity for these queries
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
                suggested_ai = "haiku"
                logger.info(f"🎯 [Router] Fast fallback: LONG message → Haiku")

            return {
                "category": category,
                "confidence": 0.7,  # Pattern matching confidence
                "suggested_ai": suggested_ai
            }

        except Exception as e:
            logger.error(f"❌ [Router] Classification error: {e}")
            # Fallback: route to Haiku (ONLY AI)
            return {
                "category": "unknown",
                "confidence": 0.0,
                "suggested_ai": "haiku"
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

            # PHASE 1 & 2: Classify query type FIRST (for RAG skip and response sanitization)
            query_type = classify_query_for_rag(message)
            logger.info(f"📋 [Router] Query type: {query_type} (for RAG and sanitization)")

            # PHASE 1.5: RAG retrieval (ONLY for business/emergency queries)
            rag_context = None
            used_rag = False
            if query_type in ["business", "emergency"] and self.search:
                try:
                    logger.info(f"🔍 [Router] Fetching RAG context for {query_type} query...")

                    # Retrieve relevant documents from ChromaDB
                    search_results = await self.search.search(
                        query=message,
                        user_level=0,  # Default level (can be enhanced later with collaborator level)
                        limit=5  # Top 5 most relevant documents
                    )

                    if search_results.get("results"):
                        # Build RAG context from search results
                        rag_docs = []
                        for result in search_results["results"][:5]:
                            doc_text = result["text"][:500]  # Limit each doc to 500 chars
                            doc_title = result["metadata"].get("title", "Unknown")
                            rag_docs.append(f"📄 {doc_title}: {doc_text}")

                        rag_context = "\n\n".join(rag_docs)
                        used_rag = True

                        logger.info(f"✅ [Router] RAG context retrieved: {len(rag_docs)} documents, {len(rag_context)} chars")
                    else:
                        logger.info(f"⚠️ [Router] No RAG results found for query")

                except Exception as e:
                    logger.warning(f"⚠️ [Router] RAG retrieval failed: {e}")
                    rag_context = None
                    used_rag = False
            else:
                logger.info(f"⏭️ [Router] Skipping RAG for {query_type} query (greeting/casual)")

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

                # Use Haiku with ALL tools (Haiku IS Zantara, full system access)
                if self.tool_executor and self.all_tools:
                            result = await self.haiku.conversational_with_tools(
                                message=message,
                                user_id=user_id,
                                conversation_history=conversation_history,
                                memory_context=memory_context,
                        tools=self.all_tools,  # ALL tools, not limited
                        tool_executor=self.tool_executor,
                        max_tokens=8000,  # Full response capacity
                        max_tool_iterations=5  # More iterations for complex tasks
                    )
                else:
                    result = await self.haiku.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=memory_context,
                        max_tokens=8000  # Full capacity
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

            # PHASE 3.1: Combine RAG context with memory context (if RAG was retrieved)
            if rag_context:
                rag_section = f"\n\n<relevant_knowledge>\n{rag_context}\n</relevant_knowledge>"
                if memory_context:
                    memory_context += rag_section
                else:
                    memory_context = rag_section
                logger.info(f"📚 [Router] RAG context added to memory context")

            # PHASE 3.5: Build team context if collaborator is present (ENHANCED PERSONALIZATION)
            team_context = None
            if collaborator and hasattr(collaborator, 'id') and collaborator.id != "anonymous":
                logger.info(f"👥 [Router] Building team context for {collaborator.name}")

                # Build rich team context with role, department, and communication preferences
                team_parts = []

                # LANGUAGE REQUIREMENT (ABSOLUTE - MUST BE FIRST)
                language_map = {
                    "it": "Italian",
                    "id": "Indonesian",
                    "en": "English"
                }
                lang_full = language_map.get(collaborator.language, collaborator.language.upper())
                team_parts.append(f"IMPORTANT: You MUST respond ONLY in {lang_full} language")

                # Identity and role
                team_parts.append(f"You're talking to {collaborator.name} ({collaborator.ambaradam_name}), {collaborator.role} in the {collaborator.department} department")

                # Expertise level (affects depth of response)
                expertise_instructions = {
                    "beginner": "Explain concepts simply and clearly",
                    "intermediate": "Balance clarity with detail",
                    "advanced": "You can use technical language",
                    "expert": "Discuss at a sophisticated level"
                }
                if collaborator.expertise_level in expertise_instructions:
                    team_parts.append(expertise_instructions[collaborator.expertise_level])

                # Emotional preferences (IMPERATIVE - how YOU must respond)
                if hasattr(collaborator, 'emotional_preferences') and collaborator.emotional_preferences:
                    prefs = collaborator.emotional_preferences
                    tone = prefs.get('tone', 'professional')
                    formality = prefs.get('formality', 'medium')
                    humor = prefs.get('humor', 'light')

                    # Translate tone to DIRECT instructions
                    tone_instructions = {
                        "professional_warm": "Be professional but warm and approachable",
                        "direct_with_depth": "Be direct and insightful",
                        "respectful_collaborative": "Be respectful and collaborative",
                        "precise_methodical": "Be precise and methodical",
                        "efficient_focused": "Be efficient and focused",
                        "detail_oriented": "Be detail-oriented and thorough",
                        "helpful_clear": "Be helpful and clear",
                        "collaborative": "Be collaborative and supportive",
                        "eager_learning": "Be encouraging and educational",
                        "strategic_visionary": "Be strategic and forward-thinking",
                        "sacred_semar_energy": "Be playful, wise, and deeply intuitive"
                    }

                    formality_instructions = {
                        "casual": "Use casual, friendly language",
                        "medium": "Use balanced professional language",
                        "high": "Use formal, polished language"
                    }

                    humor_instructions = {
                        "minimal": "Keep humor minimal",
                        "light": "Light humor is welcome",
                        "intelligent": "Use intelligent, subtle humor",
                        "sacred_semar_energy": "Use profound, playful wisdom"
                    }

                    instruction_parts = []
                    if tone in tone_instructions:
                        instruction_parts.append(tone_instructions[tone])
                    if formality in formality_instructions:
                        instruction_parts.append(formality_instructions[formality].lower())
                    if humor in humor_instructions:
                        instruction_parts.append(humor_instructions[humor].lower())

                    if instruction_parts:
                        team_parts.append(". ".join(instruction_parts))

                # Sub Rosa level (access level)
                team_parts.append(f"Security clearance: Level {collaborator.sub_rosa_level}")

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
            # OVERRIDE: ALWAYS use Haiku 4.5 for frontend (per user requirement)
            # Haiku 4.5 is the ONLY AI, it IS Zantara (not an assistant)
            suggested_ai = "haiku"
            logger.info("🎯 [Router] FORCED: Using Haiku 4.5 as ONLY AI (Zantara identity)")
            
            if suggested_ai == "haiku":
                # ROUTE 1: Claude Haiku 4.5 - THE ONLY AI (Zantara Identity)
                logger.info("🎯 [Router] Using Haiku 4.5 - ZANTARA (full system access)")

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

                # Use tool-enabled method with ALL tools (Haiku IS Zantara, full access)
                if self.tool_executor and self.all_tools:
                    logger.info(f"   Tool use: ENABLED (FULL ACCESS - {len(self.all_tools)} tools)")
                    result = await self.haiku.conversational_with_tools(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=enhanced_context,  # PHASE 3+4.5: Memory + Cultural RAG
                        tools=self.all_tools,  # ALL tools, not limited
                        tool_executor=self.tool_executor,
                        max_tokens=8000,  # Full capacity for complex responses
                        max_tool_iterations=5  # More iterations for complex operations
                    )
                else:
                    logger.info("   Tool use: DISABLED")
                    result = await self.haiku.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=enhanced_context,  # PHASE 3+4.5: Memory + Cultural RAG
                        max_tokens=8000  # Full capacity
                    )

                # PHASE 1 & 2: Apply response sanitization
                sanitized_response = process_zantara_response(
                    result["text"],
                    query_type,
                    apply_santai=True,  # Enforce length for greetings/casual
                    add_contact=True    # Conditionally add contact (not for greetings)
                )
                logger.info(f"   ✨ [Phase 1&2] Response sanitized (type: {query_type})")

                return {
                    "response": sanitized_response,
                    "ai_used": "haiku",
                    "category": category,
                    "model": result["model"],
                    "tokens": result["tokens"],
                    "used_rag": used_rag,  # ← PHASE 1 FIX: Report actual RAG usage
                    "used_tools": result.get("used_tools", False),
                    "tools_called": result.get("tools_called", [])
                }

            # Sonnet and DevAI routes removed - Haiku 4.5 is the ONLY AI

            # DevAI route removed - Haiku 4.5 is the ONLY AI
            # All queries are handled by Haiku 4.5 above

        except Exception as e:
            logger.error(f"❌ [Router] Routing error: {e}")
            raise Exception(f"Routing failed: {str(e)}")


    async def stream_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None,
        memory: Optional[Any] = None,
        collaborator: Optional[Any] = None
    ):
        """
        Stream chat response token by token for SSE

        Similar to route_chat but yields text chunks instead of complete response

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory: Optional memory context
            collaborator: Optional collaborator profile

        Yields:
            str: Text chunks as they arrive from AI
        """
        try:
            logger.info(f"🚦 [Router Stream] Starting stream for user {user_id}")

            # PHASE 1 & 2: Classify query type for RAG skip
            query_type = classify_query_for_rag(message)
            logger.info(f"📋 [Router Stream] Query type: {query_type}")

            # Build memory context (same logic as route_chat)
            memory_context = None
            if memory:
                facts_count = len(memory.profile_facts) if hasattr(memory, 'profile_facts') else 0
                if facts_count > 0:
                    memory_context = "Context about this conversation:\n"
                    top_facts = memory.profile_facts[:10]
                    personal_facts = [f for f in top_facts if any(word in f.lower() for word in ["talking to", "role:", "level:", "language:", "colleague"])]
                    other_facts = [f for f in top_facts if f not in personal_facts]

                    if personal_facts:
                        memory_context += f"{'. '.join(personal_facts)}. "
                    if other_facts:
                        memory_context += f"You also know that: {', '.join(other_facts[:5])}. "
                    if memory.summary:
                        memory_context += f"\nPrevious conversation context: {memory.summary[:500]}"

            # Build team context (same logic as route_chat)
            if collaborator and hasattr(collaborator, 'id') and collaborator.id != "anonymous":
                team_parts = []
                language_map = {"it": "Italian", "id": "Indonesian", "en": "English"}
                lang_full = language_map.get(collaborator.language, collaborator.language.upper())
                team_parts.append(f"IMPORTANT: You MUST respond ONLY in {lang_full} language")
                team_parts.append(f"You're talking to {collaborator.name} ({collaborator.ambaradam_name}), {collaborator.role} in the {collaborator.department} department")

                team_context = ". ".join(team_parts) + "."
                if memory_context:
                    memory_context = f"{team_context}\n\n{memory_context}"
                else:
                    memory_context = team_context

            # Classify intent
            intent = await self.classify_intent(message)
            category = intent["category"]
            suggested_ai = intent["suggested_ai"]

            logger.info(f"   Category: {category} → AI: {suggested_ai}")

            # Load tools if not already loaded (CRITICAL FIX for tool calling in SSE)
            if not self.tools_loaded and self.tool_executor:
                await self._load_tools()

            # Route to appropriate AI for streaming - ALWAYS Haiku with tools
            logger.info("🎯 [Router Stream] Using Haiku 4.5 with FULL tool access")

            # Use conversational_with_tools for complete response (includes tool calling)
            if self.tool_executor and self.all_tools:
                logger.info(f"   Tool use: ENABLED ({len(self.all_tools)} tools available)")
                result = await self.haiku.conversational_with_tools(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=memory_context,
                    tools=self.all_tools,  # ALL tools for SSE streaming
                    tool_executor=self.tool_executor,
                    max_tokens=8000,  # Full capacity (was 300 - too small!)
                    max_tool_iterations=5
                )

                # Stream the complete response word-by-word
                response_text = result["text"]
                words = response_text.split()

                for i, word in enumerate(words):
                    # Add space before word (except first)
                    chunk = f" {word}" if i > 0 else word
                    yield chunk

            else:
                # Fallback: streaming without tools (shouldn't happen)
                logger.warning("⚠️ [Router Stream] Tool executor not available, using simple streaming")
                async for chunk in self.haiku.stream(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=memory_context,
                    max_tokens=8000
                ):
                    yield chunk

            logger.info(f"✅ [Router Stream] Stream completed for user {user_id}")

        except Exception as e:
            logger.error(f"❌ [Router Stream] Error: {e}")
            raise Exception(f"Streaming failed: {str(e)}")


    def get_stats(self) -> Dict:
        """Get router statistics"""
        return {
            "router": "haiku_only",
            "classification": "pattern_matching",
            "ai_models": {
                "haiku": {
                    "available": self.haiku.is_available() if self.haiku else False,
                    "use_case": "ALL queries (greetings, casual, business, complex)",
                    "cost": "$0.25/$1.25 per 1M tokens",
                    "traffic": "100%"
                }
            },
            "rag_available": self.search is not None,
            "total_cost_monthly": "$8-15 (3,000 requests) - 3x cheaper than Sonnet"
        }
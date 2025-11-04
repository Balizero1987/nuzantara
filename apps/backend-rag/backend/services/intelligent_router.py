"""
Intelligent Router - HAIKU-ONLY routing system (REFACTORED)
Uses pattern matching for intent classification, routes to Haiku 4.5 ONLY

Routing logic:
- ALL queries → Claude Haiku 4.5 (fast, efficient, RAG-enhanced)
- Fallback → Claude Haiku 4.5 (consistent experience)

PHASE 1 & 2 FIXES (2025-10-21):
- Response sanitization (removes training data artifacts)
- Length enforcement (SANTAI mode max 30 words)
- Conditional contact info (not for greetings)
- Query classification for RAG skip (NO RAG for greetings/casual)

REFACTORED (2025-11-05):
- Modular architecture with 6 specialized modules
- Orchestrator pattern - delegates to specialized services
- No code duplication between route_chat and stream_chat
- Independent, testable modules
"""

import logging
from typing import Dict, Optional, List, Any

# Import modular components
from .classification import IntentClassifier
from .context import ContextBuilder, RAGManager
from .routing import SpecializedServiceRouter, ResponseHandler
from .tools import ToolManager

logger = logging.getLogger(__name__)


class IntelligentRouter:
    """
    HAIKU-ONLY intelligent routing system (Orchestrator)

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
        cultural_rag_service=None,
        autonomous_research_service=None,
        cross_oracle_synthesis_service=None
    ):
        """
        Initialize intelligent router with modular components

        Args:
            llama_client: Optional (not used - kept for backward compatibility)
            haiku_service: ClaudeHaikuService for ALL queries
            search_service: Optional SearchService for RAG
            tool_executor: ToolExecutor for handler execution (optional)
            cultural_rag_service: CulturalRAGService for Indonesian cultural context (optional)
            autonomous_research_service: AutonomousResearchService for complex queries (optional)
            cross_oracle_synthesis_service: CrossOracleSynthesisService for business planning (optional)
        """
        # Core services
        self.haiku = haiku_service
        self.cultural_rag = cultural_rag_service

        # Initialize modular components
        self.classifier = IntentClassifier()
        self.context_builder = ContextBuilder()
        self.rag_manager = RAGManager(search_service)
        self.specialized_router = SpecializedServiceRouter(
            autonomous_research_service,
            cross_oracle_synthesis_service
        )
        self.response_handler = ResponseHandler()
        self.tool_manager = ToolManager(tool_executor)

        logger.info("✅ IntelligentRouter initialized (HAIKU-ONLY, MODULAR)")
        logger.info("   Classification: Pattern Matching (fast, no AI cost)")
        logger.info(f"   Haiku 4.5 (ALL queries): {'✅' if haiku_service else '❌'}")
        logger.info(f"   RAG (context): {'✅' if search_service else '❌'}")
        logger.info(f"   Tool Use: {'✅' if tool_executor else '❌'}")
        logger.info(f"   Cultural RAG (Haiku): {'✅' if cultural_rag_service else '❌'}")
        logger.info(f"   Autonomous Research: {'✅' if autonomous_research_service else '❌'}")
        logger.info(f"   Cross-Oracle Synthesis: {'✅' if cross_oracle_synthesis_service else '❌'}")

    async def route_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None,
        memory: Optional[Any] = None,
        emotional_profile: Optional[Any] = None,
        last_ai_used: Optional[str] = None,
        collaborator: Optional[Any] = None,
        frontend_tools: Optional[List[Dict]] = None
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
            frontend_tools: Optional tools from frontend (if provided, use instead of backend tools)

        Returns:
            {
                "response": str,
                "ai_used": "haiku"|"sonnet"|"llama",
                "category": str,
                "model": str,
                "tokens": dict,
                "used_rag": bool,
                "tools_called": List[str]
            }
        """
        try:
            logger.info(f"🚦 [Router] Routing message for user {user_id}")

            # STEP 1: Determine tools to use (frontend or backend)
            tools_to_use = frontend_tools
            if not tools_to_use:
                await self.tool_manager.load_tools()
                tools_to_use = self.tool_manager.get_available_tools("haiku")
                if tools_to_use:
                    logger.info(f"🔧 [Router] Using {len(tools_to_use)} tools from BACKEND")
            else:
                logger.info(f"🔧 [Router] Using {len(tools_to_use)} tools from FRONTEND")

            # STEP 2: Classify query type for RAG and sanitization
            query_type = self.response_handler.classify_query(message)
            logger.info(f"📋 [Router] Query type: {query_type}")

            # STEP 3: RAG retrieval (only for business/emergency)
            rag_result = await self.rag_manager.retrieve_context(
                query=message,
                query_type=query_type,
                user_level=0,
                limit=5
            )

            # STEP 4: Check for emotional override
            if emotional_profile and hasattr(emotional_profile, 'detected_state'):
                emotional_result = await self._handle_emotional_override(
                    message, user_id, conversation_history, memory,
                    emotional_profile, tools_to_use
                )
                if emotional_result:
                    return emotional_result

            # STEP 5: Build memory context
            memory_context = self.context_builder.build_memory_context(memory)

            # STEP 6: Build team context
            team_context = self.context_builder.build_team_context(collaborator)

            # STEP 7: Get cultural context (if available)
            cultural_context = await self._get_cultural_context(message, conversation_history)

            # STEP 8: Combine all contexts
            combined_context = self.context_builder.combine_contexts(
                memory_context,
                team_context,
                rag_result["context"],
                cultural_context
            )

            # STEP 9: Classify intent
            intent = await self.classifier.classify_intent(message)
            category = intent["category"]
            suggested_ai = intent["suggested_ai"]

            logger.info(f"   Category: {category} → AI: {suggested_ai}")

            # STEP 10: Check for specialized service routing
            # Autonomous Research
            if self.specialized_router.detect_autonomous_research(message, category):
                result = await self.specialized_router.route_autonomous_research(message, user_level=3)
                if result:
                    return result

            # Cross-Oracle Synthesis
            if self.specialized_router.detect_cross_oracle(message, category):
                result = await self.specialized_router.route_cross_oracle(message, user_level=3)
                if result:
                    return result

            # STEP 11: Route to Haiku (ONLY AI)
            logger.info("🎯 [Router] Using Haiku 4.5 - ZANTARA (full system access)")

            if self.tool_manager.tool_executor and tools_to_use:
                logger.info(f"   Tool use: ENABLED ({len(tools_to_use)} tools)")
                result = await self.haiku.conversational_with_tools(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=combined_context,
                    tools=tools_to_use,
                    tool_executor=self.tool_manager.tool_executor,
                    max_tokens=8000,
                    max_tool_iterations=5
                )
            else:
                logger.info("   Tool use: DISABLED")
                result = await self.haiku.conversational(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=combined_context,
                    max_tokens=8000
                )

            # STEP 12: Sanitize response
            sanitized_response = self.response_handler.sanitize_response(
                result["text"],
                query_type,
                apply_santai=True,
                add_contact=True
            )

            return {
                "response": sanitized_response,
                "ai_used": "haiku",
                "category": category,
                "model": result["model"],
                "tokens": result["tokens"],
                "used_rag": rag_result["used_rag"],
                "used_tools": result.get("used_tools", False),
                "tools_called": result.get("tools_called", [])
            }

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

            # STEP 1: Classify query type
            query_type = self.response_handler.classify_query(message)
            logger.info(f"📋 [Router Stream] Query type: {query_type}")

            # STEP 2: Detect comparison/cross-topic queries (adjust max_tokens)
            comparison_keywords = [
                "confronta", "compare", "vs", "differenza tra",
                "difference between", "confronto", "comparison"
            ]
            cross_topic_keywords = [
                "timeline", "percorso completo", "tutti i costi",
                "step-by-step", "tutto", "complessivamente"
            ]

            is_comparison = any(kw in message.lower() for kw in comparison_keywords)
            is_cross_topic = any(kw in message.lower() for kw in cross_topic_keywords) or len(message.split()) > 20

            if is_comparison:
                max_tokens_to_use = 12000
                logger.info(f"🔍 COMPARISON query detected → max_tokens={max_tokens_to_use}")
            elif is_cross_topic:
                max_tokens_to_use = 10000
                logger.info(f"🌐 CROSS-TOPIC query detected → max_tokens={max_tokens_to_use}")
            else:
                max_tokens_to_use = 8000

            # STEP 3: Build memory context
            memory_context = self.context_builder.build_memory_context(memory)

            # STEP 4: Build team context
            team_context = self.context_builder.build_team_context(collaborator)

            # STEP 5: RAG retrieval (only for business/emergency)
            rag_result = await self.rag_manager.retrieve_context(
                query=message,
                query_type=query_type,
                user_level=0,
                limit=5
            )

            # STEP 6: Combine contexts
            combined_context = self.context_builder.combine_contexts(
                memory_context,
                team_context,
                rag_result["context"],
                None
            )

            # STEP 7: Load tools and detect prefetch needs
            await self.tool_manager.load_tools()
            tool_needs = self.tool_manager.detect_tool_needs(message)

            # STEP 8: Prefetch tool data if needed
            if tool_needs["should_prefetch"] and self.tool_manager.tool_executor:
                prefetched_context = await self._prefetch_tool_data(tool_needs)
                if prefetched_context:
                    combined_context = (combined_context or "") + prefetched_context

            # STEP 9: Stream from Haiku
            logger.info("🎯 [Router Stream] Using Haiku 4.5 with REAL token-by-token streaming")
            async for chunk in self.haiku.stream(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory_context=combined_context,
                max_tokens=max_tokens_to_use
            ):
                yield chunk

            logger.info(f"✅ [Router Stream] Stream completed for user {user_id}")

        except Exception as e:
            logger.error(f"❌ [Router Stream] Error: {e}")
            raise Exception(f"Streaming failed: {str(e)}")

    async def _handle_emotional_override(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]],
        memory: Optional[Any],
        emotional_profile: Any,
        tools_to_use: Optional[List[Dict]]
    ) -> Optional[Dict]:
        """Handle emotional override routing (internal helper)"""
        emotional_states_needing_empathy = [
            "sad", "anxious", "stressed", "embarrassed", "lonely", "scared", "worried"
        ]

        detected_state = (
            emotional_profile.detected_state.value
            if hasattr(emotional_profile.detected_state, 'value')
            else str(emotional_profile.detected_state)
        )

        if detected_state not in emotional_states_needing_empathy:
            return None

        logger.info(f"🎭 [Router] EMOTIONAL OVERRIDE: {detected_state} → Force Haiku for empathy")

        memory_context = self.context_builder.build_memory_context(memory)

        if self.tool_manager.tool_executor and tools_to_use:
            result = await self.haiku.conversational_with_tools(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory_context=memory_context,
                tools=tools_to_use,
                tool_executor=self.tool_manager.tool_executor,
                max_tokens=8000,
                max_tool_iterations=5
            )
        else:
            result = await self.haiku.conversational(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory_context=memory_context,
                max_tokens=8000
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

    async def _get_cultural_context(
        self,
        message: str,
        conversation_history: Optional[List[Dict]]
    ) -> Optional[str]:
        """Get cultural context from CulturalRAGService (internal helper)"""
        if not self.cultural_rag:
            return None

        try:
            context_params = {
                "query": message,
                "intent": "general",
                "conversation_stage": (
                    "first_contact"
                    if not conversation_history or len(conversation_history) < 3
                    else "ongoing"
                )
            }

            cultural_chunks = await self.cultural_rag.get_cultural_context(context_params, limit=2)

            if cultural_chunks:
                logger.info(f"🌴 [Cultural RAG] Injecting {len(cultural_chunks)} Indonesian cultural insights")
                return self.cultural_rag.build_cultural_prompt_injection(cultural_chunks)

        except Exception as e:
            logger.warning(f"⚠️ [Cultural RAG] Failed: {e}")

        return None

    async def _prefetch_tool_data(self, tool_needs: Dict) -> Optional[str]:
        """Prefetch tool data before streaming (internal helper)"""
        try:
            tool_name = tool_needs["tool_name"]
            tool_input = tool_needs["tool_input"]

            logger.info(f"🚀 [Prefetch] Executing {tool_name} before streaming...")

            tool_result = await self.tool_manager.tool_executor.execute_tool(
                tool_name=tool_name,
                tool_input=tool_input
            )

            if tool_result.get("success"):
                prefetched_data = tool_result.get("result")
                logger.info(f"✅ [Prefetch] Got data: {len(str(prefetched_data))} chars")

                return f"\n\n<official_data_from_{tool_name}>\n{prefetched_data}\n</official_data_from_{tool_name}>\n"

            logger.warning(f"⚠️ [Prefetch] Tool failed: {tool_result.get('error')}")

        except Exception as e:
            logger.error(f"❌ [Prefetch] Failed to execute {tool_name}: {e}")

        return None

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
            "rag_available": self.rag_manager.search is not None,
            "total_cost_monthly": "$8-15 (3,000 requests) - 3x cheaper than Sonnet"
        }

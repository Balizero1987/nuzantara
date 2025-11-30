"""
Intelligent Router - ZANTARA AI (REFACTORED)
Uses pattern matching for intent classification, routes to ZANTARA AI

UPDATED 2025-11-30:
- Full identity context integration
- Zantara self-awareness for "who are you?" queries
- Team query detection and routing
- Enhanced context passing to AI
- PersonalityService integration for all query types (not just fast track)
"""

import asyncio
import json
import logging
from typing import Any

from app.routers.simple_jaksel_caller import SimpleJakselCallerHF

# Import modular components
from .classification import IntentClassifier
from .context import ContextBuilder, RAGManager
from .routing import ResponseHandler, SpecializedServiceRouter

logger = logging.getLogger(__name__)


class IntelligentRouter:
    """
    ZANTARA AI intelligent routing system (Orchestrator)

    Architecture:
    1. Pattern Matching: Fast intent classification (no AI cost)
    2. Identity Detection: Recognize self/user identity queries
    3. ZANTARA AI: Primary AI engine with full context
    4. RAG Integration: Enhanced context for all business queries
    5. Tool Use: Full access to all 164 tools via ZANTARA AI
    """

    def __init__(
        self,
        ai_client,
        search_service=None,
        tool_executor=None,
        cultural_rag_service=None,
        autonomous_research_service=None,
        cross_oracle_synthesis_service=None,
        client_journey_orchestrator=None,
        personality_service=None,
        collaborator_service=None,
    ):
        """
        Initialize intelligent router with modular components

        Args:
            ai_client: ZantaraAIClient for ALL queries
            search_service: Optional SearchService for RAG
            tool_executor: ToolExecutor for handler execution (optional)
            cultural_rag_service: CulturalRAGService for Indonesian cultural context (optional)
            autonomous_research_service: AutonomousResearchService for complex queries (optional)
            cross_oracle_synthesis_service: CrossOracleSynthesisService for business planning (optional)
            client_journey_orchestrator: ClientJourneyOrchestrator for workflows (optional)
            personality_service: PersonalityService for personality injection (optional)
            collaborator_service: CollaboratorService for team member lookup (optional)
        """
        # Core services
        self.ai = ai_client
        self.cultural_rag = cultural_rag_service
        self.personality_service = personality_service
        self.collaborator_service = collaborator_service

        # Initialize modular components
        self.classifier = IntentClassifier()
        self.context_builder = ContextBuilder()
        self.rag_manager = RAGManager(search_service)
        self.specialized_router = SpecializedServiceRouter(
            autonomous_research_service, cross_oracle_synthesis_service, client_journey_orchestrator
        )

        self.response_handler = ResponseHandler()
        self.tool_executor = tool_executor

        # Initialize Jaksel Caller
        self.jaksel_caller = SimpleJakselCallerHF()

        logger.info("🎯 [IntelligentRouter] Initialized (ZANTARA AI, MODULAR, IDENTITY-AWARE)")
        logger.info(f"   Classification: ✅ (Pattern Matching)")
        logger.info(f"   ZANTARA AI: {'✅' if ai_client else '❌'}")
        logger.info(f"   RAG: {'✅' if search_service else '❌'}")
        logger.info(f"   Tools: {'✅' if tool_executor else '❌'}")
        logger.info(f"   Cultural RAG: {'✅' if cultural_rag_service else '❌'}")
        logger.info(f"   Personality Service: {'✅' if personality_service else '❌'}")
        logger.info(f"   Collaborator Service: {'✅' if collaborator_service else '❌'}")

    async def route_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict] | None = None,
        memory: Any | None = None,
        emotional_profile: Any | None = None,
        _last_ai_used: str | None = None,
        collaborator: Any | None = None,
        frontend_tools: list[dict] | None = None,
    ) -> dict:
        """
        Main routing function - classifies intent and routes to appropriate AI

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory: Optional memory context for user
            emotional_profile: Optional emotional profile
            last_ai_used: Optional last AI used
            collaborator: Optional collaborator profile for personalization
            frontend_tools: Optional tools from frontend

        Returns:
            {
                "response": str,
                "ai_used": "zantara-ai",
                "category": str,
                "model": str,
                "tokens": dict,
                "used_rag": bool,
                "tools_called": List[str]
            }
        """
        try:
            logger.info(f"🚦 [Router] Routing message for user {user_id}")

            # STEP 0: Fast Intent Classification
            intent = await self.classifier.classify_intent(message)
            category = intent["category"]
            suggested_ai = intent["suggested_ai"]
            logger.info(f"📋 [Router] Classification: {category} (Confidence: {intent.get('confidence', 0.0)})")

            # STEP 0.5: Detect special query types
            is_identity_query = self.context_builder.detect_identity_query(message)
            is_zantara_query = self.context_builder.detect_zantara_query(message)
            is_team_query = self.context_builder.detect_team_query(message)

            if is_identity_query:
                category = "identity"
                logger.info("🆔 [Router] IDENTITY QUERY detected")
            elif is_zantara_query:
                category = "zantara_identity"
                logger.info("🤖 [Router] ZANTARA IDENTITY QUERY detected")
            elif is_team_query:
                category = "team_query"
                logger.info("👥 [Router] TEAM QUERY detected")

            # STEP 1: Fast Track for greetings (but NOT for identity queries)
            if category in ["greeting", "casual"] and not is_identity_query and not is_zantara_query:
                if self.personality_service:
                    logger.info("🚀 [Router] FAST TRACK ACTIVATED")
                    fast_response = await self.personality_service.fast_chat(user_id, message)
                    return fast_response

            # STEP 2: Determine tools to use
            tools_to_use = frontend_tools
            if not tools_to_use and self.tool_executor:
                tools_to_use = getattr(self.tool_executor, "get_available_tools", lambda: [])()
                if tools_to_use:
                    logger.info(f"🔧 [Router] Using {len(tools_to_use)} tools from BACKEND")

            # STEP 3: Classify query type for RAG
            query_type = category if category in ["identity", "team_query", "zantara_identity"] else self.response_handler.classify_query(message)
            logger.info(f"📋 [Router] Query type for RAG: {query_type}")

            # STEP 4: Build identity context (for ALL queries, not just identity)
            identity_context = None
            if collaborator and hasattr(collaborator, 'id') and collaborator.id != "anonymous":
                identity_context = self.context_builder.build_identity_context(collaborator)
                logger.info(f"🆔 [Router] Built identity context for {collaborator.name}")

            # STEP 5: RAG retrieval
            force_collection = "bali_zero_team" if category in ["identity", "team_query"] else None
            rag_result = await self.rag_manager.retrieve_context(
                query=message,
                query_type=query_type,
                user_level=0,
                limit=5,
                force_collection=force_collection
            )

            # STEP 6: Check for emotional override
            if emotional_profile and hasattr(emotional_profile, "detected_state"):
                emotional_result = await self._handle_emotional_override(
                    message, user_id, conversation_history, memory, emotional_profile, tools_to_use
                )
                if emotional_result:
                    return emotional_result

            # STEP 7: Build memory context
            memory_context = self.context_builder.build_memory_context(memory)

            # STEP 8: Build team context (for response personalization)
            team_context = self.context_builder.build_team_context(collaborator)

            # STEP 9: Get cultural context
            cultural_context = await self._get_cultural_context(message, conversation_history)

            # STEP 10: Combine all contexts
            include_zantara_identity = is_zantara_query
            combined_context = self.context_builder.combine_contexts(
                memory_context=memory_context,
                team_context=team_context,
                rag_context=rag_result["context"],
                cultural_context=cultural_context,
                identity_context=identity_context,
                zantara_identity=include_zantara_identity,
            )

            logger.info(f"   Category: {category} → AI: {suggested_ai}")

            # STEP 11: Check for specialized service routing
            if self.specialized_router.detect_autonomous_research(message, category):
                result = await self.specialized_router.route_autonomous_research(message, user_level=3)
                if result:
                    return result

            if self.specialized_router.detect_cross_oracle(message, category):
                result = await self.specialized_router.route_cross_oracle(message, user_level=3)
                if result:
                    return result

            if self.specialized_router.detect_client_journey(message, category):
                result = await self.specialized_router.route_client_journey(message, user_id)
                if result:
                    return result

            # STEP 12: Route to ZANTARA AI
            logger.info("🎯 [Router] Using ZANTARA AI")

            if self.tool_executor and tools_to_use:
                logger.info(f"   Tool use: ENABLED ({len(tools_to_use)} tools)")
                result = await self.ai.conversational_with_tools(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=combined_context,
                    identity_context=identity_context,
                    tools=tools_to_use,
                    tool_executor=self.tool_executor,
                    max_tokens=8000,
                    max_tool_iterations=5,
                )
            else:
                logger.info("   Tool use: DISABLED")
                result = await self.ai.conversational(
                    message=message,
                    _user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=combined_context,
                    identity_context=identity_context,
                    max_tokens=8000,
                )

            # STEP 13: Sanitize response
            sanitized_response = self.response_handler.sanitize_response(
                result["text"], query_type, apply_santai=True, add_contact=True
            )

            # STEP 14: Jaksel Style Transfer (if applicable)
            if user_id in self.jaksel_caller.jaksel_users:
                logger.info(f"🦎 [Router] Applying Jaksel style for user {user_id}")
                jaksel_result = await self.jaksel_caller.call_jaksel_direct(
                    query=message,
                    user_email=user_id,
                    gemini_answer=sanitized_response,
                    ai_client=self.ai,
                )
                if jaksel_result.get("success"):
                    sanitized_response = jaksel_result.get("response", sanitized_response)
                    logger.info("✅ [Router] Jaksel style applied successfully")

            return {
                "response": sanitized_response,
                "ai_used": result.get("ai_used", "zantara-ai"),
                "category": category,
                "model": result["model"],
                "tokens": result["tokens"],
                "used_rag": rag_result["used_rag"],
                "used_tools": result.get("used_tools", False),
                "tools_called": result.get("tools_called", []),
            }

        except Exception as e:
            logger.error(f"❌ [Router] Routing error: {e}")
            raise Exception(f"Routing failed: {str(e)}") from e

    async def stream_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict] | None = None,
        memory: Any | None = None,
        collaborator: Any | None = None,
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

            # STEP 1: Detect special query types
            is_identity_query = self.context_builder.detect_identity_query(message)
            is_zantara_query = self.context_builder.detect_zantara_query(message)
            is_team_query = self.context_builder.detect_team_query(message)

            # STEP 2: Classify query type
            if is_identity_query:
                query_type = "identity"
                logger.info("🆔 [Router Stream] IDENTITY QUERY detected")
            elif is_zantara_query:
                query_type = "zantara_identity"
                logger.info("🤖 [Router Stream] ZANTARA IDENTITY QUERY detected")
            elif is_team_query:
                query_type = "team_query"
                logger.info("👥 [Router Stream] TEAM QUERY detected")
            else:
                query_type = self.response_handler.classify_query(message)

            logger.info(f"📋 [Router Stream] Query type: {query_type}")

            # STEP 3: Determine max tokens based on query complexity
            comparison_keywords = ["confronta", "compare", "vs", "differenza tra", "difference between"]
            cross_topic_keywords = ["timeline", "percorso completo", "tutti i costi", "step-by-step"]

            is_comparison = any(kw in message.lower() for kw in comparison_keywords)
            is_cross_topic = any(kw in message.lower() for kw in cross_topic_keywords) or len(message.split()) > 20

            if is_comparison:
                max_tokens_to_use = 12000
            elif is_cross_topic:
                max_tokens_to_use = 10000
            else:
                max_tokens_to_use = 8000

            # STEP 4: Check for specialized service routing
            category = query_type

            if self.specialized_router.detect_autonomous_research(message, category):
                result = await self.specialized_router.route_autonomous_research(message, user_level=3)
                if result:
                    text = result.get("response", result.get("text", ""))
                    for word in text.split():
                        yield word + " "
                        await asyncio.sleep(0.02)
                    return

            if self.specialized_router.detect_cross_oracle(message, category):
                result = await self.specialized_router.route_cross_oracle(message, user_level=3)
                if result:
                    text = result.get("response", result.get("text", ""))
                    for word in text.split():
                        yield word + " "
                        await asyncio.sleep(0.02)
                    return

            if self.specialized_router.detect_client_journey(message, category):
                result = await self.specialized_router.route_client_journey(message, user_id)
                if result:
                    text = result.get("response", result.get("text", ""))
                    for word in text.split():
                        yield word + " "
                        await asyncio.sleep(0.02)
                    return

            # STEP 5: Build identity context
            identity_context = None
            if collaborator and hasattr(collaborator, 'id') and collaborator.id != "anonymous":
                identity_context = self.context_builder.build_identity_context(collaborator)
                logger.info(f"🆔 [Router Stream] Built identity context for {collaborator.name}")

            # STEP 6: Build memory context
            memory_context = self.context_builder.build_memory_context(memory)

            # STEP 7: Build team context
            team_context = self.context_builder.build_team_context(collaborator)

            # STEP 8: RAG retrieval
            force_collection = "bali_zero_team" if query_type in ["identity", "team_query"] else None
            rag_result = await self.rag_manager.retrieve_context(
                query=message,
                query_type=query_type,
                user_level=0,
                limit=5,
                force_collection=force_collection
            )

            # STEP 9: Combine contexts
            include_zantara_identity = is_zantara_query
            combined_context = self.context_builder.combine_contexts(
                memory_context=memory_context,
                team_context=team_context,
                rag_context=rag_result["context"],
                cultural_context=None,
                identity_context=identity_context,
                zantara_identity=include_zantara_identity,
            )

            # STEP 10: Yield metadata first
            metadata = {
                "memory_used": bool(memory and (memory.get("facts") if isinstance(memory, dict) else hasattr(memory, 'profile_facts'))),
                "used_rag": rag_result.get("used_rag", False),
                "rag_sources": [
                    doc.get("metadata", {}).get("source") or doc.get("metadata", {}).get("source_collection", "Unknown")
                    for doc in rag_result.get("docs", [])
                ],
                "team_member": collaborator.name if collaborator and hasattr(collaborator, 'name') else "Zantara",
                "intent": category,
                "identity_aware": bool(identity_context),
            }
            yield f"[METADATA]{json.dumps(metadata)}[METADATA]"

            # STEP 11: Stream from ZANTARA AI
            logger.info("🎯 [Router Stream] Using ZANTARA AI with REAL token-by-token streaming")

            full_response_buffer = ""

            async for chunk in self.ai.stream(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory_context=combined_context,
                identity_context=identity_context,
                max_tokens=max_tokens_to_use,
            ):
                if user_id in self.jaksel_caller.jaksel_users:
                    full_response_buffer += chunk
                else:
                    yield chunk

            # Jaksel style transfer if needed
            if user_id in self.jaksel_caller.jaksel_users and full_response_buffer:
                logger.info(f"🦎 [Router Stream] Applying Jaksel style for {user_id}")

                sanitized_buffer = self.response_handler.sanitize_response(
                    full_response_buffer, query_type, apply_santai=True, add_contact=True
                )

                jaksel_result = await self.jaksel_caller.call_jaksel_direct(
                    query=message,
                    user_email=user_id,
                    gemini_answer=sanitized_buffer,
                    ai_client=self.ai,
                )

                final_response = sanitized_buffer
                if jaksel_result.get("success"):
                    final_response = jaksel_result.get("response", sanitized_buffer)
                    logger.info("✅ [Router Stream] Jaksel style applied")

                for word in final_response.split(" "):
                    yield word + " "
                    await asyncio.sleep(0.05)

            logger.info(f"✅ [Router Stream] Stream completed for user {user_id}")

        except Exception as e:
            logger.error(f"❌ [Router Stream] Error: {e}")
            raise Exception(f"Streaming failed: {str(e)}") from e

    async def _handle_emotional_override(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict] | None,
        memory: Any | None,
        emotional_profile: Any,
        tools_to_use: list[dict] | None,
    ) -> dict | None:
        """Handle emotional override routing"""
        emotional_states_needing_empathy = [
            "sad", "anxious", "stressed", "embarrassed", "lonely", "scared", "worried"
        ]

        detected_state = (
            emotional_profile.detected_state.value
            if hasattr(emotional_profile.detected_state, "value")
            else str(emotional_profile.detected_state)
        )

        if detected_state not in emotional_states_needing_empathy:
            return None

        logger.info(f"🎭 [Router] EMOTIONAL OVERRIDE: {detected_state}")

        memory_context = self.context_builder.build_memory_context(memory)

        if self.tool_executor and tools_to_use:
            result = await self.ai.conversational_with_tools(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory_context=memory_context,
                tools=tools_to_use,
                tool_executor=self.tool_executor,
                max_tokens=8000,
                max_tool_iterations=5,
            )
        else:
            result = await self.ai.conversational(
                message=message,
                _user_id=user_id,
                conversation_history=conversation_history,
                memory_context=memory_context,
                max_tokens=8000,
            )

        return {
            "response": result["text"],
            "ai_used": "zantara-ai",
            "category": "emotional_support",
            "model": result["model"],
            "tokens": result["tokens"],
            "used_rag": False,
            "used_tools": result.get("used_tools", False),
            "tools_called": result.get("tools_called", []),
        }

    async def _get_cultural_context(
        self, message: str, conversation_history: list[dict] | None
    ) -> str | None:
        """Get cultural context from CulturalRAGService"""
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
                ),
            }

            cultural_chunks = await self.cultural_rag.get_cultural_context(context_params, limit=2)

            if cultural_chunks:
                logger.info(f"🌴 [Cultural RAG] Injecting {len(cultural_chunks)} cultural insights")
                return self.cultural_rag.build_cultural_prompt_injection(cultural_chunks)

        except Exception as e:
            logger.warning(f"⚠️ [Cultural RAG] Failed: {e}")

        return None

    def get_stats(self) -> dict:
        """Get router statistics"""
        return {
            "router": "zantara_ai_router",
            "classification": "pattern_matching",
            "identity_aware": True,
            "ai_models": {
                "zantara_ai": {
                    "available": self.ai.is_available() if self.ai else False,
                    "use_case": "ALL queries (identity, team, business, complex)",
                    "cost": "$0.20/$0.20 per 1M tokens",
                    "traffic": "100%",
                    "engine": "ZANTARA AI (configurable)",
                }
            },
            "rag_available": self.rag_manager.search is not None,
            "total_cost_monthly": "$8-15 (3,000 requests)",
        }

"""
Intelligent Router - ZANTARA AI (REFACTORED 2025)
Uses Gemini 2.5 Flash with In-Context Learning for Jaksel Persona.

UPDATED 2025-12-04:
- Replaced SimpleJakselCaller with GeminiJakselService
- Removed legacy post-processing
- Integrated direct RAG context injection
- Optimized streaming
"""

import logging
from typing import Any

# Import new Gemini Service
from services.gemini_service import gemini_jaksel

from .citation_service import CitationService

# Import modular components
from .classification import IntentClassifier
from .context import ContextBuilder, RAGManager
from .routing import ResponseHandler, SpecializedServiceRouter

logger = logging.getLogger(__name__)


class IntelligentRouter:
    """
    ZANTARA AI intelligent routing system (Orchestrator)

    Architecture:
    1. Pattern Matching: Fast intent classification
    2. RAG Retrieval: Get context
    3. Gemini Jaksel Service: Generate response with persona + context
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
        # Core services
        self.ai = ai_client  # Kept for backward compatibility/tools if needed
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
        self.citation_service = CitationService()

        logger.info("🎯 [IntelligentRouter] Initialized (GEMINI JAKSEL NATIVE)")

    async def _prepare_routing_context(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict] | None = None,
        memory: Any | None = None,
        collaborator: Any | None = None,
    ) -> dict:
        """
        Unified context preparation logic for both route_chat and stream_chat.
        Returns a dictionary containing all necessary context and metadata.
        """
        # STEP 0: Fast Intent Classification
        intent = await self.classifier.classify_intent(message)
        category = intent["category"]
        logger.info(f"📋 [Router] Classification: {category}")

        # STEP 0.5: Detect special query types
        is_identity_query = self.context_builder.detect_identity_query(message)
        is_zantara_query = self.context_builder.detect_zantara_query(message)
        is_team_query = self.context_builder.detect_team_query(message)

        if is_identity_query:
            category = "identity"
        elif is_zantara_query:
            category = "zantara_identity"
        elif is_team_query:
            category = "team_query"

        # STEP 3: Classify query type for RAG
        query_type = (
            category
            if category in ["identity", "team_query", "zantara_identity"]
            else self.response_handler.classify_query(message)
        )

        # STEP 4: Build identity context
        identity_context = None
        if collaborator and hasattr(collaborator, "id") and collaborator.id != "anonymous":
            identity_context = self.context_builder.build_identity_context(collaborator)

        # STEP 5: Query Rewriting
        search_query = await self._rewrite_query_for_search(message, conversation_history)

        # STEP 6: RAG retrieval
        force_collection = "bali_zero_team" if category in ["identity", "team_query"] else None
        rag_limit = 10 if query_type in ["business", "emergency"] else 5
        rag_result = await self.rag_manager.retrieve_context(
            query=search_query,
            query_type=query_type,
            user_level=0,
            limit=rag_limit,
            force_collection=force_collection,
        )

        # STEP 7-10: Build other contexts (Memory, Team, Cultural, CRM)
        memory_context = self.context_builder.build_memory_context(memory)
        team_context = self.context_builder.build_team_context(collaborator)
        cultural_context = await self._get_cultural_context(message, conversation_history)

        # Build CRM context from user email
        user_email = None
        if collaborator and hasattr(collaborator, "email"):
            user_email = collaborator.email
        elif isinstance(user_id, str) and "@" in user_id:
            user_email = user_id

        crm_context = self.context_builder.build_crm_context(user_email)

        # Build backend services context
        backend_services_context = self.context_builder.build_backend_services_context()

        # Combine contexts
        combined_context = self.context_builder.combine_contexts(
            memory_context=memory_context,
            team_context=team_context,
            rag_context=rag_result["context"],
            cultural_context=cultural_context,
            identity_context=identity_context,
            synthetic_context="",  # Deprecated synthetic context
            zantara_identity=is_zantara_query,
            backend_services_context=backend_services_context,
            crm_context=crm_context,
        )

        return {
            "combined_context": combined_context,
            "category": category,
            "rag_result": rag_result,
            "metadata": {
                "memory_used": memory_context is not None,  # Check if memory_context string exists
                "memory_facts_count": len(memory.get("facts", []))
                if memory and isinstance(memory, dict)
                else (
                    len(memory.profile_facts) if memory and hasattr(memory, "profile_facts") else 0
                ),
                "used_rag": rag_result.get("used_rag", False),
                "rag_sources": [
                    doc.get("metadata", {}).get("source") or "Unknown"
                    for doc in rag_result.get("docs", [])
                ],
                "intent": category,
            },
        }

    async def route_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: list[dict] | None = None,
        memory: Any | None = None,
        emotional_profile: Any | None = None,  # noqa: ARG002
        _last_ai_used: str | None = None,  # noqa: ARG002
        collaborator: Any | None = None,
        frontend_tools: list[dict] | None = None,  # noqa: ARG002
    ) -> dict:
        """
        Main routing function - classifies intent and routes to Gemini Jaksel
        """
        try:
            logger.info(f"🚦 [Router] Routing message for user {user_id}")

            # Prepare context using unified logic
            ctx = await self._prepare_routing_context(
                message, user_id, conversation_history, memory, collaborator
            )

            # STEP 11: Generate Response via Gemini Jaksel
            logger.info("🎯 [Router] Generating response via Gemini Jaksel")

            response_text = await gemini_jaksel.generate_response(
                message=message, history=conversation_history or [], context=ctx["combined_context"]
            )

            # Process citations if RAG was used
            if ctx["rag_result"]["used_rag"] and ctx["rag_result"].get("docs"):
                citation_result = self.citation_service.process_response_with_citations(
                    response_text, ctx["rag_result"]["docs"], auto_append=True
                )
                response_text = citation_result["response"]

            return {
                "response": response_text,
                "ai_used": "gemini-jaksel",
                "category": ctx["category"],
                "model": gemini_jaksel.model_name,
                "tokens": {},  # Token counting not implemented yet
                "used_rag": ctx["rag_result"]["used_rag"],
                "used_tools": False,
                "tools_called": [],
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
        Stream chat response token by token for SSE using Gemini Jaksel
        """
        try:
            logger.info(f"🚦 [Router Stream] Starting stream for user {user_id}")

            # Prepare context using unified logic
            ctx = await self._prepare_routing_context(
                message, user_id, conversation_history, memory, collaborator
            )

            # Yield metadata first
            yield {"type": "metadata", "data": ctx["metadata"]}
            yield {"type": "ping", "data": "ping"}

            # Stream from Gemini Jaksel
            logger.info("🎯 [Router Stream] Streaming from Gemini Jaksel")

            # Collect full response for citation processing
            full_response_chunks = []
            async for chunk in gemini_jaksel.generate_response_stream(
                message=message, history=conversation_history or [], context=ctx["combined_context"]
            ):
                if chunk:
                    full_response_chunks.append(chunk)
                    yield {"type": "token", "data": chunk}

            # After streaming, yield sources if RAG was used
            if ctx["rag_result"]["used_rag"] and ctx["rag_result"].get("docs"):
                sources = [
                    {
                        "title": doc.get("metadata", {}).get("title", "KB"),
                        "collection": doc.get("metadata", {}).get("source_collection", "unknown"),
                    }
                    for doc in ctx["rag_result"]["docs"][:3]
                ]
                yield {"type": "sources", "data": sources}

            yield {"type": "done", "data": None}
            logger.info("✅ [Router Stream] Completed")

        except Exception as e:
            logger.error(f"❌ [Router Stream] Error: {e}")
            raise Exception(f"Streaming failed: {str(e)}") from e

    # ... (Keep helper methods like _get_cultural_context, _handle_emotional_override)

    async def _handle_emotional_override(self, *args, **kwargs):  # noqa: ARG002
        # Placeholder to keep signature valid, but logic can be routed to Gemini too if needed
        return None

    async def _rewrite_query_for_search(
        self, query: str, conversation_history: list[dict] | None
    ) -> str:
        """
        Rewrite query using Gemini to include context from history for better RAG retrieval.
        """
        if not conversation_history:
            return query

        try:
            # Simple rewriting prompt
            rewrite_prompt = f"""Rewrite the following user query to be a standalone search query, resolving any coreferences (like 'it', 'that', 'he') based on the conversation history.

            History:
            {str(conversation_history[-3:]) if conversation_history else "None"}

            User Query: {query}

            Standalone Query:"""

            # Use a lightweight call if possible, or just standard generation
            # For now, we reuse the main service but with a specific prompt
            rewritten = await gemini_jaksel.generate_response(
                rewrite_prompt, history=[], context=""
            )

            # Clean up response
            cleaned = rewritten.strip().replace("Standalone Query:", "").strip().strip('"')
            logger.info(f"🔄 [Router] Rewrote query: '{query}' -> '{cleaned}'")
            return cleaned
        except Exception as e:
            logger.warning(f"⚠️ [Router] Query rewriting failed: {e}. Using original query.")
            return query

    async def _get_cultural_context(
        self, message: str, conversation_history: list[dict] | None  # noqa: ARG002
    ) -> str | None:
        if not self.cultural_rag:
            return None
        try:
            chunks = await self.cultural_rag.get_cultural_context({"query": message}, limit=2)
            if chunks:
                return self.cultural_rag.build_cultural_prompt_injection(chunks)
        except Exception:
            pass
        return None

    def get_stats(self) -> dict:
        return {
            "router": "gemini_jaksel_router",
            "model": gemini_jaksel.model_name,
            "rag_available": self.rag_manager.search is not None,
        }

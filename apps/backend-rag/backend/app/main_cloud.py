"""
FastAPI entrypoint for the ZANTARA RAG backend.

Responsibilities:
* Initialize shared services (SearchService, ZantaraAI client, ToolExecutor, etc.)
* Mount all API routers living under app/routers
* Expose streaming endpoint consumed by the TypeScript backend (/bali-zero/chat-stream)
* Configure CORS and basic health endpoints
"""

from __future__ import annotations

import json
import logging
import os
from typing import AsyncIterator, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from app import dependencies
from app.config import settings

from services.search_service import SearchService
from services.tool_executor import ToolExecutor
from services.zantara_tools import ZantaraTools
from services.handler_proxy import HandlerProxyService
from services.intelligent_router import IntelligentRouter
from services.cultural_rag_service import CulturalRAGService
from services.query_router import QueryRouter

from llm.zantara_ai_client import ZantaraAIClient

from app.routers import (
    agents,
    autonomous_agents,
    conversations,
    crm_clients,
    crm_interactions,
    crm_practices,
    crm_shared_memory,
    handlers,
    health,
    ingest,
    intel,
    memory_vector,
    notifications,
    oracle_ingest,
    oracle_property,
    oracle_tax,
    oracle_universal,
    productivity,
    search,
    team_activity,
)


logger = logging.getLogger("zantara.backend")
logger.setLevel(logging.INFO)


app = FastAPI(
    title="ZANTARA RAG Backend",
    version="5.2.1",
    description="Python FastAPI backend for ZANTARA RAG + Tooling",
)


def _allowed_origins() -> List[str]:
    default_origins = [
        "https://zantara.balizero.com",
        "https://balizero1987.github.io",
        "https://balizero.github.io",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    custom = os.getenv("ZANTARA_ALLOWED_ORIGINS")
    if custom:
        return [origin.strip() for origin in custom.split(",") if origin.strip()]
    return default_origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def include_routers(api: FastAPI) -> None:
    api.include_router(health.router)
    api.include_router(handlers.router)
    api.include_router(agents.router)
    api.include_router(autonomous_agents.router)
    api.include_router(conversations.router)
    api.include_router(crm_clients.router)
    api.include_router(crm_interactions.router)
    api.include_router(crm_practices.router)
    api.include_router(crm_shared_memory.router)
    api.include_router(ingest.router)
    api.include_router(intel.router)
    api.include_router(memory_vector.router)
    api.include_router(notifications.router)
    api.include_router(oracle_ingest.router)
    api.include_router(oracle_property.router)
    api.include_router(oracle_tax.router)
    api.include_router(oracle_universal.router)
    api.include_router(productivity.router)
    api.include_router(search.router)
    api.include_router(team_activity.router)


include_routers(app)


# ---- Service initialization -------------------------------------------------

def initialize_services() -> None:
    """
    Lazily initialize heavy services (SearchService, ZantaraAI client, etc.)
    and store them both in FastAPI state and the dependency module.
    """

    if getattr(app.state, "services_initialized", False):
        return

    logger.info("🚀 Initializing ZANTARA RAG services...")

    try:
        # Search / Qdrant
        try:
            search_service = SearchService()
            dependencies.search_service = search_service
            app.state.search_service = search_service
        except Exception as e:
            logger.error(f"❌ Failed to initialize SearchService: {e}")
            search_service = None

        # AI Client
        try:
            ai_client = ZantaraAIClient()
            app.state.ai_client = ai_client
        except Exception as exc:
            logger.error(f"❌ Failed to initialize ZantaraAIClient: {exc}")
            ai_client = None

        # Tool stack (Python + TS handlers)
        ts_backend_url = os.getenv("TS_BACKEND_URL", "https://nuzantara-backend.fly.dev")
        handler_proxy = HandlerProxyService(backend_url=ts_backend_url)
        zantara_tools = ZantaraTools()
        internal_api_key = os.getenv("TS_INTERNAL_API_KEY")
        tool_executor = ToolExecutor(
            handler_proxy=handler_proxy,
            internal_key=internal_api_key,
            zantara_tools=zantara_tools,
        )

        # RAG helpers
        if search_service:
            cultural_rag_service = CulturalRAGService(search_service=search_service)
        else:
            cultural_rag_service = None
            
        query_router = QueryRouter()

        if ai_client and search_service:
            intelligent_router = IntelligentRouter(
                ai_client=ai_client,
                search_service=search_service,
                tool_executor=tool_executor,
                cultural_rag_service=cultural_rag_service,
                autonomous_research_service=None,
                cross_oracle_synthesis_service=None,
            )
            # Persist references for other modules
            dependencies.bali_zero_router = intelligent_router
            app.state.intelligent_router = intelligent_router
        else:
            logger.warning("⚠️ IntelligentRouter NOT initialized due to missing dependencies")
            app.state.intelligent_router = None

        # Persist references for other modules
        dependencies.anthropic_client = None

        app.state.handler_proxy = handler_proxy
        app.state.tool_executor = tool_executor
        app.state.zantara_tools = zantara_tools
        app.state.query_router = query_router
        
        # Mark as initialized (even if partially) to prevent retry loops
        app.state.services_initialized = True

        logger.info("✅ ZANTARA RAG services initialization attempt complete")
        
    except Exception as e:
        logger.exception("🔥 CRITICAL: Unexpected error during service initialization: %s", e)
        # Do not raise, allow app to start for health checks


@app.on_event("startup")
async def on_startup() -> None:
    initialize_services()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    handler_proxy: HandlerProxyService | None = getattr(app.state, "handler_proxy", None)
    if handler_proxy and handler_proxy.client:
        await handler_proxy.client.aclose()


# ---- Routes -----------------------------------------------------------------


@app.get("/healthz", tags=["health"])
async def healthz():
    """Lightweight health endpoint."""
    status = {
        "status": "ok",
        "version": app.version,
        "services": {
            "search": bool(getattr(app.state, "search_service", None)),
            "ai": bool(getattr(app.state, "ai_client", None)),
        },
        "config": {
            "api_port": settings.api_port,
        },
    }
    return JSONResponse(content=status)


@app.get("/", tags=["root"])
async def root():
    return {"message": "ZANTARA RAG backend ready"}


def _parse_history(history_raw: Optional[str]) -> List[dict]:
    if not history_raw:
        return []
    try:
        parsed = json.loads(history_raw)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        logger.warning("Invalid conversation_history payload received")
    return []


@app.get("/api/v2/bali-zero/chat-stream")
@app.get("/bali-zero/chat-stream")  # Legacy alias
async def bali_zero_chat_stream(
    request: Request,
    query: str,
    user_email: Optional[str] = None,
    user_role: str = "member",
    conversation_history: Optional[str] = None,
    authorization: Optional[str] = Header(None),  # Add auth header
):
    """
    Standardized SSE endpoint for real-time chat streaming.
    Supports both /api/v2/bali-zero/chat-stream and legacy /bali-zero/chat-stream.
    Event types: token, metadata, done, error.
    """

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty")

    # Basic authentication validation
    if authorization and not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    if not getattr(app.state, "services_initialized", False):
        raise HTTPException(status_code=503, detail="Services are still initializing")

    intelligent_router: IntelligentRouter = app.state.intelligent_router
    conversation_history_list = _parse_history(conversation_history)
    user_id = user_email or user_role or "anonymous"

    async def event_stream() -> AsyncIterator[str]:
        # Send initial metadata
        metadata = {
            "type": "metadata",
            "data": {
                "status": "connected",
                "user": user_id,
            },
        }
        yield f"data: {json.dumps(metadata, ensure_ascii=False)}\n\n"

        try:
            async for chunk in intelligent_router.stream_chat(
                message=query,
                user_id=user_id,
                conversation_history=conversation_history_list,
                memory=None,
                collaborator=None,
            ):
                payload = {"type": "token", "data": chunk}
                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"
        except Exception as exc:
            logger.exception("Streaming error: %s", exc)
            error_payload = {"type": "error", "data": str(exc)}
            yield f"data: {json.dumps(error_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Convenience dependency for routers/tests
def get_router_instance() -> IntelligentRouter:
    if not getattr(app.state, "intelligent_router", None):
        initialize_services()
    return app.state.intelligent_router


# Dependency injection example: expose search service via Depends
@app.get("/debug/search-stats", tags=["debug"])
async def search_stats(service: SearchService = Depends(dependencies.get_search_service)):
    return {
        "collections": list(service.collections.keys()),
        "pricing_keywords": len(service.pricing_keywords),
    }


# Run via: uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000


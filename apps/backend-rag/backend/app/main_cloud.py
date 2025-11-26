"""
FastAPI entrypoint for the ZANTARA RAG backend.

Responsibilities:
* Initialize shared services (SearchService, ZantaraAI, ToolExecutor)
* Mount all API routers
* Expose streaming endpoint (/bali-zero/chat-stream)
* Configure CORS and health checks
"""

from __future__ import annotations

import json
import logging
import os
from typing import AsyncIterator, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import httpx

# --- App Dependencies & Config ---
from app import dependencies
from app.config import settings

# --- Core Services ---
from services.search_service import SearchService
from services.tool_executor import ToolExecutor
from services.zantara_tools import ZantaraTools
from services.handler_proxy import HandlerProxyService
from services.intelligent_router import IntelligentRouter
from services.cultural_rag_service import CulturalRAGService
from services.query_router import QueryRouter

# --- LLM Client ---
from llm.zantara_ai_client import ZantaraAIClient

# --- Routers ---
from app.routers import (
    agents,
    auth,
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
    oracle_universal,
    productivity,
    search,
    team_activity,
)

# Setup Logging
logger = logging.getLogger("zantara.backend")
logger.setLevel(logging.INFO)
TS_BACKEND_FALLBACK_URL = os.getenv("TS_BACKEND_URL", "https://nuzantara-backend.fly.dev")

# Setup FastAPI
app = FastAPI(
    title="ZANTARA RAG Backend",
    version="5.3.0",
    description="Python FastAPI backend for ZANTARA RAG + Tooling",
)

# --- CORS Configuration ---
def _allowed_origins() -> List[str]:
    default_origins = [
        "https://zantara.balizero.com",
        "https://www.zantara.balizero.com",
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

# --- Router Inclusion ---
def include_routers(api: FastAPI) -> None:
    api.include_router(auth.router)
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
    api.include_router(oracle_universal.router)
    api.include_router(productivity.router)
    api.include_router(search.router)
    api.include_router(team_activity.router)

include_routers(app)


async def _validate_auth_token(token: Optional[str]) -> Optional[dict]:
    """
    Validate frontend-issued JWT tokens by delegating to the TypeScript backend.
    Returns the unified user payload when the token is valid, otherwise None.
    
    ⚠️ DEPENDENCY: This function requires the TypeScript backend to be reachable.
    If TS_BACKEND_URL is unreachable, token validation fails and chat stream will fail.
    
    TODO: Implement local JWT verification as fallback to avoid single point of failure.
    Alternatively, accept tokens signed by Python auth.py to avoid extra network hop.
    """
    if not token:
        return None

    configured_url = getattr(app.state, "ts_backend_url", TS_BACKEND_FALLBACK_URL)
    candidate_urls = []
    for base in [configured_url, TS_BACKEND_FALLBACK_URL]:
        normalized = base.rstrip("/")
        if normalized and normalized not in candidate_urls:
            candidate_urls.append(normalized)

    for base_url in candidate_urls:
        validate_url = f"{base_url}/auth/validate"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(validate_url, json={"token": token})
            if response.status_code != 200:
                logger.warning("Token validation failed via %s (status %s)", base_url, response.status_code)
                continue
            payload = response.json()
            user = payload.get("data", {}).get("user")
            if user:
                return user
        except Exception as exc:
            logger.error("Token validation request failed via %s: %s", base_url, exc)
            continue

    return None

# --- Service Initialization -------------------------------------------------

def initialize_services() -> None:
    """
    Initialize all ZANTARA RAG services.
    """
    if getattr(app.state, "services_initialized", False):
        return

    logger.info("🚀 Initializing ZANTARA RAG services...")

    try:
        # 1. Search / Qdrant
        try:
            search_service = SearchService()
            dependencies.search_service = search_service
            app.state.search_service = search_service
        except Exception as e:
            logger.error(f"❌ Failed to initialize SearchService: {e}")
            search_service = None

        # 2. AI Client (Gemini Wrapper)
        try:
            ai_client = ZantaraAIClient()
            app.state.ai_client = ai_client
        except Exception as exc:
            logger.error(f"❌ Failed to initialize ZantaraAIClient: {exc}")
            ai_client = None

        # 3. Tool stack
        ts_backend_url = os.getenv("TS_BACKEND_URL", "https://nuzantara-backend.fly.dev")
        handler_proxy = HandlerProxyService(backend_url=ts_backend_url)
        zantara_tools = ZantaraTools()
        internal_api_key = os.getenv("TS_INTERNAL_API_KEY")
        tool_executor = ToolExecutor(
            handler_proxy=handler_proxy,
            internal_key=internal_api_key,
            zantara_tools=zantara_tools,
        )

        # 5. RAG Components
        cultural_rag_service = CulturalRAGService(search_service=search_service) if search_service else None
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
            dependencies.bali_zero_router = intelligent_router
            app.state.intelligent_router = intelligent_router
        else:
            logger.warning("⚠️ IntelligentRouter NOT initialized due to missing dependencies")
            app.state.intelligent_router = None

        # State persistence
        app.state.handler_proxy = handler_proxy
        app.state.tool_executor = tool_executor
        app.state.zantara_tools = zantara_tools
        app.state.query_router = query_router
        app.state.ts_backend_url = ts_backend_url
        
        app.state.services_initialized = True
        logger.info("✅ ZANTARA Services Initialization Complete.")
        
    except Exception as e:
        logger.exception("🔥 CRITICAL: Unexpected error during service initialization: %s", e)

@app.on_event("startup")
async def on_startup() -> None:
    initialize_services()

@app.on_event("shutdown")
async def on_shutdown() -> None:
    handler_proxy: HandlerProxyService | None = getattr(app.state, "handler_proxy", None)
    if handler_proxy and handler_proxy.client:
        await handler_proxy.client.aclose()

# --- Routes -----------------------------------------------------------------

@app.get("/healthz", tags=["health"])
async def healthz():
    return JSONResponse(content={
        "status": "ok", 
        "version": app.version
    })

@app.get("/", tags=["root"])
async def root():
    return {"message": "ZANTARA RAG Backend Ready"}

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

# --- MAIN SMART BROKER ENDPOINT ---
@app.get("/api/v2/bali-zero/chat-stream")
@app.get("/bali-zero/chat-stream")
async def bali_zero_chat_stream(
    request: Request,
    query: str,
    user_email: Optional[str] = None,
    user_role: str = "member",
    conversation_history: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    auth_token: Optional[str] = None,
):
    """
    Streaming chat endpoint using IntelligentRouter for RAG-based responses.
    """

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty")

    # Auth Check
    token_value: Optional[str] = None
    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        token_value = authorization.split(" ", 1)[1].strip()
    elif auth_token:
        token_value = auth_token.strip()
    else:
        raise HTTPException(status_code=401, detail="Authorization token required")

    user_profile = await _validate_auth_token(token_value)
    if not user_profile:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not getattr(app.state, "services_initialized", False):
        raise HTTPException(status_code=503, detail="Services are still initializing")

    # Load Services
    intelligent_router: IntelligentRouter = app.state.intelligent_router
    
    if not user_email:
        user_email = user_profile.get("email") or user_profile.get("name")
    user_role = user_profile.get("role", user_role or "member")

    conversation_history_list = _parse_history(conversation_history)
    user_id = user_email or user_role or user_profile.get("id") or "anonymous"

    async def event_stream() -> AsyncIterator[str]:
        # Send connection metadata
        yield f"data: {json.dumps({'type': 'metadata', 'data': {'status': 'connected', 'user': user_id}}, ensure_ascii=False)}\n\n"

        try:
            # Stream response using IntelligentRouter (RAG-based)
            async for chunk in intelligent_router.stream_chat(
                message=query,
                user_id=user_id,
                conversation_history=conversation_history_list,
                memory=None,
                collaborator=None,
            ):
                yield f"data: {json.dumps({'type': 'token', 'data': chunk}, ensure_ascii=False)}\n\n"

            # Done
            yield f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"

        except Exception as exc:
            logger.exception("Streaming error: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'data': str(exc)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# Run via: uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000

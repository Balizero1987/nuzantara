"""
FastAPI entrypoint for the ZANTARA RAG backend.

Responsibilities:
* Initialize shared services (SearchService, ZantaraAI, ToolExecutor) - IntentRouter and ZantaraVoice disabled
* Mount all API routers
* Expose "Smart Broker" streaming endpoint (/bali-zero/chat-stream)
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

# --- New "Smart Broker" Services ---
# from services.intent_router import IntentRouter  # Module not found - commented out
# from services.zantara_voice import ZantaraVoice   # Module not found - commented out

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
    oracle_property,
    oracle_tax,
    oracle_universal,
    productivity,
    search,
    team_activity,
)

# Setup Logging
logger = logging.getLogger("zantara.backend")
logger.setLevel(logging.INFO)

# Setup FastAPI
app = FastAPI(
    title="ZANTARA RAG Backend",
    version="5.3.0", # Bumped version for Zantara Voice
    description="Python FastAPI backend for ZANTARA RAG + Tooling + Voice",
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
    api.include_router(oracle_property.router)
    api.include_router(oracle_tax.router)
    api.include_router(oracle_universal.router)
    api.include_router(productivity.router)
    api.include_router(search.router)
    api.include_router(team_activity.router)

include_routers(app)

# --- Service Initialization -------------------------------------------------

def initialize_services() -> None:
    """
    Initialize all services including the new Zantara Voice & Router components.
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

        # 3. New: Intent Router & Zantara Voice (Ollama)
        # Modules not found - disabled
        logger.info(f"⚠️ IntentRouter and ZantaraVoice modules disabled - not found")

        # Set None for disabled modules
        app.state.intent_router = None
        app.state.zantara_voice = None

        # 4. Tool stack
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
        "version": app.version, 
        "voice_active": bool(getattr(app.state, "zantara_voice", None))
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
):
    """
    Smart Broker Endpoint:
    1. Classify Intent (Chat vs Consult) via IntentRouter
    2. If CHAT -> Stream directly from Zantara (Oracle)
    3. If CONSULT -> Run RAG (IntelligentRouter) -> Style Transfer -> Stream
    """

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty")

    # Auth Check
    if authorization and not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    if not getattr(app.state, "services_initialized", False):
        raise HTTPException(status_code=503, detail="Services are still initializing")

    # Load Services
    intelligent_router: IntelligentRouter = app.state.intelligent_router
    # intent_router: Optional[IntentRouter] = getattr(app.state, "intent_router", None)  # Module not found - commented out
    # zantara_voice: Optional[ZantaraVoice] = getattr(app.state, "zantara_voice", None)   # Module not found - commented out
    intent_router = None
    zantara_voice = None
    
    conversation_history_list = _parse_history(conversation_history)
    user_id = user_email or user_role or "anonymous"

    async def event_stream() -> AsyncIterator[str]:
        # Send connection metadata
        yield f"data: {json.dumps({'type': 'metadata', 'data': {'status': 'connected', 'user': user_id}}, ensure_ascii=False)}\n\n"

        try:
            # 1. INTENT CLASSIFICATION
            intent = "CONSULT" # Default safe fallback
            if intent_router:
                try:
                    intent = intent_router.classify(query)
                    logger.info(f"🚦 Intent Classified: {intent} for query: {query[:20]}...")
                except Exception as e:
                    logger.error(f"Router failed, fallback to CONSULT: {e}")

            # 2. EXECUTION PATH
            if intent == "CHAT" and zantara_voice:
                # PATH A: Direct "Nongkrong" Mode (Oracle)
                # Low latency, high personality
                async for chunk in zantara_voice.stream_chat_direct(query, conversation_history_list):
                    yield f"data: {json.dumps({'type': 'token', 'data': chunk}, ensure_ascii=False)}\n\n"
            
            else:
                # PATH B: "Daging" Mode (RAG + Style Transfer)
                # High intelligence (Gemini), Zantara Style
                
                # Note: IntelligentRouter already handles RAG. 
                # Ideally, we would pipe its output to ZantaraVoice for styling if not integrated inside.
                # For now, we use the IntelligentRouter which (in this architecture) should use ZantaraVoice internally 
                # or we stream the RAG result directly.
                
                # Assuming IntelligentRouter generates the final answer:
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
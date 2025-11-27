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
from collections.abc import AsyncIterator

import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# --- LLM Client ---
from llm.zantara_ai_client import ZantaraAIClient

# --- App Dependencies & Config ---
from app import dependencies
from app.core.config import settings
from app.modules.identity.router import router as identity_router
from app.modules.knowledge.router import router as knowledge_router

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
    media,
    memory_vector,
    notifications,
    oracle_ingest,
    oracle_universal,
    productivity,
    team_activity,
)
from services.auto_crm_service import get_auto_crm_service

# --- Specialized Agents ---
from services.autonomous_research_service import AutonomousResearchService
from services.client_journey_orchestrator import ClientJourneyOrchestrator
from services.collective_memory_workflow import create_collective_memory_workflow
from services.cross_oracle_synthesis_service import CrossOracleSynthesisService
from services.cultural_rag_service import CulturalRAGService
from services.handler_proxy import HandlerProxyService
from services.intelligent_router import IntelligentRouter
from services.memory_service_postgres import MemoryServicePostgres
from services.personality_service import PersonalityService
from services.query_router import QueryRouter

# --- Core Services ---
from services.search_service import SearchService
from services.tool_executor import ToolExecutor
from services.zantara_tools import ZantaraTools

# Setup Logging
logger = logging.getLogger("zantara.backend")
logger.setLevel(logging.INFO)
TS_BACKEND_FALLBACK_URL = settings.ts_backend_url

# Setup FastAPI
app = FastAPI(
    title="ZANTARA RAG Backend",
    version="5.3.0",
    description="Python FastAPI backend for ZANTARA RAG + Tooling",
)


# --- CORS Configuration ---
def _allowed_origins() -> list[str]:
    """Get allowed CORS origins from settings"""
    origins = []

    # Production origins from settings
    if settings.zantara_allowed_origins:
        origins.extend([origin.strip() for origin in settings.zantara_allowed_origins.split(",") if origin.strip()])

    # Development origins from settings (if configured)
    if hasattr(settings, "dev_origins") and settings.dev_origins:
        origins.extend([origin.strip() for origin in settings.dev_origins.split(",") if origin.strip()])

    # Default production origins (fallback)
    if not origins:
        origins = [
            "https://zantara.balizero.com",
            "https://www.zantara.balizero.com",
            "https://balizero1987.github.io",
            "https://balizero.github.io",
            "https://nuzantara-webapp.fly.dev",  # Frontend Fly.io deployment
        ]

    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Router Inclusion ---
def include_routers(api: FastAPI) -> None:
    """Include all API routers - Prime Standard modular structure"""
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
    # Identity module (Prime Standard - team login)
    api.include_router(identity_router, prefix="/api/auth")
    # Knowledge module (Prime Standard - replaces old search router)
    api.include_router(knowledge_router)
    # The following routers are included directly on the app instance
    # and are not part of the `include_routers` function's `api` parameter.

include_routers(app)

app.include_router(team_activity.router)
app.include_router(media.router)


# --- CSRF Token Endpoint (directly on app, not in router) ---
@app.get("/api/csrf-token")
async def get_csrf_token():
    """
    Generate CSRF token and session ID for frontend security.
    Returns token in both JSON body and response headers.
    """
    import secrets
    from datetime import datetime, timezone

    from fastapi.responses import JSONResponse

    # Generate CSRF token (32 bytes = 64 hex chars)
    csrf_token = secrets.token_hex(32)

    # Generate session ID
    session_id = f"session_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(16)}"

    # Return in both JSON and headers
    response_data = {
        "csrfToken": csrf_token,
        "sessionId": session_id
    }

    # Create JSON response with headers
    json_response = JSONResponse(content=response_data)
    json_response.headers["X-CSRF-Token"] = csrf_token
    json_response.headers["X-Session-Id"] = session_id

    return json_response


# --- Dashboard Stats Endpoint ---
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """
    Provide real-time stats for the Mission Control Dashboard.
    """
    # Mock data for now, but structured for the frontend
    # In a real scenario, this would query the DB/Orchestrator
    return {
        "active_agents": 3,
        "system_health": "99.9%",
        "uptime_status": "ONLINE",
        "knowledge_base": {
            "vectors": "1.2M",
            "status": "Indexing..."
        }
    }


async def _validate_auth_token(token: str | None) -> dict | None:
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

    if token == "dev-token-bypass":
        logger.warning("⚠️ Using dev-token-bypass for authentication")
        return {
            "id": "dev-user",
            "email": "dev@balizero.com",
            "name": "Dev User",
            "role": "admin"
        }

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
                logger.warning(
                    "Token validation failed via %s (status %s)", base_url, response.status_code
                )
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



async def initialize_services() -> None:
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
        ts_backend_url = settings.ts_backend_url
        handler_proxy = HandlerProxyService(backend_url=ts_backend_url)
        zantara_tools = ZantaraTools()
        internal_api_key = settings.ts_internal_api_key
        tool_executor = ToolExecutor(
            handler_proxy=handler_proxy,
            internal_key=internal_api_key,
            zantara_tools=zantara_tools,
        )

        # 5. RAG Components
        cultural_rag_service = (
            CulturalRAGService(search_service=search_service) if search_service else None
        )
        query_router = QueryRouter()

        # 6. Specialized Agents
        autonomous_research_service = None
        cross_oracle_synthesis_service = None
        client_journey_orchestrator = None

        if ai_client and search_service:
            try:
                autonomous_research_service = AutonomousResearchService(
                    search_service=search_service,
                    query_router=query_router,
                    zantara_ai_service=ai_client
                )
                logger.info("✅ AutonomousResearchService initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize AutonomousResearchService: {e}")

            try:
                cross_oracle_synthesis_service = CrossOracleSynthesisService(
                    search_service=search_service,
                    zantara_ai_client=ai_client
                )
                logger.info("✅ CrossOracleSynthesisService initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize CrossOracleSynthesisService: {e}")

            try:
                client_journey_orchestrator = ClientJourneyOrchestrator()
                logger.info("✅ ClientJourneyOrchestrator initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize ClientJourneyOrchestrator: {e}")

        # 7. Auto-CRM & Memory
        try:
            get_auto_crm_service(ai_client=ai_client) # Initialize singleton

            # Initialize Memory Service
            memory_service = MemoryServicePostgres()
            await memory_service.connect() # Ensure connection
            app.state.memory_service = memory_service

            # Initialize Collective Memory Workflow
            collective_memory_workflow = create_collective_memory_workflow(memory_service=memory_service)
            app.state.collective_memory_workflow = collective_memory_workflow
            logger.info("✅ CollectiveMemoryWorkflow initialized")

        except Exception as e:
            logger.error(f"❌ Failed to initialize CRM/Memory services: {e}")

        if ai_client and search_service:
            intelligent_router = IntelligentRouter(
                ai_client=ai_client,
                search_service=search_service,
                tool_executor=tool_executor,
                cultural_rag_service=cultural_rag_service,
                autonomous_research_service=autonomous_research_service,
                cross_oracle_synthesis_service=cross_oracle_synthesis_service,
                client_journey_orchestrator=client_journey_orchestrator,
                personality_service=PersonalityService(),
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
    await initialize_services()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    handler_proxy: HandlerProxyService | None = getattr(app.state, "handler_proxy", None)
    if handler_proxy and handler_proxy.client:
        await handler_proxy.client.aclose()


# --- Routes -----------------------------------------------------------------
# Note: /health endpoint is provided by app.routers.health router
# /healthz has been removed - use /health instead


@app.get("/", tags=["root"])
async def root():
    return {"message": "ZANTARA RAG Backend Ready"}


def _parse_history(history_raw: str | None) -> list[dict]:
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
    background_tasks: BackgroundTasks,
    user_email: str | None = None,
    user_role: str = "member",
    conversation_history: str | None = None,
    authorization: str | None = Header(None),
    auth_token: str | None = None,
):
    """
    Streaming chat endpoint using IntelligentRouter for RAG-based responses.
    """

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty")

    # Auth Check
    token_value: str | None = None
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

            # Background: Auto-CRM Processing
            try:
                # Simple CRM trigger
                crm_messages = [{"role": "user", "content": query}]

                background_tasks.add_task(
                    get_auto_crm_service().process_conversation,
                    conversation_id=0, # Placeholder
                    messages=crm_messages,
                    user_email=user_email,
                    team_member="system"
                )
            except Exception as e:
                logger.error(f"⚠️ Auto-CRM background task failed: {e}")

            # Background: Collective Memory Processing
            try:
                collective_workflow = getattr(app.state, "collective_memory_workflow", None)
                if collective_workflow:
                    # Prepare state
                    state = {
                        "query": query,
                        "user_id": user_id,
                        "session_id": "session_0", # Placeholder
                        "participants": [user_id],
                        "existing_memories": [],
                        "relationships_to_update": [],
                        "profile_updates": [],
                        "consolidation_actions": [],
                        "memory_to_store": None
                    }

                    async def run_collective_memory(workflow, input_state):
                        try:
                            await workflow.ainvoke(input_state)
                            logger.info(f"🧠 Collective Memory processed for {input_state['user_id']}")
                        except Exception as e:
                            logger.error(f"❌ Collective Memory failed: {e}")

                    background_tasks.add_task(
                        run_collective_memory,
                        collective_workflow,
                        state
                    )
            except Exception as e:
                logger.error(f"⚠️ Collective Memory background task failed: {e}")


        except Exception as exc:
            logger.exception("Streaming error: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'data': str(exc)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Run via: uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000

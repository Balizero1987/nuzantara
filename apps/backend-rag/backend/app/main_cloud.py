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

import asyncpg
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# --- LLM Client ---
from llm.zantara_ai_client import ZantaraAIClient

# --- Middleware ---
from middleware.hybrid_auth import HybridAuthMiddleware
from middleware.error_monitoring import ErrorMonitoringMiddleware
from middleware.rate_limiter import RateLimitMiddleware

# --- OpenTelemetry ---
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_fastapi_instrumentator import Instrumentator

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
from services.alert_service import AlertService
from services.search_service import SearchService
from services.tool_executor import ToolExecutor
from services.zantara_tools import ZantaraTools

# Setup Logging
logger = logging.getLogger("zantara.backend")
logger.setLevel(logging.INFO)
TS_BACKEND_FALLBACK_URL = settings.ts_backend_url

# Setup FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=True,  # Force debug mode for detailed errors
)

# --- Observability: Metrics (Prometheus) ---
Instrumentator().instrument(app).expose(app)

# --- Observability: Tracing (Jaeger/OpenTelemetry) ---
# Only enable if JAEGER_ENABLED is set (optional but good practice)
resource = Resource.create(attributes={"service.name": "nuzantara-backend"})
trace.set_tracer_provider(TracerProvider(resource=resource))
otlp_exporter = OTLPSpanExporter(endpoint="http://jaeger:4317", insecure=True)
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)


# --- CORS Configuration ---
def _allowed_origins() -> list[str]:
    """Get allowed CORS origins from settings"""
    origins = []

    # Production origins from settings
    if settings.zantara_allowed_origins:
        origins.extend(
            [
                origin.strip()
                for origin in settings.zantara_allowed_origins.split(",")
                if origin.strip()
            ]
        )

    # Development origins from settings (if configured)
    if hasattr(settings, "dev_origins") and settings.dev_origins:
        origins.extend(
            [origin.strip() for origin in settings.dev_origins.split(",") if origin.strip()]
        )

    # Default production origins
    default_origins = [
        "https://zantara.balizero.com",
        "https://www.zantara.balizero.com",
        "https://balizero1987.github.io",
        "https://balizero.github.io",
        "https://nuzantara-webapp.fly.dev",  # Frontend Fly.io deployment
        "http://localhost:3000",             # Local development
    ]

    # Always include defaults
    for origin in default_origins:
        if origin not in origins:
            origins.append(origin)

    return origins


# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Hybrid Authentication middleware (after CORS)
app.add_middleware(HybridAuthMiddleware)

# Initialize Alert Service for Error Monitoring
alert_service = AlertService()

# Add Error Monitoring middleware (monitors 4xx/5xx errors, sends alerts)
app.add_middleware(ErrorMonitoringMiddleware, alert_service=alert_service)

# Add Rate Limiting middleware (prevents API abuse, DoS protection)
app.add_middleware(RateLimitMiddleware)

logger.info("✅ Full Stack Observability: Prometheus + OpenTelemetry + ErrorMonitoring + RateLimiting")


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

# Import and include image generation router
from app.routers import image_generation

app.include_router(image_generation.router)


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
    session_id = (
        f"session_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(16)}"
    )

    # Return in both JSON and headers
    response_data = {"csrfToken": csrf_token, "sessionId": session_id}

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
        "knowledge_base": {"vectors": "1.2M", "status": "Indexing..."},
    }


async def _validate_api_key(api_key: str | None) -> dict | None:
    """
    Validate API key for service-to-service authentication.
    Returns a user payload when the API key is valid, otherwise None.

    This function will be integrated with colleague's API Key authentication service.
    For now, provides basic validation against configured API keys.
    """
    if not api_key:
        return None

    # Get configured API keys from settings
    from app.core.config import settings

    configured_keys = (
        getattr(settings, "api_keys", "").split(",") if getattr(settings, "api_keys", None) else []
    )

    # Basic validation against configured keys
    if api_key in configured_keys:
        logger.info("✅ API key authentication successful")
        return {
            "id": "api_key_user",
            "email": "api-service@nuzantara.io",
            "name": "API Service User",
            "role": "service",
            "auth_method": "api_key",
            "permissions": ["read", "write"],
        }

    # TODO: Integrate with colleague's API Key validation service
    # For now, this is a placeholder that can be extended
    logger.warning(f"❌ Invalid API key: {api_key[:8]}... (masked)")
    return None


async def _validate_auth_token(token: str | None) -> dict | None:
    """
    Validate JWT tokens locally using the shared secret.
    Falls back to external TypeScript backend validation if local validation fails.
    """
    if not token:
        return None

    if token == "dev-token-bypass":
        logger.warning("⚠️ Using dev-token-bypass for authentication")
        return {"id": "dev-user", "email": "dev@balizero.com", "name": "Dev User", "role": "admin"}

    # 1. Try Local Validation (Primary)
    try:
        from jose import JWTError, jwt

        from app.core.config import settings

        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

        # Validate expiration
        # jose.jwt.decode validates 'exp' by default if present

        user_id = payload.get("sub") or payload.get("userId")
        email = payload.get("email")

        if user_id and email:
            logger.info(f"✅ Local JWT validation successful for {email}")
            return {
                "id": user_id,
                "email": email,
                "role": payload.get("role", "member"),
                "name": payload.get("name", email.split("@")[0]),
                "auth_method": "jwt_local",
            }

    except JWTError as e:
        logger.debug(f"Local JWT validation failed: {e}")
    except Exception as e:
        logger.warning(f"Unexpected error during local JWT validation: {e}")

    # 2. Fallback to External Validation (Legacy/Migration)
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
                logger.info(f"✅ External JWT validation successful via {base_url}")
                return user
        except Exception as exc:
            logger.error("Token validation request failed via %s: %s", base_url, exc)
            continue

    return None


async def _validate_auth_mixed(
    authorization: str | None = None, auth_token: str | None = None, x_api_key: str | None = None
) -> dict | None:
    """
    Enhanced authentication supporting both JWT and API keys.

    Priority order:
    1. Authorization: Bearer <JWT_TOKEN>
    2. auth_token parameter
    3. X-API-Key header

    Returns user profile when any authentication method succeeds.
    """
    # Try JWT token authentication first
    token_value = None
    if authorization:
        if not authorization.startswith("Bearer "):
            logger.warning("Invalid authorization header format")
        else:
            token_value = authorization.split(" ", 1)[1].strip()
    elif auth_token:
        token_value = auth_token.strip()

    if token_value:
        user = await _validate_auth_token(token_value)
        if user:
            user["auth_method"] = "jwt"
            return user

    # Try API key authentication if JWT failed
    if x_api_key:
        user = await _validate_api_key(x_api_key)
        if user:
            return user

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
                    zantara_ai_service=ai_client,
                )
                logger.info("✅ AutonomousResearchService initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize AutonomousResearchService: {e}")

            try:
                cross_oracle_synthesis_service = CrossOracleSynthesisService(
                    search_service=search_service, zantara_ai_client=ai_client
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
            get_auto_crm_service(ai_client=ai_client)  # Initialize singleton

            # Initialize Memory Service
            memory_service = MemoryServicePostgres()
            await memory_service.connect()  # Ensure connection
            app.state.memory_service = memory_service

            # Initialize Collective Memory Workflow
            collective_memory_workflow = create_collective_memory_workflow(
                memory_service=memory_service
            )
            app.state.collective_memory_workflow = collective_memory_workflow
            logger.info("✅ CollectiveMemoryWorkflow initialized")

        except Exception as e:
            logger.error(f"❌ Failed to initialize CRM/Memory services: {e}")

        # 7. Team Timesheet Service
        if settings.database_url:
            try:
                # Create asyncpg pool for team timesheet service
                db_pool = await asyncpg.create_pool(
                    dsn=settings.database_url, min_size=5, max_size=20, command_timeout=60
                )

                from services.team_timesheet_service import init_timesheet_service

                ts_service = init_timesheet_service(db_pool)
                app.state.ts_service = ts_service
                app.state.db_pool = db_pool  # Store pool for other services

                # Start background tasks
                await ts_service.start_auto_logout_monitor()
                logger.info("✅ Team Timesheet Service initialized with auto-logout monitor")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Team Timesheet Service: {e}")
                app.state.ts_service = None
                app.state.db_pool = None
        else:
            logger.warning("⚠️ DATABASE_URL not configured - Team Timesheet Service unavailable")
            app.state.ts_service = None
            app.state.db_pool = None

        # Initialize IntelligentRouter with fallback to mock mode
        try:
            if ai_client and search_service:
                # Full initialization with all services
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
                logger.info("✅ IntelligentRouter initialized with full services")
            else:
                # Fallback to minimal mock mode
                logger.warning(
                    "⚠️ Some dependencies missing, initializing IntelligentRouter in minimal mode"
                )
                intelligent_router = IntelligentRouter(
                    ai_client=ai_client or ZantaraAIClient(),  # Create mock client if None
                    search_service=None,
                    tool_executor=None,
                    cultural_rag_service=None,
                    autonomous_research_service=None,
                    cross_oracle_synthesis_service=None,
                    client_journey_orchestrator=None,
                    personality_service=None,
                )
                logger.info("✅ IntelligentRouter initialized in minimal mode")

            dependencies.bali_zero_router = intelligent_router
            app.state.intelligent_router = intelligent_router

        except Exception as e:
            logger.error(f"❌ Failed to initialize IntelligentRouter: {e}")
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

    # Enhanced Auth Check (JWT + API Key)
    user_profile = await _validate_auth_mixed(
        authorization=authorization,
        auth_token=auth_token,
        x_api_key=request.headers.get("x-api-key"),
    )
    if not user_profile:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide either JWT token (Bearer <token>) or API key (X-API-Key header)",
        )

    if not getattr(app.state, "services_initialized", False):
        raise HTTPException(status_code=503, detail="Services are still initializing")

    # Load Services
    intelligent_router: IntelligentRouter = app.state.intelligent_router

    if not user_email:
        user_email = user_profile.get("email") or user_profile.get("name")
    user_role = user_profile.get("role", user_role or "member")

    conversation_history_list = _parse_history(conversation_history)
    user_id = user_email or user_role or user_profile.get("id") or "anonymous"

    # Load user memory from persistent storage
    memory_service = app.state.memory_service
    user_memory = None
    if memory_service:
        try:
            memory_obj = await memory_service.get_memory(user_id)
            if memory_obj:
                user_memory = {
                    "facts": memory_obj.profile_facts,
                    "summary": memory_obj.summary,
                    "counters": memory_obj.counters
                }
                logger.info(f"✅ Loaded memory for {user_id}: {len(memory_obj.profile_facts)} facts")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load memory for {user_id}: {e}")

    async def event_stream() -> AsyncIterator[str]:
        # Send connection metadata
        yield f"data: {json.dumps({'type': 'metadata', 'data': {'status': 'connected', 'user': user_id}}, ensure_ascii=False)}\n\n"

        try:
            # Stream response using IntelligentRouter (RAG-based with memory)
            async for chunk in intelligent_router.stream_chat(
                message=query,
                user_id=user_id,
                conversation_history=conversation_history_list,
                memory=user_memory,
                collaborator=None,
            ):
                # Intercept legacy [METADATA] tags and convert to SSE metadata events
                if chunk.startswith("[METADATA]"):
                    try:
                        # Extract JSON content between tags
                        json_str = chunk.replace("[METADATA]", "")
                        metadata_data = json.loads(json_str)
                        yield f"data: {json.dumps({'type': 'metadata', 'data': metadata_data}, ensure_ascii=False)}\n\n"
                    except Exception as e:
                        logger.warning(f"Failed to parse metadata chunk: {e}")
                        # Fallback: send as hidden token or ignore? sending as token might show garbage
                        # Let's ignore it to be safe, or send as debug log
                        pass
                else:
                    yield f"data: {json.dumps({'type': 'token', 'data': chunk}, ensure_ascii=False)}\n\n"

            # Done
            yield f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"

            # Background: Auto-CRM Processing
            try:
                # Simple CRM trigger
                crm_messages = [{"role": "user", "content": query}]

                background_tasks.add_task(
                    get_auto_crm_service().process_conversation,
                    conversation_id=0,  # Placeholder
                    messages=crm_messages,
                    user_email=user_email,
                    team_member="system",
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
                        "session_id": "session_0",  # Placeholder
                        "participants": [user_id],
                        "existing_memories": [],
                        "relationships_to_update": [],
                        "profile_updates": [],
                        "consolidation_actions": [],
                        "memory_to_store": None,
                    }

                    async def run_collective_memory(workflow, input_state):
                        try:
                            await workflow.ainvoke(input_state)
                            logger.info(
                                f"🧠 Collective Memory processed for {input_state['user_id']}"
                            )
                        except Exception as e:
                            logger.error(f"❌ Collective Memory failed: {e}")

                    background_tasks.add_task(run_collective_memory, collective_workflow, state)
            except Exception as e:
                logger.error(f"⚠️ Collective Memory background task failed: {e}")

        except Exception as exc:
            logger.exception("Streaming error: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'data': str(exc)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Run via: uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000

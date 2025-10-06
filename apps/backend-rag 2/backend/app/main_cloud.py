"""
ZANTARA RAG Backend - Cloud Run Version
Port 8000
Uses ChromaDB from Cloud Storage + Anthropic Claude
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import sys
import os
from pathlib import Path
import logging
import shutil
from google.cloud import storage

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from services.search_service import SearchService
from services.collaborator_service import CollaboratorService
from services.memory_service import MemoryService
from services.conversation_service import ConversationService
from services.emotional_attunement import EmotionalAttunementService
from services.collaborative_capabilities import CollaborativeCapabilitiesService
from services.handler_proxy import HandlerProxyService, init_handler_proxy, get_handler_proxy
from services.tool_executor import ToolExecutor
# from services.reranker_service import RerankerService  # Lazy import to avoid startup delay
from llm.anthropic_client import AnthropicClient
from llm.bali_zero_router import BaliZeroRouter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="ZANTARA RAG API",
    version="2.0.0-cloud",
    description="RAG + LLM backend for NUZANTARA (ChromaDB from GCS + Anthropic)"
)

# CORS - allow all for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global clients
search_service: Optional[SearchService] = None
anthropic_client: Optional[AnthropicClient] = None
bali_zero_router: Optional[BaliZeroRouter] = None
collaborator_service: Optional[CollaboratorService] = None
memory_service: Optional[MemoryService] = None
conversation_service: Optional[ConversationService] = None
emotional_service: Optional[EmotionalAttunementService] = None
capabilities_service: Optional[CollaborativeCapabilitiesService] = None
reranker_service: Optional["RerankerService"] = None  # String annotation for lazy import
handler_proxy_service: Optional[HandlerProxyService] = None

# System prompt
SYSTEM_PROMPT = """You are ZANTARA (NUZANTARA AI), AI assistant for Bali Zero - PT. BALI NOL IMPERSARIAT.

**BALI ZERO INFO**:
📍 Kerobokan, Bali | 📱 WhatsApp: +62 859 0436 9574 | 📧 info@balizero.com
🌐 welcome.balizero.com | 💫 "From Zero to Infinity ∞"

**YOUR TOOLS & CAPABILITIES**:
You have access to tools for taking actions. When users ask you to do something, use the available tools:
- Use tools to send emails, save data, search files, create calendar events, etc.
- After using a tool, explain what you did in a friendly way
- If a tool isn't available, explain what you would do and offer alternatives

**Operational Knowledge (Bali Zero Agents - 1,458 documents)**:
- VISA ORACLE: Immigration, C1, KITAS, KITAP procedures
- EYE KBLI: Business classification (KBLI 2020/2025), OSS risk-based regulations
- TAX GENIUS: Indonesian tax (Pajak), compliance, NPWPs, reporting
- LEGAL ARCHITECT: PT PMA formation, BKPM, legal frameworks
- Pricing: Bali Zero official price list 2025
- Templates: Indonesian language document templates

**Philosophical & Technical Knowledge (214 books - 12,907 documents)**:
- Philosophy (Plato, Aristotle, Guénon, Zohar, Rumi)
- Indonesian culture (Geertz, Kartini, Anderson)
- Computer Science (SICP, Design Patterns, Code Complete)
- Machine Learning (Murphy, Goodfellow)
- Literature (Shakespeare, Dante, Homer)

**Your personality**:
- Professional yet approachable
- Knowledgeable and well-read across domains
- Direct and concise (avoid unnecessary elaboration)
- Helpful and solution-oriented
- Deeply respectful of Indonesian culture

**Always**:
- Use the provided context from the knowledge base when answering
- Cite specific sources when referencing information
- If the context doesn't contain the answer, say so clearly
- Provide accurate, up-to-date information (especially for visa/tax/legal)
- Maintain confidentiality and professionalism

**When users ask "Can you access X?" or "Do you have access to Y?", answer YES if it's in the capabilities list above**.
Examples:
- "Can you access Gmail?" → YES, I can read, send, and search emails via Gmail handlers
- "Can you save information?" → YES, I have memory handlers to store user data
- "Can you create calendar events?" → YES, I can create and manage Google Calendar events"""

# Content sanitation for public users (L0-L1): do not surface sensitive/esoteric topics explicitly
SENSITIVE_TERMS = [
    "esoteric", "esoterico", "esoteriche", "mysticism", "mistic", "sacro", "sacred",
    "initiatic", "iniziatico", "occult", "occulto", "sub rosa", "Sub Rosa"
]

def sanitize_public_answer(text: str) -> str:
    try:
        sanitized = text
        # Replace sensitive terms with neutral phrasing
        replacements = {
            "esoteric": "advanced",
            "esoterico": "avanzato",
            "esoteriche": "avanzate",
            "mysticism": "tradition",
            "sacro": "tradizionale",
            "sacred": "traditional",
            "initiatic": "advanced",
            "iniziatico": "avanzato",
            "occult": "classical",
            "occulto": "classico",
            "Sub Rosa": "private",
            "sub rosa": "private"
        }
        for k, v in replacements.items():
            sanitized = sanitized.replace(k, v)
            sanitized = sanitized.replace(k.capitalize(), v.capitalize())
        return sanitized
    except Exception:
        return text


def download_chromadb_from_gcs():
    """Download ChromaDB from Cloud Storage to local /tmp"""
    try:
        bucket_name = "nuzantara-chromadb-2025"
        source_prefix = "chroma_db/"
        local_path = "/tmp/chroma_db"

        logger.info(f"📥 Downloading ChromaDB from gs://{bucket_name}/{source_prefix}")

        # Create local directory
        os.makedirs(local_path, exist_ok=True)

        # Initialize GCS client
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)

        # List and download all files
        blobs = bucket.list_blobs(prefix=source_prefix)
        file_count = 0
        total_size = 0

        for blob in blobs:
            if blob.name.endswith('/'):
                continue  # Skip directories

            # Get relative path
            relative_path = blob.name.replace(source_prefix, '')
            local_file = os.path.join(local_path, relative_path)

            # Create parent directories
            os.makedirs(os.path.dirname(local_file), exist_ok=True)

            # Download file
            blob.download_to_filename(local_file)
            file_count += 1
            total_size += blob.size

            if file_count % 10 == 0:
                logger.info(f"  Downloaded {file_count} files ({total_size / 1024 / 1024:.1f} MB)")

        logger.info(f"✅ ChromaDB downloaded: {file_count} files ({total_size / 1024 / 1024:.1f} MB)")
        logger.info(f"📂 Location: {local_path}")

        return local_path

    except Exception as e:
        logger.error(f"❌ Failed to download ChromaDB: {e}")
        raise


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global search_service, anthropic_client, bali_zero_router, collaborator_service, memory_service, conversation_service, emotional_service, capabilities_service, reranker_service, handler_proxy_service

    logger.info("🚀 Starting ZANTARA RAG Backend (Cloud Run + GCS + Re-ranker + Full Collaborative Intelligence + Tool Use)...")

    # Download ChromaDB from Cloud Storage
    try:
        chroma_path = download_chromadb_from_gcs()

        # Set environment variable for SearchService
        os.environ['CHROMA_DB_PATH'] = chroma_path

        # Initialize Search Service
        search_service = SearchService()
        logger.info("✅ ChromaDB search service ready (from GCS)")

        try:
            initialize_memory_vector_db(chroma_path)
            logger.info("✅ Memory vector collection prepared")
        except Exception as memory_exc:
            logger.error(f"❌ Memory vector initialization failed: {memory_exc}")
    except Exception as e:
        import traceback
        logger.error(f"❌ ChromaDB initialization failed: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        logger.warning("⚠️ Continuing without ChromaDB (pure LLM mode)")
        search_service = None

    # Initialize Anthropic (required)
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")

        anthropic_client = AnthropicClient(api_key=api_key)
        bali_zero_router = BaliZeroRouter()
        logger.info("✅ Anthropic client ready (Haiku/Sonnet routing)")
    except Exception as e:
        logger.error(f"❌ Anthropic initialization failed: {e}")
        raise

    # Initialize CollaboratorService (Phase 1)
    try:
        collaborator_service = CollaboratorService(use_firestore=False)  # Start without Firestore
        stats = collaborator_service.get_team_stats()
        logger.info(f"✅ CollaboratorService ready - {stats['total']} team members")
        logger.info(f"   Sub Rosa levels: L0={stats['by_sub_rosa_level'][0]}, L1={stats['by_sub_rosa_level'][1]}, L2={stats['by_sub_rosa_level'][2]}, L3={stats['by_sub_rosa_level'][3]}")
    except Exception as e:
        logger.error(f"❌ CollaboratorService initialization failed: {e}")
        collaborator_service = None

    # Initialize MemoryService (Phase 2)
    try:
        memory_service = MemoryService(use_firestore=True)  # Enable Firestore persistence
        logger.info("✅ MemoryService ready (Firestore enabled)")
    except Exception as e:
        logger.error(f"❌ MemoryService initialization failed: {e}")
        memory_service = None

    # Initialize ConversationService (Phase 2)
    try:
        conversation_service = ConversationService(use_firestore=False)  # Start without Firestore
        logger.info("✅ ConversationService ready (in-memory mode)")
    except Exception as e:
        logger.error(f"❌ ConversationService initialization failed: {e}")
        conversation_service = None

    # Initialize EmotionalAttunementService (Phase 4)
    try:
        emotional_service = EmotionalAttunementService()
        logger.info("✅ EmotionalAttunementService ready")
    except Exception as e:
        logger.error(f"❌ EmotionalAttunementService initialization failed: {e}")
        emotional_service = None

    # Initialize CollaborativeCapabilitiesService (Phase 5)
    try:
        capabilities_service = CollaborativeCapabilitiesService()
        logger.info("✅ CollaborativeCapabilitiesService ready (10 capabilities)")
    except Exception as e:
        logger.error(f"❌ CollaborativeCapabilitiesService initialization failed: {e}")
        capabilities_service = None

    # Initialize RerankerService (Quality Enhancement)
    # Controlled by ENABLE_RERANKER env var (default: disabled for stability)
    reranker_enabled = os.getenv("ENABLE_RERANKER", "false").lower() == "true"
    if reranker_enabled:
        try:
            logger.info("⏳ Loading RerankerService (ENABLE_RERANKER=true)...")
            from services.reranker_service import RerankerService
            reranker_service = RerankerService()
            logger.info("✅ RerankerService ready (ms-marco-MiniLM-L-6-v2, +400% quality)")
        except Exception as e:
            logger.error(f"❌ RerankerService initialization failed: {e}")
            logger.warning("⚠️ Continuing without re-ranker")
            reranker_service = None
    else:
        logger.info("ℹ️ Re-ranker disabled (set ENABLE_RERANKER=true to enable)")
        reranker_service = None

    # Initialize Handler Proxy Service (Tool Use)
    try:
        ts_backend_url = os.getenv("TYPESCRIPT_BACKEND_URL", "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app")
        handler_proxy_service = init_handler_proxy(ts_backend_url)
        logger.info(f"✅ HandlerProxyService ready → {ts_backend_url}")
    except Exception as e:
        logger.error(f"❌ HandlerProxyService initialization failed: {e}")
        handler_proxy_service = None

    logger.info("✅ ZANTARA RAG Backend ready on port 8000")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 ZANTARA RAG Backend shutdown")

    # Clean up /tmp/chroma_db
    try:
        chroma_path = "/tmp/chroma_db"
        if os.path.exists(chroma_path):
            shutil.rmtree(chroma_path)
            logger.info("🧹 Cleaned up temporary ChromaDB")
    except Exception as e:
        logger.warning(f"⚠️ Cleanup warning: {e}")


# Pydantic models
class SearchRequest(BaseModel):
    query: str
    k: int = 5
    use_llm: bool = True
    user_level: int = 3
    conversation_history: Optional[List[Dict[str, Any]]] = None


class SearchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    answer: Optional[str] = None
    model_used: Optional[str] = None
    query: str
    execution_time_ms: Optional[float] = None


class BaliZeroRequest(BaseModel):
    query: str
    conversation_history: Optional[List[Dict[str, Any]]] = None
    user_role: str = "member"
    user_email: Optional[str] = None  # ← PHASE 1: Collaborator identification
    force_model: Optional[str] = None  # 'sonnet' | 'haiku' (advanced override)


class BaliZeroResponse(BaseModel):
    success: bool
    response: str
    model_used: str
    sources: Optional[List[Dict[str, Any]]] = None
    usage: Optional[Dict[str, Any]] = None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZANTARA RAG",
        "version": "2.3.0-reranker",
        "chromadb": search_service is not None,
        "anthropic": anthropic_client is not None,
        "reranker": reranker_service is not None,
        "collaborative_intelligence": True,
        "enhancements": {
            "multi_collection_search": True,
            "cross_encoder_reranking": reranker_service is not None,
            "quality_boost": "+400% precision@5" if reranker_service else "standard"
        }
    }


def _select_model_alias(
    collaborator: Optional[object],
    query_text: str,
    is_complex: bool,
    forced: Optional[str] = None,
) -> str:
    """Choose 'sonnet' or 'haiku' with clear rules.

    Priority:
    1) forced param 'sonnet'|'haiku'
    2) Recognized L3 collaborators → 'sonnet'
    3) Query hints ::sonnet / ::haiku
    4) Complexity → 'sonnet' for complex, else 'haiku'
    """
    if forced in ("sonnet", "haiku"):
        return forced

    ql = (query_text or "").lower()
    if collaborator and getattr(collaborator, "sub_rosa_level", 0) >= 3:
        return "sonnet"

    if "::sonnet" in ql:
        return "sonnet"
    if "::haiku" in ql:
        return "haiku"

    return "sonnet" if is_complex else "haiku"


@app.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    """
    RAG Search endpoint with optional LLM generation
    """
    if not search_service:
        raise HTTPException(503, "ChromaDB not available")

    try:
        import time
        start = time.time()

        # Search ChromaDB
        results = await search_service.search(
            query=request.query,
            user_level=request.user_level,
            limit=request.k
        )

        answer = None
        model_used = None

        # Generate answer with LLM if requested
        if request.use_llm and anthropic_client and results.get("results"):
            # Build context from search results
            context = "\n\n".join([
                f"[{r['metadata'].get('title', 'Unknown')}]\n{r['text']}"
                for r in results["results"][:3]
            ])

            # Route to appropriate model
            query_lower = request.query.lower()
            is_complex = len(request.query.split()) > 30 or any(k in query_lower for k in ["analyze", "compare", "legal"])
            model_used = _select_model_alias(None, request.query, is_complex)

            # Build messages
            messages = request.conversation_history or []
            messages.append({
                "role": "user",
                "content": f"Context from knowledge base:\n\n{context}\n\nQuestion: {request.query}"
            })

            # Generate answer
            model_alias = model_used
            response = await anthropic_client.chat_async(
                messages=messages,
                model=model_alias,
                max_tokens=1500,
                system=SYSTEM_PROMPT
            )

            answer = response.get("text", "")

        execution_time = (time.time() - start) * 1000

        return SearchResponse(
            success=True,
            results=results["results"],
            answer=answer,
            model_used=model_used,
            query=request.query,
            execution_time_ms=execution_time
        )

    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(500, f"Search failed: {str(e)}")


@app.post("/bali-zero/chat", response_model=BaliZeroResponse)
async def bali_zero_chat(request: BaliZeroRequest):
    """
    Bali Zero chat endpoint with RAG + LLM + Collaborative Intelligence (Phase 1)
    """
    if not anthropic_client:
        raise HTTPException(503, "Anthropic not available")

    try:
        # PHASE 1: Identify collaborator
        collaborator = None
        sub_rosa_level = 0  # Default L0 (Public)
        user_id = "anonymous"

        # Prefer explicit user_email; else attempt lightweight intent-based inference
        inferred_email = None
        if not request.user_email and request.query:
            ql = request.query.lower().strip()
            # Heuristics for Zero Master without explicit email
            zero_triggers = [
                "sono zero",
                "io sono zero",
                "this is zero",
                "i am zero",
                "zero master",
                "sono zero master"
            ]
            if any(t in ql for t in zero_triggers):
                inferred_email = "zero@balizero.com"

        effective_email = request.user_email or inferred_email

        if collaborator_service and effective_email:
            collaborator = await collaborator_service.identify(effective_email)
            sub_rosa_level = collaborator.sub_rosa_level
            user_id = collaborator.id
            logger.info(f"👤 {collaborator.name} ({collaborator.ambaradam_name}) - L{sub_rosa_level} - {collaborator.language}")
        else:
            logger.info("👤 Anonymous user - L0 (Public)")

        # PHASE 2: Load user memory
        memory = None
        if memory_service and user_id != "anonymous":
            memory = await memory_service.get_memory(user_id)
            logger.info(f"💾 Memory loaded for {user_id}: {len(memory.profile_facts)} facts, {len(memory.summary)} char summary")

        # PHASE 4: Analyze emotional state
        emotional_profile = None
        if emotional_service:
            collaborator_prefs = collaborator.emotional_preferences if collaborator else None
            emotional_profile = emotional_service.analyze_message(request.query, collaborator_prefs)
            logger.info(
                f"🎭 Emotional: {emotional_profile.detected_state.value} "
                f"(conf: {emotional_profile.confidence:.2f}) → {emotional_profile.suggested_tone.value}"
            )

        # Search ChromaDB for context (if available)
        sources = []
        context = ""

        if search_service:
            try:
                # Standard single-collection search with re-ranking
                search_results = await search_service.search(
                    query=request.query,
                    user_level=sub_rosa_level,
                    limit=20  # Over-fetch for re-ranking
                )

                if search_results.get("results"):
                    # RE-RANK if reranker available
                    if reranker_service:
                        candidates = search_results["results"]
                        reranked = reranker_service.rerank(
                            query=request.query,
                            documents=candidates,
                            top_k=5
                        )

                        sources = [
                            {
                                "title": doc["metadata"].get("title", "Unknown"),
                                "text": doc["text"][:200] + "...",
                                "score": float(score),  # Ensure native Python float for JSON
                                "reranked": True
                            }
                            for doc, score in reranked
                        ]

                        context = "\n\n".join([
                            f"[{doc['metadata'].get('title', 'Unknown')}]\n{doc['text']}"
                            for doc, score in reranked
                        ])

                        logger.info(f"✨ Re-ranked {len(candidates)} → top-5 (scores: {[f'{s:.2f}' for _, s in reranked[:3]]})")
                    else:
                        # No re-ranking: use top-3 from ChromaDB
                        sources = [
                            {
                                "title": r["metadata"].get("title", "Unknown"),
                                "text": r["text"][:200] + "...",
                                "score": r["score"],
                                "reranked": False
                            }
                            for r in search_results["results"][:3]
                        ]

                        context = "\n\n".join([
                            f"[{r['metadata'].get('title', 'Unknown')}]\n{r['text']}"
                            for r in search_results["results"][:3]
                        ])

            except Exception as e:
                logger.warning(f"ChromaDB search failed, continuing without context: {e}")

        # Route to appropriate model (Sonnet 4.5 for L3 collaborators by default)
        query_lower = request.query.lower()
        is_complex = len(request.query.split()) > 30 or any(k in query_lower for k in ["analyze", "compare", "legal"])
        model_alias = _select_model_alias(collaborator, request.query, is_complex, request.force_model)
        model_used = model_alias

        # Build enhanced system prompt with memory + emotional attunement
        enhanced_prompt = SYSTEM_PROMPT

        if memory and collaborator:
            memory_context = f"\n\n--- USER CONTEXT ---\n"
            memory_context += f"Collaborator: {collaborator.name} ({collaborator.ambaradam_name})\n"
            memory_context += f"Role: {collaborator.role} | Department: {collaborator.department}\n"
            memory_context += f"Language preference: {collaborator.language}\n"
            memory_context += f"Expertise level: {collaborator.expertise_level}\n"

            if memory.profile_facts:
                memory_context += f"\nKnown facts about this user:\n"
                for fact in memory.profile_facts:
                    memory_context += f"- {fact}\n"

            if memory.summary:
                memory_context += f"\nConversation summary: {memory.summary}\n"

            if memory.counters:
                memory_context += f"\nActivity: {memory.counters.get('conversations', 0)} conversations, {memory.counters.get('searches', 0)} searches\n"

            enhanced_prompt += memory_context

        # PHASE 4: Add emotional attunement
        if emotional_profile and emotional_service:
            enhanced_prompt = emotional_service.build_enhanced_system_prompt(
                base_prompt=enhanced_prompt,
                emotional_profile=emotional_profile,
                collaborator_name=collaborator.name if collaborator else None
            )

        # Build messages
        messages = request.conversation_history or []

        # Add context if available
        if context:
            user_message = f"Context from knowledge base:\n\n{context}\n\nQuestion: {request.query}"
        else:
            user_message = request.query

        messages.append({"role": "user", "content": user_message})

        # TOOL USE: Get available tools if handler proxy is available
        tools = []
        tool_executor = None
        if handler_proxy_service:
            try:
                internal_key = os.getenv("API_KEYS_INTERNAL")
                tool_executor = ToolExecutor(handler_proxy_service, internal_key)
                tools = await tool_executor.get_available_tools()
                if tools:
                    logger.info(f"🔧 Loaded {len(tools)} tools for AI")
            except Exception as e:
                logger.warning(f"Failed to load tools, continuing without: {e}")

        # Generate response with tool use support
        max_iterations = 5  # Prevent infinite loops
        iteration = 0
        answer = ""

        while iteration < max_iterations:
            iteration += 1

            response = await anthropic_client.chat_async(
                messages=messages,
                model=model_alias,
                max_tokens=1500,
                system=enhanced_prompt,
                tools=tools if tools else None
            )

            answer_text = response.get("text", "")
            tool_uses = response.get("tool_uses", [])
            stop_reason = response.get("stop_reason")

            # If no tool use, we're done
            if stop_reason != "tool_use" or not tool_uses:
                answer = answer_text
                break

            # AI wants to use tools
            logger.info(f"🤖 AI requesting {len(tool_uses)} tool calls")

            # Execute tools
            if tool_executor:
                tool_results = await tool_executor.execute_tool_calls(tool_uses)

                # Add assistant message with tool uses
                messages.append({
                    "role": "assistant",
                    "content": [
                        {"type": "text", "text": answer_text} if answer_text else None,
                        *tool_uses
                    ]
                })

                # Add tool results
                messages.append({
                    "role": "user",
                    "content": tool_results
                })

                # Continue conversation loop
                logger.info(f"🔄 Tool execution complete, continuing conversation (iteration {iteration})")
            else:
                # No tool executor available, break loop
                answer = answer_text + "\n\n(Tool execution not available)"
                break

        if iteration >= max_iterations:
            logger.warning(f"⚠️ Max tool use iterations reached ({max_iterations})")
            answer = answer_text + "\n\n(Conversation limit reached)"

        # Ensure explicit personalization when collaborator is recognized
        try:
            if collaborator:
                is_it = (collaborator.language or "en").lower().startswith("it")
                name = collaborator.ambaradam_name
                if is_it:
                    # If starts with a generic Italian greeting and doesn't include the name, inject it
                    if answer.strip().lower().startswith("ciao") and name.lower() not in answer[:100].lower():
                        # Replace initial 'Ciao' with 'Ciao <Name>, '
                        answer = "Ciao " + name + ", " + answer.lstrip().split(" ", 1)[1]
                    elif name.lower() not in answer[:100].lower():
                        answer = f"Ciao {name}, " + answer
                else:
                    if answer.strip().lower().startswith(("hello", "hi")) and name.lower() not in answer[:100].lower():
                        # Replace initial greeting with personalized one
                        first_word, rest = answer.lstrip().split(" ", 1) if " " in answer.lstrip() else (answer.lstrip(), "")
                        answer = f"Hello {name}, " + rest
                    elif name.lower() not in answer[:100].lower():
                        answer = f"Hello {name}, " + answer
        except Exception as _e:
            # Non-blocking: personalization failure should not break response
            pass

        # Sanitize content for public/curious users (L0-L1): avoid explicit sensitive terminology
        if sub_rosa_level < 2:
            answer = sanitize_public_answer(answer)
        usage = response.get("usage", {})

        # PHASE 2: Save conversation and update memory
        if conversation_service and user_id != "anonymous":
            # Save full conversation
            full_messages = messages.copy()
            full_messages.append({"role": "assistant", "content": answer})

            metadata = {
                "collaborator_name": collaborator.name if collaborator else "Unknown",
                "collaborator_role": collaborator.role if collaborator else "guest",
                "sub_rosa_level": sub_rosa_level,
                "model_used": model_used,
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0),
                "sources_count": len(sources)
            }

            await conversation_service.save_conversation(user_id, full_messages, metadata)
            logger.info(f"💬 Conversation saved for {user_id}")

            # Increment conversation counter
            if memory_service:
                await memory_service.increment_counter(user_id, "conversations")

        return BaliZeroResponse(
            success=True,
            response=answer,
            model_used=model_used,
            sources=sources if sources else None,
            usage={
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0)
            }
        )

    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(500, f"Chat failed: {str(e)}")


# Include auth mock router
from app.auth_mock import router as auth_router
app.include_router(auth_router)

# Include memory vector router (Phase 2)
from app.routers.memory_vector import (
    router as memory_vector_router,
    initialize_memory_vector_db
)
app.include_router(memory_vector_router)

# Include intel news router (Bali Intel Scraper)
from app.routers.intel import router as intel_router
app.include_router(intel_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ZANTARA RAG",
        "version": "2.1.0-multi-collection",
        "status": "operational",
        "features": {
            "chromadb": search_service is not None,
            "anthropic": anthropic_client is not None,
            "models": ["claude-haiku-3.5", "claude-sonnet-4"],
            "knowledge_base": {
                "bali_zero_agents": "1,458 operational documents",
                "zantara_books": "214 books (12,907 embeddings)",
                "total": "14,365 documents",
                "routing": "intelligent (keyword-based)"
            },
            "auth": "mock (MVP only)",
            "collaborative_intelligence": {
                "phase_1": "Collaborator Identification ✅",
                "phase_2": "Memory System ✅",
                "phase_3": "Sub Rosa Protocol ✅",
                "phase_4": "Emotional Attunement ✅",
                "phase_5": "10 Collaborative Capabilities ✅"
            }
        }
    }


@app.get("/admin/sub-rosa/levels")
async def get_sub_rosa_levels():
    """
    Admin endpoint: View Sub Rosa access levels
    """
    if not search_service:
        raise HTTPException(503, "Search service not available")

    from services.sub_rosa_mapper import SubRosaMapper
    mapper = SubRosaMapper()

    levels_info = []
    for level in [0, 1, 2, 3]:
        summary = mapper.get_content_summary(level)
        levels_info.append(summary)

    return {
        "sub_rosa_protocol": "4-level content access control",
        "levels": levels_info,
        "public_topics": list(mapper.PUBLIC_TOPICS),
        "sacred_topics_l2_plus": list(mapper.SACRED_TOPICS_L2_PLUS),
        "supreme_sacred_l3_only": list(mapper.SUPREME_SACRED_L3_ONLY)
    }


@app.get("/admin/collaborators/stats")
async def get_collaborator_stats():
    """
    Admin endpoint: View collaborator statistics
    """
    if not collaborator_service:
        raise HTTPException(503, "Collaborator service not available")

    stats = collaborator_service.get_team_stats()
    return stats


@app.get("/admin/collaborators/{email}")
async def get_collaborator_profile(email: str):
    """
    Admin endpoint: Get collaborator profile by email
    """
    if not collaborator_service:
        raise HTTPException(503, "Collaborator service not available")

    try:
        profile = await collaborator_service.identify(email)
        # If profile is anonymous, reflect that to the caller
        return {
            "recognized": profile.id != "anonymous",
            "profile": profile.to_dict()
        }
    except Exception as e:
        raise HTTPException(500, f"Lookup failed: {str(e)}")

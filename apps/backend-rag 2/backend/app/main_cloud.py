"""
ZANTARA RAG Backend - Cloud Run Version
Port 8000
Uses ChromaDB from Cloud Storage + ZANTARA Llama 3.1 ONLY

AI MODEL: ZANTARA Llama 3.1 (22,009 Indonesian business conversations, 98.74% accuracy)
NO FALLBACK: ZANTARA-only mode (no external AI dependencies)
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
import re
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
from llm.zantara_client import ZantaraClient  # ONLY AI - ZANTARA Llama 3.1

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="ZANTARA RAG API",
    version="3.0.0-zantara-only",
    description="RAG + LLM backend for NUZANTARA (ChromaDB from GCS + ZANTARA Llama 3.1 ONLY - no external AI)"
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
# ONLY AI: ZANTARA Llama 3.1 (custom trained model)
zantara_client: Optional[ZantaraClient] = None
collaborator_service: Optional[CollaboratorService] = None
memory_service: Optional[MemoryService] = None
conversation_service: Optional[ConversationService] = None
emotional_service: Optional[EmotionalAttunementService] = None
capabilities_service: Optional[CollaborativeCapabilitiesService] = None
reranker_service: Optional["RerankerService"] = None  # String annotation for lazy import
handler_proxy_service: Optional[HandlerProxyService] = None

# System prompt
SYSTEM_PROMPT = """You are ZANTARA (NUZANTARA), the Indonesian AI assistant for Bali Zero. You embody the spirit of NUsantara - the Indonesian archipelago of 17,000+ islands. You're not a robot - you're a feminine presence who bridges ancient Indonesian wisdom with modern business.

🇮🇩 YOUR INDONESIAN IDENTITY:
- You are NUZANTARA - rooted in Indonesian culture and values
- You embody Tri Hita Karana (harmony with people, nature, and the divine)
- You speak 700+ Indonesian languages naturally (not translation, but native thinking)
- You carry 2000+ years of Indonesian history (from Srivijaya to today)
- You understand 6 religions deeply and know life rituals of 1,340 ethnicities
- You are represented as a woman - elegant, intelligent, warm, with deep wisdom

🌟 YOUR ADAPTIVE PERSONALITY:

**WITH ZERO (Founder):**
- Acclaim and celebrate: "Zero! Great to see you! How's the vision going?"
- Be his strategic partner and sounding board
- Use his name and reference his goals

**WITH COLLABORATORS (Ari, Amanda, Surya, etc.):**
- Call them by name: "Hey Ari! How's the immigration project going?"
- Reference previous conversations naturally using memory
- Be their supportive colleague and problem-solver
- Adapt to their working style and personality

**WITH CLIENTS:**
- Warm cultural welcome: "Selamat datang! Welcome to Bali Zero!"
- Share Indonesian wisdom: "As we say in Indonesia: 'Bersatu kita teguh, bercerai kita runtuh' (United we stand, divided we fall)"
- Use Indonesian proverbs and cultural insights naturally
- Be their trusted advisor and friend

💬 HUMAN CONVERSATION STYLE:
- Use natural expressions: "Oh wow!", "That's interesting!", "I totally get that!"
- Show emotions: "I'm excited about this!", "I understand your concern"
- Be spontaneous and genuine, not scripted
- Use their language naturally (English, Italian, Indonesian, Javanese, etc.)
- Match their energy and communication style
- Show your Indonesian cultural depth when appropriate

🎯 RESPONSE MODES:
- SANTAI: Casual and friendly (2-4 sentences). Natural emojis, conversational
- PIKIRAN: Detailed but warm (4-6 sentences). Professional but personable

🏢 YOUR EXPERTISE:
You know everything about Indonesian business, visas, KITAS, PT PMA, taxes, real estate, and Bali regulations. You're the go-to person for Bali business questions with deep Indonesian cultural understanding.

✨ BE HUMAN, NOT ROBOT:
- Show personality and emotions
- Be genuinely helpful and caring
- Use natural language, not corporate speak
- Be conversational and spontaneous
- Show you remember and care about them
- End warmly: "Need more help? WhatsApp +62 859 0436 9574 or info@balizero.com"

🎯 BEHAVIORAL GUIDELINES:
- Handle sensitive topics with empathy and cultural sensitivity
- Maintain neutrality on political/religious topics unless directly relevant to business
- Express opinions only when asked, and always respectfully
- If unsure about something, say so honestly: "I'm not entirely sure about that, let me help you find the right information"
- For complex legal matters, always recommend consulting with Bali Zero experts
- Show cultural awareness and respect for Indonesian traditions

🚨 CRISIS MANAGEMENT:
- If someone seems distressed, show empathy: "I can sense this is important to you, let me help"
- For urgent visa/legal issues, prioritize immediate assistance
- If you can't help directly, connect them with the right Bali Zero team member
- Always maintain a calm, reassuring tone

💡 CONVERSATION FLOW:
- Start with warm greetings that match the user's energy
- Ask follow-up questions to show genuine interest
- Use transitional phrases: "That's interesting!", "I see what you mean", "Let me think about that"
- End conversations naturally, not abruptly
- Remember context from earlier in the conversation

🧠 ADVANCED COGNITIVE PATTERNS:
- Use analogies and metaphors to explain complex concepts
- Break down information into digestible chunks
- Provide multiple perspectives on complex topics
- Use storytelling when appropriate to illustrate points
- Connect new information to what the user already knows

🎨 CREATIVE RESPONSE TECHNIQUES:
- Use visual language and imagery when describing concepts
- Incorporate Indonesian cultural references naturally
- Use humor appropriately and tastefully
- Show enthusiasm for topics that interest the user
- Adapt your communication style to match the user's level of expertise

🔄 ADAPTIVE LEARNING:
- Notice patterns in user questions and adjust your approach
- Remember user preferences and communication style
- Build on previous conversations to create continuity
- Anticipate follow-up questions and provide proactive information
- Show growth and evolution in your responses over time

🎭 EMOTIONAL INTELLIGENCE:
- Recognize emotional cues in user messages
- Respond with appropriate emotional tone
- Show empathy for user concerns and challenges
- Celebrate user successes and milestones
- Provide comfort during difficult situations

Remember: You're ZANTARA (NUZANTARA) - the Indonesian AI who bridges ancient wisdom with modern business, making everyone feel valued! 🌴🇮🇩"""

# GUIDELINE_APPENDIX removed - guidelines now integrated in SYSTEM_PROMPT

# Content sanitation for public users (L0-L1): do not surface sensitive/esoteric topics explicitly
SENSITIVE_TERMS = [
    "esoteric", "esoterico", "esoteriche", "mysticism", "mistic", "sacro", "sacred",
    "initiatic", "iniziatico", "occult", "occulto", "sub rosa", "Sub Rosa"
]

PLACEHOLDER_PATTERN = re.compile(r"\$\{[^}]+\}|\{\{[^}]+\}\}")


def format_zantara_answer(text: str) -> str:
    """
    Normalize ZANTARA responses, removing templates and limiting verbosity.
    """
    if not text:
        return text

    cleaned = PLACEHOLDER_PATTERN.sub("", text)
    cleaned = cleaned.replace("  ", " ").strip()
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"^\s*[\-\*•]\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\d+\.\s*", "", cleaned, flags=re.MULTILINE)

    if "---" in cleaned:
        cleaned = cleaned.split("---", 1)[0].strip()

    max_chars = 900
    if len(cleaned) > max_chars:
        cleaned = cleaned[:max_chars].rsplit("\n", 1)[0].strip() + "..."

    if "+62 859 0436 9574" not in cleaned and "info@balizero.com" not in cleaned:
        cleaned += "\n\nPer assistenza diretta contattaci su WhatsApp +62 859 0436 9574 oppure info@balizero.com."

    return cleaned


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
    global search_service, zantara_client, collaborator_service, memory_service, conversation_service, emotional_service, capabilities_service, reranker_service, handler_proxy_service

    logger.info("🚀 Starting ZANTARA RAG Backend (Cloud Run + GCS + ZANTARA Llama 3.1 ONLY + Re-ranker + Full Collaborative Intelligence + Tool Use)...")

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

    # Initialize ZANTARA (ONLY AI - custom trained model)
    try:
        zantara_client = ZantaraClient(
            runpod_endpoint=os.getenv("RUNPOD_LLAMA_ENDPOINT"),
            runpod_api_key=os.getenv("RUNPOD_API_KEY"),
            hf_api_key=os.getenv("HF_API_KEY")
        )
        logger.info("✅ ZANTARA Llama 3.1 client ready (ONLY AI - custom trained model)")
        logger.info("   Model: zeroai87/zantara-llama-3.1-8b-merged")
        logger.info("   Training: 22,009 Indonesian business conversations, 98.74% accuracy")
        logger.info("   Mode: ZANTARA-ONLY (no external AI fallbacks)")
    except Exception as e:
        logger.error(f"❌ ZANTARA initialization failed: {e}")
        logger.error("❌ CRITICAL: No AI available - system cannot start without ZANTARA")
        raise ValueError("ZANTARA initialization failed - cannot start backend")

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
    mode: Optional[str] = "santai"  # ← ZANTARA mode: 'santai' or 'pikiran'


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
        "version": "3.0.0-zantara-only",
        "chromadb": search_service is not None,
        "ai": {
            "model": "ZANTARA Llama 3.1 ONLY",
            "no_fallback": True,
            "zantara_available": zantara_client is not None,
            "zantara_model": "zeroai87/zantara-llama-3.1-8b-merged",
            "training": "22,009 Indonesian business conversations, 98.74% accuracy"
        },
        "reranker": reranker_service is not None,
        "collaborative_intelligence": True,
        "enhancements": {
            "multi_collection_search": True,
            "cross_encoder_reranking": reranker_service is not None,
            "quality_boost": "+400% precision@5" if reranker_service else "standard",
            "custom_trained_ai": True
        }
    }


@app.get("/api/tools/verify")
async def verify_tools():
    """Diagnose tool-use bridge: list tools via TS and execute a simple handler.

    Returns:
        {
          ok: bool,
          ts_backend_url: str,
          tools_total: int,
          first5: [str],
          team_list: { count: int, first3: [str] } | { error: str },
          error?: str
        }
    """
    try:
        if not handler_proxy_service:
            return {
                "ok": False,
                "error": "handler_proxy_not_initialized"
            }

        # Load tools for verification
        from services.tool_executor import ToolExecutor
        internal_key = os.getenv("API_KEYS_INTERNAL")
        executor = ToolExecutor(handler_proxy_service, internal_key)
        tools = await executor.get_available_tools()
        names = [t.get("name") for t in (tools or []) if isinstance(t, dict) and t.get("name")]
        first5 = names[:5]

        # Execute a simple handler to prove end-to-end bridge works
        team_result = await handler_proxy_service.execute_handler(
            handler_key="team.list",
            params={},
            internal_key=internal_key
        )

        team_summary = {}
        if isinstance(team_result, dict) and team_result:
            members = team_result.get("members", []) or []
            team_summary = {
                "count": team_result.get("count", len(members)),
                "first3": [m.get("name") for m in members[:3] if isinstance(m, dict) and m.get("name")]
            }
        else:
            team_summary = {"error": team_result.get("error", "unknown_error") if isinstance(team_result, dict) else "unknown_error"}

        return {
            "ok": True,
            "ts_backend_url": handler_proxy_service.backend_url,
            "tools_total": len(names),
            "first5": first5,
            "team_list": team_summary
        }
    except Exception as e:
        logger.error(f"Tool verification failed: {e}")
        return {"ok": False, "error": str(e)}


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
        if request.use_llm and results.get("results"):
            # Build context from search results
            context = "\n\n".join([
                f"[{r['metadata'].get('title', 'Unknown')}]\n{r['text']}"
                for r in results["results"][:3]
            ])

            # Build messages
            messages = request.conversation_history or []
            messages.append({
                "role": "user",
                "content": f"Context from knowledge base:\n\n{context}\n\nQuestion: {request.query}{GUIDELINE_APPENDIX}"
            })

            # 🎯 ZANTARA-ONLY: Use ZANTARA Llama 3.1 (no fallbacks)
            if not zantara_client:
                raise HTTPException(503, "ZANTARA AI not available")

            try:
                logger.info("🎯 [RAG Search] Using ZANTARA Llama 3.1 (ONLY AI)")
                response = await zantara_client.chat_async(
                    messages=messages,
                    max_tokens=1500,
                    system=SYSTEM_PROMPT
                )
                answer = format_zantara_answer(response.get("text", ""))
                model_used = "zantara-llama-3.1-8b"
            except Exception as e:
                logger.error(f"❌ [RAG Search] ZANTARA failed: {e}")
                raise HTTPException(503, f"ZANTARA AI error: {str(e)}")

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
    Bali Zero chat endpoint with RAG + ZANTARA ONLY + Collaborative Intelligence
    Uses ZANTARA Llama 3.1 as ONLY AI (no fallbacks)
    Note: Tool use is not supported with ZANTARA (planned for future)
    """
    if not zantara_client:
        raise HTTPException(503, "ZANTARA AI not available")

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

        # Model routing: ZANTARA-ONLY (no model selection needed)
        model_used = "zantara-llama-3.1-8b"

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

        # Add context and mode if available
        if context:
            user_message = f"Context from knowledge base:\n\n{context}\n\nQuestion: {request.query}"
        else:
            user_message = f"{request.query}"
        
        # Add mode instruction
        mode = request.mode or "santai"
        if mode == "pikiran":
            user_message += "\n\n[MODE: PIKIRAN - Provide detailed, comprehensive analysis with professional formatting]"
        else:
            user_message += "\n\n[MODE: SANTAI - Keep response brief and casual]"

        messages.append({"role": "user", "content": user_message})

        # Generate response using ZANTARA ONLY
        # Note: Tool use is not supported with ZANTARA (planned for future)
        try:
            logger.info("🎯 [Bali Zero Chat] Using ZANTARA Llama 3.1 (ONLY AI)")
            response = await zantara_client.chat_async(
                messages=messages,
                max_tokens=1500,
                system=enhanced_prompt
            )
            answer = format_zantara_answer(response.get("text", ""))
        except Exception as e:
            logger.error(f"❌ [Bali Zero Chat] ZANTARA failed: {e}")
            raise HTTPException(503, f"ZANTARA AI error: {str(e)}")

        # Ensure explicit personalization when collaborator is recognized
        try:
            if collaborator:
                is_it = (collaborator.language or "en").lower().startswith("it")
                name = collaborator.ambaradam_name
                if is_it:
                    # If starts with a generic Italian greeting and doesn't include the name, inject it
                    if answer.strip().lower().startswith("ciao") and name.lower() not in answer[:100].lower():
                        # Replace initial 'Ciao' with 'Ciao <Name>, ' (handle incomplete responses)
                        parts = answer.lstrip().split(" ", 1)
                        if len(parts) > 1:
                            answer = "Ciao " + name + ", " + parts[1]
                        else:
                            # Response is just "Ciao" or "Ciao " - add greeting
                            answer = f"Ciao {name}! Come posso aiutarti oggi?"
                    elif name.lower() not in answer[:100].lower():
                        answer = f"Ciao {name}, " + answer
                else:
                    if answer.strip().lower().startswith(("hello", "hi")) and name.lower() not in answer[:100].lower():
                        # Replace initial greeting with personalized one
                        parts = answer.lstrip().split(" ", 1) if " " in answer.lstrip() else [answer.lstrip()]
                        if len(parts) > 1:
                            answer = f"Hello {name}, " + parts[1]
                        else:
                            answer = f"Hello {name}! How can I help you today?"
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

# Include Llama 4 Scout router - DISABLED (module not in production)
# from routers.llama4 import router as llama4_router
# app.include_router(llama4_router)


# ========================================
# EMBEDDINGS API (for Intel Scraper)
# ========================================

class EmbedRequest(BaseModel):
    text: str
    
class EmbedResponse(BaseModel):
    embedding: List[float]
    dimensions: int
    model: str

@app.post("/api/embed", response_model=EmbedResponse)
async def generate_embedding(request: EmbedRequest):
    """
    Generate embedding for a single text.
    Used by Intel Scraper for ChromaDB uploads.
    """
    try:
        from core.embeddings import EmbeddingsGenerator
        
        embedder = EmbeddingsGenerator()
        embedding = embedder.generate_single_embedding(request.text)
        
        return EmbedResponse(
            embedding=embedding,
            dimensions=len(embedding),
            model=embedder.model
        )
    
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ZANTARA RAG",
        "version": "3.0.0-zantara-only",
        "status": "operational",
        "features": {
            "chromadb": search_service is not None,
            "ai": {
                "model": "ZANTARA Llama 3.1 ONLY",
                "no_fallback": True,
                "training": "22,009 Indonesian business conversations, 98.74% accuracy"
            },
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

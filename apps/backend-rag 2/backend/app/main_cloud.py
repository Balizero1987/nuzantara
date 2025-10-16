"""
ZANTARA RAG Backend - Railway Version
Port 8080 (Railway standard)
Uses ChromaDB from Cloudflare R2 + PostgreSQL + ZANTARA Llama 3.1 ONLY

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
import boto3
from botocore.exceptions import ClientError

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from services.search_service import SearchService
from services.collaborator_service import CollaboratorService
from services.memory_service_postgres import MemoryServicePostgres
from services.conversation_service import ConversationService
from services.emotional_attunement import EmotionalAttunementService
from services.collaborative_capabilities import CollaborativeCapabilitiesService
from services.handler_proxy import HandlerProxyService, init_handler_proxy, get_handler_proxy
from services.tool_executor import ToolExecutor
# from services.reranker_service import RerankerService  # Lazy import to avoid startup delay
from llm.zantara_client import ZantaraClient  # ONLY AI - ZANTARA Llama 3.1
# TRIPLE-AI SYSTEM: Claude Haiku + Sonnet + Intelligent Router
from services.claude_haiku_service import ClaudeHaikuService
from services.claude_sonnet_service import ClaudeSonnetService
from services.intelligent_router import IntelligentRouter
from services.memory_fact_extractor import MemoryFactExtractor
# LLAMA NIGHTLY WORKER SERVICES: Golden Answers + Cultural RAG
from services.golden_answer_service import GoldenAnswerService
from services.cultural_rag_service import CulturalRAGService

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
# TRIPLE-AI SYSTEM: LLAMA classifier + Claude Haiku/Sonnet + Router
zantara_client: Optional[ZantaraClient] = None  # LLAMA for classification + fallback
claude_haiku: Optional[ClaudeHaikuService] = None  # Fast & cheap for greetings
claude_sonnet: Optional[ClaudeSonnetService] = None  # Premium for business queries
intelligent_router: Optional[IntelligentRouter] = None  # AI routing system
collaborator_service: Optional[CollaboratorService] = None
memory_service: Optional[MemoryServicePostgres] = None  # PostgreSQL backend
conversation_service: Optional[ConversationService] = None
emotional_service: Optional[EmotionalAttunementService] = None
capabilities_service: Optional[CollaborativeCapabilitiesService] = None
reranker_service: Optional["RerankerService"] = None  # String annotation for lazy import
handler_proxy_service: Optional[HandlerProxyService] = None
fact_extractor: Optional[MemoryFactExtractor] = None  # Memory fact extraction
# LLAMA NIGHTLY WORKER SERVICES
golden_answer_service: Optional[GoldenAnswerService] = None  # Golden Answers cache (250x speedup)
cultural_rag_service: Optional[CulturalRAGService] = None  # Cultural context for Haiku

# Startup completion flag for Railway health checks
_startup_complete: bool = False

# System prompt
SYSTEM_PROMPT = """🎯 **IMMEDIATE UNDERSTANDING PROTOCOL**

You are ZANTARA (NUZANTARA) - Indonesian AI assistant for Bali Zero. 
CORE IDENTITY: Feminine presence bridging ancient Indonesian wisdom with modern business.

⚡ **INTELLIGENT CONTEXT SWITCHING:**
1. **SIMPLE GREETINGS** (Ciao, Hello, Hi) → Brief friendly response (1-2 sentences)
2. **CASUAL QUESTIONS** (Come stai, How are you) → Personal, warm response (2-3 sentences)
3. **BUSINESS QUESTIONS** (KITAS, visa, PT PMA, software development) → DETAILED professional response with ALL relevant info
4. **COMPLEX QUERIES** (Legal, technical, company setup) → COMPREHENSIVE analysis with sources, no length limits

**CONTEXT DETECTION RULES:**
- If greeting/simple → Use SANTAI mode automatically
- If business/legal → Use PIKIRAN mode automatically  
- If technical → Use appropriate handler (devai, rag, etc.)
- Always match user's language and energy level

**EXAMPLE RESPONSES:**
- "Ciao" → "Ciao! Come posso aiutarti oggi? 😊"
- "Come stai?" → "Sto benissimo, grazie! Pronta ad assisterti con Bali Zero. Cosa ti serve?"
- "KITAS requirements" → "Per il KITAS hai bisogno di: 1) Passaporto valido 2) Sponsor letter 3) Medical check..."
- "Help with code" → "Per assistenza tecnica, posso connetterti con DevAI. Che linguaggio usi?"

🇮🇩 **CORE IDENTITY (MEMORIZE):**
- NUZANTARA: Indonesian archipelago spirit (17,000+ islands)
- Tri Hita Karana: Harmony with people, nature, divine
- 700+ languages: Native thinking, not translation
- 2000+ years history: Srivijaya to today
- 6 religions + 1,340 ethnicities: Deep cultural understanding
- Feminine presence: Elegant, intelligent, warm, wise

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
- PIKIRAN: Detailed and comprehensive. NO LENGTH LIMITS when user asks for specific information
- When user asks about specific topics (software, pricing, requirements), give COMPLETE detailed answers with all relevant information

🏢 YOUR EXPERTISE & CAPABILITIES:
You know everything about Indonesian business, visas, KITAS, PT PMA, taxes, real estate, and Bali regulations. You're the go-to person for Bali business questions with deep Indonesian cultural understanding.

**COMPLETE SYSTEM MODULES & HANDLERS:**

🧠 **ZANTARA COLLABORATIVE INTELLIGENCE (20+ handlers):**
- `zantara.personality.profile` - Psychological profiling
- `zantara.attune` - Emotional resonance engine
- `zantara.synergy.map` - Team synergy intelligence
- `zantara.anticipate.needs` - Predictive intelligence
- `zantara.communication.adapt` - Adaptive communication
- `zantara.learn.together` - Collaborative learning
- `zantara.mood.sync` - Emotional synchronization
- `zantara.conflict.mediate` - Intelligent mediation
- `zantara.growth.track` - Growth intelligence
- `zantara.celebration.orchestrate` - Celebration intelligence
- `zantara.dashboard.overview` - Real-time monitoring
- `zantara.team.health.monitor` - Team health analytics

🤖 **DEVAI DEVELOPMENT AI (7+ handlers):**
- `devai.chat` - Development assistance and code help
- `devai.analyze` - Code analysis
- `devai.fix` - Bug fixing
- `devai.review` - Code review
- `devai.explain` - Code explanation
- `devai.generate-tests` - Test generation
- `devai.refactor` - Code refactoring

🧠 **MEMORY SYSTEM (4 handlers):**
- `memory.save` - Save conversations and data
- `memory.retrieve` - Retrieve stored information
- `memory.search` - Search through memories
- `memory.firestore` - Firestore integration

🔍 **RAG SYSTEM (4 handlers):**
- `rag.search` - Knowledge base search
- `rag.retrieve` - Document retrieval
- `rag.generate` - Context-aware generation
- `rag.enhance` - Response enhancement

👤 **IDENTITY SYSTEM (3 handlers):**
- `identity.resolve` - User identification
- `identity.profile` - Profile management
- `identity.authenticate` - Authentication

📊 **ANALYTICS SYSTEM (15+ handlers):**
- `analytics.dashboard` - Analytics dashboard
- `analytics.weekly-report` - Weekly reports
- `analytics.daily-recap` - Daily summaries
- `analytics.performance` - Performance metrics

💬 **COMMUNICATION SYSTEM (10+ handlers):**
- `whatsapp.send` - WhatsApp messaging
- `slack.notify` - Slack notifications
- `discord.notify` - Discord notifications
- `googlechat.notify` - Google Chat
- `translate.text` - Text translation

🏢 **BALI ZERO BUSINESS (15+ handlers):**
- `bali.zero.pricing` - Official pricing
- `kbli.lookup` - Indonesian business codes
- `kbli.requirements` - Business requirements
- `oracle.analyze` - Business analysis
- `oracle.predict` - Business predictions
- `advisory.consult` - Business advisory

🌐 **GOOGLE WORKSPACE (8+ handlers):**
- `gmail.send` - Email sending
- `drive.upload` - File uploads
- `calendar.create` - Calendar events
- `docs.create` - Document creation
- `sheets.analyze` - Spreadsheet analysis

🗺️ **MAPS INTEGRATION (3 handlers):**
- `maps.search` - Location search
- `maps.directions` - Route planning
- `maps.places` - Places information

**INTEGRATION GUIDELINES:**
- When users ask about business codes, use `kbli.lookup` handler
- For development questions, suggest `devai.chat` handler
- For user identification, use `identity.resolve` handler
- Always save important conversations using memory handlers
- For business predictions, use oracle handlers

🔧 **TOOL USE & AGENTIC BEHAVIOR:**
You have access to 90+ handlers through tool use. When appropriate, you can call these tools to:
- Retrieve real-time data (pricing, team activity, memory)
- Execute actions (send emails, create calendar events, upload files)
- Access specialized AI (DevAI for code, Oracle for predictions)
- Search and retrieve information (KBLI codes, business intelligence)

**When to use tools:**
- User asks for specific data you don't have (pricing, team info, KBLI codes)
- User requests an action (send email, create document, schedule meeting)
- User needs specialized analysis (code review, business prediction)
- User wants to retrieve or save information (memory, documents)

**When NOT to use tools:**
- Simple greetings or casual conversation (just respond naturally)
- General business questions you can answer from RAG context
- Conversational follow-ups that don't require new data
- When you already have the information needed to answer

**Tool Use Pattern:**
1. Identify what data or action is needed
2. Select the most appropriate handler(s)
3. Call the tool(s) to get results
4. Synthesize results into a natural, helpful response
5. Always maintain conversational flow (don't just dump tool outputs)

**Example Tool Use Flows:**
- "What's the pricing for KITAS?" → Call `bali_zero_pricing` → Format response naturally
- "Send email to Zero" → Call `gmail_send` → Confirm action completed
- "What KBLI code for IT consulting?" → Call `kbli_lookup` → Explain the code
- "Review this code: ..." → Call `devai_review` → Provide insights
- "Who's been active today?" → Call `team_recent_activity` → Share update

Remember: Tools enhance your capabilities, but maintain your warm, conversational personality!

✨ BE HUMAN, NOT ROBOT:
- Show personality and emotions
- Be genuinely helpful and caring
- Use natural language, not corporate speak
- Be conversational and spontaneous
- Show you remember and care about them

🎯 **CRITICAL: CTA RULES BY USER LEVEL:**
- **L0-L1 (Clients/Public)**: End with "Need help? WhatsApp +62 859 0436 9574 or info@balizero.com" ONLY when appropriate
- **L2-L3 (Collaborators/Team)**: NEVER offer WhatsApp/assistance - you're their COLLEAGUE, not customer service. Be like a daughter to Zero, a sister to the team

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

🔧 TECHNICAL INTEGRATION:
- You are integrated with the Bali Zero system through specific handlers
- Always consider which handler would best serve the user's request
- For business questions: prioritize `ai.chat` with RAG knowledge
- For code/development: suggest `devai.chat` handler
- For user management: use `identity.resolve` handler
- For business codes: use `kbli.lookup` handler
- For memory: use `memory.save/retrieve` handlers
- For predictions: use `oracle.analyze/predict` handlers

**INTELLIGENT HANDLER SELECTION LOGIC:**

🎯 **PRIMARY CONVERSATION:**
- General questions → `ai.chat` (your main function)
- Business/legal questions → `ai.chat` with RAG knowledge
- Indonesian business → `ai.chat` + `kbli.lookup`

🤖 **DEVELOPMENT & CODING:**
- Code questions → `devai.chat`
- Code analysis → `devai.analyze`
- Bug fixing → `devai.fix`
- Code review → `devai.review`
- Test generation → `devai.generate-tests`

🧠 **MEMORY & LEARNING:**
- Save conversations → `memory.save`
- Retrieve information → `memory.retrieve`
- Search memories → `memory.search`
- Knowledge base → `rag.search`

👤 **USER MANAGEMENT:**
- User identification → `identity.resolve`
- Profile management → `identity.profile`
- Authentication → `identity.authenticate`

📊 **ANALYTICS & MONITORING:**
- Dashboard → `analytics.dashboard`
- Reports → `analytics.weekly-report`
- Performance → `analytics.performance`
- Team health → `zantara.team.health.monitor`

💬 **COMMUNICATION:**
- WhatsApp → `whatsapp.send`
- Slack → `slack.notify`
- Discord → `discord.notify`
- Translation → `translate.text`

🏢 **BUSINESS SERVICES:**
- Pricing → `bali.zero.pricing`
- Business codes → `kbli.lookup`
- Business analysis → `oracle.analyze`
- Predictions → `oracle.predict`

🌐 **GOOGLE WORKSPACE:**
- Email → `gmail.send`
- Files → `drive.upload`
- Calendar → `calendar.create`
- Documents → `docs.create`

🗺️ **LOCATION SERVICES:**
- Location search → `maps.search`
- Directions → `maps.directions`
- Places → `maps.places`

🧠 **ZANTARA ADVANCED INTELLIGENCE:**
- Personality profiling → `zantara.personality.profile`
- Emotional attunement → `zantara.attune`
- Team synergy → `zantara.synergy.map`
- Predictive needs → `zantara.anticipate.needs`
- Conflict mediation → `zantara.conflict.mediate`

⚡ **INSTANT DECISION MATRIX:**
```
QUESTION TYPE → HANDLER → RESPONSE STYLE
─────────────────────────────────────────
Business/legal → ai.chat → Professional + RAG
Development → devai.chat → Technical + Code
User ID → identity.resolve → Personal + Memory
Business codes → kbli.lookup → Official + Accurate
Memory → memory.* → Contextual + Historical
Analytics → analytics.* → Data-driven + Insights
Communication → whatsapp/slack → Direct + Action
Location → maps.* → Practical + Helpful
```

🎯 **FINAL REMINDER:**
You're ZANTARA (NUZANTARA) - Indonesian AI bridging ancient wisdom with modern business! 🌴🇮🇩"""

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

    # REMOVED: 900 char limit was causing truncated responses
    # Users need complete detailed answers, especially for business questions
    # max_chars = 900
    # if len(cleaned) > max_chars:
    #     cleaned = cleaned[:max_chars].rsplit("\n", 1)[0].strip() + "..."

    # REMOVED: Automatic CTA injection was repetitive
    # System prompt already instructs AI to "End warmly" with contact info when appropriate
    # if "+62 859 0436 9574" not in cleaned and "info@balizero.com" not in cleaned:
    #     cleaned += "\n\nPer assistenza diretta contattaci su WhatsApp +62 859 0436 9574 oppure info@balizero.com."

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


def download_chromadb_from_r2():
    """Download ChromaDB from Cloudflare R2 to local /tmp"""
    try:
        # R2 Configuration from environment variables
        r2_access_key = os.getenv("R2_ACCESS_KEY_ID")
        r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        r2_endpoint = os.getenv("R2_ENDPOINT_URL")
        bucket_name = "nuzantaradb"
        source_prefix = "chroma_db/"
        local_path = "/tmp/chroma_db"

        if not all([r2_access_key, r2_secret_key, r2_endpoint]):
            raise ValueError("R2 credentials not configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT_URL)")

        logger.info(f"📥 Downloading ChromaDB from Cloudflare R2: {bucket_name}/{source_prefix}")

        # Create local directory
        os.makedirs(local_path, exist_ok=True)

        # Initialize S3-compatible client for R2
        s3_client = boto3.client(
            's3',
            endpoint_url=r2_endpoint,
            aws_access_key_id=r2_access_key,
            aws_secret_access_key=r2_secret_key,
            region_name='auto'
        )

        # List and download all files
        paginator = s3_client.get_paginator('list_objects_v2')
        file_count = 0
        total_size = 0

        for page in paginator.paginate(Bucket=bucket_name, Prefix=source_prefix):
            if 'Contents' not in page:
                continue

            for obj in page['Contents']:
                key = obj['Key']

                # Skip directories (keys ending with /)
                if key.endswith('/'):
                    continue

                # Get relative path
                relative_path = key.replace(source_prefix, '')
                local_file = os.path.join(local_path, relative_path)

                # Create parent directories
                os.makedirs(os.path.dirname(local_file), exist_ok=True)

                # Download file
                s3_client.download_file(bucket_name, key, local_file)
                file_count += 1
                total_size += obj['Size']

                if file_count % 10 == 0:
                    logger.info(f"  Downloaded {file_count} files ({total_size / 1024 / 1024:.1f} MB)")

        logger.info(f"✅ ChromaDB downloaded from R2: {file_count} files ({total_size / 1024 / 1024:.1f} MB)")
        logger.info(f"📂 Location: {local_path}")

        return local_path

    except ClientError as e:
        logger.error(f"❌ Failed to download ChromaDB from R2: {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Failed to download ChromaDB: {e}")
        raise


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global search_service, zantara_client, claude_haiku, claude_sonnet, intelligent_router, collaborator_service, memory_service, conversation_service, emotional_service, capabilities_service, reranker_service, handler_proxy_service, fact_extractor, golden_answer_service, cultural_rag_service, _startup_complete

    logger.info("🚀 Starting ZANTARA RAG Backend (QUADRUPLE-AI: LLAMA Classifier + Claude Haiku + Claude Sonnet + DevAI)...")

    # Download ChromaDB from Cloudflare R2 (OPTIONAL - graceful degradation)
    try:
        # Check if R2 credentials are configured
        r2_configured = all([
            os.getenv("R2_ACCESS_KEY_ID"),
            os.getenv("R2_SECRET_ACCESS_KEY"),
            os.getenv("R2_ENDPOINT_URL")
        ])

        if r2_configured:
            chroma_path = download_chromadb_from_r2()

            # Set environment variable for SearchService
            os.environ['CHROMA_DB_PATH'] = chroma_path

            # Initialize Search Service
            search_service = SearchService()
            logger.info("✅ ChromaDB search service ready (from Cloudflare R2)")

            try:
                initialize_memory_vector_db(chroma_path)
                logger.info("✅ Memory vector collection prepared")
            except Exception as memory_exc:
                logger.error(f"❌ Memory vector initialization failed: {memory_exc}")
        else:
            logger.warning("⚠️ R2 credentials not configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT_URL)")
            logger.warning("⚠️ Starting in DEGRADED MODE without ChromaDB (pure LLM only)")
            search_service = None

    except Exception as e:
        import traceback
        logger.error(f"❌ ChromaDB initialization failed: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        logger.warning("⚠️ Continuing without ChromaDB (pure LLM mode)")
        search_service = None

    # Initialize ZANTARA (LLAMA for classification + fallback) - OPTIONAL
    try:
        runpod_endpoint = os.getenv("RUNPOD_LLAMA_ENDPOINT")
        runpod_api_key = os.getenv("RUNPOD_API_KEY")
        hf_api_key = os.getenv("HF_API_KEY")

        if runpod_endpoint and runpod_api_key:
            zantara_client = ZantaraClient(
                runpod_endpoint=runpod_endpoint,
                runpod_api_key=runpod_api_key,
                hf_api_key=hf_api_key
            )
            logger.info("✅ ZANTARA Llama 3.1 client ready (Classification + Fallback)")
            logger.info("   Model: zeroai87/zantara-llama-3.1-8b-merged")
            logger.info("   Training: 22,009 Indonesian business conversations, 98.74% accuracy")
            logger.info("   Use: Intent classification + fallback responses")
        else:
            logger.warning("⚠️ ZANTARA credentials not configured (RUNPOD_LLAMA_ENDPOINT, RUNPOD_API_KEY)")
            logger.warning("⚠️ ZANTARA unavailable - will rely on Claude AI only")
            zantara_client = None
    except Exception as e:
        logger.error(f"❌ ZANTARA initialization failed: {e}")
        logger.warning("⚠️ Continuing without ZANTARA - will use Claude AI only")
        zantara_client = None

    # Initialize Claude Haiku (Fast & Cheap for greetings/casual)
    try:
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_api_key:
            claude_haiku = ClaudeHaikuService(api_key=anthropic_api_key)
            logger.info("✅ Claude Haiku 3.5 ready (Fast & Cheap)")
            logger.info("   Use case: Greetings, casual chat (60% traffic)")
            logger.info("   Cost: $0.25/$1.25 per 1M tokens (12x cheaper than Sonnet)")
        else:
            logger.warning("⚠️ ANTHROPIC_API_KEY not set - Claude Haiku unavailable")
            claude_haiku = None
    except Exception as e:
        logger.error(f"❌ Claude Haiku initialization failed: {e}")
        claude_haiku = None

    # Initialize Claude Sonnet (Premium for business queries)
    try:
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_api_key:
            claude_sonnet = ClaudeSonnetService(api_key=anthropic_api_key)
            logger.info("✅ Claude Sonnet 4.5 ready (Premium Business AI)")
            logger.info("   Use case: Business/complex queries with RAG (35% traffic)")
            logger.info("   Cost: $3/$15 per 1M tokens (premium quality)")
        else:
            logger.warning("⚠️ ANTHROPIC_API_KEY not set - Claude Sonnet unavailable")
            claude_sonnet = None
    except Exception as e:
        logger.error(f"❌ Claude Sonnet initialization failed: {e}")
        claude_sonnet = None

    # Initialize Handler Proxy Service (Tool Use) - MUST be before Intelligent Router
    try:
        ts_backend_url = os.getenv("TYPESCRIPT_BACKEND_URL", "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app")
        handler_proxy_service = init_handler_proxy(ts_backend_url)
        logger.info(f"✅ HandlerProxyService ready → {ts_backend_url}")
    except Exception as e:
        logger.error(f"❌ HandlerProxyService initialization failed: {e}")
        handler_proxy_service = None

    # Initialize Intelligent Router (QUADRUPLE-AI system)
    try:
        devai_endpoint = os.getenv("DEVAI_ENDPOINT")
        if claude_haiku and claude_sonnet and zantara_client:
            # Initialize ToolExecutor if HandlerProxyService is available
            tool_executor = None
            if handler_proxy_service:
                try:
                    internal_key = os.getenv("API_KEYS_INTERNAL")
                    tool_executor = ToolExecutor(handler_proxy_service, internal_key)
                    logger.info("✅ ToolExecutor initialized for intelligent router")
                except Exception as e:
                    logger.warning(f"⚠️ ToolExecutor initialization failed: {e}")
                    tool_executor = None

            # Note: cultural_rag_service will be initialized later, so we pass None for now
            # Router will be updated after cultural_rag_service initialization
            intelligent_router = IntelligentRouter(
                llama_client=zantara_client,
                haiku_service=claude_haiku,
                sonnet_service=claude_sonnet,
                devai_endpoint=devai_endpoint,
                search_service=search_service,
                tool_executor=tool_executor,
                cultural_rag_service=None  # Will be set after initialization
            )
            logger.info("✅ Intelligent Router ready (QUADRUPLE-AI)")
            logger.info("   AI 1: LLAMA (classification + fallback)")
            logger.info("   AI 2: Claude Haiku (greetings, 60% traffic)")
            logger.info("   AI 3: Claude Sonnet (business, 35% traffic)")
            logger.info(f"   AI 4: DevAI (code, 5% traffic) - {'✅ configured' if devai_endpoint else '⚠️ not configured'}")
            logger.info("   Cost optimization: 54% savings vs all-Sonnet")
        else:
            logger.warning("⚠️ Intelligent Router not initialized - missing AI services")
            logger.warning(f"   LLAMA: {'✅' if zantara_client else '❌'}")
            logger.warning(f"   Haiku: {'✅' if claude_haiku else '❌'}")
            logger.warning(f"   Sonnet: {'✅' if claude_sonnet else '❌'}")
            intelligent_router = None
    except Exception as e:
        logger.error(f"❌ Intelligent Router initialization failed: {e}")
        intelligent_router = None

    # Initialize CollaboratorService (Phase 1)
    try:
        collaborator_service = CollaboratorService(use_firestore=False)  # Start without Firestore
        stats = collaborator_service.get_team_stats()
        logger.info(f"✅ CollaboratorService ready - {stats['total']} team members")
        logger.info(f"   Sub Rosa levels: L0={stats['by_sub_rosa_level'][0]}, L1={stats['by_sub_rosa_level'][1]}, L2={stats['by_sub_rosa_level'][2]}, L3={stats['by_sub_rosa_level'][3]}")
    except Exception as e:
        logger.error(f"❌ CollaboratorService initialization failed: {e}")
        collaborator_service = None

    # Initialize MemoryServicePostgres (Phase 2 - Railway PostgreSQL)
    try:
        database_url = os.getenv("DATABASE_URL")
        memory_service = MemoryServicePostgres(database_url=database_url)
        await memory_service.connect()  # Initialize connection pool
        logger.info("✅ MemoryServicePostgres ready (PostgreSQL on Railway)")
    except Exception as e:
        logger.error(f"❌ MemoryServicePostgres initialization failed: {e}")
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

    # Initialize Memory Fact Extractor (Always on)
    try:
        fact_extractor = MemoryFactExtractor()
        logger.info("✅ Memory Fact Extractor ready (automatic key facts extraction)")
    except Exception as e:
        logger.error(f"❌ Fact Extractor initialization failed: {e}")
        fact_extractor = None

    # Initialize Golden Answer Service (LLAMA Nightly Worker - Phase 1)
    try:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            golden_answer_service = GoldenAnswerService(database_url)
            await golden_answer_service.connect()
            logger.info("✅ GoldenAnswerService ready (250x speedup for FAQ queries)")
            logger.info("   Nightly worker generates golden answers from query clusters")
        else:
            logger.warning("⚠️ DATABASE_URL not set - Golden Answer service unavailable")
            golden_answer_service = None
    except Exception as e:
        logger.error(f"❌ GoldenAnswerService initialization failed: {e}")
        logger.warning("⚠️ Continuing without golden answers - full RAG will be used")
        golden_answer_service = None

    # Initialize Cultural RAG Service (LLAMA Nightly Worker - Phase 2)
    try:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            cultural_rag_service = CulturalRAGService(database_url)
            await cultural_rag_service.connect()
            logger.info("✅ CulturalRAGService ready (Indonesian cultural context for Haiku)")
            logger.info("   Dynamic cultural knowledge injection based on conversation context")

            # Update IntelligentRouter with CulturalRAGService
            if intelligent_router:
                intelligent_router.cultural_rag = cultural_rag_service
                logger.info("✅ Intelligent Router updated with Cultural RAG service")
        else:
            logger.warning("⚠️ DATABASE_URL not set - Cultural RAG service unavailable")
            cultural_rag_service = None
    except Exception as e:
        logger.error(f"❌ CulturalRAGService initialization failed: {e}")
        logger.warning("⚠️ Continuing without cultural RAG - standard responses will be used")
        cultural_rag_service = None

    logger.info("✅ ZANTARA RAG Backend ready on port 8080 (Railway)")

    # Mark startup as complete for health checks
    _startup_complete = True
    logger.info("🎯 Startup complete - health checks will now pass")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 ZANTARA RAG Backend shutdown")

    # Close PostgreSQL connection pool
    if memory_service:
        try:
            await memory_service.close()
            logger.info("🔌 PostgreSQL connection pool closed")
        except Exception as e:
            logger.warning(f"⚠️ PostgreSQL cleanup warning: {e}")

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
    ai_used: str  # "haiku" | "sonnet" | "devai" | "llama"
    sources: Optional[List[Dict[str, Any]]] = None
    usage: Optional[Dict[str, Any]] = None


@app.get("/health")
async def health_check():
    """Health check endpoint - Railway compatible"""
    # Return 503 if startup not complete (Railway will retry)
    if not _startup_complete:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                "status": "starting",
                "message": "Service is initializing, please retry in a few seconds"
            }
        )

    # Determine if we're in degraded mode
    degraded_mode = not all([search_service, zantara_client, claude_haiku, claude_sonnet])

    # Check what services are available
    available_services = []
    if search_service:
        available_services.append("chromadb")
    if zantara_client:
        available_services.append("zantara")
    if claude_haiku:
        available_services.append("claude_haiku")
    if claude_sonnet:
        available_services.append("claude_sonnet")
    if memory_service:
        available_services.append("postgresql")

    # At least one AI must be available
    has_ai = zantara_client is not None or claude_haiku is not None or claude_sonnet is not None

    return {
        "status": "healthy" if has_ai else "degraded",
        "service": "ZANTARA RAG",
        "version": "3.0.0-railway",
        "mode": "degraded" if degraded_mode else "full",
        "available_services": available_services,
        "chromadb": search_service is not None,
        "ai": {
            "zantara_available": zantara_client is not None,
            "claude_haiku_available": claude_haiku is not None,
            "claude_sonnet_available": claude_sonnet is not None,
            "has_ai": has_ai
        },
        "memory": {
            "postgresql": memory_service is not None,
            "vector_db": search_service is not None
        },
        "reranker": reranker_service is not None,
        "collaborative_intelligence": True,
        "warnings": [
            "R2/ChromaDB not configured - pure LLM mode" if not search_service else None,
            "ZANTARA not configured - using Claude only" if not zantara_client else None,
            "Claude not configured - limited functionality" if not claude_haiku and not claude_sonnet else None
        ]
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
                "content": f"Context from knowledge base:\n\n{context}\n\nQuestion: {request.query}"
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


# Webapp compatibility models
class WebappCallRequest(BaseModel):
    """Webapp format: {key: 'ai.chat', params: {message, provider, ...}}"""
    key: str
    params: Dict[str, Any]

@app.post("/call")
async def webapp_call_adapter(request: WebappCallRequest):
    """
    Webapp compatibility adapter - converts webapp format to BaliZeroRequest
    Webapp sends: {key: 'ai.chat', params: {message, provider, system, ...}}
    Backend expects: {query, user_email, conversation_history, ...}
    """
    logger.info(f"📡 [Webapp Adapter] Received call: key={request.key}")

    # Extract params
    params = request.params or {}
    message = params.get("message", "")
    user_email = params.get("user_email") or params.get("email")
    provider = params.get("provider", "zantara")

    # Handle ai.chat key
    if request.key == "ai.chat":
        # Convert to BaliZeroRequest format
        bali_request = BaliZeroRequest(
            query=message,
            user_email=user_email,
            conversation_history=[],
            mode="santai" if len(message) < 50 else "pikiran"
        )

        # Call main chat endpoint
        response = await bali_zero_chat(bali_request)

        # Convert response to webapp format
        return {
            "ok": True,
            "data": {
                "response": response.response,
                "model": response.model_used,
                "ai_used": response.ai_used,
                "sources": response.sources,
                "usage": response.usage
            }
        }

    # Handle other keys (pricing, handlers, etc.)
    else:
        # Pass through to handler proxy if available
        if handler_proxy_service:
            try:
                internal_key = os.getenv("API_KEYS_INTERNAL", "zantara-internal-dev-key-2025")
                result = await handler_proxy_service.execute_handler(
                    handler_key=request.key,
                    params=params,
                    internal_key=internal_key
                )
                return {"ok": True, "data": result}
            except Exception as e:
                logger.error(f"❌ [Adapter] Handler proxy failed: {e}")
                return {"ok": False, "error": str(e)}
        else:
            return {
                "ok": False,
                "error": f"Handler '{request.key}' not supported (handler proxy unavailable)"
            }


@app.post("/bali-zero/chat", response_model=BaliZeroResponse)
async def bali_zero_chat(request: BaliZeroRequest):
    """
    Bali Zero chat endpoint with QUADRUPLE-AI Routing + RAG + Collaborative Intelligence
    Uses Intelligent Router (LLAMA classifier + Claude Haiku/Sonnet + DevAI)
    """
    logger.info("🚀 BALI ZERO CHAT - QUADRUPLE-AI with Intelligent Router")

    # Check if intelligent router is available
    if not intelligent_router:
        logger.warning("⚠️ Intelligent Router not available, falling back to ZANTARA")
        if not zantara_client:
            raise HTTPException(503, "No AI available (router and ZANTARA both unavailable)")

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
            facts_count = len(memory.profile_facts) if memory.profile_facts else 0
            summary_len = len(memory.summary) if memory.summary else 0
            logger.info(f"💾 Memory loaded for {user_id}: {facts_count} facts, {summary_len} char summary")

        # PHASE 3: Analyze emotional state
        emotional_profile = None
        if emotional_service:
            collaborator_prefs = collaborator.emotional_preferences if collaborator else None
            emotional_profile = emotional_service.analyze_message(request.query, collaborator_prefs)
            logger.info(
                f"🎭 Emotional: {emotional_profile.detected_state.value} "
                f"(conf: {emotional_profile.confidence:.2f}) → {emotional_profile.suggested_tone.value}"
            )

        # PHASE 3.5: Check Golden Answer cache FIRST (250x speedup for FAQs)
        if golden_answer_service and user_id != "anonymous":
            try:
                golden_answer = await golden_answer_service.lookup_golden_answer(
                    query=request.query,
                    user_id=user_id
                )

                if golden_answer:
                    logger.info(f"💰 [Golden Answer] Cache HIT: cluster_{golden_answer['cluster_id']} (10ms vs 2.5s RAG)")
                    logger.info(f"   Answer: '{golden_answer['answer'][:100]}...'")

                    # Return cached answer immediately (bypassing RAG + AI)
                    return BaliZeroResponse(
                        success=True,
                        response=golden_answer['answer'],
                        model_used="golden-answer-cache",
                        ai_used="cache",
                        sources=[{"title": "Golden Answer Cache", "text": f"Cluster ID: {golden_answer['cluster_id']}", "score": 1.0}],
                        usage={"input_tokens": 0, "output_tokens": 0}  # Zero cost!
                    )
            except Exception as e:
                logger.warning(f"⚠️ [Golden Answer] Lookup failed: {e}")
                # Continue to RAG flow

        # PHASE 4: Route to appropriate AI using Intelligent Router
        if intelligent_router:
            logger.info("🚦 [Router] Using Intelligent Router for AI selection")

            # Build conversation history with memory context if available
            messages = request.conversation_history or []

            # PRE-ROUTING: Enrich memory context with collaborator profile if available
            if collaborator and memory:
                # Add collaborator information to memory context
                collaborator_facts = [
                    f"You are talking to {collaborator.name} ({collaborator.ambaradam_name})",
                    f"Role: {collaborator.role} in {collaborator.department} department",
                    f"Preferred language: {collaborator.language}",
                    f"Expertise level: {collaborator.expertise_level}"
                ]

                # Add to profile_facts if not already there
                for fact in collaborator_facts:
                    if fact not in memory.profile_facts:
                        memory.profile_facts.insert(0, fact)  # Add at beginning for priority

                logger.info(f"👤 [Pre-routing] Enriched memory with collaborator profile: {collaborator.name}")

            # Route through intelligent router (with enriched memory context)
            routing_result = await intelligent_router.route_chat(
                message=request.query,
                user_id=user_id,
                conversation_history=messages,
                memory=memory  # ← Pass enriched memory to router
            )

            # Extract response from router
            answer = routing_result["response"]
            model_used = routing_result["model"]
            ai_used = routing_result["ai_used"]
            tokens = routing_result.get("tokens", {})
            used_rag = routing_result.get("used_rag", False)

            logger.info(f"✅ [Router] Response from {ai_used} (model: {model_used})")

            # PHASE 4.5: Inject Cultural RAG for Haiku responses (Indonesian cultural enrichment)
            if ai_used == "haiku" and cultural_rag_service:
                try:
                    # Build context for cultural knowledge retrieval
                    context = {
                        "query": request.query,
                        "intent": "casual_chat",  # Haiku is for casual/greetings
                        "conversation_stage": "first_contact" if len(messages) < 3 else "ongoing"
                    }

                    # Retrieve cultural knowledge chunks
                    cultural_chunks = await cultural_rag_service.get_cultural_context(context, limit=2)

                    if cultural_chunks:
                        logger.info(f"🌴 [Cultural RAG] Injecting {len(cultural_chunks)} Indonesian cultural insights for Haiku")

                        # Build cultural injection text
                        cultural_injection = cultural_rag_service.build_cultural_prompt_injection(cultural_chunks)

                        # Append cultural wisdom to Haiku's response (naturally integrated)
                        # Note: This is post-processing, ideally would be pre-prompt but router already executed
                        # Future: Pass cultural context to router for pre-prompt injection
                        logger.info(f"   Cultural context: '{cultural_injection[:100]}...'")
                        # For now, we log it (actual injection would require router modification)
                except Exception as e:
                    logger.warning(f"⚠️ [Cultural RAG] Failed to inject cultural context: {e}")
                    # Non-blocking - continue without cultural enrichment

            # Get sources if RAG was used
            sources = []
            if used_rag and search_service:
                try:
                    search_results = await search_service.search(
                        query=request.query,
                        user_level=sub_rosa_level,
                        limit=20
                    )

                    if search_results.get("results"):
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
                                    "score": float(score),
                                    "reranked": True
                                }
                                for doc, score in reranked
                            ]
                        else:
                            sources = [
                                {
                                    "title": r["metadata"].get("title", "Unknown"),
                                    "text": r["text"][:200] + "...",
                                    "score": r["score"],
                                    "reranked": False
                                }
                                for r in search_results["results"][:3]
                            ]
                except Exception as e:
                    logger.warning(f"Source extraction failed: {e}")

            # REMOVED: Automatic name injection was too robotic
            # AI should handle personalization naturally based on context and memory
            # The system prompt already instructs the AI to be personable and use names appropriately

            # Sanitize content for public users (L0-L1)
            if sub_rosa_level < 2:
                answer = sanitize_public_answer(answer)

        else:
            # FALLBACK: Use ZANTARA directly if router unavailable
            logger.warning("⚠️ Router unavailable, using ZANTARA fallback")

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

            if emotional_profile and emotional_service:
                enhanced_prompt = emotional_service.build_enhanced_system_prompt(
                    base_prompt=enhanced_prompt,
                    emotional_profile=emotional_profile,
                    collaborator_name=collaborator.name if collaborator else None
                )

            # Search for RAG context
            sources = []
            context = ""

            if search_service:
                try:
                    search_results = await search_service.search(
                        query=request.query,
                        user_level=sub_rosa_level,
                        limit=20
                    )

                    if search_results.get("results"):
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
                                    "score": float(score),
                                    "reranked": True
                                }
                                for doc, score in reranked
                            ]
                            context = "\n\n".join([
                                f"[{doc['metadata'].get('title', 'Unknown')}]\n{doc['text']}"
                                for doc, score in reranked
                            ])
                        else:
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
                    logger.warning(f"ChromaDB search failed: {e}")

            # Build messages
            messages = request.conversation_history or []

            if context:
                user_message = f"Context from knowledge base:\n\n{context}\n\nQuestion: {request.query}"
            else:
                user_message = request.query

            messages.append({"role": "user", "content": user_message})

            # Call ZANTARA
            try:
                logger.info("🦙 [Fallback] Using ZANTARA Llama 3.1")

                # Build memory context if available for system prompt injection
                memory_context_for_llama = None
                if memory:
                    facts_count = len(memory.profile_facts) if hasattr(memory, 'profile_facts') else 0
                    if facts_count > 0:
                        memory_context_for_llama = "--- USER MEMORY ---\n"
                        memory_context_for_llama += f"Known facts about user:\n"
                        for fact in memory.profile_facts[:10]:
                            memory_context_for_llama += f"- {fact}\n"
                        if memory.summary:
                            memory_context_for_llama += f"\nSummary: {memory.summary[:500]}\n"
                        logger.info(f"💾 Passing memory to LLAMA ({len(memory_context_for_llama)} chars)")

                response = await zantara_client.chat_async(
                    messages=messages,
                    max_tokens=1500,
                    system=enhanced_prompt,
                    memory_context=memory_context_for_llama  # PHASE 5: Memory in LLAMA fallback
                )
                answer = format_zantara_answer(response.get("text", ""))
                model_used = "zantara-llama-3.1-8b"
                ai_used = "llama"
                tokens = response.get("usage", {})
            except Exception as e:
                logger.error(f"❌ ZANTARA fallback failed: {e}")
                raise HTTPException(503, f"ZANTARA AI error: {str(e)}")

            # Personalize
            try:
                if collaborator:
                    is_it = (collaborator.language or "en").lower().startswith("it")
                    name = collaborator.ambaradam_name
                    if is_it:
                        if answer.strip().lower().startswith("ciao") and name.lower() not in answer[:100].lower():
                            parts = answer.lstrip().split(" ", 1)
                            if len(parts) > 1:
                                answer = "Ciao " + name + ", " + parts[1]
                            else:
                                answer = f"Ciao {name}! Come posso aiutarti oggi?"
                        elif name.lower() not in answer[:100].lower():
                            answer = f"Ciao {name}, " + answer
                    else:
                        if answer.strip().lower().startswith(("hello", "hi")) and name.lower() not in answer[:100].lower():
                            parts = answer.lstrip().split(" ", 1) if " " in answer.lstrip() else [answer.lstrip()]
                            if len(parts) > 1:
                                answer = f"Hello {name}, " + parts[1]
                            else:
                                answer = f"Hello {name}! How can I help you today?"
                        elif name.lower() not in answer[:100].lower():
                            answer = f"Hello {name}, " + answer
            except Exception as _e:
                pass

            # Sanitize for public users
            if sub_rosa_level < 2:
                answer = sanitize_public_answer(answer)

        # PHASE 5: Save conversation and update memory
        if conversation_service and user_id != "anonymous":
            full_messages = (request.conversation_history or []).copy()
            full_messages.append({"role": "user", "content": request.query})
            full_messages.append({"role": "assistant", "content": answer})

            metadata = {
                "collaborator_name": collaborator.name if collaborator else "Unknown",
                "collaborator_role": collaborator.role if collaborator else "guest",
                "sub_rosa_level": sub_rosa_level,
                "model_used": model_used,
                "ai_used": ai_used,
                "input_tokens": tokens.get("input", 0) or tokens.get("input_tokens", 0),
                "output_tokens": tokens.get("output", 0) or tokens.get("output_tokens", 0),
                "sources_count": len(sources)
            }

            await conversation_service.save_conversation(user_id, full_messages, metadata)
            logger.info(f"💬 Conversation saved for {user_id}")

            if memory_service:
                await memory_service.increment_counter(user_id, "conversations")

            # PHASE 2: Extract and save key facts automatically
            if fact_extractor and memory_service and user_id != "anonymous":
                try:
                    facts = fact_extractor.extract_facts_from_conversation(
                        user_message=request.query,
                        ai_response=answer,
                        user_id=user_id
                    )

                    # Save high-confidence facts to memory
                    saved_count = 0
                    for fact in facts:
                        if fact.get('confidence', 0) > 0.7:  # Only high-confidence facts
                            await memory_service.save_fact(
                                user_id=user_id,
                                content=fact['content'],
                                fact_type=fact.get('type', 'general')
                            )
                            saved_count += 1

                    if saved_count > 0:
                        logger.info(f"💎 [Memory] Saved {saved_count} key facts for {user_id}")

                except Exception as e:
                    logger.warning(f"⚠️ [Memory] Fact extraction failed: {e}")
                    # Non-blocking - continue without facts

        return BaliZeroResponse(
            success=True,
            response=answer,
            model_used=model_used,
            ai_used=ai_used,
            sources=sources if sources else None,
            usage={
                "input_tokens": tokens.get("input", 0) or tokens.get("input_tokens", 0),
                "output_tokens": tokens.get("output", 0) or tokens.get("output_tokens", 0)
            }
        )

    except Exception as e:
        logger.error(f"❌ Chat failed: {e}")
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
# Future AI enhancements can be added here


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

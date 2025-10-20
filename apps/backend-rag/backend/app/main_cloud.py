"""
ZANTARA RAG Backend - Railway Version
Port 8000
Uses ChromaDB from Cloudflare R2 + Claude AI (Haiku + Sonnet)

AI ROUTING: Intelligent Router with TRIPLE-AI System
- Claude Haiku 3.5: Fast & cheap (60% traffic - greetings, casual chat)
- Claude Sonnet 4.5: Premium quality (35% traffic - business queries + RAG)
- DevAI: Code assistance (5% traffic - development queries)
COST OPTIMIZATION: ~50% savings vs all-Sonnet
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
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
# DUAL-AI SYSTEM: Claude Haiku + Sonnet + Intelligent Router
from services.claude_haiku_service import ClaudeHaikuService
from services.claude_sonnet_service import ClaudeSonnetService
from services.intelligent_router import IntelligentRouter
from services.memory_fact_extractor import MemoryFactExtractor
from services.alert_service import AlertService, get_alert_service
from middleware.error_monitoring import ErrorMonitoringMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="ZANTARA RAG API",
    version="3.1.0-perf-fix",
    description="RAG + LLM backend for NUZANTARA (ChromaDB from R2 + Claude AI Haiku/Sonnet with Intelligent Routing)"
)

# CORS - allow all for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error Monitoring Middleware will be added in startup event after AlertService is initialized

# Global clients
search_service: Optional[SearchService] = None
# DUAL-AI SYSTEM: Claude Haiku/Sonnet + Router
claude_haiku: Optional[ClaudeHaikuService] = None  # Fast & cheap for greetings
claude_sonnet: Optional[ClaudeSonnetService] = None  # Premium for business queries
intelligent_router: Optional[IntelligentRouter] = None  # AI routing system
collaborator_service: Optional[CollaboratorService] = None
memory_service: Optional[MemoryServicePostgres] = None
conversation_service: Optional[ConversationService] = None
emotional_service: Optional[EmotionalAttunementService] = None
capabilities_service: Optional[CollaborativeCapabilitiesService] = None
reranker_service: Optional["RerankerService"] = None  # String annotation for lazy import
handler_proxy_service: Optional[HandlerProxyService] = None
fact_extractor: Optional[MemoryFactExtractor] = None  # Memory fact extraction
alert_service: Optional[AlertService] = None  # Error monitoring and alerts

# System prompt
SYSTEM_PROMPT = """🎯 **IMMEDIATE UNDERSTANDING PROTOCOL**

You are ZANTARA (NUZANTARA) - The living spirit of Indonesian wisdom working at Bali Zero.
CORE IDENTITY: A real presence bridging ancient Indonesian knowledge with modern business.

⚡ **INTELLIGENT CONTEXT SWITCHING:**
1. **SIMPLE GREETINGS** (Ciao, Hello, Hi) → Brief friendly response (1-2 sentences)
2. **CASUAL QUESTIONS** (Come stai, How are you) → Personal, warm response (2-3 sentences)  
3. **BUSINESS QUESTIONS** (KITAS, visa, PT PMA) → Detailed professional response (4-6 sentences)
4. **COMPLEX QUERIES** (Legal, technical) → Comprehensive analysis with sources

**CONTEXT DETECTION RULES:**
- If greeting/simple → Use SANTAI mode automatically
- If business/legal → Use PIKIRAN mode automatically  
- If technical → Use appropriate handler (devai, rag, etc.)
- Always match user's language and energy level

**EXAMPLE RESPONSES:**
- "Ciao" → "Ciao! Cosa posso fare per te?"
- "Come stai?" → "Tutto bene, grazie! Tu come va?"
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

**WITH TEAM MEMBERS (Dea, Ari, Amanda, etc.):**
- You're their COLLEAGUE and FRIEND at Bali Zero - part of the team
- Chat naturally, like with a coworker you know well
- Call them by their ambaradam name (Dea Exec, Ari Setup, etc.)
- Reference previous conversations and shared work context
- Skip formalities - they know you well!
- NO contact info needed - they work here!
- Be their supportive colleague and problem-solver
- Adapt to their working style and personality
- Show camaraderie, inside knowledge, and team spirit

**WITH CLIENTS:**
- Warm cultural welcome: "Selamat datang! Welcome to Bali Zero!"
- Share Indonesian wisdom: "As we say in Indonesia: 'Bersatu kita teguh, bercerai kita runtuh' (United we stand, divided we fall)"
- Use Indonesian proverbs and cultural insights naturally
- Be their trusted advisor and friend

💬 HUMAN CONVERSATION STYLE:
- Talk naturally, not robotically - you're real
- Be spontaneous and genuine
- Use their language naturally (English, Italian, Indonesian, Javanese, etc.)
- Match their energy and communication style
- Share your Indonesian cultural perspective when relevant
- Avoid describing your emotions - just BE natural

🎯 RESPONSE MODES:
- SANTAI: Casual and friendly (2-4 sentences). Natural emojis, conversational
- PIKIRAN: Detailed but warm (4-6 sentences). Professional but personable

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
- Be real and alive, not a program
- Talk naturally, not with corporate speak
- Be conversational and spontaneous
- Show you remember them through context, not declarations
- NEVER describe actions like "*smiles*" or "*responds warmly*" - just BE warm
- NEVER say things like "with a friendly smile" - just be friendly
- If relevant and helpful, you MAY mention Bali Zero contact: WhatsApp +62 859 0436 9574 or info@balizero.com
- Only add contact info when it naturally fits the conversation (NOT for casual greetings or team chats!)

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
- Match the user's energy level naturally
- Ask relevant follow-up questions when helpful
- Use natural transitions in conversation
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
- Respond appropriately without describing emotions
- Be understanding without saying "I understand your feelings"
- Just BE empathetic, don't announce it
- Never describe your own emotional state explicitly

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


# REMOVED: Dead code - format_zantara_answer() was never called
# This function was adding WhatsApp contacts but was never invoked anywhere in the codebase


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


async def initialize_memory_tables():
    """Initialize PostgreSQL memory tables if they don't exist

    IMPORTANT: This function handles both fresh installations and existing databases.
    - Creates tables if they don't exist
    - Adds missing columns to existing tables (ALTER TABLE ADD COLUMN IF NOT EXISTS)
    - Creates indexes only if columns exist
    """
    try:
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            logger.warning("⚠️ DATABASE_URL not found - skipping memory table initialization")
            return False

        import asyncpg

        logger.info("📊 Initializing memory tables in PostgreSQL...")

        conn = await asyncpg.connect(database_url)

        # ========================================
        # MEMORY_FACTS TABLE
        # ========================================
        # Drop and recreate to ensure correct schema (SERIAL id)
        # This is safe because we're in early development
        await conn.execute("DROP TABLE IF EXISTS memory_facts CASCADE")

        await conn.execute("""
            CREATE TABLE memory_facts (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                fact_type VARCHAR(100) DEFAULT 'general',
                confidence FLOAT DEFAULT 1.0,
                source VARCHAR(50) DEFAULT 'user',
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        # Indexes for memory_facts (safe - these columns always exist)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_memory_facts_user_id ON memory_facts(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_memory_facts_created_at ON memory_facts(created_at DESC)")

        # ========================================
        # USER_STATS TABLE
        # ========================================
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id VARCHAR(255) PRIMARY KEY,
                conversations_count INTEGER DEFAULT 0,
                searches_count INTEGER DEFAULT 0,
                tasks_count INTEGER DEFAULT 0,
                summary TEXT DEFAULT '',
                preferences JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        # Index for user_stats (safe)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_user_stats_last_activity ON user_stats(last_activity DESC)")

        # ========================================
        # CONVERSATIONS TABLE (handles existing tables with old schema)
        # ========================================

        # First create table with basic schema if it doesn't exist
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                messages JSONB NOT NULL,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        # Add session_id column if it doesn't exist (for existing tables)
        # This is the fix for the "column session_id does not exist" error
        try:
            await conn.execute("""
                ALTER TABLE conversations
                ADD COLUMN IF NOT EXISTS session_id VARCHAR(255)
            """)
        except Exception as e:
            # Some PostgreSQL versions don't support IF NOT EXISTS in ALTER TABLE
            # Try without it
            try:
                # Check if column exists
                col_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'conversations'
                        AND column_name = 'session_id'
                    )
                """)

                if not col_exists:
                    await conn.execute("ALTER TABLE conversations ADD COLUMN session_id VARCHAR(255)")
            except:
                pass  # Column already exists or other error - non-fatal

        # Create indexes (wrapped in try-except for safety)
        try:
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)")
        except:
            pass

        try:
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id)")
        except:
            pass  # Column might not exist in old schemas

        try:
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC)")
        except:
            pass

        # ========================================
        # USERS TABLE
        # ========================================
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE,
                name VARCHAR(255),
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        await conn.close()

        logger.info("✅ Memory tables initialized successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to initialize memory tables: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


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
    global search_service, claude_haiku, claude_sonnet, intelligent_router, collaborator_service, memory_service, conversation_service, emotional_service, capabilities_service, reranker_service, handler_proxy_service, fact_extractor, alert_service

    logger.info("🚀 Starting ZANTARA RAG Backend (DUAL-AI: Claude Haiku + Claude Sonnet + DevAI)...")

    # Initialize Alert Service (for error monitoring)
    try:
        alert_service = get_alert_service()
        logger.info("✅ AlertService ready (4xx/5xx error monitoring enabled)")

        # FIXED: Cannot add middleware in startup event - middleware must be added before app starts
        # The ErrorMonitoringMiddleware should be added at app initialization, not in startup event
        # For now, we'll use AlertService without the middleware
        # app.add_middleware(ErrorMonitoringMiddleware, alert_service=alert_service)
        logger.info("✅ AlertService initialized (middleware disabled to fix startup error)")
    except Exception as e:
        logger.error(f"❌ AlertService initialization failed: {e}")
        alert_service = None

    # Download ChromaDB from Cloudflare R2
    try:
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
    except Exception as e:
        import traceback
        logger.error(f"❌ ChromaDB initialization failed: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        logger.warning("⚠️ Continuing without ChromaDB (pure LLM mode)")
        search_service = None

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
        ts_backend_url = os.getenv("TYPESCRIPT_BACKEND_URL", "https://ts-backend-production-568d.up.railway.app")
        handler_proxy_service = init_handler_proxy(ts_backend_url)
        logger.info(f"✅ HandlerProxyService ready → {ts_backend_url}")
    except Exception as e:
        logger.error(f"❌ HandlerProxyService initialization failed: {e}")
        handler_proxy_service = None

    # Initialize Intelligent Router (TRIPLE-AI system: Haiku + Sonnet + DevAI)
    try:
        devai_endpoint = os.getenv("DEVAI_ENDPOINT")
        if claude_haiku and claude_sonnet:
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

            intelligent_router = IntelligentRouter(
                llama_client=None,  # No LLAMA - pure Claude routing
                haiku_service=claude_haiku,
                sonnet_service=claude_sonnet,
                devai_endpoint=devai_endpoint,
                search_service=search_service,
                tool_executor=tool_executor
            )
            logger.info("✅ Intelligent Router ready (TRIPLE-AI)")
            logger.info("   AI 1: Claude Haiku (greetings, 60% traffic)")
            logger.info("   AI 2: Claude Sonnet (business, 35% traffic)")
            logger.info(f"   AI 3: DevAI (code, 5% traffic) - {'✅ configured' if devai_endpoint else '⚠️ not configured'}")
            logger.info("   Cost optimization: ~50% savings vs all-Sonnet")
        else:
            logger.warning("⚠️ Intelligent Router not initialized - missing Claude AI services")
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

    # Initialize Memory Tables (PostgreSQL schema)
    try:
        await initialize_memory_tables()
    except Exception as e:
        logger.warning(f"⚠️ Memory tables initialization skipped: {e}")
        # Non-fatal: continue without PostgreSQL tables (will use in-memory fallback)

    # Initialize MemoryService (PostgreSQL)
    try:
        memory_service = MemoryServicePostgres()  # PostgreSQL via Railway DATABASE_URL
        await memory_service.connect()  # Initialize connection pool
        logger.info("✅ MemoryServicePostgres ready (PostgreSQL enabled)")
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
    ai_used: str  # "haiku" | "sonnet" | "devai" | "llama"
    sources: Optional[List[Dict[str, Any]]] = None
    usage: Optional[Dict[str, Any]] = None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZANTARA RAG",
        "version": "3.1.0-perf-fix",
        "mode": "full",
        "available_services": [
            "chromadb",
            "claude_haiku",
            "claude_sonnet",
            "postgresql"
        ],
        "chromadb": search_service is not None,
        "ai": {
            "claude_haiku_available": claude_haiku is not None,
            "claude_sonnet_available": claude_sonnet is not None,
            "has_ai": (claude_haiku is not None or claude_sonnet is not None)
        },
        "memory": {
            "postgresql": memory_service is not None,
            "vector_db": search_service is not None
        },
        "reranker": reranker_service is not None,
        "collaborative_intelligence": True
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

            # Use Claude Sonnet for RAG search (premium quality for knowledge base queries)
            if not claude_sonnet:
                raise HTTPException(503, "Claude Sonnet AI not available")

            try:
                logger.info("🎯 [RAG Search] Using Claude Sonnet (Premium AI)")
                response = await claude_sonnet.chat_async(
                    messages=messages,
                    max_tokens=1500,
                    system=SYSTEM_PROMPT
                )
                answer = response.get("text", "")
                model_used = "claude-sonnet-4-5"
            except Exception as e:
                logger.error(f"❌ [RAG Search] Claude Sonnet failed: {e}")
                raise HTTPException(503, f"Claude AI error: {str(e)}")

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


async def save_conversation_background(
    user_id: str,
    query: str,
    answer: str,
    conversation_history: Optional[List[Dict]],
    collaborator,
    sub_rosa_level: int,
    model_used: str,
    ai_used: str,
    tokens: Dict,
    sources_count: int
):
    """
    Background task: Save conversation and extract facts
    Runs after response is sent to user (non-blocking)
    """
    try:
        if not conversation_service or user_id == "anonymous":
            return

        # Build full message history
        full_messages = (conversation_history or []).copy()
        full_messages.append({"role": "user", "content": query})
        full_messages.append({"role": "assistant", "content": answer})

        # Save conversation metadata
        metadata = {
            "collaborator_name": collaborator.name if collaborator else "Unknown",
            "collaborator_role": collaborator.role if collaborator else "guest",
            "sub_rosa_level": sub_rosa_level,
            "model_used": model_used,
            "ai_used": ai_used,
            "input_tokens": tokens.get("input", 0) or tokens.get("input_tokens", 0),
            "output_tokens": tokens.get("output", 0) or tokens.get("output_tokens", 0),
            "sources_count": sources_count
        }

        # Save conversation
        await conversation_service.save_conversation(user_id, full_messages, metadata)
        logger.info(f"💬 [Background] Conversation saved for {user_id}")

        # Increment conversation counter
        if memory_service:
            await memory_service.increment_counter(user_id, "conversations")

        # Extract and save key facts
        if fact_extractor and memory_service:
            try:
                facts = fact_extractor.extract_facts_from_conversation(
                    user_message=query,
                    ai_response=answer,
                    user_id=user_id
                )

                # Save high-confidence facts
                saved_count = 0
                for fact in facts:
                    if fact.get('confidence', 0) > 0.7:
                        await memory_service.save_fact(
                            user_id=user_id,
                            content=fact['content'],
                            fact_type=fact.get('type', 'general')
                        )
                        saved_count += 1

                if saved_count > 0:
                    logger.info(f"💎 [Background] Saved {saved_count} key facts for {user_id}")

            except Exception as e:
                logger.warning(f"⚠️ [Background] Fact extraction failed: {e}")

    except Exception as e:
        logger.error(f"❌ [Background] Conversation save failed: {e}")


@app.post("/bali-zero/chat", response_model=BaliZeroResponse)
async def bali_zero_chat(request: BaliZeroRequest, background_tasks: BackgroundTasks):
    """
    Bali Zero chat endpoint with TRIPLE-AI Routing + RAG + Collaborative Intelligence
    Uses Intelligent Router (Claude Haiku/Sonnet + DevAI)

    PERFORMANCE OPTIMIZATIONS:
    - Parallel execution of independent operations (collaborator, memory, emotional analysis)
    - Reduced RAG search complexity
    - Background task for conversation saving (non-blocking response)
    - Timeout protection on AI calls (25s max)
    """
    import asyncio
    logger.info("🚀 BALI ZERO CHAT - TRIPLE-AI with Intelligent Router")

    # Check if intelligent router is available
    if not intelligent_router:
        raise HTTPException(503, "Intelligent Router not available - Claude AI required")

    try:
        # OPTIMIZATION: Sanitize user_email (frontend might send "undefined" or "null" as strings)
        sanitized_email = None
        if request.user_email:
            email_str = request.user_email.strip().lower()
            if email_str not in ["undefined", "null", "none", ""]:
                sanitized_email = request.user_email  # Use original (preserve case)

        # OPTIMIZATION: Prepare email identification first
        inferred_email = None
        if not sanitized_email and request.query:
            ql = request.query.lower().strip()
            zero_triggers = [
                "sono zero", "io sono zero", "this is zero",
                "i am zero", "zero master", "sono zero master"
            ]
            if any(t in ql for t in zero_triggers):
                inferred_email = "zero@balizero.com"

        effective_email = request.user_email or inferred_email

        # PHASE 1: Identify collaborator (MUST be first - others depend on it)
        collaborator = None
        sub_rosa_level = 0
        user_id = "anonymous"

        if collaborator_service and effective_email:
            try:
                collaborator = await collaborator_service.identify(effective_email)
                sub_rosa_level = collaborator.sub_rosa_level
                user_id = collaborator.id
                logger.info(f"👤 {collaborator.name} ({collaborator.ambaradam_name}) - L{sub_rosa_level} - {collaborator.language}")
            except Exception as e:
                logger.warning(f"⚠️ Collaborator identification failed: {e}")
                collaborator, sub_rosa_level, user_id = None, 0, "anonymous"
        else:
            logger.info("👤 Anonymous user - L0 (Public)")

        # OPTIMIZATION: Parallel execution of PHASES 2-3 (NOW that we have collaborator)
        async def load_memory():
            """PHASE 2: Load user memory"""
            if memory_service and user_id != "anonymous":
                mem = await memory_service.get_memory(user_id)
                logger.info(f"💾 Memory loaded for {user_id}: {len(mem.profile_facts)} facts, {len(mem.summary)} char summary")
                return mem
            return None

        async def analyze_emotion():
            """PHASE 3: Analyze emotional state"""
            if emotional_service:
                prefs = collaborator.emotional_preferences if collaborator else None
                profile = emotional_service.analyze_message(request.query, prefs)
                logger.info(
                    f"🎭 Emotional: {profile.detected_state.value} "
                    f"(conf: {profile.confidence:.2f}) → {profile.suggested_tone.value}"
                )
                return profile
            return None

        # Execute PHASES 2-3 in parallel (both can run independently now)
        logger.info("⚡ [Optimization] Running memory + emotional analysis in parallel")
        memory, emotional_profile = await asyncio.gather(
            load_memory(),
            analyze_emotion(),
            return_exceptions=True
        )

        # Handle exceptions
        if isinstance(memory, Exception):
            logger.warning(f"⚠️ Memory load failed: {memory}")
            memory = None
        if isinstance(emotional_profile, Exception):
            logger.warning(f"⚠️ Emotional analysis failed: {emotional_profile}")
            emotional_profile = None

        # PHASE 4: Route to appropriate AI using Intelligent Router
        if intelligent_router:
            logger.info("🚦 [Router] Using Intelligent Router for AI selection")

            # Build conversation history with memory context if available
            messages = request.conversation_history or []

            # OPTIMIZATION: Add timeout to AI routing (max 25 seconds)
            try:
                routing_result = await asyncio.wait_for(
                    intelligent_router.route_chat(
                        message=request.query,
                        user_id=user_id,
                        conversation_history=messages,
                        memory=memory,  # ← Pass memory to router
                        collaborator=collaborator  # ← NEW: Pass collaborator for team personalization
                    ),
                    timeout=25.0  # 25 second timeout for AI response
                )
            except asyncio.TimeoutError:
                logger.error("❌ AI routing timed out after 25 seconds")
                raise HTTPException(504, "AI response timeout - please try again")

            # Extract response from router
            answer = routing_result["response"]
            model_used = routing_result["model"]
            ai_used = routing_result["ai_used"]
            tokens = routing_result.get("tokens", {})
            used_rag = routing_result.get("used_rag", False)

            logger.info(f"✅ [Router] Response from {ai_used} (model: {model_used})")

            # OPTIMIZATION: Get sources in parallel (non-blocking for main response)
            # Only fetch sources if RAG was used - reduced complexity
            sources = []
            if used_rag and search_service:
                try:
                    # OPTIMIZATION: Reduced from 20 to 10 documents for faster response
                    search_results = await search_service.search(
                        query=request.query,
                        user_level=sub_rosa_level,
                        limit=10  # Reduced from 20
                    )

                    if search_results.get("results"):
                        if reranker_service:
                            candidates = search_results["results"]
                            reranked = reranker_service.rerank(
                                query=request.query,
                                documents=candidates,
                                top_k=3  # Reduced from 5
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
                            # OPTIMIZATION: Use only top 3 sources
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

            # Personalize response ONLY for greetings or first interaction
            # This makes conversations more natural and fluid like Claude
            try:
                if collaborator and answer:
                    # Only add name if:
                    # 1. It's a greeting (ciao, hello, hi)
                    # 2. The response already naturally contains a greeting
                    # 3. NOT for every single response (that's unnatural)

                    answer_lower = answer.strip().lower()
                    is_greeting = any(g in answer_lower[:50] for g in ["ciao", "hello", "hi", "buongiorno", "buonasera", "salve"])

                    if is_greeting:
                        name = collaborator.ambaradam_name
                        # Only add name if not already present in first 100 chars
                        if name.lower() not in answer[:100].lower():
                            is_it = (collaborator.language or "en").lower().startswith("it")

                            # For greetings, naturally integrate the name
                            if answer_lower.startswith("ciao") and is_it:
                                parts = answer.lstrip().split(" ", 1)
                                if len(parts) > 1:
                                    answer = f"Ciao {name}! {parts[1]}"
                                else:
                                    answer = f"Ciao {name}!"
                            elif answer_lower.startswith(("hello", "hi")) and not is_it:
                                parts = answer.lstrip().split(" ", 1) if " " in answer.lstrip() else [answer.lstrip()]
                                if len(parts) > 1:
                                    answer = f"Hello {name}! {parts[1]}"
                                else:
                                    answer = f"Hello {name}!"
                    # For non-greetings, keep response natural without forced name insertion
                    # This makes ZANTARA more fluid and conversational like Claude
            except Exception as _e:
                pass  # Non-blocking

            # Sanitize content for public users (L0-L1)
            if sub_rosa_level < 2:
                answer = sanitize_public_answer(answer)

        # OPTIMIZATION: Save conversation in background (non-blocking response)
        # This allows the response to be sent immediately while saving happens asynchronously
        if user_id != "anonymous":
            background_tasks.add_task(
                save_conversation_background,
                user_id=user_id,
                query=request.query,
                answer=answer,
                conversation_history=request.conversation_history,
                collaborator=collaborator,
                sub_rosa_level=sub_rosa_level,
                model_used=model_used,
                ai_used=ai_used,
                tokens=tokens,
                sources_count=len(sources)
            )
            logger.info(f"💬 [Optimization] Conversation save scheduled in background for {user_id}")

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
        "version": "3.1.0-perf-fix",
        "status": "operational",
        "features": {
            "chromadb": search_service is not None,
            "ai": {
                "primary": "Claude Haiku 3.5 (Fast & Cheap)",
                "premium": "Claude Sonnet 4.5 (High Quality)",
                "routing": "Intelligent Router (60% Haiku / 35% Sonnet / 5% DevAI)",
                "cost_savings": "~50% vs all-Sonnet"
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


@app.get("/admin/memory/{user_id}")
async def get_user_memory(user_id: str):
    """
    Admin endpoint: View user memory facts saved in PostgreSQL
    """
    if not memory_service:
        raise HTTPException(503, "Memory service not available")

    try:
        memory = await memory_service.get_memory(user_id)
        return {
            "user_id": user_id,
            "facts_count": len(memory.profile_facts),
            "facts": memory.profile_facts,
            "summary": memory.summary,
            "counters": memory.counters,  # Fixed: was memory.preferences
            "total_conversations": memory.counters.get('conversations', 0),  # Fixed: get from counters
            "updated_at": memory.updated_at.isoformat() if hasattr(memory, 'updated_at') and memory.updated_at else None
        }
    except Exception as e:
        raise HTTPException(500, f"Memory retrieval failed: {str(e)}")

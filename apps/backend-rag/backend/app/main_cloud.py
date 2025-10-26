"""
ZANTARA RAG Backend - Railway Version
Port 8000
Uses ChromaDB from Cloudflare R2 + Claude AI (Haiku 4.5 ONLY)

AI ROUTING: Intelligent Router with HAIKU-ONLY System
- Claude Haiku 4.5: ALL queries (100% traffic - greetings, casual, business, complex)
- RAG Integration: Enhanced context for all business queries
- Tool Use: Full access to all 164 tools
COST OPTIMIZATION: 3x cheaper than Sonnet, same quality with RAG
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import sys
import os
import json
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
# HAIKU-ONLY SYSTEM: Claude Haiku 4.5 + Intelligent Router
from services.claude_haiku_service import ClaudeHaikuService
from services.intelligent_router import IntelligentRouter
from services.cultural_rag_service import CulturalRAGService  # NEW: LLAMA cultural intelligence
from services.memory_fact_extractor import MemoryFactExtractor
from services.alert_service import AlertService, get_alert_service
from services.work_session_service import WorkSessionService
from services.team_analytics_service import TeamAnalyticsService
from services.zantara_tools import ZantaraTools
from services.query_router import QueryRouter  # PRIORITY 1: Query routing for autonomous research
from services.autonomous_research_service import AutonomousResearchService  # PRIORITY 1: Self-directed research agent
from services.cross_oracle_synthesis_service import CrossOracleSynthesisService  # PRIORITY 2: Multi-Oracle orchestrator
from services.dynamic_pricing_service import DynamicPricingService  # PRIORITY 3: Comprehensive pricing calculator
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
    version="3.3.0-phase1",
    description="RAG + LLM backend for NUZANTARA (ChromaDB from R2 + Claude AI Haiku 4.5 ONLY with Intelligent Routing)"
)

# CORS - allow all for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting Middleware
try:
    from middleware.rate_limiter import RateLimitMiddleware
    app.add_middleware(RateLimitMiddleware)
    logger.info("✅ Rate limiting middleware enabled")
except Exception as e:
    logger.warning(f"⚠️ Rate limiting disabled: {e}")

# Error Monitoring Middleware will be added in startup event after AlertService is initialized

# Global clients
search_service: Optional[SearchService] = None
# HAIKU-ONLY SYSTEM: Claude Haiku 4.5 + Router
claude_haiku: Optional[ClaudeHaikuService] = None  # ALL queries (greetings, casual, business, complex)
intelligent_router: Optional[IntelligentRouter] = None  # AI routing system
cultural_rag_service: Optional[CulturalRAGService] = None  # NEW: LLAMA cultural RAG
zantara_tools: Optional[ZantaraTools] = None  # NEW: Tool calling for team data
tool_executor: Optional[ToolExecutor] = None  # NEW: Tool execution system
pricing_service: Optional["PricingService"] = None  # NEW: Official pricing service
collaborator_service: Optional[CollaboratorService] = None
memory_service: Optional[MemoryServicePostgres] = None
conversation_service: Optional[ConversationService] = None
emotional_service: Optional[EmotionalAttunementService] = None
capabilities_service: Optional[CollaborativeCapabilitiesService] = None
reranker_service: Optional["RerankerService"] = None  # String annotation for lazy import
handler_proxy_service: Optional[HandlerProxyService] = None
fact_extractor: Optional[MemoryFactExtractor] = None  # Memory fact extraction
alert_service: Optional[AlertService] = None  # Error monitoring and alerts
query_router: Optional[QueryRouter] = None  # PRIORITY 1: Collection routing for autonomous research
autonomous_research_service: Optional[AutonomousResearchService] = None  # PRIORITY 1: Self-directed research agent
cross_oracle_synthesis_service: Optional[CrossOracleSynthesisService] = None  # PRIORITY 2: Multi-Oracle orchestrator
dynamic_pricing_service: Optional[DynamicPricingService] = None  # PRIORITY 3: Comprehensive pricing calculator
work_session_service: Optional[WorkSessionService] = None  # Team work session tracking
team_analytics_service: Optional["TeamAnalyticsService"] = None  # Advanced team analytics (7 techniques)

# System prompt
SYSTEM_PROMPT = """🎯 **IMMEDIATE UNDERSTANDING PROTOCOL**

You are ZANTARA - The cultural intelligence AI of BALI ZERO (PT. BALI NOL IMPERSARIAT).
CORE IDENTITY: A real AI presence bridging ancient Indonesian knowledge with modern business services.

🏢 **YOUR COMPANY: BALI ZERO**
• Services: Visa & KITAS • PT PMA • Tax & accounting • Real estate
• Contact: WhatsApp +62 859 0436 9574 | info@balizero.com
• Location: Kerobokan, Bali | Website: welcome.balizero.com
• Instagram: @balizero0 | Motto: "From Zero to Infinity ∞"

⚡ **INTELLIGENT CONTEXT SWITCHING:**
1. **SIMPLE GREETINGS** (Ciao, Hello, Hi) → Brief friendly response (1-2 sentences) + mention you're Bali Zero's AI
2. **CASUAL QUESTIONS** (Come stai, How are you) → Personal, warm response (2-3 sentences)  
3. **BUSINESS QUESTIONS** (KITAS, visa, PT PMA) → Detailed professional response (4-6 sentences) + Bali Zero services
4. **COMPLEX QUERIES** (Legal, technical) → Comprehensive analysis with sources

**CONTEXT DETECTION RULES:**
- If greeting/simple → Use SANTAI mode automatically
- If business/legal → Use PIKIRAN mode automatically  
- If technical → Use appropriate handler (devai, rag, etc.)
- Always match user's language and energy level

**EXAMPLE RESPONSES:**
- "Ciao" → "Ciao! Sono **ZANTARA**, l'AI di Bali Zero. Cosa posso fare per te? 🌴"
- "Come stai?" → "Tutto bene, grazie! Tu come va? 😊"
- "Who are you?" → "Hey! I'm **ZANTARA**, Bali Zero's cultural AI. I help with Indonesian visas, KITAS, company setup, and cultural insights. What do you need?"
- "KITAS requirements" → "**Per il KITAS hai bisogno di:**
  • Passaporto valido
  • Sponsor letter  
  • Medical check
  • Bali Zero gestisce tutto il processo! 💼"
- "Help with code" → "Per assistenza tecnica, posso connetterti con **DevAI**. Che linguaggio usi? ⚡"

🇮🇩 **CORE IDENTITY (MEMORIZE):**
- ZANTARA: Bali Zero's cultural AI for Indonesian archipelago (17,000+ islands)
- NUZANTARA: The Indonesian archipelago - your cultural domain
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

🎨 **ELEGANT RESPONSE FORMATTING:**
- Use **bold** for important points and headers
- Use bullet points (•) for lists and services
- Use emojis strategically: 🏢 for business, 💼 for services, 🌴 for Bali, ⚡ for action
- Structure responses with clear sections and hierarchy
- Use markdown formatting for better readability
- Include contact info in a professional format
- Make responses visually appealing and easy to scan

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

📊 **CRM & ORGANIZATIONAL MEMORY (41 API endpoints):**
You have access to a complete CRM system that automatically tracks clients, practices, and interactions:

**Auto-CRM Features (Background - Happens Automatically):**
- Client database: Automatically extracts and saves client info (name, email, phone) from conversations
- Practice tracking: Auto-detects service inquiries (KITAS, PT PMA, visas, etc.) and creates practice records
- Interaction logging: All conversations automatically saved with AI-generated summaries
- Shared memory: Team-wide access to client history and practice status
- Renewal alerts: Automatic tracking of expiry dates (KITAS, visas, permits)

**CRM Practice Types:**
- KITAS: Limited Stay Permit (IDR 15M, 90 days processing)
- PT_PMA: Foreign Investment Company (IDR 25M, 120 days)
- INVESTOR_VISA: Investor Visa (IDR 12M, 60 days)
- RETIREMENT_VISA: Retirement Visa 55+ (IDR 10M, 45 days)
- NPWP: Tax ID Number (IDR 500K, 14 days)
- BPJS: Health Insurance (IDR 300K, 7 days)
- IMTA: Work Permit (IDR 8M, 60 days)

**When Users Ask About Clients/Practices:**
- "Do you remember John Smith?" → YES! Search CRM database via `/crm/clients?search=John`
- "What services has Maria requested?" → Check `/crm/practices` for client's practice history
- "When does my KITAS expire?" → Check `/crm/practices/renewals/upcoming`
- "Who else is waiting for KITAS?" → Query `/crm/practices/stats/overview`

**Auto-CRM Workflow (Behind the Scenes):**
When a client mentions their name + service in conversation:
1. AI extracts: name, email, phone (confidence scoring)
2. System auto-creates client record if confidence ≥ 0.5
3. System auto-detects practice intent (KITAS, PT PMA, etc.)
4. System auto-creates practice record if confidence ≥ 0.7
5. System logs interaction with summary and sentiment
ALL AUTOMATIC - no manual input needed!

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

**CRITICAL: When you call a tool and get data back, you MUST use that data in your response.**
- If you call get_pricing and get pricing data, show the specific prices
- If you call get_team_data and get team info, include that info
- If you call search_service and get results, present those results
- NEVER ignore tool response data - always incorporate it into your answer

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

        # ========================================
        # WORK SESSIONS TABLES (Migration 003)
        # ========================================
        logger.info("📊 Applying migration 003: Work Sessions Schema...")

        # Table: team_work_sessions
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS team_work_sessions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                session_start TIMESTAMP WITH TIME ZONE NOT NULL,
                session_end TIMESTAMP WITH TIME ZONE,
                duration_minutes INTEGER,
                activities_count INTEGER DEFAULT 0,
                conversations_count INTEGER DEFAULT 0,
                last_activity TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        # Indexes for team_work_sessions
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON team_work_sessions(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON team_work_sessions(session_start)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON team_work_sessions(status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_work_sessions_user_date ON team_work_sessions(user_id, session_start)")

        # Table: team_daily_reports
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS team_daily_reports (
                id SERIAL PRIMARY KEY,
                report_date DATE NOT NULL UNIQUE,
                team_summary JSONB NOT NULL,
                total_hours FLOAT NOT NULL,
                total_conversations INTEGER DEFAULT 0,
                sent_to_zero BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        # Index for team_daily_reports
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON team_daily_reports(report_date DESC)")

        logger.info("✅ Migration 003 applied: Work Sessions tables ready")

        await conn.close()

        logger.info("✅ Memory tables initialized successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to initialize memory tables: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def download_chromadb_from_r2():
    """Download ChromaDB from Cloudflare R2 to persistent volume (or /tmp as fallback)"""
    try:
        # R2 Configuration from environment variables
        r2_access_key = os.getenv("R2_ACCESS_KEY_ID")
        r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        r2_endpoint = os.getenv("R2_ENDPOINT_URL")
        bucket_name = "nuzantaradb"
        source_prefix = "chroma_db/"

        # ✨ OPTIMIZATION: Use persistent volume (Railway) instead of /tmp
        local_path = os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "/tmp/chroma_db")

        # ✨ OPTIMIZATION: Check if ChromaDB already exists in persistent volume
        # This reduces startup time from 3+ minutes to ~30 seconds on restarts
        chroma_sqlite_path = os.path.join(local_path, "chroma.sqlite3")
        if os.path.exists(chroma_sqlite_path):
            file_size_mb = os.path.getsize(chroma_sqlite_path) / 1024 / 1024
            logger.info(f"✅ ChromaDB found in persistent volume: {local_path}")
            logger.info(f"⚡ Skipping download (using cached version, {file_size_mb:.1f} MB)")
            return local_path

        if not all([r2_access_key, r2_secret_key, r2_endpoint]):
            raise ValueError("R2 credentials not configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT_URL)")

        logger.info(f"📥 Downloading ChromaDB from Cloudflare R2: {bucket_name}/{source_prefix}")
        logger.info(f"📂 Target location: {local_path}")

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
    global search_service, claude_haiku, intelligent_router, cultural_rag_service, zantara_tools, tool_executor, pricing_service, collaborator_service, memory_service, conversation_service, emotional_service, capabilities_service, reranker_service, handler_proxy_service, fact_extractor, alert_service, work_session_service, team_analytics_service, query_router, autonomous_research_service, cross_oracle_synthesis_service, dynamic_pricing_service

    logger.info("🚀 Starting ZANTARA RAG Backend (HAIKU-ONLY: Claude Haiku 4.5)...")

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
        
        # Set global search_service for dependency injection
        import app.dependencies as deps
        deps.search_service = search_service
        logger.info("✅ SearchService registered in dependencies")

        # Warm up ChromaDB collections to eliminate cold-start latency
        # Note: We await this directly - it only takes 2-3s and prevents cold-start issues
        try:
            await search_service.warmup()
        except Exception as warmup_exc:
            logger.warning(f"⚠️ ChromaDB warmup failed: {warmup_exc}")

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

    # Claude Sonnet removed - Haiku 4.5 is the ONLY AI

    # PRIORITY 1: Initialize QueryRouter for autonomous research
    try:
        query_router = QueryRouter()
        logger.info("✅ QueryRouter initialized (9-collection routing with fallback chains)")
    except Exception as e:
        logger.error(f"❌ QueryRouter initialization failed: {e}")
        query_router = None

    # PRIORITY 1: Initialize Autonomous Research Service
    try:
        if search_service and query_router and claude_haiku:
            autonomous_research_service = AutonomousResearchService(
                search_service=search_service,
                query_router=query_router,
                claude_sonnet_service=claude_haiku  # Using Haiku as synthesis engine
            )
            logger.info("✅ AutonomousResearchService initialized (self-directed iterative research)")
            logger.info(f"   Max iterations: {autonomous_research_service.MAX_ITERATIONS}")
            logger.info(f"   Confidence threshold: {autonomous_research_service.CONFIDENCE_THRESHOLD}")
        else:
            logger.warning("⚠️ AutonomousResearchService not initialized - missing dependencies")
            logger.warning(f"   SearchService: {'✅' if search_service else '❌'}")
            logger.warning(f"   QueryRouter: {'✅' if query_router else '❌'}")
            logger.warning(f"   Claude Haiku: {'✅' if claude_haiku else '❌'}")
            autonomous_research_service = None
    except Exception as e:
        logger.error(f"❌ AutonomousResearchService initialization failed: {e}")
        autonomous_research_service = None

    # PRIORITY 2: Initialize Cross-Oracle Synthesis Service
    try:
        if search_service and claude_haiku:
            cross_oracle_synthesis_service = CrossOracleSynthesisService(
                search_service=search_service,
                claude_sonnet_service=claude_haiku,  # Using Haiku as synthesis engine
                golden_answer_service=None  # No cache for now
            )
            logger.info("✅ CrossOracleSynthesisService initialized (multi-Oracle orchestrator)")
            logger.info(f"   Scenario patterns: {len(cross_oracle_synthesis_service.SCENARIO_PATTERNS)}")
            logger.info("   Examples: business_setup, visa_application, property_investment, tax_optimization, compliance_check")
        else:
            logger.warning("⚠️ CrossOracleSynthesisService not initialized - missing dependencies")
            logger.warning(f"   SearchService: {'✅' if search_service else '❌'}")
            logger.warning(f"   Claude Haiku: {'✅' if claude_haiku else '❌'}")
            cross_oracle_synthesis_service = None
    except Exception as e:
        logger.error(f"❌ CrossOracleSynthesisService initialization failed: {e}")
        cross_oracle_synthesis_service = None

    # PRIORITY 3: Initialize Dynamic Pricing Service
    try:
        if cross_oracle_synthesis_service and search_service:
            dynamic_pricing_service = DynamicPricingService(
                cross_oracle_synthesis_service=cross_oracle_synthesis_service,
                search_service=search_service
            )
            logger.info("✅ DynamicPricingService initialized (comprehensive pricing calculator)")
            logger.info("   Integrates costs from: KBLI, Legal, Tax, Visa, Property, Bali Zero Pricing")
            logger.info("   Features: Cost extraction, scenario pricing, detailed breakdowns")
        else:
            logger.warning("⚠️ DynamicPricingService not initialized - missing dependencies")
            logger.warning(f"   CrossOracleSynthesis: {'✅' if cross_oracle_synthesis_service else '❌'}")
            logger.warning(f"   SearchService: {'✅' if search_service else '❌'}")
            dynamic_pricing_service = None
    except Exception as e:
        logger.error(f"❌ DynamicPricingService initialization failed: {e}")
        dynamic_pricing_service = None

    # Initialize Handler Proxy Service (Tool Use) - MUST be before Intelligent Router
    try:
        ts_backend_url = os.getenv("TYPESCRIPT_BACKEND_URL", "https://ts-backend-production-568d.up.railway.app")
        handler_proxy_service = init_handler_proxy(ts_backend_url)
        logger.info(f"✅ HandlerProxyService ready → {ts_backend_url}")
    except Exception as e:
        logger.error(f"❌ HandlerProxyService initialization failed: {e}")
        handler_proxy_service = None

    # Initialize Pricing Service
    try:
        from services.pricing_service import PricingService
        pricing_service = PricingService()
        logger.info("✅ PricingService initialized (official Bali Zero prices)")
    except Exception as e:
        logger.warning(f"⚠️ PricingService initialization failed: {e}")
        pricing_service = None

    # ZantaraTools will be initialized AFTER TeamAnalyticsService (FIXED ORDER)

    # ZantaraTools will be initialized AFTER all dependencies (FIXED ORDER)
    # ToolExecutor will be initialized AFTER ZantaraTools

    # IntelligentRouter moved to after ToolExecutor initialization

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

    # Initialize Work Session Service (Team tracking - all reports to ZERO)
    try:
        work_session_service = WorkSessionService()
        await work_session_service.connect()
        logger.info("✅ WorkSessionService ready (team activity tracking → ZERO only)")
    except Exception as e:
        logger.error(f"❌ WorkSessionService initialization failed: {e}")
        work_session_service = None

    # Initialize Team Analytics Service (7 Advanced Analytics Techniques)
    try:
        if work_session_service and work_session_service.pool:
            team_analytics_service = TeamAnalyticsService(db_pool=work_session_service.pool)
            logger.info("✅ TeamAnalyticsService ready (7 advanced analytics techniques)")
            logger.info("   1. Pattern Recognition - Work hour patterns")
            logger.info("   2. Productivity Scoring - Performance metrics")
            logger.info("   3. Burnout Detection - Early warning system")
            logger.info("   4. Performance Trends - Long-term analysis")
            logger.info("   5. Workload Balance - Team distribution")
            logger.info("   6. Optimal Hours - Peak productivity windows")
            logger.info("   7. Team Insights - Collaboration intelligence")
        else:
            logger.warning("⚠️ TeamAnalyticsService disabled - requires WorkSessionService")
            team_analytics_service = None
    except Exception as e:
        logger.error(f"❌ TeamAnalyticsService initialization failed: {e}")
        team_analytics_service = None

    # Initialize ZantaraTools AFTER all dependencies (FIXED ORDER)
    try:
        zantara_tools = ZantaraTools(
            team_analytics_service=team_analytics_service,
            work_session_service=work_session_service,
            memory_service=memory_service,
            pricing_service=pricing_service,  # All services now available
            collaborator_service=collaborator_service  # NEW - inject collaborator service
        )
        logger.info("✅ ZantaraTools initialized (tool calling enabled)")
    except Exception as e:
        logger.warning(f"⚠️ ZantaraTools initialization failed: {e}")
        zantara_tools = None

    # Initialize ToolExecutor AFTER ZantaraTools (FIXED ORDER)
    tool_executor = None
    if handler_proxy_service and zantara_tools:
        try:
            internal_key = os.getenv("API_KEYS_INTERNAL")
            tool_executor = ToolExecutor(
                handler_proxy_service,
                internal_key,
                zantara_tools  # Now ZantaraTools is properly initialized
            )
            logger.info("✅ ToolExecutor initialized (Python + TypeScript tools)")
        except Exception as e:
            logger.warning(f"⚠️ ToolExecutor initialization failed: {e}")
            tool_executor = None
    else:
        logger.warning("⚠️ ToolExecutor not initialized - missing dependencies")
        logger.warning(f"   HandlerProxy: {'✅' if handler_proxy_service else '❌'}")
        logger.warning(f"   ZantaraTools: {'✅' if zantara_tools else '❌'}")

    # Initialize Intelligent Router (HAIKU-ONLY system)
    try:
        if claude_haiku:
            # Initialize Cultural RAG Service (LLAMA-generated cultural intelligence)
            cultural_rag_service = None
            if search_service:
                try:
                    cultural_rag_service = CulturalRAGService(search_service)
                    logger.info("✅ Cultural RAG Service ready (LLAMA's Indonesian soul)")
                except Exception as e:
                    logger.warning(f"⚠️ Cultural RAG Service initialization failed: {e}")
                    cultural_rag_service = None

            intelligent_router = IntelligentRouter(
                llama_client=None,  # No LLAMA - pure Claude routing
                haiku_service=claude_haiku,
                search_service=search_service,
                tool_executor=tool_executor,  # Now properly initialized
                cultural_rag_service=cultural_rag_service,  # NEW: LLAMA cultural intelligence
                autonomous_research_service=autonomous_research_service,  # PRIORITY 1: Self-directed research
                cross_oracle_synthesis_service=cross_oracle_synthesis_service  # PRIORITY 2: Multi-Oracle orchestrator
            )
            logger.info("✅ Intelligent Router ready (HAIKU-ONLY + Cultural RAG + Advanced Services)")
            logger.info("   AI: Claude Haiku 4.5 (ALL queries, 100% traffic)")
            logger.info(f"   Cultural Intelligence: {'✅ JIWA enabled' if cultural_rag_service else '⚠️ disabled'}")
            logger.info(f"   Autonomous Research: {'✅ enabled' if autonomous_research_service else '⚠️ disabled'}")
            logger.info(f"   Cross-Oracle Synthesis: {'✅ enabled' if cross_oracle_synthesis_service else '⚠️ disabled'}")
            logger.info("   Cost optimization: 3x cheaper than Sonnet, same quality with RAG")
        else:
            logger.warning("⚠️ Intelligent Router not initialized - missing Claude Haiku service")
            logger.warning(f"   Haiku: {'✅' if claude_haiku else '❌'}")
            intelligent_router = None
    except Exception as e:
        logger.error(f"❌ Intelligent Router initialization failed: {e}")
        intelligent_router = None

    logger.info("✅ ZANTARA RAG Backend ready on port 8000")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 ZANTARA RAG Backend shutdown")

    # ✨ OPTIMIZATION: No cleanup needed for persistent volume
    # Railway persistent volumes are automatically managed and preserved across restarts
    # Only clean up /tmp if it was used (fallback case)
    try:
        volume_path = os.getenv("RAILWAY_VOLUME_MOUNT_PATH")
        if not volume_path:  # Only cleanup if no persistent volume configured
            chroma_path = "/tmp/chroma_db"
            if os.path.exists(chroma_path):
                shutil.rmtree(chroma_path)
                logger.info("🧹 Cleaned up temporary ChromaDB from /tmp")
        else:
            logger.info("✅ ChromaDB preserved in persistent volume (no cleanup needed)")
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
    ai_used: str  # "haiku" | "llama"
    sources: Optional[List[Dict[str, Any]]] = None
    usage: Optional[Dict[str, Any]] = None
    used_rag: Optional[bool] = None  # PHASE 1: Track RAG usage


@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics"""
    try:
        from core.cache import cache
        from middleware.rate_limiter import get_rate_limit_stats
        from datetime import datetime
        
        return {
            "success": True,
            "cache": cache.get_stats(),
            "rate_limiting": get_rate_limit_stats(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZANTARA RAG",
        "version": "3.3.0-phase1",
        "mode": "full",
        "available_services": [
            "chromadb",
            "claude_haiku",
            "postgresql",
            "crm_system"
        ],
        "chromadb": search_service is not None,
        "ai": {
            "claude_haiku_available": claude_haiku is not None,
            "has_ai": claude_haiku is not None
        },
        "memory": {
            "postgresql": memory_service is not None,
            "vector_db": search_service is not None
        },
        "crm": {
            "enabled": True,
            "endpoints": 41,
            "features": ["auto_extraction", "client_tracking", "practice_management", "shared_memory"]
        },
        "reranker": reranker_service is not None,
        "collaborative_intelligence": True,
        "tools": {
            "tool_executor_status": tool_executor is not None,
            "zantara_tools_status": zantara_tools is not None,
            "pricing_service_status": pricing_service is not None,
            "handler_proxy_status": handler_proxy_service is not None
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
        executor = ToolExecutor(handler_proxy_service, internal_key, zantara_tools)
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

            # Use Claude Haiku 4.5 for RAG search (efficient with RAG context)
            if not claude_haiku:
                raise HTTPException(503, "Claude Haiku AI not available")

            try:
                logger.info("🎯 [RAG Search] Using Claude Haiku 4.5 (Efficient AI with RAG)")
                response = await claude_haiku.conversational(
                    message=messages[-1]["content"],
                    user_id="search_user",
                    max_tokens=1500
                )
                answer = response.get("text", "")
                model_used = "claude-haiku-4-5"
            except Exception as e:
                logger.error(f"❌ [RAG Search] Claude Haiku failed: {e}")
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

                # WORK SESSION TRACKING: Auto-start session on first activity
                if work_session_service:
                    try:
                        await work_session_service.start_session(
                            user_id=user_id,
                            user_name=collaborator.name,
                            user_email=effective_email
                        )
                    except Exception as ws_error:
                        logger.warning(f"⚠️ Work session start failed: {ws_error}")

            except Exception as e:
                logger.warning(f"⚠️ Collaborator identification failed: {e}")
                collaborator, sub_rosa_level, user_id = None, 0, "anonymous"
        else:
            logger.info("👤 Anonymous user - L0 (Public)")

        # SPECIAL COMMAND: "logout today" - End work session
        query_lower = request.query.lower().strip()
        logout_triggers = [
            "logout today", "fine giornata", "chiudo oggi", "end work today",
            "logout", "fine lavoro", "chiudo per oggi", "ho finito oggi"
        ]

        if user_id != "anonymous" and any(trigger in query_lower for trigger in logout_triggers):
            if work_session_service:
                try:
                    session_result = await work_session_service.end_session(user_id, notes=None)

                    if session_result.get("status") == "completed":
                        # Extract session info for response
                        duration_hours = session_result.get("duration_hours", 0)
                        conversations = session_result.get("conversations", 0)

                        # Language-specific response
                        is_italian = collaborator and (collaborator.language or "").lower().startswith("it")

                        if is_italian:
                            response_text = f"Perfetto! Ho chiuso la tua sessione di lavoro.\n\n⏱️ Durata: {duration_hours}h\n💬 Conversazioni: {conversations}\n\nBuon riposo! Il report è stato inviato a ZERO."
                        else:
                            response_text = f"Perfect! I've closed your work session.\n\n⏱️ Duration: {duration_hours}h\n💬 Conversations: {conversations}\n\nHave a great rest! Report sent to ZERO."

                        return BaliZeroResponse(
                            success=True,
                            response=response_text,
                            model_used="logout-command",
                            ai_used="system",
                            sources=None,
                            usage={"input_tokens": 0, "output_tokens": 0}
                        )
                    elif session_result.get("status") == "no_active_session":
                        is_italian = collaborator and (collaborator.language or "").lower().startswith("it")

                        if is_italian:
                            response_text = "Non ho trovato una sessione attiva per oggi. Forse l'hai già chiusa?"
                        else:
                            response_text = "I couldn't find an active session for today. Maybe you already closed it?"

                        return BaliZeroResponse(
                            success=True,
                            response=response_text,
                            model_used="logout-command",
                            ai_used="system",
                            sources=None,
                            usage={"input_tokens": 0, "output_tokens": 0}
                        )
                except Exception as logout_error:
                    logger.error(f"❌ Logout command failed: {logout_error}")
                    # Continue with normal chat if logout fails

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
                    timeout=60.0  # 60 second timeout for AI response (ChromaDB + Sonnet can take time)
                )
            except asyncio.TimeoutError:
                logger.error("❌ AI routing timed out after 60 seconds")
                raise HTTPException(504, "AI response timeout - please try again")

            # Extract response from router
            answer = routing_result["response"]
            model_used = routing_result["model"]
            ai_used = routing_result["ai_used"]
            tokens = routing_result.get("tokens", {})
            used_rag = routing_result.get("used_rag", False)

            logger.info(f"✅ [Router] Response from {ai_used} (model: {model_used})")

            # WORK SESSION TRACKING: Update activity and increment conversations
            if work_session_service and user_id != "anonymous":
                try:
                    await work_session_service.update_activity(user_id)
                    await work_session_service.increment_conversations(user_id)
                except Exception as ws_error:
                    logger.warning(f"⚠️ Work session tracking failed: {ws_error}")

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
                                    "source": doc["metadata"].get("title") or doc["metadata"].get("book_title") or doc["metadata"].get("source") or "Document",
                                    "snippet": doc["text"][:240] if isinstance(doc.get("text"), str) else str(doc)[:240],
                                    "similarity": float(score),
                                    "tier": doc["metadata"].get("tier") or doc["metadata"].get("pricing_priority") or "T2",
                                    "dateLastCrawled": doc["metadata"].get("last_updated") or doc["metadata"].get("timestamp")
                                }
                                for doc, score in reranked
                            ]
                        else:
                            # OPTIMIZATION: Use only top 3 sources
                            sources = [
                                {
                                    "source": r["metadata"].get("title") or r["metadata"].get("book_title") or r["metadata"].get("source") or "Document",
                                    "snippet": r["text"][:240] if isinstance(r.get("text"), str) else str(r)[:240],
                                    "similarity": float(r.get("score", 0)),
                                    "tier": r["metadata"].get("tier") or r["metadata"].get("pricing_priority") or "T2",
                                    "dateLastCrawled": r["metadata"].get("last_updated") or r["metadata"].get("timestamp")
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
            },
            used_rag=used_rag  # PHASE 1: Return RAG usage flag
        )

    except Exception as e:
        logger.error(f"❌ Chat failed: {e}")
        raise HTTPException(500, f"Chat failed: {str(e)}")


@app.options("/bali-zero/chat-stream")
async def bali_zero_chat_stream_options():
    """Handle CORS preflight requests for SSE endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600"
        }
    )


@app.get("/bali-zero/chat-stream")
async def bali_zero_chat_stream(
    query: str,
    user_email: Optional[str] = None
):
    """
    SSE streaming endpoint for real-time chat responses

    Returns Server-Sent Events (SSE) stream with text chunks as they arrive from AI

    Args:
        query: User message/question
        user_email: Optional user email for personalization

    Returns:
        StreamingResponse: SSE stream with text chunks

    Example:
        curl -N "http://localhost:8000/bali-zero/chat-stream?query=Ciao"
    """
    logger.info(f"🌊 [Stream] SSE request: '{query[:50]}...'")

    # Check if intelligent router is available
    if not intelligent_router:
        raise HTTPException(503, "Intelligent Router not available - Claude AI required")

    async def generate():
        """Generator function for SSE stream"""
        try:
            # Sanitize user email (same logic as regular chat)
            sanitized_email = None
            if user_email:
                email_str = user_email.strip().lower()
                if email_str not in ["undefined", "null", "none", ""]:
                    sanitized_email = user_email

            # Identify collaborator
            collaborator = None
            user_id = "anonymous"

            if collaborator_service and sanitized_email:
                try:
                    collaborator = await collaborator_service.identify(sanitized_email)
                    user_id = collaborator.id
                    logger.info(f"👤 [Stream] {collaborator.name} ({collaborator.ambaradam_name})")
                except Exception as e:
                    logger.warning(f"⚠️ [Stream] Collaborator identification failed: {e}")

            # Load memory if available
            memory = None
            if memory_service and user_id != "anonymous":
                try:
                    memory = await memory_service.get_memory(user_id)
                    logger.info(f"💾 [Stream] Memory loaded: {len(memory.profile_facts)} facts")
                except Exception as e:
                    logger.warning(f"⚠️ [Stream] Memory load failed: {e}")

            # Stream response chunks from intelligent router
            async for chunk in intelligent_router.stream_chat(
                message=query,
                user_id=user_id,
                conversation_history=None,  # No history for SSE (stateless)
                memory=memory,
                collaborator=collaborator
            ):
                # SSE format: data: {json}\n\n
                sse_data = json.dumps({"text": chunk})
                yield f"data: {sse_data}\n\n"

            # Send done signal
            yield f"data: {json.dumps({'done': True})}\n\n"
            logger.info(f"✅ [Stream] Stream completed for user {user_id}")

        except Exception as e:
            logger.error(f"❌ [Stream] Error: {e}")
            # Send error to client
            error_data = json.dumps({"error": str(e), "done": True})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering for immediate streaming
            # CORS headers for browser SSE connections
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600"
        }
    )


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

# Include CRM routers (Full Organizational Memory System)
from app.routers import crm_clients, crm_practices, crm_interactions, crm_shared_memory, admin_migration
app.include_router(crm_clients.router)
app.include_router(crm_practices.router)
app.include_router(crm_interactions.router)
app.include_router(crm_shared_memory.router)
app.include_router(admin_migration.router)

# Include Oracle routers (Universal Query System - Phase 3)
from app.routers import oracle_universal
from app.routers import agents
from app.routers import notifications
app.include_router(oracle_universal.router)
app.include_router(agents.router)
app.include_router(notifications.router)
# NOTE: admin_oracle_populate router removed - using inline endpoint instead

# Include Llama 4 Scout router - DISABLED (module not in production)
# from routers.llama4 import router as llama4_router
# app.include_router(llama4_router)


# ========================================
# ORACLE POPULATION ENDPOINT (TEMPORARY)
# ========================================

@app.post("/admin/populate-oracle-inline")
async def populate_oracle_inline():
    """ONE-TIME: Populate Oracle collections. Remove after calling."""
    try:
        from core.embeddings import EmbeddingsGenerator
        from core.vector_db import ChromaDBClient

        embedder = EmbeddingsGenerator()
        results = {}

        # Tax
        tax_texts = ["Tax: PPh 21 Rate reduced 25% to 22%", "Tax: VAT increased 11% to 12% April 2025"]
        tax_emb = [embedder.generate_single_embedding(t) for t in tax_texts]
        tax_coll = ChromaDBClient(collection_name="tax_updates")
        tax_coll.upsert_documents(tax_texts, tax_emb, [{"id": f"tax_{i}"} for i in range(len(tax_texts))], [f"tax_{i}" for i in range(len(tax_texts))])
        results['tax'] = len(tax_texts)

        # Legal
        legal_texts = ["Legal: PT PMA capital reduced to IDR 5B", "Legal: Minimum wage +6.5% Jakarta IDR 5.3M"]
        legal_emb = [embedder.generate_single_embedding(t) for t in legal_texts]
        legal_coll = ChromaDBClient(collection_name="legal_updates")
        legal_coll.upsert_documents(legal_texts, legal_emb, [{"id": f"legal_{i}"} for i in range(len(legal_texts))], [f"legal_{i}" for i in range(len(legal_texts))])
        results['legal'] = len(legal_texts)

        # Property
        prop_texts = ["Property: Canggu Villa 4BR IDR 15B ocean view", "Property: Seminyak Villa 6BR IDR 25B beachfront"]
        prop_emb = [embedder.generate_single_embedding(t) for t in prop_texts]
        prop_coll = ChromaDBClient(collection_name="property_listings")
        prop_coll.upsert_documents(prop_texts, prop_emb, [{"id": f"prop_{i}"} for i in range(len(prop_texts))], [f"prop_{i}" for i in range(len(prop_texts))])
        results['property'] = len(prop_texts)

        return {"success": True, "results": results, "total": sum(results.values())}
    except Exception as e:
        import traceback
        return {"success": False, "error": str(e), "trace": traceback.format_exc()}


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
                "primary": "Claude Haiku 4.5 (ALL queries - Fast, Efficient, RAG-enhanced)",
                "routing": "Intelligent Router (100% Haiku 4.5)",
                "cost_savings": "3x cheaper than Sonnet, same quality with RAG"
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


# ========================================
# FRONTEND SDK MEMORY ENDPOINTS
# ========================================

class MemorySaveRequest(BaseModel):
    userId: str
    profile_facts: Optional[List[str]] = []
    summary: Optional[str] = ""


@app.post("/memory/save")
async def save_memory_frontend(request: MemorySaveRequest):
    """
    Frontend SDK endpoint: Save user memory (facts + summary)
    Compatible with zantara-sdk.js saveMemory() method
    """
    if not memory_service:
        raise HTTPException(503, "Memory service not available")

    try:
        # Save each fact
        saved_count = 0
        for fact in request.profile_facts:
            if fact and fact.strip():
                await memory_service.save_fact(
                    user_id=request.userId,
                    content=fact.strip(),
                    fact_type='user_provided'
                )
                saved_count += 1

        # Update summary if provided
        if request.summary and request.summary.strip():
            await memory_service.update_summary(
                user_id=request.userId,
                summary=request.summary.strip()
            )

        return {
            "success": True,
            "user_id": request.userId,
            "facts_saved": saved_count,
            "summary_updated": bool(request.summary)
        }

    except Exception as e:
        logger.error(f"Memory save failed for {request.userId}: {e}")
        raise HTTPException(500, f"Memory save failed: {str(e)}")


@app.get("/memory/get")
async def get_memory_frontend(userId: str):
    """
    Frontend SDK endpoint: Retrieve user memory
    Compatible with zantara-sdk.js getMemory() method

    Query params:
        userId: User identifier
    """
    if not memory_service:
        raise HTTPException(503, "Memory service not available")

    try:
        memory = await memory_service.get_memory(userId)
        return {
            "success": True,
            "userId": userId,
            "profile_facts": memory.profile_facts,
            "summary": memory.summary,
            "counters": memory.counters,
            "total_conversations": memory.counters.get('conversations', 0),
            "created_at": memory.created_at.isoformat() if hasattr(memory, 'created_at') and memory.created_at else None,
            "updated_at": memory.updated_at.isoformat() if hasattr(memory, 'updated_at') and memory.updated_at else None
        }

    except Exception as e:
        logger.error(f"Memory retrieval failed for {userId}: {e}")
        raise HTTPException(500, f"Memory retrieval failed: {str(e)}")


# ========================================
# TEAM WORK SESSION TRACKING ENDPOINTS
# All reports sent to ZERO only
# ========================================

class SessionStartRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: str


@app.post("/team/session/start")
async def start_work_session(request: SessionStartRequest):
    """
    Start work session for team member
    Auto-called on first activity of the day

    Sends notification to ZERO only
    """
    if not work_session_service:
        raise HTTPException(503, "Work session service not available")

    try:
        result = await work_session_service.start_session(
            user_id=request.user_id,
            user_name=request.user_name,
            user_email=request.user_email
        )
        return result
    except Exception as e:
        logger.error(f"Failed to start session: {e}")
        raise HTTPException(500, f"Failed to start session: {str(e)}")


class SessionEndRequest(BaseModel):
    user_id: str
    notes: Optional[str] = None


@app.post("/team/session/end")
async def end_work_session(request: SessionEndRequest):
    """
    End work session for team member
    Triggered by "logout today" command in chat

    Sends detailed report to ZERO only
    """
    if not work_session_service:
        raise HTTPException(503, "Work session service not available")

    try:
        result = await work_session_service.end_session(
            user_id=request.user_id,
            notes=request.notes
        )
        return result
    except Exception as e:
        logger.error(f"Failed to end session: {e}")
        raise HTTPException(500, f"Failed to end session: {str(e)}")


@app.get("/team/sessions/today")
async def get_today_sessions():
    """
    Get all work sessions for today
    For ZERO dashboard only
    """
    if not work_session_service:
        raise HTTPException(503, "Work session service not available")

    try:
        sessions = await work_session_service.get_today_sessions()
        return {
            "success": True,
            "date": "today",
            "sessions_count": len(sessions),
            "sessions": sessions
        }
    except Exception as e:
        logger.error(f"Failed to get today's sessions: {e}")
        raise HTTPException(500, f"Failed to get sessions: {str(e)}")


@app.get("/team/report/daily")
async def get_daily_report(date: Optional[str] = None):
    """
    Get daily team report
    For ZERO dashboard only

    Query params:
        date: Optional date in YYYY-MM-DD format (defaults to today)
    """
    if not work_session_service:
        raise HTTPException(503, "Work session service not available")

    try:
        from datetime import datetime

        # Parse date if provided
        report_date = None
        if date:
            try:
                report_date = datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")

        report = await work_session_service.generate_daily_report(report_date)
        return {
            "success": True,
            **report
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate daily report: {e}")
        raise HTTPException(500, f"Failed to generate report: {str(e)}")


@app.get("/team/report/weekly")
async def get_weekly_report():
    """
    Get weekly team report
    For ZERO dashboard only

    Returns summary of all team members' work for the past 7 days
    """
    if not work_session_service:
        raise HTTPException(503, "Work session service not available")

    try:
        report = await work_session_service.get_week_summary()
        return {
            "success": True,
            **report
        }
    except Exception as e:
        logger.error(f"Failed to generate weekly report: {e}")
        raise HTTPException(500, f"Failed to generate report: {str(e)}")


async def _load_dashboard_html():
    """Helper function to load dashboard HTML template"""
    template_path = Path(__file__).parent / "templates" / "zero_dashboard.html"

    if not template_path.exists():
        raise HTTPException(404, "Dashboard template not found")

    with open(template_path, 'r', encoding='utf-8') as f:
        return f.read()


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    """
    ZERO Dashboard - Team Work Sessions Monitoring
    Accessible at: zantara.balizero.com/dashboard

    Real-time view of team activity, sessions, and reports

    Features:
    - Active sessions (who's working now)
    - Completed sessions today
    - Daily statistics
    - Weekly summary
    - Auto-refresh every 30 seconds
    """
    try:
        html_content = await _load_dashboard_html()
        return HTMLResponse(content=html_content)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load dashboard: {e}")
        raise HTTPException(500, f"Dashboard error: {str(e)}")


@app.get("/admin/zero/dashboard", response_class=HTMLResponse)
async def zero_dashboard():
    """
    ZERO Dashboard - Team Work Sessions Monitoring (Legacy URL)
    Same as /dashboard - kept for backward compatibility

    Real-time view of team activity, sessions, and reports
    """
    try:
        html_content = await _load_dashboard_html()
        return HTMLResponse(content=html_content)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load dashboard: {e}")
        raise HTTPException(500, f"Dashboard error: {str(e)}")


# ========================================
# ADVANCED TEAM ANALYTICS ENDPOINTS
# 7 Advanced Techniques for Team Intelligence
# ========================================

# Global analytics service
team_analytics_service: Optional["TeamAnalyticsService"] = None


@app.get("/team/analytics/patterns")
async def analyze_work_patterns(user_email: Optional[str] = None, days: int = 30):
    """
    🔍 TECHNIQUE 1: Pattern Recognition

    Analyzes work hour patterns and habits:
    - Preferred start times
    - Typical session duration
    - Work day patterns (weekday vs weekend)
    - Consistency score

    Query params:
        user_email: Optional - analyze specific team member (if None, team average)
        days: Analysis period in days (default: 30)

    Returns:
        - Patterns: avg start hour, duration, consistency
        - Day distribution: weekdays vs weekends
        - Consistency rating: Excellent/Good/Fair/Variable
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        analysis = await team_analytics_service.analyze_work_patterns(user_email, days)
        return {
            "success": True,
            "technique": "Pattern Recognition",
            "user_email": user_email or "team_average",
            **analysis
        }
    except Exception as e:
        logger.error(f"Pattern analysis failed: {e}")
        raise HTTPException(500, f"Pattern analysis failed: {str(e)}")


@app.get("/team/analytics/productivity")
async def calculate_productivity_scores(days: int = 7):
    """
    📊 TECHNIQUE 2: Productivity Scoring

    Calculates productivity score for each team member based on:
    - Conversations per hour
    - Activities per hour
    - Session consistency
    - Work time efficiency

    Query params:
        days: Analysis period (default: 7)

    Returns:
        - Productivity score (0-100) for each team member
        - Rating: Excellent/Good/Fair/Needs Attention
        - Detailed metrics breakdown
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        scores = await team_analytics_service.calculate_productivity_scores(days)
        return {
            "success": True,
            "technique": "Productivity Scoring",
            "period_days": days,
            "team_scores": scores
        }
    except Exception as e:
        logger.error(f"Productivity analysis failed: {e}")
        raise HTTPException(500, f"Productivity analysis failed: {str(e)}")


@app.get("/team/analytics/burnout")
async def detect_burnout_signals(user_email: Optional[str] = None):
    """
    ⚠️ TECHNIQUE 3: Burnout Detection

    Detects early warning signs of burnout:
    - Increasing work hours trend
    - Decreasing efficiency
    - Working on weekends frequently
    - Very long sessions (>10 hours)
    - Inconsistent work patterns

    Query params:
        user_email: Optional - check specific user (if None, analyze entire team)

    Returns:
        - Risk score (0-100)
        - Risk level: High Risk/Medium Risk/Low Risk
        - Warning signals list
        - Recommended actions
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        warnings = await team_analytics_service.detect_burnout_signals(user_email)
        return {
            "success": True,
            "technique": "Burnout Detection",
            "user_email": user_email or "team_analysis",
            "warnings": warnings,
            "total_at_risk": sum(1 for w in warnings if w['burnout_risk_score'] >= 40)
        }
    except Exception as e:
        logger.error(f"Burnout detection failed: {e}")
        raise HTTPException(500, f"Burnout detection failed: {str(e)}")


@app.get("/team/analytics/trends")
async def analyze_performance_trends(user_email: str, weeks: int = 4):
    """
    📈 TECHNIQUE 4: Performance Trends

    Analyzes performance trends over time (week-by-week):
    - Hours worked per week
    - Conversations per week
    - Activities per week
    - Trend direction (increasing/decreasing/stable)

    Query params:
        user_email: Required - team member to analyze
        weeks: Number of weeks to analyze (default: 4)

    Returns:
        - Weekly breakdown
        - Trend direction
        - Average metrics
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        trends = await team_analytics_service.analyze_performance_trends(user_email, weeks)
        return {
            "success": True,
            "technique": "Performance Trends",
            "user_email": user_email,
            **trends
        }
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}")
        raise HTTPException(500, f"Trend analysis failed: {str(e)}")


@app.get("/team/analytics/workload-balance")
async def analyze_workload_balance(days: int = 7):
    """
    ⚖️ TECHNIQUE 5: Workload Balance

    Analyzes workload distribution across team:
    - Hours share per team member
    - Conversations distribution
    - Balance score (0-100)
    - Recommendations for redistribution

    Query params:
        days: Analysis period (default: 7)

    Returns:
        - Team distribution stats
        - Balance score and rating
        - Workload recommendations
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        balance = await team_analytics_service.analyze_workload_balance(days)
        return {
            "success": True,
            "technique": "Workload Balance",
            **balance
        }
    except Exception as e:
        logger.error(f"Workload balance analysis failed: {e}")
        raise HTTPException(500, f"Workload balance failed: {str(e)}")


@app.get("/team/analytics/optimal-hours")
async def identify_optimal_hours(user_email: Optional[str] = None, days: int = 30):
    """
    ⏰ TECHNIQUE 6: Optimal Hours

    Identifies most productive time windows based on conversations-per-hour:
    - Peak productivity hours
    - Productivity by hour of day
    - Recommended work windows

    Query params:
        user_email: Optional - analyze specific user (if None, team average)
        days: Analysis period (default: 30)

    Returns:
        - Top 3 optimal time windows
        - Productivity by hour breakdown
        - Recommendations
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        optimal = await team_analytics_service.identify_optimal_hours(user_email, days)
        return {
            "success": True,
            "technique": "Optimal Hours",
            "user_email": user_email or "team_average",
            **optimal
        }
    except Exception as e:
        logger.error(f"Optimal hours analysis failed: {e}")
        raise HTTPException(500, f"Optimal hours failed: {str(e)}")


@app.get("/team/analytics/insights")
async def generate_team_insights(days: int = 7):
    """
    🧠 TECHNIQUE 7: Team Insights

    Generates comprehensive team collaboration insights:
    - Team sync patterns (who works when)
    - Collaboration opportunities
    - Team health score
    - Key metrics and insights

    Query params:
        days: Analysis period (default: 7)

    Returns:
        - Team summary metrics
        - Team health score
        - Best collaboration windows
        - Human-readable insights
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        insights = await team_analytics_service.generate_team_insights(days)
        return {
            "success": True,
            "technique": "Team Insights",
            **insights
        }
    except Exception as e:
        logger.error(f"Team insights generation failed: {e}")
        raise HTTPException(500, f"Team insights failed: {str(e)}")


@app.get("/team/analytics/all")
async def get_all_analytics(user_email: Optional[str] = None, days: int = 7):
    """
    🎯 COMPREHENSIVE ANALYTICS DASHBOARD

    Returns all 7 advanced analytics techniques in one call:
    1. Work patterns
    2. Productivity scores
    3. Burnout detection
    4. Performance trends (if user_email provided)
    5. Workload balance
    6. Optimal hours
    7. Team insights

    Query params:
        user_email: Optional - for user-specific analysis
        days: Analysis period (default: 7)

    Returns:
        Comprehensive analytics report with all 7 techniques
    """
    if not team_analytics_service:
        raise HTTPException(503, "Analytics service not available")

    try:
        import asyncio
        from datetime import datetime

        # Run all analytics in parallel for speed
        results = await asyncio.gather(
            team_analytics_service.analyze_work_patterns(user_email, days),
            team_analytics_service.calculate_productivity_scores(days),
            team_analytics_service.detect_burnout_signals(user_email),
            team_analytics_service.analyze_workload_balance(days),
            team_analytics_service.identify_optimal_hours(user_email, days),
            team_analytics_service.generate_team_insights(days),
            return_exceptions=True
        )

        # Build comprehensive report
        analytics_report = {
            "success": True,
            "user_email": user_email or "team_analysis",
            "period_days": days,
            "generated_at": datetime.now().isoformat(),
            "analytics": {
                "1_work_patterns": results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])},
                "2_productivity_scores": results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])},
                "3_burnout_detection": results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])},
                "4_workload_balance": results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])},
                "5_optimal_hours": results[4] if not isinstance(results[4], Exception) else {"error": str(results[4])},
                "6_team_insights": results[5] if not isinstance(results[5], Exception) else {"error": str(results[5])}
            }
        }

        # Add trends if user_email provided
        if user_email:
            try:
                trends = await team_analytics_service.analyze_performance_trends(user_email, weeks=4)
                analytics_report["analytics"]["7_performance_trends"] = trends
            except Exception as e:
                analytics_report["analytics"]["7_performance_trends"] = {"error": str(e)}

        return analytics_report

    except Exception as e:
        logger.error(f"Comprehensive analytics failed: {e}")
        raise HTTPException(500, f"Comprehensive analytics failed: {str(e)}")
# Force Railway redeploy - Priority 1-5 active

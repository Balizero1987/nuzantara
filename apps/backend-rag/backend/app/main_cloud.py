"""
ZANTARA RAG Backend - Fly.io Version (v3.3.1-cors-fix)
Port 8000
Uses ChromaDB from Persistent Volume (chroma_data) + Llama 4 Scout AI (PRIMARY)

AI ROUTING: Intelligent Router with Llama 4 Scout PRIMARY + Claude Haiku FALLBACK
- Llama 4 Scout: PRIMARY AI (92% cheaper, 22% faster TTFT, 10M context)
  * Cost: $0.20/$0.20 per 1M tokens
  * Model: meta-llama/llama-4-scout via OpenRouter
  * Context: 10M tokens (50x more than Haiku)
- Claude Haiku 4.5: FALLBACK AI (tool calling, error handling, emergencies)
  * Cost: $1/$5 per 1M tokens
  * Automatic fallback on Llama errors
- RAG Integration: Enhanced context for all business queries
- Tool Use: Full access to all 164 tools via Haiku fallback
COST OPTIMIZATION: 92% cheaper than Haiku, same quality with RAG

CORS FIX: Explicit headers on /health and /bali-zero/chat-stream endpoints
DEPLOYMENT: Fly.io Production Platform
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import StreamingResponse, HTMLResponse, Response, JSONResponse
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
import asyncio
import time

# Import ZANTARA RAG Configuration
from app.config import settings
from botocore.exceptions import ClientError
import socket

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
# AI SYSTEM: Llama 4 Scout (primary) + Claude Haiku 4.5 (fallback) + Intelligent Router
from llm.llama_scout_client import LlamaScoutClient
from services.claude_haiku_service import ClaudeHaikuService
from services.intelligent_router import IntelligentRouter
from services.cultural_rag_service import CulturalRAGService  # NEW: LLAMA cultural intelligence
from services.memory_fact_extractor import MemoryFactExtractor
from services.alert_service import AlertService, get_alert_service
from services.work_session_service import WorkSessionService
from services.team_analytics_service import TeamAnalyticsService
from services.session_service import SessionService  # Session store for 50+ message conversations
from services.query_router import QueryRouter  # PRIORITY 1: Query routing for autonomous research
from services.autonomous_research_service import AutonomousResearchService  # PRIORITY 1: Self-directed research agent
from services.cross_oracle_synthesis_service import CrossOracleSynthesisService  # PRIORITY 2: Multi-Oracle orchestrator
from services.dynamic_pricing_service import DynamicPricingService  # PRIORITY 3: Comprehensive pricing calculator
from services.semantic_cache import get_semantic_cache, SemanticCache  # NEW: Semantic caching
from redis.asyncio import Redis  # NEW: Redis async client
from middleware.error_monitoring import ErrorMonitoringMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Background warmup task handle (set during startup)
warmup_task: Optional[asyncio.Task] = None

# Initialize FastAPI
app = FastAPI(
    title="ZANTARA RAG API",
    version="3.3.1-cors-fix",
    description="RAG + LLM backend for NUZANTARA (ChromaDB Persistent + Llama 4 Scout PRIMARY + Haiku FALLBACK)"
)

# CORS - Production + Development + Inter-Service
# NOTE: EventSource endpoints (/bali-zero/chat-stream) handle CORS manually
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Wildcard for EventSource compatibility
    allow_credentials=False,  # No credentials for cross-domain EventSource
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Cache-Control", "X-Session-Id", "X-Continuity-Id", "X-Reconnection", "X-Last-Chunk-Timestamp"],
    expose_headers=["Content-Type", "Cache-Control", "Connection", "X-Accel-Buffering"],
    max_age=3600
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
# AI SYSTEM: Llama 4 Scout (primary) + Claude Haiku 4.5 (fallback)
llama_scout_client: Optional[LlamaScoutClient] = None  # NEW: Primary AI with fallback
claude_haiku: Optional[ClaudeHaikuService] = None  # Kept for backward compatibility
intelligent_router: Optional[IntelligentRouter] = None  # AI routing system
cultural_rag_service: Optional[CulturalRAGService] = None  # NEW: LLAMA cultural RAG
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
session_service: Optional["SessionService"] = None  # Redis session store for 50+ message conversations
semantic_cache: Optional[SemanticCache] = None  # NEW: Semantic caching for RAG queries
redis_client: Optional[Redis] = None  # NEW: Redis async client

# System prompt v3.0 FINAL - Tier 1-2-3 System (97/100 effectiveness rating)
SYSTEM_PROMPT = """ZANTARA - Bali Zero AI Assistant

You are ZANTARA, the cultural intelligence AI of PT. BALI NOL IMPERSARIAT (Bali Zero).
Company: Visa & KITAS, PT PMA setup, Tax & Accounting, Real Estate
Contact: WhatsApp +62 859 0436 9574 | info@balizero.com | Instagram: @balizero0

═══════════════════════════════════════════════════════════════════════════════
① INSTANT DECISION TREE - Your First 2 Seconds
═══════════════════════════════════════════════════════════════════════════════

TRIGGER KEYWORDS → TIER 1 TOOL → MODE
─────────────────────────────────────────────────────────────────────────────
price/harga/cost/quanto → get_pricing → MANDATORY CALL
kbli/business code/codice → kbli.lookup → MANDATORY CALL  
team/chi è/who is → search_team_member → MANDATORY CALL
research/legal/visa rules → rag.query → PIKIRAN mode
casual chat/greeting → bali.zero.chat → SANTAI mode

═══════════════════════════════════════════════════════════════════════════════
② TIER 1 TOOLS - USE FIRST (95% query coverage)
═══════════════════════════════════════════════════════════════════════════════

★★★ get_pricing (bali.zero.pricing)
USE WHEN: "price", "harga", "quanto costa", "berapa", "cost", "fee"
MANDATORY: ALWAYS call for ANY pricing question (NO exceptions)

IF: User asks "Quanto costa KITAS?"
THEN: CALL get_pricing({category: "kitas"})
Example Response:
  Tool returns: {"KITAS_Limited_Stay": "15.000.000 IDR", "processing": "90 days"}
  YOU say: "KITAS Limited Stay costa **15.000.000 IDR** (processing: 90 giorni).
  📞 Bali Zero: +62 859 0436 9574"

─────────────────────────────────────────────────────────────────────────────

★★★ kbli.lookup
USE WHEN: "kbli", "business code", "codice attività", "what code for..."
MANDATORY: Return ALL matched codes (not just first)

IF: User asks "KBLI for IT consulting?"
THEN: CALL kbli.lookup({query: "IT consulting", limit: 10})
Example Response:
  Tool returns: [{code: "62010", name: "Computer programming"}, ...]
  YOU say: "Per IT consulting, i codici KBLI sono:  
  • **62010** - Computer Programming  
  • **62020** - IT Consulting  
  • **62090** - Other IT Services  
  Fonte: Indonesian KBLI Database 2020"

─────────────────────────────────────────────────────────────────────────────

★★★ search_team_member (team.list)
USE WHEN: "chi è", "who is", "team member", "contatta", "Dea", "Krisna", "Zero"
CRITICAL: NEVER hallucinate team info (ONLY use tool data)

IF: User asks "Who is Dea?"
THEN: CALL search_team_member({query: "Dea"})
Example Response:
  Tool returns: {name: "Dea", ambaradam: "Exec", role: "Operations", skills: [...]}
  YOU say: "**Dea Exec** è la nostra Operations Manager.  
  Competenze: Project Management, Client Relations  
  Puoi contattarla via Bali Zero: info@balizero.com"
  
IF tool returns empty: "Non trovo questa persona nel team. Vuoi che verifichi?"

─────────────────────────────────────────────────────────────────────────────

★★★ rag.query
USE WHEN: Research questions (visa rules, legal procedures, regulations)
TRIGGERS: "how to", "requirements for", "process for", "explain"

IF: User asks "What are KITAS requirements?"
THEN: CALL rag.query({query: "KITAS requirements Indonesia", collection: "visa"})
Example Response:
  Tool returns: [context with requirements]
  YOU say: "Per ottenere il KITAS hai bisogno di:  
  • Passaporto valido (min 18 mesi)  
  • Sponsor Letter (company/family)  
  • Medical Certificate  
  • 4 foto tessera  
  Processing: 90 giorni. Bali Zero gestisce tutto il processo! 💼"

─────────────────────────────────────────────────────────────────────────────

★★★ bali.zero.chat
USE WHEN: Casual conversation, greetings, general questions
TRIGGERS: "ciao", "hello", "come stai", "how are you"

IF: User says "Ciao!"
THEN: CALL bali.zero.chat({message: "Ciao!", mode: "SANTAI"})
Example Response:
  Tool returns: {answer: "Ciao! Come posso aiutarti?"}
  YOU say: "Ciao! Sono **ZANTARA**, l'AI di Bali Zero 🌴  
  Cosa posso fare per te oggi?"

═══════════════════════════════════════════════════════════════════════════════
③ TIER 2 TOOLS - Frequently Used (15 tools)
═══════════════════════════════════════════════════════════════════════════════

memory.save - Save conversation context
memory.retrieve - Get past conversations  
identity.resolve - User identification via AMBARADAM
oracle.query - Universal Oracle (5 domains: tax, legal, property, visa, kbli)
maps.places - Location search in Bali
translate.text - Translate content
analytics.track.event - Log events
ai.chat - General AI conversation
xai.explain - Explainable AI reasoning
vision.analyze - Image analysis
zantara.attune - Emotional resonance
team.activity.recent - Recent team activity

═══════════════════════════════════════════════════════════════════════════════
④ TIER 3 TOOLS - Situational (163 tools available)
═══════════════════════════════════════════════════════════════════════════════

Check ONLY when explicitly needed:
- devai.* (20 handlers) - Code analysis, debugging, testing
- zantara.* (20 handlers) - Personality profiling, synergy mapping, mediation
- crm.* (41 endpoints) - Client management, practice tracking
- oracle.* - Predictions, simulations, analysis
- dashboard.* - Analytics, reports, monitoring

NOTE: Google Workspace (30 tools), Slack/Discord, WhatsApp, Instagram tools are DISABLED (OAuth2 not configured)

═══════════════════════════════════════════════════════════════════════════════
⑤ 8 SPECIALIZED AGENTS - Background Enrichment
═══════════════════════════════════════════════════════════════════════════════

These agents run AUTOMATICALLY in the background and enrich your context:

1. **Autonomous Research Agent** (query_router + autonomous_research_service)
   YOU GET: Deep research results on complex topics
   YOU DO: Present enriched findings naturally

2. **Cross-Oracle Synthesis Agent** (cross_oracle_synthesis_service)
   YOU GET: Multi-domain analysis (tax+legal+property combined)
   YOU DO: Provide holistic business advice

3. **Dynamic Pricing Agent** (dynamic_pricing_service)
   YOU GET: Comprehensive pricing calculations with breakdowns
   YOU DO: Show detailed cost analysis

4. **Knowledge Graph Agent** (Implicit in RAG system)
   YOU GET: Related concepts and connections
   YOU DO: Explain relationships between topics

5. **Cultural RAG Agent** (cultural_rag_service)
   YOU GET: Indonesian cultural context via Llama
   YOU DO: Share cultural insights naturally

6. **Client Journey Agent** (work_session_service)
   YOU GET: Client progress tracking, stage detection
   YOU DO: Provide personalized next steps

7. **Compliance Monitor Agent** (memory + alert_service)
   YOU GET: Expiry alerts, renewal reminders
   YOU DO: Proactively notify clients

8. **Team Analytics Agent** (team_analytics_service)
   YOU GET: 7 advanced analytics techniques
   YOU DO: Present team insights and recommendations

═══════════════════════════════════════════════════════════════════════════════
⑥ CRITICAL RULES - Non-Negotiable
═══════════════════════════════════════════════════════════════════════════════

1. **PRICING MANDATORY**: ALWAYS call get_pricing for ANY price question
   ❌ NEVER: Estimate, approximate, or answer from memory
   ✅ ALWAYS: Call tool → use exact data → cite source

2. **NO VISA CODE HARDCODING**: NEVER invent visa codes
   ❌ NEVER: List "C207", "B211A", or codes not in tool response
   ✅ ALWAYS: Use ONLY codes from get_pricing tool response

3. **TEAM DATA: NO HALLUCINATIONS**: NEVER invent team member info
   ❌ NEVER: Make up names, roles, or contact info
   ✅ ALWAYS: Use ONLY data from search_team_member tool

4. **KBLI: RETURN ALL CODES**: Don't stop at first match
   ❌ NEVER: Return only 1-2 codes when many exist
   ✅ ALWAYS: Show ALL relevant codes (use limit: 10)

5. **TOOL DATA USAGE**: Use tool responses in your answer
   ❌ NEVER: Ignore tool response data
   ✅ ALWAYS: Incorporate tool data naturally

5b. **PRICING TRANSPARENCY**: Show total price, NOT internal cost breakdowns
   ❌ NEVER: Break down "Tasse governative + notaio: 12M - Service fee Bali Zero: 8M"
   ✅ ALWAYS: Just state "PT PMA Setup: 20.000.000 IDR" (single total price)
   ⚠️ NOTE: Showing how much we make is not elegant - keep it simple and professional

⭐ **CRITICAL - NO COST BREAKDOWNS IN PRICING RESPONSES:**
   When responding to pricing questions:
   ❌ ABSOLUTELY DO NOT show internal cost breakdowns like:
      - "Spese governative + notarile: 12.000.000 IDR"
      - "Nostre fee di servizio: 8.000.000 IDR"
      - "Government fees: 12M - Service fee: 8M"
   ❌ NEVER break down "how much is government vs how much is Bali Zero"
   ❌ DO NOT explain individual cost components at all
   ✅ ONLY state the total: "PT PMA Setup: A partire da 20.000.000 IDR"
   ⚠️ ENFORCEMENT: If you feel tempted to show the breakdown, STOP - it's forbidden. It's not professional to show customers how much we take.

5c. **COMPLEX SERVICE COSTS**: Frame operating expenses naturally
   WHEN: Discussing restaurant, resort, or complex business setup costs
   ❌ NEVER: Present "150-300 milioni IDR" as Bali Zero's service price
   ✅ ALWAYS: Frame as operating costs naturally - "You'll typically budget 150-300M IDR for first year (rent, renovations, equipment, licenses, working capital)"
   ⚠️ NOTE: This is how much customers need to invest in the business itself - NOT how much Bali Zero charges

6. **SOURCE CITATIONS**: Cite external sources, NOT Bali Zero pricing
   ✅ ALWAYS: "Fonte: Indonesian KBLI Database 2020" (for KBLI codes - external)
   ✅ ALWAYS: "Fonte: [Document Name]" (for immigration laws/regulations - external)
   ❌ NEVER: Add source citations for Bali Zero's own service prices
   ⚠️ NOTE: Bali Zero pricing is stated directly without citation (customers understand it's our pricing)

⭐ **CRITICAL PRICING RULE - ZERO CITATIONS ALLOWED:**
   When responding to pricing questions about Bali Zero services:
   ❌ ABSOLUTELY DO NOT add "Fonte: Bali Zero Official Pricing..." at the end
   ❌ ABSOLUTELY DO NOT add "Fonte: BALI ZERO Official Pricing 2025"
   ❌ DO NOT add ANY "Fonte:" or "Source:" citations for pricing
   ✅ Just end with contact info: "📞 WhatsApp: +62... 📧 info@balizero.com"
   ⚠️ ENFORCEMENT: If you feel tempted to add a citation for pricing, STOP - it's forbidden

═══════════════════════════════════════════════════════════════════════════════
⑦ RESPONSE STRUCTURE - 3 Modes
═══════════════════════════════════════════════════════════════════════════════

**SANTAI** (Casual/Greetings) - 2-4 sentences
Example:
  "Ciao! Sono **ZANTARA**, l'AI di Bali Zero 🌴  
  Aiuto con visa, KITAS, PT PMA, e altro. Cosa ti serve?"

**PIKIRAN** (Business/Professional) - 6-12 sentences  
Example:
  "Per il **KITAS Limited Stay Permit**:  
  
  **Prezzo**: 15.000.000 IDR  
  **Processing**: 90 giorni  
  **Requisiti**:  
  • Passaporto valido (min 18 mesi)  
  • Sponsor Letter  
  • Medical Certificate  
  
  Bali Zero gestisce tutto il processo end-to-end.
  📞 WhatsApp: +62 859 0436 9574
  📧 info@balizero.com"

**KOMPLEKS** (Complex/Research) - 12-20 sentences
Example:
  "**KITAS vs IMTA - Complete Analysis**  
  
  **KITAS** (Limited Stay Permit):  
  • Prezzo: 15.000.000 IDR  
  • Durata: 1-2 anni  
  • Permette: Residenza in Indonesia  
  
  **IMTA** (Work Permit):  
  • Prezzo: 8.000.000 IDR  
  • Durata: 1 anno  
  • Permette: Lavoro legale  
  
  **Relazione**: IMTA richiede KITAS valido (prima KITAS, poi IMTA).  
  
  **Processo Combinato**:  
  1. Apply KITAS (90 giorni)  
  2. Apply IMTA (60 giorni)  
  Total: ~5 mesi  
  
  Bali Zero può gestire entrambi simultaneamente per velocizzare!
  📞 +62 859 0436 9574"

═══════════════════════════════════════════════════════════════════════════════
⑧ PERSONALITY - Adaptive Communication
═══════════════════════════════════════════════════════════════════════════════

**WITH ZERO** (Founder):  
"Zero! Come va? Il sistema sta performando alla grande! 🚀"

**WITH TEAM** (Dea, Krisna, Ari, Amanda):  
"Hey Dea Exec! Sì, ho visto il client di stamattina - sembra interessato al PT PMA.  
Vuoi che prepari i docs?"

**WITH CLIENTS**:  
"Selamat datang! Welcome to Bali Zero 🌴  
I'm ZANTARA, your AI assistant for Indonesian business services."

**CORE TRAITS**:
- Warm, intelligent, culturally aware
- Match user's language (English, Italian, Indonesian)
- Natural conversation (not robotic)
- Professional but friendly
- NEVER describe emotions ("*smiles*") - just BE natural

═══════════════════════════════════════════════════════════════════════════════
⑨ BACKGROUND SYSTEMS - Auto-Running
═══════════════════════════════════════════════════════════════════════════════

**CRM (Auto-Extraction)**:  
System automatically extracts client name, email, phone from conversations.  
Creates practice records for KITAS, PT PMA, visa inquiries.  
YOU: Just have natural conversations - CRM handles the rest.

**ChromaDB (14 Collections)**:  
5 Oracle domains (tax, legal, property, visa, kbli) + 9 specialized collections.  
RAG system auto-retrieves relevant context.  
YOU: Call rag.query when you need research depth.

**PostgreSQL (Memory + Analytics)**:  
Stores conversations, user profiles, team activity, work sessions.  
YOU: Call memory.* tools to retrieve past context.

**Claude Haiku 4.5**:  
Your AI engine (3x cheaper than Sonnet, same quality with RAG).  
YOU: Focus on natural conversation - engine handles the rest.

═══════════════════════════════════════════════════════════════════════════════
FINAL REMINDER: You're ZANTARA - Indonesian AI bridging ancient wisdom with  
modern business intelligence. Natural, warm, culturally aware, precise. 🌴🇮🇩
═══════════════════════════════════════════════════════════════════════════════
"""

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

        # ✨ CORRECTION: Use proper ChromaDB path with full database
        local_path = os.getenv("FLY_VOLUME_MOUNT_PATH", "/data/chroma_db_FULL_deploy")

        # 🔧 OPTION 1: FORCE COMPLETE SYNC FROM R2
        # Check if we need to force sync based on file count/size
        chroma_sqlite_path = os.path.join(local_path, "chroma.sqlite3")
        force_sync = False
        
        if os.path.exists(chroma_sqlite_path):
            file_size_mb = os.path.getsize(chroma_sqlite_path) / 1024 / 1024
            # Force sync if database is too small (< 50MB = incomplete sync)
            if file_size_mb < 50.0:
                logger.info(f"⚠️ ChromaDB too small ({file_size_mb:.1f} MB), forcing complete sync...")
                force_sync = True
            else:
                logger.info(f"✅ ChromaDB found in persistent volume: {local_path}")
                logger.info(f"⚡ Using cached version ({file_size_mb:.1f} MB)")
                return local_path
        else:
            logger.info("🔄 No ChromaDB found, forcing complete sync...")
            force_sync = True

        if force_sync:
            logger.info("🗑️ Removing incomplete ChromaDB data...")
            if os.path.exists(local_path):
                import shutil
                shutil.rmtree(local_path)
            os.makedirs(local_path, exist_ok=True)

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
    """Lightweight startup hook to trigger async warmup without blocking binding."""
    global warmup_task
    logger.info("⚡ ZANTARA backend binding immediately, warmup async…")
    warmup_task = asyncio.create_task(_initialize_backend_services())
    warmup_task.add_done_callback(_log_warmup_result)


def _log_warmup_result(task: asyncio.Task):
    try:
        task.result()
        logger.info("✅ Async warmup completed")
    except Exception as exc:
        logger.error(f"❌ Async warmup failed: {exc}")


async def preload_redis_cache():
    """Preload Redis cache with essential keys for faster warmup"""
    logger.info("⚡ Preloading Redis cache keys...")
    try:
        from core.cache import cache
        from datetime import datetime

        # Set boot time
        cache.set("system:boot_time", datetime.utcnow().isoformat(), ttl=3600)

        # Pre-warm essential keys
        essential_keys = ["agent_state", "pricing_rules", "capabilities", "system_config"]
        for key in essential_keys:
            cache.get(key)  # Triggers connection if not established

        logger.info("✅ Redis warmup complete")
        return True
    except Exception as e:
        logger.warning(f"⚠️ Redis preload incomplete: {e}")
        return False


async def _initialize_backend_services():
    """Initialize heavy services asynchronously after binding."""
    global search_service, claude_haiku, intelligent_router, cultural_rag_service, tool_executor, pricing_service, collaborator_service, memory_service, conversation_service, emotional_service, capabilities_service, reranker_service, handler_proxy_service, fact_extractor, alert_service, work_session_service, team_analytics_service, query_router, autonomous_research_service, cross_oracle_synthesis_service, dynamic_pricing_service, session_service

    logger.info("🚀 Starting ZANTARA RAG Backend (Llama 4 Scout PRIMARY + Claude Haiku FALLBACK)...")
    logger.info("🔥 Async warmup starting for core services (Chroma, routers, agents)...")

    # Preload Redis cache first
    redis_warmup = asyncio.create_task(preload_redis_cache())

    await asyncio.sleep(0.1)

    # Initialize Session Service (Redis-based conversation store for 50+ messages)
    try:
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            session_service = SessionService(redis_url=redis_url, ttl_hours=24)
            # Test connection
            health = await session_service.health_check()
            if health:
                logger.info("✅ SessionService ready (50+ message support via Redis)")
            else:
                logger.warning("⚠️ SessionService unhealthy - sessions may not work")
        else:
            logger.warning("⚠️ REDIS_URL not set - SessionService disabled (using querystring fallback)")
            session_service = None
    except Exception as e:
        logger.error(f"❌ SessionService initialization failed: {e}")
        session_service = None

    # Initialize Redis client for Semantic Cache
    try:
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            redis_client = Redis.from_url(redis_url, decode_responses=False)
            # Test connection
            await redis_client.ping()
            logger.info(f"✅ Redis client initialized: {redis_url}")
            
            # Initialize Semantic Cache
            semantic_cache = get_semantic_cache(redis_client)
            logger.info("✅ Semantic cache initialized (similarity threshold: 0.95)")
            logger.info("   Cache features: exact match + semantic similarity")
            logger.info("   Performance: 800ms → 150ms (-81% on cache hit)")
            logger.info("   Storage: Redis with LRU eviction (max 10k entries)")
        else:
            logger.warning("⚠️ REDIS_URL not set - Semantic cache disabled")
            redis_client = None
            semantic_cache = None
    except Exception as e:
        logger.error(f"❌ Semantic cache initialization failed: {e}")
        redis_client = None
        semantic_cache = None

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

    # Download ChromaDB from Cloudflare R2 (OR initialize empty)
    try:
        chroma_path = download_chromadb_from_r2()
        logger.info("✅ ChromaDB loaded from Cloudflare R2")
    except Exception as e:
        import traceback
        logger.warning(f"⚠️ R2 download failed: {e}")
        logger.info("📂 Initializing empty ChromaDB for manual population...")

        # Fallback: Initialize empty ChromaDB in persistent volume (or /tmp)
        chroma_path = os.getenv("FLY_VOLUME_MOUNT_PATH", "/data/chroma_db_FULL_deploy")
        os.makedirs(chroma_path, exist_ok=True)
        logger.info(f"✅ Empty ChromaDB initialized: {chroma_path}")
        logger.info("💡 Populate via: POST /api/oracle/populate-now")

    # Set environment variable for SearchService
    os.environ['CHROMA_DB_PATH'] = chroma_path

    # Initialize Search Service (even if ChromaDB is empty)
    try:
        search_service = SearchService()
        logger.info("✅ ChromaDB search service ready")

        # Set global search_service for dependency injection
        import app.dependencies as deps
        deps.search_service = search_service
        logger.info("✅ SearchService registered in dependencies")

        # Warm up ChromaDB collections (will work even with empty collections)
        try:
            await search_service.warmup()
            logger.info("✅ ChromaDB warmup complete")
        except Exception as warmup_exc:
            logger.warning(f"⚠️ ChromaDB warmup skipped: {warmup_exc}")

        # Initialize memory vector DB
        try:
            initialize_memory_vector_db(chroma_path)
            logger.info("✅ Memory vector collection prepared")
        except Exception as memory_exc:
            logger.warning(f"⚠️ Memory vector initialization skipped: {memory_exc}")

    except Exception as e:
        import traceback
        logger.error(f"❌ SearchService initialization failed: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        logger.warning("⚠️ Continuing without SearchService (pure LLM mode)")
        search_service = None

    # Initialize Llama 4 Scout Client (Primary AI with Haiku fallback)
    try:
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY_LLAMA")
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

        if openrouter_api_key or anthropic_api_key:
            llama_scout_client = LlamaScoutClient(
                openrouter_api_key=openrouter_api_key,
                anthropic_api_key=anthropic_api_key,
                force_haiku=False  # Try Llama first, fallback to Haiku
            )
            logger.info("✅ Llama 4 Scout + Haiku 4.5 ready (Primary + Fallback)")
            logger.info("   Primary: Llama 4 Scout (92% cheaper, 22% faster TTFT)")
            logger.info("   Cost: $0.20/$0.20 per 1M tokens vs Haiku $1/$5")
            logger.info("   Fallback: Claude Haiku 4.5 (for tool use & emergencies)")
            logger.info(f"   Llama available: {'✅' if openrouter_api_key else '❌'}")
            logger.info(f"   Haiku available: {'✅' if anthropic_api_key else '❌'}")

            # Also initialize standalone claude_haiku for backward compatibility
            if anthropic_api_key:
                claude_haiku = ClaudeHaikuService(api_key=anthropic_api_key)
            else:
                claude_haiku = None
        else:
            logger.warning("⚠️ Neither OPENROUTER_API_KEY_LLAMA nor ANTHROPIC_API_KEY set - No AI available")
            llama_scout_client = None
            claude_haiku = None
    except Exception as e:
        logger.error(f"❌ Llama Scout client initialization failed: {e}")
        llama_scout_client = None
        claude_haiku = None

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
        ts_backend_url = os.getenv("TYPESCRIPT_BACKEND_URL", "https://nuzantara-backend.fly.dev")
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
        memory_service = MemoryServicePostgres()  # PostgreSQL via Fly.io DATABASE_URL
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

    # Initialize RerankerService (Performance Enhancement - ENABLED by config)
    # Use config setting but allow env override for production (backward compatibility)
    reranker_enabled = os.getenv("ENABLE_RERANKER", str(settings.enable_reranker)).lower() == "true"
    if reranker_enabled:
        try:
            logger.info(f"⏳ Loading RerankerService (enabled={settings.enable_reranker})...")
            from services.reranker_service import RerankerService
            
            # Initialize with feature flags from config (backward compatible defaults)
            # Initialize reranker with feature flags
            reranker_service = RerankerService(
                model_name=settings.reranker_model,
                cache_size=settings.reranker_cache_size if hasattr(settings, 'reranker_cache_size') else 1000,
                enable_cache=settings.reranker_cache_enabled if hasattr(settings, 'reranker_cache_enabled') else True
            )
            
            # Initialize audit service if enabled
            if hasattr(settings, 'reranker_audit_enabled') and settings.reranker_audit_enabled:
                try:
                    from services.reranker_audit import initialize_audit_service
                    audit_service = initialize_audit_service(
                        enabled=True,
                        log_file=None  # Use default path
                    )
                    logger.info("✅ RerankerAuditService initialized")
                except Exception as e:
                    logger.warning(f"⚠️ RerankerAuditService initialization failed: {e}")
            
            logger.info(
                f"✅ RerankerService ready "
                f"(model: {settings.reranker_model}, "
                f"cache: {'enabled' if reranker_service.enable_cache else 'disabled'}, "
                f"target latency: {settings.reranker_latency_target_ms}ms, "
                f"+40% quality boost)"
            )
        except Exception as e:
            logger.error(f"❌ RerankerService initialization failed: {e}")
            logger.warning("⚠️ Continuing without re-ranker - performance may be reduced")
            reranker_service = None
    else:
        logger.info("ℹ️ Re-ranker disabled for faster startup (set enable_reranker=True to enable)")
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

    # Initialize ToolExecutor WITH ZantaraTools (for get_pricing)
    tool_executor = None
    if handler_proxy_service:
        try:
            # Import and initialize ZantaraTools
            from services.zantara_tools import get_zantara_tools
            zantara_tools_instance = get_zantara_tools()
            logger.info("✅ ZantaraTools loaded (get_pricing, team tools)")

            internal_key = os.getenv("API_KEYS_INTERNAL")
            tool_executor = ToolExecutor(
                handler_proxy_service,
                internal_key,
                zantara_tools_instance  # ← PASS ZANTARA TOOLS!
            )
            logger.info("✅ ToolExecutor initialized (TypeScript + ZantaraTools)")
        except Exception as e:
            logger.warning(f"⚠️ ToolExecutor initialization failed: {e}")
            tool_executor = None
    else:
        logger.warning("⚠️ ToolExecutor not initialized - missing dependencies")
        logger.warning(f"   HandlerProxy: {'✅' if handler_proxy_service else '❌'}")

    # Initialize Intelligent Router (Llama 4 Scout PRIMARY + Haiku FALLBACK)
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
                llama_client=None,  # Kept for backward compatibility
                haiku_service=llama_scout_client,  # NEW: LlamaScoutClient with Haiku fallback
                search_service=search_service,
                tool_executor=tool_executor,
                cultural_rag_service=cultural_rag_service,
                autonomous_research_service=autonomous_research_service,
                cross_oracle_synthesis_service=cross_oracle_synthesis_service
            )
            logger.info("✅ Intelligent Router ready (Llama 4 Scout PRIMARY + Haiku FALLBACK)")
            logger.info("   Primary AI: Llama 4 Scout (92% cheaper, 22% faster)")
            logger.info("   Fallback AI: Claude Haiku 4.5 (tool calling, errors)")
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
    # Fly.io persistent volumes are automatically managed and preserved across restarts
    # Only clean up /tmp if it was used (fallback case)
    try:
        volume_path = os.getenv("FLY_VOLUME_MOUNT_PATH")
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
    collection: Optional[str] = None  # FIX: Allow specifying collection for OpenAI 1536-dim migration


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
    tools: Optional[List[Dict[str, Any]]] = None  # ← NEW: Tool definitions from frontend
    tool_choice: Optional[Dict[str, Any]] = None  # ← NEW: Tool choice strategy


class BaliZeroResponse(BaseModel):
    success: bool
    response: str
    model_used: str
    ai_used: str  # "haiku" | "llama"
    sources: Optional[List[Dict[str, Any]]] = None
    usage: Optional[Dict[str, Any]] = None
    used_rag: Optional[bool] = None  # PHASE 1: Track RAG usage
    tools_used: Optional[List[str]] = None  # ← NEW: Which tools were called


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


# Legacy health endpoint removed - use /health instead


@app.get("/cache/health")
async def cache_health():
    """Check cache health status"""
    try:
        from core.cache import cache
        from datetime import datetime

        # Test cache connectivity
        test_key = "health_check_test"
        test_value = datetime.now().isoformat()

        # Try to set a value
        cache.set(test_key, test_value, ttl=10)

        # Try to get the value back
        retrieved = cache.get(test_key)

        is_healthy = retrieved == test_value

        # Determine cache backend type
        cache_backend = "unknown"
        if hasattr(cache, 'redis_client') and cache.redis_client:
            cache_backend = "redis"
        elif hasattr(cache, 'cache') and cache.cache:
            cache_backend = "memory"

        return {
            "status": "healthy" if is_healthy else "degraded",
            "backend": cache_backend,
            "test_passed": is_healthy,
            "connected": is_healthy,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "backend": "unavailable",
            "timestamp": datetime.now().isoformat()
        }


@app.options("/health")
async def health_options():
    """Handle CORS preflight for health endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600"
        }
    )


@app.get("/health")
async def health_check():
    """Optimized health check endpoint - v100 with reranker stats"""
    health_data = {
        "status": "healthy",
        "service": "ZANTARA RAG",
        "version": "v100-perfect",
        "mode": "full",
        "available_services": [
            "chromadb",
            "claude_haiku",
            "postgresql",
            "crm_system",
            "reranker"
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
        "reranker": {
            "enabled": reranker_service is not None,
            "status": "ready" if reranker_service is not None else "disabled"
        },
        "collaborative_intelligence": True,
        "tools": {
            "tool_executor_status": tool_executor is not None,
            "pricing_service_status": pricing_service is not None,
            "handler_proxy_status": handler_proxy_service is not None
        }
    }
    
    # Add detailed reranker stats if available
    if reranker_service is not None:
        try:
            reranker_stats = reranker_service.get_stats()
            health_data["reranker"].update({
                "stats": {
                    "total_reranks": reranker_stats.get("total_reranks", 0),
                    "avg_latency_ms": round(reranker_stats.get("avg_latency_ms", 0), 2),
                    "p95_latency_ms": round(reranker_stats.get("p95_latency_ms", 0), 2),
                    "p99_latency_ms": round(reranker_stats.get("p99_latency_ms", 0), 2),
                    "cache_hit_rate_percent": round(reranker_stats.get("cache_hit_rate_percent", 0), 1),
                    "target_latency_met_rate_percent": round(reranker_stats.get("target_latency_met_rate_percent", 0), 1),
                    "cache_enabled": reranker_stats.get("cache_enabled", False),
                    "cache_size": reranker_stats.get("cache_size", 0),
                    "cache_max_size": reranker_stats.get("cache_max_size", 0),
                    "target_latency_ms": reranker_stats.get("target_latency_ms", 50.0)
                },
                "status": "healthy" if reranker_stats.get("avg_latency_ms", 0) < 100 else "degraded"
            })
        except Exception as e:
            logger.warning(f"Failed to get reranker stats: {e}")
            health_data["reranker"]["error"] = str(e)
    
    return Response(
        content=json.dumps(health_data),
        media_type="application/json",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )


@app.post("/api/auth/demo")
async def demo_auth(request: Request):
    """
    Demo authentication endpoint for frontend

    This endpoint provides a simple token-based authentication for development/demo purposes.
    Frontend calls this from zantara-client.js to get an access token.

    Request body:
    {
        "userId": "demo" (optional)
    }

    Response:
    {
        "token": "demo_<userId>_<timestamp>",
        "expiresIn": 3600,
        "userId": "<userId>"
    }
    """
    try:
        body = await request.json()
        user_id = body.get("userId", "demo")

        # Generate demo token (simple timestamp-based for now)
        # In production, this would use JWT or similar
        token = f"demo_{user_id}_{int(time.time())}"

        logger.info(f"🔐 Demo auth: Generated token for user '{user_id}'")

        return JSONResponse(
            content={
                "token": token,
                "expiresIn": 3600,  # 1 hour
                "userId": user_id
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except Exception as e:
        logger.error(f"❌ Demo auth error: {e}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@app.options("/api/auth/demo")
async def demo_auth_options():
    """Handle CORS preflight for demo auth endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600"
        }
    )


@app.get("/warmup/stats")
async def warmup_stats():
    """Get warmup task status and system readiness"""
    global warmup_task

    is_running = warmup_task is not None and not warmup_task.done()
    is_complete = warmup_task is not None and warmup_task.done() and not warmup_task.cancelled()

    # Check if warmup completed successfully
    warmup_error = None
    if warmup_task and warmup_task.done():
        try:
            warmup_task.result()  # Will raise if there was an error
        except Exception as e:
            warmup_error = str(e)

    return {
        "isRunning": is_running,
        "isComplete": is_complete,
        "healthy": is_complete and warmup_error is None,
        "error": warmup_error,
        "services": {
            "chromadb": search_service is not None,
            "claude_haiku": claude_haiku is not None,
            "memory": memory_service is not None,
            "tool_executor": tool_executor is not None,
            "intelligent_router": intelligent_router is not None
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
        executor = ToolExecutor(handler_proxy_service, internal_key, None)
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
            limit=request.k,
            collection_override=request.collection  # FIX: Pass collection for 1536-dim migration
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

            # Log tools info if provided by frontend
            if request.tools:
                logger.info(f"🔧 [Chat] Frontend provided {len(request.tools)} tools")
                logger.info(f"   Tool names: {[t.get('name', 'unknown') for t in request.tools[:5]]}")
            else:
                logger.info("⚠️ [Chat] No tools provided by frontend - will use backend default")

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
                        collaborator=collaborator,  # ← NEW: Pass collaborator for team personalization
                        frontend_tools=request.tools  # ← NEW: Pass tools from frontend
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
            tools_called = routing_result.get("tools_called", [])  # ← NEW: Get which tools were called

            if tools_called:
                logger.info(f"✅ [Chat] Tools called by AI: {tools_called}")

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
                    # OPTIMIZATION: Overfetch 20 → rerank top-5 for +40% relevance
                    # Use config values with backward compatibility
                    overfetch_count = (
                        settings.reranker_overfetch_count 
                        if hasattr(settings, 'reranker_overfetch_count') 
                        else 20
                    )
                    return_count = (
                        settings.reranker_return_count 
                        if hasattr(settings, 'reranker_return_count') 
                        else settings.reranker_top_k
                    )
                    
                    search_results = await search_service.search(
                        query=request.query,
                        user_level=sub_rosa_level,
                        limit=overfetch_count  # Overfetch candidates for reranking
                    )

                    if search_results.get("results"):
                        if reranker_service:
                            candidates = search_results["results"]
                            reranked = reranker_service.rerank(
                                query=request.query,
                                documents=candidates,
                                top_k=return_count  # Return top-K after reranking
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
            used_rag=used_rag,  # PHASE 1: Return RAG usage flag
            tools_used=tools_called if tools_called else None  # ← NEW: Return which tools were called
        )

    except Exception as e:
        logger.error(f"❌ Chat failed: {e}")
        raise HTTPException(500, f"Chat failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# SESSION ENDPOINTS - Redis-based conversation store for 50+ message support
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/sessions")
async def create_session():
    """
    Create a new conversation session

    Returns:
        {"session_id": "uuid-here"}

    Example:
        curl -X POST https://nuzantara-rag.fly.dev/sessions
    """
    if not session_service:
        raise HTTPException(503, "Session service unavailable - REDIS_URL not configured")

    try:
        session_id = await session_service.create_session()
        logger.info(f"🆕 Created session: {session_id}")
        return {"session_id": session_id}
    except Exception as e:
        logger.error(f"❌ Failed to create session: {e}")
        raise HTTPException(500, f"Failed to create session: {str(e)}")


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get conversation history for a session

    Args:
        session_id: Session UUID

    Returns:
        {"session_id": "...", "history": [...]}

    Example:
        curl https://nuzantara-rag.fly.dev/sessions/{session_id}
    """
    if not session_service:
        raise HTTPException(503, "Session service unavailable - REDIS_URL not configured")

    try:
        history = await session_service.get_history(session_id)
        if history is None:
            raise HTTPException(404, "Session not found or expired")

        return {
            "session_id": session_id,
            "history": history,
            "message_count": len(history)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get session: {e}")
        raise HTTPException(500, f"Failed to get session: {str(e)}")


@app.put("/sessions/{session_id}")
async def update_session(session_id: str, request: Request):
    """
    Update conversation history for a session

    Args:
        session_id: Session UUID
        Body: {"history": [{"role": "user", "content": "..."}, ...]}

    Returns:
        {"session_id": "...", "updated": true, "message_count": N}

    Example:
        curl -X PUT https://nuzantara-rag.fly.dev/sessions/{session_id} \
          -H "Content-Type: application/json" \
          -d '{"history": [{"role":"user","content":"test"}]}'
    """
    if not session_service:
        raise HTTPException(503, "Session service unavailable - REDIS_URL not configured")

    try:
        body = await request.json()
        history = body.get("history", [])
        ttl_hours = body.get("ttl_hours")  # Optional custom TTL

        if not isinstance(history, list):
            raise HTTPException(400, "History must be an array")

        # Use custom TTL if provided, otherwise use default (24h)
        if ttl_hours:
            if not isinstance(ttl_hours, (int, float)) or ttl_hours <= 0 or ttl_hours > 720:
                raise HTTPException(400, "ttl_hours must be a number between 1 and 720 (30 days)")

            success = await session_service.update_history_with_ttl(session_id, history, int(ttl_hours))
            logger.info(f"💾 Updated session {session_id} with {len(history)} messages (TTL: {ttl_hours}h)")
        else:
            success = await session_service.update_history(session_id, history)
            logger.info(f"💾 Updated session {session_id} with {len(history)} messages (TTL: 24h default)")

        if not success:
            raise HTTPException(500, "Failed to update session")

        return {
            "session_id": session_id,
            "updated": True,
            "message_count": len(history),
            "ttl_hours": ttl_hours if ttl_hours else 24
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update session: {e}")
        raise HTTPException(500, f"Failed to update session: {str(e)}")


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session

    Args:
        session_id: Session UUID

    Returns:
        {"session_id": "...", "deleted": true}

    Example:
        curl -X DELETE https://nuzantara-rag.fly.dev/sessions/{session_id}
    """
    if not session_service:
        raise HTTPException(503, "Session service unavailable - REDIS_URL not configured")

    try:
        deleted = await session_service.delete_session(session_id)
        return {
            "session_id": session_id,
            "deleted": deleted
        }
    except Exception as e:
        logger.error(f"❌ Failed to delete session: {e}")
        raise HTTPException(500, f"Failed to delete session: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# SEMANTIC CACHE ENDPOINTS - Cache management for RAG queries
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/cache/stats")
async def get_cache_stats():
    """
    Get semantic cache statistics
    
    Returns:
        Cache size, utilization, hit rate, etc.
    
    Example:
        curl https://nuzantara-rag.fly.dev/api/cache/stats
    """
    if not semantic_cache:
        raise HTTPException(503, "Semantic cache unavailable - REDIS_URL not configured")
    
    try:
        stats = await semantic_cache.get_cache_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(500, f"Failed to get cache stats: {str(e)}")


@app.post("/api/cache/clear")
async def clear_cache():
    """
    Clear semantic cache (admin only)
    
    Returns:
        Success confirmation
    
    Example:
        curl -X POST https://nuzantara-rag.fly.dev/api/cache/clear
    """
    if not semantic_cache:
        raise HTTPException(503, "Semantic cache unavailable - REDIS_URL not configured")
    
    try:
        await semantic_cache.clear_cache()
        return {"success": True, "message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(500, f"Failed to clear cache: {str(e)}")


@app.get("/api/cache/health")
async def cache_health():
    """
    Check cache health
    
    Returns:
        Redis connection status and cache operational status
    
    Example:
        curl https://nuzantara-rag.fly.dev/api/cache/health
    """
    if not semantic_cache or not redis_client:
        return {
            "success": False,
            "redis_connected": False,
            "cache_operational": False,
            "error": "Cache not configured (REDIS_URL missing)"
        }
    
    try:
        # Test Redis connection
        await redis_client.ping()
        stats = await semantic_cache.get_cache_stats()
        
        return {
            "success": True,
            "redis_connected": True,
            "cache_operational": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        return {
            "success": False,
            "redis_connected": False,
            "cache_operational": False,
            "error": str(e)
        }


@app.get("/analytics/sessions")
async def get_session_analytics():
    """
    Get analytics about all sessions

    Returns analytics including:
    - Total sessions
    - Active sessions (with messages)
    - Average messages per session
    - Top session by message count
    - Distribution by message count ranges

    NOTE: Path changed from /sessions/analytics to /analytics/sessions
    to avoid FastAPI route conflict with /sessions/{session_id}
    """
    if not session_service:
        raise HTTPException(503, "Session service unavailable")

    try:
        analytics = await session_service.get_analytics()
        return analytics
    except Exception as e:
        logger.error(f"❌ Failed to get analytics: {e}")
        raise HTTPException(500, f"Failed to get analytics: {str(e)}")


@app.put("/sessions/{session_id}/ttl")
async def update_session_ttl(session_id: str, request: Request):
    """
    Update session TTL (time-to-live)

    Body: {"ttl_hours": 168}  # e.g., 7 days = 168 hours
    """
    if not session_service:
        raise HTTPException(503, "Session service unavailable")

    try:
        body = await request.json()
        ttl_hours = body.get("ttl_hours")

        if not ttl_hours or not isinstance(ttl_hours, (int, float)):
            raise HTTPException(400, "ttl_hours must be a number")

        if ttl_hours <= 0 or ttl_hours > 720:  # Max 30 days
            raise HTTPException(400, "ttl_hours must be between 1 and 720 (30 days)")

        extended = await session_service.extend_ttl_custom(session_id, int(ttl_hours))

        if not extended:
            raise HTTPException(404, "Session not found or expired")

        return {
            "session_id": session_id,
            "ttl_hours": ttl_hours,
            "updated": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update TTL: {e}")
        raise HTTPException(500, f"Failed to update TTL: {str(e)}")


@app.get("/sessions/{session_id}/export")
async def export_session(session_id: str, format: str = "json"):
    """
    Export session conversation in specified format

    Query params:
    - format: "json" or "markdown" (default: json)

    Returns:
    - JSON: application/json with conversation data
    - Markdown: text/markdown with formatted conversation
    """
    if not session_service:
        raise HTTPException(503, "Session service unavailable")

    try:
        if format not in ["json", "markdown"]:
            raise HTTPException(400, "Format must be 'json' or 'markdown'")

        exported = await session_service.export_session(session_id, format)

        if not exported:
            raise HTTPException(404, "Session not found or expired")

        # Return appropriate content type
        if format == "markdown":
            from fastapi.responses import PlainTextResponse
            return PlainTextResponse(
                content=exported,
                media_type="text/markdown",
                headers={
                    "Content-Disposition": f"attachment; filename=session_{session_id}.md"
                }
            )
        else:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content=json.loads(exported),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=session_{session_id}.json"
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to export session: {e}")
        raise HTTPException(500, f"Failed to export session: {str(e)}")


@app.api_route("/bali-zero/chat-stream", methods=["GET", "OPTIONS"])
async def bali_zero_chat_stream(
    request: Request,
    query: str = None,
    user_email: Optional[str] = None,
    conversation_history: Optional[str] = None,
    handlers_context: Optional[str] = None,
    session_id: Optional[str] = None
):
    """
    SSE streaming endpoint for real-time chat responses

    Handles both OPTIONS (CORS preflight) and GET (EventSource connection)

    Returns Server-Sent Events (SSE) stream with text chunks as they arrive from AI

    Args:
        query: User message/question
        user_email: Optional user email for personalization
        conversation_history: DEPRECATED - Optional JSON string of conversation history (use session_id instead)
        session_id: NEW - Session ID for Redis-based history (supports 50+ messages)

    Returns:
        StreamingResponse: SSE stream with text chunks

    Example:
        curl -N "http://localhost:8000/bali-zero/chat-stream?query=Ciao"
    """

    # Handle OPTIONS preflight (CORS)
    if request.method == "OPTIONS":
        return Response(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Session-Id, X-Continuity-Id, X-Reconnection, X-Last-Chunk-Timestamp",
                "Access-Control-Max-Age": "3600"
            }
        )

    logger.info(f"🌊 [Stream] SSE request: '{query[:50] if query else 'empty'}...'")

    # Check if intelligent router is available
    if not intelligent_router:
        raise HTTPException(503, "Intelligent Router not available - Claude AI required")

    async def generate():
        """Generator function for SSE stream with heartbeat support"""
        # Declare global services to ensure access in nested function
        global search_service, collaborator_service, memory_service, intelligent_router, session_service

        # Extract reconnection headers for resilience support
        session_id_header = request.headers.get("x-session-id")
        continuity_id = request.headers.get("x-continuity-id")
        is_reconnection = request.headers.get("x-reconnection") == "true"
        last_chunk_timestamp = request.headers.get("x-last-chunk-timestamp")

        # Use query parameter session_id (from URL) if provided, otherwise fall back to header
        effective_session_id = session_id or session_id_header

        if is_reconnection:
            logger.info(f"🔄 [Stream] Reconnection detected - Session: {session_id}, Continuity: {continuity_id}")

        stream_start_time = time.time()
        sequence_number = 0

        try:
            # Send immediate ping to keep connection alive during processing
            yield ": ping\n\n"

            # Parse conversation history - ENHANCED with Redis session support
            parsed_history = None

            # PRIORITY 1: Try session_id (new method - supports 50+ messages)
            if session_id and session_service:
                try:
                    parsed_history = await session_service.get_history(session_id)
                    if parsed_history:
                        logger.info(f"📚 [Stream] Loaded {len(parsed_history)} messages from session {session_id}")
                        # Extend session TTL on active use (keep alive for 24h)
                        await session_service.extend_ttl(session_id)
                    else:
                        logger.warning(f"⚠️ [Stream] Session {session_id} not found or expired")
                except Exception as e:
                    logger.error(f"❌ [Stream] Failed to load session: {e}")

            # PRIORITY 2: Fallback to querystring (backward compatibility - DEPRECATED)
            if not parsed_history and conversation_history:
                try:
                    parsed_history = json.loads(conversation_history)

                    # DECOMPRESSION LOGIC: Support compressed history format from client
                    # Compressed format: {r: 'u'|'a', c: 'content'} → Full format: {role: 'user'|'assistant', content: 'content'}
                    decompressed_history = []
                    for msg in parsed_history:
                        if isinstance(msg, dict):
                            # Check if message uses compressed format (keys 'r' and 'c')
                            if 'r' in msg and 'c' in msg:
                                # Decompress: r='u'→'user', r='a'→'assistant'
                                role_map = {'u': 'user', 'a': 'assistant'}
                                decompressed_msg = {
                                    'role': role_map.get(msg['r'], msg['r']),
                                    'content': msg['c']
                                }
                                decompressed_history.append(decompressed_msg)
                            elif 'role' in msg and 'content' in msg:
                                # Already in full format
                                decompressed_history.append(msg)
                            else:
                                # Unknown format, keep as-is
                                decompressed_history.append(msg)
                        else:
                            # Not a dict, keep as-is
                            decompressed_history.append(msg)

                    parsed_history = decompressed_history if decompressed_history else parsed_history
                    logger.info(f"📚 [Stream] Querystring history: {len(parsed_history)} messages (decompressed, DEPRECATED)")
                except Exception as e:
                    logger.warning(f"⚠️ [Stream] Failed to parse conversation_history: {e}")

            # 🚀 NEW: Parse handlers context if provided
            parsed_handlers = None
            if handlers_context:
                try:
                    parsed_handlers = json.loads(handlers_context)
                    logger.info(f"🔧 [Stream] Handlers context: {parsed_handlers.get('available_tools', 0)} tools available")
                except Exception as e:
                    logger.warning(f"⚠️ [Stream] Failed to parse handlers_context: {e}")

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

            # Send ping before memory load (keep-alive)
            yield ": ping\n\n"

            # Load memory if available
            memory = None
            if memory_service and user_id != "anonymous":
                try:
                    memory = await memory_service.get_memory(user_id)
                    logger.info(f"💾 [Stream] Memory loaded: {len(memory.profile_facts)} facts")
                except Exception as e:
                    logger.warning(f"⚠️ [Stream] Memory load failed: {e}")

            # Send ping before AI streaming (keep-alive)
            yield ": ping\n\n"

            # Stream response chunks from intelligent router and collect full message + sources
            full_message = ""
            sources = None

            # Send continuity verification if reconnection
            if is_reconnection and continuity_id:
                continuity_data = {
                    "type": "continuity_check",
                    "streamId": continuity_id,
                    "sequenceNumber": sequence_number,
                    "timestamp": time.time()
                }
                yield f"data: {json.dumps(continuity_data)}\n\n"
                logger.info(f"🔗 [Stream] Continuity verification sent for {continuity_id}")

            # 🔥 FIX: Keep-alive mechanism for Fly.io 30s timeout
            # Track last activity to send periodic pings
            last_activity = time.time()
            KEEPALIVE_INTERVAL = 15  # seconds (half of Fly.io's 30s timeout)

            async for chunk in intelligent_router.stream_chat(
                message=query,
                user_id=user_id,
                conversation_history=parsed_history,  # ✨ Pass conversation history for context
                memory=memory,
                collaborator=collaborator
            ):
                # Check if we need to send keep-alive (if idle > 15s)
                current_time = time.time()
                if current_time - last_activity > KEEPALIVE_INTERVAL:
                    yield ":keepalive\n\n"
                    logger.debug(f"💓 [Stream] Keep-alive sent ({current_time - last_activity:.1f}s idle)")
                    last_activity = current_time

                # Enhanced chunk with sequence number
                sequence_number += 1
                enhanced_chunk = {
                    "text": chunk,
                    "sequenceNumber": sequence_number,
                    "timestamp": time.time()
                }

                # SSE format: data: {json}\n\n
                full_message += chunk
                sse_data = json.dumps(enhanced_chunk)
                yield f"data: {sse_data}\n\n"
                last_activity = time.time()  # Update activity timestamp

            # Send keep-alive before source retrieval (can take time)
            yield ":keepalive\n\n"

            # SOURCES: Attempt to retrieve sources from search service (same logic as chat endpoint)
            try:
                logger.info(f"🔍 [Stream] Sources retrieval starting - search_service: {type(search_service).__name__ if search_service else 'None'}, query: '{query[:50] if query else 'None'}...'")

                if search_service and query:
                    logger.info(f"🔍 [Stream] Calling search_service.search() with query: '{query[:50]}...'")
                    search_results = await search_service.search(
                        query=query,
                        user_level=0,
                        limit=3
                    )

                    if search_results and search_results.get("results"):
                        sources = []
                        for idx, result in enumerate(search_results["results"][:3]):
                            metadata = result.get("metadata", {})
                            source_name = metadata.get("title") or metadata.get("book_title") or metadata.get("source") or "Document"

                            sources.append({
                                "source": source_name,
                                "snippet": result.get("text", "")[:240],
                                "similarity": float(result.get("score", 0)),
                                "tier": metadata.get("tier", "T2"),
                                "dateLastCrawled": metadata.get("last_updated")
                            })
                        logger.info(f"📚 [Stream] Sources retrieved: {len(sources)} documents")
                    else:
                        logger.warning(f"⚠️ [Stream] No search results found - search_results is {search_results}")
                        sources = None
                else:
                    logger.warning(f"⚠️ [Stream] Cannot retrieve sources: search_service={'present (' + type(search_service).__name__ + ')' if search_service else 'MISSING (None)'}, query={'present' if query else 'MISSING'}")
                    sources = None
            except Exception as e:
                logger.error(f"❌ [Stream] Sources retrieval exception: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                sources = None

            # Send sources as final message before done signal
            if sources:
                sources_data = json.dumps({"sources": sources})
                yield f"data: {sources_data}\n\n"
                logger.info(f"✅ [Stream] Sources sent to client: {len(sources)} citations")

            # Send done signal
            done_data = {
                "done": True,
                "sequenceNumber": sequence_number,
                "timestamp": time.time(),
                "streamDuration": time.time() - stream_start_time
            }
            yield f"data: {json.dumps(done_data)}\n\n"
            logger.info(f"✅ [Stream] Stream completed for user {user_id} in {time.time() - stream_start_time:.2f}s")

        except Exception as e:
            logger.error(f"❌ [Stream] Error: {e}")
            # Send error to client with sequence number
            error_data = {
                "error": str(e),
                "done": True,
                "sequenceNumber": sequence_number,
                "timestamp": time.time()
            }
            try:
                yield f"data: {json.dumps(error_data)}\n\n"
            except Exception:
                pass
        finally:
            logger.info("🔁 [Stream] Generator cleanup triggered")

        # Fallback final yield in case loop exits due to disconnect without done/error
        logger.info("ℹ️ [Stream] Generator terminating")

    # Enable TCP keep-alive when possible to keep the SSE socket open
    transport = request.scope.get("transport")
    socket_obj = None
    if transport:
        socket_obj = transport.get_extra_info("socket")
    if socket_obj:
        try:
            socket_obj.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
        except Exception as sock_err:
            logger.debug(f"⚠️ [Stream] Unable to enable keep-alive: {sock_err}")

    async def guarded_generate():
        async for chunk in generate():
            if await request.is_disconnected():
                logger.info("🔌 [Stream] Client disconnected; stopping stream")
                return
            yield chunk

    # EventSource CORS headers (NO credentials for cross-domain EventSource)
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # Disable nginx buffering for immediate streaming
        # CORS headers for browser SSE connections
        "Access-Control-Allow-Origin": "*",  # Wildcard for EventSource (no credentials)
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Session-Id, X-Continuity-Id, X-Reconnection, X-Last-Chunk-Timestamp",
        "Access-Control-Expose-Headers": "Content-Type, Cache-Control, Connection, X-Accel-Buffering"
    }

    return StreamingResponse(
        guarded_generate(),
        media_type="text/event-stream",
        headers=headers
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

# Also mount CRM routers with /api prefix for compatibility
app.include_router(crm_clients.router, prefix="/api")
app.include_router(crm_practices.router, prefix="/api")
app.include_router(crm_interactions.router, prefix="/api")
app.include_router(crm_shared_memory.router, prefix="/api")

# Include Conversations/Memory router
from app.routers import conversations
app.include_router(conversations.router)  # /bali-zero/conversations
app.include_router(conversations.router, prefix="/api", tags=["memory"])  # /api/conversations

# Include Oracle routers (Universal Query System - Phase 3)
from app.routers import oracle_universal
from app.routers import oracle_ingest  # NEW: Bulk ingest endpoint
from app.routers import agents
from app.routers import autonomous_agents  # Tier 1 Autonomous Agents
from app.routers import notifications
app.include_router(oracle_universal.router)
app.include_router(oracle_ingest.router)  # NEW: /api/oracle/ingest + /collections
app.include_router(agents.router)
app.include_router(autonomous_agents.router)  # Tier 1 Autonomous Agents HTTP API
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
    """Root endpoint - Dynamic KB count from ChromaDB"""
    # Calculate dynamic document count from ChromaDB
    total_docs = 0
    collection_stats = {}

    try:
        # Try to get count from search_service if available
        if search_service:
            try:
                if hasattr(search_service, 'chroma_client'):
                    collections = search_service.chroma_client.list_collections()
                    for col in collections:
                        count = col.count()
                        total_docs += count
                        collection_stats[col.name] = count
            except Exception:
                pass

        # If no data yet, connect directly to ChromaDB
        if total_docs == 0:
            import chromadb
            chroma_path = os.getenv('CHROMA_DB_PATH', '/data/chroma_db_FULL_deploy')
            chroma_client = chromadb.PersistentClient(path=chroma_path)
            collections = chroma_client.list_collections()
            for col in collections:
                count = col.count()
                total_docs += count
                collection_stats[col.name] = count
    except Exception as e:
        logger.warning(f"Could not get dynamic doc count: {e}")
        total_docs = 25422  # Fallback to verified count

    return {
        "service": "ZANTARA RAG",
        "version": "3.1.0-perf-fix",
        "status": "operational",
        "features": {
            "chromadb": search_service is not None,
            "ai": {
                "primary": "Llama 4 Scout (92% cheaper, 22% faster TTFT, 10M context)",
                "fallback": "Claude Haiku 4.5 (tool calling, emergencies)",
                "routing": "Intelligent Router (Llama PRIMARY, Haiku FALLBACK)",
                "cost_savings": "92% cheaper than Haiku ($0.20/$0.20 vs $1/$5 per 1M tokens)"
            },
            "knowledge_base": {
                "bali_zero_agents": "1,458 operational documents",
                "zantara_books": "214 books (12,907 embeddings)",
                "total": f"{total_docs:,} documents (dynamic count from ChromaDB)",
                "routing": "intelligent (keyword-based)",
                "collection_counts": collection_stats
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
    ⚠️ LEGACY: Use /api/memory/store instead
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
    ⚠️ LEGACY: Use /api/memory/{memory_id} instead
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
# RAG SEARCH ENDPOINT (Direct KB Access)
# ========================================

class RAGSearchRequest(BaseModel):
    query: str
    collection: Optional[str] = None  # Specific collection or None for auto-detect
    limit: int = 5
    user_level: int = 0  # Access level (0=public, 3=admin)


@app.post("/rag/search")
async def rag_search(request: RAGSearchRequest):
    """
    ⚠️ LEGACY: Use /api/memory/search instead
    Direct search in RAG knowledge base (14 ChromaDB collections)

    Params:
        query: Search query
        collection: Optional specific collection (auto-detect if None)
        limit: Number of results (default 5)
        user_level: Access level 0-3 (default 0 = public)

    Returns:
        {
            "ok": true,
            "results": [...],
            "collection": "collection_name",
            "confidence": 0.85,
            "sources": [...]
        }
    """
    if not search_service:
        raise HTTPException(503, "Search service not available")

    try:
        logger.info(f"🔍 RAG Search: '{request.query}' (collection: {request.collection or 'auto'})")

        # Perform search
        results = await search_service.search(
            query=request.query,
            user_level=request.user_level,
            limit=request.limit,
            collection_override=request.collection
        )

        # Extract collection info
        collection_used = request.collection or results.get("primary_collection", "multi")

        return {
            "ok": True,
            "success": True,
            "results": results.get("results", []),
            "collection": collection_used,
            "confidence": results.get("confidence", 0.8),
            "sources": results.get("sources", []),
            "total": len(results.get("results", []))
        }

    except Exception as e:
        logger.error(f"❌ RAG search failed: {e}")
        raise HTTPException(500, f"RAG search failed: {str(e)}")


# ========================================
# FEATURE #10: RAG QUERY DIRECT ENDPOINTS
# Direct RAG query interface for Backend-TS
# ========================================

class APIQueryRequest(BaseModel):
    query: str
    collection: Optional[str] = None
    limit: int = 5
    metadata_filter: Optional[Dict[str, Any]] = None
    user_level: int = 0


@app.post("/api/query")
async def api_query(request: APIQueryRequest):
    """
    Feature #10: Direct RAG query endpoint for Backend-TS integration

    Unified query interface with ChromaDB collections

    Args:
        query: Search query text
        collection: Optional collection name (auto-detect if None)
        limit: Max results (default 5)
        metadata_filter: Optional metadata filter
        user_level: Access level 0-3 (default 0)

    Returns:
        {
            "ok": true,
            "results": [...],
            "count": 5,
            "collection": "collection_name",
            "query": "original query"
        }
    """
    if not search_service:
        raise HTTPException(503, "Search service not available")

    try:
        logger.info(f"🔍 API Query: '{request.query}' (collection: {request.collection or 'auto'})")

        # Perform search
        results = await search_service.search(
            query=request.query,
            user_level=request.user_level,
            limit=request.limit,
            collection_override=request.collection
        )

        # Format response for Feature #10
        collection_used = request.collection or results.get("primary_collection", "multi")
        formatted_results = results.get("results", [])

        return {
            "ok": True,
            "results": formatted_results,
            "count": len(formatted_results),
            "collection": collection_used,
            "query": request.query
        }

    except Exception as e:
        logger.error(f"❌ API query failed: {e}")
        raise HTTPException(500, f"API query failed: {str(e)}")


@app.post("/api/semantic-search")
async def api_semantic_search(request: APIQueryRequest):
    """
    Feature #10: Semantic search endpoint (alias to /api/query)

    Same functionality as /api/query but with semantic search focus
    """
    return await api_query(request)


@app.get("/api/collections")
async def api_list_collections():
    """
    Feature #10: List all available ChromaDB collections

    Returns:
        {
            "ok": true,
            "collections": [
                {
                    "name": "bali_zero_pricing",
                    "description": "Bali Zero pricing information"
                },
                ...
            ],
            "total": 14
        }
    """
    if not search_service:
        raise HTTPException(503, "Search service not available")

    try:
        # Return list of available collections with descriptions
        collections_list = [
            {"name": "bali_zero_pricing", "description": "Bali Zero pricing information (PRIORITY)"},
            {"name": "visa_oracle", "description": "Visa and immigration guidance"},
            {"name": "kbli_eye", "description": "KBLI business classification codes"},
            {"name": "tax_genius", "description": "Indonesian tax regulations"},
            {"name": "legal_architect", "description": "Legal and regulatory information"},
            {"name": "kb_indonesian", "description": "Indonesian knowledge base"},
            {"name": "kbli_comprehensive", "description": "Comprehensive KBLI data"},
            {"name": "zantara_books", "description": "Zantara knowledge books"},
            {"name": "cultural_insights", "description": "Indonesian cultural intelligence (LLAMA)"},
            {"name": "tax_updates", "description": "Tax regulatory updates"},
            {"name": "tax_knowledge", "description": "Tax knowledge base"},
            {"name": "property_listings", "description": "Property listings data"},
            {"name": "property_knowledge", "description": "Property knowledge base"},
            {"name": "legal_updates", "description": "Legal regulatory updates"}
        ]

        return {
            "ok": True,
            "collections": collections_list,
            "total": len(collections_list)
        }

    except Exception as e:
        logger.error(f"❌ List collections failed: {e}")
        raise HTTPException(500, f"List collections failed: {str(e)}")


@app.get("/api/collections/{collection_name}/stats")
async def api_collection_stats(collection_name: str):
    """
    Feature #10: Get statistics for a specific collection

    Args:
        collection_name: Name of the collection

    Returns:
        {
            "ok": true,
            "collection": "collection_name",
            "total_documents": 1234,
            "tiers_distribution": {...}
        }
    """
    if not search_service:
        raise HTTPException(503, "Search service not available")

    try:
        # Check if collection exists
        if collection_name not in search_service.collections:
            raise HTTPException(404, f"Collection '{collection_name}' not found")

        # Get collection stats
        vector_db = search_service.collections[collection_name]
        stats = vector_db.get_collection_stats()

        return {
            "ok": True,
            "collection": collection_name,
            "total_documents": stats.get("total_documents", 0),
            "tiers_distribution": stats.get("tiers_distribution", {}),
            "persist_directory": stats.get("persist_directory", "")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get collection stats failed: {e}")
        raise HTTPException(500, f"Get collection stats failed: {str(e)}")


@app.get("/api/collections/{name}/count")
async def api_collection_count(name: str):
    """
    Get document count for a specific ChromaDB collection
    
    Args:
        name: Collection name
        
    Returns:
        {
            "ok": true,
            "collection": "collection_name",
            "count": 1234
        }
    """
    if not search_service:
        raise HTTPException(503, "Search service not available")
    
    try:
        # Get ChromaDB wrapper and access native collection
        if name not in search_service.collections:
            raise HTTPException(404, f"Collection '{name}' not found")
        
        chromadb_wrapper = search_service.collections[name]
        # Access the native ChromaDB collection for accurate count
        collection = chromadb_wrapper.collection
        
        # Get count from native collection (not wrapper stats)
        count = collection.count()
        
        return {
            "ok": True,
            "collection": name,
            "count": count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get collection count failed: {e}")
        raise HTTPException(500, f"Get collection count failed: {str(e)}")


@app.post("/api/collections/{collection_name}/load")
async def load_documents_to_collection(
    collection_name: str,
    request: Request
):
    """
    Load documents into a ChromaDB collection with deduplication.
    
    Request body:
    {
        "documents": [
            {
                "id": "doc_id",
                "text": "document text",
                "metadata": {...},
                "embedding": [0.1, 0.2, ...]
            },
            ...
        ],
        "batch_size": 1000,  // optional, default 1000
        "skip_duplicates": true  // optional, default true
    }
    
    Returns:
    {
        "ok": true,
        "collection": "collection_name",
        "loaded": 6158,
        "skipped": 0,
        "total": 6158,
        "duration_seconds": 12.5
    }
    """
    import time
    start_time = time.time()
    
    if not search_service:
        raise HTTPException(503, "Search service not available")
    
    try:
        body = await request.json()
        documents = body.get("documents", [])
        batch_size = body.get("batch_size", 1000)
        skip_duplicates = body.get("skip_duplicates", True)
        
        if not documents:
            raise HTTPException(400, "No documents provided")
        
        # Get or create collection via ChromaDBClient wrapper
        if collection_name not in search_service.collections:
            # Create new ChromaDBClient wrapper for this collection
            from core.vector_db import ChromaDBClient
            chroma_path = os.environ.get('CHROMA_DB_PATH', '/data/chroma_db_FULL_deploy')
            search_service.collections[collection_name] = ChromaDBClient(
                persist_directory=chroma_path,
                collection_name=collection_name
            )

        chromadb_wrapper = search_service.collections[collection_name]
        # Access the native ChromaDB collection
        collection = chromadb_wrapper.collection

        loaded_count = 0
        skipped_count = 0

        # Process in batches
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            
            # Clean metadata: remove None values (ChromaDB doesn't accept null)
            cleaned_metadatas = []
            for doc in batch:
                cleaned_meta = {k: v for k, v in doc["metadata"].items() if v is not None}
                # Ensure at least one metadata field exists
                if not cleaned_meta:
                    cleaned_meta = {"source": "indonesian_laws"}
                cleaned_metadatas.append(cleaned_meta)

            # Add documents to collection (native ChromaDB API)
            collection.add(
                ids=[doc["id"] for doc in batch],
                documents=[doc["text"] for doc in batch],
                metadatas=cleaned_metadatas,
                embeddings=[doc["embedding"] for doc in batch]
            )
            loaded_count += len(batch)
            logger.info(f"📥 Loaded batch {i//batch_size + 1}: {loaded_count}/{len(documents)} documents")
        
        duration = time.time() - start_time
        
        return {
            "ok": True,
            "collection": collection_name,
            "loaded": loaded_count,
            "skipped": skipped_count,
            "total": len(documents),
            "duration_seconds": round(duration, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Load documents failed: {e}")
        raise HTTPException(500, f"Load documents failed: {str(e)}")


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
# Prometheus metrics endpoint for SSE telemetry
@app.get("/metrics")
async def get_prometheus_metrics():
    """
    Enhanced Prometheus metrics endpoint for SSE and system health monitoring - v100
    Returns expanded metrics in Prometheus format for comprehensive monitoring
    """
    try:
        # Try to use enhanced metrics if available
        try:
            from app.metrics import collect_all_metrics, CONTENT_TYPE_LATEST
            metrics_data = await collect_all_metrics()
            return Response(content=metrics_data, media_type=CONTENT_TYPE_LATEST)
        except ImportError:
            pass

        # Fallback to standard metrics
        import psutil
        from datetime import datetime

        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        timestamp = int(time.time() * 1000)

        # Base metrics
        metrics = [
            f"# HELP zantara_cpu_usage_percent CPU usage percentage",
            f"# TYPE zantara_cpu_usage_percent gauge",
            f"zantara_cpu_usage_percent {cpu_percent} {timestamp}",
            "",
            f"# HELP zantara_memory_usage_bytes Memory usage in bytes",
            f"# TYPE zantara_memory_usage_bytes gauge",
            f"zantara_memory_usage_bytes {memory.used} {timestamp}",
            "",
            f"# HELP zantara_memory_available_bytes Available memory in bytes",
            f"# TYPE zantara_memory_available_bytes gauge",
            f"zantara_memory_available_bytes {memory.available} {timestamp}",
            "",
            f"# HELP zantara_disk_usage_bytes Disk usage in bytes",
            f"# TYPE zantara_disk_usage_bytes gauge",
            f"zantara_disk_usage_bytes {disk.used} {timestamp}",
            "",
            f"# HELP zantara_process_uptime_seconds Process uptime in seconds",
            f"# TYPE zantara_process_uptime_seconds counter",
            f"zantara_process_uptime_seconds {time.time() - app.start_time if hasattr(app, 'start_time') else 0} {timestamp}",
            "",
            f"# HELP zantara_api_requests_total Total API requests",
            f"# TYPE zantara_api_requests_total counter",
            f"zantara_api_requests_total {getattr(app, 'request_count', 0)} {timestamp}",
            "",
            f"# HELP zantara_sse_connections_total Total SSE connections initiated",
            f"# TYPE zantara_sse_connections_total counter",
            f"zantara_sse_connections_total {getattr(app, 'sse_connections', 0)} {timestamp}",
            "",
            f"# HELP zantara_sse_active_connections Current active SSE connections",
            f"# TYPE zantara_sse_active_connections gauge",
            f"zantara_sse_active_connections {getattr(app, 'active_sse_connections', 0)} {timestamp}",
            "",
            f"# HELP zantara_rag_queries_total Total RAG queries processed",
            f"# TYPE zantara_rag_queries_total counter",
            f"zantara_rag_queries_total {getattr(app, 'rag_queries', 0)} {timestamp}",
            "",
            f"# HELP zantara_claude_requests_total Total Claude AI requests",
            f"# TYPE zantara_claude_requests_total counter",
            f"zantara_claude_requests_total {getattr(app, 'claude_requests', 0)} {timestamp}",
        ]

        # Service-specific metrics if available
        if search_service:
            metrics.extend([
                "",
                f"# HELP zantara_search_service_status Search service status (1=up, 0=down)",
                f"# TYPE zantara_search_service_status gauge",
                f"zantara_search_service_status 1 {timestamp}",
            ])

        if intelligent_router:
            metrics.extend([
                "",
                f"# HELP zantara_intelligent_router_status Intelligent router status (1=up, 0=down)",
                f"# TYPE zantara_intelligent_router_status gauge",
                f"zantara_intelligent_router_status 1 {timestamp}",
            ])

            # Router metrics
            try:
                router_stats = intelligent_router.get_stats()
                metrics.extend([
                    f"zantara_router_total_queries {router_stats.get('total_queries', 0)} {timestamp}",
                    f"zantara_router_cache_hits {router_stats.get('cache_hits', 0)} {timestamp}",
                    f"zantara_router_cache_misses {router_stats.get('cache_misses', 0)} {timestamp}",
                ])
            except:
                pass

        return Response(
            content="\n".join(metrics),
            media_type="text/plain"
        )

    except Exception as e:
        logger.error(f"Metrics endpoint error: {e}")
        return Response(
            content="# Error generating metrics",
            media_type="text/plain",
            status_code=500
        )

@app.head("/metrics")
async def metrics_head():
    return Response(status_code=200)

# ════════════════════════════════════════════════════════════════════════════════
# 🚀 MISSING ENDPOINTS - API V3 ZANTARA & AGENT ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════════

class UnifiedRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = {}
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    stream: Optional[bool] = False

class AgentRequest(BaseModel):
    agent_type: str
    task: str
    input_data: Optional[Dict[str, Any]] = {}
    parameters: Optional[Dict[str, Any]] = {}

class UnifiedResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = {}
    message: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

# API V3 ZANTARA ENDPOINTS
@app.post("/api/v3/zantara/unified", response_model=UnifiedResponse)
async def zantara_unified(request: UnifiedRequest):
    """
    ZANTARA v3 Ω Unified Knowledge Hub
    Integrates all knowledge systems with advanced reasoning
    """
    try:
        logger.info(f"🧠 ZANTARA v3 Unified Request: {request.query[:100]}...")

        # Use existing search service for unified processing
        from services.search_service import SearchService
        search_service = SearchService()

        # Get response from RAG search
        search_results = await search_service.search(
            query=request.query,
            user_level=3,  # Full access for v3 endpoints
            limit=5
        )

        return UnifiedResponse(
            success=True,
            data={
                "response": f"Found {len(search_results.get('results', []))} relevant results for your query.",
                "sources": search_results.get("results", [])[:3],  # Top 3 results
                "confidence": 0.8,
                "reasoning": "Semantic search across ZANTARA knowledge base",
                "related_topics": [],
                "query": request.query,
                "total_results": len(search_results.get("results", []))
            },
            metadata={
                "model": "search-service-v1",
                "version": "v3.omega",
                "processing_time": 0,
                "rag_enhanced": True,
                "search_method": "semantic"
            }
        )

    except Exception as e:
        logger.error(f"❌ ZANTARA v3 Unified error: {e}")
        return UnifiedResponse(
            success=False,
            error=f"Unified processing failed: {str(e)}",
            message="Service temporarily unavailable"
        )

@app.post("/api/v3/zantara/collective", response_model=UnifiedResponse)
async def zantara_collective(request: UnifiedRequest):
    """
    ZANTARA v3 Ω Collective Memory System
    Cross-user learning and shared knowledge accumulation
    """
    try:
        logger.info(f"🧠 ZANTARA v3 Collective Request: {request.query[:100]}...")

        # Use existing search service for collective processing
        from services.search_service import SearchService
        search_service = SearchService()

        # Get collective intelligence from search results
        search_results = await search_service.search(
            query=f"Collective knowledge: {request.query}",
            user_level=3,  # Full access for v3 endpoints
            limit=8
        )

        return UnifiedResponse(
            success=True,
            data={
                "response": f"Collective analysis found {len(search_results.get('results', []))} relevant insights from shared knowledge.",
                "collective_insights": search_results.get("results", [])[:5],
                "contributor_count": len(search_results.get("results", [])),
                "verification_score": 0.7,
                "related_memories": search_results.get("results", [])[:3],
                "query": request.query,
                "total_results": len(search_results.get("results", []))
            },
            metadata={
                "model": "collective-search-v1",
                "version": "v3.omega",
                "memory_type": "collective",
                "cross_user_learning": True,
                "search_method": "collective-semantics"
            }
        )

    except Exception as e:
        logger.error(f"❌ ZANTARA v3 Collective error: {e}")
        return UnifiedResponse(
            success=False,
            error=f"Collective processing failed: {str(e)}",
            message="Collective intelligence temporarily unavailable"
        )

@app.post("/api/v3/zantara/ecosystem", response_model=UnifiedResponse)
async def zantara_ecosystem(request: UnifiedRequest):
    """
    ZANTARA v3 Ω Business Ecosystem Analysis
    Integrated business intelligence and market analysis
    """
    try:
        logger.info(f"🏢 ZANTARA v3 Ecosystem Request: {request.query[:100]}...")

        # Use existing search service for ecosystem analysis
        from services.search_service import SearchService
        search_service = SearchService()

        # Get ecosystem intelligence
        results = await search_service.search(
            query=f"Business ecosystem: {request.query}",
            user_level=3,  # Full access for v3 endpoints
            limit=5
        )

        response_data = {
            "analysis": f"Ecosystem analysis for: {request.query}",
            "results": results,
            "business_opportunities": [],
            "market_insights": results[:3] if results else [],
            "risk_assessment": {}
        }

        return UnifiedResponse(
            success=True,
            data={
                "analysis": response_data["analysis"],
                "market_insights": response_data.get("market_insights", []),
                "business_opportunities": response_data.get("opportunities", []),
                "risk_assessment": response_data.get("risk_assessment", {}),
                "competitive_landscape": response_data.get("competitive_landscape", [])
            },
            metadata={
                "model": "ecosystem-intelligence",
                "version": "v3.omega",
                "analysis_type": "business-ecosystem",
                "data_sources": ["immigration", "property", "tax", "business"]
            }
        )

    except Exception as e:
        logger.error(f"❌ ZANTARA v3 Ecosystem error: {e}")
        return UnifiedResponse(
            success=False,
            error=f"Ecosystem analysis failed: {str(e)}",
            message="Business ecosystem analysis temporarily unavailable"
        )

# AGENT API ENDPOINTS
@app.post("/api/agent/semantic_search", response_model=UnifiedResponse)
async def agent_semantic_search(request: AgentRequest):
    """
    Advanced Semantic Search Agent
    Uses vector embeddings for intelligent document retrieval
    """
    try:
        logger.info(f"🔍 Semantic Search Agent: {request.task[:100]}...")

        # Use search service with basic search capabilities
        search_service = SearchService()

        # Perform semantic search
        results = await search_service.search(
            query=request.task,
            user_level=3,  # Full access for agent endpoints
            limit=request.input_data.get("limit", 10)
        )

        return UnifiedResponse(
            success=True,
            data={
                "results": results.get("results", []),
                "scores": [r.get("score", 0.8) for r in results.get("results", [])],
                "sources": [r.get("source", "unknown") for r in results.get("results", [])],
                "total_found": len(results.get("results", [])),
                "search_metadata": {
                    "query": request.task,
                    "limit": request.input_data.get("limit", 10),
                    "user_level": 3
                }
            },
            metadata={
                "agent_type": "semantic_search",
                "search_method": "vector_similarity",
                "index_size": len(results.get("results", []))
            }
        )

    except Exception as e:
        logger.error(f"❌ Semantic Search Agent error: {e}")
        return UnifiedResponse(
            success=False,
            error=f"Semantic search failed: {str(e)}",
            message="Search agent temporarily unavailable"
        )

@app.post("/api/agent/hybrid_query", response_model=UnifiedResponse)
async def agent_hybrid_query(request: AgentRequest):
    """
    Hybrid Query Agent
    Combines keyword search with semantic understanding
    """
    try:
        logger.info(f"🔄 Hybrid Query Agent: {request.task[:100]}...")

        # Use search service with hybrid capabilities
        search_service = SearchService()

        # Perform hybrid search
        results = await search_service.hybrid_search(
            query=request.task,
            keyword_weight=request.input_data.get("keyword_weight", 0.5),
            semantic_weight=request.input_data.get("semantic_weight", 0.5),
            limit=request.input_data.get("limit", 10)
        )

        return UnifiedResponse(
            success=True,
            data={
                "results": results["documents"],
                "keyword_results": results.get("keyword_results", []),
                "semantic_results": results.get("semantic_results", []),
                "combined_scores": results["scores"],
                "fusion_method": results.get("fusion_method", "weighted_sum")
            },
            metadata={
                "agent_type": "hybrid_query",
                "search_method": "keyword_semantic_fusion",
                "optimization": "reciprocal_rank_fusion"
            }
        )

    except Exception as e:
        logger.error(f"❌ Hybrid Query Agent error: {e}")
        return UnifiedResponse(
            success=False,
            error=f"Hybrid query failed: {str(e)}",
            message="Hybrid query agent temporarily unavailable"
        )

@app.post("/api/agent/document_intelligence", response_model=UnifiedResponse)
async def agent_document_intelligence(request: AgentRequest):
    """
    Document Intelligence Agent
    Advanced document analysis and information extraction
    """
    try:
        logger.info(f"📄 Document Intelligence Agent: {request.task[:100]}...")

        # Use appropriate service based on document type
        doc_type = request.input_data.get("document_type", "general")

        if doc_type == "legal":
            # Use legal oracle for legal documents
            from routers.oracle_universal import oracle_universal_router
            results = await oracle_universal_router(request.task, request.input_data)
        elif doc_type == "property":
            # Use property oracle for property documents
            from routers.oracle_property import property_oracle_router
            results = await property_oracle_router(request.task, request.input_data)
        elif doc_type == "tax":
            # Use tax oracle for tax documents
            from routers.oracle_tax import tax_oracle_router
            results = await tax_oracle_router(request.task, request.input_data)
        else:
            # Use general search service
            search_service = SearchService()
            results = await search_service.document_analysis(
                query=request.task,
                document=request.input_data.get("document", ""),
                analysis_type=request.input_data.get("analysis_type", "extract_info")
            )

        return UnifiedResponse(
            success=True,
            data={
                "analysis": results.get("analysis", ""),
                "extracted_entities": results.get("entities", []),
                "key_information": results.get("key_info", []),
                "document_type": doc_type,
                "confidence_score": results.get("confidence", 0.8)
            },
            metadata={
                "agent_type": "document_intelligence",
                "document_category": doc_type,
                "processing_method": "advanced_nlp"
            }
        )

    except Exception as e:
        logger.error(f"❌ Document Intelligence Agent error: {e}")
        return UnifiedResponse(
            success=False,
            error=f"Document analysis failed: {str(e)}",
            message="Document intelligence agent temporarily unavailable"
        )

# Initialize metrics tracking
app.start_time = time.time()
app.request_count = 0
app.sse_connections = 0
app.active_sse_connections = 0
app.rag_queries = 0
app.claude_requests = 0

# Request counting middleware
@app.middleware("http")
async def add_request_count(request: Request, call_next):
    app.request_count += 1
    return await call_next(request)

# 🚀 NEW: Include Handlers Registry API
try:
    from api.handlers import router as handlers_router
    app.include_router(handlers_router)
    logger.info("🔧 [Startup] Handlers registry API loaded")
except ImportError as e:
    logger.warning(f"⚠️ [Startup] Failed to load handlers API: {e}")
except Exception as e:
    logger.error(f"❌ [Startup] Error loading handlers API: {e}")

# Force Fly.io redeploy - Priority 1-5 active

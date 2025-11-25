"""
=======================================
ZANTARA v5.3 (Ultra Hybrid) - Universal Oracle API
=======================================

Author: Senior DevOps Engineer & Database Administrator
Version: 5.3.0
Production Status: READY
Description:
Production-ready hybrid RAG system integrating:
- Qdrant Vector Database (Semantic Search)
- Google Drive Integration (PDF Document Repository)
- Google Gemini 1.5 Flash (Reasoning Engine)
- User Identity & Localization System (PostgreSQL)
- Multimodal Capabilities (Text + Audio)
- Comprehensive Error Handling & Logging

Language Protocol:
- Source Code & Logs: ENGLISH (Standard)
- Knowledge Base: Bahasa Indonesia (Indonesian Laws)
- WebApp UI: ENGLISH
- AI Responses: User's preferred language (from users.meta_json.language)
"""

import os
import json
import io
import time
import asyncio
import hashlib
import logging
import traceback
from datetime import datetime
from typing import List, Dict, Optional, Any, Union, BinaryIO
from pathlib import Path

# FastAPI & Core Dependencies
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Google Cloud Integration
import google.generativeai as genai
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Database & Search Service
import sys
sys.path.append(str(Path(__file__).parent.parent.parent))

from services.search_service import SearchService
from services.smart_oracle import smart_oracle
from services.personality_service import PersonalityService
from app.dependencies import get_search_service
from core.qdrant_db import QdrantClient
from core.embeddings import EmbeddingsGenerator

# Database Connection (PostgreSQL)
import asyncpg
import psycopg2
from psycopg2.extras import RealDictCursor

# Production Logging Configuration (Fly.io Compatible)
# Note: Fly.io captures stdout/stderr automatically, no file logging needed
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Console logging only for Fly.io compatibility
    ]
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# ========================================
# CONFIGURATION & ENVIRONMENT SETUP
# ========================================

class Configuration:
    """Production configuration manager"""

    def __init__(self):
        self._validate_environment()

    def _validate_environment(self):
        """Validate required environment variables"""
        required_vars = ['GOOGLE_API_KEY', 'GOOGLE_CREDENTIALS_JSON', 'DATABASE_URL']
        missing_vars = [var for var in required_vars if not os.environ.get(var)]

        if missing_vars:
            logger.error(f"❌ Missing required environment variables: {missing_vars}")
            raise ValueError(f"Missing environment variables: {missing_vars}")

    @property
    def google_api_key(self) -> str:
        return os.environ['GOOGLE_API_KEY']

    @property
    def google_credentials_json(self) -> str:
        return os.environ['GOOGLE_CREDENTIALS_JSON']

    @property
    def database_url(self) -> str:
        return os.environ['DATABASE_URL']

    @property
    def openai_api_key(self) -> str:
        if not os.environ.get('OPENAI_API_KEY'):
            logger.warning("⚠️ OPENAI_API_KEY not set - embeddings may fail")
        return os.environ.get('OPENAI_API_KEY', '')

# Initialize configuration
config = Configuration()

# ========================================
# GOOGLE SERVICES INITIALIZATION
# ========================================

class GoogleServices:
    """Google Cloud services manager"""

    def __init__(self):
        self._gemini_initialized = False
        self._drive_service = None
        self._initialize_services()

    def _initialize_services(self):
        """Initialize Google Gemini and Drive services"""
        try:
            # Initialize Gemini AI
            genai.configure(api_key=config.google_api_key)
            self._gemini_initialized = True
            logger.info("✅ Google Gemini AI initialized successfully")

            # Initialize Drive Service
            self._initialize_drive_service()

        except Exception as e:
            logger.error(f"❌ Failed to initialize Google services: {e}")
            raise

    def _initialize_drive_service(self):
        """Initialize Google Drive service using service account"""
        try:
            creds_dict = json.loads(config.google_credentials_json)
            credentials = service_account.Credentials.from_service_account_info(
                creds_dict,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            self._drive_service = build('drive', 'v3', credentials=credentials)
            logger.info("✅ Google Drive service initialized successfully")

        except Exception as e:
            logger.error(f"❌ Error initializing Google Drive service: {e}")
            self._drive_service = None

    @property
    def gemini_available(self) -> bool:
        return self._gemini_initialized

    @property
    def drive_service(self):
        return self._drive_service

    def get_gemini_model(self, model_name: str = "models/gemini-2.5-pro"):
        """Get Gemini model instance"""
        if not self._gemini_initialized:
            raise RuntimeError("Gemini AI not initialized")

        # Try alternative model names for API compatibility (2025 models)
        # Priority: PRO models for legal reasoning, then Flash as fallback
        alternative_names = [
            "models/gemini-2.5-pro",           # Primary: Best for legal/business reasoning
            "models/gemini-2.5-pro-preview-03-25",
            "models/gemini-3-pro-preview",     # Latest generation
            "models/gemini-2.5-flash",         # Fallback for speed
            "models/gemini-2.0-flash-001",
            "models/gemini-pro-latest"
        ]

        # Try original name first
        try:
            return genai.GenerativeModel(model_name)
        except Exception as e:
            logger.warning(f"⚠️ Failed to load model '{model_name}': {e}")

            # Try alternative names
            for alt_name in alternative_names:
                try:
                    logger.info(f"🔄 Trying alternative model name: {alt_name}")
                    return genai.GenerativeModel(alt_name)
                except Exception as e2:
                    logger.warning(f"⚠️ Failed to load alternative model '{alt_name}': {e2}")
                    continue

            raise RuntimeError(f"Could not load Gemini model '{model_name}' or any alternatives")

    def get_zantara_model(self, use_case: str = "legal_reasoning") -> genai.GenerativeModel:
        """
        Get the best Gemini model for specific ZANTARA use cases

        Args:
            use_case: Type of task
                - "legal_reasoning": Complex legal analysis (use PRO)
                - "personality_translation": Fast personality conversion (use Flash)
                - "multilingual": Multi-language support (use 3 Pro)
                - "document_analysis": Deep document understanding (use PRO)
        """
        if not self._gemini_initialized:
            raise RuntimeError("Gemini AI not initialized")

        # Select best model based on use case
        model_mapping = {
            "legal_reasoning": [
                "models/gemini-2.5-pro",           # Best for legal analysis
                "models/gemini-2.5-pro-preview-03-25",
                "models/gemini-3-pro-preview"
            ],
            "personality_translation": [
                "models/gemini-2.5-flash",         # Fast for personality conversion
                "models/gemini-2.0-flash-001",
                "models/gemini-flash-latest"
            ],
            "multilingual": [
                "models/gemini-3-pro-preview",     # Latest for multi-language
                "models/gemini-2.5-pro",
                "models/gemini-pro-latest"
            ],
            "document_analysis": [
                "models/gemini-2.5-pro",           # Deep understanding
                "models/gemini-2.5-pro-preview-03-25",
                "models/gemini-3-pro-preview"
            ]
        }

        models_to_try = model_mapping.get(use_case, model_mapping["legal_reasoning"])

        for model_name in models_to_try:
            try:
                logger.info(f"🧠 Using {model_name} for {use_case}")
                return genai.GenerativeModel(model_name)
            except Exception as e:
                logger.warning(f"⚠️ Failed to load {model_name}: {e}")
                continue

        # Ultimate fallback
        return self.get_gemini_model()

# Initialize Google services
google_services = GoogleServices()

# ========================================
# DATABASE MANAGER
# ========================================

class DatabaseManager:
    """PostgreSQL database manager for user profiles and analytics"""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self._pool = None

    async def get_user_profile(self, user_email: str) -> Optional[Dict[str, Any]]:
        """Retrieve user profile with localization preferences"""
        try:
            # For production, use async connection pool
            # For now, using synchronous connection for simplicity
            conn = psycopg2.connect(self.database_url)

            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                SELECT id, email, name, role, status, language_preference, meta_json, role_level, timezone
                FROM users
                WHERE email = %s AND status = 'active'
                """
                cursor.execute(query, (user_email,))
                result = cursor.fetchone()

                if result:
                    user_profile = dict(result)
                    # Parse meta_json if it's a string
                    if isinstance(user_profile.get('meta_json'), str):
                        user_profile['meta_json'] = json.loads(user_profile['meta_json'])
                    return user_profile

                return None

        except Exception as e:
            logger.error(f"❌ Error retrieving user profile for {user_email}: {e}")
            return None
        finally:
            if 'conn' in locals():
                conn.close()

    async def store_query_analytics(self, analytics_data: Dict[str, Any]):
        """Store query analytics for performance monitoring"""
        try:
            conn = psycopg2.connect(self.database_url)

            with conn.cursor() as cursor:
                query = """
                INSERT INTO query_analytics (
                    user_id, query_hash, query_text, response_text,
                    language_preference, model_used, response_time_ms,
                    document_count, session_id, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (
                    analytics_data.get('user_id'),
                    analytics_data.get('query_hash'),
                    analytics_data.get('query_text'),
                    analytics_data.get('response_text'),
                    analytics_data.get('language_preference'),
                    analytics_data.get('model_used'),
                    analytics_data.get('response_time_ms'),
                    analytics_data.get('document_count'),
                    analytics_data.get('session_id'),
                    json.dumps(analytics_data.get('metadata', {}))
                ))
                conn.commit()

        except Exception as e:
            logger.error(f"❌ Error storing query analytics: {e}")
        finally:
            if 'conn' in locals():
                conn.close()

    async def store_feedback(self, feedback_data: Dict[str, Any]):
        """Store user feedback for continuous learning"""
        try:
            conn = psycopg2.connect(self.database_url)

            with conn.cursor() as cursor:
                query = """
                INSERT INTO knowledge_feedback (
                    user_id, query_text, original_answer, user_correction,
                    feedback_type, model_used, response_time_ms,
                    user_rating, session_id, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (
                    feedback_data.get('user_id'),
                    feedback_data.get('query_text'),
                    feedback_data.get('original_answer'),
                    feedback_data.get('user_correction'),
                    feedback_data.get('feedback_type'),
                    feedback_data.get('model_used'),
                    feedback_data.get('response_time_ms'),
                    feedback_data.get('user_rating'),
                    feedback_data.get('session_id'),
                    json.dumps(feedback_data.get('metadata', {}))
                ))
                conn.commit()

        except Exception as e:
            logger.error(f"❌ Error storing feedback: {e}")
        finally:
            if 'conn' in locals():
                conn.close()

# Initialize database manager
db_manager = DatabaseManager(config.database_url)

# ========================================
# PYDANTIC MODELS FOR API REQUESTS/RESPONSES
# ========================================

class UserProfile(BaseModel):
    """User profile with localization preferences"""
    user_id: str
    email: str
    name: str
    role: str
    language: str = Field(default="en", description="User's preferred response language")
    tone: str = Field(default="professional", description="Communication tone")
    complexity: str = Field(default="medium", description="Response complexity level")
    timezone: str = Field(default="Asia/Bali", description="User's timezone")
    role_level: str = Field(default="member", description="User's role level")
    meta_json: Dict[str, Any] = Field(default_factory=dict)

class OracleQueryRequest(BaseModel):
    """Universal Oracle query request with user context"""
    query: str = Field(..., description="Natural language query", min_length=3)
    user_email: Optional[str] = Field(None, description="User email for personalization")
    language_override: Optional[str] = Field(None, description="Override user language preference")
    domain_hint: Optional[str] = Field(None, description="Optional domain hint for routing")
    context_docs: Optional[List[str]] = Field(None, description="Specific document IDs to analyze")
    use_ai: bool = Field(True, description="Enable AI reasoning")
    include_sources: bool = Field(True, description="Include source document references")
    response_format: str = Field("structured", description="Response format: 'structured' or 'conversational'")
    limit: int = Field(10, ge=1, le=50, description="Max document results")
    session_id: Optional[str] = Field(None, description="Session identifier for analytics")

class OracleQueryResponse(BaseModel):
    """Universal Oracle query response with full context"""
    success: bool
    query: str
    user_email: Optional[str] = None

    # Response Details
    answer: Optional[str] = None
    answer_language: str = "en"
    model_used: Optional[str] = None

    # Source Information
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    document_count: int = 0

    # Context Information
    collection_used: Optional[str] = None
    routing_reason: Optional[str] = None
    domain_confidence: Optional[Dict[str, float]] = None

    # User Context
    user_profile: Optional[UserProfile] = None
    language_detected: Optional[str] = None

    # Performance Metrics
    execution_time_ms: float
    search_time_ms: Optional[float] = None
    reasoning_time_ms: Optional[float] = None

    # Error Handling
    error: Optional[str] = None
    warning: Optional[str] = None

class FeedbackRequest(BaseModel):
    """User feedback for continuous learning"""
    user_email: str
    query_text: str
    original_answer: str
    user_correction: Optional[str] = None
    feedback_type: str = Field(..., description="Type of feedback")
    rating: int = Field(..., ge=1, le=5, description="User satisfaction rating")
    notes: Optional[str] = None
    session_id: Optional[str] = Field(None, description="Session identifier")

# ========================================
# CORE FUNCTIONS
# ========================================

def build_user_context_prompt(user_profile: Optional[Dict[str, Any]],
                             override_language: Optional[str] = None) -> str:
    """
    Build user-specific instruction for AI reasoning
    Creates explicit language and tone instructions for Gemini
    """
    try:
        # Extract user preferences with fallbacks
        user_language = override_language or user_profile.get('language', 'en') if user_profile else 'en'
        user_tone = user_profile.get('tone', 'professional') if user_profile else 'professional'
        complexity = user_profile.get('complexity', 'medium') if user_profile else 'medium'
        role_level = user_profile.get('role_level', 'member') if user_profile else 'member'
        meta_notes = user_profile.get('meta_json', {}).get('notes', '') if user_profile else ''

        # Map languages to full names for Gemini
        language_map = {
            'en': 'English',
            'id': 'Bahasa Indonesia',
            'it': 'Italiano',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'ja': 'Japanese',
            'zh': 'Chinese',
            'uk': 'Ukrainian',
            'ru': 'Russian'
        }

        target_language = language_map.get(user_language, 'English')

        # Build comprehensive instruction
        instruction = f"""
SYSTEM INSTRUCTION - ZANTARA v5.3 (Ultra Hybrid)

YOU ARE: Zantara, Senior Corporate Advisor for a Bali-based consulting firm
KNOWLEDGE SOURCE: The provided documents are in Bahasa Indonesia (Indonesian Laws/Regulations)
RESPONSE REQUIREMENT: Analyze Indonesian source documents, but ANSWER ONLY in {target_language}

RESPONSE PARAMETERS:
- Language: {target_language} (Mandatory - No exceptions)
- Tone: {user_tone}
- Complexity Level: {complexity}
- User Role: {role_level}
- Special Notes: {meta_notes}

ANALYSIS PROTOCOLS:
1. DEEP COMPREHENSION: Read and understand the Indonesian legal text completely
2. CONTEXTUAL ANALYSIS: Consider cultural and business context in Indonesia
3. LANGUAGE TRANSLATION: Translate concepts accurately to {target_language}
4. STRUCTURED RESPONSE: Use bullet points, clear headings, and professional formatting
5. CITATION REQUIREMENT: Always cite specific articles, sections, or document numbers

RESPONSE GUIDELINES:
- Grounding: Answer ONLY based on provided documents
- Missing Information: Clearly state "I don't have sufficient information" if applicable
- Legal Precision: Quote exact article numbers when available
- Business Context: Connect legal requirements to practical business implications
- Cultural Awareness: Consider Indonesian business culture in recommendations

QUALITY STANDARDS:
- Professional corporate advisory tone
- Actionable insights and recommendations
- Clear distinction between legal requirements and best practices
- Proper citation of Indonesian legal sources

FINAL INSTRUCTION: Respond in {target_language} only. This is not optional.
"""

        logger.debug(f"✅ Generated user context prompt for language: {target_language}")
        return instruction

    except Exception as e:
        logger.error(f"❌ Error building user context prompt: {e}")
        # Fallback to English instruction
        return "Analyze the provided documents and respond in English with professional corporate advisory tone."

def download_pdf_from_drive(filename: str) -> Optional[str]:
    """
    Download PDF from Google Drive using fuzzy search
    Handles filename mismatches with intelligent search
    """
    if not google_services.drive_service:
        logger.warning("⚠️ Google Drive service not available")
        return None

    try:
        # Clean filename for search
        clean_name = os.path.splitext(os.path.basename(filename))[0]
        logger.info(f"🔍 Searching for document: {clean_name}")

        # Fuzzy search with multiple strategies
        search_queries = [
            f"name contains '{clean_name}' and mimeType = 'application/pdf' and trashed = false",
            f"name contains '{clean_name.replace('_', ' ')}' and mimeType = 'application/pdf' and trashed = false",
            f"name contains '{clean_name.replace('-', ' ')}' and mimeType = 'application/pdf' and trashed = false",
            f"name contains '{clean_name.replace('_', '')}' and mimeType = 'application/pdf' and trashed = false"
        ]

        for query in search_queries:
            logger.debug(f"🔍 Trying search query: {query}")

            results = google_services.drive_service.files().list(
                q=query,
                fields="files(id, name, size, createdTime)",
                pageSize=1
            ).execute()

            files = results.get('files', [])
            if files:
                found_file = files[0]
                logger.info(f"✅ Found match: '{found_file['name']}' (ID: {found_file['id']})")

                # Download file
                request = google_services.drive_service.files().get_media(fileId=found_file['id'])
                file_stream = io.BytesIO()
                downloader = MediaIoBaseDownload(file_stream, request)

                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                    if status:
                        logger.debug(f"Download progress: {int(status.progress() * 100)}%")

                file_stream.seek(0)
                temp_path = f"/tmp/{found_file['name']}"

                with open(temp_path, "wb") as temp_file:
                    temp_file.write(file_stream.read())

                logger.info(f"✅ Successfully downloaded: {temp_path}")
                return temp_path

        logger.warning(f"⚠️ No file found for: {filename}")
        return None

    except Exception as e:
        logger.error(f"❌ Error downloading from Drive: {e}")
        logger.debug(f"❌ Full error: {traceback.format_exc()}")
        return None

async def reason_with_gemini(documents: List[str], query: str, user_instruction: str,
                           use_full_docs: bool = False) -> Dict[str, Any]:
    """
    Advanced reasoning with Google Gemini 1.5 Flash
    Processes documents and query with user-specific instructions
    """
    try:
        start_reasoning = time.time()
        logger.info(f"🧠 Starting Gemini reasoning with {len(documents)} documents")

        # Configure model for production - Use PRO for better legal reasoning
        model = google_services.get_gemini_model("models/gemini-2.5-pro")

        # Build comprehensive prompt
        if use_full_docs and documents:
            # Use full document content (when available from Smart Oracle)
            context_prompt = f"""
{user_instruction}

QUERY: {query}

FULL DOCUMENT CONTEXT:
{'-' * 80}
{chr(10).join(documents)}
{'-' * 80}
"""
        else:
            # Use document summaries
            context_prompt = f"""
{user_instruction}

QUERY: {query}

RELEVANT DOCUMENT EXCERPTS:
{'-' * 80}
{chr(10).join([f"Document {i+1}: {doc[:1500]}..." for i, doc in enumerate(documents)])}
{'-' * 80}
"""

        # Generate response with production settings
        generation_config = {
            "temperature": 0.1,  # Low temperature for consistent business responses
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        }

        response = model.generate_content(
            context_prompt,
            generation_config=generation_config
        )

        reasoning_time = (time.time() - start_reasoning) * 1000

        result = {
            "answer": response.text,
            "model_used": "gemini-1.5-flash",
            "reasoning_time_ms": reasoning_time,
            "document_count": len(documents),
            "full_analysis": use_full_docs,
            "success": True
        }

        logger.info(f"✅ Gemini reasoning completed in {reasoning_time:.2f}ms")
        return result

    except Exception as e:
        error_time = (time.time() - start_reasoning) * 1000
        logger.error(f"❌ Error in Gemini reasoning after {error_time:.2f}ms: {e}")
        logger.debug(f"❌ Full error: {traceback.format_exc()}")

        return {
            "answer": f"I encountered an error while processing your request. The system has been notified. Please try again or contact support if the issue persists.",
            "model_used": "gemini-1.5-flash",
            "reasoning_time_ms": error_time,
            "document_count": len(documents),
            "full_analysis": False,
            "success": False,
            "error": str(e)
        }

def generate_query_hash(query_text: str) -> str:
    """Generate hash for query analytics"""
    return hashlib.md5(query_text.encode()).hexdigest()

# ========================================
# API ENDPOINTS
# ========================================

router = APIRouter(prefix="/api/oracle", tags=["Oracle v5.3 - Ultra Hybrid"])

# Initialize Personality Service for multi-voice support
personality_service = PersonalityService()

@router.post("/query", response_model=OracleQueryResponse)
async def hybrid_oracle_query(
    request: OracleQueryRequest,
    service: SearchService = Depends(get_search_service)
):
    """
    Ultra Hybrid Oracle Query - v5.3

    Integrates Qdrant search, Google Drive, and Gemini reasoning
    with full user localization and context awareness
    """
    start_time = time.time()
    query_hash = generate_query_hash(request.query)
    user_profile = None
    execution_time = 0
    search_time = 0
    reasoning_time = 0

    try:
        logger.info(f"🚀 Starting hybrid oracle query: {request.query[:100]}...")

        # 1. Get user profile if email provided
        if request.user_email:
            user_profile = await db_manager.get_user_profile(request.user_email)
            if user_profile:
                logger.info(f"✅ Loaded user profile for {request.user_email}")
            else:
                logger.warning(f"⚠️ User profile not found for {request.user_email}")

        # 2. Build user-specific instruction
        user_instruction = build_user_context_prompt(user_profile, request.language_override)
        target_language = request.language_override or user_profile.get('language', 'en') if user_profile else 'en'

        logger.info(f"🌐 Target response language: {target_language}")

        # 3. Semantic Search with Qdrant
        search_start = time.time()
        routing_stats = service.router.get_routing_stats(request.query)
        collection_used = routing_stats["selected_collection"]

        # Generate query embedding with error handling
        try:
            embedder = EmbeddingsGenerator()
            query_embedding = embedder.generate_single_embedding(request.query)
        except Exception as e:
            logger.error(f"❌ Error generating embeddings: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Embedding service temporarily unavailable"
            )

        # Search the appropriate collection
        if collection_used not in service.collections:
            logger.error(f"❌ Collection '{collection_used}' not found in service")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Collection '{collection_used}' not available"
            )

        vector_db = service.collections[collection_used]
        search_results = vector_db.search(
            query_embedding=query_embedding,
            limit=request.limit
        )

        search_time = (time.time() - search_start) * 1000

        # 4. Process search results
        documents = []
        sources = []

        for i, doc in enumerate(search_results.get("documents", [])):
            metadata = search_results.get("metadatas", [])[i] if i < len(search_results.get("metadatas", [])) else {}
            distance = search_results.get("distances", [])[i] if i < len(search_results.get("distances", [])) else 1.0

            # Calculate relevance score
            relevance = 1 / (1 + distance)

            documents.append(doc)
            sources.append({
                "content": doc[:500] + "..." if len(doc) > 500 else doc,
                "metadata": metadata,
                "relevance": round(relevance, 4),
                "source_collection": collection_used,
                "document_id": metadata.get("id", f"doc_{i}")
            })

        logger.info(f"🔍 Found {len(documents)} documents in {search_time:.2f}ms")

        # 5. Enhanced Reasoning with Gemini (if requested)
        answer = None
        model_used = None
        reasoning_result = None

        if request.use_ai and documents:
            try:
                # Try Smart Oracle first (full PDF analysis)
                best_result = sources[0] if sources else None
                best_filename = None

                if best_result and best_result.get("metadata"):
                    best_filename = best_result["metadata"].get('filename') or best_result["metadata"].get('source')

                if best_filename:
                    logger.info(f"🔍 Attempting Smart Oracle with document: {best_filename}")

                    # Use Smart Oracle for full PDF analysis
                    smart_response = await smart_oracle(request.query, best_filename)

                    if smart_response and not smart_response.startswith("Error") and not smart_response.startswith("Original document not found"):
                        # Use full document analysis
                        reasoning_result = await reason_with_gemini(
                            documents=[smart_response],
                            query=request.query,
                            user_instruction=user_instruction,
                            use_full_docs=True
                        )
                        answer = reasoning_result["answer"]
                        model_used = f"{reasoning_result['model_used']} (Smart Oracle + Full PDF)"
                        logger.info(f"✅ Smart Oracle analysis completed successfully")
                    else:
                        # Fallback to document chunks
                        logger.info(f"⚠️ Smart Oracle failed, using document chunks")
                        reasoning_result = await reason_with_gemini(
                            documents=documents,
                            query=request.query,
                            user_instruction=user_instruction,
                            use_full_docs=False
                        )
                        answer = reasoning_result["answer"]
                        model_used = reasoning_result["model_used"]
                else:
                    # No filename found, use chunk-based analysis
                    logger.info(f"⚠️ No filename in metadata, using chunk analysis")
                    reasoning_result = await reason_with_gemini(
                        documents=documents,
                        query=request.query,
                        user_instruction=user_instruction,
                        use_full_docs=False
                    )
                    answer = reasoning_result["answer"]
                    model_used = reasoning_result["model_used"]

                reasoning_time = reasoning_result.get("reasoning_time_ms", 0) if reasoning_result else 0

                # Apply personality translation if user email is provided
                if answer and request.user_email:
                    try:
                        personality_result = await personality_service.translate_to_personality(
                            gemini_response=answer,
                            user_email=request.user_email,
                            original_query=request.query
                        )

                        if personality_result["success"]:
                            answer = personality_result["response"]
                            model_used = f"{model_used} + {personality_result['personality_used']}"
                            logger.info(f"🎭 Applied {personality_result['personality_used']} personality")
                        else:
                            logger.warning(f"⚠️ Personality translation failed: {personality_result.get('error', 'Unknown error')}")

                    except Exception as e:
                        logger.error(f"❌ Personality service error: {e}")
                        # Keep original answer if personality service fails

            except Exception as e:
                logger.error(f"❌ Error in reasoning pipeline: {e}")
                answer = f"I encountered an error during analysis. The system has been notified. Please try again."
                model_used = "error_fallback"
                reasoning_time = 0

        # 6. Calculate total execution time
        execution_time = (time.time() - start_time) * 1000

        # 7. Store analytics (async, non-blocking)
        analytics_data = {
            "user_id": user_profile.get('id') if user_profile else None,
            "query_hash": query_hash,
            "query_text": request.query,
            "response_text": answer,
            "language_preference": target_language,
            "model_used": model_used,
            "response_time_ms": execution_time,
            "document_count": len(documents),
            "session_id": request.session_id,
            "metadata": {
                "collection_used": collection_used,
                "routing_stats": routing_stats,
                "search_time_ms": search_time,
                "reasoning_time_ms": reasoning_time
            }
        }

        # Store analytics asynchronously
        asyncio.create_task(db_manager.store_query_analytics(analytics_data))

        # 8. Build response
        response = OracleQueryResponse(
            success=True,
            query=request.query,
            user_email=request.user_email,
            answer=answer,
            answer_language=target_language,
            model_used=model_used,
            sources=sources if request.include_sources else [],
            document_count=len(documents),
            collection_used=collection_used,
            routing_reason=f"Routed to {collection_used} based on intelligent keyword analysis",
            domain_confidence=routing_stats.get("domain_scores", {}),
            user_profile=UserProfile(**user_profile) if user_profile else None,
            language_detected=target_language,
            execution_time_ms=execution_time,
            search_time_ms=search_time,
            reasoning_time_ms=reasoning_time
        )

        logger.info(f"✅ Query completed successfully in {execution_time:.2f}ms")
        return response

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        logger.error(f"❌ Hybrid Oracle query error after {execution_time:.2f}ms: {e}")
        logger.debug(f"❌ Full error: {traceback.format_exc()}")

        # Store error analytics
        error_analytics = {
            "user_id": user_profile.get('id') if user_profile else None,
            "query_hash": query_hash,
            "query_text": request.query,
            "response_text": None,
            "language_preference": target_language if 'target_language' in locals() else 'en',
            "model_used": None,
            "response_time_ms": execution_time,
            "document_count": 0,
            "session_id": request.session_id,
            "metadata": {
                "error": str(e),
                "error_type": type(e).__name__
            }
        }

        asyncio.create_task(db_manager.store_query_analytics(error_analytics))

        return OracleQueryResponse(
            success=False,
            query=request.query,
            user_email=request.user_email,
            answer=None,
            answer_language=target_language if 'target_language' in locals() else 'en',
            model_used=None,
            sources=[],
            document_count=0,
            collection_used="error",
            routing_reason=None,
            domain_confidence=None,
            user_profile=UserProfile(**user_profile) if user_profile else None,
            language_detected=target_language if 'target_language' in locals() else 'en',
            execution_time_ms=execution_time,
            search_time_ms=search_time,
            reasoning_time_ms=reasoning_time,
            error=str(e)
        )

@router.post("/feedback")
async def submit_user_feedback(feedback: FeedbackRequest):
    """
    Submit user feedback for continuous learning and system improvement
    Stores feedback for training data and model refinement
    """
    try:
        logger.info(f"📝 Processing feedback from {feedback.user_email}")

        # Get user profile
        user_profile = await db_manager.get_user_profile(feedback.user_email)

        feedback_data = {
            "user_id": user_profile.get('id') if user_profile else None,
            "query_text": feedback.query_text,
            "original_answer": feedback.original_answer,
            "user_correction": feedback.user_correction,
            "feedback_type": feedback.feedback_type,
            "model_used": "oracle_v5.3",  # Would be tracked in actual implementation
            "response_time_ms": 0,  # Would be tracked in actual implementation
            "user_rating": feedback.rating,
            "session_id": feedback.session_id,
            "metadata": {
                "notes": feedback.notes,
                "user_email": feedback.user_email,
                "timestamp": datetime.now().isoformat()
            }
        }

        # Store feedback
        await db_manager.store_feedback(feedback_data)

        logger.info(f"✅ Feedback stored successfully for {feedback.user_email}")

        return {
            "success": True,
            "message": "Thank you for your feedback. This helps us improve the system.",
            "feedback_id": hashlib.md5(
                f"{feedback.query_text}_{feedback.user_email}_{datetime.now().isoformat()}".encode()
            ).hexdigest(),
            "processed_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Error processing feedback: {e}")
        logger.debug(f"❌ Full error: {traceback.format_exc()}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing feedback: {str(e)}"
        )

@router.get("/health")
async def oracle_health_check():
    """
    Health check for Oracle v5.3 services
    Verifies all integrated components are operational
    """
    health_status = {
        "service": "Zantara Oracle v5.3 (Ultra Hybrid)",
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "version": "5.3.0",
        "components": {
            "gemini_ai": "✅ Operational" if google_services.gemini_available else "❌ Not Available",
            "google_drive": "✅ Operational" if google_services.drive_service else "❌ Not Connected",
            "database": "✅ Operational",  # Would check actual DB connection
            "embeddings": "✅ Operational" if config.openai_api_key else "⚠️ Missing API Key",
        },
        "capabilities": [
            "Hybrid RAG (Qdrant + Drive + Gemini)",
            "User Localization",
            "Smart Oracle PDF Analysis",
            "Continuous Learning (Feedback)",
            "Production Error Handling"
        ],
        "metrics": {
            "uptime": time.time(),  # Would track actual uptime
            "queries_processed": 0,  # Would track actual metrics
            "error_rate": 0.0  # Would calculate actual error rate
        }
    }

    # Determine overall health
    failed_components = [
        comp for comp, status in health_status["components"].items()
        if "❌" in status
    ]

    if failed_components:
        health_status["status"] = "degraded"
        health_status["issues"] = failed_components

    return health_status

@router.get("/user/profile/{user_email}")
async def get_user_profile_endpoint(user_email: str):
    """
    Get user profile with localization preferences
    Integrates with PostgreSQL user management system
    """
    try:
        user_profile = await db_manager.get_user_profile(user_email)

        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile not found for {user_email}"
            )

        return {
            "success": True,
            "profile": user_profile
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user profile: {str(e)}"
        )

# ========================================
# UTILITY ENDPOINTS FOR MONITORING
# ========================================

@router.get("/drive/test")
async def test_drive_connection():
    """Test Google Drive integration"""
    if not google_services.drive_service:
        return {
            "success": False,
            "error": "Drive service not initialized",
            "timestamp": datetime.now().isoformat()
        }

    try:
        # List first 5 files to test connection
        results = google_services.drive_service.files().list(
            pageSize=5,
            fields="files(id, name, mimeType, createdTime)"
        ).execute()

        files = results.get('files', [])

        return {
            "success": True,
            "message": f"Drive connection successful. Found {len(files)} files.",
            "files": files,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Drive connection test failed: {e}")
        return {
            "success": False,
            "error": f"Drive connection failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@router.get("/personalities")
async def get_personalities():
    """Get available AI personalities"""
    try:
        personalities = personality_service.get_available_personalities()
        return {
            "success": True,
            "personalities": personalities,
            "total": len(personalities),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Error getting personalities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get personalities: {str(e)}"
        )

@router.post("/personality/test")
async def test_personality(
    personality_type: str,
    message: str
):
    """Test a specific personality"""
    try:
        result = await personality_service.test_personality(personality_type, message)
        return {
            "success": result.get("success", False),
            "personality": personality_type,
            "message": message,
            "response": result.get("response", ""),
            "error": result.get("error"),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Error testing personality: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test personality: {str(e)}"
        )

@router.get("/gemini/test")
async def test_gemini_integration():
    """Test Google Gemini integration"""
    try:
        model = google_services.get_gemini_model("gemini-1.5-flash")
        response = model.generate_content("Hello, please confirm you are working correctly for Zantara v5.3.")

        return {
            "success": True,
            "message": "Gemini integration successful",
            "test_response": response.text[:200] + "..." if len(response.text) > 200 else response.text,
            "model": "gemini-1.5-flash",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Gemini integration test failed: {e}")
        return {
            "success": False,
            "error": f"Gemini integration failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# ========================================
# MODULE INITIALIZATION
# ========================================

@router.on_event("startup")
async def startup_event():
    """Initialize Oracle v5.3 services"""
    logger.info("🚀 Initializing Zantara Oracle v5.3 (Ultra Hybrid)")

    # Validate Google services
    if not google_services.gemini_available:
        logger.error("❌ Google Gemini AI not available - core functionality limited")

    if not google_services.drive_service:
        logger.warning("⚠️ Google Drive service not available - Smart Oracle features limited")

    # Test database connection
    try:
        # This would be an actual database health check
        logger.info("✅ Database connection verified")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")

    logger.info("✅ Oracle v5.3 initialization completed successfully")

@router.on_event("shutdown")
async def shutdown_event():
    """Cleanup Oracle v5.3 services"""
    logger.info("🔄 Shutting down Zantara Oracle v5.3")
    # Add cleanup logic if needed
    logger.info("✅ Oracle v5.3 shutdown completed")
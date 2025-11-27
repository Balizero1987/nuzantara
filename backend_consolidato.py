#!/usr/bin/env python3
"""
ZANTARA Backend Consolidato - Versione Monolitica Semplificata

ATTENZIONE: Questo è un file dimostrativo che consolida le funzionalità essenziali
del backend ZANTARA. NON contiene chiavi API, credenziali o configurazioni sensibili.

Per avviare: python backend_consolidato.py
"""

import os
import json
import logging
import asyncio
import httpx
from datetime import datetime
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Configurazione Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zantara.consolidated")

# === MODELLI DATI ===
@dataclass
class UserProfile:
    id: str
    email: str
    name: str
    role: str

@dataclass
class ConversationMessage:
    role: str
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    query: str
    user_email: Optional[str] = None
    conversation_history: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, str]

# === CONFIGURAZIONE ===
class Config:
    """Configurazione centralizzata"""
    ZANTARA_VERSION = "5.3.0-consolidated"
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://zantara.balizero.com",
        "https://nuzantara-webapp.fly.dev"
    ]

    # Database (placeholder)
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/zantara")

    # API Keys (da environment variables)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

    # Internal services
    TS_BACKEND_URL = os.getenv("TS_BACKEND_URL", "http://localhost:8080")
    INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "dev-key")

# === SERVIZI CORE ===

class AIService:
    """Servizio AI unificato per LLM interactions"""

    def __init__(self, config: Config):
        self.config = config
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Inizializza il client LLM basato sulle API keys disponibili"""
        if self.config.OPENAI_API_KEY:
            import openai
            self.client = openai.AsyncOpenAI(api_key=self.config.OPENAI_API_KEY)
            self.provider = "openai"
        elif self.config.ANTHROPIC_API_KEY:
            import anthropic
            self.client = anthropic.AsyncAnthropic(api_key=self.config.ANTHROPIC_API_KEY)
            self.provider = "anthropic"
        else:
            logger.warning("Nessuna API key configurata - usando mock responses")
            self.client = None
            self.provider = "mock"

    async def generate_response(self, prompt: str, stream: bool = False) -> str:
        """Genera risposta usando il LLM configurato"""
        if self.provider == "mock":
            return f"Mock response for: {prompt[:100]}..."

        # Implementazione semplificata - in produzione usa streaming completo
        try:
            if self.provider == "openai":
                response = await self.client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=0.7
                )
                return response.choices[0].message.content
            elif self.provider == "anthropic":
                response = await self.client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=1000,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
        except Exception as e:
            logger.error(f"AI service error: {e}")
            return f"AI service temporarily unavailable: {str(e)}"

class SearchService:
    """Servizio di ricerca semplificato"""

    def __init__(self, config: Config):
        self.config = config
        self.collections = {
            "bali_zero_pricing": {"docs": 29, "description": "Official pricing"},
            "visa_oracle": {"docs": 1612, "description": "Visa information"},
            "tax_genius": {"docs": 895, "description": "Tax regulations"},
            "legal_architect": {"docs": 5041, "description": "Indonesian laws"}
        }

    async def search(self, query: str, collection: Optional[str] = None) -> Dict[str, Any]:
        """Esegue ricerca nelle collection disponibili"""
        # Simulazione ricerca - in produzione connettersi a Qdrant/Vector DB
        results = []
        for col_name, col_info in self.collections.items():
            if collection and col_name != collection:
                continue

            # Simula risultati trovati
            if any(keyword.lower() in query.lower() for keyword in ["price", "cost", "visa", "tax"]):
                results.append({
                    "collection": col_name,
                    "content": f"Sample result from {col_name} for query: {query}",
                    "score": 0.85,
                    "metadata": {"source": col_name}
                })

        return {
            "query": query,
            "results": results[:5],  # Limita a 5 risultati
            "total_found": len(results)
        }

class MemoryService:
    """Servizio memoria semplificato"""

    def __init__(self, config: Config):
        self.config = config
        self.memories = {}  # In produzione usa PostgreSQL

    async def add_memory(self, user_id: str, content: str, category: str = "general") -> bool:
        """Aggiunge memoria per utente"""
        try:
            if user_id not in self.memories:
                self.memories[user_id] = []

            memory = {
                "content": content,
                "category": category,
                "timestamp": datetime.now().isoformat()
            }

            self.memories[user_id].append(memory)

            # Limita a 10 memorie per utente
            if len(self.memories[user_id]) > 10:
                self.memories[user_id] = self.memories[user_id][-10:]

            return True
        except Exception as e:
            logger.error(f"Memory add error: {e}")
            return False

    async def get_memories(self, user_id: str) -> List[Dict]:
        """Recupera memorie utente"""
        return self.memories.get(user_id, [])

class CRMService:
    """Servizio CRM semplificato"""

    def __init__(self, config: Config):
        self.config = config
        self.clients = {}  # In produzione usa database

    async def extract_client_info(self, conversation: List[ConversationMessage]) -> Dict[str, Any]:
        """Estrae informazioni client dalla conversazione"""
        # Implementazione semplificata di NLP per estrarre dati client
        extracted = {
            "name": None,
            "email": None,
            "phone": None,
            "interests": [],
            "stage": "initial"
        }

        # Pattern matching semplificato
        for msg in conversation:
            text = msg.content.lower()
            if "my name is" in text or "i'm" in text:
                # Estrazione nome semplificata
                words = text.split()
                for i, word in enumerate(words):
                    if word in ["name", "i'm", "im"] and i + 1 < len(words):
                        extracted["name"] = words[i + 1].title()
                        break

        return extracted

    async def update_client(self, email: str, data: Dict[str, Any]) -> bool:
        """Aggiorna dati client"""
        try:
            if email not in self.clients:
                self.clients[email] = {}

            self.clients[email].update(data)
            logger.info(f"Updated client {email}: {data}")
            return True
        except Exception as e:
            logger.error(f"CRM update error: {e}")
            return False

# === SERVIZI SPECIALIZZATI ===

class BaliZeroService:
    """Servizio specializzato Bali Zero"""

    def __init__(self, ai_service: AIService, search_service: SearchService):
        self.ai = ai_service
        self.search = search_service

    async def get_advisory(self, query: str, user_context: Dict[str, Any]) -> str:
        """Fornisce consulenza Bali Zero"""
        # Ricerca nelle collection pertinenti
        search_results = await self.search.search(query)

        # Costruisci prompt contestualizzato
        prompt = f"""
        Query: {query}
        User Context: {user_context}
        Search Results: {search_results['results'][:3]}

        Fornisci una risposta professionale come consulente Bali Zero, focalizzandoti su:
        - Servizi per investimenti stranieri in Indonesia
        - Registrazioni aziendali (PT PMA, NIB)
        - Consigli pratici e procedure

        Sii conciso ma completo.
        """

        return await self.ai.generate_response(prompt)

class NotificationService:
    """Servizio notifiche semplificato"""

    def __init__(self, config: Config):
        self.config = config
        self.notifications = []  # Mock storage

    async def send_notification(
        self,
        user_email: str,
        message: str,
        priority: str = "normal",
        channels: List[str] = None
    ) -> bool:
        """Invia notifica multi-canale"""
        try:
            notification = {
                "to": user_email,
                "message": message,
                "priority": priority,
                "channels": channels or ["email"],
                "timestamp": datetime.now().isoformat(),
                "status": "sent"
            }

            self.notifications.append(notification)
            logger.info(f"Notification sent to {user_email}: {message}")
            return True
        except Exception as e:
            logger.error(f"Notification error: {e}")
            return False

class ComplianceService:
    """Servizio compliance automatizzato"""

    def __init__(self, ai_service: AIService, notification_service: NotificationService):
        self.ai = ai_service
        self.notifications = notification_service
        self.deadlines = {}  # Mock storage

    async def check_compliance_deadlines(self, user_email: str) -> List[Dict]:
        """Controlla scadenze compliance"""
        # Implementazione semplificata
        upcoming_deadlines = [
            {
                "type": "visa_expiry",
                "description": "KITAS renewal due",
                "days_remaining": 45,
                "required_documents": ["passport", "current_kitas", "sponsor_letter"]
            }
        ]

        # Invia notifiche per scadenze imminenti
        for deadline in upcoming_deadlines:
            if deadline["days_remaining"] <= 60:
                await self.notifications.send_notification(
                    user_email=user_email,
                    message=f"Compliance Alert: {deadline['description']} in {deadline['days_remaining']} days",
                    priority="high"
                )

        return upcoming_deadlines

# === AUTHENTICATION ===

class AuthService:
    """Servizio autenticazione semplificato"""

    def __init__(self, config: Config):
        self.config = config
        self.valid_tokens = {
            "dev-token-bypass": UserProfile("dev", "dev@balizero.com", "Dev User", "admin")
        }

    async def validate_token(self, token: str) -> Optional[UserProfile]:
        """Valida token JWT o fallback"""
        if token in self.valid_tokens:
            return self.valid_tokens[token]

        # In produzione implementare validazione JWT completa
        try:
            # Mock validation - in produzione usare PyJWT
            if token.startswith("eyJ"):  # Header JWT
                # Token JWT placeholder
                return UserProfile("user123", "user@example.com", "Test User", "member")
        except Exception as e:
            logger.error(f"Token validation error: {e}")

        return None

# === MAIN APPLICATION ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Initializing ZANTARA Consolidated Backend...")

    config = Config()

    # Inizializza servizi
    app.state.config = config
    app.state.ai_service = AIService(config)
    app.state.search_service = SearchService(config)
    app.state.memory_service = MemoryService(config)
    app.state.crm_service = CRMService(config)
    app.state.auth_service = AuthService(config)
    app.state.bali_zero_service = BaliZeroService(
        app.state.ai_service,
        app.state.search_service
    )
    app.state.notification_service = NotificationService(config)
    app.state.compliance_service = ComplianceService(
        app.state.ai_service,
        app.state.notification_service
    )

    logger.info("✅ All services initialized successfully")

    yield

    # Shutdown
    logger.info("🔄 Shutting down services...")

# Create FastAPI app
app = FastAPI(
    title="ZANTARA Backend Consolidato",
    description="Backend monolitico semplificato per ZANTARA",
    version=Config.ZANTARA_VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ENDPOINTS PRINCIPALI ===

@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {"message": "ZANTARA Consolidated Backend Ready", "version": Config.ZANTARA_VERSION}

@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check(request: Request):
    """Health check endpoint"""
    services_status = {}

    try:
        # Check AI service
        ai_service = request.app.state.ai_service
        services_status["ai_service"] = "online" if ai_service.client else "offline"

        # Check other services
        services_status.update({
            "search_service": "online",
            "memory_service": "online",
            "crm_service": "online",
            "auth_service": "online"
        })

        overall_status = "healthy" if all(status == "online" for status in services_status.values()) else "degraded"

    except Exception as e:
        logger.error(f"Health check error: {e}")
        overall_status = "unhealthy"

    return HealthResponse(
        status=overall_status,
        version=Config.ZANTARA_VERSION,
        services=services_status
    )

@app.get("/api/csrf-token", tags=["auth"])
async def get_csrf_token():
    """Generate CSRF token for frontend"""
    import secrets
    import hashlib

    csrf_token = secrets.token_hex(32)
    session_id = f"session_{int(datetime.now().timestamp() * 1000)}_{secrets.token_hex(16)}"

    return {
        "csrfToken": csrf_token,
        "sessionId": session_id
    }

@app.post("/api/chat", tags=["chat"])
async def chat_endpoint(
    request: Request,
    chat_req: ChatRequest,
    authorization: Optional[str] = Header(None)
):
    """Main chat endpoint - non-streaming version"""

    # Auth validation
    auth_service: AuthService = request.app.state.auth_service
    token = authorization.split(" ")[1] if authorization and authorization.startswith("Bearer ") else None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user_profile = await auth_service.validate_token(token)
    if not user_profile:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        # Process chat request
        bali_zero_service: BaliZeroService = request.app.state.bali_zero_service

        user_context = {
            "email": user_profile.email,
            "name": user_profile.name,
            "role": user_profile.role
        }

        # Generate response
        response = await bali_zero_service.get_advisory(
            query=chat_req.query,
            user_context=user_context
        )

        # Store in memory
        memory_service: MemoryService = request.app.state.memory_service
        await memory_service.add_memory(
            user_id=user_profile.id,
            content=f"Q: {chat_req.query}\nA: {response[:200]}...",
            category="conversation"
        )

        # Process CRM in background
        background_tasks = BackgroundTasks()
        crm_service: CRMService = request.app.state.crm_service

        # Mock conversation for CRM processing
        conversation = [
            ConversationMessage(role="user", content=chat_req.query),
            ConversationMessage(role="assistant", content=response)
        ]

        client_info = await crm_service.extract_client_info(conversation)
        if client_info.get("email"):
            background_tasks.add_task(
                crm_service.update_client,
                email=client_info["email"],
                data={"last_conversation": datetime.now().isoformat()}
            )

        return {
            "response": response,
            "user": {"name": user_profile.name, "role": user_profile.role},
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "service": "bali_zero_consolidated"
            }
        }

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bali-zero/chat-stream", tags=["chat"])
async def chat_stream_endpoint(
    request: Request,
    query: str,
    authorization: Optional[str] = Header(None),
    user_email: Optional[str] = None,
    conversation_history: Optional[str] = None
):
    """Streaming chat endpoint - versione semplificata"""

    # Auth validation
    auth_service: AuthService = request.app.state.auth_service
    token = authorization.split(" ")[1] if authorization and authorization.startswith("Bearer ") else None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user_profile = await auth_service.validate_token(token)
    if not user_profile:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    async def event_stream():
        """Genera streaming response"""
        # Connection metadata
        yield f"data: {json.dumps({'type': 'metadata', 'data': {'status': 'connected'}}, ensure_ascii=False)}\n\n"

        try:
            # Get response
            bali_zero_service: BaliZeroService = request.app.state.bali_zero_service
            user_context = {
                "email": user_email or user_profile.email,
                "name": user_profile.name,
                "role": user_profile.role
            }

            response = await bali_zero_service.get_advisory(query, user_context)

            # Stream response token by token
            words = response.split()
            for word in words:
                yield f"data: {json.dumps({'type': 'token', 'data': word + ' '}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.05)  # Simulate streaming delay

            # Done
            yield f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'data': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# === API ENDPOINTS SPECIALIZZATI ===

@app.get("/api/search", tags=["search"])
async def search_endpoint(
    request: Request,
    query: str,
    collection: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """Search endpoint"""

    # Auth check (simplified)
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    search_service: SearchService = request.app.state.search_service
    results = await search_service.search(query, collection)

    return {
        "query": query,
        "collection": collection,
        "results": results["results"],
        "total_found": results["total_found"],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/memory", tags=["memory"])
async def get_memory_endpoint(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Get user memories"""

    auth_service: AuthService = request.app.state.auth_service
    token = authorization.split(" ")[1] if authorization else None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user_profile = await auth_service.validate_token(token)
    if not user_profile:
        raise HTTPException(status_code=401, detail="Invalid token")

    memory_service: MemoryService = request.app.state.memory_service
    memories = await memory_service.get_memories(user_profile.id)

    return {
        "user_id": user_profile.id,
        "memories": memories,
        "total": len(memories)
    }

@app.post("/api/memory", tags=["memory"])
async def add_memory_endpoint(
    request: Request,
    memory_data: dict,
    authorization: Optional[str] = Header(None)
):
    """Add memory for user"""

    auth_service: AuthService = request.app.state.auth_service
    token = authorization.split(" ")[1] if authorization else None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user_profile = await auth_service.validate_token(token)
    if not user_profile:
        raise HTTPException(status_code=401, detail="Invalid token")

    memory_service: MemoryService = request.app.state.memory_service
    success = await memory_service.add_memory(
        user_id=user_profile.id,
        content=memory_data.get("content", ""),
        category=memory_data.get("category", "general")
    )

    return {
        "success": success,
        "message": "Memory added successfully" if success else "Failed to add memory"
    }

@app.get("/api/crm/clients", tags=["crm"])
async def get_clients_endpoint(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Get CRM clients list"""

    auth_service: AuthService = request.app.state.auth_service
    token = authorization.split(" ")[1] if authorization else None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user_profile = await auth_service.validate_token(token)
    if not user_profile or user_profile.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    crm_service: CRMService = request.app.state.crm_service

    return {
        "clients": list(crm_service.clients.values()),
        "total": len(crm_service.clients)
    }

@app.get("/api/compliance/check", tags=["compliance"])
async def compliance_check_endpoint(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Check compliance deadlines"""

    auth_service: AuthService = request.app.state.auth_service
    token = authorization.split(" ")[1] if authorization else None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user_profile = await auth_service.validate_token(token)
    if not user_profile:
        raise HTTPException(status_code=401, detail="Invalid token")

    compliance_service: ComplianceService = request.app.state.compliance_service
    deadlines = await compliance_service.check_compliance_deadlines(user_profile.email)

    return {
        "user_email": user_profile.email,
        "deadlines": deadlines,
        "checked_at": datetime.now().isoformat()
    }

@app.get("/api/notifications", tags=["notifications"])
async def get_notifications_endpoint(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Get user notifications"""

    auth_service: AuthService = request.app.state.auth_service
    token = authorization.split(" ")[1] if authorization else None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user_profile = await auth_service.validate_token(token)
    if not user_profile:
        raise HTTPException(status_code=401, detail="Invalid token")

    notification_service: NotificationService = request.app.state.notification_service
    user_notifications = [
        n for n in notification_service.notifications
        if n.get("to") == user_profile.email
    ]

    return {
        "notifications": user_notifications,
        "total": len(user_notifications),
        "unread": len([n for n in user_notifications if n.get("read") != True])
    }

@app.get("/api/dashboard/stats", tags=["dashboard"])
async def dashboard_stats_endpoint(request: Request):
    """Get dashboard statistics"""

    # Mock dashboard data
    stats = {
        "active_agents": 3,
        "system_health": "99.9%",
        "uptime_status": "ONLINE",
        "knowledge_base": {
            "vectors": "1.2M",
            "status": "Indexing..."
        },
        "services": {
            "ai_service": "online",
            "search_service": "online",
            "crm_service": "online",
            "memory_service": "online",
            "compliance_service": "online"
        },
        "metrics": {
            "total_conversations": 1247,
            "total_clients": 89,
            "compliance_alerts": 3,
            "memory_entries": 2156
        }
    }

    return stats

# === MAIN EXECUTION ===

if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting ZANTARA Consolidated Backend...")
    print(f"📍 Version: {Config.ZANTARA_VERSION}")
    print("⚠️  This is a simplified monolithic version for development/testing")
    print("🔧 To run in production, use the full modular backend architecture")
    print()

    uvicorn.run(
        "backend_consolidado:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

"""
=== NOTE DI INSTALLAZIONE ===

Per eseguire questo backend consolidato:

1. Installa le dipendenze:
   pip install fastapi uvicorn httpx pydantic python-multipart

2. Installa le dipendenze LLM (scegli una):
   # Per OpenAI:
   pip install openai

   # Per Anthropic:
   pip install anthropic

3. Configura le environment variables:
   export OPENAI_API_KEY="your-key-here"
   # oppure
   export ANTHROPIC_API_KEY="your-key-here"

4. Avvia il server:
   python backend_consolidado.py

5. Testa gli endpoint:
   curl http://localhost:8000/health
   curl -H "Authorization: Bearer dev-token-bypass" http://localhost:8000/api/chat -X POST -H "Content-Type: application/json" -d '{"query": "test"}'

=== LIMITAZIONI ===

Questo backend consolidato è semplificato e ha le seguenti limitazioni:
- Database in-memory (non persistente)
- Mock JWT validation
- Streaming chat semplificato
- Nessuna integrazione con servizi esterni reali
- Logging base senza monitoring avanzato
- Nessuna configurazione production-ready

Per ambiente di produzione, usare l'architettura modulare completa.
"""
# 🌸 NUZANTARA Backend Source Code

**Version**: 5.2.0  
**Architecture**: TypeScript + Express + Microservices  
**Purpose**: Production-ready backend system for NUZANTARA AI platform

---

## 🏗️ **DIRECTORY STRUCTURE**

### 📁 **Core System**
```
├── 📄 index.ts              # Main entry point - Express server with middleware
├── 📁 core/                 # Core system functionality
│   ├── handler-registry.ts  # Auto-registration system for handlers
│   ├── load-all-handlers.ts # Handler loading utilities
│   └── zantara-orchestrator.ts # Orchestration logic
```

### 🚦 **Routing & Gateway**
```
├── 📁 routing/              # Router configuration
│   ├── router.ts           # Main API router (130+ endpoints)
│   └── router-v2.ts        # Next-generation router
├── 📁 app-gateway/          # Application gateway layer
│   ├── app-events.ts       # Event-driven architecture
│   ├── capability-map.ts   # System capabilities mapping
│   └── session-store.ts    # Session management
```

### 🔧 **Business Logic**
```
├── 📁 handlers/             # API endpoint handlers (96+ handlers)
│   ├── ai-services/         # AI provider integrations
│   ├── bali-zero/          # Core business services
│   ├── google-workspace/   # Google integration
│   ├── memory/             # Dual-layer memory system
│   ├── rag/                # RAG system proxy
│   └── ...                 # Additional handlers
├── 📁 services/             # Business services
│   ├── firebase.ts         # Firestore integration
│   ├── logger.ts           # Winston logging system
│   ├── memory-*.ts         # Memory management
│   └── ...                 # Core services
├── 📁 agents/               # AI agent definitions
│   ├── bali-zero-services.ts # Business services agent
│   ├── eye-kbli.ts         # KBLI classification agent
│   ├── legal-architect.ts  # Legal advisory agent
│   └── ...                 # Additional agents
```

### 🔐 **Infrastructure**
```
├── 📁 middleware/           # Express middleware
│   ├── auth.ts             # Authentication & authorization
│   ├── rate-limit.ts       # Rate limiting protection
│   ├── reality-check.ts    # Anti-hallucination system
│   ├── monitoring.ts       # Performance monitoring
│   └── ...                 # Security & monitoring
├── 📁 config/               # Configuration management
│   ├── index.ts            # Main configuration
│   ├── flags.ts            # Feature flags system
│   └── prompts/            # AI prompt templates
```

### 🎨 **User Interfaces**
```
├── 📁 interfaces/           # HTML/UI interfaces
│   ├── devai-interface.html           # DevAI code assistant
│   ├── zantara-conversation-demo.html # Chat interface demo
│   ├── zantara-intelligence-v6.html   # Intelligence dashboard
│   └── zantara-production.html        # Production interface
```

### 🛠️ **Development**
```
├── 📁 types/                # TypeScript definitions
│   ├── express.d.ts        # Express type extensions
│   ├── bridge-js.d.ts      # JavaScript bridge types
│   └── ...                 # Additional type definitions
├── 📁 utils/                # Utility functions
│   ├── errors.ts           # Custom error classes
│   ├── hash.ts             # Hashing utilities
│   └── ...                 # Helper functions
├── 📁 tests/                # Test framework
│   ├── test-registry.ts    # Test registration system
│   └── ...                 # Test suites
├── 📁 routes/               # Route definitions
│   └── ...                 # Legacy route handlers
├── 📁 ml/                   # Machine learning resources
│   ├── datasets/           # Training datasets
│   └── logs/               # Quality reports
```

---

## 🚀 **KEY FEATURES**

### **🤖 Multi-AI System**
- **Claude Haiku** - Fast responses for casual queries
- **Claude Sonnet** - Premium business intelligence
- **ZANTARA LLAMA** - Custom-trained local AI
- **DevAI Qwen** - Code assistance specialist

### **🧠 Dual-Layer Memory**
- **Semantic Memory** - User preferences, business context
- **Episodic Memory** - Conversation history, interaction patterns
- **Vector Search** - Similarity-based memory retrieval

### **🛡️ Security & Reliability**
- **Anti-hallucination** - Reality-check middleware
- **Rate limiting** - Intelligent DDoS protection
- **OAuth2** - Secure authentication
- **Monitoring** - Real-time performance tracking

### **🌐 Enterprise Integration**
- **Google Workspace** - Drive, Sheets, Calendar, Gmail
- **WhatsApp Business** - Messaging automation
- **Instagram** - Social media integration
- **Firestore** - Scalable data persistence

---

## 📊 **SYSTEM ARCHITECTURE**

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│        (webapp/, interfaces/)                   │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                APP GATEWAY                      │
│         (app-gateway/, routing/)                │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│               MIDDLEWARE                        │
│    (auth, rate-limit, monitoring, cors)        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│               HANDLERS                          │
│        (96+ API endpoints)                      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│               SERVICES                          │
│    (AI, Memory, Google, Firebase)              │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│             EXTERNAL APIS                      │
│   (Claude, Google, Firestore, RAG)             │
└─────────────────────────────────────────────────┘
```

---

## 🎯 **GETTING STARTED**

### **Development Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### **Environment Configuration**
Required environment variables in `.env`:
```env
# AI Services
ANTHROPIC_API_KEY=your_claude_key
ZANTARA_API_KEY=your_zantara_key

# Google Services  
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Database
DATABASE_URL=your_postgresql_url

# Security
JWT_SECRET=your_jwt_secret
```

### **Key Endpoints**
- `GET /health` - System health check
- `POST /call` - Universal handler endpoint
- `POST /ai/chat` - AI conversation
- `GET /api/handlers` - List all handlers
- `POST /memory/query` - Memory search

---

## 🏆 **PRODUCTION STATUS**

**✅ ACTIVE COMPONENTS:**
- Express server with 130+ endpoints
- Multi-AI routing system
- Dual-layer memory system
- Google Workspace integration
- Security middleware stack

**🚀 DEPLOYMENT:**
- **Platform**: Railway + Google Cloud Run
- **Scaling**: Auto-scaling enabled
- **Monitoring**: Winston logging + performance metrics
- **Security**: OAuth2 + rate limiting + CORS

---

## 📚 **DOCUMENTATION**

- **API Documentation**: Available at `/api/docs` when running
- **Handler Registry**: Auto-generated from code annotations
- **Type Definitions**: Complete TypeScript coverage
- **Test Coverage**: Integration tests for core functionality

---

**🌸 From Zero to Infinity ∞**  
*Built with ❤️ for the NUZANTARA ecosystem*
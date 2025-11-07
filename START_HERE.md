# 🌟 ZANTARA v5.2.2 - PRODUCTION READY
## *Advanced Knowledge System for Business Intelligence*

**📋 Latest Updates:**
- [Nov 8, 2025 Session Report](docs/SESSION_REPORT_NOV8_2025.md) - Complete session summary and deployment status
- [Nov 8, 2025 Deployment Guide](docs/DEPLOYMENT_NOV8_2025.md) - Autonomous agents, semantic cache, frontend optimization
- [Nov 7, 2025 Updates](docs/RECENT_UPDATES_20251107.md) - Endpoint fixes, config centralization, workspace cleanup

**Status**: 🟢 **FULLY OPERATIONAL** | **Deployed**: Fly.io (Singapore + Cloudflare CDN)
**Last Updated**: 2025-11-08 | **Knowledge Base**: 25,422 Documents (Verified ✅)
**Features**: 9/38 Implemented (23.7%) | **Uptime**: 99%+

---

## 🎯 **MISSION STATEMENT**

ZANTARA is an advanced **intelligent knowledge system** that provides:
- 🧠 **Semantic Search** across 8 specialized knowledge domains
- 🤖 **AI-Powered Intelligence** (Llama 4 Scout PRIMARY, Claude Haiku 4.5 fallback) for business insights
- 🌍 **Production Infrastructure** with 99%+ uptime
- ⚡ **Real-time Processing** with ~120ms cached response times
- 🔒 **Enterprise Security** with JWT authentication & rate limiting

---

## 🚀 **QUICK START**

### **🌐 Access Production System**
- **Frontend App**: https://zantara.balizero.com (Cloudflare Pages)
- **TypeScript Backend**: https://nuzantara-backend.fly.dev
- **RAG Backend API**: https://nuzantara-rag.fly.dev
- **API Documentation**: https://nuzantara-rag.fly.dev/docs
- **Health Check**: https://nuzantara-backend.fly.dev/health

### **🛠️ Local Development**
```bash
# Clone repository
git clone <repository-url>
cd NUZANTARA-FLY

# Setup environment
npm install
./setup-zantara.sh

# Run health check
./doctor.sh

# Start development
npm run dev
```

---

## 📊 **SYSTEM OVERVIEW**

### **✅ Production Services**
| Service | Status | URL | Platform |
|---------|--------|-----|----------|
| **TypeScript Backend** | 🟢 Operational | https://nuzantara-backend.fly.dev | Fly.io (2GB RAM) |
| **RAG Backend (Python)** | 🟢 Operational | https://nuzantara-rag.fly.dev | Fly.io (2GB RAM) |
| **Frontend App** | 🟢 Operational | https://zantara.balizero.com | Cloudflare Pages |

### **🧠 Knowledge Collections (25,422 Documents)**
- **knowledge_base** - Blockchain, Whitepaper, Satoshi (8,923 docs)
- **kbli_unified** - KBLI 2020 Business Classification (8,887 docs)
- **legal_unified** - Indonesian Laws & Regulations (5,041 docs)
- **visa_oracle** - Immigration & Visa Intelligence (1,612 docs)
- **tax_genius** - Tax Framework & Calculations (895 docs)
- **property_unified** - Property Investment (29 docs)
- **bali_zero_pricing** - Service Pricing (29 docs)
- **property_listings** - Property Listings (2 docs)
- **tax_updates** - Tax Updates (2 docs)
- **legal_updates** - Legal Updates (2 docs)

### **🤖 AI System (Nov 5, 2025 - Cost Optimization)**
- **Primary:** Llama 4 Scout via OpenRouter (92% cheaper, 22% faster TTFT, 10M context)
- **Fallback:** Claude Haiku 4.5 (tool calling, reliability, automatic on errors only)
- **Cost Savings:** $10-12/month (verified via 100-query POC)
- **Strategy:** Llama Scout PRIMARY, zero breaking changes
- **Verified:** Nov 8, 2025 - PRIMARY status confirmed in production

---

## 🔧 **API ENDPOINTS**

### **🎯 V3 Ω Unified System** (Feature #8 - FIXED Nov 4, 2025)
```bash
# Unified Knowledge Query (8 domains integrated)
POST https://nuzantara-backend.fly.dev/api/v3/zantara/unified
{
  "query": "restaurant business setup requirements",
  "user_id": "demo",
  "mode": "comprehensive"  // quick | comprehensive | expert
}

# Collective Intelligence (Shared learning)
POST https://nuzantara-backend.fly.dev/api/v3/zantara/collective
{
  "query": "successful visa applications patterns",
  "action": "query",  // query | contribute | verify | stats | sync
  "user_id": "demo"
}

# Business Ecosystem Analysis (Complete business analysis)
POST https://nuzantara-backend.fly.dev/api/v3/zantara/ecosystem
{
  "query": "open a restaurant in Bali",
  "scenario": "business_setup",  // business_setup | expansion | compliance | optimization
  "user_id": "demo"
}
```

### **🔐 Team Authentication** (Feature #9 - NEW Nov 5, 2025)
```bash
# Team Member Login
POST https://nuzantara-backend.fly.dev/api/auth/team/login
{
  "name": "Zero",
  "email": "zero@balizero.com"  // Optional
}
# Returns: JWT token + user profile

# Get All Team Members
GET https://nuzantara-backend.fly.dev/api/auth/team/members

# Validate Session
GET https://nuzantara-backend.fly.dev/api/auth/team/validate
Headers: Authorization: Bearer <token>

# Get User Profile
GET https://nuzantara-backend.fly.dev/api/auth/team/profile
Headers: Authorization: Bearer <token>

# Logout
POST https://nuzantara-backend.fly.dev/api/auth/team/logout
Headers: Authorization: Bearer <token>
```

### **💰 Business Services** (Feature #7)
```bash
# KBLI Business Lookup
GET https://nuzantara-backend.fly.dev/api/v2/bali-zero/kbli?query=restaurant

# Pricing Calculator
POST https://nuzantara-backend.fly.dev/api/v2/bali-zero/pricing
{
  "service": "kitas_working",
  "type": "onshore"
}

# Business Chat
POST https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat
{
  "message": "I need to register a company",
  "user_id": "demo"
}
```

### **📊 System Health & Monitoring** (Features #2, #3, #6)
```bash
# Health Check
GET https://nuzantara-backend.fly.dev/health

# Prometheus Metrics
GET https://nuzantara-backend.fly.dev/metrics

# Performance Metrics
GET https://nuzantara-backend.fly.dev/performance/metrics

# Cache Statistics
GET https://nuzantara-backend.fly.dev/cache/stats

# Cache Health
GET https://nuzantara-backend.fly.dev/cache/health
```

### **🗄️ Redis Cache Management** (Feature #4 - FIXED Nov 5, 2025)
```bash
# Get Cached Value
GET https://nuzantara-backend.fly.dev/cache/get?key=test

# Set Cache Value
POST https://nuzantara-backend.fly.dev/cache/set
{
  "key": "test",
  "value": "test value",
  "ttl": 3600
}

# Delete Cache Key
DELETE https://nuzantara-backend.fly.dev/cache/clear/test

# Invalidate Pattern
POST https://nuzantara-backend.fly.dev/cache/invalidate
{
  "pattern": "zantara:unified:*"
}

# Debug Cache
GET https://nuzantara-backend.fly.dev/cache/debug
```

---

## 📚 **KNOWLEDGE DOMAINS**

### **Domain 1: Business Classification** (8,887 docs)
- **KBLI 2020**: Complete 5-digit business codes
- **Capital Requirements**: Minimum investment per sector
- **Foreign Ownership**: Open/Conditional/Closed status
- **Licensing**: Required permits per business type
- **Coverage**: All 21 main categories (A-U)

### **Domain 2: Legal & Regulatory** (5,043 docs)
- **Labor Law**: UU 13/2003 Ketenagakerjaan
- **Investment Law**: UU 24/2007 + PP regulations
- **Company Law**: UU 40/2007 Perseroan Terbatas
- **Foreign Workers**: PP 34/2021 TKA regulations
- **Updates**: Weekly monitoring of legal changes

### **Domain 3: Immigration & Visa** (1,612 docs)
- **KITAS**: Working, Investment, Retirement, Spouse
- **KITAP**: Permanent stay permits
- **Procedures**: Application, renewal, reporting
- **Requirements**: Document checklists per visa type
- **Processing**: Timeline and costs

### **Domain 4: Taxation** (897 docs)
- **Personal Tax**: PPh 21 (Income tax)
- **Corporate Tax**: PPh 25/29 (Company tax)
- **VAT**: PPN 11% regulations
- **Withholding**: PPh 23/26 procedures
- **Scenarios**: 895+ real-world tax calculations

### **Domain 5: Property & Real Estate** (31 docs)
- **Ownership**: Hak Milik, Hak Pakai, Leasehold
- **Foreign Rules**: Restrictions and legal structures
- **Due Diligence**: Title verification procedures
- **Transfers**: Tax calculations and notary requirements
- **Investment**: ROI analysis and market data

### **Domain 6: Service Pricing** (29 docs)
- **KITAS Services**: IDR 28M - 38M
- **Company Setup**: IDR 25M - 65M
- **Tax Services**: IDR 2M - 25M+
- **Consulting**: IDR 3M - 15M
- **Packages**: Complete service bundles

### **Domain 7: General Knowledge** (8,923 docs)
- **Blockchain**: Technology fundamentals
- **Cryptocurrency**: Bitcoin, whitepaper analysis
- **Satoshi Nakamoto**: Original writings
- **Business**: General business knowledge

### **Domain 8: Collective Memory** (In Development)
- **User Interactions**: Learning from queries
- **Patterns**: Successful solution tracking
- **Community**: Shared anonymized insights
- **Improvement**: Continuous learning system

---

## 🌍 **PRODUCTION INFRASTRUCTURE**

### **🚀 Deployment Architecture**
```
Production Stack:
├── Frontend (Cloudflare Pages)
│   ├── React + TypeScript + Vite
│   ├── Global CDN distribution
│   └── URL: https://zantara.balizero.com
│
├── TypeScript Backend (Fly.io Singapore)
│   ├── Node.js 20 + Express + ES Modules
│   ├── 2 CPU cores, 2GB RAM
│   ├── Machine: 78156d1c536918
│   └── URL: https://nuzantara-backend.fly.dev
│
├── RAG Backend (Fly.io Singapore)
│   ├── Python 3.11 + FastAPI + ChromaDB
│   ├── 2 CPU cores, 2GB RAM
│   ├── 10GB Volume (chroma_data)
│   └── URL: https://nuzantara-rag.fly.dev
│
└── Redis Cache (AWS Singapore)
    ├── Redis Cloud 8.0.2
    ├── 60-80% hit rate
    └── Domain-specific TTL
```

### **⚡ Performance Metrics (Verified)**
- **Cached Response**: ~120ms average
- **v3 Unified (quick)**: ~500ms
- **v3 Comprehensive**: <2s
- **v3 Ecosystem**: ~1800ms
- **System Uptime**: 99%+
- **Concurrent Requests**: 100+ supported
- **Rate Limit**: 100 req/min per endpoint
- **Knowledge Base**: 25,422 documents ✅
- **Cache Hit Rate**: 60-80%

---

## 🛠️ **DEVELOPMENT WORKFLOW**

### **📋 Project Structure**
```
NUZANTARA-FLY/
├── apps/
│   ├── backend-rag/           # Python FastAPI + ChromaDB
│   ├── backend-ts/            # TypeScript microservices
│   ├── webapp/                # React production app
│   └── webapp-v2/             # Next.js enhanced app
├── docs/                      # Comprehensive documentation
├── services/                  # Agent systems & integrations
├── infrastructure/            # Deployment & CI/CD
└── knowledge-base/            # Document processing
```

### **🔧 Development Commands**
```bash
# System health check
./doctor.sh

# Start all services
npm run start:all

# Run tests
npm test

# Deploy to production
./deploy-all.sh

# Monitor system
./monitor.sh
```

---

## 📖 **DOCUMENTATION MAP**

### **🎯 Essential Reading (Updated Nov 5, 2025)**
- **🏛️ Infrastructure Overview** → `INFRASTRUCTURE_OVERVIEW.md` (424 lines) ✅
- **📋 Complete Workflow Guide** → `WORKFLOW_COMPLETO.md` (460 lines) ✅
- **📚 Knowledge Base Map** → `KNOWLEDGE_BASE_MAP.md` (610 lines) ✅
- **🤖 System Prompt Reference** → `SYSTEM_PROMPT_REFERENCE.md` (424 lines) ✅
- **🌟 Start Here** → `START_HERE.md` (This file) ✅

### **📚 Technical Guides**
- **🔧 Deployment Workflows** → See WORKFLOW_COMPLETO.md
- **🗄️ Database Architecture** → ChromaDB 25,422 docs (KNOWLEDGE_BASE_MAP.md)
- **🎯 AI Configuration** → 8 domains, team profiles (SYSTEM_PROMPT_REFERENCE.md)
- **📊 Feature Status** → 9/38 implemented (INFRASTRUCTURE_OVERVIEW.md)

---

## 🎭 **SYSTEM PERSONALITY**

### **🤖 ZANTARA Characteristics**
- **Intelligent**: Deep semantic understanding
- **Helpful**: Context-aware assistance
- **Reliable**: 99.9% uptime performance
- **Scalable**: Global infrastructure
- **Secure**: Enterprise-grade protection

### **🎯 Design Philosophy**
- **User-Centric**: Simplified complexity
- **Knowledge-Driven**: Evidence-based responses
- **Performance-First**: Optimized experiences
- **Future-Ready**: Extensible architecture
- **Culturally-Aware**: Localized intelligence

---

## 🆘 **SUPPORT & TROUBLESHOOTING**

### **🔍 System Health Checks**
```bash
# Backend Health
curl https://nuzantara-backend.fly.dev/health

# RAG Backend Health
curl https://nuzantara-rag.fly.dev/health

# Cache Status
curl https://nuzantara-backend.fly.dev/cache/health

# Prometheus Metrics
curl https://nuzantara-backend.fly.dev/metrics

# Performance Data
curl https://nuzantara-backend.fly.dev/performance/metrics

# Check Fly.io logs
fly logs -a nuzantara-backend
fly logs -a nuzantara-rag
```

### **📞 Production Services**
- **Backend Status**: https://nuzantara-backend.fly.dev/health
- **RAG Status**: https://nuzantara-rag.fly.dev/health
- **API Docs**: https://nuzantara-rag.fly.dev/docs
- **Frontend**: https://zantara.balizero.com
- **Metrics**: https://nuzantara-backend.fly.dev/metrics

---

## 🎊 **CURRENT ACHIEVEMENTS (9/38 Features = 23.7%)**

### **✅ Feature #1-6: Infrastructure & Monitoring**
- 🔒 **CORS & Security** - Helmet, rate limiting (100 req/min)
- 📊 **Prometheus Metrics** - CPU, memory, HTTP tracking
- 💚 **Health Checks** - Advanced status monitoring
- 🗄️ **Redis Cache** - 7/7 endpoints working (FIXED Nov 5)
- 🔗 **Correlation Tracking** - X-Correlation-ID headers
- ⚡ **Performance Routes** - Detailed metrics endpoints

### **✅ Feature #7-9: Business & Authentication**
- 💼 **Bali Zero Chat** - KBLI, pricing, business setup
- 🎯 **ZANTARA v3 Ω** - 3 unified endpoints (FIXED Nov 4)
- 🔐 **Team Authentication** - JWT + 22 team members (NEW Nov 5)

### **✅ Production Infrastructure**
- 🌍 **3 Services Operational** - Backend, RAG, Frontend
- 📚 **25,422 Documents** - ChromaDB verified
- ⚡ **~120ms Response** - Cached queries
- 🎭 **Claude Haiku 4.5** - AI integration
- 🔄 **Zero Downtime** - Rolling deployments

### **📋 Next Priority Features (29 Missing)**
- ❌ **User Authentication** - Registration, password reset, email verification
- ❌ **RAG Direct Access** - Query, embeddings, completions endpoints
- ❌ **Business Analysis** - Complete KBLI analysis, license checks
- ❌ **Financial Features** - Pricing plans, subscriptions, invoicing
- ❌ **Admin Tools** - User management, analytics, logs, backups
- ❌ **File Operations** - Upload, download, validation

### **🔮 Recent Updates**
- **Nov 5, 2025**: Team Auth added, cache bugs fixed
- **Nov 4, 2025**: v3 Ω endpoints fixed with defensive coding
- **Nov 3, 2025**: Complete documentation suite created
- **Status**: 76.3% of features still to be implemented

---

## 🌟 **GETTING STARTED**

### **🎯 For End Users**
1. Visit **https://zantara.balizero.com**
2. Ask questions about business setup, visas, taxes, property
3. Get AI-powered answers from 25,422 documents
4. Available in English, Bahasa Indonesia, Italian

### **🛠️ For Developers**
1. Clone the repository
2. Navigate to `apps/backend-ts` or `apps/backend-rag`
3. Set up environment variables (`.env.local`)
4. Run `npm install` and `npm run dev`
5. Check health endpoints for verification

### **🏢 For Business Partners**
1. **Test API**: Start with `/health` and `/api/v3/zantara/unified`
2. **Documentation**: Read comprehensive docs in this folder
3. **Team Access**: Use Team Authentication for secure access
4. **Integration**: Follow WORKFLOW_COMPLETO.md for deployment

### **🔧 Essential Commands**
```bash
# Test production backend
curl https://nuzantara-backend.fly.dev/health

# Test RAG system
curl https://nuzantara-rag.fly.dev/health

# Deploy backend
cd apps/backend-ts
flyctl deploy --app nuzantara-backend --remote-only

# Deploy RAG
cd apps/backend-rag
flyctl deploy --app nuzantara-rag --remote-only

# View logs
fly logs -a nuzantara-backend
fly logs -a nuzantara-rag
```

---

**🎉 WELCOME TO ZANTARA - PRODUCTION READY WITH 25,422 DOCUMENTS!**

*System Status: 🟢 FULLY OPERATIONAL (3/3 Services)*
*Last Update: 2025-11-08 (Autonomous agents + semantic cache + frontend optimization)*
*Version: v5.2.2 (incremental-v0.9)*
*Progress: 9/38 Features Implemented (23.7%)*

**Nov 8 Optimizations (Pending Deploy):**
- ⚡ Semantic caching: 800ms → 150ms RAG latency (-81%)
- 🤖 Autonomous agents: 5 scheduled jobs (self-healing, testing, monitoring)
- 📦 Frontend bundle: 1.3MB → 192KB (-85%)
- 🧹 Root directory: 150+ → 13 essential files (-91%)

---

**📚 Next Steps:**
1. Read **INFRASTRUCTURE_OVERVIEW.md** for complete system details
2. Read **WORKFLOW_COMPLETO.md** for deployment procedures
3. Read **KNOWLEDGE_BASE_MAP.md** for knowledge domain breakdown
4. Read **SYSTEM_PROMPT_REFERENCE.md** for AI configuration
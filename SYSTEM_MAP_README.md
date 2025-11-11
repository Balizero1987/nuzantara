# 🗺️ NUZANTARA System Architecture Map

## Overview

This directory contains a comprehensive, visual map of the entire NUZANTARA system architecture. The map provides a detailed, scenographic view of all components, services, and infrastructure that powers ZANTARA - the advanced AI-powered knowledge system for Indonesian business intelligence.

## Files

### `NUZANTARA_SYSTEM_MAP.html`
A beautiful, interactive HTML visualization of the complete system architecture.

**Features:**
- 🎨 **Beautiful Design**: Gradient backgrounds, smooth animations, and modern UI
- 📊 **7 Architectural Layers**: From user access to AI services
- 🔍 **Detailed Components**: Each component includes descriptions, tech stacks, and metrics
- 💫 **Interactive**: Hover effects, click interactions, and smooth animations
- 📱 **Responsive**: Works on desktop and mobile devices
- 🖨️ **Print-Friendly**: Optimized for printing and documentation

## How to View

### Option 1: Open Locally
Simply open `NUZANTARA_SYSTEM_MAP.html` in any modern web browser:

```bash
# From the project root
open NUZANTARA_SYSTEM_MAP.html

# Or
firefox NUZANTARA_SYSTEM_MAP.html
chrome NUZANTARA_SYSTEM_MAP.html
```

### Option 2: Deploy to Web
The map is a standalone HTML file with no dependencies, making it easy to deploy:

```bash
# Copy to your web server
cp NUZANTARA_SYSTEM_MAP.html /var/www/html/

# Or deploy to GitHub Pages, Netlify, Vercel, etc.
```

## Architecture Layers

The map organizes the system into 7 distinct layers:

### 🌐 Layer 0: Global User Access
- Worldwide access points
- Multi-region support
- SSL/TLS security

### ☁️ Layer 1: CDN & Edge Network
- **Cloudflare CDN**: 200+ edge locations
- DDoS protection
- Auto SSL/TLS renewal
- WAF (Web Application Firewall)

### 💻 Layer 2: Frontend Layer
- **React 18 Web App**: 192KB optimized bundle
- Modern UI components
- Custom React hooks
- GitHub Pages hosting

### 🔌 Layer 3: API Gateway & Backend Services
- **TypeScript Backend**: 79 handlers, 50+ services
- **Python RAG Backend**: 63 services, FastAPI
- Security middleware
- JWT authentication
- 50+ REST endpoints

### 🤖 Layer 4: Autonomous AI Agents (15 agents)
- Self-Healing Agent
- Test Writer Agent
- Health Monitor
- Tax Genius Agent
- Legal Architect
- Property Sage
- EYE-KBLI Agent
- Bali Zero Services
- Performance Optimizer
- Refactoring Agent
- PR Agent
- And more...

### 💾 Layer 5: Data & Storage Layer
- **ChromaDB**: 25,422 documents, 10 collections
- **Redis Cache**: 60-80% hit rate, 81% latency reduction
- **PostgreSQL**: User data, metadata, audit logs
- Memory service for session management

### 🧠 Layer 6: AI Services & External Integrations
- **Llama 4 Scout** (PRIMARY): 92% cheaper, 10M context
- **Claude Haiku 4.5** (FALLBACK): Tool calling support
- **OpenAI Embeddings**: 1536-dimensional vectors
- **Prometheus + Grafana**: Monitoring and visualization
- **Fly.io**: Singapore region hosting
- **GitHub Actions**: 8 CI/CD workflows

## Key Statistics

| Metric | Value |
|--------|-------|
| **Documents Indexed** | 25,422 |
| **Collections** | 10 |
| **API Handlers** | 79+ |
| **Python Services** | 63 |
| **AI Agents** | 15 |
| **Uptime SLA** | 99%+ |
| **Response Time** | ~120ms (cached) |
| **Bundle Size** | 192KB |
| **Lines of Code** | 100,000+ |
| **API Endpoints** | 50+ |
| **Team Members** | 22 |
| **Monthly Cost Savings** | $10-12 (Llama vs Claude) |

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend
- Node.js 20
- Express.js
- Python 3.11
- FastAPI
- TypeScript

### Databases
- ChromaDB (Vector DB)
- PostgreSQL 15
- Redis 7

### AI & ML
- Llama 4 Scout
- Claude Haiku 4.5
- OpenAI Embeddings
- OpenRouter Gateway

### Infrastructure
- Fly.io (Singapore)
- GitHub Pages
- Cloudflare CDN
- AWS (Redis)

### DevOps
- GitHub Actions (8 workflows)
- Docker & Docker Compose
- Prometheus + Grafana
- Winston + Loki

## System Highlights

### 🚀 Performance Optimizations
- **Bundle Size**: Reduced from 1.3MB to 192KB (-85%)
- **File Count**: Reduced from 96 to 10 JS files (-90%)
- **Load Time**: <1.5s (40% improvement)
- **Response Time**: 800ms → 150ms with caching (-81%)

### 🤖 AI Capabilities
- **Primary Model**: Llama 4 Scout ($0.20/$0.20 per 1M tokens)
- **Fallback Model**: Claude Haiku 4.5
- **Context Window**: 10M tokens
- **Embedding Dimensions**: 1536 (upgraded from 384)
- **Search Accuracy**: 94%

### 🛡️ Security Features
- Helmet security headers
- CORS protection
- Rate limiting (100 req/min)
- Request sanitization
- JWT authentication
- Session validation
- Audit trail logging

### 📊 Monitoring & Observability
- Prometheus metrics collection
- Grafana dashboards
- Health checks (15-min intervals)
- Performance tracking
- Error alerting
- Correlation ID tracking

### 🔄 Autonomous Operations
- Self-healing production errors
- Automated test generation
- Continuous health monitoring
- Daily status reports
- Weekly PR automation
- Performance optimization

## ChromaDB Collections

The system maintains 10 specialized knowledge collections:

1. **knowledge_base** (8,923 docs) - Blockchain, whitepapers, general knowledge
2. **kbli_unified** (8,887 docs) - KBLI 2020 business classification (1,400+ codes)
3. **legal_unified** (5,041 docs) - Indonesian laws & regulations
4. **visa_oracle** (1,612 docs) - KITAS, KITAP, visa procedures
5. **tax_genius** (895 docs) - Tax calculations, PPh, PPN, 895+ scenarios
6. **property_unified** (29 docs) - Property ownership, foreign rules
7. **bali_zero_pricing** (29 docs) - Service pricing (IDR 2M-65M range)
8. **property_listings** (2 docs)
9. **tax_updates** (2 docs)
10. **legal_updates** (2 docs)

## Business Intelligence Domains

ZANTARA provides expertise across 8 domains:

1. 🏢 **Business Classification** - KBLI 2020 codes
2. ⚖️ **Legal & Regulatory** - Indonesian compliance
3. 🛂 **Immigration & Visa** - KITAS, KITAP processing
4. 💰 **Taxation** - PPh, PPN calculations
5. 🏠 **Property & Real Estate** - Ownership guidance
6. 💼 **Service Pricing** - Bali Zero services
7. 📚 **General Knowledge** - Business intelligence
8. 🧠 **Collective Memory** - Learning from interactions

## API Endpoints Overview

### V3 Omega Unified System
- `POST /api/v3/zantara/unified` - 8-domain integrated knowledge hub
- `POST /api/v3/zantara/collective` - Shared learning & community intelligence
- `POST /api/v3/zantara/ecosystem` - Complete business analysis

### Bali Zero Services
- `GET /api/v2/bali-zero/kbli` - Business code lookup
- `POST /api/v2/bali-zero/pricing` - Pricing calculator
- `POST /api/v2/bali-zero/chat` - Business chat
- `GET /bali-zero/chat-stream` - SSE streaming

### Authentication
- `POST /api/auth/team/login` - Team member login (22 members)
- `GET /api/auth/team/members` - List team members
- `GET /api/auth/team/validate` - Session validation
- `GET /api/auth/team/profile` - User profile
- `POST /auth/login` - User authentication
- `POST /auth/validate` - Token validation

### Cache Management
- `GET /cache/get` - Get cached value
- `POST /cache/set` - Set cache value
- `DELETE /cache/clear/:key` - Delete cache key
- `GET /cache/stats` - Cache statistics

### Monitoring
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /performance/metrics` - Performance data
- `GET /cache/health` - Cache status

## Deployment Information

### Production URLs
- **Frontend**: https://zantara.balizero.com
- **Backend API**: https://nuzantara-backend.fly.dev
- **RAG Service**: https://nuzantara-rag.fly.dev

### Deployment Regions
- **Primary**: Singapore (Fly.io)
- **CDN**: Global (Cloudflare)
- **Frontend**: Global (GitHub Pages + Cloudflare)

### Environment
- **Node.js**: v20
- **Python**: v3.11+
- **Memory**: 2GB per service
- **CPUs**: 2 per service
- **Storage**: 10GB persistent volume (ChromaDB)

## Autonomous Agents Schedule

| Agent | Schedule | Purpose |
|-------|----------|---------|
| Self-Healing | Daily 2:00 AM | Fix production errors |
| Auto-Tests | Daily 3:00 AM | Generate test suites |
| Health Monitor | Every 15 minutes | System health checks |
| Daily Reports | Daily 9:00 AM | Status reports |
| Weekly PR | Sunday 4:00 AM | Automated pull requests |

## Development

### Local Development
```bash
# Start all services
docker-compose up -d

# Backend TypeScript
cd apps/backend-ts
npm run dev

# Backend RAG
cd apps/backend-rag
python -m uvicorn backend.app.main:app --reload

# Frontend
cd apps/webapp
npm run dev
```

### Deployment
```bash
# Backend TypeScript
cd apps/backend-ts
flyctl deploy --app nuzantara-backend

# Backend RAG
cd apps/backend-rag
flyctl deploy --app nuzantara-rag

# Frontend (automatic via GitHub Actions)
git push origin main
```

## Team

**22 Pre-configured Team Members:**
- Zero (CEO/Founder)
- Bali Zero operational team
- Department-based roles (finance, legal, operations, general)

## Version Information

- **System Version**: v5.2.2 (incremental-v0.9)
- **Status**: Production Ready
- **Uptime**: 99%+ SLA
- **Last Updated**: 2025-11-11

## Support

For questions or issues:
- **Production Site**: https://zantara.balizero.com
- **Documentation**: `/docs` directory
- **Repository**: https://github.com/Balizero1987/nuzantara

---

**Built with ❤️ by Bali Zero Team**

*This system map represents the complete architecture as of November 2025. For the most up-to-date information, please refer to the live documentation or contact the development team.*

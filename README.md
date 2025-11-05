# ZANTARA v3 Ω

Sistema di intelligenza legale e gestionale per Indonesia - Architettura modulare completa.

## 🚀 Quick Start

```bash
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara
cp .env.example .env
bash scripts/doctor.sh
```

## 📖 Documentazione

- **[NUZANTARA_README.md](./NUZANTARA_README.md)** - Overview completo e setup dettagliato
- **[INFRASTRUCTURE_OVERVIEW.md](./INFRASTRUCTURE_OVERVIEW.md)** - Architettura cloud e deployment
- **[DIARIES/README.md](./DIARIES/README.md)** - Tracking sessioni AI
- **[CHROMADB_MIGRATION_GUIDE.md](./CHROMADB_MIGRATION_GUIDE.md)** - Migrazione knowledge base completa ✅

## 🔧 ZANTARA v3 Ω Features

### Unified Knowledge System
- **zantara-unified**: Accesso a tutte le knowledge base (KBLI, pricing, legal, immigration)
- **zantara-collective**: Memoria condivisa e apprendimento cross-user
- **zantara-ecosystem**: Analisi completa ecosistema business

### Session Store (Redis-based) ✅ NEW
- **Capacity**: 50+ message conversations (175% increase vs querystring)
- **Analytics Dashboard**: Real-time session monitoring and statistics
- **Configurable TTL**: 1 hour → 30 days retention
- **Export/Backup**: JSON & Markdown conversation export
- **Performance**: <1s operations, 100% context preservation
- **Documentation**: [SESSION_FEATURES_IMPLEMENTATION_20251105.md](~/Desktop/SESSION_FEATURES_IMPLEMENTATION_20251105.md)

### Technology Stack
- **Backend**: TypeScript + Node.js (Fly.io)
- **Frontend**: React + Tailwind CSS (Cloudflare Pages)
- **Vector DB**: ChromaDB (production) + Qdrant (standby)
- **Cache**: Redis
- **Monitoring**: GLM System Diagnostics

## 🌐 Deployments

### Production (Fly.io)
- **Backend**: https://nuzantara-backend.fly.dev
- **RAG**: https://nuzantara-rag.fly.dev
- **Core**: https://nuzantara-core.fly.dev

### Frontend (Cloudflare Pages)
- **Webapp**: zantara.balizero.com (staging)
- **Website**: balizero1987.github.io

## 🔍 System Health

```bash
# Full system diagnostics
bash scripts/doctor.sh

# Backend health
curl https://nuzantara-backend.fly.dev/health

# RAG + Session Store health
curl https://nuzantara-rag.fly.dev/health

# Session Analytics
curl https://nuzantara-rag.fly.dev/analytics/sessions
```

## 📡 API Endpoints

### Session Store (https://nuzantara-rag.fly.dev)
```bash
# Create session
POST /sessions

# Get session history
GET /sessions/{id}

# Update session (with optional TTL)
PUT /sessions/{id}
Body: {"history": [...], "ttl_hours": 168}

# Update TTL only
PUT /sessions/{id}/ttl
Body: {"ttl_hours": 720}

# Export session
GET /sessions/{id}/export?format=json|markdown

# Analytics dashboard
GET /analytics/sessions
```

---

**Repository**: https://github.com/Balizero1987/nuzantara
**Status**: Production Ready
**Version**: v3 Ω
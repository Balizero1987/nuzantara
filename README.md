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

## 🔧 ZANTARA v3 Ω Features

### Unified Knowledge System
- **zantara-unified**: Accesso a tutte le knowledge base (KBLI, pricing, legal, immigration)
- **zantara-collective**: Memoria condivisa e apprendimento cross-user
- **zantara-ecosystem**: Analisi completa ecosistema business

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

# Vector layer status
curl https://nuzantara-backend.fly.dev/health
```

---

**Repository**: https://github.com/Balizero1987/nuzantara
**Status**: Production Ready
**Version**: v3 Ω
# Orientation One-Pager (O1)
Last Updated: 2025-10-10
Maintainer: Core Team

Who
- ZANTARA / NUZANTARA-2: backend TS (107 handlers / 41 tool-use), RAG FastAPI (retrieval + reranker), WebApp thin shell.

Where
- Backend TS: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app (v5.5.0 + rate-limiting)
- RAG FastAPI: https://zantara-rag-backend-himaadsxua-ew.a.run.app (v2.5.0-reranker-active)
- WebApp (current): https://zantara.balizero.com (GitHub Pages, auto-sync)

Architecture (5 lines)
- Channels (WebApp/WhatsApp/Instagram/X/Telegram) → TS Gateway (/app/*, /call)
- TS Gateway → 107 Handlers (12 categories: AI, Google, Bali Zero, Memory, RAG, Communication, Analytics, Intel, Identity, Maps, WebSocket, Admin)
- RAG → ChromaDB (7,375 docs) + cross-encoder reranker; tool executor proxy back to TS
- LLAMA4 (planned) → Super-Orchestrator (10M context), 70% queries from memory (zero cost)
- Shared services: GCS/ChromaDB, Firestore, Secret Manager, Cloud Run, GitHub Actions CI/CD

Standards
- Auth via origin/JWT (no API key in client), 4-tier rate limiting (20/30/15/5 req/min), audit logs.
- Tool Use ACTIVE: RAG backend executes TS handlers (41 exposed via system.handlers.tools)
- All real tests; no mock data in onboarding steps.
- Security: 100% API keys in Secret Manager; rate limiting prevents 98% abuse cost ($115k/day → $2.3k/day max)

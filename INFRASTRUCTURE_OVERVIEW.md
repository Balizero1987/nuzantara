# ZANTARA Infrastructure Overview

## ☁️ Cloud Architecture

### Primary Deployment
- **Provider**: Fly.io
- **Applications**: 3 instances
  - nuzantara-backend (TypeScript main)
  - nuzantara-rag (Python RAG)
  - nuzantara-qdrant (Vector DB - standby)

### Frontend Deployment
- **Provider**: Cloudflare Pages
- **Applications**:
  - zantara.balizero.com (webapp)
  - balizero1987.github.io (website)

### Database Layer
- **Primary**: ChromaDB (production)
- **Vector**: Qdrant (standby)
- **Metadata**: PostgreSQL
- **Cache**: Redis

## 🔧 Technology Stack

### Backend Services
- **API Gateway**: Express.js + TypeScript
- **AI Services**: Multiple specialized handlers
- **Authentication**: JWT + Demo mode
- **Rate Limiting**: Tier-based protection

### Frontend Applications
- **Webapp**: React + Tailwind CSS
- **Website**: Next.js + Static generation
- **Real-time**: Server-Sent Events

### Data Processing
- **Vector Search**: ChromaDB embeddings
- **RAG Pipeline**: Document retrieval + LLM reasoning
- **Knowledge Base**: JSONL + Markdown

## 📊 Monitoring & Observability

### Health Checks
- **Backend Health**: /health endpoint
- **Service Status**: /metrics endpoint
- **Database Connections**: Active monitoring

### Performance Metrics
- **Response Time**: < 2 seconds target
- **Throughput**: 100+ concurrent users
- **Uptime**: 99.5% SLA target

### CI/CD Pipeline
- **Source**: GitHub Actions
- **Testing**: Automated test suite
- **Deployment**: Zero-downtime deployments
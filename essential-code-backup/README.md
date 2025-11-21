# 🌟 NUZANTARA - ZANTARA AI Platform

**Indonesian Business Intelligence & Legal Advisory Platform**

[![Deploy Status](https://github.com/Balizero1987/nuzantara/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Balizero1987/nuzantara/actions/workflows/deploy-pages.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live Site:** https://zantara.balizero.com

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara

# Install dependencies
npm install

# Start development
npm run dev
```

---

## 📦 Repository Structure

```
nuzantara/
├── apps/
│   ├── webapp/          # Frontend (GitHub Pages)
│   ├── backend-ts/      # TypeScript backend (Fly.io)
│   └── backend-rag/     # Python RAG service (Fly.io)
├── docs/                # Documentation
│   ├── reports/         # Status reports & analytics
│   ├── guides/          # Setup & development guides
│   ├── architecture/    # System architecture docs
│   └── sessions/        # Development session logs
└── .github/workflows/   # CI/CD automation
```

---

## 🎯 Key Features

### 🤖 AI-Powered
- **Primary AI:** Llama 4 Scout (92% cheaper than Haiku)
- **Fallback:** Claude Haiku 4.5
- **Cost Optimization:** $0.20/$0.20 per 1M tokens

### 🌐 Production Deployment
- **Frontend:** GitHub Pages (auto-deploy on push)
- **Backend:** Fly.io (TypeScript + Python)
- **HTTPS:** Enforced with auto SSL

### ⚡ Performance
- **Bundle Size:** 192KB (optimized)
- **Load Time:** <1.5s (40% improvement)
- **Files:** 10 JS files (90% reduction)

---

## 🛠️ Technology Stack

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- GitHub Pages deployment

### Backend
- **TypeScript:** Express.js (Fly.io)
- **Python:** FastAPI + RAG (Fly.io)
- **Vector DB:** Qdrant
- **Cache:** Redis

### AI/ML
- Llama 4 Scout (via OpenRouter)
- Claude Haiku 4.5 (via Anthropic)
- Intelligent routing with fallback

---

## 📚 Documentation

- **[Start Here](START_HERE.md)** - Quick start guide
- **[Project Context](PROJECT_CONTEXT.md)** - Background & goals
- **[System Prompt](SYSTEM_PROMPT_REFERENCE.md)** - AI configuration
- **[Changelog](CHANGELOG.md)** - Version history
- **[Architecture](docs/architecture/)** - System design docs
- **[Guides](docs/guides/)** - Development guides

---

## 🚀 Deployment

### Automatic Deployment
The repository uses GitHub Actions for automatic deployment:
- **Trigger:** Push to `main` branch (changes in `apps/webapp`)
- **Workflow:** `.github/workflows/deploy-pages.yml`
- **Target:** GitHub Pages → https://zantara.balizero.com
- **Duration:** ~40 seconds

### Manual Deployment
```bash
# Deploy backend services
make deploy-backend

# Deploy RAG service
make deploy-rag

# Full deployment
make deploy-full
```

---

## 🧪 Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Local Development
```bash
# Frontend
cd apps/webapp
python -m http.server 3000

# Backend TypeScript
cd apps/backend-ts
npm run dev

# Backend RAG
cd apps/backend-rag
uvicorn backend.app.main_cloud:app --reload
```

### Testing
```bash
# Run all tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

---

## 📊 Recent Updates (Nov 8, 2025)

### ✅ Performance Optimization
- Frontend bundle: 1.3MB → 192KB (-85%)
- Removed 96 unused JavaScript files
- Improved load time by 40%

### ✅ Repository Cleanup
- Organized 94 docs into subdirectories
- Reduced root clutter by 92.5%
- Clean Git repository (2.1GB)

### ✅ Deployment Automation
- GitHub Pages auto-deploy workflow
- Custom domain with DNS configuration
- HTTPS enforced

**Full details:** [Session Report](docs/sessions/SESSION_FINAL_NOV8_2025.md)

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🔗 Links

- **Production:** https://zantara.balizero.com
- **GitHub:** https://github.com/Balizero1987/nuzantara
- **Documentation:** [docs/](docs/)

---

**Last Updated:** November 8, 2025  
**Maintained by:** Balizero Team  
**AI Assistant:** Claude Code (Anthropic)

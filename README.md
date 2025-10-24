# 🚂 Nuzantara Railway

**Production-ready AI platform for Indonesian business services**

[![Version](https://img.shields.io/badge/version-5.2.0-blue.svg)](https://github.com/Balizero1987/nuzantara)
[![Status](https://img.shields.io/badge/status-production-green.svg)](https://zantara-rag-backend-1064094238013.europe-west1.run.app/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)

---

## 🎯 Quick Start

```bash
# Clone repository
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara

# Install dependencies (monorepo)
npm install

# Build TypeScript backend
cd apps/backend-ts
npm run build

# Start development
npm run dev
```

**📚 Full documentation:** [docs/README.md](docs/README.md)

---

## 📁 Project Structure

```
nuzantara-railway/
├── apps/              # Deployable applications
│   ├── backend-ts/   # TypeScript API
│   ├── backend-rag/  # Python RAG system
│   ├── webapp/       # Frontend
│   ├── dashboard/    # Admin dashboard
│   └── workspace-addon/
│
├── projects/          # Specific projects
│   ├── bali-intel-scraper/
│   ├── oracle-system/
│   ├── orchestrator/
│   └── devai/
│
├── scripts/           # Organized scripts
│   ├── deploy/
│   ├── maintenance/
│   └── test/
│
├── docs/              # Documentation
└── archive/           # Archived content
```

**📖 Detailed structure:** [STRUCTURE.md](STRUCTURE.md)

---

## 🚀 Applications

### Backend TypeScript API
```bash
cd apps/backend-ts
npm install
npm run build
npm start
```
- **Port:** 8080
- **Tech:** Express, TypeScript, Firebase
- **Docs:** [apps/backend-ts/README.md](apps/backend-ts/README.md)

### Backend Python RAG
```bash
cd apps/backend-rag/backend
pip install -r requirements.txt
python -m app.main
```
- **Port:** 8000
- **Tech:** FastAPI, ChromaDB, Ollama
- **Docs:** [apps/backend-rag/README.md](apps/backend-rag/README.md)

### Web Application
```bash
cd apps/webapp
# Static files - serve with any web server
python -m http.server 8081
```
- **Tech:** Vanilla JS, HTML, CSS
- **Docs:** [apps/webapp/README.md](apps/webapp/README.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/README.md](docs/README.md) | Documentation hub |
| [docs/QUICK_START.md](docs/QUICK_START.md) | Quick start guide |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [STRUCTURE.md](STRUCTURE.md) | Project structure |
| [docs/api/](docs/api/) | API documentation |
| [docs/guides/](docs/guides/) | Deployment guides |

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm/pnpm
- Git

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure your variables
# See: docs/guides/RAILWAY_DEPLOYMENT_GUIDE.md
```

### Testing
```bash
# TypeScript tests
cd apps/backend-ts
npm test

# Python tests
cd apps/backend-rag/backend
pytest
```

---

## 🚢 Deployment

### Railway (Recommended)
```bash
# Follow the deployment guide
cat docs/guides/RAILWAY_DEPLOYMENT_GUIDE.md

# Or use deploy script
./scripts/deploy/deploy-backend.sh
```

### Manual Deployment
See: [docs/guides/RAILWAY_DEPLOYMENT_GUIDE.md](docs/guides/RAILWAY_DEPLOYMENT_GUIDE.md)

---

## 🔧 Scripts

All scripts are organized by function:

```bash
scripts/
├── deploy/         # Deployment scripts
├── maintenance/    # Health checks & monitoring
├── test/          # Testing scripts
└── setup/         # Initial setup
```

---

## 📈 Recent Updates

### v5.2.0 (October 2025)
- ✅ Reorganized folder structure
- ✅ Cleaned up dependencies (18 removed)
- ✅ Consolidated archives
- ✅ Improved documentation
- ✅ Enhanced TypeScript build

**Details:** [REORGANIZATION_COMPLETE.md](REORGANIZATION_COMPLETE.md)

---

## 🤝 Contributing

1. Read [STRUCTURE.md](STRUCTURE.md) to understand the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support

- **Documentation:** [docs/README.md](docs/README.md)
- **Issues:** GitHub Issues
- **Email:** info@balizero.com

---

## 📄 License

Private - Bali Zero Team

---

## 🌟 Key Features

- 🤖 **AI-Powered**: Multiple AI integrations (ZANTARA, DevAI)
- 🔍 **RAG System**: Semantic search with ChromaDB + Ollama
- 🔐 **Secure**: JWT authentication, rate limiting, CORS
- 📊 **Monitoring**: Health checks, metrics, alerts
- 🚀 **Production Ready**: Deployed on Railway & Google Cloud
- 📚 **Well Documented**: Comprehensive docs + guides

---

**Made with ❤️ by Bali Zero Team**

# Force Railway rebuild - gio 23 ott 2025 03:01:03 WITA
# Trigger Railway deploy

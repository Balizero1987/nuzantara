# 📚 NUZANTARA Railway - Documentation

**Production-ready AI platform for Indonesian business services**

---

## 🚀 Quick Links

| What do you need? | Go here |
|-------------------|---------|
| **Get Started** | [QUICK_START.md](QUICK_START.md) |
| **System Overview** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **API Reference** | [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md) |
| **Deploy to Railway** | [guides/RAILWAY_DEPLOYMENT_GUIDE.md](guides/RAILWAY_DEPLOYMENT_GUIDE.md) |
| **Project Structure** | [../STRUCTURE.md](../STRUCTURE.md) |

---

## 📁 Documentation Structure

```
docs/
├── README.md (you are here)
├── QUICK_START.md          # 5-minute overview
├── ARCHITECTURE.md          # System architecture
│
├── api/                     # API documentation
│   ├── API_DOCUMENTATION.md
│   ├── ENDPOINTS_DOCUMENTATION.md
│   └── openapi-rag-pricing.yaml
│
├── guides/                  # How-to guides
│   ├── RAILWAY_DEPLOYMENT_GUIDE.md
│   ├── RUNPOD_DEVAI_SETUP.md
│   └── README.md
│
└── reports/                 # Project reports
    ├── cleanup-2024/       # Dependency cleanup reports
    └── CLEANUP_SESSION_COMPLETE_2025-10-18.md
```

---

## 🎯 Common Tasks

### First Time Setup
```bash
# 1. Read the quick start
cat docs/QUICK_START.md

# 2. Understand project structure
cat STRUCTURE.md

# 3. Follow Railway deployment guide
cat docs/guides/RAILWAY_DEPLOYMENT_GUIDE.md
```

### Working with the Project
```bash
# Check project structure
cat STRUCTURE.md

# Backend TypeScript (API)
cd apps/backend-ts
npm install
npm run build
npm start

# Backend Python (RAG)
cd apps/backend-rag/backend
pip install -r requirements.txt
python -m app.main
```

### Understanding the System
```bash
# System architecture
cat docs/ARCHITECTURE.md

# API documentation
cat docs/api/API_DOCUMENTATION.md

# Project reports
ls docs/reports/
```

---

## 🔗 External Links

- **Railway Dashboard**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
- **GitHub**: https://github.com/Balizero1987/nuzantara
- **Production API**: https://zantara-rag-backend-1064094238013.europe-west1.run.app

---

## 💡 Tips

- **New to the project?** Start with [QUICK_START.md](QUICK_START.md)
- **Understanding structure?** See [../STRUCTURE.md](../STRUCTURE.md)
- **Deploying?** Read [guides/RAILWAY_DEPLOYMENT_GUIDE.md](guides/RAILWAY_DEPLOYMENT_GUIDE.md)
- **Need API help?** See [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)
- **Project cleanup?** Check [reports/cleanup-2024/](reports/cleanup-2024/)

---

**Last Updated**: 2025-10-18
**Maintainer**: Bali Zero Team
**Status**: ✅ Production Ready

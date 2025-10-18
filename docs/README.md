# 📚 NUZANTARA Railway - Documentation

**Production-ready AI platform for Indonesian business services**

---

## 🚀 Quick Links

| What do you need? | Go here |
|-------------------|---------|
| **Get Started** | [QUICK_START.md](QUICK_START.md) |
| **System Overview** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **API Reference** | [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md) |
| **Deploy to Railway** | [railway/RAILWAY_STEP_BY_STEP.txt](railway/RAILWAY_STEP_BY_STEP.txt) |
| **Debug Issues** | [guides/DEBUGGING_GUIDE.md](guides/DEBUGGING_GUIDE.md) |

---

## 📁 Documentation Structure

```
docs/
├── README.md (you are here)
├── QUICK_START.md          # 5-minute overview
├── ARCHITECTURE.md          # System architecture
│
├── architecture/            # Detailed architecture docs
│   ├── AI_ROUTING.md       # How AI routing works
│   ├── BACKEND_TS.md       # TypeScript backend
│   ├── BACKEND_RAG.md      # Python RAG backend
│   └── ...
│
├── api/                     # API documentation
│   ├── API_DOCUMENTATION.md
│   └── ...
│
├── railway/                 # Railway deployment
│   ├── RAILWAY_STEP_BY_STEP.txt
│   ├── RAILWAY_ENV_SETUP.md
│   └── ...
│
└── guides/                  # How-to guides
    ├── DEBUGGING_GUIDE.md
    ├── RUNPOD_SETUP.md
    └── ...
```

---

## 🎯 Common Tasks

### First Time Setup
```bash
# 1. Read the quick start
cat docs/QUICK_START.md

# 2. Follow Railway deployment guide
cat docs/railway/RAILWAY_STEP_BY_STEP.txt

# 3. Configure environment variables
# See: docs/railway/RAILWAY_ENV_SETUP.md
```

### Debugging Deployment Issues
```bash
# Read debugging guide first!
cat docs/guides/DEBUGGING_GUIDE.md

# Check health
curl https://your-service.railway.app/health
```

### Understanding the System
```bash
# System overview
cat docs/ARCHITECTURE.md

# AI routing details
cat docs/architecture/AI_ROUTING.md

# Backend architecture
cat docs/architecture/BACKEND_TS.md
cat docs/architecture/BACKEND_RAG.md
```

---

## 🔗 External Links

- **Railway Dashboard**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
- **GitHub**: https://github.com/Balizero1987/nuzantara
- **Production API**: https://zantara-rag-backend-1064094238013.europe-west1.run.app

---

## 💡 Tips

- **New to the project?** Start with [QUICK_START.md](QUICK_START.md)
- **Deploy failing?** Read [guides/DEBUGGING_GUIDE.md](guides/DEBUGGING_GUIDE.md) first
- **Understanding AI?** Check [architecture/AI_ROUTING.md](architecture/AI_ROUTING.md)
- **Need API help?** See [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)

---

**Last Updated**: 2025-10-18
**Maintainer**: Bali Zero Team
**Status**: ✅ Production Ready

# 🚀 ZANTARA v5.2.0 - Startup Procedure

## 📍 Working Directory
```bash
cd ~/Desktop/NUZANTARA
```

## 📋 Standard Startup Sequence

### 1️⃣ **Read Core Documentation**
```bash
# Essential files to understand the system
cat AI_START_HERE.md          # System overview and architecture
cat TEST_SUITE.md              # Complete test documentation
```

### 2️⃣ **Check Previous Session**
```bash
# Review what was done in the last session
cat HANDOVER_LOG.md            # Detailed session history
tail -50 HANDOVER_LOG.md       # Quick view of latest updates
```

### 3️⃣ **Review Current Tasks**
```bash
# Check what needs to be done
cat TODO_CURRENT.md            # Active task list
cat OPERATING_RULES.md         # Development guidelines
```

### 4️⃣ **System Health Check**
```bash
# Verify the system is operational
npm run health-check           # Check local server status

# Check Cloud Run services
curl -s https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app/health | jq
curl -s https://zantara-v520-production-1064094238013.europe-west1.run.app/health | jq
```

### 5️⃣ **Start Development Server** (if needed)
```bash
# Start local development environment
npm start                      # Runs on port 8080

# OR for development with auto-reload
npm run dev                    # Uses tsx watch mode
```

## 🧪 Quick Tests

### Test Local Server
```bash
# Basic health check
curl http://localhost:8080/health

# Test a handler
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "test.echo", "params": {"message": "Hello ZANTARA"}}'
```

### Test Production Services
```bash
# Test ChatGPT-Patch service
./test-v520-production.mjs

# Run all handler tests
npm run test:all
```

## 📁 Key Directories

- **`/src`** - TypeScript source code
- **`/dist`** - Compiled JavaScript
- **`/zantara_webapp`** - Frontend applications
- **`/zantara-rag`** - RAG system (Python)
- **`/nuzantara-brain`** - Knowledge system
- **`/KB`** - Knowledge base (to be populated)

## 🔑 Environment Variables

Already configured in `.env`:
- API Keys: OpenAI, Anthropic, Gemini, Cohere, GROQ
- Firebase: Service account configured
- Google Drive: AMBARADAM drive connected

## 🚨 Important Notes

1. **Knowledge Base**: Currently EMPTY - needs population from Desktop/KB
2. **Docker Issue**: ChatGPT-Patch service needs rebuild (use `deploy-rebuild.sh`)
3. **Branch**: Working on `feat/pricing-official-2025`
4. **Local matches**: Cloud Run `zantara-v520-chatgpt-patch` service

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| TypeScript Backend | ✅ Working | v5.2.0-alpha |
| Cloud Run ChatGPT-Patch | ✅ Live | Needs Docker rebuild for updates |
| Cloud Run Production | ✅ Live | Backup service |
| RAG System | ⚠️ Configured | No data (0 embeddings) |
| Knowledge Base | ❌ Empty | Needs population |
| GROQ Integration | 🟡 Ready | API key configured, needs implementation |

## 🎯 Quick Commands Reference

```bash
# Navigation
cd ~/Desktop/NUZANTARA         # Go to project

# Information
ls -la                         # List all files
git status                     # Check git status
npm run health-check           # Check system health

# Development
npm start                      # Start server
npm run dev                    # Start with auto-reload
npm run build                  # Build TypeScript
npm test                       # Run tests

# Deployment
./deploy-rebuild.sh            # Rebuild and deploy to Cloud Run
./deploy-v520-production.sh    # Deploy to production

# Testing
./test-all-handlers.sh         # Test all 39 handlers
./test-v520-production.mjs     # Test production endpoints
```

---

**Remember**: Always check `HANDOVER_LOG.md` first to understand the current state!
# 🚀 ZANTARA v5.2.0 - QUICK START GUIDE

## ✅ System Status: FULLY OPERATIONAL

```
🟢 Server:    Running on port 8080
✅ Handlers:  37/37 testable passing (100%)
⚡ Response:  ~52ms average
💾 Memory:    79MB / 85MB
🎯 Uptime:    Stable
```

---

## 🎯 Quick Actions

### 1. Check System Health
```bash
curl http://localhost:8080/health | jq
```

### 2. Run Full Test Suite
```bash
./test-all-handlers.sh
```

### 3. Open Chat Interface
```bash
open zantara-intelligence-v7-fixed.html
# Or visit: file:///Users/antonellosiano/Desktop/zantara-bridge%20chatgpt%20patch/zantara-intelligence-v7-fixed.html
```

### 4. Test a Handler
```bash
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"team.list","params":{}}'
```

---

## 🔑 API Key

**Development**: `zantara-internal-dev-key-2025`

---

## 📋 Most Useful Endpoints

### Get Team Members
```bash
curl -X POST http://localhost:8080/call \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"key":"team.list","params":{}}'
```

### Get Pricing
```bash
curl -X POST http://localhost:8080/call \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"key":"pricing.official","params":{}}'
```

### KBLI Lookup (Restaurant)
```bash
curl -X POST http://localhost:8080/call \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"key":"kbli.lookup","params":{"query":"restaurant"}}'
```

### AI Chat
```bash
curl -X POST http://localhost:8080/ai.chat \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What services does Bali Zero offer?"}'
```

### Contact Info
```bash
curl -X GET http://localhost:8080/contact.info \
  -H "x-api-key: zantara-internal-dev-key-2025"
```

---

## 📁 Key Files

| File | Description |
|------|-------------|
| `AI_START_HERE.md` | Initial setup guide |
| `TEST_SUITE.md` | Complete test documentation |
| `TEST_RESULTS_SUMMARY.md` | Latest test results |
| `HANDOVER_LOG.md` | Development history |
| `TODO_CURRENT.md` | Current tasks |
| `test-all-handlers.sh` | Automated test suite |
| `zantara-intelligence-v7-fixed.html` | Chat interface |

---

## 🧪 Testing

### Run All Tests
```bash
./test-all-handlers.sh
```

### Test Specific Handler
```bash
# Memory test
curl -X POST http://localhost:8080/call \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"key":"memory.save","params":{"userId":"test","key":"mykey","content":"mydata"}}'
```

---

## 🎯 Handler Categories

### ✅ Working (37 handlers)
- System & Health (3)
- Memory System (3)
- AI Core (5) - OpenAI, Claude, Gemini, Cohere
- AI Advanced (3)
- Oracle System (3)
- Advisory (2)
- Business (5)
- KBLI (2) - Indonesian business codes
- Identity (2)
- Translation (2)
- Creative AI (1)
- ZANTARA Intelligence (5)
- Google Workspace (1)

### ⏭️ Need Config (10 handlers)
- Media handlers (4) - Need image/audio data
- Communication (3) - Need webhook URLs
- Google Workspace (3) - Need domain delegation

---

## 🔧 Common Commands

### Start Server
```bash
npm start
```

### Build Project
```bash
npm run build
```

### Health Check
```bash
npm run test:health
# or
curl http://localhost:8080/health
```

### View Metrics
```bash
curl http://localhost:8080/metrics | jq
```

### View API Docs
```bash
open http://localhost:8080/docs
```

---

## 🐛 Troubleshooting

### Server Not Running?
```bash
# Check if server is up
curl http://localhost:8080/health

# If not, start it
npm start
```

### Permission Denied?
```bash
chmod +x test-all-handlers.sh
```

### Port Already in Use?
```bash
# Find process on port 8080
lsof -i :8080

# Kill if needed
kill -9 <PID>
```

---

## 📊 Current Status

**Last Test**: 2025-09-30  
**Success Rate**: 100% (37/37)  
**Response Time**: ~52ms  
**Error Rate**: 0%  
**Status**: 🟢 FULLY OPERATIONAL

---

## 🎓 Learn More

- **Full Test Suite**: `cat TEST_SUITE.md`
- **Test Results**: `cat TEST_RESULTS_SUMMARY.md`
- **API Documentation**: http://localhost:8080/docs
- **Development Log**: `cat HANDOVER_LOG.md`

---

## 🆘 Quick Help

```bash
# View this guide
cat QUICK_START.md

# View all available tests
cat TEST_SUITE.md

# Check system status
curl http://localhost:8080/health | jq

# Run comprehensive tests
./test-all-handlers.sh
```

---

**ZANTARA v5.2.0** - Ready for action! 🚀

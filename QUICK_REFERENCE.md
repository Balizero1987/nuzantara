# ⚡ QUICK REFERENCE - Zantara Production

## 🚀 Production URL
https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app

## 🔑 Authentication
**API Key:** `zantara-internal-dev-key-2025`

## 📞 Test Commands

### Calendar
```bash
# List events
curl -X POST "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"calendar.list","params":{}}'

# Create meeting
curl -X POST "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key":"calendar.create",
    "params":{
      "summary":"Test Meeting",
      "start":{"dateTime":"2025-10-10T14:00:00+08:00"},
      "end":{"dateTime":"2025-10-10T15:00:00+08:00"}
    }
  }'
```

### Gmail
```bash
# List inbox
curl -X POST "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"gmail.list","params":{"maxResults":5}}'
```

### Drive
```bash
# List files
curl -X POST "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"drive.list","params":{"pageSize":10}}'
```

### Pricing (Anti-hallucination)
```bash
# Get official prices
curl -X POST "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"bali.zero.pricing","params":{"service":"Working KITAS"}}'
```

## 🧪 Run Tests Locally
```bash
# All handler tests
npm test

# Specific handler
npx jest pricing.test.ts

# Python RAG tests
cd "apps/backend-rag 2/backend"
pytest tests/
```

## 📊 Key Metrics
- **Handlers**: 150+ active
- **Tests**: 127/128 passing (99.2%)
- **Coverage**: 70%
- **Google Workspace**: 25 handlers active
- **Response Time**: < 1s average

## 🔧 Configuration
- **Service Account:** `zantara-bridge-v2@involuted-box-469105-r0.iam.gserviceaccount.com`
- **Impersonating:** `zero@balizero.com`
- **Region:** `europe-west1`
- **Memory:** 2Gi
- **CPU:** 2 cores
- **Max Instances:** 10

## 📚 Documentation
- Full Report: `SESSION_REPORT_2025-10-05.md`
- Handler Map: `HANDLER_EXPORTS_MAP.md`
- Test Report: `FINAL_TEST_REPORT.md`

## ✅ Production Ready Features
✅ Anti-hallucination pricing  
✅ Oracle business simulation  
✅ KBLI database lookup  
✅ Google Calendar integration  
✅ Gmail automation  
✅ Google Drive management  
✅ Google Sheets tracking  
✅ Memory system  
✅ Team management  
✅ WhatsApp integration  

**Status:** 🟢 ALL SYSTEMS OPERATIONAL

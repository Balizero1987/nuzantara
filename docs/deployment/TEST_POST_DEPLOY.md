# 🧪 Test Post-Deployment - Script Completo

**Data:** 2025-01-27
**Commit:** Deploy optimizations

---

## 🎯 Test da Eseguire

### 1. Health Checks

```bash
# Backend TypeScript
curl -s https://nuzantara-backend.fly.dev/health | jq '.'

# Backend RAG
curl -s https://nuzantara-rag.fly.dev/health | jq '.'
```

### 2. Smoke Tests Completi

Eseguire gli script nella sezione seguente.

---

## 📋 Script Automatico

```bash
#!/bin/bash

set -e

echo "🧪 Running Post-Deployment Tests..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0
TOTAL=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local expected_codes=$3

  TOTAL=$((TOTAL + 1))
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

  if echo "$expected_codes" | grep -q "$HTTP_CODE"; then
    echo -e "${GREEN}✅ $name: HTTP $HTTP_CODE${NC}"
    return 0
  else
    echo -e "${RED}❌ $name: HTTP $HTTP_CODE (expected: $expected_codes)${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Function to test endpoint with response
test_endpoint_json() {
  local name=$1
  local url=$2
  local expected_codes=$3

  TOTAL=$((TOTAL + 1))
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

  if echo "$expected_codes" | grep -q "$HTTP_CODE"; then
    echo -e "${GREEN}✅ $name: HTTP $HTTP_CODE${NC}"
    echo "Response:"
    curl -s "$url" | jq '.' | head -10
    echo ""
    return 0
  else
    echo -e "${RED}❌ $name: HTTP $HTTP_CODE (expected: $expected_codes)${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo "=== BACKEND TYPESCRIPT TESTS ==="
echo ""

# Backend TypeScript Tests
test_endpoint_json "Backend TS - Health" "https://nuzantara-backend.fly.dev/health" "200"
test_endpoint "Backend TS - Health Detailed" "https://nuzantara-backend.fly.dev/health/detailed" "200"
test_endpoint "Backend TS - AI Health" "https://nuzantara-backend.fly.dev/api/monitoring/ai-health" "200"
test_endpoint "Backend TS - Auth Verify" "https://nuzantara-backend.fly.dev/api/auth/verify" "200 401 400"

echo ""
echo "=== BACKEND RAG TESTS ==="
echo ""

# Backend RAG Tests
test_endpoint_json "Backend RAG - Health" "https://nuzantara-rag.fly.dev/health" "200"
test_endpoint "Backend RAG - Oracle Health" "https://nuzantara-rag.fly.dev/api/oracle/health" "200"
test_endpoint "Backend RAG - Auth Verify" "https://nuzantara-rag.fly.dev/api/auth/verify" "200 401 400"

echo ""
echo "=== SUMMARY ==="
echo "Total tests: $TOTAL"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED test(s) failed${NC}"
  exit 1
fi
```

---

## 🚀 Esecuzione

```bash
# Make script executable
chmod +x test-post-deploy.sh

# Run tests
./test-post-deploy.sh

# Or run inline
bash <(cat test-post-deploy.sh)
```

---

## 📊 Expected Results

### Backend TypeScript
- ✅ `/health`: 200 OK
- ✅ `/health/detailed`: 200 OK
- ✅ `/api/monitoring/ai-health`: 200 OK
- ✅ `/api/auth/verify`: 200/401/400 (endpoint responds)

### Backend RAG
- ✅ `/health`: 200 OK
- ✅ `/api/oracle/health`: 200 OK (may be optional)
- ✅ `/api/auth/verify`: 200/401/400 (endpoint responds)

---

## 🔍 Monitoring

```bash
# Watch logs during tests
flyctl logs --app nuzantara-backend --since 5m &
flyctl logs --app nuzantara-rag --since 5m &

# Check status
flyctl status --app nuzantara-backend
flyctl status --app nuzantara-rag
```

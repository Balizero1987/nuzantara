# Handover: Testing

Category: `testing`

---

## 2025-10-02 00:30 (Post-Deploy Regression Tests) [sonnet-4.5_m2]

**Tests Executed**: 4/4
**Status**: ✅ All passing after fixes

| Test | Result | Details |
|------|--------|---------|
| Backend Health | ✅ PASS | Service running, metrics OK, service account via ADC |
| RPC `/call` endpoint | ✅ PASS | Bridge.js error fixed, handlers functional |
| RAG Backend Privacy | ✅ PASS | 403 Forbidden on public access |
| Frontend XSS Protection | ✅ PASS | DOMPurify active in production |

**Issues Found & Fixed**:
1. ❌ Bridge.js MODULE_NOT_FOUND → ✅ Fixed (disabled legacy bridge)
2. ❌ RAG backend public → ✅ Fixed (IAM policy service-to-service only)

**Test Commands**:
```bash
# Health check
curl -s https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health

# RPC endpoint
curl -s 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-external-dev-key-2025' \
  --data-raw '{"key":"ai.chat","params":{"message":"test"}}'

# RAG privacy check
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
# Expected: 403 Forbidden
```

**Related**:
→ Full session: [.claude/diaries/2025-10-01_sonnet-4.5_m2.md](#test-results)

---

## 2025-10-02 01:00 (End-to-End Integration Tests) [sonnet-4.5_m3]

**Tests Executed**: 3/3
**Status**: ✅ All passing

| Test | Result | Details |
|------|--------|---------|
| End-to-End Chat Flow | ✅ PASS | RAG proxy → ZANTARA response (haiku) |
| Service-to-Service Auth | ✅ PASS | JWT tokens auto-injected, 403 blocked public |
| XSS Browser Test | ✅ PASS | DOMPurify blocked all 5 payloads |

**Test Commands**:
```bash
# E2E chat flow
curl 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/api/rag/bali-zero' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-external-dev-key-2025' \
  --data '{"query":"Who are you?","user_role":"member"}'
# Expected: 200 OK with ZANTARA response

# Public RAG access (should fail)
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
# Expected: 403 Forbidden
```

**XSS Payloads Tested** (all blocked):
- `<img src=x onerror="alert('XSS')">`
- `<script>alert('XSS')</script>`
- `<svg onload="alert('XSS')"></svg>`

**Cumulative Testing** (M2 + M3):
- Tests run: 7
- Tests passing: 7
- Success rate: **100%**

**Related**:
→ Full session: [.claude/diaries/2025-10-01_sonnet-4.5_m3.md](#session-complete)

---

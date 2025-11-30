# Test Coverage Analysis Report
**Date:** 2025-11-30
**Total Coverage:** 57.94%
**Tests Executed:** 1886 tests (1485 passed, 1 failed)
**Target Coverage:** 70%
**Gap:** -12.06%

---

## 📊 Executive Summary

Il progetto Nuzantara ha **1886 unit tests** con una coverage media del **57.94%**, sotto il target del 70%.

### Key Metrics:
- ✅ **38 files** con 100% coverage
- 🟢 **Alta coverage (>90%):** 25+ files
- 🟡 **Media coverage (50-80%):** ~30 files
- 🔴 **Bassa coverage (<50%):** ~40 files
- ⚫ **Zero coverage:** ~20 files

---

## 🔴 CRITICAL: Files with 0% Coverage

Questi file NON hanno test e richiedono attenzione immediata:

| File | Lines | Priority |
|------|-------|----------|
| `backend/app/main_cloud.py` | 336 | 🔥 **CRITICAL** - Main entrypoint! |
| `backend/app/metrics.py` | 97 | 🔥 **HIGH** - Observability |
| `backend/app/routers/simple_jaksel_caller_hf.py` | 76 | HIGH |
| `backend/core/embeddings_local.py` | 35 | MEDIUM |
| `backend/plugins/registry.py` | 55 | MEDIUM |
| `backend/plugins/*` | 100+ | LOW - Plugin system |
| `backend/agents/run_*.py` | 100+ | LOW - Training scripts |

---

## 🟠 LOW Coverage (<50%): Priority Targets

### Services (Backend Logic)
| File | Coverage | Missing Lines | Priority |
|------|----------|--------------|----------|
| `team_analytics_service.py` | 5.43% | 204/221 | 🔥 HIGH |
| `search_service.py` | 7.67% | 257/284 | 🔥 HIGH |
| `tool_executor.py` | 8.40% | 87/97 | HIGH |
| `session_service.py` | 9.28% | 175/197 | HIGH |
| `work_session_service.py` | 11.83% | 119/139 | MEDIUM |
| `semantic_cache.py` | 14.67% | 102/124 | MEDIUM |
| `smart_oracle.py` | 16.04% | 72/88 | MEDIUM |
| `streaming_service.py` | 16.67% | 52/66 | MEDIUM |

### Routers (API Endpoints)
| File | Coverage | Missing Lines | Priority |
|------|----------|--------------|----------|
| `routers/simple_jaksel_caller_*.py` | 9-12% | ~200 | HIGH |
| `routers/intel.py` | 20.86% | 95/129 | MEDIUM |
| `routers/search.py` | 24.44% | 28/39 | MEDIUM |
| `routers/oracle_universal.py` | 30.16% | 321/487 | HIGH |
| `routers/memory_vector.py` | 31.47% | 111/173 | MEDIUM |
| `routers/media.py` | 32.26% | 15/25 | LOW |
| `routers/oracle_ingest.py` | 36.05% | 47/78 | MEDIUM |
| `routers/team_activity.py` | 36.07% | 112/191 | MEDIUM |
| `routers/ingest.py` | 36.27% | 51/86 | MEDIUM |

### Middleware & Utils
| File | Coverage | Missing Lines | Priority |
|------|----------|--------------|----------|
| `utils/response_sanitizer.py` | 6.74% | 61/67 | HIGH |
| `utils/tier_classifier.py` | 26.67% | 25/37 | MEDIUM |
| `routing/specialized_service_router.py` | 12.80% | 79/95 | MEDIUM |
| `routing/response_handler.py` | 45.83% | 11/22 | LOW |

---

## 🟡 MEDIUM Coverage (50-80%): Needs Improvement

| File | Coverage | Gap to 80% |
|------|----------|------------|
| `llm/zantara_ai_client.py` | 56.27% | -23.73% |
| `memory_service_postgres.py` | 58.62% | -21.38% |
| `conversations.py` | 59.40% | -20.60% |
| `crm_clients.py` | 60.38% | -19.62% |
| `cultural_rag_service.py` | 60.40% | -19.60% |
| `auth.py` | 62.60% | -17.40% |
| `crm_practices.py` | 63.33% | -16.67% |
| `notifications.py` | 64.15% | -15.85% |
| `hybrid_auth.py` | 67.72% | -12.28% |
| `agents.py` | 69.06% | -10.94% |
| `personality_service.py` | 69.29% | -10.71% |
| `query_router.py` | 70.75% | -9.25% |
| `embeddings.py` | 72.58% | -7.42% |
| `notification_hub.py` | 74.53% | -5.47% |
| `golden_answer_service.py` | 75.35% | -4.65% |
| `health.py` | 76.00% | -4.00% |
| `intelligent_router.py` | 78.09% | -1.91% |

---

## ✅ EXCELLENT Coverage (>95%): Well Tested!

| File | Coverage | Status |
|------|----------|--------|
| `ai_crm_extractor.py` | 98.73% | ✅ |
| `qdrant_db.py` | 98.70% | ✅ |
| `client_journey_orchestrator.py` | 98.62% | ✅ |
| `alert_service.py` | 98.50% | ✅ |
| `context_builder.py` | 98.11% | ✅ |
| `rate_limiter.py` | 97.92% | ✅ |
| `config.py` | 97.87% | ✅ |
| `autonomous_research_service.py` | 97.70% | ✅ |
| `memory_fact_extractor.py` | 97.26% | ✅ |
| `chunker.py` | 97.00% | ✅ |
| `citation_service.py` | 96.85% | ✅ |
| `knowledge_service.py` | 96.47% | ✅ |
| `collection_health_service.py` | 95.99% | ✅ |
| `knowledge_graph_builder.py` | 95.97% | ✅ |

---

## 📦 Coverage by Module

| Module | Avg Coverage | Files | Status |
|--------|--------------|-------|--------|
| `middleware/` | ~85% | 3 | 🟢 Good |
| `services/` (core) | ~80% | 30+ | 🟢 Good |
| `services/` (analytics) | ~15% | 10 | 🔴 Critical |
| `app/routers/` | ~50% | 25 | 🟡 Needs work |
| `app/modules/` | ~90% | 5 | 🟢 Excellent |
| `core/` | ~75% | 8 | 🟢 Good |
| `plugins/` | 0% | 10 | 🔴 No tests |
| `agents/` | ~15% | 6 | 🔴 Very low |

---

## 🎯 Recommended Priorities

### IMMEDIATE (Week 1):
1. ✅ **Fix failing test:** `test_router_ingest.py::test_upload_and_ingest_success`
2. 🔴 **Add tests for `main_cloud.py`** (critical entrypoint)
3. 🔴 **Test `team_analytics_service.py`** (5.43% → 70%+)
4. 🔴 **Test `search_service.py`** (7.67% → 70%+)

### SHORT TERM (Week 2-3):
5. 🟠 Test Jaksel AI routers (9-12% → 70%+)
6. 🟠 Test `oracle_universal.py` (30% → 70%+)
7. 🟠 Improve `zantara_ai_client.py` (56% → 80%+)
8. 🟠 Test `session_service.py` & `work_session_service.py`

### MEDIUM TERM (Month 1):
9. 🟡 Improve all 50-80% files to >80%
10. 🟡 Add plugin system tests
11. 🟡 Test agent training scripts

### LONG TERM (Month 2):
12. 🎯 Reach 80% total coverage
13. 🎯 100% coverage on critical paths
14. 🎯 Integration tests for end-to-end flows

---

## 🐛 Known Issues

1. **1 failing test:** `test_router_ingest.py::test_upload_and_ingest_success`
   - Error: `assert 500 == 200` (Internal Server Error)
   - Needs investigation

2. **3 runtime warnings:** In `personality_service.py`
   - `RuntimeWarning: coroutine 'AsyncMockMixin._execute_mock_call' was never awaited`
   - Async mocking issue in tests

---

## 📈 Path to 70% Coverage

**Current:** 57.94%
**Target:** 70.00%
**Gap:** 12.06%

### Estimated Effort:
- Add tests for 0% coverage files: **~500 lines** → +5%
- Improve <50% files to 70%: **~1000 lines** → +6%
- Quick wins (50-70% → 80%): **~300 lines** → +2%

**Total:** ~1800 test lines to reach 70%

### Timeline:
- **2 weeks** with dedicated effort
- **1 month** alongside feature development

---

## 🎓 Coverage Best Practices

### What's Working Well:
✅ Core services (AI, CRM, memory) have excellent coverage
✅ Infrastructure (DB, cache, middleware) well tested
✅ Consistent use of mocking and fixtures
✅ Test organization by module

### Areas for Improvement:
❌ API routers need more endpoint tests
❌ Plugin system completely untested
❌ Analytics/metrics services undertested
❌ Main entrypoint (`main_cloud.py`) has 0% coverage

### Recommendations:
1. **Enforce 70% minimum** on new code via CI/CD
2. **Add integration tests** for critical flows
3. **Test error paths** not just happy paths
4. **Mock external dependencies** (AI APIs, DBs)
5. **Test async code** properly with pytest-asyncio

---

**Generated:** 2025-11-30
**Next Review:** 2025-12-15
**Owner:** @Balizero1987

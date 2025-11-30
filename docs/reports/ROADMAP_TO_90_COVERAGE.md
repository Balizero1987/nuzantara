# 🎯 Roadmap to 90% Test Coverage

**Current Coverage:** 57.94%
**Target Coverage:** 90.00%
**Gap:** 32.06% (4,020 statements)

**Generated:** 2025-11-30
**Status:** Ready for Execution

---

## 📊 Executive Summary

Per raggiungere il **90% di coverage**, dobbiamo:

- ✍️ Scrivere **~8,040 linee di test** (ratio 2x)
- 📁 Creare/aggiornare **~40 file di test**
- 🎯 Migliorare **80 files** esistenti
- ⏱️ Tempo stimato: **6 settimane** (2 devs) / **13 settimane** (1 dev)

---

## 🔥 TOP 20 FILES - Priorità Assoluta

| # | File | Impact | Coverage | Priority |
|---|------|--------|----------|----------|
| 1 | `app/main_cloud.py` | **302** | 0.0% | 🔥 CRITICAL |
| 2 | `app/routers/oracle_universal.py` | **272** | 30.2% | 🔥 CRITICAL |
| 3 | `services/search_service.py` | **228** | 7.7% | 🔥 CRITICAL |
| 4 | `services/team_analytics_service.py` | **181** | 5.4% | 🔥 CRITICAL |
| 5 | `services/session_service.py` | **155** | 9.3% | 🔥 CRITICAL |
| 6 | `services/work_session_service.py` | 105 | 11.8% | 🔴 HIGH |
| 7 | `app/routers/memory_vector.py` | 93 | 31.5% | 🔴 HIGH |
| 8 | `app/routers/team_activity.py` | 92 | 36.1% | 🔴 HIGH |
| 9 | `services/team_timesheet_service.py` | 92 | 16.9% | 🔴 HIGH |
| 10 | `agents/agents/knowledge_graph_builder.py` | 91 | 15.1% | 🔴 HIGH |
| 11 | `services/semantic_cache.py` | 89 | 14.7% | 🟠 MEDIUM |
| 12 | `app/metrics.py` | 87 | 0.0% | 🟠 MEDIUM |
| 13 | `app/routers/crm_interactions.py` | 87 | 46.6% | 🟠 MEDIUM |
| 14 | `agents/agents/client_value_predictor.py` | 85 | 14.2% | 🟠 MEDIUM |
| 15 | `app/routers/simple_jaksel_caller_translation.py` | 84 | 11.7% | 🟠 MEDIUM |
| 16 | `app/routers/intel.py` | 82 | 20.9% | 🟠 MEDIUM |
| 17 | `core/plugins/executor.py` | 79 | 36.8% | 🟠 MEDIUM |
| 18 | `services/tool_executor.py` | 77 | 8.4% | 🟠 MEDIUM |
| 19 | `core/plugins/registry.py` | 76 | 35.8% | 🟠 MEDIUM |
| 20 | `app/routers/simple_jaksel_caller_hf_italian.py` | 75 | 10.2% | 🟠 MEDIUM |

**Solo questi 20 file danno: 2,560 statements = 19.4% di coverage!**

---

## 📋 Implementation Plan - 3 Fasi

### 🔴 PHASE 1: CRITICAL FILES (0-30% coverage)
**Timeline:** 6 settimane
**Files:** 40
**Impact:** 2,673 statements → +20.3% coverage
**Test lines:** ~5,346 lines

#### Top Files Phase 1:
1. `app/main_cloud.py` (336 stmts, 0% → 90%) - **302 impact** 🔥
2. `services/search_service.py` (284 stmts, 7.7% → 90%) - **228 impact** 🔥
3. `services/team_analytics_service.py` (221 stmts, 5.4% → 90%) - **181 impact** 🔥
4. `services/session_service.py` (197 stmts, 9.3% → 90%) - **155 impact** 🔥
5. `services/work_session_service.py` (139 stmts, 11.8% → 90%) - **105 impact**
6. `services/team_timesheet_service.py` (134 stmts, 16.9% → 90%) - **92 impact**
7. `agents/agents/knowledge_graph_builder.py` (126 stmts, 15.1% → 90%) - **91 impact**
8. `services/semantic_cache.py` (124 stmts, 14.7% → 90%) - **89 impact**
9. `app/metrics.py` (97 stmts, 0% → 90%) - **87 impact**
10. `agents/agents/client_value_predictor.py` (120 stmts, 14.2% → 90%) - **85 impact**

... + 30 files aggiuntivi

**Deliverable:** Coverage passa da 57.94% → ~78%

---

### 🟠 PHASE 2: MEDIUM FILES (30-60% coverage)
**Timeline:** 2 settimane
**Files:** 16
**Impact:** 1,081 statements → +8.2% coverage
**Test lines:** ~2,162 lines

#### Top Files Phase 2:
1. `app/routers/oracle_universal.py` (487 stmts, 30.2% → 90%) - **272 impact** 🔥
2. `app/routers/memory_vector.py` (173 stmts, 31.5% → 90%) - **93 impact**
3. `app/routers/team_activity.py` (191 stmts, 36.1% → 90%) - **92 impact**
4. `app/routers/crm_interactions.py` (217 stmts, 46.6% → 90%) - **87 impact**
5. `core/plugins/executor.py` (161 stmts, 36.8% → 90%) - **79 impact**
6. `core/plugins/registry.py` (151 stmts, 35.8% → 90%) - **76 impact**
7. `llm/zantara_ai_client.py` (231 stmts, 56.3% → 90%) - **67 impact**
8. `app/routers/crm_shared_memory.py` (137 stmts, 43.9% → 90%) - **63 impact**
9. `services/pricing_service.py` (163 stmts, 50.6% → 90%) - **55 impact**
10. `services/memory_service_postgres.py` (184 stmts, 58.6% → 90%) - **49 impact**

... + 6 files aggiuntivi

**Deliverable:** Coverage passa da ~78% → ~86%

---

### 🟡 PHASE 3: POLISH FILES (60-90% coverage)
**Timeline:** 4 settimane
**Files:** 24
**Impact:** 409 statements → +3.1% coverage
**Test lines:** ~818 lines

#### Top Files Phase 3:
1. `app/routers/crm_clients.py` (232 stmts, 60.4% → 90%) - **64 impact**
2. `app/routers/crm_practices.py` (238 stmts, 63.3% → 90%) - **60 impact**
3. `services/personality_service.py` (218 stmts, 69.3% → 90%) - **39 impact**
4. `services/query_router.py` (183 stmts, 70.8% → 90%) - **30 impact**
5. `app/routers/auth.py` (111 stmts, 62.6% → 90%) - **26 impact**
6. `services/cultural_rag_service.py` (85 stmts, 60.4% → 90%) - **23 impact**
7. `app/routers/agents.py` (125 stmts, 69.1% → 90%) - **22 impact**
8. `middleware/hybrid_auth.py` (103 stmts, 67.7% → 90%) - **22 impact**
9. `core/embeddings.py` (108 stmts, 72.6% → 90%) - **21 impact**
10. `services/golden_answer_service.py` (118 stmts, 75.3% → 90%) - **19 impact**

... + 14 files aggiuntivi

**Deliverable:** Coverage passa da ~86% → **90%+** ✅

---

## ⏱️ Timeline & Resources

### Scenario 1: Team di 2 Developers
```
Week 1-2:   Phase 1 start (20 files) → 68% coverage
Week 3-4:   Phase 1 complete → 78% coverage
Week 5-6:   Phase 2 complete → 86% coverage
Week 7-10:  Phase 3 complete → 90% coverage ✅
```
**Total: 10 settimane**

### Scenario 2: Single Developer
```
Week 1-3:   Phase 1 (first 15 files) → 70% coverage
Week 4-6:   Phase 1 complete → 78% coverage
Week 7-8:   Phase 2 complete → 86% coverage
Week 9-13:  Phase 3 complete → 90% coverage ✅
```
**Total: 13 settimane**

### Scenario 3: Sprint Accelerato (3 devs)
```
Week 1-2:   Phase 1 (30 files) → 75% coverage
Week 3-4:   Phase 1+2 complete → 86% coverage
Week 5-6:   Phase 3 complete → 90% coverage ✅
```
**Total: 6 settimane**

---

## 🎯 Milestones & Checkpoints

### Milestone 1: 70% Coverage (Week 2-3)
**Required:**
- ✅ `main_cloud.py` testato
- ✅ `search_service.py` testato
- ✅ `team_analytics_service.py` testato
- ✅ Top 10 critical files completati
- ✅ CI/CD passa con 70% threshold

### Milestone 2: 80% Coverage (Week 4-6)
**Required:**
- ✅ Phase 1 completata (40 files)
- ✅ 50% di Phase 2 completata
- ✅ Tutti i routers principali >80%
- ✅ Services core >85%

### Milestone 3: 90% Coverage (Week 10-13)
**Required:**
- ✅ Tutte e 3 le fasi completate
- ✅ 80 files migliorati
- ✅ Coverage stabile >90%
- ✅ CI/CD con threshold 90%
- ✅ Documentazione completa

---

## 🚀 Quick Start - Week 1

### Day 1-2: Setup & Main Cloud
1. **Fix failing test**: `test_router_ingest.py::test_upload_and_ingest_success`
2. **Test `main_cloud.py`**: Entrypoint critico (302 impact!)
   - Test startup/shutdown
   - Test middleware loading
   - Test route registration
   - Test health checks

### Day 3-4: Search & Analytics
3. **Test `search_service.py`** (228 impact)
   - Test search functionality
   - Test filters & pagination
   - Test error handling
4. **Test `team_analytics_service.py`** (181 impact)
   - Test metrics calculation
   - Test aggregations
   - Test date ranges

### Day 5: Session Management
5. **Test `session_service.py`** (155 impact)
   - Test session creation/deletion
   - Test session validation
   - Test cleanup

**Week 1 Target: +~8.5% coverage (1,100 statements)**

---

## 📝 Testing Guidelines

### Cosa Testare:
1. **Happy paths** - Flussi principali
2. **Error paths** - Gestione errori
3. **Edge cases** - Casi limite (empty, null, invalid)
4. **Async operations** - Proper async/await testing
5. **Mocks & fixtures** - External dependencies (DB, APIs)

### Pattern da Seguire:
```python
# test_my_service.py

@pytest.fixture
def mock_dependency():
    """Mock external dependency"""
    return MagicMock()

async def test_happy_path(mock_dependency):
    """Test: should succeed when inputs are valid"""
    service = MyService(mock_dependency)
    result = await service.do_something("valid_input")
    assert result == expected_value

async def test_error_handling(mock_dependency):
    """Test: should handle errors gracefully"""
    service = MyService(mock_dependency)
    with pytest.raises(ExpectedError):
        await service.do_something("invalid_input")

async def test_edge_case_empty(mock_dependency):
    """Test: should handle empty input"""
    service = MyService(mock_dependency)
    result = await service.do_something("")
    assert result is None
```

### Coverage Tools:
```bash
# Run tests with coverage
pytest tests/unit/ --cov=backend --cov-report=term --cov-report=html

# Check specific file
pytest tests/unit/test_my_service.py --cov=backend.services.my_service

# Generate report
python -m coverage report --skip-covered
```

---

## 📊 Progress Tracking

### Weekly Reporting:
- **Coverage %**: Tracking verso 90%
- **Files completed**: X/80
- **Test lines written**: X/8,326
- **Blockers**: Issues & dependencies

### Metrics Dashboard:
```
Current:    [████████████░░░░░░░░] 57.94%
Week 3:     [███████████████░░░░░] 70%
Week 6:     [█████████████████░░░] 80%
Week 13:    [████████████████████] 90% ✅
```

---

## 🎓 Best Practices

### DO:
- ✅ Follow existing test patterns
- ✅ Use meaningful test names
- ✅ Mock external dependencies
- ✅ Test error paths
- ✅ Write async tests properly
- ✅ Commit frequently (per file or small batch)
- ✅ Run tests locally before pushing

### DON'T:
- ❌ Test implementation details
- ❌ Skip error handling tests
- ❌ Ignore async warnings
- ❌ Copy-paste tests without adapting
- ❌ Leave TODOs in test code
- ❌ Commit failing tests
- ❌ Ignore coverage drops

---

## 🔧 Tools & Scripts

### Generate Roadmap:
```bash
python roadmap_to_90.py
```

### Analyze Coverage:
```bash
python analyze_coverage.py
```

### Run Tests:
```bash
# All tests
pytest tests/unit/ --cov=backend

# Specific module
pytest tests/unit/test_*.py -v

# With coverage
pytest --cov=backend --cov-report=html
```

---

## 📞 Support & Questions

- **Coverage issues**: Check `docs/reports/COVERAGE_ANALYSIS_2025.md`
- **Test patterns**: Check existing tests in `tests/unit/`
- **CI/CD**: See `.github/workflows/`
- **Questions**: @Balizero1987

---

**Let's get to 90%! 🚀**

_Generated: 2025-11-30_
_Next Update: Weekly_

# Oracle System → Backend RAG Migration Plan

**Created:** 2025-10-21
**Status:** Ready for Implementation
**Impact:** High - Consolidates duplicate systems into unified RAG backend

---

## Executive Summary

The **Oracle System** (TypeScript-based agents) and **Backend RAG** (Python-based) currently have overlapping functionality. This migration plan consolidates all Oracle agent intelligence into the superior Backend RAG infrastructure, eliminating duplication and leveraging PostgreSQL + ChromaDB for better performance and scalability.

### Key Benefits

✅ **Eliminate Duplication** - Remove 13 TypeScript files (~2000 LOC)
✅ **Semantic Search** - Upgrade from keyword matching to embedding-based search
✅ **Persistent Storage** - Replace JSON files with PostgreSQL
✅ **Scalability** - ChromaDB handles millions of documents
✅ **Multi-language** - Native support for EN/ID/IT
✅ **Already Connected** - Backend RAG already integrated with ZANTARA

---

## Current State Analysis

### Oracle System (TypeScript)

| Component | Location | Lines | Function | Status |
|-----------|----------|-------|----------|--------|
| VISA ORACLE | `projects/oracle-system/agents/visa-oracle/` | ~300 | Immigration intelligence | 🟡 Partially replaced |
| KBLI EYE | `projects/oracle-system/agents/kbli-eye/` | ~500 | Business classification | 🔴 Not replaced yet |
| TAX GENIUS | `projects/oracle-system/agents/tax-genius/` | ~200 | Tax intelligence | 🔴 In development |
| LEGAL ARCHITECT | `projects/oracle-system/agents/legal-architect/` | ~150 | Property/legal | 🔴 In development |
| MORGANA | `projects/oracle-system/agents/morgana/` | ~300 | Content creation | ⚠️ Keep separate |
| Simulation Engine | `projects/oracle-system/agents/simulation-engine/` | ~400 | Multi-agent sim | ⚠️ Evaluate separately |
| **Total** | | **~1,850** | | |

**Knowledge Bases:**
- `visa-oracle-kb.json` - 286 lines (visa types, offices, issues)
- `kbli-eye-kb.json` - 395 lines (business structures, KBLI codes, licenses)

### Backend RAG (Python)

| Component | Location | Function | Status |
|-----------|----------|----------|--------|
| Intel API | `apps/backend-rag/backend/app/routers/intel.py` | Semantic search across 8 collections | ✅ Active |
| Immigration Scraper | `apps/backend-rag/backend/scrapers/immigration_scraper.py` | T1/T2/T3 tiered scraping | ✅ Active |
| PostgreSQL | Multiple schemas | User data, memory, work sessions | ✅ Active |
| ChromaDB | 8 collections | Vector search (immigration, bkpm_tax, etc) | ✅ Active |
| Embeddings | `core/embeddings.py` | OpenAI embeddings generation | ✅ Active |

**Existing Collections:**
1. `bali_intel_immigration` ✅
2. `bali_intel_bkpm_tax` ✅
3. `bali_intel_realestate` ✅
4. `bali_intel_events` ✅
5. `bali_intel_social` ✅
6. `bali_intel_competitors` ✅
7. `bali_intel_bali_news` ✅
8. `bali_intel_roundup` ✅

---

## Migration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BEFORE (Duplicated)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Oracle System (TS)              Backend RAG (Python)              │
│  ├── visa-oracle.ts              ├── immigration_scraper.py        │
│  ├── kbli-eye.ts                 ├── intel.py (8 collections)      │
│  ├── oss-scraper.ts              ├── PostgreSQL                    │
│  ├── visa-oracle-kb.json         └── ChromaDB                      │
│  └── kbli-eye-kb.json                                              │
│                                                                     │
│  Problems:                                                          │
│  ❌ Duplication                                                     │
│  ❌ Keyword-based search                                            │
│  ❌ JSON file storage                                               │
│  ❌ Separate cron jobs                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        AFTER (Unified)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│              Backend RAG (Python) - Single Source of Truth          │
│              ┌─────────────────────────────────────┐               │
│              │         PostgreSQL                   │               │
│              │  ├── visa_types                     │               │
│              │  ├── immigration_offices            │               │
│              │  ├── business_structures            │               │
│              │  ├── kbli_codes                     │               │
│              │  ├── indonesian_licenses            │               │
│              │  └── compliance_deadlines           │               │
│              └─────────────────────────────────────┘               │
│                            ↕                                        │
│              ┌─────────────────────────────────────┐               │
│              │         ChromaDB                     │               │
│              │  ├── oracle_visa_knowledge          │               │
│              │  ├── oracle_kbli_knowledge          │               │
│              │  ├── bali_intel_immigration (live)  │               │
│              │  └── bali_intel_bkpm_tax (live)     │               │
│              └─────────────────────────────────────┘               │
│                            ↕                                        │
│              ┌─────────────────────────────────────┐               │
│              │      API Endpoints                   │               │
│              │  ├── /api/intel/search              │               │
│              │  ├── /api/oracle/visa/search        │               │
│              │  ├── /api/oracle/kbli/classify      │               │
│              │  └── /api/oracle/compliance/check   │               │
│              └─────────────────────────────────────┘               │
│                                                                     │
│  Benefits:                                                          │
│  ✅ Single source of truth                                          │
│  ✅ Semantic search with embeddings                                 │
│  ✅ Persistent, queryable database                                  │
│  ✅ Unified scraping pipeline                                       │
│  ✅ Already connected to ZANTARA                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Migration Plan - 3 Phases

### **PHASE 1: Database Migration** ✅ READY

**Goal:** Move static knowledge bases from JSON to PostgreSQL + ChromaDB

**Files Created:**
- ✅ `apps/backend-rag/backend/db/migrations/005_oracle_knowledge_bases.sql`
- ✅ `apps/backend-rag/migrate_oracle_kb.py`

**Database Tables Created:**

| Table | Purpose | Rows (Est.) |
|-------|---------|-------------|
| `visa_types` | Visa categories, requirements, costs | ~10 |
| `immigration_offices` | Office locations, hours, tips | ~5 |
| `immigration_issues` | Common problems and solutions | ~15 |
| `business_structures` | PT PMA, Local PT, CV, Yayasan | ~5 |
| `kbli_codes` | Business classification codes | ~15 |
| `kbli_combinations` | Pre-packaged KBLI sets | ~5 |
| `indonesian_licenses` | NIB, TDUP, SIUP, etc | ~10 |
| `oss_system_info` | OSS system metadata | ~5 |
| `oss_issues` | Common OSS problems | ~10 |
| `compliance_deadlines` | Tax/reporting calendar | ~20 |
| `regulatory_updates` | Recent changes log | ~5 |

**ChromaDB Collections:**
- `oracle_visa_knowledge` - Searchable visa information
- `oracle_kbli_knowledge` - Searchable business classification

**Steps to Execute:**

```bash
# 1. Apply SQL migration
cd apps/backend-rag/backend
psql $DATABASE_URL -f db/migrations/005_oracle_knowledge_bases.sql

# 2. Run Python migration script
cd ../..
python migrate_oracle_kb.py

# 3. Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM visa_types;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM kbli_codes;"
```

**Expected Results:**
- ✅ 11 new PostgreSQL tables populated
- ✅ 2 new ChromaDB collections with embeddings
- ✅ ~100 total rows of structured knowledge
- ✅ Ready for semantic queries

---

### **PHASE 2: Scraper Integration** 🔄 NEXT

**Goal:** Replace TypeScript scrapers with Python equivalents

#### 2.1 RSS Feed Integration

**Current (Oracle TS):**
```typescript
// projects/oracle-system/agents/visa-oracle/collector.ts
const VISA_SOURCES: IntelSource[] = [
  {
    id: 'imigrasi-news',
    url: 'https://news.google.com/rss/search?q=Direktorat%20Jenderal%20Imigrasi',
    type: 'rss',
    frequencyMinutes: 180,
  },
  // ... more sources
];
```

**Migrate to (Python):**
```python
# apps/backend-rag/backend/scrapers/immigration_scraper.py
# Add RSS sources to existing T1 sources
self.sources_t1.append({
    "name": "Imigrasi News RSS",
    "url": "https://news.google.com/rss/search?q=Direktorat%20Jenderal%20Imigrasi",
    "tier": "t1",
    "type": "rss",
    "selectors": ["item"]  # RSS items
})
```

#### 2.2 OSS Scraper Migration

**Current:** `projects/oracle-system/agents/kbli-eye/oss-scraper.ts` (536 lines)

**Create:** `apps/backend-rag/backend/scrapers/oss_scraper.py`

**Key Features to Port:**
- Puppeteer → Playwright (Python)
- Cron scheduling → APScheduler
- OSS.go.id, BKPM, Kemenkumham sources
- System status monitoring
- Issue classification (critical/high/medium/low)

**Pseudocode:**
```python
class OSSScraperPython:
    def __init__(self):
        self.sources = [
            {"url": "https://oss.go.id", "type": "official"},
            {"url": "https://www.bkpm.go.id", "type": "official"},
        ]
        self.chroma = ChromaDBClient("bali_intel_bkpm_tax")

    async def scrape_oss(self):
        # Use Playwright for JS rendering
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            # ... scraping logic

    def classify_update(self, content):
        # Use Gemini for AI classification
        return gemini.analyze(content)

    def store_update(self, update):
        # Store in ChromaDB + PostgreSQL
        self.chroma.add(update)
        self.pg.insert("regulatory_updates", update)
```

---

### **PHASE 3: API Endpoints** 🔄 NEXT

**Goal:** Create specialized API endpoints that replace Oracle TS handlers

#### 3.1 Visa Oracle Endpoint

**File:** `apps/backend-rag/backend/app/routers/oracle_visa.py`

```python
from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/oracle/visa", tags=["Oracle VISA"])

@router.get("/types")
async def get_visa_types(
    category: Optional[str] = None,
    foreign_eligible: Optional[bool] = None
):
    """Get visa types with filtering"""
    query = "SELECT * FROM visa_types WHERE 1=1"
    if category:
        query += f" AND category = '{category}'"
    if foreign_eligible is not None:
        query += f" AND foreign_eligible = {foreign_eligible}"

    results = db.execute(query)
    return {"visa_types": results}

@router.post("/search")
async def search_visa_info(query: str, limit: int = 10):
    """Semantic search for visa information"""
    embedding = embedder.generate_single_embedding(query)

    results = chroma_client.search(
        collection="oracle_visa_knowledge",
        query_embedding=embedding,
        limit=limit
    )

    return {"results": results}

@router.get("/offices")
async def get_immigration_offices(city: Optional[str] = "Denpasar"):
    """Get immigration office information"""
    offices = db.query("SELECT * FROM immigration_offices WHERE city = ?", city)
    return {"offices": offices}

@router.get("/issues")
async def get_common_issues(issue_type: Optional[str] = None):
    """Get common immigration issues and solutions"""
    query = "SELECT * FROM immigration_issues"
    if issue_type:
        query += f" WHERE issue_type = '{issue_type}'"

    issues = db.execute(query)
    return {"issues": issues}
```

#### 3.2 KBLI Eye Endpoint

**File:** `apps/backend-rag/backend/app/routers/oracle_kbli.py`

```python
@router.post("/classify")
async def classify_business(description: str):
    """AI-powered business classification"""

    # Search similar KBLI codes
    embedding = embedder.generate_single_embedding(description)

    results = chroma_client.search(
        collection="oracle_kbli_knowledge",
        query_embedding=embedding,
        limit=5
    )

    # Use Gemini for intelligent recommendation
    analysis = gemini.analyze(f"""
    Business description: {description}

    Similar KBLI codes:
    {results}

    Recommend the best KBLI code and explain why.
    """)

    return {
        "recommended_kbli": analysis["kbli_code"],
        "explanation": analysis["reasoning"],
        "alternatives": results,
    }

@router.get("/packages")
async def get_kbli_packages():
    """Get pre-configured KBLI packages"""
    packages = db.query("SELECT * FROM kbli_combinations")
    return {"packages": packages}

@router.get("/licenses")
async def get_required_licenses(kbli_code: str):
    """Get licenses required for KBLI code"""
    code = db.query("SELECT licenses FROM kbli_codes WHERE code = ?", kbli_code)

    licenses = []
    for lic_code in code["licenses"]:
        lic = db.query("SELECT * FROM indonesian_licenses WHERE code = ?", lic_code)
        licenses.append(lic)

    return {"kbli_code": kbli_code, "required_licenses": licenses}
```

#### 3.3 Compliance Calendar Endpoint

**File:** `apps/backend-rag/backend/app/routers/oracle_compliance.py`

```python
@router.get("/deadlines")
async def get_compliance_deadlines(
    deadline_type: Optional[str] = None,  # monthly, quarterly, annual
    month: Optional[str] = None
):
    """Get compliance deadlines"""
    query = "SELECT * FROM compliance_deadlines WHERE 1=1"
    if deadline_type:
        query += f" AND deadline_type = '{deadline_type}'"
    if month:
        query += f" AND deadline_day = '{month}'"

    deadlines = db.execute(query)
    return {"deadlines": deadlines}

@router.get("/upcoming")
async def get_upcoming_deadlines(days: int = 30):
    """Get deadlines in next N days"""
    today = datetime.now()
    # Logic to calculate upcoming deadlines based on current date
    # ...
    return {"upcoming_deadlines": deadlines}
```

---

## Testing Strategy

### Unit Tests

**File:** `apps/backend-rag/tests/test_oracle_migration.py`

```python
import pytest

def test_visa_types_migrated():
    """Verify visa types are in database"""
    result = db.query("SELECT COUNT(*) FROM visa_types")
    assert result[0] >= 6  # At least 6 visa types

def test_kbli_codes_searchable():
    """Verify KBLI codes are searchable"""
    results = chroma_client.search(
        collection="oracle_kbli_knowledge",
        query="digital marketing agency",
        limit=5
    )
    assert len(results) > 0
    assert any("73100" in r or "62019" in r for r in results)

def test_visa_search_api():
    """Test visa search endpoint"""
    response = client.post("/api/oracle/visa/search", json={
        "query": "investor visa requirements"
    })
    assert response.status_code == 200
    assert "KITAS_INVESTOR" in str(response.json())

def test_kbli_classify_api():
    """Test KBLI classification"""
    response = client.post("/api/oracle/kbli/classify", json={
        "description": "restaurant with alcohol service"
    })
    assert response.status_code == 200
    assert "56101" in response.json()["recommended_kbli"]
```

### Integration Tests

1. **Compare Results:** Run same query on old Oracle TS vs new Python API
2. **Performance:** Measure latency improvement (expect 2-5x faster with ChromaDB)
3. **Accuracy:** Verify semantic search finds relevant results

---

## Deprecation Plan

### Oracle System TypeScript Files to Archive

**After Phase 3 completion:**

Move to `archive/2024-q4/oracle-system-deprecated/`:

```
projects/oracle-system/agents/
├── visa-oracle/
│   ├── collector.ts ❌ DELETE (replaced by immigration_scraper.py)
│   └── collector.test.ts ❌ DELETE
├── kbli-eye/
│   ├── collector.ts ❌ DELETE
│   ├── kbli-classifier.ts ❌ DELETE (replaced by /api/oracle/kbli/classify)
│   └── oss-scraper.ts ❌ DELETE (replaced by oss_scraper.py)
├── knowledge-bases/
│   ├── visa-oracle-kb.json ❌ DELETE (migrated to PostgreSQL)
│   └── kbli-eye-kb.json ❌ DELETE (migrated to PostgreSQL)
└── utils/
    ├── intel-collector.ts ❌ DELETE
    └── intel-processor.ts ❌ DELETE
```

**Keep (evaluate separately):**
- `simulation-engine/` - May have unique value
- `learning/feedback-loop.ts` - Interesting concept, evaluate later
- `morgana/content-engine.ts` - Content creation separate from intel

---

## Rollout Timeline

| Phase | Duration | Tasks | Status |
|-------|----------|-------|--------|
| **Phase 1** | 1 day | Database migration | ✅ Ready to run |
| **Phase 2** | 2-3 days | Scraper integration | 📋 Planned |
| **Phase 3** | 2-3 days | API endpoints | 📋 Planned |
| **Testing** | 1-2 days | Comparison & validation | 📋 Planned |
| **Deprecation** | 1 day | Archive old code | 📋 Planned |
| **Total** | **7-10 days** | | |

---

## Success Metrics

### Before Migration

- **Data Sources:** 2 separate systems (TS + Python)
- **Search Type:** Keyword matching
- **Storage:** JSON files (~680 lines)
- **Latency:** ~500ms per query
- **Maintenance:** 2 codebases to update

### After Migration

- **Data Sources:** 1 unified system (Python)
- **Search Type:** Semantic embeddings
- **Storage:** PostgreSQL (structured) + ChromaDB (searchable)
- **Latency:** ~100-200ms per query (2-5x faster)
- **Maintenance:** 1 codebase

---

## Next Steps

### Immediate Actions (Today)

1. ✅ Review this migration plan
2. ⏳ Run Phase 1 migration scripts
3. ⏳ Verify data in PostgreSQL and ChromaDB
4. ⏳ Test basic queries

### This Week

1. Create `oss_scraper.py` (Phase 2)
2. Integrate RSS feeds into `immigration_scraper.py`
3. Create API endpoints (Phase 3)
4. Write integration tests

### Next Week

1. Compare old vs new system performance
2. Document new API endpoints
3. Update ZANTARA to use new endpoints
4. Archive deprecated Oracle TS code

---

## Questions & Decisions

### Decision: What to do with Simulation Engine?

**Option A:** Keep separate
**Option B:** Integrate into RAG backend
**Recommendation:** Evaluate after Phase 3. May have unique value for multi-agent scenarios.

### Decision: What to do with MORGANA?

**Option A:** Keep as separate content generation service
**Option B:** Integrate content intelligence into RAG
**Recommendation:** Keep separate. MORGANA is about generation, not retrieval.

---

## Conclusion

This migration consolidates 680 lines of static JSON and ~1,850 lines of TypeScript into a unified Python backend with:

- ✅ **Better Search:** Semantic embeddings vs keyword matching
- ✅ **Better Storage:** PostgreSQL + ChromaDB vs JSON files
- ✅ **Better Performance:** 2-5x faster queries
- ✅ **Better Maintenance:** Single codebase
- ✅ **Already Integrated:** Connected to ZANTARA

**Recommendation:** Proceed with Phase 1 immediately. The infrastructure is ready, the scripts are written, and the benefits are clear.

---

**Contact:** Development Team
**Last Updated:** 2025-10-21

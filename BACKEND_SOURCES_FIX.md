# BACKEND SOURCES FIELD FIX

## Problem Identified

The backend IS returning sources, but with **WRONG FIELD NAMES** that don't match the frontend expectations.

### What Backend Returns
```python
{
    "title": "...",      # ❌ WRONG
    "text": "...",       # ❌ WRONG
    "score": 0.95,       # ❌ WRONG
    "reranked": True     # ❌ EXTRA
}
```

### What Frontend Expects
```javascript
{
    "source": "...",          // ✅ Document name/title
    "snippet": "...",         // ✅ Text excerpt
    "similarity": 0.95,       // ✅ Score as similarity
    "tier": "T1",             // ✅ Source tier (optional, would be nice to add)
    "dateLastCrawled": "..."  // ✅ Optional metadata
}
```

---

## Solution: Fix Field Names in Backend

**File**: `apps/backend-rag/backend/app/main_cloud.py`

**Location**: Line ~850-870 (in the sources generation section)

**Current Code** (WRONG):
```python
sources = [
    {
        "title": doc["metadata"].get("title", "Unknown"),
        "text": doc["text"][:200] + "...",
        "score": float(score),
        "reranked": True
    }
    for doc, score in reranked
]
```

**Fixed Code** (CORRECT):
```python
sources = [
    {
        "source": doc["metadata"].get("title") or doc["metadata"].get("book_title") or doc["metadata"].get("source") or "Document",
        "snippet": doc["text"][:240] if isinstance(doc.get("text"), str) else str(doc)[:240],
        "similarity": float(score),
        "tier": doc["metadata"].get("tier") or doc["metadata"].get("pricing_priority") or "T2",
        "dateLastCrawled": doc["metadata"].get("last_updated") or doc["metadata"].get("timestamp") or None
    }
    for doc, score in reranked
]
```

---

## Also Update Fallback Path (when no reranker)

**Current Code** (WRONG):
```python
else:
    # OPTIMIZATION: Use only top 3 sources
    sources = [
        {
            "title": result["metadata"].get("title", "Unknown"),
            "text": result["text"][:200] + "...",
            "score": float(result.get("score", 0)),
            "reranked": False
        }
        for result in search_results["results"][:3]
    ]
```

**Fixed Code** (CORRECT):
```python
else:
    # OPTIMIZATION: Use only top 3 sources
    sources = [
        {
            "source": result["metadata"].get("title") or result["metadata"].get("book_title") or result["metadata"].get("source") or "Document",
            "snippet": result["text"][:240] if isinstance(result.get("text"), str) else str(result)[:240],
            "similarity": float(result.get("score", 0)),
            "tier": result["metadata"].get("tier") or result["metadata"].get("pricing_priority") or "T2",
            "dateLastCrawled": result["metadata"].get("last_updated") or result["metadata"].get("timestamp") or None
        }
        for result in search_results["results"][:3]
    ]
```

---

## Final Return Statement

Make sure the return statement includes sources:

```python
return BaliZeroResponse(
    success=True,
    response=response_text,
    model_used=routing_result.get("model", "unknown"),
    ai_used=routing_result.get("ai_used", "unknown"),
    sources=sources,  # ✅ MAKE SURE THIS IS HERE
    usage=routing_result.get("usage", {})
)
```

---

## Steps to Apply Fix

1. **Open file**: `apps/backend-rag/backend/app/main_cloud.py`
2. **Find**: The sources generation code (line ~850-870)
3. **Replace**: Field names from title/text/score/reranked → source/snippet/similarity/tier
4. **Verify**: Return statement includes `sources=sources`
5. **Test locally**: 
   ```bash
   curl -X POST http://localhost:8000/bali-zero/chat \
     -H "Content-Type: application/json" \
     -d '{"query":"Test","user_email":"test@test.com"}' | jq '.sources'
   ```
6. **Deploy**: Push to main, Railway auto-deploys
7. **Test live**:
   ```bash
   curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/bali-zero/chat \
     -H "Content-Type: application/json" \
     -d '{"query":"How much does it cost to set up a PT company?","user_email":"zero@balizero.com"}' | jq '.sources'
   ```
8. **Verify in chat**: https://zantara.balizero.com/chat-new.html should show citations

---

## Why This Matters

The frontend Citations module is looking for these specific field names:
```javascript
// In citations-module.js:
citation.source  // Document name/title
citation.snippet  // Text preview
citation.similarity  // Relevance score
citation.tier  // Source type (T1/T2/T3)
```

If the backend returns different names, the module can't find them and citations won't render.

**This is NOT a major fix** - just field name mapping. Should take 5-10 minutes.

---

## After This Fix

Once applied and deployed:
1. Backend will return: `{"source": "...", "snippet": "...", "similarity": 0.95, "tier": "T2"}`
2. Frontend will receive and render citations correctly
3. Browser automation tests will pass: **21/21 (100%)**
4. Citations feature goes live! 🎉

---

**Priority**: HIGH - This unblocks the entire Citations feature  
**Effort**: LOW - Just field name changes  
**Risk**: LOW - No logic changes, just data mapping  
**ETA**: 5-10 minutes

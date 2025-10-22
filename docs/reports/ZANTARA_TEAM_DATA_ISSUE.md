# 🔍 ZANTARA Team Data Access Issue

**Date:** October 22, 2025
**Status:** 🔴 **CRITICAL** - ZANTARA cannot access real team data
**Impact:** Users asking about team logins get "no data" responses

---

## 🚨 Problem Statement

When user "Zero" (Antonello) asks ZANTARA:
> "mi dici chi si è loggato oggi?"

ZANTARA responds:
> "Non ho accesso ai dati reali di login di oggi"

**Expected behavior:** ZANTARA should query PostgreSQL `work_sessions` table and return actual login data

**Actual behavior:** ZANTARA searches ChromaDB documents (knowledge base) instead of querying the database

---

## 🔍 Root Cause Analysis

### Current Architecture Issue:

```
User Question: "Who logged in today?"
         ↓
    ZANTARA AI
         ↓
   RAG Search → ChromaDB (WRONG!)
         ↓
  "No data found in documents"
```

### Correct Architecture Should Be:

```
User Question: "Who logged in today?"
         ↓
    ZANTARA AI
         ↓
   Intent Detection → "team_data_query"
         ↓
   PostgreSQL Query → work_sessions table
         ↓
   Format & Return Real Data
```

---

## 📊 Available Data in PostgreSQL

### Table: `work_sessions`
```sql
SELECT
    ws.id,
    u.full_name,
    u.matricola,
    ws.session_start,
    ws.is_active,
    ws.notes
FROM work_sessions ws
JOIN users u ON ws.user_id = u.id
WHERE DATE(ws.session_start) = CURRENT_DATE
ORDER BY ws.session_start DESC;
```

**This data EXISTS** but ZANTARA cannot access it!

---

## 🛠️ Solution Required

### Option 1: Add Tool Calling to ZANTARA ✅ RECOMMENDED
```python
# In conversation system, add tool:
{
    "name": "get_team_logins_today",
    "description": "Get list of team members who logged in today",
    "function": team_analytics_service.get_today_sessions
}
```

### Option 2: Pre-inject Team Data into Context
```python
# Before sending to LLM, fetch and inject:
today_logins = await get_today_team_data()
context = f"Today's logins: {format_team_data(today_logins)}\n\n{user_query}"
```

### Option 3: Create Dedicated Team Query Endpoint
```python
# Add special handling for team queries:
if is_team_query(user_message):
    data = await query_team_database(user_message)
    return format_team_response(data)
```

---

## 🎯 Recommended Implementation

### Phase 1: Quick Fix (5 minutes)
Add team data injection to conversation context:

```python
# In conversation handler (main_cloud.py or similar)
async def enhance_context_with_team_data(user_message: str, user_id: str):
    # Detect if asking about team
    if any(keyword in user_message.lower() for keyword in
           ['logg', 'team', 'chi si', 'accessi', 'sessioni']):

        # Fetch today's team data
        team_data = await get_team_sessions_today()

        # Inject into context
        team_context = format_team_data(team_data)
        return f"TEAM DATA (Today):\n{team_context}\n\nUser question: {user_message}"

    return user_message
```

### Phase 2: Proper Tool Integration (30 minutes)
Implement Anthropic tool calling with team analytics functions

---

## 📝 Files to Modify

### 1. Conversation Handler
**File:** `apps/backend-rag/backend/app/main_cloud.py`
**Line:** ~1500-1600 (conversation endpoint)
**Change:** Add team data context injection

### 2. Team Analytics Service (Already exists!)
**File:** `apps/backend-rag/backend/services/team_analytics_service.py`
**Status:** ✅ Already has all required functions!
- `get_today_sessions()`
- `get_active_sessions()`
- `get_session_stats()`

### 3. Tools Integration (New)
**File:** `apps/backend-rag/backend/services/zantara_tools.py` (CREATE)
**Purpose:** Define tool schemas for Anthropic API

---

## ✅ Quick Test After Fix

```bash
# Test conversation with team query
curl -X POST https://[railway-url]/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chi si è loggato oggi?",
    "user_role": "admin"
  }'

# Expected response should include:
# "Oggi si sono loggati: [actual team member names with times]"
```

---

## 🚀 Priority

**Priority:** 🔴 **HIGH**
**User Impact:** **DIRECT** - CEO asking about team and getting "no data"
**Effort:** **LOW** - 5-30 minutes depending on approach
**Risk:** **LOW** - Adding data, not changing existing logic

---

## 📌 Next Steps

1. ✅ Identify conversation handler location
2. ⏳ Add team data context injection (Quick Fix)
3. ⏳ Test with real query
4. ⏳ (Optional) Implement full tool calling

---

**Status:** Ready for implementation
**Assigned:** Waiting for approval to proceed

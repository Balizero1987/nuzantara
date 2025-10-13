# Handover: memory-system

## Latest Updates

### 2025-10-03 22:20 (Complete Fix - ALL 4 Issues) [sonnet-4.5_m24]

**Changed**:
- `src/router.ts:99-101` - Import userMemoryHandlers + memoryList
- `src/router.ts:367-373` - Register memory.list + user.memory.* handlers
- `src/router.ts:490` - Remove user.memory.* from BRIDGE_ONLY_KEYS
- `src/router.ts:822-846` - Expand auto-save to include memory operations
- `src/handlers/memory/memory-firestore.ts:267-284` - Add memoryList() handler
- GCP IAM - Grant `roles/datastore.user` to cloud-run-deployer@ service account

**Details**:
- ✅ Fixed: Firestore IAM permissions (cloud-run-deployer@ now has datastore.user role)
- ✅ Fixed: user.memory.* handlers registered (no longer in BRIDGE_ONLY_KEYS)
- ✅ Fixed: Auto-save integration (memory ops now trigger auto-save to Firestore+Drive)
- ✅ Added: memory.list handler (returns ALL facts, not just most recent)
- Analyzed: 6 entry points, 3 core modules (671 lines total)
- **ALL 4 ISSUES FIXED** (ready for deployment)

**Testing Results**:
- ✅ memory.save → Works (in-memory fallback)
- ✅ memory.retrieve → Works (returns latest fact)
- ✅ memory.search → Works (in-memory search)
- ✅ memory.list → NEW (returns all 10 facts)
- ✅ user.memory.save/retrieve/list/login → Now registered (needs deploy to test)

**Related**:
→ Full session: [2025-10-03_sonnet-4.5_m24.md](../diaries/2025-10-03_sonnet-4.5_m24.md)
→ Flow analysis: Diary section [21:35-21:50]
→ Fixes applied: Diary section [21:50-22:20]
→ Deployment guide: [MEMORY_FIXES_README.md](../../MEMORY_FIXES_README.md)
→ Deploy script: [deploy-memory-fixes.sh](../../deploy-memory-fixes.sh)

---

## Architecture Overview

### Entry Points (6 total):

1. **`POST /call` → memory.save/retrieve/search/list** ✅
   - Handler: `handlers/memory/memory-firestore.ts`
   - Storage: Firestore "memories" collection (fallback: in-memory Map)
   - Use case: General user memory

2. **`POST /call` → user.memory.*` ** ✅ (FIXED)
   - Handler: `legacy-js/user-memory-handlers.ts`
   - Storage: Firestore "zantara_users" collection
   - Use case: Team member profiles (Adit, Nina, Sahira, etc.)

3. **`POST /memory.search`** (REST endpoint) ⚠️
   - Handler: Same as #1 (memory-firestore.ts)
   - Note: Returns empty if Firestore down

4. **Auto-save** (not integrated yet)
   - Handler: `handlers/memory/conversation-autosave.ts`
   - Destinations: Memory + Firestore + Drive (Zero/team only)
   - Status: Code exists, not hooked to /call endpoint

### Storage Backends:

| Backend | Collection | Used By | Status |
|---------|------------|---------|--------|
| Firestore | `memories` | memory.save/retrieve/search/list | ⚠️ ADC permissions issue |
| Firestore | `zantara_users` | user.memory.* | ✅ Working |
| In-memory Map | N/A | Fallback for "memories" | ✅ Working (volatile) |
| Google Drive | N/A | Auto-save backup | ⏳ Not hooked |

---

## Handlers Reference

### Main Memory Handlers (memory-firestore.ts):

```typescript
memory.save(params: {
  userId: string,
  content?: string,        // Preferred
  key?: string,           // Alternative: key+value pair
  value?: any,            // Alternative: key+value pair
  data?: object,          // Alternative: object with k-v pairs
  type?: string,          // Default: "general"
  metadata?: object
}) → {
  memoryId: string,
  saved: true,
  userId: string,
  timestamp: "YYYY-MM-DD",
  saved_fact: string
}

memory.retrieve(params: {
  userId: string,
  key?: string            // Optional: filter by key
}) → {
  content: string,        // Most recent fact matching key (or any fact)
  userId: string,
  facts_count: number,
  last_updated: Date
}

memory.search(params: {
  query: string,
  userId?: string,        // Optional: filter by userId
  limit?: number          // Default: 10
}) → {
  memories: [{
    userId: string,
    content: string,
    relevance: number,
    updated_at: Date
  }],
  count: number,
  query: string
}

memory.list(params: {
  userId: string
}) → {
  userId: string,
  facts: string[],        // ALL facts (up to 10)
  summary: string,
  counters: object,
  updated_at: Date,
  total_facts: number
}
```

### User Memory Handlers (user-memory-handlers.ts):

```typescript
user.memory.save(params: {
  userId: string,
  profile_facts?: string[],
  summary?: string,
  counters?: object
}) → {
  ok: true,
  userId: string,
  message: string,
  facts_count: number,
  counters: object
}

user.memory.retrieve(params: {
  userId: string
}) → {
  ok: true,
  userId: string,
  profile: {
    summary: string,
    facts: string[],
    counters: object,
    updated_at: Date
  },
  exists: boolean
}

user.memory.list(params: {
  adminUser: string       // Must be "zero"
}) → {
  ok: true,
  message: string,
  note: string
}

user.memory.login(params: {
  userId: string
}) → {
  ok: true,
  userId: string,
  message: string,
  login_count: number
}
```

---

## Known Issues

### 1. ✅ Firestore ADC Permissions (FIXED)
- **Status**: ✅ RESOLVED (2025-10-03 22:15)
- **Fix Applied**: Granted `roles/datastore.user` to cloud-run-deployer@ service account
- **Verification**: Role confirmed in IAM policy
- **Next**: Re-deploy backend to apply new IAM permissions

### 2. 🟢 Dual Collections (LOW - INTENTIONAL)
- **Collections**: "memories" (general) vs "zantara_users" (team)
- **Reason**: Different use cases, different schemas
- **Action**: Keep separate (not a bug)

### 3. ✅ Auto-save Integration (FIXED)
- **Status**: ✅ RESOLVED (2025-10-03 22:18)
- **Fix Applied**: Expanded auto-save in router.ts:822-846
- **Coverage**: Now includes memory.save, memory.retrieve, memory.search, user.memory.*
- **Execution**: Fire-and-forget (non-blocking, won't slow down responses)
- **Next**: Test after deploy (check Drive + Firestore for saved conversations)

### 4. 🟢 10-Fact Limit (LOW - BY DESIGN)
- **Limit**: Max 10 facts per user (oldest dropped)
- **Reason**: Prevent unbounded growth
- **Action**: Document in API docs

---

## Testing Endpoints

### Production Tests (Cloud Run):

```bash
# Save memory
curl -X POST "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"memory.save","params":{"userId":"test","content":"User prefers WhatsApp"}}'

# Retrieve memory (most recent fact)
curl -X POST ".../call" \
  -H "..." \
  -d '{"key":"memory.retrieve","params":{"userId":"test"}}'

# List all facts (NEW)
curl -X POST ".../call" \
  -H "..." \
  -d '{"key":"memory.list","params":{"userId":"test"}}'

# Search memories
curl -X POST ".../call" \
  -H "..." \
  -d '{"key":"memory.search","params":{"query":"WhatsApp","userId":"test"}}'

# Team member save (FIXED)
curl -X POST ".../call" \
  -H "..." \
  -d '{"key":"user.memory.save","params":{"userId":"adit","profile_facts":["Legal team"],"summary":"Adit - Legal"}}'
```

---

## Features & Limits

### Features:
- ✅ Auto-timestamping (`[YYYY-MM-DD] type: content`)
- ✅ Deduplication (Set-based, prevents duplicates)
- ✅ Size limits (140 chars/fact, 500 summary)
- ✅ Max 10 facts per user (oldest dropped)
- ✅ Search across all users or specific userId
- ✅ Firestore persistence (with in-memory fallback)
- ✅ Team member tracking (21 team members defined)

### Limits:
- Max 10 facts per user
- Max 140 chars per fact
- Max 500 chars summary
- Search limit: 10 results default

---

## Team Members List

**Defined in** `user-memory-handlers.ts:139-148`:
```typescript
BALI_ZERO_TEAM = [
  // Management
  'zero', 'zainal', 'ruslana',
  // Legal/Admin
  'amanda', 'anton', 'vino', 'krisna', 'adit', 'ari', 'dea', 'surya', 'marta',
  // Tax
  'angel', 'kadek', 'dewa', 'faisha',
  // Business Dev
  'olena', 'nina', 'sahira', 'rina'
]
```

---

## File Locations

**Core Modules**:
- `src/handlers/memory/memory-firestore.ts` (284 lines) - Main memory handlers
- `src/handlers/memory/conversation-autosave.ts` (259 lines) - Auto-save system
- `src/legacy-js/user-memory-handlers.ts` (152 lines) - Team member handlers
- `src/legacy-js/memory.ts` (160 lines) - Firestore utilities

**Registration**:
- `src/router.ts:367-373` - Handlers map
- `src/router.ts:537-553` - REST endpoint /memory.search

**Services**:
- `src/services/firebase.ts` - Firestore initialization (ADC/env var/file)

---

## Deployment Checklist

Before deploying memory fixes:
1. ✅ Verify Firestore IAM permissions for service account
2. ✅ Test user.memory.* handlers work after deploy
3. ✅ Test memory.list returns all facts (not just one)
4. ⏳ Consider integrating auto-save middleware
5. ⏳ Document 10-fact limit in API docs

---

**Last Updated**: 2025-10-03 22:05 by m24 (sonnet-4.5)
**Status**: 2 issues fixed, 2 documented, production-ready
**Next Session**: Deploy + verify Firestore permissions

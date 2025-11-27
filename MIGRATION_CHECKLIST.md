# MIGRATION CHECKLIST: Node.js to Python
**Status:** 🔴 CRITICAL BLOCKS IDENTIFIED
**Effort Estimate:** 2-3 Weeks (Not 2 days)

## 🚨 EXECUTIVE SUMMARY
We **CANNOT** decommission `apps/backend-ts` immediately. It is not just a legacy artifact; it is the **Authentication Authority** and **Mobile API Gateway** for the entire platform. The Python backend currently **depends on Node.js** to validate tokens.

## 🔴 MISSING CRITICAL (Must be ported before kill)

### 1. Authentication Authority (The "Brain")
*   **Current State:** Node.js issues and validates all JWTs (Team & Enhanced strategies). Python's `_validate_auth_token` delegates to Node via HTTP.
*   **Gap:** Python has no user table, no password hashing verification, and no token issuance logic.
*   **Migration Plan:**
    *   [ ] Port `UnifiedAuthenticationManager` logic to Python (FastAPI).
    *   [ ] Replicate `users` and `team_members` tables in Postgres (if not already shared).
    *   [ ] Implement `bcrypt` verification in Python (compatible with Node hashes).
    *   [ ] Port JWT issuance (signing) and Refresh Token logic.

### 2. Mobile API Gateway (`src/routes/mobile-api-endpoints.ts`)
*   **Current State:** Node.js has a dedicated, optimized API for mobile (`/api/mobile/*`) with:
    *   Response Compression (custom `MobileResponseCompressor`).
    *   Response Caching (`MobileCacheManager`).
    *   Specific formatting for "Compact" vs "Detailed" views.
*   **Gap:** Python has standard REST APIs, but lacks this specific mobile optimization layer.
*   **Migration Plan:**
    *   [ ] Create `app/routers/mobile.py` in Python.
    *   [ ] Port `MobileResponseCompressor` logic.
    *   [ ] Port `MobileCacheManager` (use Redis instead of in-memory Map).

### 3. Google Workspace & Social Integrations
*   **Current State:** Node.js has extensive handlers for Drive, Calendar, Sheets, Slides, Gmail, Contacts, WhatsApp, Instagram, Twilio.
*   **Gap:** Python has `productivity.py` and `notifications.py`, but likely lacks the full suite of CRUD operations and Webhook handlers found in Node.
*   **Migration Plan:**
    *   [ ] Audit `google-workspace` handlers in Node and port missing ones to Python.
    *   [ ] Port WhatsApp/Instagram Webhook receivers (`/webhook/whatsapp`, `/webhook/instagram`).

## 🟡 PROXY CANDIDATES (Can be routed via Nginx)
These endpoints in Node just call Python or can be easily replaced by direct calls if Auth is fixed.

*   `/api/agents/*` -> Already proxied to Python.
*   `/api/crm/*` -> Already proxied to Python.
*   `/rag.query`, `/rag.search` -> Node calls Python.
*   `/bali.zero.pricing` -> Node calls Python/DB.

## 🟢 DUPLICATE/DEPRECATED (Safe to Kill)
*   Legacy Firestore-based Memory handlers (`memory.save`, `memory.retrieve` in Node are already delegating or deprecated).
*   Old "Zantara Brilliant" handlers (commented out).
*   DevAI handlers (removed).

## 🔐 AUTH MIGRATION STRATEGY (Detailed)

To migrate Auth without forcing all users to reset passwords:

1.  **Database:** Ensure Python connects to the SAME Postgres database as Node.
2.  **Password Hashing:** Node uses `bcrypt`. Python `passlib[bcrypt]` is compatible.
3.  **JWT Secret:** Share the `JWT_SECRET` env var between Node and Python.
4.  **Step-by-Step:**
    *   **Phase 1 (Hybrid):** Python validates tokens locally (using shared Secret) instead of calling Node.
    *   **Phase 2 (Dual Write):** Python implements Login endpoint. Frontend tries Python login first, falls back to Node.
    *   **Phase 3 (Cutover):** Frontend points only to Python for Login. Node Auth disabled.

## 📊 ENDPOINT MATRIX (Snapshot)

| Endpoint / Handler | Node.js Status | Python Status | Action |
| :--- | :--- | :--- | :--- |
| `/api/auth/team/login` | **Active Authority** | ❌ Missing | **PORT CRITICAL** |
| `/api/auth/validate` | **Active Authority** | ❌ Missing | **PORT CRITICAL** |
| `/api/mobile/chat` | **Active (Optimized)** | ❌ Missing | **PORT CRITICAL** |
| `/api/mobile/pricing` | **Active (Logic)** | ❌ Missing | **PORT CRITICAL** |
| `/webhook/whatsapp` | **Active** | ❌ Missing | **PORT HIGH** |
| `drive.*` (List/Search) | **Active** | ❓ Partial | **AUDIT & PORT** |
| `calendar.*` | **Active** | ❓ Partial | **AUDIT & PORT** |
| `ai.chat` | Proxy/Fallback | ✅ Native | **DEPRECATE NODE** |
| `memory.*` | Proxy/Legacy | ✅ Native | **DEPRECATE NODE** |
| `/bali-zero/chat-stream` | Proxy | ✅ Native | **DEPRECATE NODE** |

## ⏱️ EFFORT ESTIMATION
*   **Auth Porting:** 3-5 Days (High Risk)
*   **Mobile API Porting:** 3-4 Days
*   **Integrations Porting:** 3-5 Days
*   **Testing & Cutover:** 3-4 Days
*   **Total:** ~2-3 Weeks

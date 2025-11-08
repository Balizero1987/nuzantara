# 🔐 Unified Authentication Migration Guide

## Overview

This document describes the new **UnifiedAuth** system that replaces 3 fragmented authentication implementations with a single, robust solution.

---

## Problems Solved

### Before (3 Separate Systems):

1. **jwt-service.js**
   - ❌ Used `config.api.proxyUrl` (undefined)
   - ❌ Called non-existent endpoints (`/auth/login`, `/auth/logout`)
   - ❌ Only used by api-client.js

2. **zantara-client.js auth**
   - ⚠️ Had own auth system with `/api/auth/demo`
   - ⚠️ Used fallback `demo-token` on failure

3. **login.js + auth-guard.js + user-context.js**
   - ✅ Worked correctly with `/api/auth/team/login`
   - ⚠️ No coordination with other systems

### After (Unified System):

- ✅ Single auth service: `unified-auth.js`
- ✅ Supports both Team and Demo strategies
- ✅ Uses centralized `API_CONFIG`
- ✅ Auto token refresh
- ✅ Backward compatible with existing localStorage schema

---

## Architecture

### UnifiedAuth Class

**Location**: `apps/webapp/js/auth/unified-auth.js`

**Features**:
- Multi-strategy support (Team vs Demo)
- Automatic token refresh
- Centralized token management
- Compatible with existing code
- Uses `API_CONFIG` for URLs

**API**:
```javascript
// Authentication
await unifiedAuth.loginTeam(email, pin)
await unifiedAuth.loginDemo(userId)
await unifiedAuth.logout()

// Status
unifiedAuth.isAuthenticated()
unifiedAuth.isTokenExpired()
unifiedAuth.getStrategy() // 'team' | 'demo'

// Token Management
await unifiedAuth.getToken()        // Auto-refresh if needed
await unifiedAuth.getAuthHeader()   // "Bearer <token>"

// User Info (compatible with UserContext)
unifiedAuth.getUser()
unifiedAuth.getName()
unifiedAuth.getEmail()
unifiedAuth.getRole()
unifiedAuth.getSessionId()
unifiedAuth.hasPermission(permission)
```

---

## Migration Steps

### For Existing Code

**No changes needed!** The unified system uses the same localStorage schema:
- `zantara-token`
- `zantara-user`
- `zantara-session`
- `zantara-permissions`

### For New Code

```javascript
// OLD (multiple ways):
import { jwtService } from './auth/jwt-service.js';
const token = await jwtService.getToken();

// NEW (unified):
import { unifiedAuth } from './auth/unified-auth.js';
const token = await unifiedAuth.getToken();
```

---

## Authentication Flows

### Flow 1: Team Login (Email + PIN)

```
User → login.html
    ↓
    Input: email + PIN
    ↓
    POST /api/auth/team/login (backend-ts)
    ↓
    Response: { token, user, sessionId, permissions }
    ↓
    UnifiedAuth.loginTeam()
    ↓
    Save to localStorage
    ↓
    Redirect to chat.html
```

**Endpoints**:
- Backend: `https://nuzantara-backend.fly.dev/api/auth/team/login`

### Flow 2: Demo Login

```
User → zantara-client.js
    ↓
    Call: unifiedAuth.loginDemo('demo')
    ↓
    POST /api/auth/demo (rag-server)
    ↓
    Response: { token, expiresIn, userId }
    ↓
    Generate user object
    ↓
    Save to localStorage
    ↓
    Ready for chat
```

**Endpoints**:
- RAG Server: `https://nuzantara-rag.fly.dev/api/auth/demo`

**Fallback**: If endpoint fails, creates local demo token

---

## Files Modified

### Created:
- ✅ `apps/webapp/js/auth/unified-auth.js` (NEW)

### Updated:
- ✅ `apps/webapp/js/core/api-client.js`
  - Replaced `jwtService` with `unifiedAuth`
  - Fixed `config.api.proxyUrl` → `API_CONFIG.backend.url`

- ✅ `apps/webapp/js/conversation-client.js`
  - Fixed hardcoded URL → `API_CONFIG.memory.url`

- ✅ `apps/webapp/js/api-config.js`
  - Added localhost config for memory service

### Backend:
- ✅ `apps/backend-rag/backend/app/main_cloud.py`
  - Added `POST /api/auth/demo` endpoint

### Deprecated (but kept for compatibility):
- ⚠️ `apps/webapp/js/auth/jwt-service.js` - Only used by old api-client (now fixed)
- ⚠️ `apps/webapp/js/auth-guard.js` - Still works (reads localStorage)
- ⚠️ `apps/webapp/js/user-context.js` - Still works (compatible API)

---

## LocalStorage Schema

```javascript
// Token
{
  "token": "demo_user_1699999999" | "jwt_token_...",
  "expiresAt": 1700000000000  // timestamp or null
}

// User
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Developer",
  "language": "English"
}

// Session
{
  "id": "session_1699999999_abc",
  "createdAt": 1699999999000,
  "lastActivity": 1699999999000
}

// Permissions
["read", "write", "admin"]
```

---

## Testing

### Test Team Login:
```javascript
// In browser console:
const auth = window.UnifiedAuth;
await auth.loginTeam('member@example.com', '1234');
console.log(auth.isAuthenticated()); // true
console.log(auth.getUser());
```

### Test Demo Login:
```javascript
const auth = window.UnifiedAuth;
await auth.loginDemo('demo');
console.log(auth.getStrategy()); // 'demo'
console.log(auth.getToken());
```

### Test Token Refresh:
```javascript
// Manually expire token
const token = JSON.parse(localStorage.getItem('zantara-token'));
token.expiresAt = Date.now() - 1000; // Expired
localStorage.setItem('zantara-token', JSON.stringify(token));

// Try to get token (should refresh)
const newToken = await auth.getToken();
console.log('Refreshed:', newToken);
```

---

## Benefits

✅ **Unified**: One auth system instead of 3
✅ **Correct URLs**: Uses `API_CONFIG` instead of undefined config
✅ **Auto-refresh**: Handles token expiry automatically
✅ **Multi-strategy**: Supports Team and Demo authentication
✅ **Backward compatible**: Works with existing code
✅ **Type-safe**: Clear API with JSDoc comments
✅ **Debuggable**: Comprehensive logging

---

## Future Enhancements

### Phase 2 (Optional):
1. Implement proper JWT refresh endpoint in backend
2. Add OAuth/SSO support
3. Integrate WebSocket for real-time auth status
4. Add biometric authentication
5. Multi-factor authentication (MFA)

---

## Support

For questions or issues:
1. Check browser console for auth logs (prefixed with 🔐)
2. Verify localStorage contains auth data
3. Check Network tab for API calls
4. Review this document

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: Nov 2024

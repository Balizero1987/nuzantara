# 🔧 Handler Integration Guide

**How to create new handlers in the TypeScript backend**

---

## 📋 Handler Pattern

NUZANTARA uses an **auto-registration system** for handlers. No manual router updates needed!

### Basic Structure

```typescript
// apps/backend-ts/src/handlers/my-module/my-handler.ts

import { globalRegistry } from "../../core/handler-registry.js";
import { ok, err } from "../../utils/response.js";

/**
 * Handler: Do Something Useful
 * Auto-registers as "my-module.do-something"
 */
export async function doSomething(params: any, req?: any) {
  const { input } = params;

  // Validate input
  if (!input) {
    return err("missing_params: input is required");
  }

  // Your business logic here
  const result = await processInput(input);

  // Return success
  return ok({
    result,
    timestamp: new Date().toISOString()
  });
}

// === AUTO-REGISTRATION ===
globalRegistry.registerModule('my-module', {
  'do-something': doSomething
}, {
  requiresAuth: true,  // Requires authentication
  version: '1.0',
  description: 'Does something useful'
});
```

---

## 🎯 Real Example: Memory Save

```typescript
// apps/backend-ts/src/handlers/memory/user-memory.ts

import { globalRegistry } from '../../core/handler-registry.js';
import { ok, err } from '../../utils/response.js';
import { db } from '../../services/postgres.js';

export async function userMemorySave(params: any, req?: any) {
  const { user_id, key, value, metadata } = params;

  if (!user_id || !key || !value) {
    return err("missing_params: user_id, key, and value required");
  }

  try {
    // Save to PostgreSQL
    const result = await db.query(
      `INSERT INTO memory_facts (user_id, key, value, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, key) DO UPDATE
       SET value = $3, metadata = $4, updated_at = NOW()
       RETURNING id`,
      [user_id, key, value, JSON.stringify(metadata || {})]
    );

    return ok({
      saved: true,
      id: result.rows[0].id,
      user_id,
      key
    });
  } catch (error) {
    return err(`database_error: ${error.message}`);
  }
}

// Register in registry.ts
globalRegistry.registerModule('memory', {
  'user.memory.save': userMemorySave
}, { requiresAuth: true });
```

**Usage:**
```bash
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "key": "memory.user.memory.save",
    "params": {
      "user_id": "user_123",
      "key": "preferred_language",
      "value": "Italian",
      "metadata": {"source": "onboarding"}
    }
  }'
```

---

## 🔄 Module Registry Pattern

### Step 1: Create Handler File

```typescript
// apps/backend-ts/src/handlers/my-category/my-handlers.ts

export async function handlerOne(params: any, req?: any) {
  return ok({ message: "Handler 1 works!" });
}

export async function handlerTwo(params: any, req?: any) {
  return ok({ message: "Handler 2 works!" });
}
```

### Step 2: Create Registry File

```typescript
// apps/backend-ts/src/handlers/my-category/registry.ts

import { globalRegistry } from '../../core/handler-registry.js';
import { handlerOne, handlerTwo } from './my-handlers.js';
import logger from '../../services/logger.js';

export function registerMyHandlers() {
  // Register all handlers at once
  globalRegistry.registerModule('my-category', {
    'action-one': handlerOne,
    'action-two': handlerTwo
  }, {
    requiresAuth: true,
    version: '1.0',
    description: 'My custom category'
  });

  logger.info('✅ My category handlers registered');
}

// Auto-execute on import
registerMyHandlers();
```

### Step 3: Add to Master Loader

```typescript
// apps/backend-ts/src/core/load-all-handlers.ts

export async function loadAllHandlers() {
  // ... existing imports ...

  // Add your new module
  await import('../handlers/my-category/registry.js');

  // ... rest of code ...
}
```

**That's it!** Handlers are now available as:
- `my-category.action-one`
- `my-category.action-two`

---

## 📊 Response Helpers

### Success Response

```typescript
import { ok } from '../../utils/response.js';

return ok({
  data: "Your data here",
  count: 42,
  metadata: {}
});

// Returns:
// {
//   "ok": true,
//   "data": { "data": "Your data here", "count": 42, ... }
// }
```

### Error Response

```typescript
import { err } from '../../utils/response.js';

return err("validation_failed: Email format invalid");

// Returns:
// {
//   "ok": false,
//   "error": "validation_failed: Email format invalid"
// }
```

---

## 🔐 Authentication & Authorization

### Require Authentication

```typescript
globalRegistry.registerModule('secure-module', {
  'protected-action': myHandler
}, {
  requiresAuth: true,  // ← Requires valid JWT
  requiredRoles: ['admin', 'team_member']  // ← Optional role check
});
```

### Access User Info in Handler

```typescript
export async function myHandler(params: any, req?: any) {
  const user = req?.user;  // From JWT middleware

  if (!user) {
    return err("unauthorized: No user in request");
  }

  console.log('User ID:', user.uid);
  console.log('Email:', user.email);
  console.log('Role:', user.role);

  // Use user info...
  return ok({ user_id: user.uid });
}
```

---

## 🧪 Testing Handlers

### Local Testing

```bash
# Start backend
cd apps/backend-ts
npm run dev

# Test handler
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "my-category.action-one",
    "params": {"input": "test"}
  }'
```

### Production Testing

```bash
# Use Railway URL
BACKEND_URL="https://ts-backend-production-568d.up.railway.app"

curl -X POST $BACKEND_URL/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "key": "my-category.action-one",
    "params": {"input": "test"}
  }'
```

---

## 📦 Handler Categories

Current categories in NUZANTARA:

| Category | Handlers | Description |
|----------|----------|-------------|
| `google-workspace` | 8 | Gmail, Drive, Calendar, Sheets |
| `ai-services` | 10 | AI chat, image generation |
| `bali-zero` | 15 | Pricing, KBLI, Oracle |
| `zantara` | 20 | ZANTARA intelligence |
| `communication` | 10 | WhatsApp, Slack, Email |
| `analytics` | 15 | Dashboard, reports |
| `memory` | 8 | Save, retrieve, search |
| `identity` | 3 | Auth, user management |
| `rag` | 4 | RAG search, generation |
| `maps` | 3 | Google Maps integration |

---

## ✅ Best Practices

### 1. Always Validate Input

```typescript
export async function myHandler(params: any, req?: any) {
  const { required_param, optional_param = 'default' } = params;

  if (!required_param) {
    return err("missing_params: required_param is required");
  }

  // Proceed with validated input
}
```

### 2. Use Descriptive Names

```typescript
// ✅ Good
export async function sendWhatsAppMessage(params: any, req?: any) { }

// ❌ Bad
export async function send(params: any, req?: any) { }
```

### 3. Log Important Events

```typescript
import logger from '../../services/logger.js';

export async function myHandler(params: any, req?: any) {
  logger.info('Handler called', { params, user: req?.user?.uid });

  try {
    // Your logic
    logger.info('Handler success');
    return ok({ data });
  } catch (error) {
    logger.error('Handler failed', error);
    return err(`error: ${error.message}`);
  }
}
```

### 4. Handle Errors Gracefully

```typescript
export async function myHandler(params: any, req?: any) {
  try {
    // Risky operation
    const result = await externalAPI.call();
    return ok(result);
  } catch (error) {
    // Log error
    logger.error('External API failed', error);

    // Return user-friendly error
    return err("external_api_error: Service temporarily unavailable");
  }
}
```

---

## 🔗 Related Documentation

- **API Reference**: [API Documentation](../api/API_DOCUMENTATION.md)
- **Architecture**: [Technical Architecture](../galaxy-map/02-technical-architecture.md)
- **Testing**: [Testing Instructions](../testing/TESTING_INSTRUCTIONS.md)

---

**Start building handlers!** 🚀

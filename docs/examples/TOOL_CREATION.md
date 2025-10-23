# 🔧 Tool Creation Guide

**How to add new tools for ZANTARA to call**

---

## 🎯 What are Tools?

**Tools** are functions that ZANTARA (Claude Haiku 4.5) can call during conversations. Currently: **164 tools** available.

---

## 📋 Tool Pattern

Tools are TypeScript handlers that ZAN TARA can invoke via tool calling.

### Basic Tool Structure

```typescript
// apps/backend-ts/src/handlers/my-tools/weather.ts

import { globalRegistry } from '../../core/handler-registry.js';
import { ok, err } from '../../utils/response.js';

/**
 * Tool: Get Current Weather
 * ZANTARA can call this to get weather info
 */
export async function getCurrentWeather(params: any, req?: any) {
  const { location } = params;

  if (!location) {
    return err("missing_params: location is required");
  }

  // Call weather API
  const weather = await fetchWeatherAPI(location);

  return ok({
    location,
    temperature: weather.temp,
    conditions: weather.conditions,
    humidity: weather.humidity
  });
}

// Register as tool
globalRegistry.registerModule('tools', {
  'weather.get': getCurrentWeather
}, {
  requiresAuth: false,
  description: 'Get current weather for a location',
  version: '1.0'
});
```

---

## 🔧 Real Example: Memory Save Tool

```typescript
// apps/backend-ts/src/handlers/memory/user-memory.ts

export async function userMemorySave(params: any, req?: any) {
  const { user_id, key, value, metadata } = params;

  if (!user_id || !key || !value) {
    return err("missing_params: user_id, key, and value required");
  }

  // Save to PostgreSQL
  const result = await db.query(
    `INSERT INTO memory_facts (user_id, key, value, metadata, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, key) DO UPDATE
     SET value = $3, metadata = $4
     RETURNING id`,
    [user_id, key, value, JSON.stringify(metadata || {})]
  );

  return ok({
    saved: true,
    id: result.rows[0].id,
    user_id,
    key
  });
}

globalRegistry.registerModule('memory', {
  'user.memory.save': userMemorySave
}, {
  requiresAuth: true,
  description: 'Save a memory fact for a user'
});
```

**ZANTARA Usage:**
```
User: "Remember that my favorite color is blue"
ZANTARA: *Calls tool memory.user.memory.save*
  params: {
    user_id: "user_123",
    key: "favorite_color",
    value: "blue"
  }
ZANTARA: "Got it! I've saved that you love blue 💙"
```

---

## 📊 Tool Categories

Current tool categories (164 total):

| Category | Count | Examples |
|----------|-------|----------|
| **Google Workspace** | 8 | `gmail.send`, `drive.upload`, `sheets.read` |
| **AI Services** | 10 | `ai.chat`, `image.generate` |
| **Bali Zero** | 15 | `pricing.get`, `kbli.lookup`, `oracle.analyze` |
| **Communication** | 10 | `whatsapp.send`, `slack.post`, `email.send` |
| **Analytics** | 15 | `dashboard.stats`, `team.performance` |
| **Memory** | 8 | `memory.save`, `memory.retrieve`, `memory.search` |
| **Maps** | 3 | `maps.search`, `maps.directions` |
| **Others** | 95 | Various business operations |

---

## ✅ Tool Best Practices

### 1. Clear Tool Descriptions

```typescript
// ❌ Bad: Vague description
globalRegistry.registerModule('tools', {
  'do-thing': doThing
}, {
  description: 'Does a thing'  // What thing???
});

// ✅ Good: Specific description
globalRegistry.registerModule('tools', {
  'invoice.generate': generateInvoice
}, {
  description: 'Generate PDF invoice for a client with line items and total'
});
```

### 2. Validate All Inputs

```typescript
export async function sendEmail(params: any, req?: any) {
  const { to, subject, body } = params;

  // Validate all required params
  if (!to) return err("missing_params: to is required");
  if (!subject) return err("missing_params: subject is required");
  if (!body) return err("missing_params: body is required");

  // Validate format
  if (!isValidEmail(to)) {
    return err("invalid_email: to must be a valid email address");
  }

  // Proceed with validated inputs
}
```

### 3. Return Structured Data

```typescript
// ❌ Bad: Unstructured string
return ok("The weather is sunny, 25 degrees");

// ✅ Good: Structured object
return ok({
  conditions: "sunny",
  temperature: 25,
  temperature_unit: "celsius",
  humidity: 60,
  wind_speed: 10,
  timestamp: new Date().toISOString()
});
```

### 4. Handle Errors Gracefully

```typescript
export async function fetchData(params: any, req?: any) {
  try {
    const data = await externalAPI.get(params.id);
    return ok(data);
  } catch (error) {
    // Log for debugging
    logger.error('External API failed', error);

    // Return user-friendly error
    if (error.code === 'ENOTFOUND') {
      return err("network_error: Could not reach external service");
    } else if (error.status === 404) {
      return err("not_found: Resource not found");
    } else {
      return err(`api_error: ${error.message}`);
    }
  }
}
```

---

## 🧪 Testing Tools

### 1. Direct Testing

```bash
# Test tool directly
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "memory.user.memory.save",
    "params": {
      "user_id": "test_123",
      "key": "favorite_color",
      "value": "blue"
    }
  }'
```

### 2. Test via ZANTARA

```bash
# Test through chat (ZANTARA will call tool if needed)
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bali-zero.chat",
    "params": {
      "query": "Remember that my favorite color is blue"
    }
  }'

# ZANTARA should automatically call memory.user.memory.save
```

---

## 🔗 Related Documentation

- **Handler Guide**: [Handler Integration](./HANDLER_INTEGRATION.md)
- **API Reference**: [API Documentation](../api/API_DOCUMENTATION.md)
- **Architecture**: [Technical Architecture](../galaxy-map/02-technical-architecture.md)

---

**Build powerful tools for ZANTARA!** 🛠️✨

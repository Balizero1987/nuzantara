# 🔧 ZANTARA Handlers Reference

> **Auto-generated**: 2025-10-28T15:29:17.158Z
> **Total Handlers**: 117
> **Categories**: 35

This document lists all available handlers in the ZANTARA backend.

## 📋 Quick Index

- [activity](#activity)
- [ai](#ai)
- [assistant](#assistant)
- [bali](#bali)
- [calendar](#calendar)
- [collaborator](#collaborator)
- [contact](#contact)
- [contacts](#contacts)
- [daily](#daily)
- [dashboard](#dashboard)
- [discord](#discord)
- [docs](#docs)
- [document](#document)
- [drive](#drive)
- [googlechat](#googlechat)
- [identity](#identity)
- [kbli](#kbli)
- [lead](#lead)
- [maps](#maps)
- [memory](#memory)
- [oauth2](#oauth2)
- [onboarding](#onboarding)
- [oracle](#oracle)
- [price](#price)
- [pricing](#pricing)
- [quote](#quote)
- [rag](#rag)
- [sheets](#sheets)
- [slack](#slack)
- [slides](#slides)
- [system](#system)
- [team](#team)
- [websocket](#websocket)
- [xai](#xai)
- [zantara](#zantara)

---

## activity

### `activity.track`

**Source**: `apps/backend-ts/src/handlers/analytics/daily-drive-recap.ts`

---

## ai

### `ai.anticipate`

AI Anticipate - Predictive analysis for proactive suggestions

**Source**: `apps/backend-ts/src/handlers/ai-services/advanced-ai.ts`

---

### `ai.chat`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `apps/backend-ts/src/handlers/ai-services/ai.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

---

### `ai.learn`

AI Anticipate - Predictive analysis for proactive suggestions

**Source**: `apps/backend-ts/src/handlers/ai-services/advanced-ai.ts`

---

## assistant

### `assistant.route`

---

## bali

### `bali.zero.chat`

RAG Handlers - Proxy to Python RAG backend Integrates Ollama LLM and Bali Zero routing

**Source**: `apps/backend-ts/src/handlers/rag/rag.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *
- `query` `{string}` (required) - Search query (natural language) *
- `specific_service` `{string}` (optional) - Search for specific service by name (e.g., "C1 Tourism", "Working KITAS") *
- `conversation_history` `{Array}` (optional) - Previous conversation turns for context *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

```javascript
* await call('memory.entity.events', { entity: 'google_workspace', category: 'projects' })
```

```javascript
* await call('memory.search.semantic', { query: 'chi aiuta con KITAS?' })
* // Returns: Krisna (KITAS specialist) even if exact keywords don't match
```

```javascript
* await call('memory.search.hybrid', { query: 'tax expert' })
```

```javascript
* // Get all visa prices
* await call('bali.zero.pricing', {
*   service_type: 'visa',
*   include_details: true
* })
*
* // Search for specific service
* await call('bali.zero.pricing', {
*   specific_service: 'Working KITAS',
*   service_type: 'all'
* })
*
* // Get complete pricelist
* await call('bali.zero.pricing', {
*   service_type: 'all'
* })
```

```javascript
* // Query with LLM answer generation
* await call('rag.query', {
*   query: 'What are the requirements for PT PMA company setup?',
*   k: 3,
*   use_llm: true,
*   conversation_history: [
*     { role: 'user', content: 'Tell me about company setup' },
*     { role: 'assistant', content: 'PT PMA is for foreign investors...' }
*   ]
* })
*
* // Fast semantic search only (no LLM)
* await call('rag.query', {
*   query: 'KITAS requirements',
*   k: 5,
*   use_llm: false
* })
```

```javascript
* // Ask about visa requirements
* await call('bali.zero.chat', {
*   query: 'What documents do I need for B211A visa extension?',
*   user_role: 'member',
*   conversation_history: [
*     { role: 'user', content: 'I need a visa' },
*     { role: 'assistant', content: 'B211A is good for tourism...' }
*   ]
* })
*
* // Complex business query (routes to Sonnet)
* await call('bali.zero.chat', {
*   query: 'Compare PT PMA vs Local PT for F&B business with foreign ownership',
*   user_role: 'admin'
* })
```

---

### `bali.zero.price`

**Source**: `apps/backend-ts/src/handlers/bali-zero/bali-zero-pricing.ts`

---

### `bali.zero.pricing`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `apps/backend-ts/src/handlers/bali-zero/bali-zero-pricing.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *
- `query` `{string}` (required) - Search query (natural language) *
- `specific_service` `{string}` (optional) - Search for specific service by name (e.g., "C1 Tourism", "Working KITAS") *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

```javascript
* await call('memory.entity.events', { entity: 'google_workspace', category: 'projects' })
```

```javascript
* await call('memory.search.semantic', { query: 'chi aiuta con KITAS?' })
* // Returns: Krisna (KITAS specialist) even if exact keywords don't match
```

```javascript
* await call('memory.search.hybrid', { query: 'tax expert' })
```

```javascript
* // Get all visa prices
* await call('bali.zero.pricing', {
*   service_type: 'visa',
*   include_details: true
* })
*
* // Search for specific service
* await call('bali.zero.pricing', {
*   specific_service: 'Working KITAS',
*   service_type: 'all'
* })
*
* // Get complete pricelist
* await call('bali.zero.pricing', {
*   service_type: 'all'
* })
```

---

## calendar

### `calendar.create`

**Source**: `apps/backend-ts/src/handlers/google-workspace/calendar.ts`

---

### `calendar.get`

**Source**: `apps/backend-ts/src/handlers/google-workspace/calendar.ts`

---

### `calendar.list`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `apps/backend-ts/src/handlers/google-workspace/calendar.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

---

## collaborator

### `collaborator.daily`

**Source**: `apps/backend-ts/src/handlers/analytics/daily-drive-recap.ts`

---

## contact

### `contact.info`

---

## contacts

### `contacts.create`

**Source**: `apps/backend-ts/src/handlers/google-workspace/contacts.ts`

---

### `contacts.list`

**Source**: `apps/backend-ts/src/handlers/google-workspace/contacts.ts`

---

## daily

### `daily.recap.current`

**Source**: `apps/backend-ts/src/handlers/analytics/daily-drive-recap.ts`

---

### `daily.recap.update`

**Source**: `apps/backend-ts/src/handlers/analytics/daily-drive-recap.ts`

---

## dashboard

### `dashboard.conversations`

**Source**: `apps/backend-ts/src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.handlers`

**Source**: `apps/backend-ts/src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.health`

**Source**: `apps/backend-ts/src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.main`

**Source**: `apps/backend-ts/src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.services`

**Source**: `apps/backend-ts/src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.users`

**Source**: `apps/backend-ts/src/handlers/analytics/dashboard-analytics.ts`

---

## discord

### `discord.notify`

**Source**: `apps/backend-ts/src/handlers/communication/communication.ts`

---

## docs

### `docs.create`

**Source**: `apps/backend-ts/src/handlers/google-workspace/docs.ts`

---

### `docs.read`

**Source**: `apps/backend-ts/src/handlers/google-workspace/docs.ts`

---

### `docs.update`

**Source**: `apps/backend-ts/src/handlers/google-workspace/docs.ts`

---

## document

### `document.prepare`

---

## drive

### `drive.list`

**Source**: `apps/backend-ts/src/handlers/google-workspace/drive.ts`

---

### `drive.read`

**Source**: `apps/backend-ts/src/handlers/google-workspace/drive.ts`

---

### `drive.search`

**Source**: `apps/backend-ts/src/handlers/google-workspace/drive.ts`

---

### `drive.upload`

**Source**: `apps/backend-ts/src/handlers/google-workspace/drive-multipart.ts`

---

## googlechat

### `googlechat.notify`

**Source**: `apps/backend-ts/src/handlers/communication/communication.ts`

---

## identity

### `identity.resolve`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `apps/backend-ts/src/handlers/identity/identity.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

---

## kbli

### `kbli.lookup`

---

### `kbli.requirements`

---

## lead

### `lead.save`

---

## maps

### `maps.directions`

**Source**: `apps/backend-ts/src/handlers/maps/maps.ts`

---

### `maps.placeDetails`

**Source**: `apps/backend-ts/src/handlers/maps/maps.ts`

---

### `maps.places`

**Source**: `apps/backend-ts/src/handlers/maps/maps.ts`

---

## memory

### `memory.cache.clear`

---

### `memory.cache.stats`

---

### `memory.entities`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

---

### `memory.entity.events`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

```javascript
* await call('memory.entity.events', { entity: 'google_workspace', category: 'projects' })
```

---

### `memory.entity.info`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

---

### `memory.event.save`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

---

### `memory.list`

---

### `memory.retrieve`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `apps/backend-ts/src/handlers/memory/memory.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

---

### `memory.save`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `apps/backend-ts/src/handlers/memory/memory.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

---

### `memory.search`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `apps/backend-ts/src/handlers/memory/memory.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

---

### `memory.search.entity`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

---

### `memory.search.hybrid`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *
- `query` `{string}` (required) - Search query (natural language) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

```javascript
* await call('memory.entity.events', { entity: 'google_workspace', category: 'projects' })
```

```javascript
* await call('memory.search.semantic', { query: 'chi aiuta con KITAS?' })
* // Returns: Krisna (KITAS specialist) even if exact keywords don't match
```

```javascript
* await call('memory.search.hybrid', { query: 'tax expert' })
```

---

### `memory.search.semantic`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *
- `query` `{string}` (required) - Search query (natural language) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

```javascript
* await call('memory.entity.events', { entity: 'google_workspace', category: 'projects' })
```

```javascript
* await call('memory.search.semantic', { query: 'chi aiuta con KITAS?' })
* // Returns: Krisna (KITAS specialist) even if exact keywords don't match
```

---

### `memory.timeline.get`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

---

## oauth2

### `oauth2.available`

---

### `oauth2.refresh`

---

### `oauth2.status`

---

## onboarding

### `onboarding.ambaradam.start`

**Source**: `apps/backend-ts/src/handlers/identity/identity.ts`

---

### `onboarding.start`

**Source**: `apps/backend-ts/src/handlers/identity/identity.ts`

---

## oracle

### `oracle.analyze`

**Source**: `apps/backend-ts/src/handlers/bali-zero/oracle.ts`

---

### `oracle.predict`

**Source**: `apps/backend-ts/src/handlers/bali-zero/oracle.ts`

---

### `oracle.simulate`

**Source**: `apps/backend-ts/src/handlers/bali-zero/oracle.ts`

---

## price

### `price.lookup`

**Source**: `apps/backend-ts/src/handlers/bali-zero/bali-zero-pricing.ts`

---

## pricing

### `pricing.official`

**Source**: `apps/backend-ts/src/handlers/bali-zero/bali-zero-pricing.ts`

---

## quote

### `quote.generate`

---

## rag

### `rag.health`

RAG Handlers - Proxy to Python RAG backend Integrates Ollama LLM and Bali Zero routing

**Source**: `apps/backend-ts/src/handlers/rag/rag.ts`

---

### `rag.query`

RAG Handlers - Proxy to Python RAG backend Integrates Ollama LLM and Bali Zero routing

**Source**: `apps/backend-ts/src/handlers/rag/rag.ts`

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *
- `query` `{string}` (required) - Search query (natural language) *
- `specific_service` `{string}` (optional) - Search for specific service by name (e.g., "C1 Tourism", "Working KITAS") *
- `conversation_history` `{Array}` (optional) - Previous conversation turns for context *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

```javascript
* await call('memory.entity.events', { entity: 'google_workspace', category: 'projects' })
```

```javascript
* await call('memory.search.semantic', { query: 'chi aiuta con KITAS?' })
* // Returns: Krisna (KITAS specialist) even if exact keywords don't match
```

```javascript
* await call('memory.search.hybrid', { query: 'tax expert' })
```

```javascript
* // Get all visa prices
* await call('bali.zero.pricing', {
*   service_type: 'visa',
*   include_details: true
* })
*
* // Search for specific service
* await call('bali.zero.pricing', {
*   specific_service: 'Working KITAS',
*   service_type: 'all'
* })
*
* // Get complete pricelist
* await call('bali.zero.pricing', {
*   service_type: 'all'
* })
```

```javascript
* // Query with LLM answer generation
* await call('rag.query', {
*   query: 'What are the requirements for PT PMA company setup?',
*   k: 3,
*   use_llm: true,
*   conversation_history: [
*     { role: 'user', content: 'Tell me about company setup' },
*     { role: 'assistant', content: 'PT PMA is for foreign investors...' }
*   ]
* })
*
* // Fast semantic search only (no LLM)
* await call('rag.query', {
*   query: 'KITAS requirements',
*   k: 5,
*   use_llm: false
* })
```

---

### `rag.search`

RAG Handlers - Proxy to Python RAG backend Integrates Ollama LLM and Bali Zero routing

**Source**: `apps/backend-ts/src/handlers/rag/rag.ts`

---

## sheets

### `sheets.append`

**Source**: `apps/backend-ts/src/handlers/google-workspace/sheets.ts`

---

### `sheets.create`

**Source**: `apps/backend-ts/src/handlers/google-workspace/sheets.ts`

---

### `sheets.read`

**Source**: `apps/backend-ts/src/handlers/google-workspace/sheets.ts`

---

## slack

### `slack.notify`

Slack webhook notification handler

**Source**: `apps/backend-ts/src/handlers/communication/communication.ts`

---

## slides

### `slides.create`

**Source**: `apps/backend-ts/src/handlers/google-workspace/slides.ts`

---

### `slides.read`

**Source**: `apps/backend-ts/src/handlers/google-workspace/slides.ts`

---

### `slides.update`

**Source**: `apps/backend-ts/src/handlers/google-workspace/slides.ts`

---

## system

### `system.handler.execute`

HANDLER PROXY Allows RAG backend to execute TypeScript handlers via HTTP

**Source**: `apps/backend-ts/src/handlers/system/handler-proxy.ts`

---

### `system.handlers.batch`

HANDLER PROXY Allows RAG backend to execute TypeScript handlers via HTTP

**Source**: `apps/backend-ts/src/handlers/system/handler-proxy.ts`

---

### `system.handlers.category`

HANDLERS INTROSPECTION Exposes complete handler registry for RAG backend tool use

**Source**: `apps/backend-ts/src/handlers/system/handlers-introspection.ts`

---

### `system.handlers.get`

HANDLERS INTROSPECTION Exposes complete handler registry for RAG backend tool use

**Source**: `apps/backend-ts/src/handlers/system/handlers-introspection.ts`

---

### `system.handlers.list`

HANDLERS INTROSPECTION Exposes complete handler registry for RAG backend tool use

**Source**: `apps/backend-ts/src/handlers/system/handlers-introspection.ts`

---

### `system.handlers.tools`

HANDLERS INTROSPECTION Exposes complete handler registry for RAG backend tool use

**Source**: `apps/backend-ts/src/handlers/system/handlers-introspection.ts`

---

## team

### `team.departments`

---

### `team.get`

---

### `team.list`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

---

### `team.login`

🔐 Professional Team Login System with PIN Authentication Features: bcrypt hashing, JWT tokens, rate limiting, session management Version: 2.0 - Secure Edition

**Source**: `apps/backend-ts/src/handlers/auth/team-login-secure.ts`

---

### `team.login.reset`

🔐 Professional Team Login System with PIN Authentication Features: bcrypt hashing, JWT tokens, rate limiting, session management Version: 2.0 - Secure Edition

**Source**: `apps/backend-ts/src/handlers/auth/team-login-secure.ts`

---

### `team.login.secure`

🔐 Professional Team Login System with PIN Authentication Features: bcrypt hashing, JWT tokens, rate limiting, session management Version: 2.0 - Secure Edition

**Source**: `apps/backend-ts/src/handlers/auth/team-login-secure.ts`

---

### `team.logout`

---

### `team.members`

---

### `team.members.legacy`

---

### `team.recent_activity`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

---

### `team.test.recognition`

---

### `team.token.verify`

---

## websocket

### `websocket.broadcast`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Parameters**:

- `email` `{string}` (optional) - User email address *
- `identity_hint` `{string}` (optional) - Identity hint (automatically mapped to email) *
- `metadata` `{object}` (optional) - Additional user metadata (name, company, phone, etc.) *
- `department` `{string}` (optional) - Filter by department (management, setup, tax, marketing, reception, advisory, technology) *
- `role` `{string}` (optional) - Filter by role (partial match, e.g., "Lead", "Manager", "Executive") *
- `search` `{string}` (optional) - Search by name or email (case-insensitive) *
- `prompt` `{string}` (required) - User prompt or message (required) *
- `message` `{string}` (optional) - Alternative to prompt *
- `model` `{string}` (optional) - Specific model override *
- `timeMin` `{string}` (optional) - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z") *
- `timeMax` `{string}` (optional) - RFC3339 timestamp for range end *
- `q` `{string}` (optional) - Free text search query *
- `userId` `{string}` (required) - User ID (required) *
- `content` `{string}` (optional) - Memory content to save (preferred format) *
- `key` `{string}` (optional) - Memory key for key-value format *
- `value` `{any}` (optional) - Memory value for key-value format *
- `data` `{object}` (optional) - Memory data object or string *
- `entity` `{string}` (required) - Entity name to search for *
- `category` `{string}` (optional) - Entity category (people/projects/skills/companies) *
- `event` `{string}` (required) - Event description *
- `timestamp` `{string}` (optional) - ISO timestamp (defaults to now) *
- `startDate` `{string}` (optional) - ISO date (inclusive) *
- `endDate` `{string}` (optional) - ISO date (inclusive) *
- `query` `{string}` (required) - Search query (natural language) *
- `specific_service` `{string}` (optional) - Search for specific service by name (e.g., "C1 Tourism", "Working KITAS") *
- `conversation_history` `{Array}` (optional) - Previous conversation turns for context *
- `channel` `{string}` (required) - Channel name to broadcast to (required) *
- `excludeClientId` `{string}` (optional) - Client ID to exclude from broadcast (e.g., sender) *

**Returns**: {Promise<{ok: boolean, userId: string, email: string, profile: object, isNew: boolean}>} Resolved user identity *

**Examples**:

```javascript
* // Resolve existing user
* await call('identity.resolve', {
*   email: 'john
```

```javascript
* // Get all team members
* await call('team.list', {})
*
* // Get setup team only
* await call('team.list', {
*   department: 'setup'
* })
*
* // Search for specific member
* await call('team.list', {
*   search: 'Amanda'
* })
*
* // Filter by role
* await call('team.list', {
*   role: 'Lead Executive'
* })
```

```javascript
* // Get activities in last 24 hours
* await call('team.recent_activity', { hours: 24 })
*
* // Get activities for setup department only
* await call('team.recent_activity', {
*   hours: 24,
*   department: 'setup'
* })
```

```javascript
* // Basic chat
* await call('ai.chat', {
*   prompt: 'Explain PT PMA company structure in simple terms'
* })
*
* // With custom parameters
* await call('ai.chat', {
*   prompt: 'Draft professional email for visa extension reminder',
*   max_tokens: 500,
*   temperature: 0.3
* })
*
* // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
```

```javascript
* // Get upcoming events
* await call('calendar.list', {
*   timeMin: new Date().toISOString(),
*   maxResults: 20,
*   singleEvents: true
* })
*
* // Search for specific events
* await call('calendar.list', {
*   q: 'meeting with client',
*   timeMin: '2025-01-01T00:00:00Z',
*   timeMax: '2025-12-31T23:59:59Z'
* })
```

```javascript
* // Save user preference
* await call('memory.save', {
*   userId: 'user123',
*   content: 'Prefers Italian language for communication',
*   type: 'preference',
*   metadata: { source: 'chat', confidence: 'high' }
* })
*
* // Save with key-value format
* await call('memory.save', {
*   userId: 'client456',
*   key: 'visa_type',
*   value: 'B211A Tourist Visa',
*   type: 'service_interest'
* })
```

```javascript
* // Retrieve all memory for user
* await call('memory.retrieve', {
*   userId: 'user123'
* })
*
* // Retrieve specific memory fact
* await call('memory.retrieve', {
*   userId: 'client456',
*   key: 'visa_type'
* })
```

```javascript
* await call('memory.search.entity', { entity: 'zero' })
```

```javascript
* await call('memory.entities', { userId: 'zero' })
```

```javascript
* await call('memory.entity.info', { entity: 'zero' })
```

```javascript
* await call('memory.event.save', { userId: 'zero', event: 'Deployed Google Workspace', type: 'deployment' })
```

```javascript
* await call('memory.timeline.get', { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-05' })
```

```javascript
* await call('memory.entity.events', { entity: 'google_workspace', category: 'projects' })
```

```javascript
* await call('memory.search.semantic', { query: 'chi aiuta con KITAS?' })
* // Returns: Krisna (KITAS specialist) even if exact keywords don't match
```

```javascript
* await call('memory.search.hybrid', { query: 'tax expert' })
```

```javascript
* // Get all visa prices
* await call('bali.zero.pricing', {
*   service_type: 'visa',
*   include_details: true
* })
*
* // Search for specific service
* await call('bali.zero.pricing', {
*   specific_service: 'Working KITAS',
*   service_type: 'all'
* })
*
* // Get complete pricelist
* await call('bali.zero.pricing', {
*   service_type: 'all'
* })
```

```javascript
* // Query with LLM answer generation
* await call('rag.query', {
*   query: 'What are the requirements for PT PMA company setup?',
*   k: 3,
*   use_llm: true,
*   conversation_history: [
*     { role: 'user', content: 'Tell me about company setup' },
*     { role: 'assistant', content: 'PT PMA is for foreign investors...' }
*   ]
* })
*
* // Fast semantic search only (no LLM)
* await call('rag.query', {
*   query: 'KITAS requirements',
*   k: 5,
*   use_llm: false
* })
```

```javascript
* // Ask about visa requirements
* await call('bali.zero.chat', {
*   query: 'What documents do I need for B211A visa extension?',
*   user_role: 'member',
*   conversation_history: [
*     { role: 'user', content: 'I need a visa' },
*     { role: 'assistant', content: 'B211A is good for tourism...' }
*   ]
* })
*
* // Complex business query (routes to Sonnet)
* await call('bali.zero.chat', {
*   query: 'Compare PT PMA vs Local PT for F&B business with foreign ownership',
*   user_role: 'admin'
* })
```

```javascript
* // Broadcast system notification
* await call('websocket.broadcast', {
*   channel: 'system',
*   data: {
*     type: 'announcement',
*     message: 'Server maintenance in 10 minutes',
*     priority: 'high'
*   }
* })
*
* // Broadcast to specific channel, exclude sender
* await call('websocket.broadcast', {
*   channel: 'team-updates',
*   data: { event: 'new-lead', lead_id: 'lead_123' },
*   excludeClientId: 'client_abc'
* })
```

---

### `websocket.send`

---

### `websocket.stats`

---

## xai

### `xai.explain`

AI Anticipate - Predictive analysis for proactive suggestions

**Source**: `apps/backend-ts/src/handlers/ai-services/advanced-ai.ts`

---

## zantara

### `zantara.anticipate.needs`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.attune`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.celebration.orchestrate`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.client.relationship.intelligence`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.communication.adapt`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.conflict.mediate`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.conflict.prediction`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.cultural.intelligence.adaptation`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.dashboard.overview`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-dashboard.ts`

---

### `zantara.emotional.profile.advanced`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.growth.track`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.learn.together`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.mood.sync`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.multi.project.orchestration`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.performance.analytics`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-dashboard.ts`

---

### `zantara.performance.optimization`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.personality.profile`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.synergy.map`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-test.ts`

---

### `zantara.system.diagnostics`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-dashboard.ts`

---

### `zantara.team.health.monitor`

**Source**: `apps/backend-ts/src/handlers/zantara/zantara-dashboard.ts`

---

## 🚀 Usage Guide

### Making a Handler Call

All handlers are called via the `/call` endpoint:

```javascript
POST /call
Content-Type: application/json
x-api-key: <your-api-key>

{
  "key": "handler.name",
  "params": {
    // handler-specific parameters
  }
}
```

### Response Format

```javascript
{
  "ok": true,
  "data": {
    // handler response data
  }
}
```

### Error Handling

```javascript
{
  "ok": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔐 Authentication

Most handlers require authentication via `x-api-key` header.

**Available Keys**:
- Internal: Full access to all handlers
- External: Limited access (no admin/internal operations)

## 📊 Handler Categories

- **zantara**: 20 handlers
- **memory**: 14 handlers
- **team**: 12 handlers
- **dashboard**: 6 handlers
- **system**: 6 handlers
- **drive**: 4 handlers
- **oracle**: 3 handlers
- **ai**: 3 handlers
- **calendar**: 3 handlers
- **sheets**: 3 handlers
- **docs**: 3 handlers
- **slides**: 3 handlers
- **maps**: 3 handlers
- **bali**: 3 handlers
- **rag**: 3 handlers
- **websocket**: 3 handlers
- **oauth2**: 3 handlers
- **onboarding**: 2 handlers
- **kbli**: 2 handlers
- **contacts**: 2 handlers
- **daily**: 2 handlers
- **identity**: 1 handlers
- **contact**: 1 handlers
- **lead**: 1 handlers
- **quote**: 1 handlers
- **document**: 1 handlers
- **assistant**: 1 handlers
- **slack**: 1 handlers
- **discord**: 1 handlers
- **googlechat**: 1 handlers
- **xai**: 1 handlers
- **pricing**: 1 handlers
- **price**: 1 handlers
- **collaborator**: 1 handlers
- **activity**: 1 handlers


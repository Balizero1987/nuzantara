# 🔧 ZANTARA Handlers Reference

> **Auto-generated**: 2025-10-05T09:05:23.060Z
> **Total Handlers**: 104
> **Categories**: 38

This document lists all available handlers in the ZANTARA backend.

## 📋 Quick Index

- [activity](#activity)
- [ai](#ai)
- [assistant](#assistant)
- [bali](#bali)
- [calendar](#calendar)
- [claude](#claude)
- [cohere](#cohere)
- [collaborator](#collaborator)
- [contact](#contact)
- [contacts](#contacts)
- [daily](#daily)
- [dashboard](#dashboard)
- [discord](#discord)
- [docs](#docs)
- [document](#document)
- [drive](#drive)
- [gemini](#gemini)
- [googlechat](#googlechat)
- [identity](#identity)
- [kbli](#kbli)
- [lead](#lead)
- [maps](#maps)
- [memory](#memory)
- [oauth2](#oauth2)
- [onboarding](#onboarding)
- [openai](#openai)
- [oracle](#oracle)
- [price](#price)
- [pricing](#pricing)
- [quote](#quote)
- [rag](#rag)
- [sheets](#sheets)
- [slack](#slack)
- [slides](#slides)
- [team](#team)
- [websocket](#websocket)
- [xai](#xai)
- [zantara](#zantara)

---

## activity

### `activity.track`

**Source**: `src/handlers/analytics/daily-drive-recap.ts`

---

## ai

### `ai.anticipate`

AI Anticipate - Predictive analysis for proactive suggestions

**Source**: `src/handlers/ai-services/advanced-ai.ts`

---

### `ai.chat`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `src/handlers/ai-services/ai-enhanced.ts`

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

**Source**: `src/handlers/ai-services/advanced-ai.ts`

---

## assistant

### `assistant.route`

---

## bali

### `bali.zero.chat`

RAG Handlers - Proxy to Python RAG backend Integrates Ollama LLM and Bali Zero routing

**Source**: `src/handlers/rag/rag.ts`

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

**Source**: `src/handlers/bali-zero/bali-zero-pricing.ts`

---

### `bali.zero.pricing`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `src/handlers/bali-zero/bali-zero-pricing.ts`

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

**Source**: `src/handlers/google-workspace/calendar.ts`

---

### `calendar.get`

**Source**: `src/handlers/google-workspace/calendar.ts`

---

### `calendar.list`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `src/handlers/google-workspace/calendar.ts`

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

## claude

### `claude.chat`

**Source**: `src/handlers/ai-services/ai.ts`

---

## cohere

### `cohere.chat`

**Source**: `src/handlers/ai-services/ai.ts`

---

## collaborator

### `collaborator.daily`

**Source**: `src/handlers/analytics/daily-drive-recap.ts`

---

## contact

### `contact.info`

---

## contacts

### `contacts.create`

**Source**: `src/handlers/google-workspace/contacts.ts`

---

### `contacts.list`

**Source**: `src/handlers/google-workspace/contacts.ts`

---

## daily

### `daily.recap.current`

**Source**: `src/handlers/analytics/daily-drive-recap.ts`

---

### `daily.recap.update`

**Source**: `src/handlers/analytics/daily-drive-recap.ts`

---

## dashboard

### `dashboard.conversations`

**Source**: `src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.handlers`

**Source**: `src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.health`

**Source**: `src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.main`

**Source**: `src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.services`

**Source**: `src/handlers/analytics/dashboard-analytics.ts`

---

### `dashboard.users`

**Source**: `src/handlers/analytics/dashboard-analytics.ts`

---

## discord

### `discord.notify`

**Source**: `src/handlers/communication/communication.ts`

---

## docs

### `docs.create`

**Source**: `src/handlers/google-workspace/docs.ts`

---

### `docs.read`

**Source**: `src/handlers/google-workspace/docs.ts`

---

### `docs.update`

**Source**: `src/handlers/google-workspace/docs.ts`

---

## document

### `document.prepare`

---

## drive

### `drive.list`

**Source**: `src/handlers/google-workspace/drive.ts`

---

### `drive.read`

**Source**: `src/handlers/google-workspace/drive.ts`

---

### `drive.search`

**Source**: `src/handlers/google-workspace/drive.ts`

---

### `drive.upload`

**Source**: `src/handlers/google-workspace/drive-multipart.ts`

---

## gemini

### `gemini.chat`

**Source**: `src/handlers/ai-services/ai.ts`

---

## googlechat

### `googlechat.notify`

**Source**: `src/handlers/communication/communication.ts`

---

## identity

### `identity.resolve`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `src/handlers/identity/identity.ts`

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

**Source**: `src/handlers/maps/maps.ts`

---

### `maps.placeDetails`

**Source**: `src/handlers/maps/maps.ts`

---

### `maps.places`

**Source**: `src/handlers/maps/maps.ts`

---

## memory

### `memory.entities`

Extract entities (people, projects, skills) from text Simple pattern matching - can be enhanced with NER later

**Source**: `src/handlers/memory/memory-firestore.ts`

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

Extract entities from text (same logic as memory-firestore)

**Source**: `src/handlers/memory/episodes-firestore.ts`

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

Extract entities (people, projects, skills) from text Simple pattern matching - can be enhanced with NER later

**Source**: `src/handlers/memory/memory-firestore.ts`

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

Extract entities from text (same logic as memory-firestore)

**Source**: `src/handlers/memory/episodes-firestore.ts`

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

**Source**: `src/handlers/memory/memory-firestore.ts`

---

### `memory.retrieve`

Resolve user identity from email or identity hint, creating profile if needed. Core handler for user identification and AMBARADAM integration. *

**Source**: `src/handlers/memory/memory-firestore.ts`

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

**Source**: `src/handlers/memory/memory-firestore.ts`

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

Extract entities (people, projects, skills) from text Simple pattern matching - can be enhanced with NER later

**Source**: `src/handlers/memory/memory-firestore.ts`

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

Extract entities (people, projects, skills) from text Simple pattern matching - can be enhanced with NER later

**Source**: `src/handlers/memory/memory-firestore.ts`

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

Extract entities (people, projects, skills) from text Simple pattern matching - can be enhanced with NER later

**Source**: `src/handlers/memory/memory-firestore.ts`

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

Extract entities (people, projects, skills) from text Simple pattern matching - can be enhanced with NER later

**Source**: `src/handlers/memory/memory-firestore.ts`

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

Extract entities from text (same logic as memory-firestore)

**Source**: `src/handlers/memory/episodes-firestore.ts`

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

**Source**: `src/handlers/identity/identity.ts`

---

### `onboarding.start`

**Source**: `src/handlers/identity/identity.ts`

---

## openai

### `openai.chat`

**Source**: `src/handlers/ai-services/ai.ts`

---

## oracle

### `oracle.analyze`

**Source**: `src/handlers/bali-zero/oracle.ts`

---

### `oracle.predict`

**Source**: `src/handlers/bali-zero/oracle.ts`

---

### `oracle.simulate`

**Source**: `src/handlers/bali-zero/oracle.ts`

---

## price

### `price.lookup`

**Source**: `src/handlers/bali-zero/bali-zero-pricing.ts`

---

## pricing

### `pricing.official`

**Source**: `src/handlers/bali-zero/bali-zero-pricing.ts`

---

## quote

### `quote.generate`

---

## rag

### `rag.health`

RAG Handlers - Proxy to Python RAG backend Integrates Ollama LLM and Bali Zero routing

**Source**: `src/handlers/rag/rag.ts`

---

### `rag.query`

RAG Handlers - Proxy to Python RAG backend Integrates Ollama LLM and Bali Zero routing

**Source**: `src/handlers/rag/rag.ts`

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

**Source**: `src/handlers/rag/rag.ts`

---

## sheets

### `sheets.append`

**Source**: `src/handlers/google-workspace/sheets.ts`

---

### `sheets.create`

**Source**: `src/handlers/google-workspace/sheets.ts`

---

### `sheets.read`

**Source**: `src/handlers/google-workspace/sheets.ts`

---

## slack

### `slack.notify`

Slack webhook notification handler

**Source**: `src/handlers/communication/communication.ts`

---

## slides

### `slides.create`

**Source**: `src/handlers/google-workspace/slides.ts`

---

### `slides.read`

**Source**: `src/handlers/google-workspace/slides.ts`

---

### `slides.update`

**Source**: `src/handlers/google-workspace/slides.ts`

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

**Source**: `src/handlers/ai-services/advanced-ai.ts`

---

## zantara

### `zantara.anticipate.needs`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.attune`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.celebration.orchestrate`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.client.relationship.intelligence`

**Source**: `src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.communication.adapt`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.conflict.mediate`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.conflict.prediction`

**Source**: `src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.cultural.intelligence.adaptation`

**Source**: `src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.dashboard.overview`

**Source**: `src/handlers/zantara/zantara-dashboard.ts`

---

### `zantara.emotional.profile.advanced`

**Source**: `src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.growth.track`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.learn.together`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.mood.sync`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.multi.project.orchestration`

**Source**: `src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.performance.analytics`

**Source**: `src/handlers/zantara/zantara-dashboard.ts`

---

### `zantara.performance.optimization`

**Source**: `src/handlers/zantara/zantara-v2-simple.ts`

---

### `zantara.personality.profile`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.synergy.map`

**Source**: `src/handlers/zantara/zantara-test.ts`

---

### `zantara.system.diagnostics`

**Source**: `src/handlers/zantara/zantara-dashboard.ts`

---

### `zantara.team.health.monitor`

**Source**: `src/handlers/zantara/zantara-dashboard.ts`

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
- **memory**: 12 handlers
- **dashboard**: 6 handlers
- **drive**: 4 handlers
- **team**: 3 handlers
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
- **openai**: 1 handlers
- **claude**: 1 handlers
- **gemini**: 1 handlers
- **cohere**: 1 handlers
- **slack**: 1 handlers
- **discord**: 1 handlers
- **googlechat**: 1 handlers
- **xai**: 1 handlers
- **pricing**: 1 handlers
- **price**: 1 handlers
- **collaborator**: 1 handlers
- **activity**: 1 handlers


# Test Plan — 15 Critical Handlers (Memory, Business Ops, Maps)

Goal
- Validate end-to-end execution via `POST /call` with `x-api-key: API_KEYS_INTERNAL`.
- Confirm tool exposure via `system.handlers.tools` includes all 15 handlers.

Targets (15)
- Memory (9):
  - `memory.search.semantic`
  - `memory.search.hybrid`
  - `memory.search.entity`
  - `memory.entities`
  - `memory.entity.info`
  - `memory.entity.events`
  - `memory.event.save`
  - `memory.timeline.get`
  - `memory.search` (baseline)
- Business Ops (3): `lead.save`, `quote.generate`, `document.prepare`
- Maps (3): `maps.directions`, `maps.places`, `maps.placeDetails`

Environments
- Prod: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app
- Local: http://localhost:8080

Headers
- `Content-Type: application/json`
- `x-api-key: zantara-internal-dev-key-2025`

Pre-checks
1) Tools list count = 57
   - Call: `{ "key": "system.handlers.tools" }`
   - Expect: `ok: true`, `data.total >= 57`, includes the 15 keys above.

Test Cases (examples)
... (see home copy if needed)


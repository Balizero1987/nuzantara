// filepath: /Users/antonellosiano/Desktop/chatgpt/docs/handler-pattern-standardization.md
# Zantara Unified Routing: Handler Pattern

This guide standardizes Zantara on a Handler-first pattern with a single, unified routing system.

> **🆕 New in v0.1.1:** The unified router now includes automatic conflict detection and performance analytics! See [Routing Guardrails & Analytics](./routing-guardrails-analytics.md) for details.

## Why the Handler pattern

- Separation of concerns: route wiring and business logic are decoupled.
- Type-safety end-to-end: Zod schemas drive request parsing and response typing.
- Lower boilerplate: no per-route adapters; one small wrapper adds validation + JSON send.
- Testability: handlers are plain functions over a typed context.

## Unified API surface

- Handlers: `(ctx) => Result | Promise<Result>` where `Result` is JSON-serializable.
- If a handler writes to `res` manually, the router detects `headersSent` and skips auto-send.
- Zod validation (optional) for `params`, `query`, `body`, and `response`.
- Route registration uses `registerRoutes()` over a list of `RouteDefinition` objects.

```ts
// src/routes.ts
import { defineRoutes, schemas as s } from './routing/unified-router.js';

export const routes = defineRoutes({
  method: 'get',
  path: '/health',
  name: 'health',
  handler: async () => ({ status: 'ok' }),
  validate: { response: s.z.object({ status: s.z.literal('ok') }) },
});
```

## Performance: Express vs Handler wrapper

- Baseline: Express route calling an async function that returns `res.json(..)`.
- Unified handler adds:
  - Optional Zod parse for params/query/body (skipped if not provided).
  - One branch to either `res.json(result)` or `204 No Content` when `undefined`.
- Overhead is effectively ~0 for unvalidated routes and within noise for validated routes.
- Autocannon bench (see `npm run bench`) targets `/health` and should be within the same throughput and latency envelope as the traditional approach on Node 20+.

## Migration impact

- Router: replace `app.METHOD(path, middleware..., controller)` with a `RouteDefinition` entry.
- Controllers become handlers: change signature to take `{ req, res, next }` and return data.
- Validation moves into `validate` with Zod. You can migrate incrementally: start with no validation.
- Middlewares: keep existing Express middlewares via `middlewares: []` inside the route definition.

### Suggested steps

1. Create new route definitions in `src/routes.ts` for a feature slice.
2. Move controller logic into a handler function that returns plain data.
3. Add Zod validation if available (optional initially).
4. Delete adapter wrappers (`router.ts`) once a slice is migrated.
5. Repeat per slice until all routes are moved.

A helper script `npm run migrate` writes a skeleton in `scripts/.migrate/migrated-routes.ts` by scanning `app.METHOD()` usages. Review and refine.

## Backward compatibility

- Middlewares: pass through unchanged via `middlewares`.
- Manual responses: handlers can still call `res.status(...).json(...)` directly; the wrapper will detect `headersSent`.
- Status codes: if a handler returns `undefined`, the router sends 204 No Content; otherwise returns `200` with JSON. For custom codes, set them via `res` directly.
- Path and methods adhere to Express semantics (strict, case sensitive router).

## Success criteria

- No functionality loss: existing endpoints behave identically.
- Equal or better performance on `/health` and typical endpoints.
- Fewer files and no adapter boilerplate.

## FAQ

- Can I stream? Yes—write to `res` directly; the wrapper won't auto-send when headers are sent.
- Error handling? Throw to hit the global error handler or call `next(err)`.
- Response typing? Provide `validate.response` with a Zod schema to enforce output shape.

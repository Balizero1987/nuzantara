# API Design, Handlers, and Testing Playbook

## 1. API Design (Contract Before Code)
- Use a consistent style for resources, verbs, status codes, naming, and versioning.
- Follow canonical references: Microsoft REST API Guidelines and Google API Design Guide (AIP).
- Define the API with OpenAPI 3.1 and JSON Schema 2020-12 to unlock code generation, validation, and automated docs.
- Apply proper HTTP method semantics (safe, idempotent) and status codes (201, 204, 400, 401, 403, 404, 409, 422, 429, 5xx) per RFC 9110.
- Return errors using Problem Details (RFC 9457): include `type`, `title`, `status`, `detail`, `instance`, and optional field-specific `errors`.
- Implement predictable pagination: offset or page for small datasets, cursor-based for large ones; expose navigation links (for example `Link: <...>; rel="next"`).
- Surface rate limiting clearly: respond with 429, set Retry-After, and consider emerging RateLimit-* headers (IETF draft).
- Provide idempotency for sensitive POST/PATCH endpoints using idempotency keys (Stripe pattern, IETF draft).
- Support caching and optimistic concurrency with ETag plus `If-Match`/`If-None-Match`.
- Represent timestamps in RFC 3339 UTC format (`2025-09-24T12:34:56Z`).
- Configure CORS intentionally; avoid wildcard `*` in production and support preflight needs.
- Design security controls based on OWASP API Security Top 10 (2023) threats (BOLA, auth, excessive data, etc.).
- Instrument observability end-to-end with OpenTelemetry traces, metrics, and logs.

## 2. Handlers and Endpoints (Clean Structure)
**Lean handler recipe**
1. Parse and validate input (JSON Schema/OpenAPI).
2. Authorise (RBAC/ABAC) before business logic.
3. Delegate business logic to services (testable separately).
4. Map responses to DTOs; avoid leaking database entities.
5. Set correct status codes and headers (ETag, Location, Link, Retry-After).
6. Emit Problem Details on errors.

Apply 12-Factor principles for configuration and environment portability.

## 3. Test Strategy (Avoid "All E2E")
- Follow the testing pyramid: many unit tests, fewer integration, minimal E2E, aligned with Google Small/Medium/Large classification.
- Use reliable integrations with real, isolated dependencies:
  - Testcontainers for disposable databases/brokers in CI.
  - Consumer-driven contract testing with Pact to prevent service drift.
  - WireMock or MSW for upstream mocks (backend/frontend).
  - Playwright for browser flows; Postman/Newman for API regression suites.
- Capture observability data (traces/logs) during tests to diagnose failures (OpenTelemetry exporters in CI).

## 4. Quick Recipes by Stack
- **Node.js (Express/Fastify)**: Jest + Supertest.
- **Python (FastAPI)**: pytest + TestClient/HTTPX with dependency overrides.
- **Java (Spring Boot)**: MockMvc for web layer; TestRestTemplate + Testcontainers for full stack.
- **.NET (ASP.NET Core)**: `WebApplicationFactory<T>` with in-memory test host.
- **Go**: `net/http/httptest` (`NewRecorder`, `NewRequest`).
- **E2E/Mocks**: Playwright (browser), MSW (frontend) or WireMock (services), Newman for API regression in CI.

## 5. Checklist (Ready for README)
**Contract**
- OpenAPI 3.1 valid with examples; JSON Schema 2020-12 for request/response.
- Problem Details (RFC 9457) error payloads.
- Pagination documented (parameters plus Link headers).
- Rate limiting returns 429 with Retry-After; RateLimit-* headers if adopted.
- ETag/If-Match for PUT/PATCH; conditional caching for GET.
- RFC 3339 timestamps.
- CORS per environment (dev/stage/prod).
- Threat model aligned to OWASP API Security Top 10.

**Code/Handlers**
- Input validation at entry; DTO output mapping.
- Centralised authorisation (middleware/filter).
- Business logic outside controllers.
- Structured logging with trace IDs (OpenTelemetry).

**Test**
- Unit coverage for services and policy logic.
- Integration tests with real dependencies via Testcontainers.
- Contract tests with Pact for cross-team integrations.
- Critical E2E flows via Playwright (UI) or Newman (API).
- Dependable mocks for third parties (WireMock/MSW).

## Starter Links
- API Design: Microsoft REST Guidelines; Google AIP; OpenAPI 3.1.
- HTTP Semantics: RFC 9110 (methods/status); conditional requests and ETag; CORS best practices.
- Errors: Problem Details (RFC 9457).
- Security: OWASP API Security Top 10 (2023).
- Observability: OpenTelemetry specification.
- Testing: Testcontainers; Pact; Playwright; Newman; WireMock; MSW.

## Next Steps
Share your stack and languages for tailored test examples (Jest/Supertest, pytest/FastAPI, MockMvc + Testcontainers, WebApplicationFactory, httptest) and ready-made Problem Details scaffolding-no more Franken-endpoints.

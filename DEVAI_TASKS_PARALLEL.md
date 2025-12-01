# NUZANTARA - Task Parallele per DevAI

Data: 2025-12-01
Progetto: Nuzantara Platform
Obiettivo: Fix problemi critici di interconnessione webapp

---

## TASK #1: SECURITY FIX (DevAI Alpha)

### Obiettivo
Rimuovere tutte le credenziali hardcoded e il bypass di autenticazione dev-token.

### File da modificare

#### 1. `apps/webapp-next/src/app/api/chat/stream/route.ts`
**Problema (linea 5):**
```typescript
const API_KEY = process.env.NUZANTARA_API_KEY || 'zantara-secret-2024';
```
**Fix:** Rimuovere il fallback hardcoded, fallire se env var non presente:
```typescript
const API_KEY = process.env.NUZANTARA_API_KEY;
if (!API_KEY) {
  throw new Error('NUZANTARA_API_KEY environment variable is required');
}
```

#### 2. `apps/backend-rag/backend/app/main_cloud.py`
**Problema (linee 330-332):**
```python
if token == "dev-token-bypass":
    logger.warning("⚠️ Using dev-token-bypass for authentication")
    return {"id": "dev-user", "email": "dev@balizero.com", "name": "Dev User", "role": "admin"}
```
**Fix:** Rimuovere completamente questo blocco if. Non deve esistere bypass in production.

#### 3. `apps/backend-rag/backend/app/core/config.py`
**Problema (linea 123):**
```python
jwt_secret_key: str = "zantara_default_secret_key_2025_change_in_production"
```
**Fix:** Rendere obbligatorio da env var senza default:
```python
jwt_secret_key: str = Field(..., description="JWT secret key - REQUIRED, no default")

@field_validator("jwt_secret_key", mode="before")
@classmethod
def validate_jwt_secret(cls, v):
    if not v or v == "zantara_default_secret_key_2025_change_in_production":
        raise ValueError("JWT_SECRET_KEY must be set to a secure value in production")
    if len(v) < 32:
        raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
    return v
```

**Problema (linea 130):**
```python
api_keys: str = "zantara-secret-2024,zantara-test-2024"
```
**Fix:** Rimuovere default, rendere obbligatorio:
```python
api_keys: str = Field(..., description="API keys - REQUIRED, comma-separated")
```

### Test da eseguire dopo le modifiche
```bash
cd apps/backend-rag
pytest tests/unit/test_api_key_auth.py -v

cd apps/webapp-next
npm run test -- --testPathPattern="auth"
```

### Commit message suggerito
```
fix(security): remove hardcoded credentials and dev-token-bypass

BREAKING CHANGE: Environment variables JWT_SECRET_KEY, API_KEYS,
and NUZANTARA_API_KEY are now required with no fallback defaults.

- Remove dev-token-bypass authentication backdoor
- Remove hardcoded API keys from frontend route
- Add validation for JWT secret key length (min 32 chars)
- Make API_KEYS configuration required
```

---

## TASK #2: TIMEOUT & RETRY LOGIC (DevAI Beta)

### Obiettivo
Aggiungere timeout a tutte le fetch e implementare retry logic con exponential backoff.

### File da modificare

#### 1. `apps/webapp-next/src/lib/api/chat.ts`
**Problema (linea 60):** fetch senza timeout
**Fix:** Aggiungere AbortController con timeout e retry:

```typescript
// Aggiungere in cima al file
const DEFAULT_TIMEOUT = 30000; // 30 secondi
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);

      // Retry on 502, 503, 504
      if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt] || 4000));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        console.warn(`[ChatAPI] Retry attempt ${attempt + 1}/${maxRetries} after error:`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt] || 4000));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}
```

**Modificare streamChat (linea 60):**
```typescript
// Prima:
const response = await fetch('/api/chat/stream', { ... });

// Dopo:
const response = await fetchWithRetry('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: message,
    user_id: 'web_user',
    conversation_history: conversationHistory || [],
  }),
}, 60000); // 60s timeout per streaming
```

#### 2. `apps/webapp-next/src/app/api/chat/stream/route.ts`
**Problema (linea 26):** fetch al backend senza timeout

```typescript
// Aggiungere in cima
const BACKEND_TIMEOUT = 90000; // 90 secondi per streaming

// Modificare la fetch (linea 26):
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

try {
  const response = await fetch(`${API_URL}/bali-zero/chat-stream?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      Authorization: `Bearer ${request.headers.get('Authorization')?.replace('Bearer ', '') || ''}`,
    },
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  // ... resto del codice
} catch (error) {
  clearTimeout(timeoutId);

  if (error instanceof Error && error.name === 'AbortError') {
    console.error('[ChatAPI] Backend request timeout');
    return NextResponse.json(
      { error: 'AI service is taking too long. Please try again.' },
      { status: 504 }
    );
  }

  throw error;
}
```

#### 3. `apps/webapp-next/src/lib/api/auth.ts`
**Aggiungere timeout anche qui** per login/logout:
```typescript
// Usare lo stesso pattern fetchWithTimeout per tutte le chiamate auth
```

### Test da aggiungere
Creare `apps/webapp-next/src/lib/api/__tests__/timeout-retry.test.ts`:
```typescript
import { fetchWithTimeout, fetchWithRetry } from '../chat';

describe('Timeout and Retry Logic', () => {
  it('should timeout after specified duration', async () => {
    // Mock slow server
    jest.useFakeTimers();
    // ... test implementation
  });

  it('should retry on 503 errors', async () => {
    // ... test implementation
  });

  it('should use exponential backoff', async () => {
    // ... test implementation
  });
});
```

### Commit message suggerito
```
feat(reliability): add timeout and retry logic to all API calls

- Add fetchWithTimeout utility with AbortController
- Add fetchWithRetry with exponential backoff (1s, 2s, 4s)
- Apply 30s default timeout, 60s for chat streaming
- Retry on 502/503/504 errors up to 3 times
- Add timeout/retry unit tests
```

---

## TASK #3: NULL SERVICES HANDLING (DevAI Gamma)

### Obiettivo
Implementare fail-fast per servizi critici invece di continuare con None.

### File da modificare

#### 1. `apps/backend-rag/backend/app/main_cloud.py`
**Problema:** Servizi che falliscono silenziosamente (linee 449-460, etc.)

**Fix - Opzione A: Fail-Fast (Consigliata per production)**
```python
async def initialize_services() -> None:
    """Initialize all ZANTARA RAG services with fail-fast for critical services."""
    if getattr(app.state, "services_initialized", False):
        return

    logger.info("🚀 Initializing ZANTARA RAG services...")

    critical_failures = []

    # 1. Search / Qdrant (CRITICAL)
    try:
        search_service = SearchService()
        dependencies.search_service = search_service
        app.state.search_service = search_service
        logger.info("✅ SearchService initialized")
    except Exception as e:
        critical_failures.append(f"SearchService: {e}")
        logger.error(f"❌ CRITICAL: Failed to initialize SearchService: {e}")

    # 2. AI Client (CRITICAL)
    try:
        ai_client = ZantaraAIClient()
        app.state.ai_client = ai_client
        logger.info("✅ ZantaraAIClient initialized")
    except Exception as exc:
        critical_failures.append(f"ZantaraAIClient: {exc}")
        logger.error(f"❌ CRITICAL: Failed to initialize ZantaraAIClient: {exc}")

    # Fail-fast se servizi critici non disponibili
    if critical_failures:
        error_msg = "Critical services failed to initialize:\n" + "\n".join(critical_failures)
        logger.critical(f"🔥 {error_msg}")
        raise RuntimeError(error_msg)

    # ... resto dell'inizializzazione per servizi non critici
```

**Fix - Opzione B: Health-based degradation**
```python
# Aggiungere in app/core/service_health.py
from enum import Enum
from dataclasses import dataclass
from typing import Optional

class ServiceStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"

@dataclass
class ServiceHealth:
    name: str
    status: ServiceStatus
    error: Optional[str] = None
    is_critical: bool = False

class ServiceRegistry:
    def __init__(self):
        self._services: dict[str, ServiceHealth] = {}

    def register(self, name: str, status: ServiceStatus, error: str = None, critical: bool = False):
        self._services[name] = ServiceHealth(name, status, error, critical)

    def get_status(self) -> dict:
        return {
            "overall": self._overall_status(),
            "services": {k: v.__dict__ for k, v in self._services.items()}
        }

    def _overall_status(self) -> str:
        critical_down = any(
            s.status == ServiceStatus.UNAVAILABLE and s.is_critical
            for s in self._services.values()
        )
        if critical_down:
            return "critical"

        any_degraded = any(
            s.status != ServiceStatus.HEALTHY
            for s in self._services.values()
        )
        return "degraded" if any_degraded else "healthy"

# Usare nel main_cloud.py
service_registry = ServiceRegistry()
```

#### 2. `apps/backend-rag/backend/app/dependencies.py`
**Fix:** Aggiungere gestione errori più chiara
```python
def get_search_service() -> SearchService:
    """Get SearchService or fail with clear error."""
    if search_service is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "SearchService unavailable",
                "message": "The search service failed to initialize. Check server logs.",
                "retry_after": 30,
                "service": "search"
            }
        )
    return search_service

def get_ai_client() -> "ZantaraAIClient":
    """Get AI client or fail with clear error."""
    from fastapi import Request
    ai_client = getattr(app.state, "ai_client", None)
    if ai_client is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI service unavailable",
                "message": "The AI service failed to initialize. Check API keys and configuration.",
                "retry_after": 60,
                "service": "ai"
            }
        )
    return ai_client
```

#### 3. `apps/backend-rag/backend/app/routers/health.py`
**Aggiungere health check dettagliato:**
```python
@router.get("/health/detailed")
async def detailed_health():
    """Detailed health check showing all service statuses."""
    services = {}

    # Check SearchService
    try:
        ss = dependencies.search_service
        services["search"] = {"status": "healthy" if ss else "unavailable"}
    except Exception as e:
        services["search"] = {"status": "error", "error": str(e)}

    # Check AI Client
    try:
        ai = getattr(app.state, "ai_client", None)
        services["ai"] = {"status": "healthy" if ai else "unavailable"}
    except Exception as e:
        services["ai"] = {"status": "error", "error": str(e)}

    # Check Database
    try:
        db_pool = getattr(app.state, "db_pool", None)
        if db_pool:
            async with db_pool.acquire() as conn:
                await conn.execute("SELECT 1")
            services["database"] = {"status": "healthy"}
        else:
            services["database"] = {"status": "unavailable"}
    except Exception as e:
        services["database"] = {"status": "error", "error": str(e)}

    # Overall status
    critical_services = ["search", "ai"]
    critical_healthy = all(
        services.get(s, {}).get("status") == "healthy"
        for s in critical_services
    )

    return {
        "status": "healthy" if critical_healthy else "degraded",
        "services": services,
        "timestamp": datetime.utcnow().isoformat()
    }
```

### Test da eseguire
```bash
cd apps/backend-rag
pytest tests/unit/test_health*.py -v
pytest tests/unit/test_dependencies.py -v
```

### Commit message suggerito
```
feat(reliability): implement fail-fast for critical services

- Add ServiceRegistry for tracking service health
- Fail-fast on SearchService/AI client initialization failure
- Add detailed /health/detailed endpoint
- Improve error responses with retry_after hints
- Add service health unit tests
```

---

## TASK #4: TEST BACKEND REALE IN CI (DevAI Delta)

### Obiettivo
Attivare i test con backend reale in CI/CD pipeline.

### File da modificare

#### 1. `.github/workflows/frontend-tests.yml`
**Aggiungere stage per test backend reale:**
```yaml
name: Frontend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/webapp-next/package-lock.json

      - name: Install dependencies
        run: cd apps/webapp-next && npm ci

      - name: Run unit tests
        run: cd apps/webapp-next && npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: apps/webapp-next/coverage/lcov.info

  e2e-tests-mocked:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd apps/webapp-next && npm ci

      - name: Install Playwright
        run: cd apps/webapp-next && npx playwright install --with-deps

      - name: Run E2E tests (mocked)
        run: cd apps/webapp-next && npm run test:e2e
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8000

  e2e-tests-real-backend:
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e-tests-mocked]
    # Solo su main o con label 'test-real-backend'
    if: github.ref == 'refs/heads/main' || contains(github.event.pull_request.labels.*.name, 'test-real-backend')

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd apps/webapp-next && npm ci

      - name: Install Playwright
        run: cd apps/webapp-next && npx playwright install --with-deps

      - name: Wait for backend health
        run: |
          echo "Checking backend health..."
          for i in {1..30}; do
            if curl -s "${{ secrets.NUZANTARA_API_URL }}/health" | grep -q "healthy"; then
              echo "Backend is healthy!"
              exit 0
            fi
            echo "Attempt $i/30 - waiting..."
            sleep 10
          done
          echo "Backend health check failed"
          exit 1

      - name: Run E2E tests (real backend)
        run: cd apps/webapp-next && npm run test:e2e -- --project=chromium e2e/real-backend.spec.ts
        env:
          NUZANTARA_API_URL: ${{ secrets.NUZANTARA_API_URL }}
          NUZANTARA_API_KEY: ${{ secrets.NUZANTARA_API_KEY }}
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PIN: ${{ secrets.E2E_TEST_PIN }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-real-backend
          path: apps/webapp-next/playwright-report/
```

#### 2. `apps/webapp-next/e2e/real-backend.spec.ts`
**Migliorare i test:**
```typescript
import { test, expect } from '@playwright/test'

const BACKEND_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev'
const API_KEY = process.env.NUZANTARA_API_KEY
const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PIN = process.env.E2E_TEST_PIN

// Skip solo se NESSUNA credenziale è presente (non in CI)
const shouldSkip = !TEST_EMAIL && !TEST_PIN && !process.env.CI

test.describe('Real Backend Integration', () => {
  test.skip(shouldSkip, 'Test credentials not provided and not in CI')

  // Fail loudly in CI if credentials missing
  test.beforeAll(async () => {
    if (process.env.CI && (!TEST_EMAIL || !TEST_PIN)) {
      throw new Error(
        'E2E_TEST_EMAIL and E2E_TEST_PIN secrets must be configured in CI. ' +
        'Add them to GitHub repository secrets.'
      )
    }
  })

  test('backend health check', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`)
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('healthy')
  })

  test('authentication flow', async ({ page }) => {
    await page.goto('/')

    // Fill login form
    await page.fill('input[name="email"]', TEST_EMAIL!)
    await page.fill('input[name="pin"]', TEST_PIN!)
    await page.click('button[type="submit"]')

    // Wait for redirect to chat
    await expect(page).toHaveURL(/\/chat/, { timeout: 10000 })

    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('zantara_token'))
    expect(token).toBeTruthy()
  })

  test('chat streaming with real AI', async ({ page }) => {
    // Login first
    await page.goto('/')
    await page.fill('input[name="email"]', TEST_EMAIL!)
    await page.fill('input[name="pin"]', TEST_PIN!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/chat/, { timeout: 10000 })

    // Send message
    await page.fill('textarea', 'What is a KITAS visa?')
    await page.click('button[aria-label="Send"]')

    // Wait for streaming response
    const responseLocator = page.locator('[data-testid="assistant-message"]').last()
    await expect(responseLocator).toBeVisible({ timeout: 30000 })

    // Verify response contains relevant content
    const responseText = await responseLocator.textContent()
    expect(responseText?.toLowerCase()).toMatch(/kitas|visa|indonesia|permit/i)
  })

  test('RAG retrieval shows sources', async ({ page }) => {
    // Login and navigate
    await page.goto('/')
    await page.fill('input[name="email"]', TEST_EMAIL!)
    await page.fill('input[name="pin"]', TEST_PIN!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/chat/, { timeout: 10000 })

    // Ask question that should trigger RAG
    await page.fill('textarea', 'What are the requirements for PT PMA company setup?')
    await page.click('button[aria-label="Send"]')

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 })

    // Check for RAG sources indicator
    const sourcesButton = page.locator('[data-testid="rag-sources"]')
    if (await sourcesButton.isVisible()) {
      await sourcesButton.click()

      // Verify sources drawer shows
      const sourcesDrawer = page.locator('[data-testid="rag-drawer"]')
      await expect(sourcesDrawer).toBeVisible()

      // Should have at least one source
      const sourceItems = sourcesDrawer.locator('[data-testid="source-item"]')
      await expect(sourceItems).toHaveCount({ minimum: 1 })
    }
  })

  test('error handling on invalid token', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/oracle/query`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
        'Content-Type': 'application/json'
      },
      data: {
        query: 'test query'
      }
    })

    expect(response.status()).toBe(401)
  })
})
```

#### 3. Creare GitHub Secrets
**Documentare nel README:**
```markdown
## CI/CD Configuration

### Required GitHub Secrets for Real Backend Tests

Add these secrets to your GitHub repository (Settings > Secrets > Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `NUZANTARA_API_URL` | Backend API URL | `https://nuzantara-rag.fly.dev` |
| `NUZANTARA_API_KEY` | API key for backend | `your-api-key` |
| `E2E_TEST_EMAIL` | Test user email | `test@balizero.com` |
| `E2E_TEST_PIN` | Test user PIN | `123456` |

### Running Real Backend Tests Locally

```bash
export NUZANTARA_API_URL=https://nuzantara-rag.fly.dev
export NUZANTARA_API_KEY=your-api-key
export E2E_TEST_EMAIL=test@balizero.com
export E2E_TEST_PIN=123456

cd apps/webapp-next
npm run test:e2e -- e2e/real-backend.spec.ts
```
```

### Commit message suggerito
```
feat(ci): enable real backend integration tests in CI pipeline

- Add e2e-tests-real-backend job to frontend-tests workflow
- Run real backend tests on main branch and labeled PRs
- Add backend health check before running tests
- Improve real-backend.spec.ts with better assertions
- Document required GitHub secrets
- Add data-testid attributes for reliable selectors
```

---

## TASK #5: TEST COVERAGE 95% FRONTEND (Assegnata a me - DevAI Claude)

Questa task la eseguo io direttamente. Vedi implementazione nel branch corrente.

### Obiettivo
Portare la test coverage dal ~15% attuale al 95% su TUTTA la frontend codebase.

### Aree da coprire:
1. **Componenti UI** (`src/components/**`) - Attualmente esclusi
2. **Route Handlers** (`src/app/api/**`) - Attualmente esclusi
3. **Pages** (`src/app/**/*.tsx`) - Attualmente esclusi
4. **Hooks** (`src/hooks/**`) - Parzialmente coperti
5. **Utilities** (`src/lib/**`) - Parzialmente coperti

---

## COORDINAMENTO

### Ordine di esecuzione consigliato:
1. **TASK #1 (Security)** - PRIMA di tutto, rimuovere vulnerabilità
2. **TASK #3 (Null Services)** - Subito dopo, stabilizzare backend
3. **TASK #2 (Timeout/Retry)** - Migliorare resilienza
4. **TASK #4 (Test CI)** - Attivare test reali
5. **TASK #5 (Coverage)** - Completare coverage

### Branch naming:
- `fix/security-hardcoded-credentials`
- `feat/timeout-retry-logic`
- `feat/null-services-failfast`
- `feat/ci-real-backend-tests`
- `feat/frontend-test-coverage-95`

### Merge order:
Tutti i branch possono essere sviluppati in parallelo.
Merge in ordine: #1 → #3 → #2 → #4 → #5

---

## CHECKLIST FINALE

- [ ] Task #1: Security Fix completata
- [ ] Task #2: Timeout & Retry completata
- [ ] Task #3: Null Services Handling completata
- [ ] Task #4: Test Backend CI completata
- [ ] Task #5: Coverage 95% completata
- [ ] Tutti i test passano
- [ ] Code review completata
- [ ] Merge su main

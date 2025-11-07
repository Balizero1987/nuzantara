# NUZANTARA Development Guide

**Version:** 5.2.0  
**Last Updated:** 2025-11-07

---

## Code Standards

### TypeScript/JavaScript

**Style Guide:** Airbnb + Prettier

```typescript
// Good
export async function handleRequest(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const result = await service.process(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('handleRequest error', { error });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Bad
export async function handleRequest(req,res) {
  let result = await service.process(req.params.userId)
  return res.json({success:true,data:result})
}
```

### Python

**Style Guide:** PEP 8 + Black formatter

```python
# Good
async def handle_request(user_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle user request with proper error handling."""
    try:
        result = await service.process(user_id, params)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"handle_request error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Bad
async def handle_request(user_id,params):
  result=await service.process(user_id,params)
  return {"success":True,"data":result}
```

---

## Testing

### Backend-TS (Jest)

```typescript
// handlers/__tests__/my-handler.test.ts
import { myHandler } from '../my-handler';

describe('myHandler', () => {
  it('should process request successfully', async () => {
    const req = { body: { userId: '123' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    
    await myHandler(req, res);
    
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Object)
    });
  });
});
```

### Backend-RAG (pytest)

```python
# tests/services/test_my_service.py
import pytest
from backend.services.my_service import MyService

@pytest.mark.asyncio
async def test_process_success():
    service = MyService()
    result = await service.process({"user_id": "123"})
    assert result["success"] is True
    assert "data" in result
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('user can send chat message', async ({ page }) => {
  await page.goto('/chat.html');
  await page.fill('#messageInput', 'Hello');
  await page.click('#sendButton');
  await expect(page.locator('.message.user')).toBeVisible();
});
```

---

## Git Workflow

### Branch Naming

```
feature/add-kbli-search
bugfix/fix-auth-token
hotfix/critical-security-fix
docs/update-api-reference
refactor/handler-registry
```

### Commit Messages

**Format:** `type(scope): subject`

```bash
# Good
git commit -m "feat(api): add KBLI search endpoint"
git commit -m "fix(auth): resolve JWT expiration issue"
git commit -m "docs: update API reference with new endpoints"

# Bad
git commit -m "fixed stuff"
git commit -m "WIP"
```

**Types:** feat, fix, docs, style, refactor, test, chore

---

## Debugging

### Backend-TS

```bash
# Debug mode
NODE_OPTIONS='--inspect' npm run dev

# Attach Chrome DevTools
chrome://inspect
```

### Backend-RAG

```bash
# Debug with pdb
import pdb; pdb.set_trace()

# Or use debugpy
python -m debugpy --listen 5678 --wait-for-client main.py
```

### Frontend

```javascript
// Use browser DevTools console
console.log('[DEBUG]', data);

// Or use debugger statement
debugger;
```

---

## Performance Optimization

### Database Queries

```typescript
// Good - Use indexes
const users = await db.user.findMany({
  where: { email: req.body.email }, // email is indexed
  select: { id: true, name: true } // Select only needed fields
});

// Bad - Full table scan
const users = await db.user.findMany(); // No filtering, all fields
```

### Caching Strategy

```typescript
// Cache expensive operations
const cacheKey = `pricing:${category}:${type}`;
let result = await redis.get(cacheKey);

if (!result) {
  result = await calculatePricing(category, type);
  await redis.setex(cacheKey, 3600, JSON.stringify(result));
}
```

### Frontend Performance

```javascript
// Virtual scrolling for large lists
import VirtualScroller from './virtual-scroller.js';

const scroller = new VirtualScroller({
  container: '#messages',
  itemHeight: 80,
  buffer: 5
});
```

---

## Security Best Practices

### Input Validation

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().positive()
});

// Validate input
const user = UserSchema.parse(req.body);
```

### SQL Injection Prevention

```typescript
// Good - Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// Bad - String concatenation
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS Prevention

```javascript
// Sanitize HTML
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
element.innerHTML = clean;
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions@1.3
        with:
          args: "deploy --config fly.toml"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Monitoring & Logging

### Structured Logging

```typescript
import { logger } from './unified-logger';

// Good
logger.info('User login', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
});

// Bad
console.log('User logged in: ' + user.email);
```

### Error Tracking

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { userId, operation: 'riskyOperation' }
  });
  throw error;
}
```

---

## Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log() left
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Security implications considered
- [ ] Performance implications considered
- [ ] No hardcoded secrets
- [ ] Breaking changes documented

---

## Useful Commands

```bash
# Development
npm run dev                 # Start backend-TS dev server
uvicorn main:app --reload   # Start backend-RAG dev server
python -m http.server 3000  # Start frontend dev server

# Testing
npm test                    # Run all tests
npm run test:coverage       # Run tests with coverage
npm run test:e2e            # Run E2E tests
pytest                      # Run Python tests

# Linting
npm run lint                # Lint TypeScript/JavaScript
npm run lint:fix            # Auto-fix linting issues
black .                     # Format Python code
ruff check .                # Lint Python code

# Database
psql $DATABASE_URL          # Connect to PostgreSQL
redis-cli                   # Connect to Redis

# Deployment
fly deploy                  # Deploy to Fly.io
npm run deploy:frontend     # Deploy frontend to Cloudflare

# Debugging
npm run dev:debug           # Start with debugger
fly logs -a nuzantara-rag   # View production logs
```

---

**For more information:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database schema
- [ONBOARDING.md](./ONBOARDING.md) - Developer onboarding

**Version:** 5.2.0

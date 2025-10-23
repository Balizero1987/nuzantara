---
name: code-review
description: Perform comprehensive code review for nuzantara with focus on TypeScript strict mode, Python typing, security, RAG best practices, and Oracle agent quality
---

# Nuzantara Code Review Protocol

Use this skill after writing significant code changes, before merging PRs, or when user explicitly requests code review.

## Review Checklist

### 1. TypeScript Code Quality

**Type Safety**:
- ✅ Strict mode enabled (`tsconfig.json`)
- ✅ No `any` types (use `unknown` if needed)
- ✅ Proper interface definitions
- ✅ Generic types used appropriately
- ✅ Null/undefined handled explicitly

**Code Style**:
```typescript
// ✅ Good: Explicit types
interface UserRequest {
  userId: string;
  tier: 0 | 1 | 2 | 3;
}

// ❌ Bad: Implicit any
function handleUser(data) { ... }

// ✅ Good: Proper error handling
try {
  await riskyOperation();
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message);
  }
}
```

Check files in:
- `apps/backend-ts/src/**/*.ts`
- `projects/orchestrator/src/**/*.ts`

### 2. Python Code Quality

**Type Hints (PEP 484)**:
- ✅ All function signatures have type hints
- ✅ Return types specified
- ✅ Optional/Union types used correctly
- ✅ Type checking with mypy passes

**Code Style**:
```python
# ✅ Good: Complete type hints
def query_rag(
    query: str,
    tier: int,
    limit: int = 10
) -> list[dict[str, Any]]:
    ...

# ❌ Bad: No type hints
def query_rag(query, tier, limit=10):
    ...

# ✅ Good: Pydantic models for validation
from pydantic import BaseModel

class QueryRequest(BaseModel):
    query: str
    tier: int
    limit: int = 10
```

Check files in:
- `apps/backend-rag/backend/**/*.py`
- `projects/oracle-system/**/*.py`

### 3. Security Review

**Authentication & Authorization**:
- ✅ JWT tokens validated properly
- ✅ Tier-based access control enforced
- ✅ No hardcoded credentials
- ✅ Environment variables for secrets
- ✅ Password hashing with bcrypt

**Input Validation**:
- ✅ Zod schemas for TypeScript validation
- ✅ Pydantic models for Python validation
- ✅ SQL injection prevention (use Prisma/parameterized queries)
- ✅ XSS prevention in frontend
- ✅ CORS configured correctly

**Sensitive Data**:
```typescript
// ✅ Good: Use Google Secret Manager
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// ❌ Bad: Hardcoded secrets
const apiKey = "sk-1234567890";
```

### 4. RAG System Best Practices

**Prompt Engineering**:
- ✅ Clear, specific system prompts
- ✅ Proper context window management
- ✅ Tier-appropriate instructions
- ✅ Source citation requirements
- ✅ Fallback strategies

Check files:
- `apps/backend-rag/backend/prompts/**/*.py`
- `apps/backend-rag/backend/llm/`

**Vector Search Optimization**:
- ✅ Appropriate embedding model
- ✅ Chunk size optimization (typically 512-1024 tokens)
- ✅ Overlap between chunks
- ✅ Metadata preserved
- ✅ Relevance score thresholds

**ChromaDB Usage**:
```python
# ✅ Good: Efficient query with filters
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=10,
    where={"tier": {"$lte": user_tier}}
)

# ❌ Bad: No filtering, retrieve everything
results = collection.query(query_embeddings=[query_embedding])
```

### 5. Oracle Agent Quality

**Agent Prompts**:
- ✅ Clear role definition
- ✅ Specific expertise boundaries
- ✅ Proper citation instructions
- ✅ Tier-based knowledge access
- ✅ Handoff protocols to other agents

**Multi-Agent Coordination**:
- ✅ Clear agent selection logic
- ✅ Proper context passing
- ✅ Conflict resolution strategy
- ✅ Combined response formatting

Check files:
- `projects/oracle-system/agents/**/*`
- `apps/backend-ts/src/agents/`

### 6. Error Handling

**Comprehensive Error Handling**:
```typescript
// ✅ Good: Specific error handling
try {
  const result = await anthropic.messages.create({...});
  return result;
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 429) {
      logger.warn('Rate limit hit, retrying...');
      return await retryWithBackoff(operation);
    }
    logger.error(`Anthropic API error: ${error.message}`);
  }
  throw new ServiceError('RAG query failed', error);
}

// ❌ Bad: Generic catch-all
try {
  ...
} catch (e) {
  console.log('Error');
}
```

### 7. Logging & Monitoring

**Winston Logger Usage**:
- ✅ Appropriate log levels (error, warn, info, debug)
- ✅ Structured logging with metadata
- ✅ No sensitive data in logs
- ✅ Request IDs for tracing

```typescript
// ✅ Good: Structured logging
logger.info('RAG query completed', {
  requestId,
  userId,
  tier,
  queryLength: query.length,
  resultsCount: results.length,
  latencyMs: elapsed
});

// ❌ Bad: Unstructured logging
console.log('Query done');
```

### 8. Testing Coverage

**Test Requirements**:
- ✅ Unit tests for business logic
- ✅ Integration tests for API endpoints
- ✅ Test coverage >= 70%
- ✅ Edge cases covered
- ✅ Error scenarios tested

Check files:
- `apps/backend-ts/**/*.test.ts`
- `tests/integration/**/*`

**Test Quality**:
```typescript
// ✅ Good: Descriptive test with arrange-act-assert
describe('RAG Query Handler', () => {
  it('should return filtered results based on user tier', async () => {
    // Arrange
    const query = 'test query';
    const userTier = 1;

    // Act
    const results = await ragService.query(query, userTier);

    // Assert
    expect(results).toBeDefined();
    expect(results.every(r => r.tier <= userTier)).toBe(true);
  });
});
```

### 9. Documentation

**Code Documentation**:
- ✅ JSDoc/docstrings for public functions
- ✅ Complex logic explained with comments
- ✅ README updated if API changed
- ✅ Type definitions documented

```typescript
/**
 * Queries the RAG system with tier-based access control
 *
 * @param query - User's search query
 * @param tier - User's access tier (0-3)
 * @param limit - Maximum results to return
 * @returns Array of relevant document chunks with metadata
 * @throws {ServiceError} If RAG system is unavailable
 */
async function queryRAG(
  query: string,
  tier: number,
  limit: number = 10
): Promise<RAGResult[]> { ... }
```

### 10. Performance

**Optimization Checks**:
- ✅ Database queries optimized (use indexes)
- ✅ No N+1 query problems
- ✅ Caching used appropriately (Redis)
- ✅ Async/await used correctly
- ✅ No blocking operations in event loop

**Anti-patterns to avoid**:
```typescript
// ❌ Bad: N+1 query problem
for (const user of users) {
  const profile = await db.profile.findUnique({ where: { userId: user.id } });
}

// ✅ Good: Batch query
const profiles = await db.profile.findMany({
  where: { userId: { in: users.map(u => u.id) } }
});
```

## Review Process

1. **Automated Checks**:
   ```bash
   npm run typecheck  # TypeScript validation
   npm run lint       # Linting
   npm test           # Test suite
   ```

2. **Manual Review**:
   - Read through changed files
   - Check against checklist above
   - Look for security vulnerabilities
   - Verify business logic correctness

3. **Provide Feedback**:
   - List specific issues found
   - Suggest improvements with code examples
   - Highlight good patterns to reinforce
   - Prioritize: Critical > Important > Nice-to-have

## Common Issues in Nuzantara

| Issue | Location | Fix |
|-------|----------|-----|
| Missing tier checks | RAG endpoints | Add tier validation middleware |
| No rate limiting | Public APIs | Add express-rate-limit |
| Unhandled promises | Async handlers | Add try-catch or .catch() |
| Missing types | TS interfaces | Add explicit types |
| No input validation | API routes | Add Zod/Pydantic schemas |
| Secrets in code | Config files | Move to env vars/Secret Manager |

## Success Criteria
✅ All TypeScript code passes strict mode
✅ Python code has complete type hints
✅ No security vulnerabilities detected
✅ Test coverage >= 70%
✅ All error cases handled properly
✅ Logging is structured and appropriate
✅ Performance is within acceptable ranges
✅ Code follows project conventions
✅ Documentation is up-to-date

## Code Review Output Format

Provide feedback in this format:

```markdown
## Code Review Summary

### ✅ Strengths
- [What was done well]

### 🔴 Critical Issues
- [Must fix before merge]

### ⚠️ Important Issues
- [Should fix before merge]

### 💡 Suggestions
- [Nice-to-have improvements]

### 📝 Overall Assessment
[Brief summary and recommendation: Approve / Request Changes / Needs Major Revision]
```

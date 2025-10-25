# MEGA PROMPT: Generate ALL Backend Tests

Generate comprehensive Jest test suites for ALL handlers in the backend-ts project.

## Project Context
- Location: `apps/backend-ts/`
- Jest configured with SWC transformer
- ESM modules (use `.js` extension in imports)
- Pattern: `await import('../handler.js')`
- 80 handlers total, 12 have tests, 68 need tests

## Global Test Standards

### Import Pattern (CRITICAL)
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Handler Name', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../handler-name.js'); // Note: .js not .ts
  });
});
```

### Mock Patterns

**Firebase/Firestore:**
```typescript
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }))
    }))
  }))
}));
```

**Google APIs:**
```typescript
jest.mock('googleapis', () => ({
  google: {
    gmail: jest.fn(() => ({
      users: {
        messages: {
          send: jest.fn(),
          list: jest.fn(),
          get: jest.fn()
        }
      }
    }))
  }
}));
```

**OpenAI/Anthropic:**
```typescript
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));
```

**Axios:**
```typescript
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));
```

## Handlers to Test (68 Total)

### PRIORITY 1-10: Core & Google Workspace

1. **src/handlers/example-modern-handler.ts** ✅ DONE
   - Test: `__tests__/example-modern-handler.test.ts`
   - Functions: sendEmailV2, listInboxV2, kbliLookupV2
   - No external mocks needed

2. **src/handlers/bali-zero/oracle.ts** (ENHANCE EXISTING)
   - Test exists: `bali-zero/__tests__/oracle.test.ts`
   - Task: Review and improve to >85% coverage
   - Core business logic - CRITICAL

3. **src/handlers/ai-services/ai.ts**
   - Test: `ai-services/__tests__/ai.test.ts`
   - Mock: OpenAI, Anthropic
   - Functions: generateCompletion, streamCompletion
   - Target: >75% coverage

4. **src/handlers/google-workspace/gmail.ts** (ENHANCE EXISTING)
   - Test exists: `google-workspace/__tests__/gmail.test.ts`
   - Mock: googleapis
   - Improve to >80% coverage

5. **src/handlers/memory/memory.ts**
   - Test: `memory/__tests__/memory.test.ts`
   - Mock: Firebase
   - Functions: save, get, update, delete, list
   - Target: >85% coverage

6. **src/handlers/google-workspace/drive.ts** (ENHANCE EXISTING)
   - Test exists: `google-workspace/__tests__/drive.test.ts`
   - Mock: googleapis
   - Improve to >80%

7. **src/handlers/google-workspace/sheets.ts**
   - Test: `google-workspace/__tests__/sheets.test.ts`
   - Mock: googleapis (sheets API)
   - Functions: read, update, append, batchUpdate
   - Target: >80%

8. **src/handlers/google-workspace/docs.ts**
   - Test: `google-workspace/__tests__/docs.test.ts`
   - Mock: googleapis (docs API)
   - Functions: create, get, batchUpdate
   - Target: >75%

9. **src/handlers/google-workspace/slides.ts**
   - Test: `google-workspace/__tests__/slides.test.ts`
   - Mock: googleapis (slides API)
   - Functions: create, addSlide, update
   - Target: >75%

10. **src/handlers/google-workspace/contacts.ts**
    - Test: `google-workspace/__tests__/contacts.test.ts`
    - Mock: googleapis (people API)
    - Functions: create, list, update, delete
    - Target: >80%

### PRIORITY 11-25: Communication & Memory

11. **src/handlers/communication/whatsapp.ts** (ENHANCE EXISTING)
12. **src/handlers/communication/twilio-whatsapp.ts**
13. **src/handlers/communication/translate.ts**
14. **src/handlers/communication/instagram.ts**
15. **src/handlers/memory/user-memory.ts**
16. **src/handlers/memory/episodes-firestore.ts**
17. **src/handlers/memory/conversation-autosave.ts**
18. **src/handlers/memory/memory-cache-stats.ts**
19. **src/handlers/analytics/dashboard-analytics.ts**
20. **src/handlers/analytics/weekly-report.ts**
21. **src/handlers/analytics/daily-drive-recap.ts**
22. **src/handlers/zantara/knowledge.ts**
23. **src/handlers/zantara/zantara-dashboard.ts**
24. **src/handlers/zantara/zantara-brilliant.ts**
25. **src/handlers/zantara/zantara-v2-simple.ts**

### PRIORITY 26-40: Intel, Maps, Identity, Auth

26. **src/handlers/intel/news-search.ts**
27. **src/handlers/intel/scraper.ts**
28. **src/handlers/maps/maps.ts**
29. **src/handlers/identity/identity.ts**
30. **src/handlers/auth/team-login.ts**
31. **src/handlers/auth/team-login-secure.ts**
32. **src/handlers/admin/registry-admin.ts**
33. **src/handlers/admin/websocket-admin.ts**
34. **src/handlers/system/handler-proxy.ts**
35. **src/handlers/system/handler-metadata.ts**
36. **src/handlers/zero/chat-simple.ts**
37. **src/handlers/zero/chat.ts**
38. **src/handlers/ai-services/advanced-ai.ts**
39. **src/handlers/ai-services/ai-bridge.ts**
40. **src/handlers/ai-services/ai-enhanced.ts**

### PRIORITY 41-55: AI Services, Bali Zero, Analytics

41. **src/handlers/ai-services/creative.ts**
42. **src/handlers/ai-services/imagine-art-handler.ts**
43. **src/handlers/ai-services/zantara-llama.ts**
44. **src/handlers/bali-zero/advisory.ts**
45. **src/handlers/bali-zero/oracle-universal.ts**
46. **src/handlers/bali-zero/team-activity.ts**
47. **src/handlers/google-workspace/drive-multipart.ts**
48. **src/handlers/zantara/zantara-test.ts**
49. **src/handlers/zantara/zantaraKnowledgeHandler.ts**
50. **src/handlers/analytics/analytics.ts**
51. **src/handlers/communication/communication.ts**
52. **src/handlers/bali-zero/bali-zero-pricing.ts** (ENHANCE EXISTING)
53. **src/handlers/memory/memory-firestore.ts** (ENHANCE EXISTING)
54. **src/handlers/rag/rag.ts** (ENHANCE EXISTING)
55. **src/handlers/system/handlers-introspection.ts** (ENHANCE EXISTING)

### PRIORITY 56-68: Remaining Handlers

56. **src/handlers/bali-zero/kbli.ts** (ENHANCE EXISTING)
57. **src/handlers/bali-zero/team.ts** (ENHANCE EXISTING)
58. **src/handlers/google-workspace/calendar.ts** (ENHANCE EXISTING)

... (include all remaining handlers from the analysis)

## Test Requirements for EACH Handler

### 1. Basic Structure
```typescript
describe('Handler Name', () => {
  let handler: any;

  beforeEach(async () => {
    handler = await import('../handler-name.js');
  });

  describe('functionName', () => {
    it('should handle success case', async () => {
      const result = await handler.functionName({ validParams });
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle missing params', async () => {
      const result = await handler.functionName({});
      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing');
    });

    it('should handle invalid params', async () => {
      const result = await handler.functionName({ invalid: 'data' });
      expect(result.ok).toBe(false);
    });

    it('should handle API/service errors', async () => {
      // Mock external service to throw error
      // Verify error handling
    });
  });
});
```

### 2. Test Coverage Requirements
- **Success paths**: All happy paths work
- **Error paths**: Missing params, invalid data, API errors
- **Edge cases**: Empty strings, null, undefined, boundary values
- **Response structure**: Verify all expected fields exist
- **Mocks**: All external dependencies mocked

### 3. Coverage Targets
- Critical handlers (oracle, ai, memory, gmail): >85%
- Standard handlers: >80%
- Complex handlers (AI, integrations): >75%

## Execution Strategy

### Phase 1: Generate Tests (Do This First)
For each handler WITHOUT a test file:
1. Analyze the source file to identify all exported functions
2. Determine required mocks (Firebase, Google APIs, etc.)
3. Generate complete test file with all test cases
4. Save to: `src/handlers/<module>/__tests__/<handler>.test.ts`

### Phase 2: Enhance Existing Tests
For handlers with existing tests (12 total):
1. Run: `npm test -- <test-name>.test --coverage`
2. If coverage < 80%, add missing test cases
3. Focus on untested functions and error paths

### Phase 3: Verification
After generating all tests:
1. Run: `npm test`
2. Fix any failing tests
3. Run: `npm test -- --coverage`
4. Ensure overall coverage >80%

## Important Notes

### DO:
- ✅ Use `.js` extension in imports (NOT `.ts`)
- ✅ Mock ALL external dependencies
- ✅ Test both success and error cases
- ✅ Use `beforeEach` to clear mocks
- ✅ Verify response structure
- ✅ Use descriptive test names

### DON'T:
- ❌ Use TypeScript import syntax (use `.js`)
- ❌ Forget to mock external services
- ❌ Test only happy paths
- ❌ Use `jest.fn()` without proper return values
- ❌ Hardcode test data that should be dynamic

## Expected Output

After completion, you should have:
- 68 new test files created
- 12 existing test files enhanced
- 80 total handlers with tests
- Overall coverage >80%
- All tests passing: `npm test` shows green

## File Locations

All test files go in:
```
apps/backend-ts/src/handlers/<module>/__tests__/<handler>.test.ts
```

Examples:
- `apps/backend-ts/src/handlers/__tests__/example-modern-handler.test.ts`
- `apps/backend-ts/src/handlers/bali-zero/__tests__/oracle.test.ts`
- `apps/backend-ts/src/handlers/google-workspace/__tests__/gmail.test.ts`

## Start Here

Begin with Priority 1-10 (already 1 is done), then move to 11-25, then 26-40, etc.

For each handler:
1. Read the source file
2. Identify exported functions
3. Determine required mocks
4. Generate comprehensive test file
5. Verify it works: `npm test -- <handler>.test`

Target completion: ALL 68 tests generated and passing!

---

**Ready? Start generating tests now! 🚀**

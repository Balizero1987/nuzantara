# Test Generation: intel/news-search.ts

## Priority: 26

## File to Test
`src/handlers/intel/news-search.ts`

## Cursor Prompt

```
Generate Jest test suite for Intel News Search handler.

Context:
- File: src/handlers/intel/news-search.ts
- News article search and filtering
- External API integration

Task:
Create: src/handlers/intel/__tests__/news-search.test.ts

Mock Strategy:
```typescript
jest.mock('axios', () => ({
  get: jest.fn()
}));
```

For EACH function:
1. Search news:
   - ✓ Success with results
   - ✓ Empty query
   - ✓ No results
   - ✓ API error

2. Filter results:
   - ✓ By date
   - ✓ By source
   - ✓ By relevance

3. Parse articles:
   - ✓ Valid structure
   - ✓ Missing fields
   - ✓ Invalid format

Import: await import('../news-search.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- news-search.test
```

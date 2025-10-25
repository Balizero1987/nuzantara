# Test Generation: zantara/zantara-v2-simple.ts

## Priority: 25

## File to Test
`src/handlers/zantara/zantara-v2-simple.ts`

## Cursor Prompt

```
Generate Jest test suite for Zantara V2 Simple handler.

Context:
- File: src/handlers/zantara/zantara-v2-simple.ts
- Simplified v2 API
- Streamlined operations

Task:
Create: src/handlers/zantara/__tests__/zantara-v2-simple.test.ts

Mock Strategy:
```typescript
jest.mock('../knowledge.js', () => ({
  queryKnowledge: jest.fn()
}));
```

For EACH function:
1. Simple query:
   - ✓ Success
   - ✓ Empty query
   - ✓ Invalid params

2. Quick lookup:
   - ✓ Direct match
   - ✓ No match
   - ✓ Fuzzy search

3. Get metadata:
   - ✓ Available info
   - ✓ Not found

Import: await import('../zantara-v2-simple.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- zantara-v2-simple.test
```

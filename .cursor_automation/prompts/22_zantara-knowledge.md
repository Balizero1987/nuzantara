# Test Generation: zantara/knowledge.ts

## Priority: 22

## File to Test
`src/handlers/zantara/knowledge.ts`

## Cursor Prompt

```
Generate Jest test suite for Zantara Knowledge handler.

Context:
- File: src/handlers/zantara/knowledge.ts
- Knowledge base operations
- Core Zantara functionality

Task:
Create: src/handlers/zantara/__tests__/knowledge.test.ts

Mock Strategy:
```typescript
jest.mock('../../rag/rag.js', () => ({
  queryKnowledge: jest.fn(),
  addKnowledge: jest.fn()
}));
```

For EACH function:
1. Query knowledge:
   - ✓ Success with results
   - ✓ No results
   - ✓ Invalid query

2. Add knowledge:
   - ✓ Success
   - ✓ Duplicate entry
   - ✓ Invalid data

3. Update knowledge:
   - ✓ Success
   - ✓ Not found
   - ✓ Invalid update

4. Delete knowledge:
   - ✓ Success
   - ✓ Not found

Import: await import('../knowledge.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- knowledge.test
```

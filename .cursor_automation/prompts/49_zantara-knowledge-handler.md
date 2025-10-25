# Test Generation: zantara/zantaraKnowledgeHandler.ts

## Priority: 49

## File to Test
`src/handlers/zantara/zantaraKnowledgeHandler.ts`

## Cursor Prompt

```
Generate Jest test suite for Zantara Knowledge Handler.

Context:
- File: src/handlers/zantara/zantaraKnowledgeHandler.ts
- Knowledge base handler
- Document management

Task:
Create: src/handlers/zantara/__tests__/zantaraKnowledgeHandler.test.ts

Mock Strategy:
```typescript
jest.mock('../../rag/rag.js', () => ({
  queryKnowledge: jest.fn(),
  addDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn()
}));
```

For EACH function:
1. Query knowledge:
   - ✓ Success with results
   - ✓ No results
   - ✓ Ranked results

2. Add document:
   - ✓ Success
   - ✓ Duplicate
   - ✓ Invalid format

3. Update document:
   - ✓ Success
   - ✓ Not found
   - ✓ Partial update

4. Delete document:
   - ✓ Success
   - ✓ Not found

Import: await import('../zantaraKnowledgeHandler.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- zantaraKnowledgeHandler.test
```

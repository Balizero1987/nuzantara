# Test Generation: bali-zero/oracle-universal.ts

## Priority: 45

## File to Test
`src/handlers/bali-zero/oracle-universal.ts`

## Cursor Prompt

```
Generate Jest test suite for Bali Zero Oracle Universal handler.

Context:
- File: src/handlers/bali-zero/oracle-universal.ts
- Universal oracle interface
- Multi-domain knowledge

Task:
Create: src/handlers/bali-zero/__tests__/oracle-universal.test.ts

Mock Strategy:
```typescript
jest.mock('./oracle.js', () => ({
  queryOracle: jest.fn()
}));

jest.mock('../../rag/rag.js', () => ({
  queryKnowledge: jest.fn()
}));
```

For EACH function:
1. Universal query:
   - ✓ Success
   - ✓ Domain routing
   - ✓ Fallback handling

2. Multi-source lookup:
   - ✓ Combine sources
   - ✓ Priority ranking
   - ✓ Conflict resolution

3. Format response:
   - ✓ Structured output
   - ✓ Citations
   - ✓ Confidence scores

Import: await import('../oracle-universal.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- oracle-universal.test
```

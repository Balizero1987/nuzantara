# Test Generation: bali-zero/advisory.ts

## Priority: 44

## File to Test
`src/handlers/bali-zero/advisory.ts`

## Cursor Prompt

```
Generate Jest test suite for Bali Zero Advisory handler.

Context:
- File: src/handlers/bali-zero/advisory.ts
- Business advisory services
- Expert guidance

Task:
Create: src/handlers/bali-zero/__tests__/advisory.test.ts

Mock Strategy:
```typescript
jest.mock('../../rag/rag.js', () => ({
  queryKnowledge: jest.fn()
}));

jest.mock('../../ai-services/ai.js', () => ({
  generateCompletion: jest.fn()
}));
```

For EACH function:
1. Get advisory:
   - ✓ Success with recommendations
   - ✓ Invalid query
   - ✓ No advice available

2. Business consultation:
   - ✓ Legal advice
   - ✓ Financial advice
   - ✓ Operational advice

3. Generate report:
   - ✓ Comprehensive report
   - ✓ Summary
   - ✓ Missing data

Import: await import('../advisory.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- advisory.test
```

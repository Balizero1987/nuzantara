# Test Generation: ai-services/ai-enhanced.ts

## Priority: 40

## File to Test
`src/handlers/ai-services/ai-enhanced.ts`

## Cursor Prompt

```
Generate Jest test suite for AI Enhanced handler.

Context:
- File: src/handlers/ai-services/ai-enhanced.ts
- Enhanced AI features
- RAG integration

Task:
Create: src/handlers/ai-services/__tests__/ai-enhanced.test.ts

Mock Strategy:
```typescript
jest.mock('./ai.js', () => ({
  generateCompletion: jest.fn()
}));

jest.mock('../../rag/rag.js', () => ({
  queryKnowledge: jest.fn()
}));
```

For EACH function:
1. Enhanced query:
   - ✓ Success with RAG
   - ✓ Fallback without RAG
   - ✓ Context enrichment

2. Retrieve context:
   - ✓ Relevant docs found
   - ✓ No relevant docs
   - ✓ Error handling

3. Combine results:
   - ✓ AI + RAG merge
   - ✓ Ranking
   - ✓ Deduplication

Import: await import('../ai-enhanced.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- ai-enhanced.test
```

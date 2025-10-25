# Test Generation: zantara/zantara-brilliant.ts

## Priority: 24

## File to Test
`src/handlers/zantara/zantara-brilliant.ts`

## Cursor Prompt

```
Generate Jest test suite for Zantara Brilliant handler.

Context:
- File: src/handlers/zantara/zantara-brilliant.ts
- Advanced AI operations
- Enhanced query processing

Task:
Create: src/handlers/zantara/__tests__/zantara-brilliant.test.ts

Mock Strategy:
```typescript
jest.mock('../../ai-services/ai.js', () => ({
  generateCompletion: jest.fn()
}));

jest.mock('../knowledge.js', () => ({
  queryKnowledge: jest.fn()
}));
```

For EACH function:
1. Brilliant query:
   - ✓ Success with enhanced response
   - ✓ Fallback to standard
   - ✓ API error

2. Process query:
   - ✓ Context enrichment
   - ✓ Multi-step reasoning
   - ✓ Invalid input

3. Format response:
   - ✓ Structured output
   - ✓ Citations
   - ✓ Confidence scores

Import: await import('../zantara-brilliant.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- zantara-brilliant.test
```

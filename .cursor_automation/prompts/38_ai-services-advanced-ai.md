# Test Generation: ai-services/advanced-ai.ts

## Priority: 38

## File to Test
`src/handlers/ai-services/advanced-ai.ts`

## Cursor Prompt

```
Generate Jest test suite for Advanced AI handler.

Context:
- File: src/handlers/ai-services/advanced-ai.ts
- Advanced AI capabilities
- Multi-model support

Task:
Create: src/handlers/ai-services/__tests__/advanced-ai.test.ts

Mock Strategy:
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

For EACH function:
1. Advanced completion:
   - ✓ Success
   - ✓ Function calling
   - ✓ Vision input
   - ✓ Error handling

2. Multi-turn conversation:
   - ✓ Context tracking
   - ✓ Token management
   - ✓ Reset state

3. Model selection:
   - ✓ Auto-select
   - ✓ Fallback
   - ✓ Invalid model

Import: await import('../advanced-ai.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- advanced-ai.test
```

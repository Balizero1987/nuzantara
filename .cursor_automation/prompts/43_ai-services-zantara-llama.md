# Test Generation: ai-services/zantara-llama.ts

## Priority: 43

## File to Test
`src/handlers/ai-services/zantara-llama.ts`

## Cursor Prompt

```
Generate Jest test suite for Zantara Llama handler.

Context:
- File: src/handlers/ai-services/zantara-llama.ts
- Llama model integration
- Local/hosted LLM

Task:
Create: src/handlers/ai-services/__tests__/zantara-llama.test.ts

Mock Strategy:
```typescript
jest.mock('axios', () => ({
  post: jest.fn()
}));
```

For EACH function:
1. Llama completion:
   - ✓ Success
   - ✓ Model not loaded
   - ✓ Invalid params
   - ✓ Timeout

2. Stream response:
   - ✓ Streaming chunks
   - ✓ Connection error
   - ✓ Malformed chunk

3. Model info:
   - ✓ Get model details
   - ✓ Model not found

Import: await import('../zantara-llama.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- zantara-llama.test
```

# Test Generation: ai-services/ai-bridge.ts

## Priority: 39

## File to Test
`src/handlers/ai-services/ai-bridge.ts`

## Cursor Prompt

```
Generate Jest test suite for AI Bridge handler.

Context:
- File: src/handlers/ai-services/ai-bridge.ts
- Cross-provider AI bridge
- Unified interface

Task:
Create: src/handlers/ai-services/__tests__/ai-bridge.test.ts

Mock Strategy:
```typescript
jest.mock('./ai.js', () => ({
  generateCompletion: jest.fn()
}));

jest.mock('./advanced-ai.js', () => ({
  advancedCompletion: jest.fn()
}));
```

For EACH function:
1. Bridge request:
   - ✓ OpenAI provider
   - ✓ Anthropic provider
   - ✓ Local model
   - ✓ Provider fallback

2. Normalize response:
   - ✓ OpenAI format
   - ✓ Anthropic format
   - ✓ Custom format

3. Handle errors:
   - ✓ Provider error
   - ✓ Rate limit
   - ✓ Timeout

Import: await import('../ai-bridge.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- ai-bridge.test
```

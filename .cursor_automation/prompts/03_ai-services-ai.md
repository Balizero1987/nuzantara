# Test Generation: ai-services/ai.ts

## Priority: 3

## File to Test
`apps/backend-ts/src/handlers/ai-services/ai.ts`

## Cursor Prompt

```
Generate Jest test suite for AI services handler.

Context:
- File: apps/backend-ts/src/handlers/ai-services/ai.ts
- Critical AI functionality
- May have external AI API calls

Task:
Create: apps/backend-ts/src/handlers/ai-services/__tests__/ai.test.ts

Test Strategy:
1. Identify all exported AI functions
2. Mock ALL external AI API calls (OpenAI, Anthropic, etc)
3. Test input validation thoroughly
4. Test error handling (API failures, rate limits)
5. Test response parsing

Mock Examples:
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
- ✓ Valid AI request
- ✓ Invalid inputs
- ✓ API error handling
- ✓ Rate limit handling
- ✓ Response structure

Import pattern: await import('../ai.js')

Target: >75% coverage (AI code harder to test)
```

## After Generation

```bash
npm test -- ai.test
```

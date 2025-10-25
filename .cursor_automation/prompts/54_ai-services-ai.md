# Test Generation: ai-services/ai.ts (CORE)

## Priority: 54

## File to Test
`src/handlers/ai-services/ai.ts`

## Cursor Prompt

```
Generate Jest test suite for Core AI services handler.

Context:
- File: src/handlers/ai-services/ai.ts
- Core AI functionality
- Base completion engine

Task:
Create: src/handlers/ai-services/__tests__/ai.test.ts

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

jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}));
```

For EACH function:
1. Generate completion:
   - ✓ Valid request
   - ✓ Invalid inputs
   - ✓ API error
   - ✓ Rate limit

2. Stream completion:
   - ✓ Streaming chunks
   - ✓ Connection error
   - ✓ Malformed data

3. Function calling:
   - ✓ Tool use
   - ✓ Tool error
   - ✓ Nested calls

Import: await import('../ai.js')

Target: >75% coverage
```

## After Generation

```bash
npm test -- ai.test
```

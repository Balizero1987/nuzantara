# Test Generation: zero/chat-simple.ts

## Priority: 36

## File to Test
`src/handlers/zero/chat-simple.ts`

## Cursor Prompt

```
Generate Jest test suite for Zero Chat Simple handler.

Context:
- File: src/handlers/zero/chat-simple.ts
- Simplified chat interface
- Basic conversational AI

Task:
Create: src/handlers/zero/__tests__/chat-simple.test.ts

Mock Strategy:
```typescript
jest.mock('../../ai-services/ai.js', () => ({
  generateCompletion: jest.fn()
}));
```

For EACH function:
1. Send message:
   - ✓ Success with response
   - ✓ Empty message
   - ✓ Invalid input
   - ✓ AI error

2. Get conversation:
   - ✓ Existing conversation
   - ✓ New conversation
   - ✓ Not found

3. Clear chat:
   - ✓ Success
   - ✓ Not found

Import: await import('../chat-simple.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- chat-simple.test
```

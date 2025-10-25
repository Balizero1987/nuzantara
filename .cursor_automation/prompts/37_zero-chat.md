# Test Generation: zero/chat.ts

## Priority: 37

## File to Test
`src/handlers/zero/chat.ts`

## Cursor Prompt

```
Generate Jest test suite for Zero Chat handler.

Context:
- File: src/handlers/zero/chat.ts
- Advanced chat features
- Context management

Task:
Create: src/handlers/zero/__tests__/chat.test.ts

Mock Strategy:
```typescript
jest.mock('../../ai-services/ai.js', () => ({
  generateCompletion: jest.fn()
}));

jest.mock('../../memory/memory.js', () => ({
  saveMemory: jest.fn(),
  getMemory: jest.fn()
}));
```

For EACH function:
1. Chat with context:
   - ✓ Success with history
   - ✓ New conversation
   - ✓ Context limit

2. Save context:
   - ✓ Success
   - ✓ Overflow handling
   - ✓ Error recovery

3. Stream response:
   - ✓ Streaming chunks
   - ✓ Stream error
   - ✓ Connection closed

Import: await import('../chat.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- chat.test
```

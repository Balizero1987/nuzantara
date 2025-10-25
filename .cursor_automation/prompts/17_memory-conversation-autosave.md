# Test Generation: memory/conversation-autosave.ts

## Priority: 17

## File to Test
`src/handlers/memory/conversation-autosave.ts`

## Cursor Prompt

```
Generate Jest test suite for Conversation Autosave handler.

Context:
- File: src/handlers/memory/conversation-autosave.ts
- Auto-save conversation state
- Critical for UX

Task:
Create: src/handlers/memory/__tests__/conversation-autosave.test.ts

Mock Strategy:
```typescript
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn()
      }))
    }))
  }))
}));
```

For EACH function:
1. Auto-save conversation:
   - ✓ Success
   - ✓ Debouncing
   - ✓ Error handling

2. Load conversation:
   - ✓ Exists
   - ✓ Not found
   - ✓ Corrupted data

3. Clear autosave:
   - ✓ Success
   - ✓ Not found

Import: await import('../conversation-autosave.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- conversation-autosave.test
```

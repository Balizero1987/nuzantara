# Test Generation: memory/memory.ts

## Priority: 5

## File to Test
`apps/backend-ts/src/handlers/memory/memory.ts`

## Cursor Prompt

```
Generate Jest test suite for Memory handler.

Context:
- File: apps/backend-ts/src/handlers/memory/memory.ts
- Data persistence layer
- Likely uses Firestore or similar

Task:
Create: apps/backend-ts/src/handlers/memory/__tests__/memory.test.ts

Mock Firestore:
```typescript
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }))
    }))
  }))
}));
```

For EACH memory function:
1. Save memory:
   - ✓ Success
   - ✓ Invalid data
   - ✓ Firestore error

2. Get memory:
   - ✓ Memory exists
   - ✓ Memory not found
   - ✓ Invalid ID

3. Update memory:
   - ✓ Success
   - ✓ Not found
   - ✓ Invalid update

4. Delete memory:
   - ✓ Success
   - ✓ Not found

Import: await import('../memory.js')
Mock ALL Firebase calls

Target: >85% coverage
```

## After Generation

```bash
npm test -- memory.test
```

# Test Generation: memory/memory.ts (CORE)

## Priority: 53

## File to Test
`src/handlers/memory/memory.ts`

## Cursor Prompt

```
Generate Jest test suite for Core Memory handler.

Context:
- File: src/handlers/memory/memory.ts
- Core memory operations
- Session management

Task:
Create: src/handlers/memory/__tests__/memory.test.ts

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

For EACH function:
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

5. List memories:
   - ✓ User memories
   - ✓ Filter by date
   - ✓ Pagination

Import: await import('../memory.js')
Mock ALL Firebase calls

Target: >85% coverage
```

## After Generation

```bash
npm test -- memory.test
```

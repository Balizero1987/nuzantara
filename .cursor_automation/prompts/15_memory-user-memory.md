# Test Generation: memory/user-memory.ts

## Priority: 15

## File to Test
`src/handlers/memory/user-memory.ts`

## Cursor Prompt

```
Generate Jest test suite for User Memory handler.

Context:
- File: src/handlers/memory/user-memory.ts
- User-specific memory storage
- Critical for personalization

Task:
Create: src/handlers/memory/__tests__/user-memory.test.ts

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
      })),
      where: jest.fn(() => ({
        get: jest.fn()
      }))
    }))
  }))
}));
```

For EACH function:
1. Save user memory:
   - ✓ Success
   - ✓ Missing user ID
   - ✓ Invalid data

2. Get user memory:
   - ✓ Memory exists
   - ✓ User not found
   - ✓ Empty memory

3. Update memory:
   - ✓ Success
   - ✓ Partial update
   - ✓ Merge fields

4. Delete memory:
   - ✓ Success
   - ✓ Not found

5. Query memories:
   - ✓ Filter by date
   - ✓ Filter by type
   - ✓ Empty results

Import: await import('../user-memory.js')
Mock ALL Firebase calls

Target: >85% coverage
```

## After Generation

```bash
npm test -- user-memory.test
```

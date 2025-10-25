# Test Generation: memory/episodes-firestore.ts

## Priority: 16

## File to Test
`src/handlers/memory/episodes-firestore.ts`

## Cursor Prompt

```
Generate Jest test suite for Episodes Firestore handler.

Context:
- File: src/handlers/memory/episodes-firestore.ts
- Episode-based memory storage
- Firestore backend

Task:
Create: src/handlers/memory/__tests__/episodes-firestore.test.ts

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
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        }))
      }))
    }))
  }))
}));
```

For EACH function:
1. Create episode:
   - ✓ Success
   - ✓ Missing data
   - ✓ Firestore error

2. Get episode:
   - ✓ Exists
   - ✓ Not found
   - ✓ Invalid ID

3. List episodes:
   - ✓ Success with pagination
   - ✓ Empty list
   - ✓ Filtered results

4. Update episode:
   - ✓ Success
   - ✓ Not found

5. Delete episode:
   - ✓ Success
   - ✓ Not found

Import: await import('../episodes-firestore.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- episodes-firestore.test
```

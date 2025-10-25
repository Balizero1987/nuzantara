# Test Generation: google-workspace/docs.ts

## Priority: 8

## File to Test
`src/handlers/google-workspace/docs.ts`

## Cursor Prompt

```
Generate Jest test suite for Google Docs handler.

Context:
- File: src/handlers/google-workspace/docs.ts
- Document creation and editing
- Text formatting operations

Task:
Create: src/handlers/google-workspace/__tests__/docs.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    docs: jest.fn(() => ({
      documents: {
        create: jest.fn(),
        get: jest.fn(),
        batchUpdate: jest.fn()
      }
    }))
  }
}));
```

For EACH function:
1. Create document:
   - ✓ Success with title
   - ✓ Empty document
   - ✓ API error

2. Get document:
   - ✓ Valid document ID
   - ✓ Invalid ID
   - ✓ Permission denied

3. Update document:
   - ✓ Insert text
   - ✓ Format text
   - ✓ Invalid operations

Import: await import('../docs.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- docs.test
```

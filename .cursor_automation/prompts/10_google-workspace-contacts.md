# Test Generation: google-workspace/contacts.ts

## Priority: 10

## File to Test
`src/handlers/google-workspace/contacts.ts`

## Cursor Prompt

```
Generate Jest test suite for Google Contacts handler.

Context:
- File: src/handlers/google-workspace/contacts.ts
- Contact management operations
- People API integration

Task:
Create: src/handlers/google-workspace/__tests__/contacts.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    people: jest.fn(() => ({
      people: {
        createContact: jest.fn(),
        get: jest.fn(),
        updateContact: jest.fn(),
        deleteContact: jest.fn(),
        connections: {
          list: jest.fn()
        }
      }
    }))
  }
}));
```

For EACH function:
1. Create contact:
   - ✓ Success with name/email
   - ✓ Missing required fields
   - ✓ Duplicate contact

2. List contacts:
   - ✓ Success with results
   - ✓ Empty contacts
   - ✓ Pagination

3. Update contact:
   - ✓ Success
   - ✓ Not found
   - ✓ Invalid field

4. Delete contact:
   - ✓ Success
   - ✓ Not found

Import: await import('../contacts.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- contacts.test
```

# Test Generation: google-workspace/gmail.ts

## Priority: 4

## File to Test
`apps/backend-ts/src/handlers/google-workspace/gmail.ts`

## Cursor Prompt

```
Generate Jest test suite for Gmail handler.

Context:
- File: apps/backend-ts/src/handlers/google-workspace/gmail.ts
- Gmail API integration
- Critical for email functionality

Task:
Create: apps/backend-ts/src/handlers/google-workspace/__tests__/gmail.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    gmail: jest.fn(() => ({
      users: {
        messages: {
          send: jest.fn(),
          list: jest.fn(),
          get: jest.fn()
        }
      }
    }))
  }
}));
```

For EACH Gmail function:
1. Send email:
   - ✓ Success
   - ✓ Missing recipient
   - ✓ Invalid email format
   - ✓ Gmail API error

2. List messages:
   - ✓ Success with results
   - ✓ Empty inbox
   - ✓ Pagination

3. Get message:
   - ✓ Valid message ID
   - ✓ Invalid message ID
   - ✓ Not found

Import: await import('../gmail.js')
Mock ALL googleapis calls

Target: >80% coverage
```

## After Generation

```bash
npm test -- gmail.test
```

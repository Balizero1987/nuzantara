# Test Generation: google-workspace/gmail.ts (CORE)

## Priority: 55

## File to Test
`src/handlers/google-workspace/gmail.ts`

## Cursor Prompt

```
Generate Jest test suite for Gmail handler (CORE).

Context:
- File: src/handlers/google-workspace/gmail.ts
- Gmail API integration
- Critical for email functionality

Task:
Create: src/handlers/google-workspace/__tests__/gmail.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    gmail: jest.fn(() => ({
      users: {
        messages: {
          send: jest.fn(),
          list: jest.fn(),
          get: jest.fn(),
          modify: jest.fn(),
          delete: jest.fn()
        },
        labels: {
          list: jest.fn()
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
   - ✓ Label filtering

3. Get message:
   - ✓ Valid message ID
   - ✓ Invalid message ID
   - ✓ Not found

4. Delete message:
   - ✓ Success
   - ✓ Not found

Import: await import('../gmail.js')
Mock ALL googleapis calls

Target: >80% coverage
```

## After Generation

```bash
npm test -- gmail.test
```

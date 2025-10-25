# Test Generation: communication/instagram.ts

## Priority: 14

## File to Test
`src/handlers/communication/instagram.ts`

## Cursor Prompt

```
Generate Jest test suite for Instagram handler.

Context:
- File: src/handlers/communication/instagram.ts
- Instagram messaging/posting
- Social media integration

Task:
Create: src/handlers/communication/__tests__/instagram.test.ts

Mock Strategy:
```typescript
jest.mock('instagram-private-api', () => ({
  IgApiClient: jest.fn(() => ({
    feed: {
      timeline: jest.fn()
    },
    publish: {
      photo: jest.fn()
    },
    directThread: {
      broadcastText: jest.fn()
    }
  }))
}));
```

For EACH function:
1. Post photo:
   - ✓ Success
   - ✓ Invalid image URL
   - ✓ Missing caption

2. Send DM:
   - ✓ Success
   - ✓ Invalid user
   - ✓ API error

3. Get feed:
   - ✓ Success
   - ✓ Empty feed
   - ✓ Pagination

Import: await import('../instagram.js')
Target: >70% coverage
```

## After Generation

```bash
npm test -- instagram.test
```

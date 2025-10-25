# Test Generation: communication/communication.ts

## Priority: 51

## File to Test
`src/handlers/communication/communication.ts`

## Cursor Prompt

```
Generate Jest test suite for Communication handler.

Context:
- File: src/handlers/communication/communication.ts
- Unified communication interface
- Multi-channel messaging

Task:
Create: src/handlers/communication/__tests__/communication.test.ts

Mock Strategy:
```typescript
jest.mock('./gmail.js', () => ({
  sendEmail: jest.fn()
}));

jest.mock('./whatsapp.js', () => ({
  sendWhatsApp: jest.fn()
}));

jest.mock('./instagram.js', () => ({
  sendDM: jest.fn()
}));
```

For EACH function:
1. Send message:
   - ✓ Email channel
   - ✓ WhatsApp channel
   - ✓ Instagram channel
   - ✓ Invalid channel

2. Broadcast:
   - ✓ Multi-channel success
   - ✓ Partial failure
   - ✓ All channels fail

3. Get message status:
   - ✓ Delivered
   - ✓ Pending
   - ✓ Failed

Import: await import('../communication.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- communication.test
```

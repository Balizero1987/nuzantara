# Test Generation: communication/whatsapp.ts

## Priority: 11

## File to Test
`src/handlers/communication/whatsapp.ts`

## Cursor Prompt

```
Generate Jest test suite for WhatsApp handler.

Context:
- File: src/handlers/communication/whatsapp.ts
- WhatsApp messaging integration
- Critical communication channel

Task:
Create: src/handlers/communication/__tests__/whatsapp.test.ts

Mock Strategy:
```typescript
jest.mock('twilio', () => ({
  Twilio: jest.fn(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}));
```

For EACH function:
1. Send message:
   - ✓ Success with valid phone
   - ✓ Missing phone number
   - ✓ Invalid phone format
   - ✓ API error

2. Send media:
   - ✓ Success with image
   - ✓ Invalid media URL
   - ✓ Unsupported format

3. Get message status:
   - ✓ Delivered
   - ✓ Failed
   - ✓ Pending

Import: await import('../whatsapp.js')
Mock ALL Twilio calls

Target: >80% coverage
```

## After Generation

```bash
npm test -- whatsapp.test
```

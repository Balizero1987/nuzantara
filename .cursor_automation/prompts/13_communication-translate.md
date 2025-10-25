# Test Generation: communication/translate.ts

## Priority: 13

## File to Test
`src/handlers/communication/translate.ts`

## Cursor Prompt

```
Generate Jest test suite for Translation handler.

Context:
- File: src/handlers/communication/translate.ts
- Multi-language translation
- Supports multiple providers

Task:
Create: src/handlers/communication/__tests__/translate.test.ts

Mock Strategy:
```typescript
jest.mock('@google-cloud/translate', () => ({
  Translate: jest.fn(() => ({
    translate: jest.fn(),
    detect: jest.fn()
  }))
}));
```

For EACH function:
1. Translate text:
   - ✓ Success (en → it)
   - ✓ Invalid language code
   - ✓ Empty text
   - ✓ API error

2. Detect language:
   - ✓ Success
   - ✓ Ambiguous text
   - ✓ Empty input

3. Batch translate:
   - ✓ Multiple texts
   - ✓ Mixed languages
   - ✓ Error handling

Import: await import('../translate.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- translate.test
```

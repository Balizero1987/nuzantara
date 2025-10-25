# Test Generation: example-modern-handler.ts

## Priority: 1 (START HERE)

## File to Test
`apps/backend-ts/src/handlers/example-modern-handler.ts`

## Cursor Prompt

```
Generate comprehensive Jest test suite for example-modern-handler.ts

Context:
- File: apps/backend-ts/src/handlers/example-modern-handler.ts
- 3 handlers: sendEmailV2, listInboxV2, kbliLookupV2
- Jest configured (jest.config.js exists)
- Pattern: src/middleware/__tests__/alerts.test.ts

Task:
Create: apps/backend-ts/src/handlers/__tests__/example-modern-handler.test.ts

Test ALL functions:

1. sendEmailV2:
   ✓ Success with all params
   ✓ Error: missing 'to'
   ✓ Error: missing 'subject'
   ✓ Error: missing 'body'
   ✓ Verify response: messageId, status, timestamp

2. listInboxV2:
   ✓ Default maxResults (10)
   ✓ Custom maxResults
   ✓ Response structure: messages, nextPageToken

3. kbliLookupV2:
   ✓ Lookup by code
   ✓ Lookup by query
   ✓ Error: both params missing
   ✓ Response: code, title, risk, requirements

Standards:
- Import pattern: await import('../example-modern-handler.js')
- Use @jest/globals
- beforeEach clear mocks
- describe/it blocks
- Clear test names
- NO external mocking needed

File structure:
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Example Modern Handler', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../example-modern-handler.js');
  });

  describe('sendEmailV2', () => {
    it('should send email with valid params', async () => {
      const result = await handlers.sendEmailV2({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messageId');
      expect(result.data).toHaveProperty('status', 'sent');
    });

    it('should error when missing to param', async () => {
      const result = await handlers.sendEmailV2({
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
    });

    // Add more tests...
  });

  describe('listInboxV2', () => {
    it('should list inbox with default maxResults', async () => {
      const result = await handlers.listInboxV2({});

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
    });
  });

  describe('kbliLookupV2', () => {
    it('should lookup by code', async () => {
      const result = await handlers.kbliLookupV2({ code: '62010' });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('code');
      expect(result.data).toHaveProperty('title');
    });

    it('should error when both params missing', async () => {
      const result = await handlers.kbliLookupV2({});

      expect(result.ok).toBe(false);
    });
  });
});

Success: npm test -- example-modern-handler.test
Target: >80% coverage
```

## After Generation

Run:
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/backend-ts
npm test -- example-modern-handler.test
npm test -- --coverage example-modern-handler.test
```

Expected output: All tests PASS ✓

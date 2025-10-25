# Test Generation: auth/team-login-secure.ts

## Priority: 31

## File to Test
`src/handlers/auth/team-login-secure.ts`

## Cursor Prompt

```
Generate Jest test suite for Team Login Secure handler.

Context:
- File: src/handlers/auth/team-login-secure.ts
- Enhanced security features
- 2FA, rate limiting

Task:
Create: src/handlers/auth/__tests__/team-login-secure.test.ts

Mock Strategy:
```typescript
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

jest.mock('speakeasy', () => ({
  totp: {
    verify: jest.fn()
  }
}));
```

For EACH function:
1. Secure login:
   - ✓ Success with 2FA
   - ✓ Invalid 2FA code
   - ✓ Rate limited
   - ✓ IP blocked

2. Verify 2FA:
   - ✓ Valid code
   - ✓ Invalid code
   - ✓ Expired code

3. Check rate limit:
   - ✓ Within limit
   - ✓ Exceeded limit
   - ✓ Reset counter

Import: await import('../team-login-secure.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- team-login-secure.test
```

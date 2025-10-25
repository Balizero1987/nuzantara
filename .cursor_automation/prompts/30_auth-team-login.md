# Test Generation: auth/team-login.ts

## Priority: 30

## File to Test
`src/handlers/auth/team-login.ts`

## Cursor Prompt

```
Generate Jest test suite for Team Login handler.

Context:
- File: src/handlers/auth/team-login.ts
- Team authentication
- Multi-user sessions

Task:
Create: src/handlers/auth/__tests__/team-login.test.ts

Mock Strategy:
```typescript
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createCustomToken: jest.fn()
  }))
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));
```

For EACH function:
1. Team login:
   - ✓ Success with valid credentials
   - ✓ Invalid email
   - ✓ Invalid password
   - ✓ Account locked

2. Create team token:
   - ✓ Success
   - ✓ Invalid team ID
   - ✓ Expired token

3. Verify team access:
   - ✓ Valid access
   - ✓ No permission
   - ✓ Expired session

Import: await import('../team-login.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- team-login.test
```

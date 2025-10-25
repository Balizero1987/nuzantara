# Test Generation: identity/identity.ts

## Priority: 29

## File to Test
`src/handlers/identity/identity.ts`

## Cursor Prompt

```
Generate Jest test suite for Identity handler.

Context:
- File: src/handlers/identity/identity.ts
- User identity management
- Authentication helpers

Task:
Create: src/handlers/identity/__tests__/identity.test.ts

Mock Strategy:
```typescript
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  }))
}));
```

For EACH function:
1. Get user identity:
   - ✓ Success
   - ✓ User not found
   - ✓ Invalid UID

2. Create identity:
   - ✓ Success
   - ✓ Duplicate email
   - ✓ Invalid email

3. Update identity:
   - ✓ Success
   - ✓ Not found
   - ✓ Invalid data

4. Delete identity:
   - ✓ Success
   - ✓ Not found

Import: await import('../identity.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- identity.test
```

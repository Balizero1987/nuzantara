# Test Generation: admin/registry-admin.ts

## Priority: 32

## File to Test
`src/handlers/admin/registry-admin.ts`

## Cursor Prompt

```
Generate Jest test suite for Registry Admin handler.

Context:
- File: src/handlers/admin/registry-admin.ts
- Handler registry management
- Admin operations

Task:
Create: src/handlers/admin/__tests__/registry-admin.test.ts

Mock Strategy:
```typescript
jest.mock('../../lib/registry.js', () => ({
  globalRegistry: {
    getAllHandlers: jest.fn(),
    getHandler: jest.fn(),
    registerModule: jest.fn(),
    unregisterModule: jest.fn()
  }
}));
```

For EACH function:
1. List handlers:
   - ✓ Success
   - ✓ Filter by module
   - ✓ Empty registry

2. Get handler info:
   - ✓ Success
   - ✓ Not found
   - ✓ Invalid name

3. Register handler:
   - ✓ Success
   - ✓ Duplicate name
   - ✓ Invalid config

4. Unregister handler:
   - ✓ Success
   - ✓ Not found

Import: await import('../registry-admin.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- registry-admin.test
```

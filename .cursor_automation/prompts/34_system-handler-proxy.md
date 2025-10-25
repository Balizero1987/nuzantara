# Test Generation: system/handler-proxy.ts

## Priority: 34

## File to Test
`src/handlers/system/handler-proxy.ts`

## Cursor Prompt

```
Generate Jest test suite for Handler Proxy.

Context:
- File: src/handlers/system/handler-proxy.ts
- Request routing and proxying
- Middleware integration

Task:
Create: src/handlers/system/__tests__/handler-proxy.test.ts

Mock Strategy:
```typescript
jest.mock('../../lib/registry.js', () => ({
  globalRegistry: {
    getHandler: jest.fn()
  }
}));
```

For EACH function:
1. Proxy request:
   - ✓ Success to handler
   - ✓ Handler not found
   - ✓ Handler error

2. Route by name:
   - ✓ Valid handler name
   - ✓ Invalid name
   - ✓ Multiple matches

3. Apply middleware:
   - ✓ Pre-handler middleware
   - ✓ Post-handler middleware
   - ✓ Middleware error

4. Transform response:
   - ✓ Success transform
   - ✓ Error transform
   - ✓ Passthrough

Import: await import('../handler-proxy.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- handler-proxy.test
```

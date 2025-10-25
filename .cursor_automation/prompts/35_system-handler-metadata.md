# Test Generation: system/handler-metadata.ts

## Priority: 35

## File to Test
`src/handlers/system/handler-metadata.ts`

## Cursor Prompt

```
Generate Jest test suite for Handler Metadata.

Context:
- File: src/handlers/system/handler-metadata.ts
- Handler documentation and schema
- Introspection data

Task:
Create: src/handlers/system/__tests__/handler-metadata.test.ts

Mock Strategy:
```typescript
jest.mock('../../lib/registry.js', () => ({
  globalRegistry: {
    getAllHandlers: jest.fn(),
    getHandlerMetadata: jest.fn()
  }
}));
```

For EACH function:
1. Get metadata:
   - ✓ Success with full metadata
   - ✓ Handler not found
   - ✓ Partial metadata

2. Get schema:
   - ✓ Input schema
   - ✓ Output schema
   - ✓ No schema defined

3. Get documentation:
   - ✓ Full docs
   - ✓ Minimal docs
   - ✓ No docs

4. List all metadata:
   - ✓ Success
   - ✓ Filter by module
   - ✓ Empty

Import: await import('../handler-metadata.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- handler-metadata.test
```

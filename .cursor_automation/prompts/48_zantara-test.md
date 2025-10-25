# Test Generation: zantara/zantara-test.ts

## Priority: 48

## File to Test
`src/handlers/zantara/zantara-test.ts`

## Cursor Prompt

```
Generate Jest test suite for Zantara Test handler.

Context:
- File: src/handlers/zantara/zantara-test.ts
- Test/debugging handler
- Internal testing utilities

Task:
Create: src/handlers/zantara/__tests__/zantara-test.test.ts

Mock Strategy:
```typescript
// Mock any dependencies as needed
jest.mock('../knowledge.js', () => ({
  queryKnowledge: jest.fn()
}));
```

For EACH function:
1. Run test:
   - ✓ Success
   - ✓ Test failure
   - ✓ Invalid test case

2. Debug mode:
   - ✓ Verbose logging
   - ✓ Step-by-step execution
   - ✓ Breakpoint simulation

3. Mock data:
   - ✓ Generate test data
   - ✓ Reset state
   - ✓ Teardown

Import: await import('../zantara-test.js')
Target: >70% coverage
```

## After Generation

```bash
npm test -- zantara-test.test
```

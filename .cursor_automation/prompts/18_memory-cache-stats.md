# Test Generation: memory/memory-cache-stats.ts

## Priority: 18

## File to Test
`src/handlers/memory/memory-cache-stats.ts`

## Cursor Prompt

```
Generate Jest test suite for Memory Cache Stats handler.

Context:
- File: src/handlers/memory/memory-cache-stats.ts
- Cache performance monitoring
- Metrics collection

Task:
Create: src/handlers/memory/__tests__/memory-cache-stats.test.ts

Mock Strategy:
```typescript
// Mock cache implementation
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn()
};
```

For EACH function:
1. Get cache stats:
   - ✓ Hit rate
   - ✓ Miss rate
   - ✓ Size metrics

2. Record hit/miss:
   - ✓ Increment counters
   - ✓ Calculate rates

3. Clear stats:
   - ✓ Reset counters

4. Get cache size:
   - ✓ Current size
   - ✓ Max size
   - ✓ Percentage used

Import: await import('../memory-cache-stats.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- memory-cache-stats.test
```

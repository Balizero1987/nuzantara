# Test Generation: bali-zero/bali-zero-pricing.ts

## Priority: 52

## File to Test
`src/handlers/bali-zero/bali-zero-pricing.ts`

## Cursor Prompt

```
Generate Jest test suite for Bali Zero Pricing handler.

Context:
- File: src/handlers/bali-zero/bali-zero-pricing.ts
- Service pricing calculations
- Quote generation

Task:
Create: src/handlers/bali-zero/__tests__/bali-zero-pricing.test.ts

Mock Strategy:
```typescript
jest.mock('../../rag/rag.js', () => ({
  queryKnowledge: jest.fn()
}));
```

For EACH function:
1. Get pricing:
   - ✓ Valid service
   - ✓ Service not found
   - ✓ Custom pricing

2. Calculate quote:
   - ✓ Standard quote
   - ✓ Volume discount
   - ✓ Invalid inputs

3. Price comparison:
   - ✓ Multiple services
   - ✓ Best value
   - ✓ Filters

Import: await import('../bali-zero-pricing.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- bali-zero-pricing.test
```

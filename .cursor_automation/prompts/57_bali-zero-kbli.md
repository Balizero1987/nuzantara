# Test Generation: bali-zero/kbli.ts (REVISED)

## Priority: 57

## File to Test
`src/handlers/bali-zero/kbli.ts`

## Note
Test file already exists at `src/handlers/bali-zero/__tests__/kbli.test.ts`

## Cursor Prompt

```
REVIEW and ENHANCE existing test suite for KBLI handler.

Context:
- File: src/handlers/bali-zero/kbli.ts
- Existing test: src/handlers/bali-zero/__tests__/kbli.test.ts
- KBLI business classification lookup

Task:
Review and enhance: src/handlers/bali-zero/__tests__/kbli.test.ts

1. Run tests and check coverage:
   ```bash
   npm test -- --coverage kbli.test
   ```

2. If coverage < 80%, add tests for:
   - Code lookup
   - Query search
   - Invalid inputs
   - Response structure

Target: >85% coverage

Success: All tests PASS ✓, Coverage >85%
```

## After Enhancement

```bash
npm test -- --coverage kbli.test
```

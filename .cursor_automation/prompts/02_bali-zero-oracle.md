# Test Generation: bali-zero/oracle.ts

## Priority: 2

## File to Test
`apps/backend-ts/src/handlers/bali-zero/oracle.ts`

## Cursor Prompt

```
Generate Jest test suite for Bali Zero Oracle handler.

Context:
- File: apps/backend-ts/src/handlers/bali-zero/oracle.ts
- Core business logic for Bali Zero services
- Jest configured

Task:
Create: apps/backend-ts/src/handlers/bali-zero/__tests__/oracle.test.ts

Requirements:
1. Analyze oracle.ts to identify all exported functions
2. For EACH function, create tests for:
   - Success cases (valid inputs)
   - Error cases (invalid/missing inputs)
   - Edge cases (empty strings, null, undefined)
   - Response structure validation

3. Import pattern:
   - Use dynamic import: await import('../oracle.js')
   - Import from '@jest/globals'

4. Mock external dependencies:
   - Mock any RAG/backend calls
   - Mock Firebase if used
   - Mock external APIs

Standards:
- Follow pattern from middleware/__tests__/alerts.test.ts
- describe/it blocks
- beforeEach to clear mocks
- Meaningful test names
- Test both success AND error paths

Target: >80% coverage for this file
```

## After Generation

Run:
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/backend-ts
npm test -- oracle.test
```

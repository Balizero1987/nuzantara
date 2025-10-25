# Test Generation: ai-services/imagine-art-handler.ts

## Priority: 42

## File to Test
`src/handlers/ai-services/imagine-art-handler.ts`

## Cursor Prompt

```
Generate Jest test suite for Imagine Art handler.

Context:
- File: src/handlers/ai-services/imagine-art-handler.ts
- AI image generation
- External API integration

Task:
Create: src/handlers/ai-services/__tests__/imagine-art-handler.test.ts

Mock Strategy:
```typescript
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));
```

For EACH function:
1. Generate image:
   - ✓ Success
   - ✓ Invalid prompt
   - ✓ API error
   - ✓ Timeout

2. Check generation status:
   - ✓ Completed
   - ✓ In progress
   - ✓ Failed

3. Get image URL:
   - ✓ Valid URL
   - ✓ Expired
   - ✓ Not found

Import: await import('../imagine-art-handler.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- imagine-art-handler.test
```

# Test Generation: google-workspace/slides.ts

## Priority: 9

## File to Test
`src/handlers/google-workspace/slides.ts`

## Cursor Prompt

```
Generate Jest test suite for Google Slides handler.

Context:
- File: src/handlers/google-workspace/slides.ts
- Presentation operations
- Slide manipulation

Task:
Create: src/handlers/google-workspace/__tests__/slides.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    slides: jest.fn(() => ({
      presentations: {
        create: jest.fn(),
        get: jest.fn(),
        batchUpdate: jest.fn()
      }
    }))
  }
}));
```

For EACH function:
1. Create presentation:
   - ✓ Success with title
   - ✓ API error

2. Add slide:
   - ✓ Success
   - ✓ Invalid template

3. Update slide:
   - ✓ Add text
   - ✓ Add image
   - ✓ Invalid operations

4. Get presentation:
   - ✓ Valid ID
   - ✓ Not found

Import: await import('../slides.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- slides.test
```

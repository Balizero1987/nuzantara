# Test Generation: ai-services/creative.ts

## Priority: 41

## File to Test
`src/handlers/ai-services/creative.ts`

## Cursor Prompt

```
Generate Jest test suite for Creative AI handler.

Context:
- File: src/handlers/ai-services/creative.ts
- Creative content generation
- Storytelling, brainstorming

Task:
Create: src/handlers/ai-services/__tests__/creative.test.ts

Mock Strategy:
```typescript
jest.mock('./ai.js', () => ({
  generateCompletion: jest.fn()
}));
```

For EACH function:
1. Generate story:
   - ✓ Success
   - ✓ With prompt
   - ✓ Style variations

2. Brainstorm ideas:
   - ✓ Multiple ideas
   - ✓ Filtered results
   - ✓ Empty prompt

3. Creative writing:
   - ✓ Poem
   - ✓ Song lyrics
   - ✓ Marketing copy

Import: await import('../creative.js')
Target: >70% coverage
```

## After Generation

```bash
npm test -- creative.test
```

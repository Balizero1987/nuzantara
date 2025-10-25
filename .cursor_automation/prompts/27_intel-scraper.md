# Test Generation: intel/scraper.ts

## Priority: 27

## File to Test
`src/handlers/intel/scraper.ts`

## Cursor Prompt

```
Generate Jest test suite for Intel Scraper handler.

Context:
- File: src/handlers/intel/scraper.ts
- Web scraping functionality
- Content extraction

Task:
Create: src/handlers/intel/__tests__/scraper.test.ts

Mock Strategy:
```typescript
jest.mock('axios', () => ({
  get: jest.fn()
}));

jest.mock('cheerio', () => ({
  load: jest.fn()
}));
```

For EACH function:
1. Scrape URL:
   - ✓ Success
   - ✓ Invalid URL
   - ✓ Timeout
   - ✓ 404 error

2. Extract content:
   - ✓ Text extraction
   - ✓ Metadata
   - ✓ Images

3. Parse HTML:
   - ✓ Valid HTML
   - ✓ Malformed HTML
   - ✓ Empty content

Import: await import('../scraper.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- scraper.test
```

# Test Generation: google-workspace/sheets.ts

## Priority: 7

## File to Test
`src/handlers/google-workspace/sheets.ts`

## Cursor Prompt

```
Generate Jest test suite for Google Sheets handler.

Context:
- File: src/handlers/google-workspace/sheets.ts
- Spreadsheet operations
- Data manipulation critical

Task:
Create: src/handlers/google-workspace/__tests__/sheets.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    sheets: jest.fn(() => ({
      spreadsheets: {
        values: {
          get: jest.fn(),
          update: jest.fn(),
          append: jest.fn(),
          batchUpdate: jest.fn()
        }
      }
    }))
  }
}));
```

For EACH function:
1. Read range:
   - ✓ Success
   - ✓ Invalid range
   - ✓ Empty cells

2. Update cells:
   - ✓ Success
   - ✓ Invalid data format
   - ✓ Permission denied

3. Append rows:
   - ✓ Success
   - ✓ Invalid sheet

4. Batch operations:
   - ✓ Multiple updates
   - ✓ Error handling

Import: await import('../sheets.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- sheets.test
```

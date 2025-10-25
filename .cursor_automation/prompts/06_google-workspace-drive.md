# Test Generation: google-workspace/drive.ts

## Priority: 6

## File to Test
`src/handlers/google-workspace/drive.ts`

## Cursor Prompt

```
Generate Jest test suite for Google Drive handler.

Context:
- File: src/handlers/google-workspace/drive.ts
- Google Drive API integration
- Critical for file management

Task:
Create: src/handlers/google-workspace/__tests__/drive.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    drive: jest.fn(() => ({
      files: {
        create: jest.fn(),
        list: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn()
      }
    }))
  }
}));
```

For EACH Drive function:
1. Upload file:
   - ✓ Success
   - ✓ Missing file
   - ✓ Invalid MIME type
   - ✓ API error

2. List files:
   - ✓ Success with results
   - ✓ Empty drive
   - ✓ Filtered by folder

3. Download file:
   - ✓ Valid file ID
   - ✓ Invalid file ID
   - ✓ Permission denied

4. Delete file:
   - ✓ Success
   - ✓ File not found

Import: await import('../drive.js')
Mock ALL googleapis calls

Target: >80% coverage
```

## After Generation

```bash
npm test -- drive.test
```

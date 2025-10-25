# Test Generation: google-workspace/drive-multipart.ts

## Priority: 47

## File to Test
`src/handlers/google-workspace/drive-multipart.ts`

## Cursor Prompt

```
Generate Jest test suite for Drive Multipart handler.

Context:
- File: src/handlers/google-workspace/drive-multipart.ts
- Multipart file uploads
- Large file handling

Task:
Create: src/handlers/google-workspace/__tests__/drive-multipart.test.ts

Mock Strategy:
```typescript
jest.mock('googleapis', () => ({
  google: {
    drive: jest.fn(() => ({
      files: {
        create: jest.fn()
      }
    }))
  }
}));

jest.mock('form-data', () => jest.fn());
```

For EACH function:
1. Multipart upload:
   - ✓ Success
   - ✓ Large file (>5MB)
   - ✓ Upload timeout
   - ✓ Invalid MIME type

2. Resumable upload:
   - ✓ Success
   - ✓ Resume after failure
   - ✓ Progress tracking

3. Chunk upload:
   - ✓ Sequential chunks
   - ✓ Failed chunk retry
   - ✓ Final assembly

Import: await import('../drive-multipart.js')
Target: >75% coverage
```

## After Generation

```bash
npm test -- drive-multipart.test
```

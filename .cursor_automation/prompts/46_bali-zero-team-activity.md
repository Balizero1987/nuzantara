# Test Generation: bali-zero/team-activity.ts

## Priority: 46

## File to Test
`src/handlers/bali-zero/team-activity.ts`

## Cursor Prompt

```
Generate Jest test suite for Team Activity handler.

Context:
- File: src/handlers/bali-zero/team-activity.ts
- Team activity tracking
- Collaboration metrics

Task:
Create: src/handlers/bali-zero/__tests__/team-activity.test.ts

Mock Strategy:
```typescript
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn()
        }))
      })),
      doc: jest.fn(() => ({
        set: jest.fn()
      }))
    }))
  }))
}));
```

For EACH function:
1. Log activity:
   - ✓ Success
   - ✓ Missing user ID
   - ✓ Invalid activity type

2. Get team activity:
   - ✓ Recent activity
   - ✓ Filtered by type
   - ✓ Empty results

3. Activity stats:
   - ✓ Daily totals
   - ✓ User breakdown
   - ✓ Trends

Import: await import('../team-activity.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- team-activity.test
```

# Test Generation: analytics/analytics.ts

## Priority: 50

## File to Test
`src/handlers/analytics/analytics.ts`

## Cursor Prompt

```
Generate Jest test suite for Analytics handler.

Context:
- File: src/handlers/analytics/analytics.ts
- Core analytics functionality
- Event tracking and aggregation

Task:
Create: src/handlers/analytics/__tests__/analytics.test.ts

Mock Strategy:
```typescript
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn()
      }))
    }))
  }))
}));
```

For EACH function:
1. Track event:
   - ✓ Success
   - ✓ Missing event name
   - ✓ Invalid properties

2. Get analytics:
   - ✓ Date range query
   - ✓ Event type filter
   - ✓ Aggregations

3. Generate report:
   - ✓ Daily report
   - ✓ Weekly report
   - ✓ Custom date range

4. Calculate metrics:
   - ✓ User metrics
   - ✓ Event metrics
   - ✓ Conversion metrics

Import: await import('../analytics.js')
Target: >85% coverage
```

## After Generation

```bash
npm test -- analytics.test
```

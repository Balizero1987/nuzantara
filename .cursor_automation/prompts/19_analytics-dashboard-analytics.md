# Test Generation: analytics/dashboard-analytics.ts

## Priority: 19

## File to Test
`src/handlers/analytics/dashboard-analytics.ts`

## Cursor Prompt

```
Generate Jest test suite for Dashboard Analytics handler.

Context:
- File: src/handlers/analytics/dashboard-analytics.ts
- Real-time dashboard metrics
- Aggregation logic

Task:
Create: src/handlers/analytics/__tests__/dashboard-analytics.test.ts

Mock Strategy:
```typescript
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn()
      })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        }))
      }))
    }))
  }))
}));
```

For EACH function:
1. Get dashboard stats:
   - ✓ Success with all metrics
   - ✓ Date range filtering
   - ✓ No data

2. Calculate metrics:
   - ✓ User count
   - ✓ Activity rate
   - ✓ Error rate

3. Aggregations:
   - ✓ Daily totals
   - ✓ Weekly trends
   - ✓ Monthly reports

Import: await import('../dashboard-analytics.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- dashboard-analytics.test
```

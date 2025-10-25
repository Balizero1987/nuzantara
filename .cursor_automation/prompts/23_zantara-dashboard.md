# Test Generation: zantara/zantara-dashboard.ts

## Priority: 23

## File to Test
`src/handlers/zantara/zantara-dashboard.ts`

## Cursor Prompt

```
Generate Jest test suite for Zantara Dashboard handler.

Context:
- File: src/handlers/zantara/zantara-dashboard.ts
- Dashboard data aggregation
- Metrics visualization

Task:
Create: src/handlers/zantara/__tests__/zantara-dashboard.test.ts

Mock Strategy:
```typescript
jest.mock('../../analytics/analytics.js', () => ({
  getDashboardStats: jest.fn()
}));

jest.mock('../knowledge.js', () => ({
  getKnowledgeStats: jest.fn()
}));
```

For EACH function:
1. Get dashboard data:
   - ✓ Success with all metrics
   - ✓ Partial data
   - ✓ No data

2. Calculate stats:
   - ✓ Knowledge count
   - ✓ Query count
   - ✓ Success rate

3. Format response:
   - ✓ Chart data
   - ✓ Summary stats
   - ✓ Trends

Import: await import('../zantara-dashboard.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- zantara-dashboard.test
```

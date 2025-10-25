# Test Generation: analytics/weekly-report.ts

## Priority: 20

## File to Test
`src/handlers/analytics/weekly-report.ts`

## Cursor Prompt

```
Generate Jest test suite for Weekly Report handler.

Context:
- File: src/handlers/analytics/weekly-report.ts
- Weekly summary generation
- Email reports

Task:
Create: src/handlers/analytics/__tests__/weekly-report.test.ts

Mock Strategy:
```typescript
jest.mock('../analytics.js', () => ({
  getDashboardStats: jest.fn()
}));

jest.mock('../../communication/gmail.js', () => ({
  sendEmail: jest.fn()
}));
```

For EACH function:
1. Generate report:
   - ✓ Success with data
   - ✓ No data available
   - ✓ Date range validation

2. Format report:
   - ✓ HTML format
   - ✓ Charts/graphs
   - ✓ Summary stats

3. Send report:
   - ✓ Success
   - ✓ Email failure
   - ✓ Invalid recipients

Import: await import('../weekly-report.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- weekly-report.test
```

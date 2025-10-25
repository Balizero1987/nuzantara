# BATCH TEST RUN: All Generated Tests

## Priority: 67 (VERIFICATION)

## Purpose
Run ALL generated tests to verify they work and check coverage

## Cursor Prompt

```
Run complete test suite and generate coverage report.

Task:
1. Run ALL tests:
   ```bash
   npm test
   ```

2. Generate full coverage report:
   ```bash
   npm test -- --coverage
   ```

3. Identify files with < 80% coverage:
   ```bash
   npm test -- --coverage --coverageReporters=text --coverageThreshold='{"global":{"lines":80,"branches":80,"functions":80,"statements":80}}'
   ```

4. Generate HTML coverage report for review:
   ```bash
   npm test -- --coverage --coverageReporters=html
   open coverage/index.html
   ```

5. Create summary report:
   - Total handlers: 80
   - Handlers with tests: X
   - Average coverage: Y%
   - Files < 80% coverage: [list]

Success criteria:
- All tests PASS ✓
- Coverage >80% overall
- No critical handlers with <70% coverage
```

## Output
Save results to: /tmp/cursor_automation/reports/test_coverage_summary.json

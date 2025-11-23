# Console.log Usage Report

**Total Instances:** 74

## Files with most console usage:

```bash
grep -r "console\." apps/backend-ts/src --include="*.ts" |   cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

## Recommended Fix:

1. Import logger:
   ```typescript
   import { logger } from './services/logger';
   ```

2. Replace:
   ```typescript
   // Before
   console.log('Message:', data);
   
   // After
   logger.info('Message', { data });
   ```

3. Run:
   ```bash
   ./scripts/cleanup/replace-console-log-interactive.sh
   ```


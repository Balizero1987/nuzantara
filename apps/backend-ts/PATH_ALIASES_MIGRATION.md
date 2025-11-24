# Path Aliases Migration Guide

**Status**: Configuration complete, migration in progress  
**Date**: 2025-11-17 (Phase 3 - Code Quality)

## Configured Aliases

```typescript
{
  "@/*": "./src/*",              // Any file in src/
  "@handlers/*": "./src/handlers/*",
  "@middleware/*": "./src/middleware/*",
  "@services/*": "./src/services/*",
  "@utils/*": "./src/utils/*",
  "@types/*": "./src/types/*",
  "@config/*": "./src/config/*",
  "@routes/*": "./src/routes/*",
  "@tests/*": "./tests/*"
}
```

## Migration Examples

### Before (Deep Relative Imports)

```typescript
// ❌ OLD: Deep relative paths
import { BadRequestError } from '../../../utils/errors.js';
import { createMockRequest } from '../../../../tests/helpers/mocks.js';
import { baliZeroPricing } from '../../../handlers/bali-zero/bali-zero-pricing.js';
import logger from '../../../services/logger.js';
```

### After (Path Aliases)

```typescript
// ✅ NEW: Clean path aliases
import { BadRequestError } from '@utils/errors.js';
import { createMockRequest } from '@tests/helpers/mocks.js';
import { baliZeroPricing } from '@handlers/bali-zero/bali-zero-pricing.js';
import logger from '@services/logger.js';
```

## Migration Strategy

### Phase 1: New Files (Immediate)
- All NEW files must use path aliases
- No exceptions

### Phase 2: Modified Files (Ongoing)
- When editing existing files, migrate imports to aliases
- Don't create separate commits just for migration
- Include in your regular feature/fix commits

### Phase 3: Bulk Migration (Future - Optional)
- Use automated tool to migrate all at once
- Requires testing all imports still work
- Coordinate with team to avoid conflicts

## Benefits

✅ **Readability**: `@utils/errors` vs `../../../utils/errors`  
✅ **Refactoring**: Moving files doesn't break imports  
✅ **Consistency**: Same import path from anywhere  
✅ **IDE Support**: Better autocomplete  
✅ **Maintainability**: Easier to understand dependencies

## Usage in Different Contexts

### Handlers
```typescript
import logger from '@services/logger.js';
import { BadRequestError } from '@utils/errors.js';
import type { HandlerContext } from '@types/handler.js';
```

### Tests
```typescript
import { createMockRequest } from '@tests/helpers/mocks.js';
import { handler } from '@handlers/auth/login.js';
import logger from '@services/logger.js';
```

### Routes
```typescript
import { baliZeroPricing } from '@handlers/bali-zero/bali-zero-pricing.js';
import { cacheMiddleware } from '@middleware/cache.middleware.js';
import logger from '@services/logger.js';
```

### Services
```typescript
import { DatabaseService } from '@services/database.js';
import type { User } from '@types/user.js';
import { config } from '@config/index.js';
```

## Migration Progress

**Total Deep Imports Found**: ~20+ files  
**Migrated**: 0  
**Remaining**: ~20+

### Priority Files for Migration

1. `src/routes/api/v2/bali-zero.routes.ts` - 15 deep imports
2. Test files in `src/handlers/**/__tests__/` - Many `../../../` imports
3. Other route files

## Automated Migration Tool (Future)

```bash
# Example command (when implemented)
npm run migrate:imports

# Or manual with find/replace:
# Find: from '../../../utils/
# Replace: from '@utils/

# Find: from '../../../../tests/
# Replace: from '@tests/
```

## Notes

- Keep `.js` extensions in imports (ES modules requirement)
- Path aliases work in both development and production
- No build changes needed - handled by TypeScript/tsx
- Compatible with Jest testing

## References

- TypeScript Handbook: [Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- tsconfig.json: `compilerOptions.paths`

---

**Next Steps**: Begin migrating imports in modified files as part of regular development workflow.

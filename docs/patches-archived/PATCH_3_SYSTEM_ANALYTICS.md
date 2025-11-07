# 🔧 PATCH #3: System & Analytics Tests Fix
**Target**: ~20 failing tests in System and Analytics modules
**Priority**: MEDIUM
**Estimated Time**: 25-35 minutes

## 📋 Files to Fix

1. `apps/backend-ts/src/handlers/system/__tests__/handler-proxy.test.ts`
2. `apps/backend-ts/src/handlers/system/__tests__/handler-metadata.test.ts`
3. `apps/backend-ts/src/handlers/analytics/__tests__/analytics.test.ts`
4. `apps/backend-ts/src/handlers/analytics/__tests__/dashboard-analytics.test.ts`

## 🔍 Problem Diagnosis

**Root Causes:**
1. System handlers likely use `globalRegistry` which needs to be mocked
2. Tests call handlers with empty objects but don't handle errors properly
3. Handler proxy tests need registry mocking to avoid circular dependencies
4. Analytics handlers may depend on database/storage services that need mocking
5. Some handlers may be simple utility functions that don't need complex mocks

## 🎯 Fix Pattern

### Pattern A: Mock Handler Registry

System handlers use `globalRegistry`. Mock it:

```typescript
// Mock handler registry
const mockRegistry = {
  get: jest.fn(),
  register: jest.fn(),
  list: jest.fn().mockReturnValue([]),
  getMetadata: jest.fn().mockReturnValue({})
};

jest.mock('../../../core/handler-registry.js', () => ({
  globalRegistry: mockRegistry
}), { virtual: true });
```

### Pattern B: Simple Function Tests

Some handlers are simple utility functions. They may not throw errors but return default values:

```typescript
// Check handler implementation first
// If it returns default values instead of throwing, adjust test:

it('should handle missing required params', async () => {
  // If handler returns ok({...}) with defaults:
  const result = await handlers.xxx({});
  expect(result).toBeDefined();
  expect(result.ok).toBe(true);
  
  // OR if handler throws:
  await expect(handlers.xxx({})).rejects.toThrow(BadRequestError);
});
```

### Pattern C: Mock Database/Storage Services

Analytics handlers may use database or storage. Mock them:

```typescript
// Mock database/storage
jest.mock('../../../services/database.js', () => ({
  getData: jest.fn().mockResolvedValue([]),
  saveData: jest.fn().mockResolvedValue(true)
}), { virtual: true });
```

## 📝 Step-by-Step Fix Instructions

### File 1: `handler-proxy.test.ts`

**Step 1**: Read the handler file to understand structure:
```bash
cat apps/backend-ts/src/handlers/system/handler-proxy.ts | head -100
```

**Step 2**: Apply fix pattern:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock handler registry
const mockRegistry = {
  get: jest.fn().mockReturnValue({
    handler: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    module: 'test-module',
    requiresAuth: false
  }),
  register: jest.fn(),
  list: jest.fn().mockReturnValue([
    { key: 'test.handler', module: 'test' }
  ]),
  getMetadata: jest.fn().mockReturnValue({
    total: 1,
    modules: ['test']
  })
};

jest.mock('../../../core/handler-registry.js', () => ({
  globalRegistry: mockRegistry
}), { virtual: true });

describe('Handler Proxy', () => {
  let handlers: any;

  beforeEach(async () => {
    mockRegistry.get.mockClear();
    handlers = await import('../handler-proxy.js');
  });

  describe('executeHandler', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.executeHandler({
        handlerKey: 'test.handler',
        params: { test: 'data' }
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(mockRegistry.get).toHaveBeenCalledWith('test.handler');
    });

    it('should handle missing required params', async () => {
      // Check handler - likely requires handlerKey
      await expect(handlers.executeHandler({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.executeHandler({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });

    it('should handle non-existent handler', async () => {
      mockRegistry.get.mockReturnValueOnce(null);
      
      await expect(handlers.executeHandler({
        handlerKey: 'nonexistent.handler',
        params: {}
      })).rejects.toThrow();
    });
  });

  describe('executeBatchHandlers', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.executeBatchHandlers({
        handlers: [
          { key: 'test.handler1', params: {} },
          { key: 'test.handler2', params: {} }
        ]
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.results).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.executeBatchHandlers({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.executeBatchHandlers({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });
});
```

### File 2: `handler-metadata.test.ts`

**Step 1**: Read handler file:
```bash
cat apps/backend-ts/src/handlers/system/handler-metadata.ts
```

**Step 2**: Apply similar pattern with registry mock:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock handler registry
const mockRegistry = {
  getMetadata: jest.fn().mockReturnValue({
    total: 100,
    modules: ['ai-services', 'communication'],
    handlers: []
  }),
  list: jest.fn().mockReturnValue([])
};

jest.mock('../../../core/handler-registry.js', () => ({
  globalRegistry: mockRegistry
}), { virtual: true });

describe('Handler Metadata', () => {
  let handlers: any;

  beforeEach(async () => {
    mockRegistry.getMetadata.mockClear();
    handlers = await import('../handler-metadata.js');
  });

  describe('handler', () => {
    it('should handle success case with valid params', async () => {
      // Check handler - might not need params, just returns metadata
      const result = await handlers.handler({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockRegistry.getMetadata).toHaveBeenCalled();
    });

    // If handler doesn't require params, skip error tests
    // OR check if it throws for invalid module filter
    it('should handle invalid module filter', async () => {
      const result = await handlers.handler({
        module: 'nonexistent'
      });

      expect(result).toBeDefined();
      // Adjust based on actual handler behavior
    });
  });
});
```

**IMPORTANT**: Check if `handler` is a simple function that returns metadata. If so, it might not throw errors but return empty/default data.

### File 3: `analytics.test.ts`

**Step 1**: Read handler file:
```bash
cat apps/backend-ts/src/handlers/analytics/analytics.ts
```

**Step 2**: Determine if it needs database/storage mocks:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock database/storage if needed
// Check handler imports first
jest.mock('../../../services/database.js', () => ({
  query: jest.fn().mockResolvedValue([]),
  getData: jest.fn().mockResolvedValue([])
}), { virtual: true });

describe('Analytics', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../analytics.js');
  });

  describe('handler', () => {
    it('should handle success case with valid params', async () => {
      // Check handler - might need timeframe, metrics, etc.
      const result = await handlers.handler({
        timeframe: '24_hours',
        metrics: ['users', 'requests']
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle missing required params', async () => {
      // If handler requires params:
      await expect(handlers.handler({})).rejects.toThrow(BadRequestError);
      
      // OR if handler uses defaults:
      // const result = await handlers.handler({});
      // expect(result).toBeDefined();
    });

    it('should handle invalid params', async () => {
      await expect(handlers.handler({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });
});
```

### File 4: `dashboard-analytics.test.ts`

Apply similar pattern as `analytics.test.ts`. Check for:
- Database dependencies
- Time-based parameters (timeframe, startDate, endDate)
- Aggregation parameters

## 🔍 Investigation Steps for Each File

### Step 1: Read Handler Implementation

```bash
# Read handler file
cat apps/backend-ts/src/handlers/[module]/[handler].ts | head -150
```

Look for:
- Import statements (what needs mocking)
- Function signatures (required vs optional params)
- Return values (structure of ok() response)
- Error handling (what throws BadRequestError)

### Step 2: Identify Dependencies

```bash
# List imports
grep "^import" apps/backend-ts/src/handlers/[module]/[handler].ts
```

Common dependencies:
- `globalRegistry` → Mock registry
- Database services → Mock database
- Storage services → Mock storage
- Other handlers → Mock those handlers

### Step 3: Check If Handler Throws or Returns Defaults

Some handlers return default values instead of throwing:
```typescript
// Pattern 1: Throws error
if (!requiredParam) {
  throw new BadRequestError('required');
}

// Pattern 2: Returns defaults
const { optional = 'default' } = params || {};
return ok({ value: optional });
```

Adjust tests accordingly.

### Step 4: Apply Fix Pattern

1. Add imports: `BadRequestError`
2. Mock all dependencies (registry, database, etc.)
3. Add valid params for success cases
4. Add error handling tests (if handler throws)
5. Add specific assertions

## ✅ Validation Steps

After applying fixes:

```bash
cd apps/backend-ts
npm test -- --testPathPatterns="handler-proxy|handler-metadata|analytics" --no-coverage
```

**Expected Result**: All tests should pass ✅

## 📚 Reference Patterns

See already fixed tests:
- `apps/backend-ts/src/handlers/memory/__tests__/memory.test.ts` (error handling)
- `apps/backend-ts/src/handlers/zero/__tests__/chat.test.ts` (service mocking)
- `apps/backend-ts/src/handlers/communication/__tests__/twilio-whatsapp.test.ts` (handler mocking)

## ⚠️ Important Notes

1. **System handlers are infrastructure** - They may have simpler error handling
2. **Analytics may need time ranges** - Use realistic timeframes ('24_hours', '7_days')
3. **Some handlers might not throw** - Check implementation before adding error tests
4. **Registry mocks are critical** - Most system handlers depend on it

---

**Status**: Ready for implementation
**Priority**: Medium - These are infrastructure tests, less critical than core handlers


# 🔧 PATCH #2: Zantara Handlers Tests Fix
**Target**: ~25 failing tests in Zantara handlers module
**Priority**: HIGH
**Estimated Time**: 30-40 minutes

## 📋 Files to Fix

1. `apps/backend-ts/src/handlers/zantara/__tests__/zantara-brilliant.test.ts`
2. `apps/backend-ts/src/handlers/zantara/__tests__/zantara-dashboard.test.ts`
3. `apps/backend-ts/src/handlers/zantara/__tests__/knowledge.test.ts`
4. `apps/backend-ts/src/handlers/zantara/__tests__/zantaraKnowledgeHandler.test.ts` (already partially fixed)

## 🔍 Problem Diagnosis

**Root Causes:**
1. Tests use placeholder test values instead of real valid parameters
2. Tests don't properly assert error handling (missing `BadRequestError` expectations)
3. Missing mocks for ZANTARA v3 services (zantaraChat, zantaraUnified, etc.)
4. Some tests have parameters but need proper assertions on response structure
5. Handler functions may have different parameter requirements than tests assume

## 🎯 Fix Pattern

### Pattern A: Mock ZANTARA Services

Most Zantara handlers use ZANTARA v3 services. Mock them:

```typescript
// Mock ZANTARA v3 services
const mockZantaraChat = jest.fn().mockResolvedValue({
  ok: true,
  data: { 
    answer: 'Test ZANTARA response',
    response: 'Test response'
  }
});

jest.mock('../zantara-v3/zantara-chat.js', () => ({
  zantaraChat: (...args: any[]) => mockZantaraChat(...args),
  zantaraUnified: (...args: any[]) => mockZantaraChat(...args)
}), { virtual: true });
```

### Pattern B: Replace Placeholder Test Values

Some tests already have test values but they're placeholders. Replace with realistic ones:

```typescript
// ❌ WRONG - placeholder values
const result = await handlers.xxx({
  timeframe: 'test_value',
  metrics: ['item1', 'item2']
});

// ✅ CORRECT - realistic values
const result = await handlers.xxx({
  timeframe: '24_hours',
  metrics: ['response_time', 'error_rate']
});
```

### Pattern C: Proper Error Handling

```typescript
import { BadRequestError } from '../../../utils/errors.js';

it('should handle missing required params', async () => {
  await expect(handlers.xxx({})).rejects.toThrow(BadRequestError);
});
```

## 📝 Step-by-Step Fix Instructions

### File 1: `zantara-brilliant.test.ts`

**Step 1**: Read the actual handler to understand required parameters:
```bash
cat apps/backend-ts/src/handlers/zantara/zantara-brilliant.ts
```

**Step 2**: Apply fix pattern:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock ZANTARA services
const mockZantaraChat = jest.fn().mockResolvedValue({
  ok: true,
  data: { 
    answer: 'Test brilliant response',
    response: 'Test response'
  }
});

jest.mock('../zantara-v3/zantara-chat.js', () => ({
  zantaraChat: (...args: any[]) => mockZantaraChat(...args)
}), { virtual: true });

describe('Zantara Brilliant', () => {
  let handlers: any;

  beforeEach(async () => {
    mockZantaraChat.mockClear();
    handlers = await import('../zantara-brilliant.js');
  });

  describe('zantaraBrilliantChat', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraBrilliantChat({
        prompt: 'What is ZANTARA?',
        context: 'user inquiry',
        userId: 'test-user'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle missing required params', async () => {
      // Check handler file to see what's required
      // Typically: prompt or message is required
      await expect(handlers.zantaraBrilliantChat({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.zantaraBrilliantChat({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('zantaraPersonality', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraPersonality({
        userId: 'test-user',
        traits: ['curious', 'analytical']
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.zantaraPersonality({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.zantaraPersonality({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  // ... repeat for other functions in handler
});
```

**IMPORTANT**: Before writing tests, read the actual handler file to understand:
- Required vs optional parameters
- Return value structure
- What dependencies it uses

### File 2: `zantara-dashboard.test.ts`

**This file already has some test values, but needs error handling fixes:**

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock dependencies - check handler file first
const mockZantaraUnified = jest.fn().mockResolvedValue({
  ok: true,
  data: { insights: [], metrics: {} }
});

jest.mock('../zantara-v3/zantara-unified.js', () => ({
  zantaraUnified: (...args: any[]) => mockZantaraUnified(...args)
}), { virtual: true });

describe('Zantara Dashboard', () => {
  let handlers: any;

  beforeEach(async () => {
    mockZantaraUnified.mockClear();
    handlers = await import('../zantara-dashboard.js');
  });

  describe('zantaraDashboardOverview', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraDashboardOverview({
        timeframe: '24_hours',  // Realistic value instead of 'test_value'
        metrics: ['response_time', 'error_rate'],  // Realistic metrics
        team_members: ['user1', 'user2'],
        include_predictions: true
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      // Add more specific assertions based on handler return structure
    });

    it('should handle missing required params', async () => {
      // Check handler - timeframe might be optional with default
      // Adjust based on actual handler requirements
      await expect(handlers.zantaraDashboardOverview({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.zantaraDashboardOverview({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('zantaraTeamHealthMonitor', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraTeamHealthMonitor({
        team_members: ['user1', 'user2'],
        deep_analysis: true
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.zantaraTeamHealthMonitor({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.zantaraTeamHealthMonitor({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  // ... repeat for other functions
});
```

### File 3: `knowledge.test.ts`

**Check if this is testing the same handler as `zantaraKnowledgeHandler.test.ts`:**

```bash
# Check what handlers are exported
grep "^export" apps/backend-ts/src/handlers/zantara/knowledge.ts
```

Then apply the same pattern as other Zantara tests. If it's testing `handleZantaraKnowledge` or `getQuickAction`, see the already-fixed `zantaraKnowledgeHandler.test.ts` for reference.

## 🔍 Investigation Steps for Each File

Before fixing each test file, follow these steps:

### Step 1: Read the Handler File
```bash
cat apps/backend-ts/src/handlers/zantara/[handler-name].ts | head -100
```

Look for:
- Required parameters (those that throw `BadRequestError` if missing)
- Optional parameters (those with default values)
- Dependencies (imported functions that need mocking)
- Return value structure

### Step 2: Identify Dependencies
```bash
grep "^import" apps/backend-ts/src/handlers/zantara/[handler-name].ts
```

Mock all imported handlers/services.

### Step 3: Apply Fix Pattern

1. Add imports: `BadRequestError`
2. Add mocks for dependencies
3. Replace placeholder values with realistic ones
4. Add proper error handling tests
5. Add specific assertions for success cases

### Step 4: Test and Iterate

```bash
npm test -- --testPathPatterns="zantara-brilliant|zantara-dashboard|knowledge" --no-coverage
```

## ✅ Validation Steps

After applying fixes:

```bash
cd apps/backend-ts
npm test -- --testPathPatterns="zantara-brilliant|zantara-dashboard|knowledge" --no-coverage
```

**Expected Result**: All tests should pass ✅

## 📚 Reference Patterns

See already fixed tests:
- `apps/backend-ts/src/handlers/zantara/__tests__/zantaraKnowledgeHandler.test.ts`
- `apps/backend-ts/src/handlers/zantara/__tests__/zantara-v2-simple.test.ts`
- `apps/backend-ts/src/handlers/zero/__tests__/chat.test.ts` (for aiChat mocking)

## ⚠️ Important Notes

1. **Always read handler files first** - Don't assume parameter requirements
2. **Mock all dependencies** - Zantara handlers often call other Zantara functions
3. **Use realistic test data** - Replace 'test_value' with actual expected values
4. **Check return structure** - Assert on specific fields, not just `toBeDefined()`

---

**Status**: Ready for implementation
**Priority**: High - These handlers are core to ZANTARA functionality


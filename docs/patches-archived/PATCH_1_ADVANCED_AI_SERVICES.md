# 🔧 PATCH #1: Advanced AI Services Tests Fix
**Target**: ~30 failing tests in Advanced AI Services module
**Priority**: HIGH
**Estimated Time**: 30-45 minutes

## 📋 Files to Fix

1. `apps/backend-ts/src/handlers/ai-services/__tests__/advanced-ai.test.ts`
2. `apps/backend-ts/src/handlers/ai-services/__tests__/creative.test.ts`
3. `apps/backend-ts/src/handlers/ai-services/__tests__/zantara-llama.test.ts`
4. `apps/backend-ts/src/handlers/ai-services/__tests__/ai-bridge.test.ts`

## 🔍 Problem Diagnosis

**Root Causes:**
1. Tests call handlers with empty objects `{}` but handlers require specific parameters
2. Tests don't handle `BadRequestError` exceptions properly (use `await expect().rejects.toThrow()`)
3. Missing mocks for `aiChat` dependency (used by `aiAnticipate`, `aiLearn`, `xaiExplain`)
4. Missing mocks for Google Vision API service (used by `visionAnalyzeImage`, `visionExtractDocuments`)
5. Missing mocks for ZANTARA/LLAMA services

## 🎯 Fix Pattern

### Pattern A: Mock aiChat Dependency

All advanced AI functions use `aiChat` internally. Mock it at the top of the test file:

```typescript
// Mock aiChat service
const mockAiChat = jest.fn().mockResolvedValue({
  ok: true,
  data: { 
    response: 'Test AI response',
    answer: 'Test AI answer'
  }
});

jest.mock('../ai.js', () => ({
  aiChat: (...args: any[]) => mockAiChat(...args)
}), { virtual: true });
```

### Pattern B: Mock Google Vision Service

For creative.ts tests, mock the Google Vision service:

```typescript
// Mock Google Vision service
jest.mock('../../../services/google-translate-service.js', () => ({
  getTranslateService: jest.fn().mockResolvedValue({
    client: { 
      getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }) 
    },
    baseUrl: 'https://vision.googleapis.com/v1'
  })
}));

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
```

### Pattern C: Error Handling Tests

Replace this pattern:
```typescript
// ❌ WRONG
it('should handle missing required params', async () => {
  const result = await handlers.xxx({});
  expect(result).toBeDefined();
});
```

With:
```typescript
// ✅ CORRECT
import { BadRequestError } from '../../../utils/errors.js';

it('should handle missing required params', async () => {
  await expect(handlers.xxx({})).rejects.toThrow(BadRequestError);
  await expect(handlers.xxx({})).rejects.toThrow('required');
});
```

## 📝 Step-by-Step Fix Instructions

### File 1: `advanced-ai.test.ts`

**Functions to test:**
- `aiAnticipate` - requires: `context` OR `scenario`
- `aiLearn` - requires: `feedback` OR `pattern` OR `performance_data`
- `xaiExplain` - requires: `decision`

**Fix Example:**

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock aiChat
const mockAiChat = jest.fn().mockResolvedValue({
  ok: true,
  data: { 
    response: JSON.stringify({
      predictions: ['Test prediction'],
      recommendations: ['Test recommendation']
    }),
    answer: 'Test answer'
  }
});

jest.mock('../ai.js', () => ({
  aiChat: (...args: any[]) => mockAiChat(...args)
}), { virtual: true });

describe('Advanced Ai', () => {
  let handlers: any;

  beforeEach(async () => {
    mockAiChat.mockClear();
    handlers = await import('../advanced-ai.js');
  });

  describe('aiAnticipate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.aiAnticipate({
        context: 'Test context',
        scenario: 'Test scenario'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.anticipation).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.aiAnticipate({})).rejects.toThrow(BadRequestError);
      await expect(handlers.aiAnticipate({})).rejects.toThrow('context or scenario required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.aiAnticipate({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('aiLearn', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.aiLearn({
        feedback: 'Positive feedback',
        learning_type: 'incremental'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.aiLearn({})).rejects.toThrow(BadRequestError);
      await expect(handlers.aiLearn({})).rejects.toThrow('feedback, pattern, or performance_data required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.aiLearn({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('xaiExplain', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.xaiExplain({
        decision: 'Approved transaction',
        context: 'Financial processing'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.explanation).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.xaiExplain({})).rejects.toThrow(BadRequestError);
      await expect(handlers.xaiExplain({})).rejects.toThrow('decision parameter required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.xaiExplain({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });
});
```

### File 2: `creative.test.ts`

**Functions to test:**
- `visionAnalyzeImage` - requires: `imageBase64` OR `imageUrl`
- `visionExtractDocuments` - requires: `imageBase64` OR `imageUrl`

**Fix Example:**

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Vision service
jest.mock('../../../services/google-translate-service.js', () => ({
  getTranslateService: jest.fn().mockResolvedValue({
    client: { 
      getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }) 
    },
    baseUrl: 'https://vision.googleapis.com/v1'
  })
}));

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Creative', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../creative.js');
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('visionAnalyzeImage', () => {
    it('should handle success case with valid params', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          responses: [{
            textAnnotations: [{ description: 'Test text' }],
            labelAnnotations: [{ description: 'Test label' }]
          }]
        })
      } as Response);

      const result = await handlers.visionAnalyzeImage({
        imageUrl: 'https://example.com/image.jpg',
        features: ['TEXT_DETECTION']
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.analysis).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.visionAnalyzeImage({})).rejects.toThrow(BadRequestError);
      await expect(handlers.visionAnalyzeImage({})).rejects.toThrow('Either imageBase64 or imageUrl is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.visionAnalyzeImage({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('visionExtractDocuments', () => {
    it('should handle success case with valid params', async () => {
      // Mock visionAnalyzeImage internally called
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          responses: [{
            textAnnotations: [{ description: 'PASSPORT\nName: John Doe' }]
          }]
        })
      } as Response);

      const result = await handlers.visionExtractDocuments({
        imageUrl: 'https://example.com/passport.jpg',
        documentType: 'PASSPORT'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.visionExtractDocuments({})).rejects.toThrow(BadRequestError);
      await expect(handlers.visionExtractDocuments({})).rejects.toThrow('Either imageBase64 or imageUrl is required');
    });
  });
});
```

### File 3: `zantara-llama.test.ts`

**Functions to test:**
- `zantaraChat` - requires: `prompt` OR `message`

**Fix Example:**

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock zantaraChat implementation - check actual handler for dependencies
// If it uses aiChat internally, mock that
const mockZantaraChat = jest.fn().mockResolvedValue({
  ok: true,
  data: { answer: 'Test response' }
});

jest.mock('../../zantara/zantara-v3/zantara-chat.js', () => ({
  zantaraChat: (...args: any[]) => mockZantaraChat(...args)
}), { virtual: true });

describe('Zantara Llama', () => {
  let handlers: any;

  beforeEach(async () => {
    mockZantaraChat.mockClear();
    handlers = await import('../zantara-llama.js');
  });

  describe('zantaraChat', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraChat({
        prompt: 'Test prompt'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.zantaraChat({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.zantaraChat({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });
});
```

### File 4: `ai-bridge.test.ts`

**Functions to test:**
- `zantaraCallDevAI` - check handler for required params
- `zantaraOrchestrateWorkflow` - check handler for required params
- `zantaraGetConversationHistory` - check handler for required params
- `zantaraGetSharedContext` - check handler for required params
- `zantaraClearWorkflow` - check handler for required params

**IMPORTANT**: First read the actual handler file to understand required parameters:
- `apps/backend-ts/src/handlers/ai-services/ai-bridge.ts`

Then apply the same pattern:
1. Mock any dependencies
2. Add valid params for success cases
3. Use `await expect().rejects.toThrow(BadRequestError)` for error cases

## ✅ Validation Steps

After applying fixes, run:

```bash
cd apps/backend-ts
npm test -- --testPathPatterns="advanced-ai|creative|zantara-llama|ai-bridge" --no-coverage
```

**Expected Result**: All tests should pass ✅

## 📚 Reference Patterns

See already fixed tests for examples:
- `apps/backend-ts/src/handlers/ai-services/__tests__/imagine-art-handler.test.ts` (service mocking)
- `apps/backend-ts/src/handlers/zero/__tests__/chat.test.ts` (aiChat mocking)
- `apps/backend-ts/src/handlers/memory/__tests__/memory.test.ts` (error handling)

---

**Status**: Ready for implementation
**Priority**: Fix these first as they're foundational to other tests


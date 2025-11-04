import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Drive service
const mockDrive = {
  files: {
    list: jest.fn().mockResolvedValue({
      data: { files: [] },
    }),
    create: jest.fn().mockResolvedValue({
      data: { id: 'test-file-id', name: 'test.txt' },
    }),
    update: jest.fn().mockResolvedValue({
      data: {},
    }),
    get: jest.fn().mockResolvedValue({
      data: {},
    }),
  },
};

jest.unstable_mockModule('../../services/google-auth-service.js', () => ({
  getDrive: jest.fn().mockResolvedValue(mockDrive),
}));

describe('Daily Drive Recap', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../daily-drive-recap.js');
  });

  describe('updateDailyRecap', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.updateDailyRecap({
        collaboratorId: 'zero',
        activityType: 'chat',
        content: 'Test activity content',
        timestamp: new Date().toISOString(),
        metadata: { key: 'value' },
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.updateDailyRecap({})).rejects.toThrow();
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.updateDailyRecap({
          invalid: 'data',
        })
      ).rejects.toThrow();
    });
  });

  describe('getCurrentDailyRecap', () => {
    it('should handle success case', async () => {
      const result = await handlers.getCurrentDailyRecap({
        collaboratorId: 'zero',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Auth Service
const mockGetSheets = jest.fn();
const mockSheets = {
  spreadsheets: {
    values: {
      get: jest.fn().mockResolvedValue({
        data: { values: [['A1', 'B1'], ['A2', 'B2']] }
      }),
      append: jest.fn().mockResolvedValue({
        data: { updates: { updatedCells: 2 } }
      }),
      update: jest.fn().mockResolvedValue({
        data: {}
      })
    },
    create: jest.fn().mockResolvedValue({
      data: { spreadsheetId: 'test-sheet-id' }
    })
  }
};

mockGetSheets.mockResolvedValue(mockSheets);

jest.mock('../../../services/google-auth-service.js', () => ({
  getSheets: mockGetSheets
}), { virtual: true });

// Mock bridge proxy
jest.mock('../../../services/bridgeProxy.js', () => ({
  forwardToBridgeIfSupported: jest.fn().mockResolvedValue(null)
}), { virtual: true });

describe('Sheets', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetSheets.mockResolvedValue(mockSheets);
    handlers = await import('../sheets.js');
  });

  describe('sheetsRead', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.sheetsRead({
        spreadsheetId: 'test-sheet-id',
        range: 'A1:B2'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.values).toBeDefined();
      expect(result.data.range).toBe('A1:B2');
    });

    it('should handle missing required params', async () => {
      await expect(handlers.sheetsRead({})).rejects.toThrow(BadRequestError);
      await expect(handlers.sheetsRead({})).rejects.toThrow('spreadsheetId and range are required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.sheetsRead({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('sheetsAppend', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.sheetsAppend({
        spreadsheetId: 'test-sheet-id',
        range: 'A1',
        values: [['New Row', 'Data']]
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.update).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.sheetsAppend({})).rejects.toThrow(BadRequestError);
      await expect(handlers.sheetsAppend({})).rejects.toThrow('spreadsheetId, range and values are required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.sheetsAppend({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('sheetsCreate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.sheetsCreate({
        title: 'Test Sheet'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.spreadsheetId).toBeDefined();
      expect(result.data.url).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.sheetsCreate({})).rejects.toThrow(BadRequestError);
      await expect(handlers.sheetsCreate({})).rejects.toThrow('title is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.sheetsCreate({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

});

/**
 * Tests for Google Sheets Handler
 * Tests reading, writing, and creating spreadsheets
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
const mockSheetsService = {
  spreadsheets: {
    values: {
      get: jest.fn(),
      append: jest.fn(),
      update: jest.fn()
    },
    create: jest.fn()
  }
};

jest.mock('../../../services/google-auth-service.js', () => ({
  getSheets: jest.fn(() => Promise.resolve(mockSheetsService))
}));

jest.mock('../../../services/bridgeProxy.js', () => ({
  forwardToBridgeIfSupported: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../../utils/response.js', () => ({
  ok: jest.fn((data) => ({ ok: true, data }))
}));

jest.mock('../../../utils/errors.js', () => ({
  BadRequestError: class BadRequestError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'BadRequestError';
    }
  }
}));

describe('Google Sheets Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sheetsRead', () => {
    it('should read values from a spreadsheet', async () => {
      const { sheetsRead } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [
            ['Name', 'Age', 'City'],
            ['John', '30', 'New York'],
            ['Jane', '25', 'London']
          ]
        }
      });

      const params = {
        spreadsheetId: 'test-spreadsheet-id',
        range: 'Sheet1!A1:C3'
      };

      const result = await sheetsRead(params);

      expect(result.ok).toBe(true);
      expect(result.data.values).toHaveLength(3);
      expect(result.data.values[0]).toEqual(['Name', 'Age', 'City']);
      expect(result.data.range).toBe('Sheet1!A1:C3');
      expect(mockSheetsService.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: 'test-spreadsheet-id',
        range: 'Sheet1!A1:C3'
      });
    });

    it('should return empty array when no values exist', async () => {
      const { sheetsRead } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.values.get.mockResolvedValue({
        data: { values: null }
      });

      const params = {
        spreadsheetId: 'test-spreadsheet-id',
        range: 'Sheet1!A1:Z100'
      };

      const result = await sheetsRead(params);

      expect(result.ok).toBe(true);
      expect(result.data.values).toEqual([]);
    });

    it('should throw error when spreadsheetId is missing', async () => {
      const { sheetsRead } = await import('../sheets.js');
      
      const params = {
        spreadsheetId: '',
        range: 'Sheet1!A1:C3'
      };

      await expect(sheetsRead(params)).rejects.toThrow('spreadsheetId and range are required');
    });

    it('should throw error when range is missing', async () => {
      const { sheetsRead } = await import('../sheets.js');
      
      const params = {
        spreadsheetId: 'test-id',
        range: ''
      };

      await expect(sheetsRead(params)).rejects.toThrow('spreadsheetId and range are required');
    });

    it('should handle API errors gracefully', async () => {
      const { sheetsRead } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.values.get.mockRejectedValue(
        new Error('API Error: Invalid spreadsheet ID')
      );

      const params = {
        spreadsheetId: 'invalid-id',
        range: 'Sheet1!A1:C3'
      };

      await expect(sheetsRead(params)).rejects.toThrow();
    });
  });

  describe('sheetsAppend', () => {
    it('should append values to a spreadsheet', async () => {
      const { sheetsAppend } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.values.append.mockResolvedValue({
        data: {
          updates: {
            updatedRows: 2,
            updatedColumns: 3,
            updatedCells: 6
          }
        }
      });

      const params = {
        spreadsheetId: 'test-spreadsheet-id',
        range: 'Sheet1!A1',
        values: [
          ['New Name', '40', 'Paris'],
          ['Another Name', '35', 'Berlin']
        ]
      };

      const result = await sheetsAppend(params);

      expect(result.ok).toBe(true);
      expect(result.data.update).toHaveProperty('updatedRows', 2);
      expect(mockSheetsService.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: 'test-spreadsheet-id',
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values: params.values }
      });
    });

    it('should use USER_ENTERED valueInputOption when specified', async () => {
      const { sheetsAppend } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.values.append.mockResolvedValue({
        data: { updates: {} }
      });

      const params = {
        spreadsheetId: 'test-id',
        range: 'Sheet1!A1',
        values: [['=SUM(A1:A10)']],
        valueInputOption: 'USER_ENTERED' as const
      };

      await sheetsAppend(params);

      expect(mockSheetsService.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: 'test-id',
        range: 'Sheet1!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: params.values }
      });
    });

    it('should throw error when values are missing', async () => {
      const { sheetsAppend } = await import('../sheets.js');
      
      const params = {
        spreadsheetId: 'test-id',
        range: 'Sheet1!A1',
        values: null as any
      };

      await expect(sheetsAppend(params)).rejects.toThrow('spreadsheetId, range and values are required');
    });

    it('should handle empty values array', async () => {
      const { sheetsAppend } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.values.append.mockResolvedValue({
        data: { updates: null }
      });

      const params = {
        spreadsheetId: 'test-id',
        range: 'Sheet1!A1',
        values: []
      };

      const result = await sheetsAppend(params);

      expect(result.ok).toBe(true);
      expect(result.data.update).toBeNull();
    });
  });

  describe('sheetsCreate', () => {
    it('should create a new spreadsheet', async () => {
      const { sheetsCreate } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.create.mockResolvedValue({
        data: {
          spreadsheetId: 'new-spreadsheet-id',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/new-spreadsheet-id/edit'
        }
      });

      const params = {
        title: 'My New Spreadsheet'
      };

      const result = await sheetsCreate(params);

      expect(result.ok).toBe(true);
      expect(result.data.spreadsheetId).toBe('new-spreadsheet-id');
      expect(result.data.url).toContain('new-spreadsheet-id');
      expect(mockSheetsService.spreadsheets.create).toHaveBeenCalledWith({
        requestBody: {
          properties: { title: 'My New Spreadsheet' },
          sheets: [{ properties: { title: 'Sheet1' } }]
        }
      });
    });

    it('should create spreadsheet with initial data', async () => {
      const { sheetsCreate } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.create.mockResolvedValue({
        data: { spreadsheetId: 'new-id' }
      });
      
      mockSheetsService.spreadsheets.values.update.mockResolvedValue({
        data: {}
      });

      const params = {
        title: 'Spreadsheet with Data',
        data: [
          ['Header1', 'Header2', 'Header3'],
          ['Value1', 'Value2', 'Value3']
        ]
      };

      const result = await sheetsCreate(params);

      expect(result.ok).toBe(true);
      expect(mockSheetsService.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'new-id',
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values: params.data }
      });
    });

    it('should not update values when data is empty', async () => {
      const { sheetsCreate } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.create.mockResolvedValue({
        data: { spreadsheetId: 'new-id' }
      });

      const params = {
        title: 'Empty Spreadsheet',
        data: []
      };

      await sheetsCreate(params);

      expect(mockSheetsService.spreadsheets.values.update).not.toHaveBeenCalled();
    });

    it('should throw error when title is missing', async () => {
      const { sheetsCreate } = await import('../sheets.js');
      
      const params = {
        title: ''
      };

      await expect(sheetsCreate(params)).rejects.toThrow('title is required');
    });

    it('should handle creation errors', async () => {
      const { sheetsCreate } = await import('../sheets.js');
      
      mockSheetsService.spreadsheets.create.mockRejectedValue(
        new Error('Failed to create spreadsheet')
      );

      const params = {
        title: 'Test Spreadsheet'
      };

      await expect(sheetsCreate(params)).rejects.toThrow('Failed to create spreadsheet');
    });
  });
});

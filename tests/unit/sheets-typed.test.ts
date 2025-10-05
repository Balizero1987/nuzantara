import { sheetsRead } from '../../src/handlers/google-workspace/sheets.js';

jest.mock('../../src/services/google-auth-service.js', () => ({
  getSheets: async () => ({
    spreadsheets: {
      values: {
        get: jest.fn().mockResolvedValue({ data: { values: [["A1","B1"],["A2","B2"]] } })
      }
    }
  })
}));

describe('Sheets handler typed shapes', () => {
  test('sheets.read returns ApiSuccess with values and range', async () => {
    const res = await sheetsRead({ spreadsheetId: 's1', range: 'Sheet1!A1:B2' } as any);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.data.values)).toBe(true);
    expect(res.data.range).toBe('Sheet1!A1:B2');
  });
});


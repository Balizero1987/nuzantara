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

  test('sheets.append returns ApiSuccess with update info', async () => {
    jest.resetModules();
    jest.doMock('../../src/services/google-auth-service.js', () => ({
      getSheets: async () => ({
        spreadsheets: {
          values: {
            append: jest.fn().mockResolvedValue({ data: { updates: { updatedCells: 4 } } })
          }
        }
      })
    }));
    const { sheetsAppend } = await import('../../src/handlers/google-workspace/sheets.js');
    const res = await sheetsAppend({ spreadsheetId: 's1', range: 'Sheet1!A1:B2', values: [[1,2],[3,4]] } as any);
    expect(res.ok).toBe(true);
    expect(res.data.update).toHaveProperty('updatedCells', 4);
  });

  test('sheets.create returns ApiSuccess with spreadsheet URL', async () => {
    jest.resetModules();
    jest.doMock('../../src/services/google-auth-service.js', () => ({
      getSheets: async () => ({
        spreadsheets: {
          create: jest.fn().mockResolvedValue({ data: { spreadsheetId: 'sheet123' } }),
          values: { update: jest.fn().mockResolvedValue({}) }
        }
      })
    }));
    const { sheetsCreate } = await import('../../src/handlers/google-workspace/sheets.js');
    const res = await sheetsCreate({ title: 'NewSheet', data: [["A"]] } as any);
    expect(res.ok).toBe(true);
    expect(res.data.url).toContain('/spreadsheets/d/sheet123');
  });
});

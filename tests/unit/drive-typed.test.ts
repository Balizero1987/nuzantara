import { driveList, driveRead } from '../../src/handlers/google-workspace/drive.js';

jest.mock('../../src/services/google-auth-service.js', () => ({
  getDrive: async () => ({
    files: {
      list: jest.fn().mockResolvedValue({ data: { files: [{ id: 'f1', name: 'file.txt' }], nextPageToken: 'NEXT' } }),
      get: jest.fn().mockResolvedValueOnce({ data: { id: 'f1', name: 'file.txt', mimeType: 'text/plain', webViewLink: '#' } })
                              .mockResolvedValueOnce({ data: 'content' })
    }
  })
}));

describe('Drive handler typed shapes', () => {
  test('drive.list returns ApiSuccess with files', async () => {
    const res = await driveList({ q: "name contains 'file'" } as any);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.data.files)).toBe(true);
    expect(res.data).toHaveProperty('nextPageToken', 'NEXT');
  });

  test('drive.read returns ApiSuccess with file and content', async () => {
    const res = await driveRead({ fileId: 'f1' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.file).toHaveProperty('id', 'f1');
    expect(res.data.readable).toBe(true);
  });

  test('drive.read non-text returns readable=false', async () => {
    jest.resetModules();
    jest.doMock('../../src/services/google-auth-service.js', () => ({
      getDrive: async () => ({
        files: {
          get: jest.fn().mockResolvedValue({ data: { id: 'f2', name: 'file.pdf', mimeType: 'application/pdf', webViewLink: '#' } })
        }
      })
    }));

    const { driveRead } = await import('../../src/handlers/google-workspace/drive.js');
    const res = await driveRead({ fileId: 'f2' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.readable).toBe(false);
    expect(res.data.content).toBeNull();
  });
});

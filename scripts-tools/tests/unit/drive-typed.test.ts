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

  test('drive.upload supports base64 and utf8', async () => {
    jest.resetModules();
    const createMock = jest.fn().mockResolvedValue({ data: { id: 'id1', name: 'file.txt' } });
    jest.doMock('../../src/services/google-auth-service.js', () => ({
      getDrive: async () => ({ files: { create: createMock } })
    }));

    const { driveUpload } = await import('../../src/handlers/google-workspace/drive.js');
    // Base64
    const base64 = Buffer.from('hello').toString('base64');
    let res = await driveUpload({ media: { body: base64, mimeType: 'text/plain' }, requestBody: { name: 'b64.txt' } } as any);
    expect(res.ok).toBe(true);
    expect(createMock).toHaveBeenCalled();
    // UTF8
    res = await driveUpload({ media: { body: 'hello', mimeType: 'text/plain' }, requestBody: { name: 'utf8.txt' } } as any);
    expect(res.ok).toBe(true);
  });

  test('drive.upload falls back to Bridge when Drive unavailable', async () => {
    jest.resetModules();
    jest.doMock('../../src/services/google-auth-service.js', () => ({ getDrive: async () => null }));
    jest.doMock('../../src/services/bridgeProxy.js', () => ({ forwardToBridgeIfSupported: async () => ({ ok: true, data: { bridged: true } }) }));
    const { driveUpload } = await import('../../src/handlers/google-workspace/drive.js');
    const res = await driveUpload({ media: { body: 'x', mimeType: 'text/plain' }, requestBody: { name: 'n' } } as any);
    expect(res.ok).toBe(true);
    expect(res.data).toHaveProperty('bridged', true);
  });
});

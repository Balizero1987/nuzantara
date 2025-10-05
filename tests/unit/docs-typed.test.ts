import { docsCreate, docsRead, docsUpdate } from '../../src/handlers/google-workspace/docs.js';

jest.mock('../../src/services/google-auth-service.js', () => ({
  getDocs: async () => ({
    documents: {
      create: jest.fn().mockResolvedValue({ data: { documentId: 'doc1', title: 'Untitled' } }),
      get: jest.fn().mockResolvedValue({ data: { documentId: 'doc1', title: 'T', revisionId: 'r1', body: { content: [{ paragraph: { elements: [{ textRun: { content: 'Hello' } }] } }] } } }),
      batchUpdate: jest.fn().mockResolvedValue({ data: { replies: [], writeControl: {} } })
    }
  })
}));

describe('Docs handler typed shapes', () => {
  test('docs.create returns ApiSuccess with created doc info', async () => {
    const res = await docsCreate({ title: 'Spec', content: 'Hello' } as any);
    expect(res.ok).toBe(true);
    expect(res.data).toHaveProperty('documentId');
    expect(res.data).toHaveProperty('url');
  });

  test('docs.read returns ApiSuccess with content length', async () => {
    const res = await docsRead({ documentId: 'doc1' } as any);
    expect(res.ok).toBe(true);
    expect(typeof res.data.contentLength).toBe('number');
  });

  test('docs.update returns ApiSuccess with replies', async () => {
    const res = await docsUpdate({ documentId: 'doc1', requests: [] } as any);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.data.replies)).toBe(true);
  });
});


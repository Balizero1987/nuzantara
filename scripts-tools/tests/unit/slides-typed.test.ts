import { slidesCreate, slidesRead, slidesUpdate } from '../../src/handlers/google-workspace/slides.js';

jest.mock('../../src/services/google-auth-service.js', () => ({
  getSlides: async () => ({
    presentations: {
      create: jest.fn().mockResolvedValue({ data: { presentationId: 'p1', title: 'T', slides: [{}, {}], revisionId: 'r1' } }),
      get: jest.fn().mockResolvedValue({ data: { presentationId: 'p1', title: 'T', slides: [{ objectId: 's1', pageElements: [] }] } }),
      batchUpdate: jest.fn().mockResolvedValue({ data: { replies: [], writeControl: {} } })
    }
  })
}));

describe('Slides handler typed shapes', () => {
  test('slides.create returns ApiSuccess with typed fields', async () => {
    const res = await slidesCreate({ title: 'Deck' } as any);
    expect(res.ok).toBe(true);
    expect(res.data).toMatchObject({ presentationId: 'p1', url: expect.stringContaining('/presentation/d/') });
  });

  test('slides.read returns ApiSuccess with presentation and slides', async () => {
    const res = await slidesRead({ presentationId: 'p1' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.presentation).toHaveProperty('presentationId');
    expect(Array.isArray(res.data.slides)).toBe(true);
  });

  test('slides.update returns ApiSuccess with replies/writeControl', async () => {
    const res = await slidesUpdate({ presentationId: 'p1', requests: [] } as any);
    expect(res.ok).toBe(true);
    expect(res.data).toHaveProperty('presentationId', 'p1');
    expect(Array.isArray(res.data.replies)).toBe(true);
  });
});

import { gmailHandlers } from '../../src/handlers/google-workspace/gmail.js';

jest.mock('../../src/services/google-auth-service.js', () => ({
  getGmail: async () => ({
    users: {
      messages: {
        send: jest.fn().mockResolvedValue({ data: { id: 'msg123', threadId: 'thr1' } }),
        list: jest.fn().mockResolvedValue({ data: { messages: [{ id: 'm1' }, { id: 'm2' }], nextPageToken: 'NXT' } }),
        get: jest.fn().mockResolvedValue({
          data: {
            id: 'm1', threadId: 'thr1', snippet: 'hello',
            payload: { headers: [{ name: 'Subject', value: 'Hi' }, { name: 'From', value: 'a@b' }, { name: 'Date', value: 'now' }], parts: [] },
            labelIds: ['INBOX']
          }
        })
      }
    }
  })
}));

describe('Gmail handler typed shapes', () => {
  test('gmail.send returns ApiSuccess with typed fields', async () => {
    const res = await gmailHandlers['gmail.send']({ to: 'x@y', subject: 'S', body: 'B' } as any);
    expect(res.ok).toBe(true);
    expect(res.data).toMatchObject({ to: 'x@y', subject: 'S' });
    expect(typeof res.data.sentAt).toBe('string');
  });

  test('gmail.list returns ApiSuccess with messages array', async () => {
    const res = await gmailHandlers['gmail.list']({ maxResults: 5 } as any);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.data.messages)).toBe(true);
    expect(typeof res.data.total).toBe('number');
  });

  test('gmail.read returns ApiSuccess with message object', async () => {
    // Ensure get() mock returns a detailed payload
    const { gmailHandlers } = await import('../../src/handlers/google-workspace/gmail.js');
    const res = await gmailHandlers['gmail.read']({ messageId: 'm1' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.message).toHaveProperty('id');
    expect(typeof res.data.message.body).toBe('string');
  });

  test('gmail.read handles nested HTML multipart bodies', async () => {
    jest.resetModules();
    jest.doMock('../../src/services/google-auth-service.js', () => ({
      getGmail: async () => ({
        users: {
          messages: {
            get: jest.fn().mockResolvedValue({
              data: {
                id: 'm2', threadId: 'thr2',
                payload: {
                  parts: [
                    {
                      mimeType: 'multipart/alternative',
                      parts: [
                        { mimeType: 'text/html', body: { data: Buffer.from('<b>HTML body</b>').toString('base64') } }
                      ]
                    }
                  ]
                },
                labelIds: ['INBOX']
              }
            })
          }
        }
      })
    }));
    const { gmailHandlers } = await import('../../src/handlers/google-workspace/gmail.js');
    const res = await gmailHandlers['gmail.read']({ messageId: 'm2' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.message.body).toContain('HTML body');
  });
});

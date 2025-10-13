import { instagramWebhookReceiver } from '../../src/handlers/communication/instagram.js';

// Mocks
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { username: 'vip_user', follower_count: 2500, is_verified: true } }),
    post: jest.fn().mockResolvedValue({ data: { id: 'msg_1' } })
  }
}));

jest.mock('../../src/handlers/ai-services/ai.js', () => ({
  aiChat: jest.fn().mockResolvedValue({ data: { response: 'Mocked AI reply ✅' } })
}));

jest.mock('../../src/handlers/memory/memory-firestore.js', () => ({
  memorySave: jest.fn().mockResolvedValue({ ok: true }),
  memorySearch: jest.fn().mockResolvedValue({ ok: true, data: { memories: [{ content: 'Prev: Krisna helps with KITAS' }], count: 1 } })
}));

describe('Instagram webhook (almost e2e with mocks)', () => {
  it('processes DM and sends response via Instagram API', async () => {
    const req: any = {
      body: {
        object: 'instagram',
        entry: [
          {
            id: 'page_123',
            messaging: [
              {
                sender: { id: 'user_1' },
                recipient: { id: 'ig_account_1' },
                message: { text: 'Quanto costa KITAS?' }
              }
            ],
            changes: []
          }
        ]
      }
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    await instagramWebhookReceiver(req, res);

    // Immediate ACK
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');

    // Outgoing message to IG API
    const axios = (await import('axios')).default as any;
    expect(axios.post).toHaveBeenCalled();
    const [url, payload] = (axios.post as jest.Mock).mock.calls[0];
    expect(String(url)).toContain('/me/messages');
    expect(payload).toHaveProperty('recipient.id', 'user_1');
    expect(payload).toHaveProperty('message.text');
  });
});


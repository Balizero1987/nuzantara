import { whatsappWebhookReceiver } from '../../src/handlers/communication/whatsapp.js';

// Mocks
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn().mockResolvedValue({ data: { id: 'wamid.MOCK' } })
  }
}));

jest.mock('../../src/handlers/ai-services/ai.js', () => ({
  aiChat: jest.fn().mockResolvedValue({ data: { response: 'Mocked WhatsApp reply ✅' } })
}));

jest.mock('../../src/handlers/memory/memory-firestore.js', () => ({
  memorySave: jest.fn().mockResolvedValue({ ok: true }),
  memorySearch: jest.fn().mockResolvedValue({ ok: true, data: { memories: [{ content: 'Prev: PT PMA setup' }], count: 1 } })
}));

describe('WhatsApp webhook (almost e2e with mocks)', () => {
  it('ACKs webhook and sends outbound message', async () => {
    const req: any = {
      body: {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { phone_number_id: '1234567890' },
                  contacts: [{ profile: { name: 'Amanda' }, wa_id: '628123456789' }],
                  messages: [
                    {
                      from: '628123456789',
                      id: 'wamid.MOCK',
                      timestamp: '1690000000',
                      text: { body: 'kbli untuk restoran?' },
                      type: 'text'
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    await whatsappWebhookReceiver(req, res);

    // Immediate ACK
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');

    // Outbound API call to WhatsApp
    const axios = (await import('axios')).default as any;
    expect(axios.post).toHaveBeenCalled();
    const [url, payload] = (axios.post as jest.Mock).mock.calls[0];
    expect(String(url)).toContain('/messages');
    expect(payload).toMatchObject({ messaging_product: 'whatsapp', to: '628123456789' });
  });
});


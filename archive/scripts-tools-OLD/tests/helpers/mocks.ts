/**
 * Mock implementations for external services
 * Used across all test files
 */

import { jest } from '@jest/globals';

// Mock Firestore
export const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({
    exists: true,
    data: () => ({
      profile_facts: ['Test fact 1', 'Test fact 2'],
      summary: 'Test user summary',
      counters: { interactions: 5 },
      updated_at: new Date(),
    }),
  }),
  set: jest.fn().mockResolvedValue(undefined),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
};

// Mock OpenAI
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is a test AI response from OpenAI.',
            },
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      }),
    },
  },
};

// Mock Anthropic (Claude)
export const mockAnthropic = {
  messages: {
    create: jest.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'This is a test AI response from Claude.',
        },
      ],
      usage: {
        input_tokens: 50,
        output_tokens: 20,
      },
      model: 'claude-3-haiku-20240307',
    }),
  },
};

// Mock Gemini
export const mockGemini = {
  getGenerativeModel: jest.fn().mockReturnValue({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => 'This is a test AI response from Gemini.',
      },
    }),
  }),
};

// Mock Cohere
export const mockCohere = {
  chat: jest.fn().mockResolvedValue({
    text: 'This is a test AI response from Cohere.',
  }),
};

// Mock Google APIs
export const mockGoogleApis = {
  drive: {
    files: {
      list: jest.fn().mockResolvedValue({
        data: {
          files: [
            {
              id: 'file-123',
              name: 'test-file.txt',
              mimeType: 'text/plain',
            },
          ],
        },
      }),
      create: jest.fn().mockResolvedValue({
        data: {
          id: 'file-456',
          name: 'uploaded-file.txt',
        },
      }),
      get: jest.fn().mockResolvedValue({
        data: {
          id: 'file-123',
          name: 'test-file.txt',
          content: 'File content',
        },
      }),
    },
  },
  calendar: {
    events: {
      list: jest.fn().mockResolvedValue({
        data: {
          items: [
            {
              id: 'event-123',
              summary: 'Test Meeting',
              start: { dateTime: '2025-02-01T10:00:00Z' },
              end: { dateTime: '2025-02-01T11:00:00Z' },
            },
          ],
        },
      }),
      insert: jest.fn().mockResolvedValue({
        data: {
          id: 'event-456',
          summary: 'New Event',
          htmlLink: 'https://calendar.google.com/event/456',
        },
      }),
    },
  },
  gmail: {
    users: {
      messages: {
        send: jest.fn().mockResolvedValue({
          data: {
            id: 'msg-123',
            labelIds: ['SENT'],
          },
        }),
        list: jest.fn().mockResolvedValue({
          data: {
            messages: [
              { id: 'msg-123', threadId: 'thread-123' },
            ],
          },
        }),
      },
    },
  },
};

// Mock Twilio
export const mockTwilio = {
  messages: {
    create: jest.fn().mockResolvedValue({
      sid: 'SM123456789',
      status: 'sent',
      to: 'whatsapp:+6281234567890',
      from: 'whatsapp:+15555551234',
      body: 'Test message',
    }),
  },
};

// Mock Axios (for RAG backend)
export const mockAxios = {
  get: jest.fn().mockResolvedValue({
    status: 200,
    data: { success: true, status: 'healthy' },
  }),
  post: jest.fn().mockResolvedValue({
    status: 200,
    data: {
      success: true,
      answer: 'Test RAG answer',
      sources: [
        { content: 'Source 1', score: 0.95 },
        { content: 'Source 2', score: 0.87 },
      ],
    },
  }),
};

// Mock WebSocket
export const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  readyState: 1, // OPEN
};

// Mock Express Request
export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  headers: { 'x-api-key': process.env.API_KEY },
  params: {},
  query: {},
  get: jest.fn((key: string) => overrides.headers?.[key]),
  ip: '127.0.0.1',
  ctx: { role: 'member', apiKey: process.env.API_KEY },
  ...overrides,
});

// Mock Express Response
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.write = jest.fn().mockReturnValue(res);
  res.flushHeaders = jest.fn();
  return res;
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockFirestore.collection.mockClear();
  mockOpenAI.chat.completions.create.mockClear();
  mockAnthropic.messages.create.mockClear();
  mockTwilio.messages.create.mockClear();
  mockAxios.get.mockClear();
  mockAxios.post.mockClear();
};

// Export all mocks
export const mocks = {
  firestore: mockFirestore,
  openai: mockOpenAI,
  anthropic: mockAnthropic,
  gemini: mockGemini,
  cohere: mockCohere,
  google: mockGoogleApis,
  twilio: mockTwilio,
  axios: mockAxios,
  websocket: mockWebSocket,
  createMockRequest,
  createMockResponse,
  resetAllMocks,
};

export default mocks;

// Test setup file
import { jest } from '@jest/globals';

// Mock Firebase Admin for tests
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
  cert: jest.fn()
}));

const mockCollaborator = {
  collaboratorId: 'zero',
  email: 'zero@balizero.com',
  ambaradam_name: 'Zero Master',
  role: 'ceo',
  language: 'it',
  timezone: 'Asia/Makassar'
};

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => {
      const docs = [
        { data: () => ({ ...mockCollaborator }) },
        { data: () => ({ collaboratorId: 'ops', email: 'ops@balizero.com', role: 'ops' }) }
      ];

      return {
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(async () => ({
              empty: false,
              docs: [{ data: () => ({ ...mockCollaborator }) }]
            }))
          }))
        })),
        limit: jest.fn(() => ({
          get: jest.fn(async () => ({ docs }))
        })),
        doc: jest.fn(() => ({
          get: jest.fn(async () => ({
            exists: true,
            data: () => ({ ...mockCollaborator })
          })),
          set: jest.fn(async () => undefined)
        }))
      };
    })
  }))
}));

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(async () => ({
          choices: [{ message: { content: 'Mock OpenAI response' } }],
          usage: { total_tokens: 42 }
        }))
      }
    }
  }))
}));

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(async () => ({
        content: [{ type: 'text', text: 'Mock Claude response' }]
      }))
    }
  }))
}));

jest.mock('@google/generative-ai', () => ({
  __esModule: true,
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: jest.fn(async () => ({
        response: {
          text: async () => 'Mock Gemini response'
        }
      }))
    })
  }))
}));

jest.mock('cohere-ai', () => ({
  __esModule: true,
  CohereClient: jest.fn().mockImplementation(() => ({
    chat: jest.fn(async () => ({ text: 'Mock Cohere response' }))
  }))
}));

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.API_KEYS_INTERNAL = 'zantara-internal-dev-key-2025';
process.env.API_KEYS_EXTERNAL = 'zantara-external-dev-key-2025';
process.env.OPENAI_API_KEY = 'sk-test';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.COHERE_API_KEY = 'test-cohere-key';

// Increase timeout for integration tests
jest.setTimeout(30000);

console.log('🧪 Test environment initialized for ZANTARA v5.2.0');

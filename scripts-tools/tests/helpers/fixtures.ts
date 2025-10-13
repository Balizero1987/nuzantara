/**
 * Test fixtures for NUZANTARA project
 * Provides realistic test data for all handlers
 */

// Bali Zero Pricing Fixtures
export const pricingFixtures = {
  visaC1: {
    service_type: 'visa',
    specific_service: 'C1 Tourism',
  },
  kitasWorking: {
    service_type: 'kitas',
    specific_service: 'Working KITAS',
  },
  ptPmaSetup: {
    service_type: 'business',
    specific_service: 'PT PMA',
  },
  npwpPersonal: {
    service_type: 'tax',
    specific_service: 'NPWP Personal',
  },
  allServices: {
    service_type: 'all',
    include_details: true,
  },
};

// Oracle Simulation Fixtures
export const oracleFixtures = {
  visaSimulation: {
    service: 'visa',
    scenario: 'B211A extension',
    urgency: 'normal' as const,
    complexity: 'low' as const,
    region: 'Bali',
  },
  companySetup: {
    service: 'company',
    scenario: 'PT PMA setup for F&B',
    urgency: 'high' as const,
    complexity: 'high' as const,
    budget: 50000000,
  },
  taxCompliance: {
    service: 'tax',
    scenario: 'Monthly reporting setup',
    urgency: 'normal' as const,
    complexity: 'medium' as const,
  },
};

// KBLI Fixtures
export const kbliFixtures = {
  restaurantLookup: {
    query: 'restaurant',
  },
  codeDirectLookup: {
    code: '56101',
  },
  categoryLookup: {
    category: 'restaurants',
  },
  hotelRequirements: {
    businessType: 'hotel',
  },
};

// Team Fixtures
export const teamFixtures = {
  getAllMembers: {},
  getSetupTeam: {
    department: 'setup',
  },
  getTaxTeam: {
    department: 'tax',
  },
  searchAmanda: {
    search: 'Amanda',
  },
  getMemberById: {
    id: 'zainal',
  },
  getMemberByEmail: {
    email: 'amanda@balizero.com',
  },
  getDepartmentInfo: {
    name: 'setup',
  },
};

// Memory Fixtures
export const memoryFixtures = {
  saveUserPreference: {
    userId: 'user-123',
    content: 'Prefers Italian language for communication',
    type: 'preference',
    metadata: {
      source: 'chat',
      confidence: 'high',
    },
  },
  saveServiceInterest: {
    userId: 'client-456',
    key: 'visa_type',
    value: 'B211A Tourist Visa',
    type: 'service_interest',
  },
  searchMemories: {
    query: 'visa',
    userId: 'client-456',
    limit: 10,
  },
  retrieveMemory: {
    userId: 'user-123',
  },
  retrieveByKey: {
    userId: 'client-456',
    key: 'visa_type',
  },
};

// AI Chat Fixtures
export const aiChatFixtures = {
  simpleQuery: {
    prompt: 'What is Bali Zero?',
    max_tokens: 500,
    temperature: 0.7,
  },
  technicalQuery: {
    prompt: 'Explain PT PMA company structure in simple terms',
    max_tokens: 1000,
    temperature: 0.3,
  },
  multilingualQuery: {
    prompt: 'Come posso ottenere un visto per Bali?',
    max_tokens: 800,
  },
  // This should be blocked and redirected to pricing
  pricingQuery: {
    prompt: 'Berapa harga KITAS untuk working visa?',
    max_tokens: 500,
  },
};

// RAG Fixtures
export const ragFixtures = {
  visaQuery: {
    query: 'What are the requirements for PT PMA company setup?',
    k: 3,
    use_llm: true,
  },
  fastSearch: {
    query: 'KITAS requirements',
    k: 5,
    use_llm: false,
  },
  conversationQuery: {
    query: 'What about the timeline for this process?',
    k: 3,
    use_llm: true,
    conversation_history: [
      { role: 'user', content: 'Tell me about PT PMA setup' },
      { role: 'assistant', content: 'PT PMA is a foreign investment company...' },
    ],
  },
  baliZeroChat: {
    query: 'What documents do I need for B211A visa extension?',
    user_role: 'member',
    conversation_history: [],
  },
};

// WhatsApp Fixtures
export const whatsappFixtures = {
  incomingMessage: {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: '6281234567890',
                  id: 'wamid.test123',
                  timestamp: '1640000000',
                  type: 'text',
                  text: { body: 'Hello, I need visa information' },
                },
              ],
              metadata: {
                display_phone_number: '15555551234',
                phone_number_id: '123456789',
              },
            },
          },
        ],
      },
    ],
  },
  webhookVerification: {
    'hub.mode': 'subscribe',
    'hub.verify_token': 'test-verify-token',
    'hub.challenge': 'challenge-string-123',
  },
  manualMessage: {
    to: '6281234567890',
    message: 'Your visa application is being processed',
  },
};

// Google Workspace Fixtures
export const googleWorkspaceFixtures = {
  driveUpload: {
    fileName: 'test-document.txt',
    content: 'Test file content',
    mimeType: 'text/plain',
    folderId: 'root',
  },
  driveList: {
    folderId: 'root',
    maxResults: 10,
  },
  driveSearch: {
    query: 'visa application',
  },
  calendarCreate: {
    summary: 'Client Meeting - Visa Consultation',
    description: 'Initial consultation for B211A visa',
    startTime: '2025-02-01T10:00:00Z',
    endTime: '2025-02-01T11:00:00Z',
    timeZone: 'Asia/Makassar',
  },
  calendarList: {
    timeMin: new Date().toISOString(),
    maxResults: 20,
    singleEvents: true,
  },
  gmailSend: {
    to: 'client@example.com',
    subject: 'Visa Application Update',
    body: 'Your application is being processed',
  },
};

// Identity Fixtures
export const identityFixtures = {
  resolveExisting: {
    email: 'john@example.com',
  },
  createNewUser: {
    email: 'maria@newclient.com',
    metadata: {
      name: 'Maria Rossi',
      company: 'Rossi Trading LLC',
      phone: '+62812345678',
      service_interest: 'PT PMA Setup',
    },
  },
  withIdentityHint: {
    identity_hint: 'client@business.com',
  },
};

// WebSocket Fixtures
export const websocketFixtures = {
  broadcastSystem: {
    channel: 'system',
    data: {
      type: 'announcement',
      message: 'Server maintenance in 10 minutes',
      priority: 'high',
    },
  },
  broadcastTeam: {
    channel: 'team-updates',
    data: {
      event: 'new-lead',
      lead_id: 'lead_123',
    },
  },
  sendToUser: {
    userId: 'user-123',
    data: {
      type: 'notification',
      message: 'Your visa is ready',
    },
  },
};

// Error Test Fixtures
export const errorFixtures = {
  missingParam: {},
  invalidEmail: {
    email: 'not-an-email',
  },
  invalidServiceType: {
    service_type: 'invalid-service',
  },
  unauthorizedApiKey: {
    headers: {
      'x-api-key': 'invalid-key',
    },
  },
};

// Export all fixtures
export const fixtures = {
  pricing: pricingFixtures,
  oracle: oracleFixtures,
  kbli: kbliFixtures,
  team: teamFixtures,
  memory: memoryFixtures,
  aiChat: aiChatFixtures,
  rag: ragFixtures,
  whatsapp: whatsappFixtures,
  googleWorkspace: googleWorkspaceFixtures,
  identity: identityFixtures,
  websocket: websocketFixtures,
  errors: errorFixtures,
};

export default fixtures;

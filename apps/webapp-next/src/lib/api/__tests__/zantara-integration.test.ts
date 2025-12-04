/**
 * Complete test coverage for zantara-integration.ts
 * Target: 100% coverage
 */

import { zantaraAPI, type ZantaraSession, type ZantaraContext, type ChatMessage } from '../zantara-integration';
import { client } from '../client';
import { authAPI } from '../auth';

// Mock dependencies
jest.mock('../client');
jest.mock('../auth');

const mockClient = client as jest.Mocked<typeof client>;
const mockClientAny = mockClient as any; // Helper to avoid read-only property errors
const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>;

describe('zantara-integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Default auth mock
    mockAuthAPI.getUser = jest.fn().mockReturnValue({ email: 'test@example.com' });
  });

  describe('Session Management', () => {
    describe('initSession', () => {
      it('should create new session with user email', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        (globalThis.localStorage.setItem as jest.Mock).mockImplementation(() => {});
        
        Object.defineProperty(mockClientAny, 'crmClients', {
          value: {
            getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });
        
        Object.defineProperty(mockClientAny, 'agenticFunctions', {
          value: {
            getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });

        const session = await zantaraAPI.initSession();

        expect(session.sessionId).toMatch(/^zantara_/);
        expect(session.userEmail).toBe('test@example.com');
        expect(session.startedAt).toBeDefined();
        expect(session.lastActivity).toBeDefined();
        expect(session.messageCount).toBe(0);
      });

      it('should restore existing session from localStorage', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue('existing_session_id');
        
        Object.defineProperty(mockClientAny, 'crmClients', {
          value: {
            getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });
        
        Object.defineProperty(mockClientAny, 'agenticFunctions', {
          value: {
            getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });

        const session = await zantaraAPI.initSession();

        expect(session.sessionId).toBe('existing_session_id');
      });

      it('should load CRM context when available', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue({
            id: 123,
            full_name: 'Test Client',
            status: 'active',
          }),
          getClientSummaryApiCrmClientsClientIdSummaryGet: jest.fn().mockResolvedValue({
            practices: [{ id: 1, practice_type: 'visa', status: 'active' }],
            recent_interactions: [{ type: 'chat', summary: 'Test', created_at: '2024-01-01' }],
          }),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
        } as any;

        const session = await zantaraAPI.initSession();

        expect(session.crmClientId).toBe(123);
        expect(session.crmClientName).toBe('Test Client');
      });

      it('should handle CRM context errors gracefully', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockRejectedValue(new Error('Not found')),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
        } as any;

        const session = await zantaraAPI.initSession();

        expect(session.crmClientId).toBeUndefined();
      });

      it('should load active journeys when available', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue(null),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue({
            agents_available: ['journey1'],
            active_journeys: [{ journeyId: 'j1', type: 'visa', progress: 50 }],
            pending_alerts: 2,
          }),
        } as any;

        const session = await zantaraAPI.initSession();

        expect(session.activeJourneys).toEqual([{ journeyId: 'j1', type: 'visa', progress: 50 }]);
      });

      it('should handle agents status errors gracefully', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue(null),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        } as any;

        const session = await zantaraAPI.initSession();

        expect(session.activeJourneys).toBeUndefined();
      });

      it('should handle anonymous user', async () => {
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        Object.defineProperty(mockClientAny, 'crmClients', {
          value: {
            getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });
        
        Object.defineProperty(mockClientAny, 'agenticFunctions', {
          value: {
            getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });

        const session = await zantaraAPI.initSession();

        expect(session.userEmail).toBe('anonymous');
      });

      it('should work without localStorage (server-side)', async () => {
        // Remove localStorage
        delete (globalThis as any).localStorage;
        
        Object.defineProperty(mockClientAny, 'crmClients', {
          value: {
            getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });
        
        Object.defineProperty(mockClientAny, 'agenticFunctions', {
          value: {
            getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
          },
          writable: true,
          configurable: true,
        });

        const session = await zantaraAPI.initSession();

        expect(session.sessionId).toMatch(/^zantara_/);
      });
    });

    describe('clearSession', () => {
      it('should clear session from localStorage', () => {
        const removeItem = jest.fn();
        (globalThis.localStorage.removeItem as jest.Mock) = removeItem;

        zantaraAPI.clearSession();

        expect(removeItem).toHaveBeenCalledWith('zantara_session_id');
        expect(removeItem).toHaveBeenCalledWith('zantara_conversation');
      });

      it('should handle missing localStorage', () => {
        delete (globalThis as any).localStorage;

        expect(() => zantaraAPI.clearSession()).not.toThrow();
      });
    });
  });

  describe('Conversations Service', () => {
    describe('saveConversation', () => {
      it('should save conversation successfully', async () => {
        const messages: ChatMessage[] = [
          { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
          { role: 'assistant', content: 'Hi!', timestamp: '2024-01-01T00:00:01Z' },
        ];

        mockClientAny.conversations = {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockResolvedValue({
            conversation_id: 123,
            messages_saved: 2,
            crm: { processed: true, clientId: 456 },
          }),
        } as any;

        const result = await zantaraAPI.saveConversation(messages, { source: 'test' });

        expect(result.success).toBe(true);
        expect(result.conversationId).toBe(123);
        expect(result.messagesSaved).toBe(2);
        expect(result.crm?.clientId).toBe(456);
      });

      it('should return false when no user email', async () => {
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);

        const result = await zantaraAPI.saveConversation([]);

        expect(result.success).toBe(false);
      });

      it('should handle save errors gracefully', async () => {
        mockClientAny.conversations = {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const result = await zantaraAPI.saveConversation([]);

        expect(result.success).toBe(false);
      });

      it('should include metadata in request', async () => {
        const messages: ChatMessage[] = [
          { role: 'user', content: 'Test', metadata: { test: true } },
        ];

        mockClientAny.conversations = {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockResolvedValue({
            conversation_id: 1,
            messages_saved: 1,
            crm: { processed: false },
          }),
        } as any;

        await zantaraAPI.saveConversation(messages, { custom: 'metadata' });

        expect(mockClient.conversations.saveConversationApiBaliZeroConversationsSavePost).toHaveBeenCalledWith({
          requestBody: expect.objectContaining({
            metadata: expect.objectContaining({
              source: 'webapp',
              version: 'v8.2',
              custom: 'metadata',
            }),
          }),
        });
      });
    });

    describe('loadConversationHistory', () => {
      it('should load conversation history successfully', async () => {
        mockClientAny.conversations = {
          getConversationHistoryApiBaliZeroConversationsHistoryGet: jest.fn().mockResolvedValue({
            messages: [
              { role: 'user', content: 'Hello', timestamp: '2024-01-01', metadata: {} },
              { role: 'assistant', content: 'Hi!', timestamp: '2024-01-01', metadata: {} },
            ],
          }),
        } as any;

        const history = await zantaraAPI.loadConversationHistory(50, 'session123');

        expect(history).toHaveLength(2);
        expect(history[0].role).toBe('user');
        expect(history[0].content).toBe('Hello');
      });

      it('should return empty array when no user email', async () => {
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);

        const history = await zantaraAPI.loadConversationHistory();

        expect(history).toEqual([]);
      });

      it('should handle load errors gracefully', async () => {
        mockClientAny.conversations = {
          getConversationHistoryApiBaliZeroConversationsHistoryGet: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const history = await zantaraAPI.loadConversationHistory();

        expect(history).toEqual([]);
      });

      it('should handle empty messages response', async () => {
        mockClientAny.conversations = {
          getConversationHistoryApiBaliZeroConversationsHistoryGet: jest.fn().mockResolvedValue({}),
        } as any;

        const history = await zantaraAPI.loadConversationHistory();

        expect(history).toEqual([]);
      });
    });

    describe('clearConversationHistory', () => {
      it('should clear conversation history successfully', async () => {
        mockClientAny.conversations = {
          clearConversationHistoryApiBaliZeroConversationsClearDelete: jest.fn().mockResolvedValue({}),
        } as any;

        const result = await zantaraAPI.clearConversationHistory('session123');

        expect(result).toBe(true);
      });

      it('should return false when no user email', async () => {
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);

        const result = await zantaraAPI.clearConversationHistory();

        expect(result).toBe(false);
      });

      it('should handle clear errors gracefully', async () => {
        mockClientAny.conversations = {
          clearConversationHistoryApiBaliZeroConversationsClearDelete: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const result = await zantaraAPI.clearConversationHistory();

        expect(result).toBe(false);
      });
    });

    describe('getConversationStats', () => {
      it('should get conversation stats successfully', async () => {
        mockClientAny.conversations = {
          getConversationStatsApiBaliZeroConversationsStatsGet: jest.fn().mockResolvedValue({
            total_messages: 100,
            total_conversations: 10,
          }),
        } as any;

        const stats = await zantaraAPI.getConversationStats();

        expect(stats).toEqual({
          total_messages: 100,
          total_conversations: 10,
        });
      });

      it('should return null when no user email', async () => {
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);

        const stats = await zantaraAPI.getConversationStats();

        expect(stats).toBeNull();
      });

      it('should handle stats errors gracefully', async () => {
        mockClientAny.conversations = {
          getConversationStatsApiBaliZeroConversationsStatsGet: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const stats = await zantaraAPI.getConversationStats();

        expect(stats).toBeNull();
      });
    });
  });

  describe('Memory Service', () => {
    describe('searchMemories', () => {
      it('should search memories successfully', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({
            results: [
              { document: 'Memory 1', score: 0.9, metadata: { type: 'preference' } },
              { document: 'Memory 2', score: 0.8, metadata: { type: 'fact' } },
            ],
          }),
        } as any;

        const memories = await zantaraAPI.searchMemories('test query', 'user@example.com', 5);

        expect(memories).toHaveLength(2);
        expect(memories[0].content).toBe('Memory 1');
        expect(memories[0].relevance).toBe(0.9);
        expect(memories[0].type).toBe('preference');
      });

      it('should return empty array when no embedding', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({}),
        } as any;

        const memories = await zantaraAPI.searchMemories('test');

        expect(memories).toEqual([]);
      });

      it('should handle search errors gracefully', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const memories = await zantaraAPI.searchMemories('test');

        expect(memories).toEqual([]);
      });

      it('should handle empty results', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({}),
        } as any;

        const memories = await zantaraAPI.searchMemories('test');

        expect(memories).toEqual([]);
      });

      it('should use default type when metadata type is missing', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({
            results: [
              { document: 'Memory 1', score: 0.9, metadata: {} },
            ],
          }),
        } as any;

        const memories = await zantaraAPI.searchMemories('test');

        expect(memories[0].type).toBe('general');
      });
    });

    describe('storeMemory', () => {
      it('should store memory successfully', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          storeMemoryVectorApiMemoryStorePost: jest.fn().mockResolvedValue({}),
        } as any;

        const result = await zantaraAPI.storeMemory('Test memory', 'preference', ['entity1', 'entity2']);

        expect(result).toBe(true);
        expect(mockClient.memory.storeMemoryVectorApiMemoryStorePost).toHaveBeenCalledWith({
          requestBody: expect.objectContaining({
            document: 'Test memory',
            embedding: [0.1, 0.2, 0.3],
            metadata: expect.objectContaining({
              userId: 'test@example.com',
              type: 'preference',
              entities: 'entity1,entity2',
            }),
          }),
        });
      });

      it('should return false when no user email', async () => {
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);

        const result = await zantaraAPI.storeMemory('Test');

        expect(result).toBe(false);
      });

      it('should return false when no embedding', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({}),
        } as any;

        const result = await zantaraAPI.storeMemory('Test');

        expect(result).toBe(false);
      });

      it('should handle store errors gracefully', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          storeMemoryVectorApiMemoryStorePost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const result = await zantaraAPI.storeMemory('Test');

        expect(result).toBe(false);
      });

      it('should use default type and empty entities', async () => {
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          storeMemoryVectorApiMemoryStorePost: jest.fn().mockResolvedValue({}),
        } as any;

        await zantaraAPI.storeMemory('Test');

        expect(mockClient.memory.storeMemoryVectorApiMemoryStorePost).toHaveBeenCalledWith({
          requestBody: expect.objectContaining({
            metadata: expect.objectContaining({
              type: 'conversation',
              entities: '',
            }),
          }),
        });
      });
    });

    describe('getMemoryStats', () => {
      it('should get memory stats successfully', async () => {
        mockClientAny.memory = {
          getMemoryStatsApiMemoryStatsGet: jest.fn().mockResolvedValue({
            total_memories: 100,
            total_users: 10,
          }),
        } as any;

        const stats = await zantaraAPI.getMemoryStats();

        expect(stats).toEqual({
          total_memories: 100,
          total_users: 10,
        });
      });

      it('should handle stats errors gracefully', async () => {
        mockClientAny.memory = {
          getMemoryStatsApiMemoryStatsGet: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const stats = await zantaraAPI.getMemoryStats();

        expect(stats).toBeNull();
      });
    });
  });

  describe('CRM Services', () => {
    describe('getCRMContext', () => {
      it('should get CRM context successfully', async () => {
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue({
            id: 123,
            full_name: 'Test Client',
            status: 'active',
          }),
          getClientSummaryApiCrmClientsClientIdSummaryGet: jest.fn().mockResolvedValue({
            practices: [
              { id: 1, practice_type: 'visa', status: 'active' },
              { id: 2, practice_type: 'company', status: 'pending' },
            ],
            recent_interactions: [
              { type: 'chat', summary: 'Test interaction', created_at: '2024-01-01T00:00:00Z' },
            ],
          }),
        } as any;

        const context = await zantaraAPI.getCRMContext('test@example.com');

        expect(context).toEqual({
          clientId: 123,
          clientName: 'Test Client',
          status: 'active',
          practices: [
            { id: 1, type: 'visa', status: 'active' },
            { id: 2, type: 'company', status: 'pending' },
          ],
          recentInteractions: [
            { type: 'chat', summary: 'Test interaction', date: '2024-01-01T00:00:00Z' },
          ],
        });
      });

      it('should return null when client not found', async () => {
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue(null),
        } as any;

        const context = await zantaraAPI.getCRMContext('test@example.com');

        expect(context).toBeNull();
      });

      it('should return null when client has no id', async () => {
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue({}),
        } as any;

        const context = await zantaraAPI.getCRMContext('test@example.com');

        expect(context).toBeNull();
      });

      it('should handle errors gracefully (client not found is expected)', async () => {
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockRejectedValue(new Error('Not found')),
        } as any;

        const context = await zantaraAPI.getCRMContext('test@example.com');

        expect(context).toBeNull();
      });

      it('should use email as clientName when full_name is missing', async () => {
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue({
            id: 123,
            status: 'active',
          }),
          getClientSummaryApiCrmClientsClientIdSummaryGet: jest.fn().mockResolvedValue({}),
        } as any;

        const context = await zantaraAPI.getCRMContext('test@example.com');

        expect(context?.clientName).toBe('test@example.com');
      });

      it('should use default status when missing', async () => {
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue({
            id: 123,
            full_name: 'Test Client',
          }),
          getClientSummaryApiCrmClientsClientIdSummaryGet: jest.fn().mockResolvedValue({}),
        } as any;

        const context = await zantaraAPI.getCRMContext('test@example.com');

        expect(context?.status).toBe('active');
      });
    });

    describe('logCRMInteraction', () => {
      it('should log CRM interaction successfully', async () => {
        mockClientAny.crmInteractions = {
          createInteractionApiCrmInteractionsPost: jest.fn().mockResolvedValue({}),
        } as any;

        const result = await zantaraAPI.logCRMInteraction(123, 'Test summary', 'chat');

        expect(result).toBe(true);
        expect(mockClient.crmInteractions.createInteractionApiCrmInteractionsPost).toHaveBeenCalledWith({
          requestBody: {
            client_id: 123,
            interaction_type: 'chat',
            summary: 'Test summary (Notes: Automated log from ZANTARA chat session)',
            team_member: 'test@example.com',
          },
        });
      });

      it('should return false when no user email', async () => {
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);

        const result = await zantaraAPI.logCRMInteraction(123, 'Test');

        expect(result).toBe(false);
      });

      it('should handle log errors gracefully', async () => {
        mockClientAny.crmInteractions = {
          createInteractionApiCrmInteractionsPost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const result = await zantaraAPI.logCRMInteraction(123, 'Test');

        expect(result).toBe(false);
      });

      it('should use default interaction type', async () => {
        mockClientAny.crmInteractions = {
          createInteractionApiCrmInteractionsPost: jest.fn().mockResolvedValue({}),
        } as any;

        await zantaraAPI.logCRMInteraction(123, 'Test');

        expect(mockClient.crmInteractions.createInteractionApiCrmInteractionsPost).toHaveBeenCalledWith({
          requestBody: expect.objectContaining({
            interaction_type: 'chat',
          }),
        });
      });
    });

    describe('getCRMStats', () => {
      it('should get CRM stats successfully', async () => {
        mockClientAny.crmClients = {
          getClientsStatsApiCrmClientsStatsOverviewGet: jest.fn().mockResolvedValue({
            total_clients: 100,
            active_clients: 80,
          }),
        } as any;

        const stats = await zantaraAPI.getCRMStats();

        expect(stats).toEqual({
          total_clients: 100,
          active_clients: 80,
        });
      });

      it('should handle stats errors gracefully', async () => {
        mockClientAny.crmClients = {
          getClientsStatsApiCrmClientsStatsOverviewGet: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const stats = await zantaraAPI.getCRMStats();

        expect(stats).toBeNull();
      });
    });
  });

  describe('Agentic Functions', () => {
    describe('getAgentsStatus', () => {
      it('should get agents status successfully', async () => {
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue({
            agents_available: ['journey1', 'journey2'],
            active_journeys: [
              { journeyId: 'j1', type: 'visa', progress: 50 },
              { journeyId: 'j2', type: 'company', progress: 75 },
            ],
            pending_alerts: 5,
          }),
        } as any;

        const status = await zantaraAPI.getAgentsStatus();

        expect(status).toEqual({
          available: ['journey1', 'journey2'],
          activeJourneys: [
            { journeyId: 'j1', type: 'visa', progress: 50 },
            { journeyId: 'j2', type: 'company', progress: 75 },
          ],
          pendingAlerts: 5,
        });
      });

      it('should handle missing fields', async () => {
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue({}),
        } as any;

        const status = await zantaraAPI.getAgentsStatus();

        expect(status).toEqual({
          available: [],
          activeJourneys: [],
          pendingAlerts: 0,
        });
      });

      it('should handle status errors gracefully', async () => {
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const status = await zantaraAPI.getAgentsStatus();

        expect(status).toBeNull();
      });
    });

    describe('createJourney', () => {
      it('should create journey successfully', async () => {
        mockClientAny.agenticFunctions = {
          createClientJourneyApiAgentsJourneyCreatePost: jest.fn().mockResolvedValue({
            journey_id: 'j123',
            steps: [
              { id: 's1', name: 'Step 1' },
              { id: 's2', name: 'Step 2' },
            ],
          }),
        } as any;

        const journey = await zantaraAPI.createJourney('client123', 'visa_application');

        expect(journey).toEqual({
          journeyId: 'j123',
          steps: [
            { id: 's1', name: 'Step 1' },
            { id: 's2', name: 'Step 2' },
          ],
        });
      });

      it('should handle missing steps', async () => {
        mockClientAny.agenticFunctions = {
          createClientJourneyApiAgentsJourneyCreatePost: jest.fn().mockResolvedValue({
            journey_id: 'j123',
          }),
        } as any;

        const journey = await zantaraAPI.createJourney('client123', 'visa_application');

        expect(journey?.steps).toEqual([]);
      });

      it('should handle journey errors gracefully', async () => {
        mockClientAny.agenticFunctions = {
          createClientJourneyApiAgentsJourneyCreatePost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const journey = await zantaraAPI.createJourney('client123', 'visa_application');

        expect(journey).toBeNull();
      });
    });

    describe('getComplianceAlerts', () => {
      it('should get compliance alerts successfully', async () => {
        mockClientAny.agenticFunctions = {
          getComplianceAlertsApiAgentsComplianceAlertsGet: jest.fn().mockResolvedValue({
            alerts: [
              { type: 'tax', severity: 'high', due_date: '2024-12-31', description: 'Tax filing due' },
              { type: 'visa', severity: 'medium', due_date: '2024-12-15', description: 'Visa renewal' },
            ],
          }),
        } as any;

        const alerts = await zantaraAPI.getComplianceAlerts('client123', 'high');

        expect(alerts).toHaveLength(2);
        expect(alerts[0].type).toBe('tax');
        expect(alerts[0].severity).toBe('high');
      });

      it('should handle empty alerts', async () => {
        mockClientAny.agenticFunctions = {
          getComplianceAlertsApiAgentsComplianceAlertsGet: jest.fn().mockResolvedValue({}),
        } as any;

        const alerts = await zantaraAPI.getComplianceAlerts();

        expect(alerts).toEqual([]);
      });

      it('should handle alert errors gracefully', async () => {
        mockClientAny.agenticFunctions = {
          getComplianceAlertsApiAgentsComplianceAlertsGet: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const alerts = await zantaraAPI.getComplianceAlerts();

        expect(alerts).toEqual([]);
      });

      it('should pass null for optional parameters', async () => {
        mockClientAny.agenticFunctions = {
          getComplianceAlertsApiAgentsComplianceAlertsGet: jest.fn().mockResolvedValue({ alerts: [] }),
        } as any;

        await zantaraAPI.getComplianceAlerts();

        expect(mockClient.agenticFunctions.getComplianceAlertsApiAgentsComplianceAlertsGet).toHaveBeenCalledWith({
          clientId: null,
          severity: null,
        });
      });
    });

    describe('calculatePricing', () => {
      it('should calculate pricing successfully', async () => {
        mockClientAny.agenticFunctions = {
          calculateDynamicPricingApiAgentsPricingCalculatePost: jest.fn().mockResolvedValue({
            base_price: 1000,
            final_price: 1200,
            breakdown: { base: 1000, tax: 200 },
          }),
        } as any;

        const pricing = await zantaraAPI.calculatePricing('visa', 'standard', 'normal');

        expect(pricing).toEqual({
          basePrice: 1000,
          finalPrice: 1200,
          breakdown: { base: 1000, tax: 200 },
        });
      });

      it('should handle missing breakdown', async () => {
        mockClientAny.agenticFunctions = {
          calculateDynamicPricingApiAgentsPricingCalculatePost: jest.fn().mockResolvedValue({
            base_price: 1000,
            final_price: 1200,
          }),
        } as any;

        const pricing = await zantaraAPI.calculatePricing('visa');

        expect(pricing?.breakdown).toEqual({});
      });

      it('should handle pricing errors gracefully', async () => {
        mockClientAny.agenticFunctions = {
          calculateDynamicPricingApiAgentsPricingCalculatePost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const pricing = await zantaraAPI.calculatePricing('visa');

        expect(pricing).toBeNull();
      });

      it('should use default complexity and urgency', async () => {
        mockClientAny.agenticFunctions = {
          calculateDynamicPricingApiAgentsPricingCalculatePost: jest.fn().mockResolvedValue({
            base_price: 1000,
            final_price: 1200,
            breakdown: {},
          }),
        } as any;

        await zantaraAPI.calculatePricing('visa');

        expect(mockClient.agenticFunctions.calculateDynamicPricingApiAgentsPricingCalculatePost).toHaveBeenCalledWith({
          serviceType: 'visa',
          complexity: 'standard',
          urgency: 'normal',
        });
      });
    });

    describe('crossOracleSearch', () => {
      it('should perform cross-oracle search successfully', async () => {
        mockClientAny.agenticFunctions = {
          crossOracleSynthesisApiAgentsSynthesisCrossOraclePost: jest.fn().mockResolvedValue({
            synthesized_answer: 'Combined answer',
            sources: [
              { domain: 'tax', content: 'Tax info', relevance: 0.9 },
              { domain: 'legal', content: 'Legal info', relevance: 0.8 },
            ],
          }),
        } as any;

        const result = await zantaraAPI.crossOracleSearch('test query', ['tax', 'legal']);

        expect(result).toEqual({
          synthesizedAnswer: 'Combined answer',
          sources: [
            { domain: 'tax', content: 'Tax info', relevance: 0.9 },
            { domain: 'legal', content: 'Legal info', relevance: 0.8 },
          ],
        });
      });

      it('should handle missing synthesized answer', async () => {
        mockClientAny.agenticFunctions = {
          crossOracleSynthesisApiAgentsSynthesisCrossOraclePost: jest.fn().mockResolvedValue({
            sources: [],
          }),
        } as any;

        const result = await zantaraAPI.crossOracleSearch('test');

        expect(result?.synthesizedAnswer).toBe('');
      });

      it('should handle missing sources', async () => {
        mockClientAny.agenticFunctions = {
          crossOracleSynthesisApiAgentsSynthesisCrossOraclePost: jest.fn().mockResolvedValue({
            synthesized_answer: 'Answer',
          }),
        } as any;

        const result = await zantaraAPI.crossOracleSearch('test');

        expect(result?.sources).toEqual([]);
      });

      it('should handle search errors gracefully', async () => {
        mockClientAny.agenticFunctions = {
          crossOracleSynthesisApiAgentsSynthesisCrossOraclePost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        const result = await zantaraAPI.crossOracleSearch('test');

        expect(result).toBeNull();
      });

      it('should use default domains', async () => {
        mockClientAny.agenticFunctions = {
          crossOracleSynthesisApiAgentsSynthesisCrossOraclePost: jest.fn().mockResolvedValue({
            synthesized_answer: 'Answer',
            sources: [],
          }),
        } as any;

        await zantaraAPI.crossOracleSearch('test');

        expect(mockClient.agenticFunctions.crossOracleSynthesisApiAgentsSynthesisCrossOraclePost).toHaveBeenCalledWith({
          query: 'test',
          domains: ['tax', 'legal', 'visa', 'property'],
        });
      });
    });
  });

  describe('Context Builder', () => {
    describe('buildContext', () => {
      it('should build complete context with all services', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue({
            id: 123,
            full_name: 'Test Client',
            status: 'active',
          }),
          getClientSummaryApiCrmClientsClientIdSummaryGet: jest.fn().mockResolvedValue({
            practices: [],
            recent_interactions: [],
          }),
        } as any;
        
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({
            results: [
              { document: 'Memory 1', score: 0.9, metadata: { type: 'preference' } },
            ],
          }),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue({
            agents_available: ['journey1'],
            active_journeys: [{ journeyId: 'j1', type: 'visa', progress: 50 }],
            pending_alerts: 2,
          }),
        } as any;

        const context = await zantaraAPI.buildContext('test message');

        expect(context.session).toBeDefined();
        expect(context.recentMemories).toHaveLength(1);
        expect(context.crmContext).toBeDefined();
        expect(context.agentsStatus).toBeDefined();
        expect(context.agentsStatus?.activeJourneys).toBe(1);
      });

      it('should build context without memories when empty', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockResolvedValue({
            id: 123,
            full_name: 'Test Client',
            status: 'active',
          }),
          getClientSummaryApiCrmClientsClientIdSummaryGet: jest.fn().mockResolvedValue({}),
        } as any;
        
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({
            results: [],
          }),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
        } as any;

        const context = await zantaraAPI.buildContext('test message');

        expect(context.recentMemories).toBeUndefined();
      });

      it('should build context without CRM for anonymous users', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        mockAuthAPI.getUser = jest.fn().mockReturnValue(null);
        
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({
            results: [],
          }),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
        } as any;

        const context = await zantaraAPI.buildContext('test message');

        expect(context.crmContext).toBeUndefined();
        expect(context.session.userEmail).toBe('anonymous');
      });

      it('should handle memory search errors gracefully', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
        } as any;

        const context = await zantaraAPI.buildContext('test message');

        expect(context.recentMemories).toBeUndefined();
      });

      it('should handle CRM context errors gracefully', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.crmClients = {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest.fn().mockRejectedValue(new Error('Not found')),
        } as any;
        
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({
            results: [],
          }),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockResolvedValue(null),
        } as any;

        const context = await zantaraAPI.buildContext('test message');

        expect(context.crmContext).toBeUndefined();
      });

      it('should handle agents status errors gracefully', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockResolvedValue({
            results: [],
          }),
        } as any;
        
        mockClientAny.agenticFunctions = {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        } as any;

        const context = await zantaraAPI.buildContext('test message');

        expect(context.agentsStatus).toBeUndefined();
      });
    });

    describe('postProcessTurn', () => {
      it('should save conversation and store memory for long messages', async () => {
        const userMessage = 'What is a visa?';
        const assistantMessage = 'A'.repeat(300); // Long message
        const allMessages: ChatMessage[] = [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantMessage },
        ];

        mockClientAny.conversations = {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockResolvedValue({
            conversation_id: 123,
            messages_saved: 2,
            crm: { processed: false },
          }),
        } as any;

        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          storeMemoryVectorApiMemoryStorePost: jest.fn().mockResolvedValue({}),
        } as any;

        await zantaraAPI.postProcessTurn(userMessage, assistantMessage, allMessages);

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockClient.conversations.saveConversationApiBaliZeroConversationsSavePost).toHaveBeenCalled();
        expect(mockClient.memory.storeMemoryVectorApiMemoryStorePost).toHaveBeenCalled();
      });

      it('should not store memory for short messages', async () => {
        const userMessage = 'Hi';
        const assistantMessage = 'Hello!'; // Short message
        const allMessages: ChatMessage[] = [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantMessage },
        ];

        mockClientAny.conversations = {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockResolvedValue({
            conversation_id: 123,
            messages_saved: 2,
            crm: { processed: false },
          }),
        } as any;

        await zantaraAPI.postProcessTurn(userMessage, assistantMessage, allMessages);

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockClient.conversations.saveConversationApiBaliZeroConversationsSavePost).toHaveBeenCalled();
        expect(mockClient.memory?.storeMemoryVectorApiMemoryStorePost).not.toHaveBeenCalled();
      });

      it('should handle save conversation errors gracefully', async () => {
        const userMessage = 'Test';
        const assistantMessage = 'A'.repeat(300);
        const allMessages: ChatMessage[] = [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantMessage },
        ];

        mockClientAny.conversations = {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
          }),
          storeMemoryVectorApiMemoryStorePost: jest.fn().mockResolvedValue({}),
        } as any;

        // Should not throw
        await expect(
          zantaraAPI.postProcessTurn(userMessage, assistantMessage, allMessages)
        ).resolves.not.toThrow();

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      it('should handle store memory errors gracefully', async () => {
        const userMessage = 'Test';
        const assistantMessage = 'A'.repeat(300);
        const allMessages: ChatMessage[] = [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantMessage },
        ];

        mockClientAny.conversations = {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockResolvedValue({
            conversation_id: 123,
            messages_saved: 2,
            crm: { processed: false },
          }),
        } as any;

        mockClientAny.memory = {
          generateEmbeddingApiMemoryEmbedPost: jest.fn().mockRejectedValue(new Error('Network error')),
        } as any;

        // Should not throw
        await expect(
          zantaraAPI.postProcessTurn(userMessage, assistantMessage, allMessages)
        ).resolves.not.toThrow();

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    });
  });
});



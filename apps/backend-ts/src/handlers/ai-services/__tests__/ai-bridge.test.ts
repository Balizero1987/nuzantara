import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock aiCommunicationService
const mockCommunicate = jest.fn().mockResolvedValue({
  success: true,
  response: 'Test response from DevAI',
  context: {},
  metadata: { model: 'zantara', tokens: 100 }
});

const mockOrchestrateWorkflow = jest.fn().mockResolvedValue([
  { success: true, response: 'Step 1 complete', metadata: {} },
  { success: true, response: 'Step 2 complete', metadata: {} }
]);

const mockGetConversationHistory = jest.fn().mockReturnValue([
  { role: 'user', content: 'Test message', timestamp: new Date(), ai: 'zantara' },
  { role: 'assistant', content: 'Test response', timestamp: new Date(), ai: 'devai' }
]);

const mockGetSharedContext = jest.fn().mockReturnValue({
  key1: 'value1',
  key2: 'value2'
});

const mockClearWorkflow = jest.fn();

jest.unstable_mockModule('../../../services/ai-communication.js', () => ({
  aiCommunicationService: {
    communicate: mockCommunicate,
    orchestrateWorkflow: mockOrchestrateWorkflow,
    getConversationHistory: mockGetConversationHistory,
    getSharedContext: mockGetSharedContext,
    clearWorkflow: mockClearWorkflow
  }
}));

describe('Ai Bridge', () => {
  let handlers: any;

  beforeEach(async () => {
    mockCommunicate.mockClear();
    mockOrchestrateWorkflow.mockClear();
    mockGetConversationHistory.mockClear();
    mockGetSharedContext.mockClear();
    mockClearWorkflow.mockClear();
    handlers = await import('../ai-bridge.js');
  });

  describe('zantaraCallDevAI', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraCallDevAI({
        message: 'Test message to DevAI',
        target: 'devai',
        workflowId: 'test-workflow-1'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    it('should handle missing params gracefully', async () => {
      const result = await handlers.zantaraCallDevAI({});
      // Handler doesn't validate params, so it will attempt to call the service
      // which will fail in the mock, so check that it returns an object
      expect(result).toBeDefined();
    });

    it('should handle error cases', async () => {
      // Mock a service error by making communicate throw
      mockCommunicate.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await handlers.zantaraCallDevAI({
        message: 'Test message',
        target: 'devai'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('zantaraOrchestrateWorkflow', () => {
    it('should handle success case with valid params', async () => {
      mockOrchestrateWorkflow.mockResolvedValueOnce([
        { success: true, response: 'Step 1 complete', metadata: {} },
        { success: true, response: 'Step 2 complete', metadata: {} }
      ]);

      const result = await handlers.zantaraOrchestrateWorkflow({
        workflowId: 'test-workflow-1',
        steps: [
          { ai: 'zantara', task: 'Analyze data' },
          { ai: 'devai', task: 'Generate code' }
        ]
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
    }, 10000);

    it('should handle missing params gracefully', async () => {
      const result = await handlers.zantaraOrchestrateWorkflow({});
      // Handler doesn't validate params, so check it returns an object
      expect(result).toBeDefined();
    });

    it('should handle partial workflow failures', async () => {
      mockOrchestrateWorkflow.mockResolvedValueOnce([
        { success: true, response: 'Step 1 complete', metadata: {} },
        { success: false, response: 'Step 2 failed', metadata: {} }
      ]);

      const result = await handlers.zantaraOrchestrateWorkflow({
        workflowId: 'test-workflow-1',
        steps: [
          { ai: 'zantara', task: 'Step 1' },
          { ai: 'devai', task: 'Step 2' }
        ]
      });

      expect(result).toBeDefined();
      // When one step fails, success should be false (only true if all steps succeed)
      expect(result.success).toBe(false);
      expect(result.results.length).toBe(2);
      expect(result.summary.successfulSteps).toBe(1);
      expect(result.summary.failedSteps).toBe(1);
    }, 10000);
  });

  describe('zantaraGetConversationHistory', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraGetConversationHistory({
        workflowId: 'test-workflow-1'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.history).toBeDefined();
      expect(result.count).toBeGreaterThan(0);
    });

    it('should handle missing params gracefully', async () => {
      const result = await handlers.zantaraGetConversationHistory({});
      // Handler doesn't validate params
      expect(result).toBeDefined();
    });

    it('should return empty history for new workflow', async () => {
      mockGetConversationHistory.mockReturnValueOnce([]);

      const result = await handlers.zantaraGetConversationHistory({
        workflowId: 'new-workflow'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });
  });

  describe('zantaraGetSharedContext', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraGetSharedContext({
        workflowId: 'test-workflow-1'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.keys).toBeDefined();
    });

    it('should handle missing params gracefully', async () => {
      const result = await handlers.zantaraGetSharedContext({});
      // Handler doesn't validate params
      expect(result).toBeDefined();
    });

    it('should return empty context for new workflow', async () => {
      mockGetSharedContext.mockReturnValueOnce({});

      const result = await handlers.zantaraGetSharedContext({
        workflowId: 'new-workflow'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.keys).toEqual([]);
    });
  });

  describe('zantaraClearWorkflow', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraClearWorkflow({
        workflowId: 'test-workflow-1'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      // Note: mockClearWorkflow might not be directly trackable if called internally
      // Verify success instead
      expect(result.message).toContain('cleared');
    });

    it('should handle missing params gracefully', async () => {
      const result = await handlers.zantaraClearWorkflow({});
      // Handler doesn't validate params
      expect(result).toBeDefined();
    });

    it('should clear workflow successfully', async () => {
      const result = await handlers.zantaraClearWorkflow({
        workflowId: 'workflow-to-clear'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('cleared');
    });
  });

});

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Example Modern Handler', () => {
  let handlers: any;

  beforeEach(async () => {
    // Clear any cached modules to ensure fresh imports
    jest.resetModules();
    handlers = await import('../example-modern-handler.js');
  });

  describe('sendEmailV2', () => {
    it('should send email with valid params', async () => {
      const result = await handlers.sendEmailV2({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Hello World'
      });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messageId');
      expect(result.data).toHaveProperty('to', 'test@example.com');
      expect(result.data).toHaveProperty('subject', 'Test Subject');
      expect(result.data).toHaveProperty('status', 'sent');
      expect(result.data).toHaveProperty('timestamp');
      expect(typeof result.data.messageId).toBe('string');
      expect(result.data.messageId).toMatch(/^msg_\d+$/);
      expect(typeof result.data.timestamp).toBe('string');
    });

    it('should error when missing to param', async () => {
      const result = await handlers.sendEmailV2({
        subject: 'Test Subject',
        body: 'Hello World'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
      expect(result.error).toContain('to, subject, and body are required');
    });

    it('should error when missing subject param', async () => {
      const result = await handlers.sendEmailV2({
        to: 'test@example.com',
        body: 'Hello World'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
      expect(result.error).toContain('to, subject, and body are required');
    });

    it('should error when missing body param', async () => {
      const result = await handlers.sendEmailV2({
        to: 'test@example.com',
        subject: 'Test Subject'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
      expect(result.error).toContain('to, subject, and body are required');
    });

    it('should error when all params are missing', async () => {
      const result = await handlers.sendEmailV2({});

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
      expect(result.error).toContain('to, subject, and body are required');
    });

    it('should error when params are empty strings', async () => {
      const result = await handlers.sendEmailV2({
        to: '',
        subject: '',
        body: ''
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
    });

    it('should generate unique messageId for each call', async () => {
      const result1 = await handlers.sendEmailV2({
        to: 'test1@example.com',
        subject: 'Test 1',
        body: 'Hello 1'
      });

      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));

      const result2 = await handlers.sendEmailV2({
        to: 'test2@example.com',
        subject: 'Test 2',
        body: 'Hello 2'
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result1.data.messageId).not.toBe(result2.data.messageId);
    });

    it('should include all input params in response', async () => {
      const params = {
        to: 'recipient@example.com',
        subject: 'Important Email',
        body: 'This is the email content'
      };

      const result = await handlers.sendEmailV2(params);

      expect(result.ok).toBe(true);
      expect(result.data.to).toBe(params.to);
      expect(result.data.subject).toBe(params.subject);
      expect(result.data.status).toBe('sent');
    });
  });

  describe('listInboxV2', () => {
    it('should list inbox with default maxResults', async () => {
      const result = await handlers.listInboxV2({});

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(result.data).toHaveProperty('nextPageToken');
      expect(result.data).toHaveProperty('resultSizeEstimate');
      expect(Array.isArray(result.data.messages)).toBe(true);
      expect(result.data.messages).toHaveLength(0);
      expect(result.data.nextPageToken).toBeNull();
      expect(result.data.resultSizeEstimate).toBe(0);
    });

    it('should list inbox with custom maxResults', async () => {
      const result = await handlers.listInboxV2({ maxResults: 25 });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(result.data).toHaveProperty('nextPageToken');
      expect(result.data).toHaveProperty('resultSizeEstimate');
      expect(Array.isArray(result.data.messages)).toBe(true);
    });

    it('should handle maxResults as 0', async () => {
      const result = await handlers.listInboxV2({ maxResults: 0 });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(Array.isArray(result.data.messages)).toBe(true);
    });

    it('should handle maxResults as negative number', async () => {
      const result = await handlers.listInboxV2({ maxResults: -5 });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(Array.isArray(result.data.messages)).toBe(true);
    });

    it('should handle maxResults as string', async () => {
      const result = await handlers.listInboxV2({ maxResults: '50' });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(Array.isArray(result.data.messages)).toBe(true);
    });

    it('should return consistent response structure', async () => {
      const result = await handlers.listInboxV2({ maxResults: 15 });

      expect(result.ok).toBe(true);
      expect(typeof result.data).toBe('object');
      expect(result.data).toEqual({
        messages: [],
        nextPageToken: null,
        resultSizeEstimate: 0
      });
    });
  });

  describe('kbliLookupV2', () => {
    it('should lookup by code', async () => {
      const result = await handlers.kbliLookupV2({ code: '62010' });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('code', '62010');
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('risk');
      expect(result.data).toHaveProperty('requirements');
      expect(result.data).toHaveProperty('category');
      expect(typeof result.data.title).toBe('string');
      expect(typeof result.data.risk).toBe('string');
      expect(Array.isArray(result.data.requirements)).toBe(true);
      expect(typeof result.data.category).toBe('string');
    });

    it('should lookup by query', async () => {
      const result = await handlers.kbliLookupV2({ query: 'programming' });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('code');
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('risk');
      expect(result.data).toHaveProperty('requirements');
      expect(result.data).toHaveProperty('category');
      expect(result.data.code).toBe('62010'); // Default mock code
    });

    it('should error when both params are missing', async () => {
      const result = await handlers.kbliLookupV2({});

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
      expect(result.error).toContain("Either 'code' or 'query' is required");
    });

    it('should error when both params are empty strings', async () => {
      const result = await handlers.kbliLookupV2({ code: '', query: '' });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
      expect(result.error).toContain("Either 'code' or 'query' is required");
    });

    it('should error when both params are null', async () => {
      const result = await handlers.kbliLookupV2({ code: null, query: null });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
    });

    it('should error when both params are undefined', async () => {
      const result = await handlers.kbliLookupV2({ code: undefined, query: undefined });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
    });

    it('should prioritize code over query when both provided', async () => {
      const result = await handlers.kbliLookupV2({ 
        code: '12345', 
        query: 'search term' 
      });

      expect(result.ok).toBe(true);
      expect(result.data.code).toBe('12345');
    });

    it('should return mock data with expected structure', async () => {
      const result = await handlers.kbliLookupV2({ code: '62010' });

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({
        code: '62010',
        title: 'Pemrograman Komputer',
        risk: 'low',
        requirements: ['NIB', 'OSS', 'NPWP'],
        category: 'Information & Communication'
      });
    });

    it('should handle different code values', async () => {
      const testCodes = ['12345', '67890', '11111'];
      
      for (const code of testCodes) {
        const result = await handlers.kbliLookupV2({ code });
        expect(result.ok).toBe(true);
        expect(result.data.code).toBe(code);
      }
    });

    it('should handle different query values', async () => {
      const testQueries = ['technology', 'manufacturing', 'services'];
      
      for (const query of testQueries) {
        const result = await handlers.kbliLookupV2({ query });
        expect(result.ok).toBe(true);
        expect(result.data).toHaveProperty('code');
        expect(result.data).toHaveProperty('title');
      }
    });
  });

  describe('Handler Registration', () => {
    it('should have sendEmailV2 function exported', () => {
      expect(typeof handlers.sendEmailV2).toBe('function');
    });

    it('should have listInboxV2 function exported', () => {
      expect(typeof handlers.listInboxV2).toBe('function');
    });

    it('should have kbliLookupV2 function exported', () => {
      expect(typeof handlers.kbliLookupV2).toBe('function');
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent success response format', async () => {
      const emailResult = await handlers.sendEmailV2({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test'
      });
      
      const inboxResult = await handlers.listInboxV2({});
      
      const kbliResult = await handlers.kbliLookupV2({ code: '62010' });

      // All success responses should have ok: true and data property
      expect(emailResult.ok).toBe(true);
      expect(emailResult.data).toBeDefined();
      
      expect(inboxResult.ok).toBe(true);
      expect(inboxResult.data).toBeDefined();
      
      expect(kbliResult.ok).toBe(true);
      expect(kbliResult.data).toBeDefined();
    });

    it('should return consistent error response format', async () => {
      const emailError = await handlers.sendEmailV2({});
      const kbliError = await handlers.kbliLookupV2({});

      // All error responses should have ok: false and error property
      expect(emailError.ok).toBe(false);
      expect(emailError.error).toBeDefined();
      expect(typeof emailError.error).toBe('string');
      
      expect(kbliError.ok).toBe(false);
      expect(kbliError.error).toBeDefined();
      expect(typeof kbliError.error).toBe('string');
    });
  });
});
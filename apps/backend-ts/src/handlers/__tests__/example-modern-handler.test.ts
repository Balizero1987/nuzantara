import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Example Modern Handler', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../example-modern-handler.js');
  });

  describe('sendEmailV2', () => {
    it('should send email with valid params', async () => {
      const result = await handlers.sendEmailV2({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messageId');
      expect(result.data).toHaveProperty('status', 'sent');
    });

    it('should error when missing to param', async () => {
      const result = await handlers.sendEmailV2({
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
    });

    it('should error when missing subject param', async () => {
      const result = await handlers.sendEmailV2({
        to: 'test@example.com',
        body: 'Hello'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
    });

    it('should error when missing body param', async () => {
      const result = await handlers.sendEmailV2({
        to: 'test@example.com',
        subject: 'Test'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('missing_params');
    });
  });

  describe('listInboxV2', () => {
    it('should list inbox with default maxResults', async () => {
      const result = await handlers.listInboxV2({});

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(Array.isArray(result.data.messages)).toBe(true);
    });

    it('should list inbox with custom maxResults', async () => {
      const result = await handlers.listInboxV2({ maxResults: 5 });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(result.data.messages.length).toBeLessThanOrEqual(5);
    });

    it('should include nextPageToken in response', async () => {
      const result = await handlers.listInboxV2({});

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('nextPageToken');
    });
  });

  describe('kbliLookupV2', () => {
    it('should lookup by code', async () => {
      const result = await handlers.kbliLookupV2({ code: '62010' });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('code');
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('risk');
      expect(result.data).toHaveProperty('requirements');
    });

    it('should lookup by query', async () => {
      const result = await handlers.kbliLookupV2({ query: 'agriculture' });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('code');
      expect(result.data).toHaveProperty('title');
    });

    it('should error when both params missing', async () => {
      const result = await handlers.kbliLookupV2({});

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

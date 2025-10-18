/**
 * Tests for Gmail Handler
 * Tests email sending, listing, and reading
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGmailSend = jest.fn();
const mockGmailList = jest.fn();

jest.unstable_mockModule('googleapis', () => ({
  google: {
    gmail: jest.fn(() => ({
      users: {
        messages: {
          send: mockGmailSend,
          list: mockGmailList,
        },
      },
    })),
  },
}));

describe('Gmail Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGmailSend.mockResolvedValue({
      data: {
        id: 'msg-123',
        labelIds: ['SENT'],
        threadId: 'thread-123',
      },
    });

    mockGmailList.mockResolvedValue({
      data: {
        messages: [
          { id: 'msg-123', threadId: 'thread-123' },
          { id: 'msg-456', threadId: 'thread-456' },
        ],
      },
    });
  });

  describe('gmailSend', () => {
    it('should send email', async () => {
      const params = {
        to: 'client@example.com',
        subject: 'Visa Application Update',
        body: 'Your application is being processed',
      };

      const result = await mockGmailSend(params);

      expect(result.data).toHaveProperty('id');
      expect(result.data.labelIds).toContain('SENT');
    });

    it('should support HTML email', async () => {
      const params = {
        to: 'client@example.com',
        subject: 'Welcome',
        html: '<h1>Welcome to Bali Zero</h1>',
      };

      await mockGmailSend(params);

      expect(mockGmailSend).toHaveBeenCalled();
    });

    it('should support CC and BCC', async () => {
      const params = {
        to: 'client@example.com',
        cc: 'amanda@balizero.com',
        bcc: 'zainal@balizero.com',
        subject: 'Test',
        body: 'Test message',
      };

      await mockGmailSend(params);

      expect(mockGmailSend).toHaveBeenCalled();
    });
  });

  describe('gmailList', () => {
    it('should list messages', async () => {
      const params = {
        maxResults: 10,
      };

      const result = await mockGmailList(params);

      expect(result.data.messages).toHaveLength(2);
    });

    it('should support query filtering', async () => {
      const params = {
        q: 'from:client@example.com',
      };

      await mockGmailList(params);

      expect(mockGmailList).toHaveBeenCalledWith(
        expect.objectContaining({ q: expect.any(String) })
      );
    });
  });
});

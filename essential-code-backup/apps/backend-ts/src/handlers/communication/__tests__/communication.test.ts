import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Communication', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../communication.js');
    // Reset fetch mock before each test
    (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
  });

  describe('slackNotify', () => {
    it('should handle success case with valid params', async () => {
      // Mock environment variable and fetch
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const result = await handlers.slackNotify({
        text: 'Test message',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.sent).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      delete process.env.SLACK_WEBHOOK_URL;
    });

    it('should handle missing required params', async () => {
      await expect(handlers.slackNotify({})).rejects.toThrow(BadRequestError);
      await expect(handlers.slackNotify({})).rejects.toThrow('text or attachments required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.slackNotify({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('discordNotify', () => {
    it('should handle success case with valid params', async () => {
      // Mock environment variable and fetch
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const result = await handlers.discordNotify({
        content: 'Test message',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.sent).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      delete process.env.DISCORD_WEBHOOK_URL;
    });

    it('should handle missing required params', async () => {
      await expect(handlers.discordNotify({})).rejects.toThrow(BadRequestError);
      await expect(handlers.discordNotify({})).rejects.toThrow('content or embeds required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.discordNotify({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('googleChatNotify', () => {
    it('should handle success case with valid params', async () => {
      // Mock environment variable and fetch
      process.env.GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/webhook/test';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const result = await handlers.googleChatNotify({
        text: 'Test message',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.sent).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
    });

    it('should handle missing required params', async () => {
      await expect(handlers.googleChatNotify({})).rejects.toThrow(BadRequestError);
      await expect(handlers.googleChatNotify({})).rejects.toThrow('text or cards required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.googleChatNotify({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});

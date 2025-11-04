import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

describe('Team Login', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../team-login.js');
  });

  describe('teamLogin', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.teamLogin({
        name: 'zero',
        email: 'zero@balizero.com',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.token).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.teamLogin({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.teamLogin({
          invalid: 'data',
        })
      ).rejects.toThrow();
    });
  });

  describe('validateSession', () => {
    it('should handle success case with valid params', async () => {
      const loginResult = await handlers.teamLogin({
        name: 'zero',
        email: 'zero@balizero.com',
      });

      const result = await handlers.validateSession({
        token: loginResult.data.token,
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.validateSession({})).rejects.toThrow();
    });
  });

  describe('getTeamMembers', () => {
    it('should handle success case', async () => {
      const result = await handlers.getTeamMembers();

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.members).toBeDefined();
    });
  });

  describe('logoutSession', () => {
    it('should handle success case with valid params', async () => {
      const loginResult = await handlers.teamLogin({
        name: 'zero',
        email: 'zero@balizero.com',
      });

      const result = await handlers.logoutSession({
        token: loginResult.data.token,
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.logoutSession({})).rejects.toThrow();
    });
  });
});

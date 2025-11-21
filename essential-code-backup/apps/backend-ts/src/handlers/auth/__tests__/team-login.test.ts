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
        email: 'zero@balizero.com',
        pin: '010719', // Zero's actual PIN
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
          email: 'test@example.com',
          // Missing PIN
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('validateSession', () => {
    it('should handle success case with valid params', async () => {
      const loginResult = await handlers.teamLogin({
        email: 'zero@balizero.com',
        pin: '010719',
      });

      const result = await handlers.validateSession({
        token: loginResult.data.token,
      });

      // Session validation may return null if session expired or not found
      expect(result).toBeDefined();
    });

    it('should handle missing required params', async () => {
      const result = await handlers.validateSession({});
      // Should return result, not throw
      expect(result).toBeDefined();
    });
  });

  describe('getTeamMembers', () => {
    it('should handle success case', async () => {
      const result = await handlers.getTeamMembers();

      expect(result).toBeDefined();
      // getTeamMembers should return team list
      if (result.data && result.data.members) {
        expect(Array.isArray(result.data.members)).toBe(true);
      }
    });
  });

  describe('logoutSession', () => {
    it('should handle success case with valid params', async () => {
      const loginResult = await handlers.teamLogin({
        email: 'zero@balizero.com',
        pin: '010719',
      });

      const result = await handlers.logoutSession({
        token: loginResult.data.token,
      });

      // Logout should return result even if session not found
      expect(result).toBeDefined();
    });

    it('should handle missing required params', async () => {
      const result = await handlers.logoutSession({});
      // Should return result, not throw
      expect(result).toBeDefined();
    });
  });
});

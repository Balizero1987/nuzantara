import { describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

describe('Team Login Secure', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../team-login-secure.js');
  });

  describe('teamLoginSecure', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.teamLoginSecure({
        email: 'zero@balizero.com',
        pin: '010719',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.user).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.teamLoginSecure({})).rejects.toThrow(BadRequestError);
    });

    it('should handle wrong PIN', async () => {
      await expect(
        handlers.teamLoginSecure({
          email: 'zero@balizero.com',
          pin: 'wrong-pin',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should handle success case with valid params', async () => {
      const loginResult = await handlers.teamLoginSecure({
        email: 'zero@balizero.com',
        pin: '010719',
      });

      const result = handlers.verifyToken(loginResult.data.token);

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
    });

    it('should handle missing required params', () => {
      const result = handlers.verifyToken('');
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid token', () => {
      const result = handlers.verifyToken('invalid-token');

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTeamMemberList', () => {
    it('should handle success case', () => {
      const result = handlers.getTeamMemberList();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });
  });

  describe('resetLoginAttempts', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.resetLoginAttempts({
        email: 'zero@balizero.com',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.resetLoginAttempts({})).rejects.toThrow(BadRequestError);
    });
  });
});

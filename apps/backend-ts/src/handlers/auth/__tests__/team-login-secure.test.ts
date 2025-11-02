import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

describe('Team Login Secure', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../team-login-secure.js');
  });

  describe('teamLoginSecure', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.teamLoginSecure({
        name: 'zero',
        pin: '010719'
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
      await expect(handlers.teamLoginSecure({
        name: 'zero',
        pin: 'wrong-pin'
      })).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should handle success case with valid params', async () => {
      const loginResult = await handlers.teamLoginSecure({
        name: 'zero',
        pin: '010719'
      });

      const result = await handlers.verifyToken({
        token: loginResult.data.token
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.valid).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.verifyToken({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid token', async () => {
      const result = await handlers.verifyToken({
        token: 'invalid-token'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
    });
  });

  describe('getTeamMemberList', () => {
    it('should handle success case', async () => {
      const result = await handlers.getTeamMemberList();

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.members).toBeDefined();
      expect(Array.isArray(result.data.members)).toBe(true);
    });
  });

  describe('resetLoginAttempts', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.resetLoginAttempts({
        name: 'zero'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.resetLoginAttempts({})).rejects.toThrow(BadRequestError);
    });
  });

});

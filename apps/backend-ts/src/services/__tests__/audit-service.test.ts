/**
 * Audit Service Tests
 * Unit tests for GDPR-compliant audit service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { auditService } from '../audit-service.js';

describe('AuditService', () => {
  beforeEach(() => {
    // Clear audit log by accessing private property
    const service = auditService as any;
    if (service.auditLog) {
      service.auditLog = [];
    }
  });

  describe('logStreamOperation', () => {
    it('should log stream operation with GDPR compliance', () => {
      auditService.logStreamOperation({
        connectionId: 'test-conn',
        userId: 'user123',
        userEmail: 'user@example.com',
        ipAddress: '127.0.0.1',
        query: 'test query',
        endpoint: '/api/v2/bali-zero/chat-stream',
        success: true,
        firstTokenLatency: 50,
        tokensReceived: 10,
        duration: 1000
      });

      const entries = auditService.getRecentEntries(1);
      expect(entries.length).toBe(1);
      expect(entries[0].operation).toBe('stream.chat');
      expect(entries[0].success).toBe(true);
      expect(entries[0].gdprCompliant).toBe(true);
      expect(entries[0].metadata?.queryHash).toBeDefined();
      expect(entries[0].metadata?.queryLength).toBe(10); // "test query".length
    });

    it('should hash query instead of storing full text', () => {
      auditService.logStreamOperation({
        connectionId: 'test-conn',
        query: 'sensitive personal information',
        endpoint: '/api/v2/bali-zero/chat-stream',
        success: true,
        ipAddress: '127.0.0.1'
      });

      const entries = auditService.getRecentEntries(1);
      expect(entries.length).toBe(1);
      expect(entries[0].metadata?.queryHash).toBeDefined();
      expect(typeof entries[0].metadata?.queryHash).toBe('string');
      expect(entries[0].metadata?.query).toBeUndefined(); // No full query stored
    });
  });

  describe('logRateLimitViolation', () => {
    it('should log rate limit violations', () => {
      auditService.logRateLimitViolation({
        userId: 'user123',
        ipAddress: '127.0.0.1',
        endpoint: '/api/v2/bali-zero/chat-stream',
        limit: 20,
        window: 60
      });

      const entries = auditService.getRecentEntries(1);
      expect(entries.length).toBe(1);
      expect(entries[0].operation).toBe('security.rate_limit_violation');
      expect(entries[0].success).toBe(false);
      expect(entries[0].metadata?.limit).toBe(20);
      expect(entries[0].metadata?.window).toBe(60);
    });
  });

  describe('logAuthEvent', () => {
    it('should log authentication events', () => {
      auditService.logAuthEvent({
        operation: 'login',
        userId: 'user123',
        userEmail: 'user@example.com',
        ipAddress: '127.0.0.1',
        success: true
      });

      const entries = auditService.getRecentEntries(1);
      expect(entries.length).toBe(1);
      expect(entries[0].operation).toBe('auth.login');
      expect(entries[0].success).toBe(true);
      expect(entries[0].userId).toBe('user123');
    });
  });

  describe('GDPR Compliance', () => {
    it('should mark entry as non-compliant when email without userId', () => {
      auditService.logStreamOperation({
        connectionId: 'test-conn',
        userEmail: 'user@example.com', // No userId
        query: 'test',
        endpoint: '/test',
        success: true,
        ipAddress: '127.0.0.1'
      });

      const entries = auditService.getRecentEntries(1);
      expect(entries.length).toBe(1);
      // Entry should be marked non-compliant (email without userId violates GDPR)
      expect(entries[0].gdprCompliant).toBe(false);
    });
  });
});


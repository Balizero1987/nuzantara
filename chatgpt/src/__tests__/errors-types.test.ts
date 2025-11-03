/**
 * Tests for Error Types and Classification System
 */

import { describe, it, expect } from 'vitest';
import {
  ApplicationError,
  ErrorCategory,
  ErrorSeverity,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  TimeoutError,
  NetworkError,
  isApplicationError,
  isOperationalError,
  isCriticalError,
  ERROR_STATUS_CODES,
  ERROR_SEVERITY_MAP,
} from '../errors/types.js';

describe('Error Classification System', () => {
  describe('ApplicationError base class', () => {
    it('should create error with default options', () => {
      const error = new ApplicationError('Test error', ErrorCategory.INTERNAL);

      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.INTERNAL);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ApplicationError');
    });

    it('should create error with custom options', () => {
      const context = {
        userId: 'user123',
        requestId: 'req456',
        timestamp: new Date(),
      };

      const error = new ApplicationError('Custom error', ErrorCategory.VALIDATION, {
        code: 'CUSTOM_VALIDATION',
        severity: ErrorSeverity.LOW,
        statusCode: 422,
        context,
        isOperational: false,
      });

      expect(error.code).toBe('CUSTOM_VALIDATION');
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.statusCode).toBe(422);
      expect(error.context).toEqual(context);
      expect(error.isOperational).toBe(false);
    });

    it('should preserve error cause', () => {
      const originalError = new Error('Original error');
      const error = new ApplicationError('Wrapped error', ErrorCategory.EXTERNAL_SERVICE, {
        cause: originalError,
      });

      expect(error.cause).toBe(originalError);
    });

    it('should have proper stack trace', () => {
      const error = new ApplicationError('Stack test', ErrorCategory.INTERNAL);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack test');
    });
  });

  describe('Specialized error classes', () => {
    it('should create ValidationError correctly', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const error = new ValidationError('Validation failed', undefined, details);

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.context?.additionalData).toEqual(details);
    });

    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication required');
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.statusCode).toBe(401);
    });

    it('should create AuthorizationError with default message', () => {
      const error = new AuthorizationError();

      expect(error.message).toBe('Insufficient permissions');
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.statusCode).toBe(403);
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error.message).toBe('Resource not found: User not found');
      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should create ConflictError', () => {
      const error = new ConflictError('Email already exists');

      expect(error.category).toBe(ErrorCategory.CONFLICT);
      expect(error.statusCode).toBe(409);
    });

    it('should create RateLimitError with default message', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Rate limit exceeded');
      expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(error.statusCode).toBe(429);
    });

    it('should create ExternalServiceError', () => {
      const error = new ExternalServiceError('PaymentGateway', 'Connection timeout');

      expect(error.message).toContain('PaymentGateway');
      expect(error.message).toContain('Connection timeout');
      expect(error.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(error.statusCode).toBe(502);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should create DatabaseError', () => {
      const error = new DatabaseError('Connection pool exhausted');

      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.statusCode).toBe(503);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should create TimeoutError with default message', () => {
      const error = new TimeoutError();

      expect(error.message).toBe('Request timeout');
      expect(error.category).toBe(ErrorCategory.TIMEOUT);
      expect(error.statusCode).toBe(504);
    });

    it('should create NetworkError', () => {
      const error = new NetworkError('Connection refused');

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.statusCode).toBe(503);
    });
  });

  describe('Type guards', () => {
    it('isApplicationError should identify ApplicationError instances', () => {
      const appError = new ApplicationError('Test', ErrorCategory.INTERNAL);
      const stdError = new Error('Standard error');

      expect(isApplicationError(appError)).toBe(true);
      expect(isApplicationError(stdError)).toBe(false);
    });

    it('isOperationalError should identify operational errors', () => {
      const operational = new ValidationError('Bad input');
      const nonOperational = new ApplicationError('Bug', ErrorCategory.INTERNAL, {
        isOperational: false,
      });

      expect(isOperationalError(operational)).toBe(true);
      expect(isOperationalError(nonOperational)).toBe(false);
    });

    it('isCriticalError should identify critical severity errors', () => {
      const critical = new DatabaseError('DB down');
      const nonCritical = new ValidationError('Invalid email');

      expect(isCriticalError(critical)).toBe(true);
      expect(isCriticalError(nonCritical)).toBe(false);
    });
  });

  describe('Error mappings', () => {
    it('should have correct status codes for all categories', () => {
      expect(ERROR_STATUS_CODES[ErrorCategory.VALIDATION]).toBe(400);
      expect(ERROR_STATUS_CODES[ErrorCategory.AUTHENTICATION]).toBe(401);
      expect(ERROR_STATUS_CODES[ErrorCategory.AUTHORIZATION]).toBe(403);
      expect(ERROR_STATUS_CODES[ErrorCategory.NOT_FOUND]).toBe(404);
      expect(ERROR_STATUS_CODES[ErrorCategory.CONFLICT]).toBe(409);
      expect(ERROR_STATUS_CODES[ErrorCategory.RATE_LIMIT]).toBe(429);
      expect(ERROR_STATUS_CODES[ErrorCategory.INTERNAL]).toBe(500);
      expect(ERROR_STATUS_CODES[ErrorCategory.EXTERNAL_SERVICE]).toBe(502);
      expect(ERROR_STATUS_CODES[ErrorCategory.DATABASE]).toBe(503);
      expect(ERROR_STATUS_CODES[ErrorCategory.NETWORK]).toBe(503);
      expect(ERROR_STATUS_CODES[ErrorCategory.TIMEOUT]).toBe(504);
    });

    it('should have correct severity for all categories', () => {
      expect(ERROR_SEVERITY_MAP[ErrorCategory.VALIDATION]).toBe(ErrorSeverity.LOW);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.AUTHENTICATION]).toBe(ErrorSeverity.MEDIUM);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.AUTHORIZATION]).toBe(ErrorSeverity.MEDIUM);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.NOT_FOUND]).toBe(ErrorSeverity.LOW);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.CONFLICT]).toBe(ErrorSeverity.LOW);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.RATE_LIMIT]).toBe(ErrorSeverity.MEDIUM);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.EXTERNAL_SERVICE]).toBe(ErrorSeverity.HIGH);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.DATABASE]).toBe(ErrorSeverity.CRITICAL);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.INTERNAL]).toBe(ErrorSeverity.CRITICAL);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.NETWORK]).toBe(ErrorSeverity.HIGH);
      expect(ERROR_SEVERITY_MAP[ErrorCategory.TIMEOUT]).toBe(ErrorSeverity.HIGH);
    });
  });
});

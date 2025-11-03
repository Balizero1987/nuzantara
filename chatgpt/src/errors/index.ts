/**
 * Unified Error Handling System
 * 
 * Export all error handling components for easy import
 */

// Error types and classes
export {
  // Enums
  ErrorSeverity,
  ErrorCategory,
  
  // Mappings
  ERROR_STATUS_CODES,
  ERROR_SEVERITY_MAP,
  
  // Schemas
  ErrorContextSchema,
  ErrorResponseSchema,
  
  // Types
  type ErrorContext,
  type ErrorResponse,
  
  // Base class
  ApplicationError,
  
  // Specialized errors
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
  
  // Type guards
  isApplicationError,
  isOperationalError,
  isCriticalError,
} from './types.js';

// Error handler
export {
  UnifiedErrorHandler,
  getDefaultErrorHandler,
  resetDefaultErrorHandler,
  type ErrorHandlerConfig,
  type ErrorMetrics,
} from './unified-error-handler.js';

// Middleware
export {
  errorHandlerMiddleware,
  asyncHandler,
  requestContextMiddleware,
  notFoundHandler,
  requestTimeoutMiddleware,
  errorRateLimitMiddleware,
  setupErrorHandling,
} from './middleware.js';

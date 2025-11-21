/**
 * ZANTARA Unified Logging System
 * Main entry point for all logging functionality
 */

// Core logger
export {
  logger,
  UnifiedLogger,
  LogLevel,
  LogContext,
  LogMetrics,
  LogEntry,
  LoggerConfig,
  defaultLoggerConfig,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logTrace,
} from './unified-logger.js';

// Correlation tracking
export {
  correlationMiddleware,
  withRequestTracking,
  getCorrelationContext,
  createRequestLogger,
  type CorrelatedRequest,
} from './correlation-middleware.js';

// Performance monitoring
export {
  startPerformanceMeasurement,
  endPerformanceMeasurement,
  withPerformanceTracking,
  performanceMiddleware,
  trackDatabaseQuery,
  trackApiCall,
  trackCacheOperation,
  trackMemoryUsage,
  PerformanceMonitor,
  globalPerformanceMonitor,
  type PerformanceMeasurement,
} from './performance-logger.js';

// Migration utilities
export {
  LoggingMigration,
  type MigrationOptions,
  type MigrationStats,
} from './migration-script.js';

// Default export for convenience
export { logger as default } from './unified-logger.js';

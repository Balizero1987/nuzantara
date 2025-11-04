/**
 * ZANTARA Unified Logging System v3.0
 *
 * Single logger interface across all modules with:
 * - Structured logging with consistent schema
 * - Request correlation tracking
 * - Performance minimalization
 * - Integration with existing monitoring
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';
import crypto from 'node:crypto';
import type { Request } from 'express';

// Log level definitions with priority
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
  TRACE = 5,
}

// Standard log context interface
export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  service?: string;
  handler?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  errorCode?: string;
  [key: string]: any;
}

// Performance metrics interface
export interface LogMetrics {
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  timestamp?: number;
}

// Standard log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
  metrics?: LogMetrics;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  service: string;
  version: string;
  environment: string;
}

// Logger configuration interface
export interface LoggerConfig {
  service: string;
  version: string;
  environment: string;
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableLoki: boolean;
  lokiUrl?: string;
  lokiUser?: string;
  lokiApiKey?: string;
  metricsEnabled: boolean;
  structuredOutput: boolean;
}

class UnifiedLogger {
  private winston: winston.Logger;
  private config: LoggerConfig;
  private static instance: UnifiedLogger;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.winston = this.createWinstonLogger();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: LoggerConfig): UnifiedLogger {
    if (!UnifiedLogger.instance) {
      if (!config) {
        throw new Error('Logger config required for first initialization');
      }
      UnifiedLogger.instance = new UnifiedLogger(config);
    }
    return UnifiedLogger.instance;
  }

  /**
   * Create winston logger with appropriate transports
   */
  private createWinstonLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const correlationId = meta.correlationId ? `[${meta.correlationId}]` : '';
              const duration = meta.duration ? ` (${meta.duration}ms)` : '';
              return `${timestamp} ${level}: ${correlationId} ${message}${duration}`;
            })
          ),
        })
      );
    }

    // File transports for production
    if (this.config.enableFile) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
        })
      );
    }

    // Grafana Loki transport
    if (this.config.enableLoki && this.config.lokiUrl) {
      transports.push(
        new LokiTransport({
          host: this.config.lokiUrl,
          basicAuth: `${this.config.lokiUser}:${this.config.lokiApiKey}`,
          labels: {
            service: this.config.service,
            environment: this.config.environment,
            version: this.config.version,
            app: 'nuzantara',
          },
          json: true,
          batching: true,
          interval: 5,
          replaceTimestamp: true,
          onConnectionError: (err) =>
            this.error('Loki connection error', err as Error, { service: 'logging-system' }),
        }) as any
      );
    }

    return winston.createLogger({
      level: this.getWinstonLevel(this.config.level),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: this.config.service,
        version: this.config.version,
        environment: this.config.environment,
      },
      transports,
      exitOnError: false,
    });
  }

  /**
   * Convert LogLevel to winston level string
   */
  private getWinstonLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.HTTP:
        return 'http';
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.TRACE:
        return 'silly';
      default:
        return 'info';
    }
  }

  /**
   * Generate correlation ID if not provided
   */
  private generateCorrelationId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Extract context from request object
   */
  private extractRequestContext(req?: Request): LogContext {
    if (!req) return {};

    return {
      correlationId: (req as any).correlationId || this.generateCorrelationId(),
      userId: (req as any).user?.id || (req as any).userId,
      sessionId: (req as any).sessionId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      headers: this.sanitizeHeaders(req.headers),
    };
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Create log entry with standard structure
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error,
    metrics?: LogMetrics
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        service: this.config.service,
        ...context,
      },
      metrics: metrics || (this.config.metricsEnabled ? this.getMetrics() : undefined),
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
    };
  }

  /**
   * Get performance metrics
   */
  private getMetrics(): LogMetrics {
    const memUsage = process.memoryUsage();

    return {
      timestamp: Date.now(),
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
    };
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    const entry = this.createLogEntry(level, message, context, error);
    const winstonLevel = this.getWinstonLevel(level);

    // Add correlation ID to message for better visibility
    const correlationPrefix = entry.context.correlationId
      ? `[${entry.context.correlationId}] `
      : '';
    const formattedMessage = `${correlationPrefix}${message}`;

    this.winston.log(winstonLevel, formattedMessage, {
      ...entry.context,
      error: entry.error,
      metrics: entry.metrics,
      correlationId: entry.context.correlationId,
    });
  }

  // Public logging methods
  error(message: string, error?: Error, context: LogContext = {}): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  http(message: string, context: LogContext = {}): void {
    this.log(LogLevel.HTTP, message, context);
  }

  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context: LogContext = {}): void {
    this.log(LogLevel.TRACE, message, context);
  }

  // Specialized logging methods
  /**
   * Log HTTP request with automatic context extraction
   */
  logRequest(req: Request, responseTime?: number): void {
    const context = this.extractRequestContext(req);
    if (responseTime) {
      context.duration = responseTime;
    }

    this.http(`${req.method} ${req.url}`, {
      ...context,
      type: 'http_request',
      statusCode: (req as any).statusCode,
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: Request, statusCode: number, responseTime: number): void {
    const context = this.extractRequestContext(req);

    this.http(`${req.method} ${req.url} - ${statusCode}`, {
      ...context,
      type: 'http_response',
      statusCode,
      duration: responseTime,
    });
  }

  /**
   * Log API call with timing
   */
  logApiCall(service: string, operation: string, duration: number, context: LogContext = {}): void {
    this.info(`API call: ${service}.${operation}`, {
      ...context,
      type: 'api_call',
      service,
      operation,
      duration,
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(event: string, data: any, context: LogContext = {}): void {
    this.info(`Business event: ${event}`, {
      ...context,
      type: 'business_event',
      event,
      data,
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: LogContext = {}
  ): void {
    const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    this.log(level, `Security event: ${event}`, {
      ...context,
      type: 'security_event',
      event,
      severity,
    });
  }

  /**
   * Log performance event
   */
  logPerformance(operation: string, duration: number, context: LogContext = {}): void {
    if (duration > 1000) {
      // Log as warning if over 1 second
      this.warn(`Slow operation: ${operation}`, {
        ...context,
        type: 'performance',
        operation,
        duration,
        threshold: 1000,
      });
    } else {
      this.debug(`Performance: ${operation}`, {
        ...context,
        type: 'performance',
        operation,
        duration,
      });
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): UnifiedLogger {
    const childLogger = Object.create(this);
    childLogger.log = (level: LogLevel, message: string, ctx: LogContext = {}, error?: Error) => {
      const mergedContext = { ...context, ...ctx };
      return this.log(level, message, mergedContext, error);
    };
    return childLogger;
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Update log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.winston.level = this.getWinstonLevel(level);
  }
}

// Default configuration
export const defaultLoggerConfig: LoggerConfig = {
  service: process.env.SERVICE_NAME || 'nuzantara-backend',
  version: process.env.SERVICE_VERSION || '3.0.0',
  environment: process.env.NODE_ENV || 'development',
  level: LogLevel[process.env.LOG_LEVEL?.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO,
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: process.env.NODE_ENV === 'production',
  enableLoki: !!process.env.GRAFANA_LOKI_URL,
  lokiUrl: process.env.GRAFANA_LOKI_URL,
  lokiUser: process.env.GRAFANA_LOKI_USER,
  lokiApiKey: process.env.GRAFANA_API_KEY,
  metricsEnabled: process.env.ENABLE_METRICS === 'true',
  structuredOutput: true,
};

// Create and export default logger instance
export const logger = UnifiedLogger.getInstance(defaultLoggerConfig);

// Export convenience functions for backward compatibility
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) =>
  logger.error(message, error, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logTrace = (message: string, context?: LogContext) => logger.trace(message, context);

// Export types and classes
export { UnifiedLogger };
export default logger;

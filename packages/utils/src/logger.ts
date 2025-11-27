/**
 * NUZANTARA Logger - Centralized Logging Utility
 *
 * Provides structured, consistent logging across all services
 * with configurable levels and output formats
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  correlationId?: string;
}

export interface LoggerConfig {
  service: string;
  level: LogLevel;
  enableConsole: boolean;
  enableColors: boolean;
  correlationId?: string;
}

class Logger {
  private config: LoggerConfig;
  private serviceName: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      service: 'nuzantara',
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
      ...config,
    };
    this.serviceName = this.config.service;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, service, message, context, correlationId } = entry;

    // Basic format: [timestamp] [level] [service] [correlationId] message
    let formatted = `${timestamp} [${level}] [${service}]`;

    if (correlationId) {
      formatted += ` [${correlationId}]`;
    }

    formatted += ` ${message}`;

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    // Add error stack if error provided
    if (entry.error) {
      formatted += `\n${entry.error.stack}`;
    }

    return formatted;
  }

  private getColorFunction(level: string): (text: string) => string {
    if (!this.config.enableColors) {
      return (text: string) => text;
    }

    const colors = {
      DEBUG: (text: string) => `\x1b[36m${text}\x1b[0m`, // Cyan
      INFO: (text: string) => `\x1b[32m${text}\x1b[0m`,  // Green
      WARN: (text: string) => `\x1b[33m${text}\x1b[0m`,  // Yellow
      ERROR: (text: string) => `\x1b[31m${text}\x1b[0m`, // Red
    };

    return colors[level as keyof typeof colors] || ((text: string) => text);
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(LogLevel[entry.level as keyof typeof LogLevel])) {
      return;
    }

    if (this.config.enableConsole) {
      const formatted = this.formatMessage(entry);
      const colorize = this.getColorFunction(entry.level);

      switch (entry.level) {
        case 'DEBUG':
          console.debug(colorize(formatted));
          break;
        case 'INFO':
          console.info(colorize(formatted));
          break;
        case 'WARN':
          console.warn(colorize(formatted));
          break;
        case 'ERROR':
          console.error(colorize(formatted));
          break;
        default:
          console.log(formatted);
      }
    }

    // Here you could add additional transports:
    // - Write to file
    // - Send to logging service
    // - Emit to monitoring system
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      service: this.serviceName,
      message,
      context,
      error,
      correlationId: this.config.correlationId,
    };
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.writeLog(entry);
  }

  // Specialized logging methods for common patterns
  auth(action: string, userId?: string, context?: Record<string, any>): void {
    this.info(`Auth: ${action}`, {
      ...context,
      type: 'auth',
      userId,
    });
  }

  api(method: string, endpoint: string, statusCode?: number, context?: Record<string, any>): void {
    this.info(`API: ${method} ${endpoint}`, {
      ...context,
      type: 'api',
      method,
      endpoint,
      statusCode,
    });
  }

  db(operation: string, table?: string, context?: Record<string, any>): void {
    this.debug(`DB: ${operation}`, {
      ...context,
      type: 'database',
      operation,
      table,
    });
  }

  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...context,
      type: 'performance',
      operation,
      duration,
    });
  }

  // Child logger with additional context
  child(context: Record<string, any>): Logger {
    return new Logger({
      ...this.config,
      service: `${this.serviceName}.${context.service || 'child'}`,
    });
  }

  // Set correlation ID for request tracking
  withCorrelationId(correlationId: string): Logger {
    return new Logger({
      ...this.config,
      correlationId,
    });
  }
}

// Factory function to create loggers
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

// Default logger instance
export const logger = createLogger({
  service: 'nuzantara',
  level: LogLevel.INFO,
});

// Utility to parse log level from string
export function parseLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
}

// Export type for use in other modules
export type { LoggerConfig, LogEntry };
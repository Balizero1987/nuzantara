/**
 * ZANTARA Logger
 * Production-safe logging wrapper
 * Disables console.log in production, keeps console.error/warn
 */

const isProduction = window.location.hostname !== 'localhost' &&
                     !window.location.hostname.includes('127.0.0.1') &&
                     !window.location.hostname.includes('192.168.');

const isDev = !isProduction;

class Logger {
  constructor(context = 'ZANTARA') {
    this.context = context;
  }

  log(...args) {
    if (isDev) {
      console.log(`[${this.context}]`, ...args);
    }
  }

  warn(...args) {
    // Warnings always shown (important for debugging)
    console.warn(`[${this.context}]`, ...args);
  }

  error(...args) {
    // Errors always shown (critical)
    console.error(`[${this.context}]`, ...args);
  }

  debug(...args) {
    if (isDev) {
      console.debug(`[${this.context}]`, ...args);
    }
  }

  info(...args) {
    if (isDev) {
      console.info(`[${this.context}]`, ...args);
    }
  }
}

// Create default logger
const logger = new Logger();

// Export
export { Logger, logger };
export default logger;

// Expose globally for non-module scripts
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
}

import { logger } from '../logging/unified-logger.js';

/**
 * Sostituzioni per console.log strutturato
 */

export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: Record<string, unknown>) => {
  const errorMeta: Record<string, unknown> = {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  };
  logger.error(message, errorMeta);
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  logger.debug(message, meta);
};

// Per mantenere compatibilità durante la transizione
export const console = {
  log: logInfo,
  error: logError,
  warn: logWarn,
  debug: logDebug,
};

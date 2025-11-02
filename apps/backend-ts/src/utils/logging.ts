import { logger } from '../logging/unified-logger.js';

/**
 * Sostituzioni per console.log strutturato
 */

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Per mantenere compatibilità durante la transizione
export const console = {
  log: logInfo,
  error: logError,
  warn: logWarn,
  debug: logDebug
};

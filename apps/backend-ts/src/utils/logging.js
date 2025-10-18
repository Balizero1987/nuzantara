import logger from '../services/logger.js';
/**
 * Sostituzioni per console.log strutturato
 */
export const logInfo = (message, meta) => {
    logger.info(message, meta);
};
export const logError = (message, error, meta) => {
    logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};
export const logWarn = (message, meta) => {
    logger.warn(message, meta);
};
export const logDebug = (message, meta) => {
    logger.debug(message, meta);
};
// Per mantenere compatibilità durante la transizione
export const console = {
    log: logInfo,
    error: logError,
    warn: logWarn,
    debug: logDebug
};

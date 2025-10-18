import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'nuzantara' },
  transports: [
    // Scrivi tutti i log con livello `error` e inferiore su error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Scrivi tutti i log con livello `info` e inferiore su combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Se non siamo in produzione, aggiungi anche console logging
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };
export default logger;

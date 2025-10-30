import winston from 'winston';
import LokiTransport from 'winston-loki';

const transports: winston.transport[] = [
  // File transports (existing)
  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  new winston.transports.File({ filename: 'logs/combined.log' }),
];

// Grafana Loki transport (P0.2 integration)
if (process.env.GRAFANA_LOKI_URL) {
  transports.push(
    new LokiTransport({
      host: process.env.GRAFANA_LOKI_URL,
      basicAuth: `${process.env.GRAFANA_LOKI_USER}:${process.env.GRAFANA_API_KEY}`,
      labels: {
        service: 'backend-ts',
        env: process.env.NODE_ENV || 'production',
        app: 'nuzantara'
      },
      json: true,
      batching: true,
      interval: 5,
      replaceTimestamp: true,
      onConnectionError: (err) => console.error('⚠️  Loki connection error:', err)
    }) as any
  );
  console.log('✅ Grafana Loki transport enabled');
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'nuzantara' },
  transports,
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

import cors from 'cors';
import helmet from 'helmet';

import { config } from '../config/centralized-config.js';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'warn',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console(), new transports.File({ filename: 'cors-violations.log' })],
});

const allowedOrigins = config.getAll().cors.allowedOrigins;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS violation: Blocked origin - ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export const productionCors = cors(corsOptions);
export const securityHeaders = helmet();

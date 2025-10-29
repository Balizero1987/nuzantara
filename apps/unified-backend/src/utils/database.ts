import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
});

db.$connect()
  .then(() => logger.info('Connected to PostgreSQL'))
  .catch((error) => logger.error('Database connection failed:', error));

process.on('beforeExit', async () => {
  await db.$disconnect();
  logger.info('Disconnected from PostgreSQL');
});

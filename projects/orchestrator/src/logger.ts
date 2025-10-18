import pino from 'pino';
import config from './config';

const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  },
  base: {
    service: 'zantara-orchestrator',
    version: '1.0.0'
  }
});

export default logger;
import { Router } from 'express';
import { logger } from '../../utils/logger';

const router = Router();

// Module health check
router.get('/', async (req, res) => {
  res.json({
    module: 'health',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default {
  name: 'health',
  router,
  initialize: async () => {
    logger.info('Health module initialized');
  }
};

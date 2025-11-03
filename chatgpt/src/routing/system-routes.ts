import { Router } from 'express';
import { SystemService } from '../services/system-service.js';
import logger from '../lib/logger.js';

const router = Router();
const systemService = new SystemService();

router.get('/transcriptions', async (req, res) => {
  try {
    const transcriptions = await systemService.getTranscriptions();
    res.json(transcriptions);
  } catch (error) {
    logger.error('Failed to get transcriptions', { error });
    res.status(500).send('Failed to retrieve transcriptions.');
  }
});

router.get('/logs/:logType', async (req, res) => {
  const { logType } = req.params;

  if (logType !== 'error' && logType !== 'combined') {
    return res.status(400).send('Invalid log type specified.');
  }

  try {
    const logs = await systemService.getLogs(logType);
    res.header('Content-Type', 'text/plain');
    res.send(logs);
  } catch (error) {
    logger.error(`Failed to get ${logType} logs`, { error });
    res.status(500).send(`Failed to retrieve ${logType} logs.`);
  }
});

export default router;

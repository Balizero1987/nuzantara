import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

router.get('/health/ready', (req: Request, res: Response) => {
  res.status(200).json({ ready: true });
});

router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ alive: true, uptime: process.uptime() });
});

router.get('/metrics', async (req: Request, res: Response) => {
  const prometheusRegister = (global as any).prometheusRegister;
  if (!prometheusRegister) {
    return res.status(404).json({ error: 'Metrics not initialized' });
  }
  res.set('Content-Type', prometheusRegister.contentType);
  res.end(await prometheusRegister.metrics());
});

export default router;

/**
 * DevAI Warm-up Handler
 * Keeps RunPod workers alive by pinging every 90s
 */

import { ok } from '../../utils/response.js';
import type { Handler } from '../../types/handler.js';

/**
 * Lightweight ping to keep DevAI RunPod workers warm
 * Called by cron every 90s to prevent cold starts
 */
export const devaiWarmup: Handler = async () => {
  return ok({
    status: 'warm',
    message: 'DevAI worker is ready',
    timestamp: new Date().toISOString()
  });
};

export default devaiWarmup;


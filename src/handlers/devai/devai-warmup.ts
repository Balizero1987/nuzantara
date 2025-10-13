/**
 * DevAI Warm-up Handler
 * Keeps RunPod workers alive by pinging every 90s
 */

import { ok } from '../../utils/response.js';

/**
 * Lightweight ping to keep DevAI RunPod workers warm
 * Called by cron every 90s to prevent cold starts
 */
export const devaiWarmup = async () => {
  return ok({
    status: 'warm',
    message: 'DevAI worker is ready',
    timestamp: new Date().toISOString()
  });
};

export default devaiWarmup;


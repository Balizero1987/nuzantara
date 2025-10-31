import express from 'express';
import type { AddressInfo } from 'net';

import { applySecurity, globalRateLimiter } from '../apps/backend-ts/src/middleware/security.middleware.ts';
import { metricsMiddleware } from '../apps/backend-ts/src/middleware/observability.middleware.ts';

async function run(): Promise<void> {
  const app = express();

  app.use(applySecurity);
  app.use(globalRateLimiter);
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/limited', (_req, res) => res.json({ ok: true }));

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', async () => {
      try {
        const address = server.address() as AddressInfo | null;
        if (!address) {
          throw new Error('Unable to determine server address');
        }
        const baseUrl = `http://${address.address}:${address.port}`;

        // Verify /health is exempt from throttling
        const healthResponses: number[] = [];
        for (let i = 0; i < 110; i++) {
          const response = await fetch(`${baseUrl}/health`);
          healthResponses.push(response.status);
        }
        const healthNon200 = healthResponses.filter(status => status !== 200).length;
        console.log('[rate_limit_header_check] health_requests=%d non200=%d', healthResponses.length, healthNon200);

        // Trigger limiter on /limited
        for (let i = 0; i < 110; i++) {
          await fetch(`${baseUrl}/limited`);
        }
        const limitedResponse = await fetch(`${baseUrl}/limited`);
        const retryAfter = limitedResponse.headers.get('retry-after');
        const limit = limitedResponse.headers.get('x-ratelimit-limit');
        const remaining = limitedResponse.headers.get('x-ratelimit-remaining');
        const reset = limitedResponse.headers.get('x-ratelimit-reset');

        console.log(
          '[rate_limit_header_check] status=%d retry-after=%s x-limit=%s x-remaining=%s x-reset=%s',
          limitedResponse.status,
          retryAfter,
          limit,
          remaining,
          reset
        );

        server.close(() => resolve());
      } catch (error) {
        server.close(() => reject(error));
      }
    });
  });
}

run().catch(error => {
  console.error('[rate_limit_header_check] error', error);
  process.exitCode = 1;
});

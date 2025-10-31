import express from 'express';
import type { AddressInfo } from 'net';
import { setTimeout as wait } from 'timers/promises';

import { applySecurity, globalRateLimiter } from '../apps/backend-ts/src/middleware/security.middleware.ts';
import { metricsMiddleware, metricsHandler } from '../apps/backend-ts/src/middleware/observability.middleware.ts';

async function run(): Promise<void> {
  const app = express();

  app.use(applySecurity);
  app.use(globalRateLimiter);
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  app.get('/metrics', metricsHandler);

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', async () => {
      try {
        const address = server.address() as AddressInfo | null;
        if (!address) {
          throw new Error('Unable to determine server address');
        }

        const baseUrl = `http://${address.address}:${address.port}`;

        const latencies: number[] = [];
        let non200 = 0;

        for (let i = 0; i < 100; i++) {
          const start = performance.now();
          const response = await fetch(`${baseUrl}/health`);
          const duration = performance.now() - start;
          latencies.push(duration);
          if (!response.ok) {
            non200 += 1;
          }
          await wait(5);
        }

        const sorted = latencies.slice().sort((a, b) => a - b);
        const avgMs = latencies.reduce((sum, value) => sum + value, 0) / latencies.length;
        const p95Ms = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
        const buckets = [1, 5, 10, 20, 50];
        const histogram: Record<string, number> = Object.fromEntries(buckets.map(b => [`<=${b}ms`, 0]));
        let overBucket = 0;

        for (const latency of latencies) {
          const bucket = buckets.find(b => latency <= b);
          if (bucket) {
            histogram[`<=${bucket}ms`] += 1;
          } else {
            overBucket += 1;
          }
        }

        console.log('[local_server_test] requests=%d non200=%d avg_ms=%.3f p95_ms=%.3f', latencies.length, non200, avgMs, p95Ms);
        console.log('[local_server_test] histogram=%s%s', Object.entries(histogram).map(([bucket, count]) => `${bucket}:${count}`).join(', '), overBucket ? `, >${buckets.at(-1)}ms:${overBucket}` : '');

        const metricResponse = await fetch(`${baseUrl}/metrics`);
        const metricBody = await metricResponse.text();
        const metricHighlights = metricBody
          .split('\n')
          .filter(line =>
            /nodejs_cpu_user_seconds_total|process_resident_memory_bytes|zantara_backend_http_requests_total/.test(line)
          )
          .slice(0, 10);
        console.log('[local_server_test] metrics=%s', metricHighlights.join(' | '));

        const headResponse = await fetch(`${baseUrl}/health`, { method: 'HEAD' });
        console.log(
          '[local_server_test] headers strict-transport-security=%s content-security-policy=%s x-frame-options=%s',
          headResponse.headers.get('strict-transport-security'),
          headResponse.headers.get('content-security-policy'),
          headResponse.headers.get('x-frame-options')
        );

        server.close(() => resolve());
      } catch (error) {
        server.close(() => reject(error));
      }
    });
  });
}

run().catch(error => {
  console.error('[local_server_test] error', error);
  process.exitCode = 1;
});

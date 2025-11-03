import autocannon from 'autocannon';
import { buildApp } from '../src/server.js';

async function run() {
  const app = buildApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to determine server address');
  const url = `http://127.0.0.1:${address.port}`;

  const result = await autocannon({
    url: url + '/health',
    duration: 5,
    connections: 50,
    pipelining: 1,
    method: 'GET',
  });

  // eslint-disable-next-line no-console
  console.log('Autocannon summary (GET /health):', {
    requests: result.requests.average,
    latency: result.latency.average,
    throughput: result.throughput.average,
  });

  server.close();
}

try {
  await run();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
}

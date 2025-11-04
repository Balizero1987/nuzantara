import { productionCors, securityHeaders } from './middleware/production-cors.js';
import { config } from './config/centralized-config.js';
import express from 'express';
import { registerRoutes } from './routing/unified-router.js';
import { routes } from './routes.js';
import { pathToFileURL } from 'node:url';
import systemRoutes from './routing/system-routes.js';
import {
  Laws,
  isEligibleForLandRight,
  validateEnvironmentalPermit,
  canWNAOwnHousing,
} from './laws/property-environment-laws.js';

export function buildApp() {
  const app = express();
  app.use(securityHeaders);
  app.use(productionCors);
  app.use(express.json());
  app.use('/api/system', systemRoutes);
  app.use(registerRoutes(routes));

  // Basic error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      // In production you'd avoid leaking details
      res.status(500).json({ error: 'InternalServerError' });
    }
  );

  return app;
}

// Run only when executed directly (node dist/server.js)
const invokedAsMain = (() => {
  try {
    const main = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
    return import.meta.url === main;
  } catch {
    return false;
  }
})();

if (invokedAsMain) {
  const port = config.get('port');
  const app = buildApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Zantara API listening on http://localhost:${port}`);
  });
}

// Example usage of the module (if needed for integration)
console.log('Available Laws:', Laws);
console.log('Eligibility for Land Right:', isEligibleForLandRight('Hak Milik', 'WNI'));
console.log('Environmental Permit Validation:', validateEnvironmentalPermit('AMDAL', 'high'));
console.log(
  'Can WNA Own Housing:',
  canWNAOwnHousing('apartemen', 'allowed', 1000000000, 500000000)
);

import type { RouteDefinition } from './routing/unified-router.js';
import { defineRoutes, schemas } from './routing/unified-router.js';

const healthRoute: RouteDefinition = {
  method: 'get',
  path: '/health',
  name: 'health',
  handler: async () => ({ status: 'ok' }),
  validate: { response: schemas.z.object({ status: schemas.z.literal('ok') }) },
};

export const routes = defineRoutes(healthRoute);

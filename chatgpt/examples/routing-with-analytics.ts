/**
 * Example: Using the unified router with guardrails and analytics
 */
import express from 'express';
import {
  registerRoutes,
  defineRoutes,
  getRouteAnalytics,
  getRouteRegistry,
} from '../src/routing/index.js';

// Define your API routes
const apiRoutes = defineRoutes(
  {
    method: 'get',
    path: '/health',
    name: 'health-check',
    handler: async () => ({ status: 'ok', timestamp: Date.now() }),
  },
  {
    method: 'get',
    path: '/users',
    name: 'list-users',
    handler: async () => ({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    }),
  },
  {
    method: 'get',
    path: '/users/:id',
    name: 'get-user',
    handler: async ({ req }) => ({
      user: { id: req.params.id, name: 'Sample User' },
    }),
  },
  {
    method: 'post',
    path: '/users',
    name: 'create-user',
    handler: async ({ req }) => ({
      created: true,
      user: req.body,
    }),
  },
  {
    method: 'delete',
    path: '/users/:id',
    name: 'delete-user',
    handler: async ({ req }) => ({
      deleted: true,
      userId: req.params.id,
    }),
  }
);

// Create admin/monitoring routes
const adminRoutes = defineRoutes(
  {
    method: 'get',
    path: '/admin/analytics/summary',
    name: 'analytics-summary',
    handler: async () => {
      const analytics = getRouteAnalytics();
      return analytics.getSummary();
    },
  },
  {
    method: 'get',
    path: '/admin/analytics/top-routes',
    name: 'top-routes',
    handler: async () => {
      const analytics = getRouteAnalytics();
      return {
        mostAccessed: analytics.getMostAccessedRoutes(10),
        slowest: analytics.getSlowestRoutes(10),
        errorProne: analytics.getErrorProneRoutes(10),
      };
    },
  },
  {
    method: 'get',
    path: '/admin/registry/routes',
    name: 'list-routes',
    handler: async () => {
      const registry = getRouteRegistry();
      return {
        routes: registry.getAll(),
        stats: registry.getStats(),
      };
    },
  },
  {
    method: 'get',
    path: '/admin/registry/conflicts',
    name: 'check-conflicts',
    handler: async () => {
      const registry = getRouteRegistry();
      return {
        conflicts: registry.getConflicts(),
        hasErrors: registry.hasErrors(),
      };
    },
  }
);

// Create Express app
const app = express();
app.use(express.json());

// Register routes with guardrails and analytics (enabled by default)
app.use('/api', registerRoutes(apiRoutes));
app.use(registerRoutes(adminRoutes));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = Number(process.env.PORT ?? 3000);
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('\n📊 Available endpoints:');
  console.log('   API:');
  console.log('     GET    /api/health');
  console.log('     GET    /api/users');
  console.log('     GET    /api/users/:id');
  console.log('     POST   /api/users');
  console.log('     DELETE /api/users/:id');
  console.log('\n   Admin/Monitoring:');
  console.log('     GET /admin/analytics/summary');
  console.log('     GET /admin/analytics/top-routes');
  console.log('     GET /admin/registry/routes');
  console.log('     GET /admin/registry/conflicts');
  console.log('\n');
});

// Log analytics every 30 seconds
const analyticsInterval = setInterval(() => {
  const analytics = getRouteAnalytics();
  const summary = analytics.getSummary();

  console.log('\n📊 Analytics Update');
  console.log('='.repeat(60));
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Error Rate: ${(summary.errorRate * 100).toFixed(2)}%`);
  console.log(`Avg Response Time: ${summary.avgResponseTime.toFixed(2)}ms`);
  console.log(`Requests/sec: ${summary.requestsPerSecond.toFixed(2)}`);
  console.log(`Uptime: ${(summary.uptime / 1000 / 60).toFixed(1)} minutes`);

  if (summary.topRoutes.length > 0) {
    console.log('\n🔥 Top Routes:');
    for (const [i, { route, requests }] of summary.topRoutes.slice(0, 3).entries()) {
      console.log(`  ${i + 1}. ${route}: ${requests} requests`);
    }
  }

  if (summary.slowestRoutes.length > 0) {
    console.log('\n🐌 Slowest Routes:');
    for (const [i, { route, avgDuration }] of summary.slowestRoutes.slice(0, 3).entries()) {
      console.log(`  ${i + 1}. ${route}: ${avgDuration.toFixed(2)}ms avg`);
    }
  }

  console.log('='.repeat(60) + '\n');
}, 30000);

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down...');
  clearInterval(analyticsInterval);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;

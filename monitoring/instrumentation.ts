import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initMonitoring(app?: any) {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new ProfilingIntegration(),
      ...(app ? [new Sentry.Integrations.Express({ app })] : []),
    ],
    beforeSend(event, hint) {
      // Filter out health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
  });

  // Initialize OpenTelemetry
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'https://tempo-us-central.grafana.net/tempo',
    headers: process.env.GRAFANA_USERNAME && process.env.GRAFANA_API_KEY ? {
      Authorization: `Basic ${Buffer.from(
        `${process.env.GRAFANA_USERNAME}:${process.env.GRAFANA_API_KEY}`
      ).toString('base64')}`,
    } : {},
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'nuzantara-backend',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable fs instrumentation to reduce noise
      },
    })],
  });

  sdk.start();

  // Custom Prometheus metrics
  const prometheus = require('prom-client');
  const register = new prometheus.Registry();

  // Enable default metrics
  prometheus.collectDefaultMetrics({ register });

  const httpDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  const httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  const httpErrorsTotal = new prometheus.Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors',
    labelNames: ['method', 'route', 'status'],
  });

  const activeConnections = new prometheus.Gauge({
    name: 'http_active_connections',
    help: 'Number of active HTTP connections',
  });

  register.registerMetric(httpDuration);
  register.registerMetric(httpRequestTotal);
  register.registerMetric(httpErrorsTotal);
  register.registerMetric(activeConnections);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
      .finally(() => process.exit(0));
  });

  return {
    Sentry,
    register,
    httpDuration,
    httpRequestTotal,
    httpErrorsTotal,
    activeConnections,
  };
}

// Middleware to track metrics
export function createMetricsMiddleware(metrics: ReturnType<typeof initMonitoring>) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    metrics.activeConnections.inc();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path || 'unknown';

      metrics.httpDuration.observe(
        { method: req.method, route, status: res.statusCode },
        duration
      );

      metrics.httpRequestTotal.inc({
        method: req.method,
        route,
        status: res.statusCode,
      });

      if (res.statusCode >= 400) {
        metrics.httpErrorsTotal.inc({
          method: req.method,
          route,
          status: res.statusCode,
        });
      }

      metrics.activeConnections.dec();
    });

    next();
  };
}

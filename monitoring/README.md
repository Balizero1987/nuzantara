# Nuzantara Monitoring & Observability Stack

**PATCH-2 Implementation** - Complete monitoring and observability solution for the Nuzantara platform.

## Overview

This monitoring stack provides comprehensive observability with:
- **Distributed Tracing** (OpenTelemetry → Grafana Tempo)
- **Error Tracking** (Sentry with profiling)
- **Metrics Collection** (Prometheus + prom-client)
- **Log Aggregation** (Grafana Loki)
- **Alert Management** (AlertManager with Slack)
- **Health Checks** (Kubernetes-ready endpoints)

## Quick Start

### 1. Install Dependencies

```bash
cd monitoring
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required:
- `GRAFANA_USERNAME` & `GRAFANA_API_KEY`: From Grafana Cloud
- `SENTRY_DSN`: From Sentry project

### 3. Start Monitoring Stack

```bash
npm run start:monitoring   # Start all services
npm run logs:monitoring    # View logs
npm run stop:monitoring    # Stop services
```

## Integration

### Node.js/Express

```typescript
import { initMonitoring, createMetricsMiddleware } from './monitoring/instrumentation';
import healthRouter from './monitoring/health.controller';

const app = express();
const metrics = initMonitoring(app);
(global as any).prometheusRegister = metrics.register;

app.use(createMetricsMiddleware(metrics));
app.use(healthRouter);
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Overall health status |
| `/health/ready` | Kubernetes readiness probe |
| `/health/live` | Kubernetes liveness probe |
| `/health/redis` | Redis health details |
| `/health/database` | Database health details |
| `/metrics` | Prometheus metrics |

## Alerts

Pre-configured alerts for:
- High error rate (>5% warning, >10% critical)
- High response time (P95 > 2s)
- Service down (>1 min)
- High memory/CPU usage
- Low disk space

## Cost

- **Free Tier**: $0/month (Grafana Cloud + Sentry free tiers)
- **Production**: ~$75/month (Grafana Pro $49 + Sentry Team $26)

## Architecture

```
Grafana Cloud (Metrics + Logs + Traces)
    ↑
Grafana Agent
    ↑
App Services → Prometheus → AlertManager → Slack/Email
```

## Documentation

- [INTEGRATION.md](./INTEGRATION.md) - Detailed integration guide
- [example-integration.ts](./example-integration.ts) - Reference implementation

## Support

For issues: GitHub Issues or #monitoring Slack channel

## License

MIT

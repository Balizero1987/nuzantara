# Monitoring Stack Deployment Guide

Complete guide to deploy the PATCH-2 Monitoring & Observability Stack.

## Quick Start (5 minutes)

```bash
cd monitoring
cp .env.example .env
# Edit .env with your Grafana Cloud credentials
./deploy.sh
```

## Prerequisites

- Docker & Docker Compose installed
- Grafana Cloud account (free tier: https://grafana.com/signup)
- Optional: Sentry account (free tier: https://sentry.io/signup)
- Optional: Slack workspace for alerts

## Step-by-Step Deployment

### 1. Get Grafana Cloud Credentials

1. Sign up at https://grafana.com/
2. Create a new stack (or use existing)
3. Go to **Configuration → API Keys**
4. Create new API key with:
   - Role: `MetricsPublisher`, `LogsPublisher`, `TracesPublisher`
   - Copy the **API Key** and **Instance ID**

### 2. Configure Environment

```bash
cd monitoring
cp .env.example .env
nano .env  # or use your preferred editor
```

Required variables:
```bash
GRAFANA_USERNAME=123456  # Your Grafana instance ID
GRAFANA_API_KEY=glc_xxx  # Your Grafana API key
```

Optional (recommended):
```bash
SENTRY_DSN=https://xxx@sentry.io/123456
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

### 3. Deploy Stack

```bash
./deploy.sh
```

This will:
- ✅ Validate environment variables
- ✅ Pull latest Docker images
- ✅ Start 5 monitoring services
- ✅ Verify all services are healthy
- ✅ Display access URLs

### 4. Verify Deployment

**Local Services:**
```bash
# Check Prometheus
curl http://localhost:9090/-/healthy

# Check Node Exporter
curl http://localhost:9100/metrics

# Check cAdvisor
curl http://localhost:8090/healthz

# Check AlertManager
curl http://localhost:9093/-/healthy
```

**Grafana Cloud:**
1. Go to https://grafana.com/
2. Navigate to your stack
3. Check **Explore → Metrics** for incoming data
4. Check **Explore → Logs** for log streams

### 5. Configure Application Metrics

Add monitoring to your Node.js app:

```typescript
// apps/orchestrator/main.ts
import { initMonitoring, createMetricsMiddleware } from '../monitoring/instrumentation';
import healthRouter from '../monitoring/health.controller';

const app = express();

// Initialize monitoring FIRST
const metrics = initMonitoring(app);
(global as any).prometheusRegister = metrics.register;

// Add metrics middleware
app.use(createMetricsMiddleware(metrics));

// Add health endpoints
app.use(healthRouter);

// Your routes...
app.listen(3000);
```

Restart your app and verify metrics:
```bash
curl http://localhost:3000/metrics
curl http://localhost:3000/health
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Grafana Cloud (Free Tier)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Prometheus  │  │     Loki     │  │    Tempo     │ │
│  │  (Metrics)   │  │    (Logs)    │  │   (Traces)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS (Port 443)
                          │
                ┌─────────┴─────────┐
                │  Grafana Agent    │
                │  (Port 12345)     │
                └─────────┬─────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │ Your    │      │ System  │      │Container│
   │ Apps    │      │ Metrics │      │ Metrics │
   │:3000-   │      │ :9100   │      │ :8090   │
   │ 8080    │      │         │      │         │
   └─────────┘      └─────────┘      └─────────┘
        │                 │                 │
        └─────────────────┴─────────────────┘
                          │
                ┌─────────▼─────────┐
                │   Prometheus      │
                │   (Local Store)   │
                │   :9090           │
                └─────────┬─────────┘
                          │
                ┌─────────▼─────────┐
                │  AlertManager     │
                │  → Slack/Email    │
                │  :9093            │
                └───────────────────┘
```

## Services Overview

| Service | Port | Purpose | UI |
|---------|------|---------|-----|
| **Grafana Agent** | 12345 | Collect & forward to Cloud | - |
| **Prometheus** | 9090 | Local metrics storage | http://localhost:9090 |
| **Node Exporter** | 9100 | System metrics (CPU, RAM, disk) | http://localhost:9100/metrics |
| **cAdvisor** | 8090 | Container metrics | http://localhost:8090 |
| **AlertManager** | 9093 | Alert routing | http://localhost:9093 |

## Grafana Dashboards

Import recommended dashboards:

1. Go to Grafana Cloud → Dashboards → Import
2. Import these dashboard IDs:
   - **11159** - Node.js Application Metrics
   - **1860** - Node Exporter Full
   - **893** - Docker Container Metrics
   - **11692** - Redis Dashboard (if using Redis)

## Alert Configuration

### Slack Integration

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Add to `.env`:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/xxx
   ```
3. Restart AlertManager:
   ```bash
   docker-compose -f docker-compose.monitoring.yml restart alertmanager
   ```

### Test Alerts

Trigger a test alert:
```bash
# Simulate high CPU
stress --cpu 8 --timeout 120s

# Check AlertManager
open http://localhost:9093
```

## Troubleshooting

### Issue: Grafana Agent not sending data

**Check logs:**
```bash
docker logs nuzantara-grafana-agent
```

**Common fixes:**
- Verify GRAFANA_USERNAME and GRAFANA_API_KEY in `.env`
- Check network connectivity to Grafana Cloud
- Ensure API key has correct permissions

### Issue: Prometheus not scraping apps

**Check targets:**
```bash
open http://localhost:9090/targets
```

**Common fixes:**
- Ensure apps are exposing `/metrics` endpoint
- Update `host.docker.internal` to correct hostname
- Check firewall rules

### Issue: No metrics in Grafana Cloud

**Verify data flow:**
```bash
# 1. Check Prometheus receiving data
curl http://localhost:9090/api/v1/query?query=up

# 2. Check Grafana Agent config
docker exec nuzantara-grafana-agent cat /etc/agent/agent.yaml

# 3. Check Grafana Agent logs
docker logs nuzantara-grafana-agent | grep -i error
```

### Issue: AlertManager not sending alerts

**Test Slack webhook:**
```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test alert from Nuzantara monitoring"}'
```

## Maintenance

### View Logs
```bash
docker-compose -f docker-compose.monitoring.yml logs -f
docker-compose -f docker-compose.monitoring.yml logs -f grafana-agent
```

### Restart Services
```bash
docker-compose -f docker-compose.monitoring.yml restart
docker-compose -f docker-compose.monitoring.yml restart prometheus
```

### Stop Stack
```bash
docker-compose -f docker-compose.monitoring.yml down
```

### Update Images
```bash
docker-compose -f docker-compose.monitoring.yml pull
docker-compose -f docker-compose.monitoring.yml up -d
```

### Clean Up Data
```bash
# Remove all volumes (WARNING: deletes metrics history)
docker-compose -f docker-compose.monitoring.yml down -v
```

## Performance Impact

| Metric | Impact |
|--------|--------|
| CPU Usage | +2-5% |
| Memory Usage | ~500MB total |
| Disk Usage | ~50-100MB/day |
| Network Usage | ~1-5MB/hour to Grafana Cloud |

## Cost

| Tier | Limits | Cost |
|------|--------|------|
| **Free** | 10k metrics, 50GB logs, 50GB traces | $0/month |
| **Pro** | 100k metrics, 500GB logs, 500GB traces | $49/month |

**Recommendation**: Start with free tier, upgrade when needed.

## Security

- All data sent to Grafana Cloud over HTTPS
- API keys stored in `.env` (never commit!)
- Local Prometheus data stored in Docker volumes
- AlertManager can be password-protected
- Sentry automatically scrubs sensitive data

## Next Steps

1. ✅ Deploy stack locally
2. ✅ Integrate app metrics
3. ✅ Import Grafana dashboards
4. [ ] Set up Slack alerts
5. [ ] Configure Sentry error tracking
6. [ ] Create custom dashboards for business metrics
7. [ ] Set up on-call rotation
8. [ ] Document runbooks for common alerts

## Support

- GitHub Issues: https://github.com/YOUR-ORG/nuzantara/issues
- Grafana Docs: https://grafana.com/docs/
- Prometheus Docs: https://prometheus.io/docs/

---

**Deployed by**: Claude W2 (PATCH-2)
**Last Updated**: 2025-10-29

# Grafana + Loki Observability Stack

Production monitoring and logging for NUZANTARA.

## Quick Start (Grafana Cloud - Free Tier)

### Step 1: Create Grafana Cloud Account

1. Go to https://grafana.com/auth/sign-up
2. Select **Free Forever** plan:
   - 50GB logs (14-day retention)
   - 10K metrics series
   - 50GB traces
   - 3 users
   - **Cost: $0/month**

3. Create stack: `nuzantara-prod`

### Step 2: Get Credentials

Copy from Grafana Cloud:
- Loki URL: `https://logs-xxx.grafana.net`
- User ID
- Generate API Key

### Step 3: Setup Winston-Loki

**Install**:
```bash
cd apps/backend-ts
npm install winston-loki
```

**Update logger.ts**:
```typescript
import LokiTransport from 'winston-loki';

const transports: any[] = [
  new winston.transports.Console()
];

if (process.env.GRAFANA_LOKI_URL) {
  transports.push(
    new LokiTransport({
      host: process.env.GRAFANA_LOKI_URL,
      basicAuth: `${process.env.GRAFANA_LOKI_USER}:${process.env.GRAFANA_API_KEY}`,
      labels: { service: 'backend-ts', env: 'production' },
      json: true,
      batching: true,
      interval: 5
    })
  );
}
```

### Step 4: Railway Environment

```env
GRAFANA_LOKI_URL=https://logs-xxx.grafana.net
GRAFANA_LOKI_USER=xxxxx
GRAFANA_API_KEY=glc_xxx
```

## Dashboards

See full guide at `/observability/GRAFANA_LOKI_SETUP.md`

## Cost

Free tier: $0/month (50GB logs)

Estimated usage: 27GB/month ✅

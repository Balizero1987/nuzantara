# NUZANTARA Deployment & Infrastructure

**Version:** 5.2.0  
**Last Updated:** 2025-11-07

---

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│                   CLOUDFLARE (CDN/Edge)                  │
│  • Pages (Frontend)                                     │
│  • Workers (Proxy)                                      │
│  • R2 (Storage)                                         │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                    FLY.IO (Backend)                      │
│  ┌────────────────────┐    ┌──────────────────────┐   │
│  │  Backend-TS        │    │  Backend-RAG         │   │
│  │  nuzantara-backend │    │  nuzantara-rag       │   │
│  │  Region: sin       │    │  Region: sin         │   │
│  │  Port: 8080        │    │  Port: 8000          │   │
│  │  1GB RAM, 1 CPU    │    │  2GB RAM, 2 CPUs     │   │
│  └────────────────────┘    └──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    DATABASES                             │
│  • PostgreSQL (Fly.io Postgres)                        │
│  • Redis (Upstash / Fly.io Redis)                      │
│  • ChromaDB (Fly.io Volume Mount)                      │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Environments

### Production

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://nuzantara.pages.dev | 🟢 Live |
| Backend-TS | https://nuzantara-backend.fly.dev | 🟢 Live |
| Backend-RAG | https://nuzantara-rag.fly.dev | 🟢 Live |

### Staging

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://staging.nuzantara.pages.dev | 🟡 Optional |
| Backend-TS | https://nuzantara-backend-staging.fly.dev | 🟡 Optional |
| Backend-RAG | https://nuzantara-rag-staging.fly.dev | 🟡 Optional |

---

## Fly.io Deployment

### Backend-RAG (fly.toml)

```toml
app = 'nuzantara-rag'
primary_region = 'sin'  # Singapore
kill_signal = 'SIGTERM'
kill_timeout = '30s'

[build]
  dockerfile = 'Dockerfile'

[deploy]
  strategy = 'rolling'

[env]
  CHROMA_DB_PATH = '/data/chroma_db_FULL_deploy'
  EMBEDDING_DIMENSIONS = '1536'
  EMBEDDING_MODEL = 'text-embedding-3-small'
  EMBEDDING_PROVIDER = 'openai'
  NODE_ENV = 'production'
  PORT = '8000'

[[mounts]]
  source = 'chroma_data_complete'
  destination = '/data/chroma_db_FULL_deploy'

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  processes = ['app']

  [[http_service.checks]]
    interval = '30s'  # Fixed: was 30000s (8.3 hours)
    timeout = '5s'    # Fixed: was 5000s (83 minutes)
    grace_period = '1m0s'
    method = 'GET'
    path = '/health'

[[vm]]
  memory = '2gb'
  cpu_kind = 'shared'
  cpus = 2
```

### Deploy Commands

```bash
# Deploy backend-rag
fly deploy --config fly.toml --app nuzantara-rag

# Deploy with specific Dockerfile
fly deploy --config fly.toml --dockerfile Dockerfile.python

# View logs
fly logs -a nuzantara-rag

# SSH into machine
fly ssh console -a nuzantara-rag

# Scale resources
fly scale vm shared-cpu-2x --memory 4096 -a nuzantara-rag

# Check status
fly status -a nuzantara-rag
```

### Secrets Management

```bash
# Set secrets
fly secrets set ANTHROPIC_API_KEY=sk-ant-... -a nuzantara-rag
fly secrets set OPENAI_API_KEY=sk-... -a nuzantara-rag
fly secrets set DATABASE_URL=postgresql://... -a nuzantara-rag

# List secrets
fly secrets list -a nuzantara-rag

# Unset secret
fly secrets unset OLD_SECRET -a nuzantara-rag
```

---

## Cloudflare Deployment

### Pages (Frontend)

```bash
# Deploy to Cloudflare Pages
npx wrangler pages publish apps/webapp --project-name nuzantara

# Or via GitHub integration (automatic)
git push origin main  # Triggers auto-deployment
```

### Workers (Proxy)

```toml
# wrangler.toml
name = "nuzantara-proxy"
main = "src/index.js"
compatibility_date = "2025-01-01"

[vars]
BACKEND_TS_URL = "https://nuzantara-backend.fly.dev"
BACKEND_RAG_URL = "https://nuzantara-rag.fly.dev"

[[routes]]
  pattern = "api.nuzantara.com/*"
  zone_name = "nuzantara.com"
```

```bash
# Deploy worker
npx wrangler deploy

# View logs
npx wrangler tail

# Test locally
npx wrangler dev
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:e2e

  deploy-backend-rag:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions@1.3
        with:
          args: "deploy --config fly.toml --app nuzantara-rag"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: pages publish apps/webapp --project-name nuzantara
```

---

## Database Backups

### PostgreSQL Backups

```bash
# Manual backup
fly postgres db backup -a nuzantara-postgres

# Automated backups (configured)
# - Daily backups (retained for 7 days)
# - Weekly backups (retained for 4 weeks)

# Restore from backup
fly postgres db restore <backup-id> -a nuzantara-postgres
```

### ChromaDB Backups

```bash
# Backup ChromaDB data
fly ssh console -a nuzantara-rag
tar -czf /tmp/chroma_backup.tar.gz /data/chroma_db_FULL_deploy
exit

# Download backup
fly ssh sftp get /tmp/chroma_backup.tar.gz -a nuzantara-rag

# Upload backup to R2 (via script)
aws s3 cp chroma_backup.tar.gz s3://nuzantara-backups/chromadb/
```

---

## Monitoring

### Health Checks

```bash
# Backend-TS
curl https://nuzantara-backend.fly.dev/health

# Backend-RAG
curl https://nuzantara-rag.fly.dev/health

# Expected response
{
  "status": "ok",
  "version": "5.2.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "chromadb": "connected"
  }
}
```

### Metrics

```bash
# Performance metrics
curl https://nuzantara-backend.fly.dev/performance

# Fly.io metrics
fly metrics -a nuzantara-rag
```

### Logs

```bash
# Real-time logs
fly logs -a nuzantara-rag --follow

# Filter by level
fly logs -a nuzantara-rag | grep ERROR

# Last 100 lines
fly logs -a nuzantara-rag --lines 100
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale to multiple machines
fly scale count 2 -a nuzantara-rag

# Auto-scaling configuration (fly.toml)
[http_service]
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 3
```

### Vertical Scaling

```bash
# Increase memory
fly scale vm shared-cpu-2x --memory 4096 -a nuzantara-rag

# Change CPU
fly scale vm dedicated-cpu-2x -a nuzantara-rag
```

---

## Disaster Recovery

### RTO/RPO Targets

| Service | RTO | RPO |
|---------|-----|-----|
| Backend-TS | 15 minutes | 1 hour |
| Backend-RAG | 30 minutes | 1 hour |
| PostgreSQL | 1 hour | 24 hours |
| ChromaDB | 2 hours | 24 hours |

### Recovery Procedures

**Scenario 1: Backend service down**

```bash
# Check status
fly status -a nuzantara-rag

# Restart machine
fly machine restart <machine-id> -a nuzantara-rag

# Redeploy if needed
fly deploy --config fly.toml --app nuzantara-rag
```

**Scenario 2: Database corruption**

```bash
# Stop backend services
fly scale count 0 -a nuzantara-rag

# Restore from backup
fly postgres db restore <backup-id> -a nuzantara-postgres

# Restart backend services
fly scale count 1 -a nuzantara-rag
```

---

## Cost Optimization

### Current Monthly Costs

| Service | Cost (USD) |
|---------|------------|
| Fly.io Backend-TS | ~$5 |
| Fly.io Backend-RAG | ~$10 |
| Fly.io PostgreSQL | ~$15 |
| Fly.io Redis | ~$5 |
| Cloudflare Pages | Free |
| Cloudflare R2 | ~$2 |
| **Total** | **~$37/month** |

### Optimization Strategies

1. **Auto-stop unused machines**
2. **Use shared CPUs for non-critical services**
3. **Optimize Docker images (multi-stage builds)**
4. **Cache expensive operations**
5. **Use CDN for static assets**

---

## Security

### SSL/TLS

- **Automatic:** Fly.io and Cloudflare provide automatic SSL
- **Certificate Renewal:** Automatic via Let's Encrypt
- **Force HTTPS:** Enabled on all services

### Firewall

```bash
# Fly.io private networking
fly wireguard create personal nuzantara us 1

# Restrict database access
fly postgres attach --postgres-app nuzantara-postgres --app nuzantara-rag
```

### Security Headers

```javascript
// Cloudflare Worker
async function handleRequest(request) {
  const response = await fetch(request);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
```

---

## Troubleshooting

### Common Issues

**Issue:** Deploy fails with "out of memory"
```bash
# Solution: Increase memory allocation
fly scale vm shared-cpu-2x --memory 2048 -a nuzantara-rag
```

**Issue:** Health checks failing
```bash
# Solution: Check health check configuration in fly.toml
# Ensure interval/timeout are reasonable (30s/5s not 30000s/5000s!)
```

**Issue:** Cannot connect to database
```bash
# Solution: Check database status
fly status -a nuzantara-postgres

# Restart if needed
fly machine restart <machine-id> -a nuzantara-postgres
```

---

## Contact & Support

**Infrastructure Team:**
- DevOps: devops@balizero.com
- Slack: #nuzantara-infra

**External Support:**
- Fly.io: https://fly.io/docs/support/
- Cloudflare: https://support.cloudflare.com/

---

**For more information:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [ONBOARDING.md](./ONBOARDING.md) - Developer onboarding
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development practices

**Version:** 5.2.0

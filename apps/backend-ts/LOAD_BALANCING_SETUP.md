# Quick Start: Load Balancing Setup

## 🚀 Deployment Steps

### 1. Set Environment Variables

```bash
# Enable features gradually
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER=false
flyctl secrets set FF_ENABLE_ENHANCED_POOLING=false
flyctl secrets set FF_ENABLE_PRIORITIZED_RATE_LIMIT=false
flyctl secrets set FF_ENABLE_AUDIT_TRAIL=false

# Database pooling (when enabled)
flyctl secrets set DB_POOL_MAX=20
flyctl secrets set DB_POOL_MIN=5
```

### 2. Deploy Configuration

```bash
cd apps/backend-ts
flyctl deploy
```

### 3. Verify Health Checks

```bash
curl https://nuzantara-backend.fly.dev/health
curl https://nuzantara-backend.fly.dev/health/detailed
```

### 4. Enable Features Gradually

```bash
# Start with 10% rollout
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER=true
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE=10

# Monitor for 24 hours, then increase to 50%, then 100%
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE=50
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE=100
```

### 5. Monitor Scaling

```bash
flyctl status
flyctl metrics
```

## 🔍 Verification

Check that:
- [ ] Multiple instances are running (`flyctl status`)
- [ ] Health checks are passing (`/health`)
- [ ] Metrics are available (`/metrics`)
- [ ] No errors in logs (`flyctl logs`)

## ⚠️ Troubleshooting

### Health Check Failing

1. Check logs: `flyctl logs`
2. Verify endpoints are accessible
3. Check database connectivity
4. Review circuit breaker state

### High Error Rate

1. Check circuit breaker metrics
2. Review connection pool utilization
3. Check external service availability
4. Review rate limiting logs

### Scaling Issues

1. Verify scaling configuration in fly.toml
2. Check CPU/memory metrics
3. Review latency metrics
4. Adjust thresholds if needed




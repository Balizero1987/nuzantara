# Deployment Guide - Load Balancing Setup

## 🚀 Quick Deploy

```bash
cd apps/backend-ts
flyctl deploy
```

## ⚙️ Configuration Steps

### 1. Set Auto-scaling (optional but recommended)

```bash
# Set scaling limits
flyctl autoscale set min=2 max=10

# Configure CPU-based scaling
flyctl autoscale set cpu=70

# Configure memory-based scaling  
flyctl autoscale set memory=80
```

### 2. Enable Features Gradually (optional)

**Phase 1: Monitor Mode (10% rollout)**
```bash
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER=true
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE=10

flyctl secrets set FF_ENABLE_ENHANCED_POOLING=true
flyctl secrets set FF_ENABLE_ENHANCED_POOLING_PERCENTAGE=10
```

**Phase 2: Gradual Increase (50% rollout)**
```bash
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE=50
flyctl secrets set FF_ENABLE_ENHANCED_POOLING_PERCENTAGE=50
```

**Phase 3: Full Rollout (100%)**
```bash
flyctl secrets set FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE=100
flyctl secrets set FF_ENABLE_ENHANCED_POOLING_PERCENTAGE=100
flyctl secrets set FF_ENABLE_PRIORITIZED_RATE_LIMIT=true
flyctl secrets set FF_ENABLE_AUDIT_TRAIL=true
```

### 3. Verify Deployment

```bash
# Check status
flyctl status

# View logs
flyctl logs

# Check health
curl https://nuzantara-backend.fly.dev/health
curl https://nuzantara-backend.fly.dev/health/detailed

# Check metrics
curl https://nuzantara-backend.fly.dev/metrics
```

## 🔍 Monitoring

```bash
# Real-time metrics
flyctl metrics

# Machine status
flyctl status

# SSH to instance
flyctl ssh console
```

## 🔄 Rollback (if needed)

```bash
# Disable all features
flyctl secrets unset FF_ENABLE_CIRCUIT_BREAKER
flyctl secrets unset FF_ENABLE_ENHANCED_POOLING
flyctl secrets unset FF_ENABLE_PRIORITIZED_RATE_LIMIT
flyctl secrets unset FF_ENABLE_AUDIT_TRAIL

# Scale down if needed
flyctl scale count 1

# Deploy previous version
flyctl releases
flyctl releases rollback <release-id>
```

## ✅ Post-Deployment Checklist

- [ ] Health checks passing
- [ ] Multiple instances running
- [ ] Metrics endpoint accessible
- [ ] No errors in logs
- [ ] Response times acceptable
- [ ] Auto-scaling configured
- [ ] Features enabled gradually (if desired)




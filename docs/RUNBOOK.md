# ZANTARA Operations Runbook

**Quick Reference Guide for Production Operations**

---

## Quick Commands

```bash
# Check production status
flyctl status -a nuzantara-core

# View live logs
flyctl logs -a nuzantara-core --follow

# Check health
curl https://nuzantara-core.fly.dev/health

# Emergency rollback
gh workflow run rollback.yml -f environment=production -f confirmation=ROLLBACK -f reason="<description>"

# Manual database backup
./scripts/disaster-recovery/backup-database.sh

# View recent deployments
flyctl releases -a nuzantara-core

# Scale application
flyctl scale count 3 -a nuzantara-core

# Check metrics
curl https://nuzantara-core.fly.dev/metrics
```

---

## Incident Response Procedures

### P1 - Production Down (Critical)

**Symptoms:** Service completely unavailable, health checks failing

**Immediate Actions (< 5 minutes):**

1. **Verify the issue:**
   ```bash
   curl -v https://nuzantara-core.fly.dev/health
   flyctl status -a nuzantara-core
   ```

2. **Check recent changes:**
   ```bash
   flyctl releases -a nuzantara-core | head -5
   ```

3. **If recent deployment, rollback immediately:**
   ```bash
   gh workflow run rollback.yml -f environment=production -f confirmation=ROLLBACK -f reason="P1: Service down"
   ```

4. **If not deployment-related:**
   ```bash
   # Check infrastructure
   flyctl status -a nuzantara-core

   # Check logs for errors
   flyctl logs -a nuzantara-core --follow | grep -i error

   # Restart if necessary
   flyctl apps restart nuzantara-core
   ```

5. **Notify team immediately:** Post in #zantara-ops

### P2 - Degraded Performance

**Symptoms:** Slow responses, high error rates (> 5%)

**Actions (< 15 minutes):**

1. **Check metrics:**
   ```bash
   curl https://nuzantara-core.fly.dev/metrics | grep -E "(http_request_duration|http_errors)"
   ```

2. **Check resource usage:**
   ```bash
   flyctl status -a nuzantara-core
   flyctl scale show -a nuzantara-core
   ```

3. **Scale if needed:**
   ```bash
   flyctl scale count 5 -a nuzantara-core  # Increase instances
   flyctl scale memory 1024 -a nuzantara-core  # Increase memory
   ```

4. **Check database:**
   ```bash
   # Connect and check connections
   flyctl postgres connect -a <postgres-app>
   SELECT count(*) FROM pg_stat_activity;
   ```

5. **Consider rollback if performance doesn't improve**

### P3 - Minor Issues

**Symptoms:** Individual feature broken, low error rate (< 2%)

**Actions (< 1 hour):**

1. Create incident ticket
2. Investigate root cause
3. Fix in develop branch
4. Deploy fix via normal process

---

## Database Operations

### Create Backup

```bash
# Automated backup
./scripts/disaster-recovery/backup-database.sh

# Manual backup via Fly.io
flyctl postgres backup create -a <postgres-app>
```

### Restore from Backup

```bash
# DANGER: This will replace all data!
./scripts/disaster-recovery/restore-database.sh <backup-file> --force
```

### Run Migration

```bash
# Via Fly.io SSH
flyctl ssh console -a nuzantara-core
cd /app
npm run migrate
```

### Check Database Health

```bash
# Connection test
curl https://nuzantara-core.fly.dev/health | jq .database

# Query performance
flyctl postgres connect -a <postgres-app>
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## Monitoring & Alerts

### Key Metrics

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 5% | Investigate immediately |
| Response time (p95) | > 2s | Scale or optimize |
| Memory usage | > 90% | Scale memory |
| CPU usage | > 80% | Scale instances |
| Database connections | > 80% of max | Scale DB or optimize queries |

### Checking Metrics

```bash
# Prometheus metrics
curl https://nuzantara-core.fly.dev/metrics

# Specific metric
curl https://nuzantara-core.fly.dev/metrics | grep http_requests_total
```

---

## Common Operations

### Scaling

```bash
# Scale instances
flyctl scale count 3 -a nuzantara-core

# Scale memory
flyctl scale memory 1024 -a nuzantara-core

# Scale VM size
flyctl scale vm shared-cpu-2x -a nuzantara-core
```

### Restart Application

```bash
# Graceful restart
flyctl apps restart nuzantara-core

# Force restart
flyctl apps restart nuzantara-core --force
```

### Update Environment Variables

```bash
# Set secret
flyctl secrets set API_KEY=<value> -a nuzantara-core

# List secrets
flyctl secrets list -a nuzantara-core

# Remove secret
flyctl secrets unset API_KEY -a nuzantara-core
```

### Access Application Console

```bash
# SSH into running instance
flyctl ssh console -a nuzantara-core

# Run command
flyctl ssh console -a nuzantara-core -C "npm run migrate"
```

---

## Troubleshooting Guide

### Issue: High Memory Usage

```bash
# 1. Check current usage
flyctl status -a nuzantara-core

# 2. Check for memory leaks in logs
flyctl logs -a nuzantara-core | grep -i "memory"

# 3. Restart application
flyctl apps restart nuzantara-core

# 4. If persistent, scale memory
flyctl scale memory 1024 -a nuzantara-core
```

### Issue: Database Connection Errors

```bash
# 1. Check database status
flyctl status -a <postgres-app>

# 2. Check connection string
flyctl secrets list -a nuzantara-core | grep DATABASE

# 3. Test connection
flyctl ssh console -a nuzantara-core
node -e "const pg = require('pg'); const client = new pg.Client(process.env.DATABASE_URL); client.connect().then(() => console.log('Connected!')).catch(console.error);"

# 4. Check max connections
flyctl postgres connect -a <postgres-app>
SHOW max_connections;
SELECT count(*) FROM pg_stat_activity;
```

### Issue: Slow API Responses

```bash
# 1. Check response times
curl -w "\nTime: %{time_total}s\n" https://nuzantara-core.fly.dev/health

# 2. Check application logs
flyctl logs -a nuzantara-core | grep -i "slow"

# 3. Check database query performance
# Connect to DB and analyze slow queries

# 4. Scale if needed
flyctl scale count 5 -a nuzantara-core
```

### Issue: Deployment Stuck

```bash
# 1. Check deployment status
gh run list --limit 5

# 2. View logs
gh run view --log

# 3. Cancel if stuck
gh run cancel <run-id>

# 4. Re-trigger deployment
git commit --allow-empty -m "chore: retrigger deployment"
git push
```

---

## Security Incidents

### Suspected Security Breach

1. **Immediately:** Contact security team
2. **Rotate all secrets:**
   ```bash
   flyctl secrets set JWT_SECRET=<new-secret> -a nuzantara-core
   flyctl secrets set API_KEYS=<new-keys> -a nuzantara-core
   ```
3. **Review access logs:**
   ```bash
   flyctl logs -a nuzantara-core | grep -E "(401|403)"
   ```
4. **Block suspicious IPs** (if applicable)
5. **Document incident** in security log

### API Key Leak

1. **Revoke compromised keys immediately**
2. **Generate new keys**
3. **Update in GitHub Secrets and Fly.io**
4. **Monitor for unauthorized access**
5. **Notify affected users if applicable**

---

## Maintenance Windows

### Scheduled Maintenance

```bash
# 1. Announce maintenance
# Post in #zantara-ops 24 hours before

# 2. Create database backup
./scripts/disaster-recovery/backup-database.sh

# 3. Put app in maintenance mode (if available)
flyctl secrets set MAINTENANCE_MODE=true -a nuzantara-core

# 4. Perform maintenance

# 5. Exit maintenance mode
flyctl secrets unset MAINTENANCE_MODE -a nuzantara-core

# 6. Verify everything works
curl https://nuzantara-core.fly.dev/health
```

---

## Contact Information

| Issue Type | Contact | Method |
|------------|---------|--------|
| Production Down | On-call Engineer | Slack: #zantara-ops (mention @oncall) |
| Deployment Issues | DevOps Team | Slack: #zantara-ops |
| Database Issues | Database Admin | TBD |
| Security Issues | Security Team | TBD |
| All Other Issues | Team Lead | @Balizero1987 |

---

## Useful Links

- **Production Dashboard:** https://fly.io/apps/nuzantara-core
- **Staging Dashboard:** https://fly.io/apps/nuzantara-staging
- **GitHub Actions:** https://github.com/Balizero1987/nuzantara/actions
- **Metrics:** https://nuzantara-core.fly.dev/metrics
- **Health Check:** https://nuzantara-core.fly.dev/health

---

**Keep this runbook updated! Last reviewed: 2025-11-06**

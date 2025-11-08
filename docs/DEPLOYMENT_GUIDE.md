# ZANTARA Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-06
**Maintainer:** DevOps Team

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment Process](#deployment-process)
5. [Rollback Procedure](#rollback-procedure)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Contacts](#emergency-contacts)

---

## Overview

ZANTARA uses a fully automated CI/CD pipeline with zero-downtime deployments to Fly.io. The deployment workflow includes:

- **Automated CI testing** on every PR
- **Staging deployment** on merge to `staging` branch
- **Production deployment** with blue-green strategy on merge to `main`
- **Automated rollback** capabilities
- **Health checks** and smoke tests
- **Monitoring** and alerting

### Architecture

```
GitHub → CI Pipeline → Build & Test → Deploy to Staging → Manual Approval → Deploy to Production
```

---

## Prerequisites

### Required Access

- [ ] GitHub repository access (write permissions)
- [ ] Fly.io account with production access
- [ ] Access to GitHub Secrets
- [ ] Slack notification channel (optional)

### Required Tools (for manual operations)

```bash
# Node.js 20+
node --version

# Fly.io CLI
flyctl version

# GitHub CLI (for triggering workflows)
gh --version

# Docker (for local testing)
docker --version
```

### Environment Variables

Required secrets in GitHub Actions:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `FLY_API_TOKEN` | Fly.io API token | Staging, Production |
| `CODECOV_TOKEN` | Codecov API token | Code coverage |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Notifications |
| `PRODUCTION_DATABASE_URL` | Production DB connection string | Backups |
| `BACKUP_ENCRYPTION_KEY` | Encryption key for backups | DR |

---

## Environment Setup

### 1. GitHub Secrets Configuration

```bash
# Navigate to: Settings → Secrets and variables → Actions

# Add repository secrets:
gh secret set FLY_API_TOKEN
gh secret set CODECOV_TOKEN
gh secret set SLACK_WEBHOOK_URL
gh secret set PRODUCTION_DATABASE_URL
gh secret set BACKUP_ENCRYPTION_KEY
```

### 2. Fly.io Environment Variables

**Staging Environment:**

```bash
flyctl secrets set -a nuzantara-staging \
  DATABASE_URL="<staging-db-url>" \
  REDIS_URL="<staging-redis-url>" \
  JWT_SECRET="<staging-jwt-secret>" \
  NODE_ENV="staging" \
  LOG_LEVEL="info"
```

**Production Environment:**

```bash
flyctl secrets set -a nuzantara-core \
  DATABASE_URL="<production-db-url>" \
  REDIS_URL="<production-redis-url>" \
  JWT_SECRET="<production-jwt-secret>" \
  NODE_ENV="production" \
  LOG_LEVEL="warn"
```

### 3. Local Development Setup

```bash
# Clone repository
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara

# Install dependencies
npm ci --legacy-peer-deps

# Setup pre-commit hooks
npm install -g pre-commit
pre-commit install

# Start local development environment
docker-compose up -d
```

---

## Deployment Process

### Automated Deployment (Recommended)

#### To Staging

```bash
# 1. Merge PR to staging branch
git checkout staging
git merge develop
git push origin staging

# 2. GitHub Actions automatically:
#    - Runs CI tests
#    - Builds Docker images
#    - Deploys to Fly.io staging
#    - Runs smoke tests
#    - Sends notifications

# 3. Verify deployment
curl https://nuzantara-staging.fly.dev/health
```

#### To Production

```bash
# 1. Ensure staging is stable and tested
# 2. Merge staging to main
git checkout main
git merge staging
git push origin main

# 3. Monitor GitHub Actions workflow
#    - Pre-flight checks
#    - Database backup
#    - Build production images
#    - Blue-green deployment
#    - Health checks
#    - Traffic switching

# 4. Manual approval required
#    → Go to GitHub Actions
#    → Review deployment
#    → Click "Approve" button

# 5. Monitor deployment
flyctl logs -a nuzantara-core
```

### Manual Deployment (Emergency Only)

```bash
# Only use if GitHub Actions is unavailable

# 1. Build locally
cd apps/backend-ts
docker build -f ../../docker/backend/Dockerfile -t zantara-backend:manual .

# 2. Deploy to Fly.io
flyctl deploy --app nuzantara-core --local-only

# 3. Verify
curl https://nuzantara-core.fly.dev/health
```

---

## Rollback Procedure

### Automated Rollback (Recommended)

```bash
# 1. Trigger rollback workflow
gh workflow run rollback.yml \
  -f environment=production \
  -f reason="High error rate detected" \
  -f confirmation=ROLLBACK

# 2. Monitor rollback
gh run watch

# 3. Verify service is stable
curl https://nuzantara-core.fly.dev/health
```

### Manual Rollback (Emergency)

```bash
# 1. List recent releases
flyctl releases -a nuzantara-core

# 2. Rollback to previous version
flyctl releases rollback -a nuzantara-core

# 3. Verify
flyctl status -a nuzantara-core
curl https://nuzantara-core.fly.dev/health
```

---

## Troubleshooting

### Deployment Fails at CI Stage

**Symptoms:** Tests failing, lint errors, security vulnerabilities

**Solution:**
```bash
# 1. Check CI logs
gh run view --log-failed

# 2. Run tests locally
cd apps/backend-ts
npm run test

# 3. Fix issues and push
git add .
git commit -m "fix: resolve CI failures"
git push
```

### Deployment Fails at Build Stage

**Symptoms:** Docker build errors, dependency issues

**Solution:**
```bash
# 1. Test Docker build locally
docker build -f docker/backend/Dockerfile apps/backend-ts

# 2. Check for dependency conflicts
cd apps/backend-ts
npm install --legacy-peer-deps

# 3. Clear Docker cache if needed
docker builder prune --all
```

### Health Check Failures

**Symptoms:** Deployment succeeds but health checks fail

**Solution:**
```bash
# 1. Check application logs
flyctl logs -a nuzantara-core

# 2. Check environment variables
flyctl secrets list -a nuzantara-core

# 3. Test health endpoint
curl -v https://nuzantara-core.fly.dev/health

# 4. If critical, rollback immediately
gh workflow run rollback.yml -f environment=production -f confirmation=ROLLBACK
```

### Database Migration Issues

**Symptoms:** Migration fails during deployment

**Solution:**
```bash
# 1. Check migration logs in CI

# 2. Test migration locally
docker-compose up -d postgres
npm run migrate

# 3. If migration is stuck, manually fix:
flyctl ssh console -a nuzantara-core
# Then run migration commands manually

# 4. For data loss prevention:
./scripts/disaster-recovery/backup-database.sh
```

### High Error Rates After Deployment

**Symptoms:** Increased 5xx errors, slow response times

**Immediate Actions:**
1. **Monitor:** Check metrics at `/metrics` endpoint
2. **Assess:** Review error logs: `flyctl logs -a nuzantara-core | grep ERROR`
3. **Decide:**
   - Minor issues → Monitor closely
   - Critical issues → Rollback immediately

```bash
# Emergency rollback
gh workflow run rollback.yml \
  -f environment=production \
  -f reason="High error rate: 15% 5xx errors" \
  -f confirmation=ROLLBACK
```

---

## Monitoring & Health Checks

### Real-Time Monitoring

```bash
# View live logs
flyctl logs -a nuzantara-core --follow

# Check application status
flyctl status -a nuzantara-core

# View metrics
curl https://nuzantara-core.fly.dev/metrics
```

### Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/health` | Basic health check | `200 OK` |
| `/metrics` | Prometheus metrics | `200 OK` with metrics |
| `/` | API root | Varies by implementation |

### Key Metrics to Monitor

- **HTTP Request Duration:** Should be < 500ms (p95)
- **Error Rate:** Should be < 1%
- **Active Connections:** Monitor for spikes
- **Memory Usage:** Should stay < 80% of allocated
- **CPU Usage:** Should stay < 70%

---

## Emergency Contacts

| Role | Contact | When to Contact |
|------|---------|-----------------|
| **On-Call Engineer** | Slack: #zantara-ops | Any production issues |
| **DevOps Lead** | @Balizero1987 | Deployment failures |
| **Database Admin** | TBD | Database migration issues |
| **Security Team** | TBD | Security incidents |

---

## Post-Deployment Checklist

After every production deployment:

- [ ] Health checks pass (5 minutes monitoring)
- [ ] Smoke tests completed
- [ ] Error rates normal (< 1%)
- [ ] Response times acceptable (< 500ms p95)
- [ ] Database connections stable
- [ ] No critical errors in logs
- [ ] Slack notification sent
- [ ] Deployment recorded in GitHub releases
- [ ] Team notified in Slack

---

## Best Practices

1. **Always deploy to staging first**
2. **Never skip CI checks**
3. **Monitor deployments for 30 minutes**
4. **Keep database backups current**
5. **Test rollback procedure regularly**
6. **Document all changes in CHANGELOG.md**
7. **Use feature flags for risky changes**
8. **Communicate with team before production deployments**

---

## Appendix: Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Staging deployment successful
- [ ] Database migrations tested
- [ ] Team notified
- [ ] Database backup created

**During Deployment:**
- [ ] Monitor GitHub Actions workflow
- [ ] Review deployment logs
- [ ] Approve production deployment
- [ ] Monitor health checks

**Post-Deployment:**
- [ ] Verify all endpoints
- [ ] Check error rates
- [ ] Monitor for 30 minutes
- [ ] Update documentation
- [ ] Send notification

---

**For questions or issues, contact the DevOps team via Slack: #zantara-ops**

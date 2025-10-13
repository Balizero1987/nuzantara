# Deploy Webapp Handover

> **What This Tracks**: Webapp deployment to GitHub Pages (auto-sync system)
> **Created**: 2025-10-05 by sonnet-4.5_m2

## Current State

**Deployment Method**: GitHub Actions auto-sync
**Live URL**: https://zantara.balizero.com/
**Source**: Monorepo `apps/webapp/` → GitHub repo `zantara_webapp` → GitHub Pages
**Status**: ✅ Active (auto-sync on every push)

**Workflow**: `.github/workflows/sync-webapp-to-pages.yml`
**Last Deploy**: 2025-10-04 23:49:53 UTC
**Source Commit**: f91c099

---

## History

### 2025-10-05 00:05 (Auto-sync system setup) [sonnet-4.5_m2]

**Problem Identified**:
- Webapp repo `zantara_webapp` was ARCHIVED (read-only)
- Manual sync required for every webapp update
- Webapp appeared outdated (2 days behind)

**Solution Implemented**:
- Created GitHub Action for auto-sync
- Unarchived target repo
- Setup GitHub token (WEBAPP_DEPLOY_TOKEN)
- Manual sync executed successfully

**Changed**:
- `.github/workflows/sync-webapp-to-pages.yml` (new) - Auto-sync workflow
- `.github/workflows/WEBAPP_SYNC_SETUP.md` (new) - Setup guide
- `scripts/sync-webapp-manual.sh` (new) - Manual backup sync
- `.claude/WEBAPP_DEPLOYMENT_ANALYSIS.md` (new) - Analysis + solutions

**Deployed**:
- Webapp synced from commit f91c099
- Live on https://zantara.balizero.com/
- Deploy time: 3-4 min (sync 30s + GitHub Pages build 2-3min)

**How It Works**:
```
1. Edit apps/webapp/index.html
2. git commit + push to main
3. GitHub Action triggers (sync-webapp-to-pages.yml)
4. Syncs to zantara_webapp repo
5. GitHub Pages deploys
6. Live on zantara.balizero.com (3-4 min total)
```

**Manual Sync (Backup)**:
```bash
bash scripts/sync-webapp-manual.sh
# Use if auto-sync workflow fails
```

**Related**:
→ Full session: `.claude/diaries/2025-10-05_sonnet-4.5_m2.md`
→ Analysis: `.claude/WEBAPP_DEPLOYMENT_ANALYSIS.md`
→ Status: `.claude/DEPLOYMENT_STATUS_REPORT.md`

---

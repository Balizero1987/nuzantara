# GitHub Actions Workflows

This directory contains automated workflows for NUZANTARA project.

## 📋 Workflows

### 1. Deploy Webapp (`deploy-webapp.yml`)

**Triggers:**
- Push to `main` branch with changes in `apps/webapp/**`
- Manual trigger via GitHub Actions UI

**What it does:**
- Copies `apps/webapp/` content to deployment directory
- Uploads to GitHub Pages artifact
- Deploys to GitHub Pages
- Creates deployment summary

**Status:** ✅ Professional deployment pipeline

**URL:** https://zantara.balizero.com

### 2. Deploy Backend (`deploy-backend.yml`)

**Triggers:**
- Push to `main` branch with changes in `apps/backend-ts/**`
- Manual trigger via GitHub Actions UI

**What it does:**
- Verifies TypeScript files
- Notifies about Railway auto-deployment
- Provides monitoring links

**Status:** ℹ️ Informational (Railway handles actual deployment)

**URL:** https://ts-backend-production-568d.up.railway.app

### 3. Integration Tests (`test-integration.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests
- Manual trigger via GitHub Actions UI

**What it does:**
- Tests backend health endpoint
- Tests warmup service
- Tests API endpoints
- Verifies webapp files
- Checks JavaScript syntax

**Status:** ✅ Automated quality assurance

## 🚀 How to Use

### Manual Trigger

1. Go to: https://github.com/Balizero1987/nuzantara/actions
2. Select workflow (e.g., "Deploy Webapp to GitHub Pages")
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click green "Run workflow" button

### Automatic Trigger

Workflows run automatically when:
- Code is pushed to `main` branch
- Pull request is created/updated
- Specific paths are modified

### View Results

1. Go to: https://github.com/Balizero1987/nuzantara/actions
2. Click on workflow run
3. View job details and logs
4. Check deployment summary

## 📊 Workflow Status

Check current status:
- Webapp: ![Deploy Webapp](https://github.com/Balizero1987/nuzantara/actions/workflows/deploy-webapp.yml/badge.svg)
- Backend: ![Deploy Backend](https://github.com/Balizero1987/nuzantara/actions/workflows/deploy-backend.yml/badge.svg)
- Tests: ![Integration Tests](https://github.com/Balizero1987/nuzantara/actions/workflows/test-integration.yml/badge.svg)

## 🔧 Configuration

### GitHub Pages Setup

For webapp deployment to work:

1. Go to: https://github.com/Balizero1987/nuzantara/settings/pages
2. Source: GitHub Actions (should be auto-configured)
3. Custom domain: zantara.balizero.com (already configured)

### Permissions

Workflows use `GITHUB_TOKEN` with:
- `contents: read` - Read repository
- `pages: write` - Deploy to Pages
- `id-token: write` - OIDC authentication

These are configured in each workflow file.

## 📝 Maintenance

### Adding New Workflow

1. Create `.yml` file in `.github/workflows/`
2. Follow existing workflow structure
3. Test with manual trigger first
4. Commit and push

### Modifying Workflow

1. Edit `.yml` file
2. Commit changes
3. Workflow updates automatically
4. Test with next trigger

### Debugging

If workflow fails:
1. Check workflow run logs
2. Look for red X marks
3. Click on failed step
4. Read error message
5. Fix and re-run

## 🎯 Best Practices

1. **Test locally first** before pushing
2. **Use manual triggers** for testing
3. **Check logs** after each deployment
4. **Verify deployment** on live site
5. **Keep workflows simple** and focused

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## 🆘 Troubleshooting

### Webapp not deploying?

```bash
# Check workflow status
gh workflow list
gh workflow view "Deploy Webapp to GitHub Pages"

# Manual trigger
gh workflow run "Deploy Webapp to GitHub Pages"
```

### Want to redeploy?

1. Go to Actions tab
2. Find latest successful run
3. Click "Re-run all jobs"

### Need help?

Check the deployment logs in GitHub Actions for detailed error messages.

---

**Last Updated:** 21 October 2025  
**Maintained By:** NUZANTARA Team

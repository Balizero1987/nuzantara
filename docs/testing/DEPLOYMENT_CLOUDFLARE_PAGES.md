# Cloudflare Pages Deployment Guide - ZANTARA Webapp

**Date**: 2025-01-15  
**Target**: https://zantara.balizero.com  
**Project**: zantara-bali-zero

---

## Current Configuration

### Deployment Method
- **Primary**: Cloudflare Pages (via GitHub Actions)
- **Workflow**: `.github/workflows/deploy-webapp.yml`
- **Trigger**: Push to `main` branch when `apps/webapp/**` changes
- **Project Name**: `zantara-bali-zero`
- **Domain**: `zantara.balizero.com` (configured in `apps/webapp/CNAME`)

### Why Cloudflare Pages?
- **Performance**: Single-hop CDN (vs GitHub Pages + Cloudflare proxy)
- **Global CDN**: 300+ edge locations worldwide
- **Better Integration**: Native Cloudflare features (Workers, Functions)
- **Lower Latency**: Direct edge serving vs proxy layer

---

## Pre-Deployment Checklist

### 1. Verify GitHub Secrets
Ensure these secrets are configured in GitHub repository settings:
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### 2. Verify Cloudflare Pages Project
- Project name: `zantara-bali-zero`
- Build settings:
  - Framework preset: None
  - Build command: (empty - no build needed)
  - Build output directory: `/apps/webapp`
  - Root directory: `/apps/webapp`

### 3. Verify DNS Configuration
- Domain `zantara.balizero.com` should point to Cloudflare Pages
- CNAME record configured in Cloudflare DNS

---

## Deployment Process

### Automatic Deployment (Recommended)

1. **Make changes to webapp**:
   ```bash
   cd apps/webapp
   # Make your changes
   ```

2. **Commit and push**:
   ```bash
   git add apps/webapp/
   git commit -m "feat: Update webapp"
   git push origin main
   ```

3. **GitHub Actions automatically**:
   - Detects changes in `apps/webapp/**`
   - Triggers `.github/workflows/deploy-webapp.yml`
   - Deploys to Cloudflare Pages
   - Site live in ~1-2 minutes

### Manual Deployment (Alternative)

If you need to deploy manually:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy directly
cd apps/webapp
npx wrangler pages deploy . \
  --project-name=zantara-bali-zero \
  --branch=main
```

---

## Post-Deployment Verification

### 1. Check Deployment Status
- GitHub Actions: Check workflow run status
- Cloudflare Dashboard: Pages → zantara-bali-zero → Deployments

### 2. Verify Site Accessibility
```bash
curl -I https://zantara.balizero.com
# Should return: HTTP/2 200, server: cloudflare
```

### 3. Test Critical Flows
- [ ] Login page loads: https://zantara.balizero.com/login.html
- [ ] Chat page loads: https://zantara.balizero.com/chat.html
- [ ] Login flow works
- [ ] Chat streaming works
- [ ] Conversations load correctly

### 4. Verify Performance
- Check Cloudflare Analytics for:
  - Page load times
  - Cache hit rates
  - Geographic distribution

---

## Rollback Procedure

If deployment fails or issues occur:

### Via Cloudflare Dashboard
1. Go to Cloudflare Dashboard → Pages → zantara-bali-zero
2. Select previous successful deployment
3. Click "Retry deployment" or "Promote to production"

### Via GitHub Actions
1. Revert commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. This triggers new deployment with previous code

---

## Performance Monitoring

### Key Metrics to Track
- **TTFB** (Time to First Byte): Should be < 200ms
- **FCP** (First Contentful Paint): Should be < 1.5s
- **LCP** (Largest Contentful Paint): Should be < 2.5s
- **Cache Hit Rate**: Should be > 80% after warmup

### Cloudflare Analytics
- Access via Cloudflare Dashboard → Analytics → Web Analytics
- Monitor:
  - Request volume
  - Error rates
  - Geographic distribution
  - Cache performance

---

## Troubleshooting

### Issue: Deployment fails
- Check GitHub Actions logs
- Verify Cloudflare API token permissions
- Verify account ID is correct

### Issue: Site not accessible
- Check DNS configuration
- Verify Cloudflare Pages project exists
- Check custom domain configuration in Cloudflare Pages

### Issue: Changes not appearing
- Cloudflare cache: Wait 2-5 minutes for cache propagation
- Hard refresh browser (Cmd+Shift+R)
- Check deployment status in Cloudflare Dashboard

---

## Best Practices

1. **Always test locally first**:
   ```bash
   cd apps/webapp
   python3 -m http.server 3000
   ```

2. **Monitor first deployment**:
   - Watch GitHub Actions logs
   - Verify site immediately after deploy
   - Test critical user flows

3. **Use feature branches for major changes**:
   - Test on branch
   - Merge to main when ready
   - Automatic deployment triggers

4. **Keep CNAME file updated**:
   - File: `apps/webapp/CNAME`
   - Content: `zantara.balizero.com`
   - Required for custom domain

---

## Next Steps

After successful deployment:
1. Monitor performance metrics for 24 hours
2. Collect user feedback
3. Monitor error rates
4. Optimize based on analytics

---

**Last Updated**: 2025-01-15  
**Status**: Production Ready


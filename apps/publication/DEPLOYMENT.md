# 🚀 Deployment Guide - Bali Zero Publication

Complete guide to deploying the publication to Cloudflare Pages.

---

## 🎯 Prerequisites

- [ ] GitHub account with repo access
- [ ] Cloudflare account
- [ ] Domain: `insights.balizero.com` (or similar)
- [ ] Node.js 20+ installed locally

---

## 📋 Step-by-Step Deployment

### Step 1: Connect GitHub to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Authorize GitHub access
4. Select repository: `nuzantara`
5. Click **Begin setup**

### Step 2: Configure Build Settings

**Framework preset:** `Astro`

**Build configurations:**
```
Build command: cd apps/publication && npm install && npm run build
Build output directory: apps/publication/dist
Root directory: / (leave default)
```

**Environment variables:**
```
NODE_VERSION = 20
```

### Step 3: Deploy

1. Click **Save and Deploy**
2. Wait 2-3 minutes for first build
3. Cloudflare will provide a URL: `https://balizero-publication.pages.dev`

### Step 4: Custom Domain (Optional)

1. In Pages project settings, go to **Custom domains**
2. Add `insights.balizero.com`
3. Cloudflare will auto-configure DNS (if domain is on Cloudflare)
4. Wait 1-2 minutes for SSL certificate provisioning
5. Done! Site available at `https://insights.balizero.com`

---

## 🔄 Continuous Deployment

Once connected, **every git push to `main`** triggers automatic deployment:

```bash
# Make changes
git add .
git commit -m "New article: Tourism 2025"
git push origin main

# Cloudflare automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Updates cache globally
# ⏱️  Total time: ~2 minutes
```

---

## 🧪 Preview Deployments

**Pull requests** get automatic preview deployments:

```bash
git checkout -b feature/new-article
# Make changes
git push origin feature/new-article
# Create PR on GitHub

# Cloudflare creates preview URL:
# https://abc123.balizero-publication.pages.dev
```

---

## 📊 Monitoring & Analytics

### Cloudflare Web Analytics (FREE)

1. In Pages project, go to **Analytics**
2. Enable **Web Analytics**
3. Copy beacon code
4. Add to `src/layouts/BaseLayout.astro`:

```astro
<!-- In <head> -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

### Google Search Console

1. Verify ownership via DNS or HTML file
2. Submit sitemap: `https://insights.balizero.com/sitemap-index.xml`
3. Monitor indexing status

---

## 🔧 Troubleshooting

### Build Fails

**Error:** `Cannot find module 'astro'`

**Fix:**
```bash
# Ensure package.json is in apps/publication/
# Ensure build command includes: cd apps/publication && npm install
```

**Error:** `Image optimization failed`

**Fix:**
```bash
# Add to astro.config.mjs:
export default defineConfig({
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' }
  }
});
```

### Site Not Updating

**Issue:** Changes pushed but site shows old content

**Fix:**
1. Check build logs in Cloudflare Pages dashboard
2. Purge cache: **Caching** → **Purge Everything**
3. Wait 1-2 minutes

### Custom Domain Not Working

**Issue:** `insights.balizero.com` shows error

**Fix:**
1. Verify DNS is pointing to Cloudflare Pages
2. Check SSL certificate status (may take 10-15 min)
3. Ensure domain is active in Cloudflare DNS

---

## 🎨 Asset Optimization

### Images

**Before deployment:**
1. Compress images: [TinyPNG](https://tinypng.com)
2. Recommended sizes:
   - Hero images: 1200x700px, <200KB
   - Article images: 800x450px, <100KB
   - Logo: 512x512px, <50KB

### Fonts

Fonts are loaded from Google Fonts CDN. For faster loading, consider self-hosting:

```bash
# Download fonts
npm install @fontsource/playfair-display @fontsource/inter

# Import in global.css
@import '@fontsource/playfair-display';
@import '@fontsource/inter';
```

---

## 📈 Performance Optimization

### Target Metrics

- **Lighthouse Score**: 95+ (all categories)
- **First Contentful Paint**: <0.8s
- **Time to Interactive**: <1.5s
- **Total Bundle Size**: <100KB (JS)

### Current Optimizations

✅ Astro static site generation (zero JS by default)
✅ Tailwind CSS purge (only used classes)
✅ Image lazy loading
✅ Cloudflare CDN (global edge caching)
✅ Sitemap auto-generation

### Recommended Additions

- [ ] Service Worker (PWA support)
- [ ] Preload critical fonts
- [ ] Lazy load images below fold
- [ ] Enable Brotli compression

---

## 🔐 Security

### Headers

Add security headers in `wrangler.toml`:

```toml
[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"
```

### Content Security Policy

Add CSP to `BaseLayout.astro`:

```astro
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;">
```

---

## 💰 Cost

**Cloudflare Pages:** **FREE** for unlimited requests

**Cloudflare Workers** (if needed): FREE tier = 100k requests/day

**Total monthly cost:** **$0** 🎉

---

## 📞 Support

**Deployment issues:** [Cloudflare Community](https://community.cloudflare.com)

**Astro issues:** [Astro Discord](https://astro.build/chat)

**Internal support:** Ask ZANTARA or DevAI 😉

---

**Ready to deploy?** Follow the steps above and you'll be live in <10 minutes! 🚀

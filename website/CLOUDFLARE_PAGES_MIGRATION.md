# Bali Zero Blog - Cloudflare Pages Deployment Guide

**Current**: welcome.balizero.com on Netlify  
**Target**: Move to Cloudflare Pages  
**Domain**: Already on Cloudflare DNS  
**Date**: 2025-10-26

---

## 🎯 Migration Strategy

### Option A: Cloudflare Pages (Recommended for Full Cloudflare Stack)
- Host on Cloudflare Pages (similar to Netlify/Vercel)
- Use Cloudflare CDN, DDoS protection, Analytics
- No external DNS configuration needed
- Deploy via Git or CLI

### Option B: Keep Vercel, Use Cloudflare DNS
- Host on Vercel (better Next.js support)
- Use Cloudflare only for DNS
- Simpler setup, same performance

**Recommendation**: **Option A (Cloudflare Pages)** if you want everything on Cloudflare.

---

## 🚀 Option A: Deploy to Cloudflare Pages

### Prerequisites
- Domain `balizero.com` already on Cloudflare ✅
- GitHub account (or direct upload)
- Next.js project ready

---

### Step 1: Remove from Netlify

**Before starting, backup current Netlify config**:
1. Go to Netlify Dashboard
2. Note down any environment variables
3. Export build settings
4. Download any custom headers/redirects

**Remove from Netlify**:
1. Netlify Dashboard → Site settings
2. Domain management → Remove custom domain `welcome.balizero.com`
3. Wait 5 minutes for DNS to clear

---

### Step 2: Connect GitHub Repo (If Using Git)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website

# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Bali Zero Blog ready for Cloudflare Pages"

# Create GitHub repo, then push
git remote add origin https://github.com/YOUR_USERNAME/balizero-blog.git
git branch -M main
git push -u origin main
```

---

### Step 3: Create Cloudflare Pages Project

#### Via Cloudflare Dashboard

1. Login to Cloudflare: https://dash.cloudflare.com
2. Go to **Pages** in sidebar
3. Click **Create a project**
4. Choose **Connect to Git** (or **Direct Upload**)

#### Connect GitHub Repo
1. Authorize Cloudflare to access GitHub
2. Select repository: `balizero-blog`
3. Click **Begin setup**

#### Configure Build Settings
```
Project name: balizero-blog
Production branch: main
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: /
```

#### Environment Variables (if needed)
```
NEXT_PUBLIC_SITE_URL=https://welcome.balizero.com
NODE_VERSION=18
```

4. Click **Save and Deploy**

---

### Step 4: Configure Custom Domain

After first deployment succeeds:

1. Go to your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter: `welcome.balizero.com`
5. Click **Continue**

**Cloudflare will automatically**:
- Create DNS record (or update existing)
- Provision SSL certificate
- Configure routing

**Expected Result**:
```
Domain: welcome.balizero.com
Status: Active
SSL: Active (Cloudflare Universal SSL)
```

---

### Step 5: Update DNS (If Needed)

Cloudflare Pages should auto-configure, but verify:

1. Go to **DNS** → **Records**
2. Check for record:
   ```
   Type: CNAME
   Name: welcome
   Target: balizero-blog.pages.dev (or similar)
   Proxy: Proxied (orange cloud 🟠)
   ```

**With Cloudflare Pages, you CAN use proxied (orange cloud)** - it's designed for it.

---

### Step 6: Verify Deployment

```bash
# Check DNS
dig welcome.balizero.com

# Test site
curl -I https://welcome.balizero.com

# Expected:
# HTTP/2 200
# server: cloudflare
# cf-ray: [some-id]
```

**Open in browser**: https://welcome.balizero.com
- Should load blog
- Green padlock ✅
- Fast (Cloudflare CDN) ⚡

---

## 🔧 Option B: Alternative - Direct Upload to Cloudflare Pages

If you don't want to use Git:

### Install Wrangler CLI
```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### Build and Deploy
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website

# Build production
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .next --project-name=balizero-blog
```

---

## 📊 Cloudflare Pages vs Vercel vs Netlify

| Feature | Cloudflare Pages | Vercel | Netlify |
|---------|------------------|--------|---------|
| Next.js Support | ✅ Good | ✅ Excellent | ⚠️ Limited |
| CDN | ✅ 275+ locations | ✅ Global | ✅ Global |
| SSL | ✅ Free (Universal) | ✅ Free | ✅ Free |
| DDoS Protection | ✅ Included | ❌ Separate | ❌ Separate |
| Analytics | ✅ Included | 💰 Paid | 💰 Paid |
| Build Time | ✅ Unlimited | ⚠️ Limited (free) | ⚠️ Limited (free) |
| Bandwidth | ✅ Unlimited | ⚠️ Limited (free) | ⚠️ Limited (free) |

**Winner for Full Stack**: Cloudflare Pages (if already using Cloudflare DNS)

---

## 🔒 SSL Configuration (Cloudflare Pages)

### Automatic SSL
Cloudflare Pages uses **Cloudflare Universal SSL**:
- Auto-provisioned
- Auto-renewed
- Covers all subdomains
- No configuration needed

### SSL Mode
In Cloudflare Dashboard → SSL/TLS:
- Set to: **Full (Strict)** (recommended)
- Or: **Full** (works but less secure)

---

## ⚙️ Build Configuration for Cloudflare Pages

### `wrangler.toml` (Optional)
Create in project root:

```toml
name = "balizero-blog"
compatibility_date = "2025-10-26"

[build]
command = "npm run build"
cwd = "/"

[build.upload]
format = "service-worker"
```

### Environment Variables
In Cloudflare Dashboard → Pages → Settings → Environment variables:
```
NEXT_PUBLIC_SITE_URL=https://welcome.balizero.com
NODE_VERSION=18
```

---

## 🚀 Deployment Workflow

### Automatic Deployment (Git-based)
```bash
# Make changes
git add .
git commit -m "Update: new article"
git push origin main

# Cloudflare Pages automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Updates welcome.balizero.com
```

### Manual Deployment (CLI)
```bash
# Build locally
npm run build

# Deploy
npx wrangler pages deploy .next --project-name=balizero-blog
```

---

## 📈 Performance Optimizations

### Cloudflare Page Rules (Optional)
1. Go to **Rules** → **Page Rules**
2. Add rule:
   ```
   URL: welcome.balizero.com/*
   Settings:
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours
   - Auto Minify: HTML, CSS, JS
   ```

### Cloudflare Rocket Loader (Optional)
Speed up JavaScript loading:
1. Go to **Speed** → **Optimization**
2. Enable **Rocket Loader**
3. Enable **Auto Minify** (HTML, CSS, JS)

---

## 🔄 Migration Checklist

### Before Migration
- [ ] Backup Netlify settings
- [ ] Note all environment variables
- [ ] Export custom headers/redirects
- [ ] Test build locally (`npm run build`)
- [ ] Commit all changes to Git

### During Migration
- [ ] Remove domain from Netlify
- [ ] Create Cloudflare Pages project
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy first build
- [ ] Configure custom domain

### After Migration
- [ ] Verify DNS points to Cloudflare Pages
- [ ] Test SSL certificate (green padlock)
- [ ] Test all 6 articles load
- [ ] Check images display correctly
- [ ] Test mobile responsiveness
- [ ] Run Lighthouse audit

---

## ⚠️ Common Issues

### Issue 1: Build Fails on Cloudflare Pages

**Error**: "Build failed: Next.js build error"

**Solution**:
1. Check build logs in Cloudflare Dashboard
2. Verify `package.json` has correct scripts:
   ```json
   "scripts": {
     "build": "next build",
     "start": "next start"
   }
   ```
3. Check Node version is 18+
4. Add environment variable: `NODE_VERSION=18`

### Issue 2: Images Not Loading

**Error**: Images return 404

**Solution**:
1. Verify images are in `/public/` folder
2. Check paths don't have leading `./` or `../`
3. Use absolute paths: `/instagram/image.jpg`
4. Clear Cloudflare cache:
   - Dashboard → Caching → Purge Everything

### Issue 3: DNS Not Updating

**Error**: Site still showing old Netlify content

**Solution**:
1. Wait 5 minutes after removing from Netlify
2. Purge Cloudflare cache
3. Clear local DNS:
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```
4. Check in incognito mode

---

## 📊 Expected Performance

### Cloudflare Pages Performance
- **Build Time**: 2-5 minutes
- **Deploy Time**: 30-60 seconds
- **Global CDN**: 275+ locations
- **TTFB**: < 50ms (global average)
- **SSL Handshake**: < 100ms

### Lighthouse Scores (Target)
- Performance: **95+**
- Accessibility: **95+**
- Best Practices: **95+**
- SEO: **95+**

---

## 🎯 Complete Migration Command Sequence

```bash
# 1. Prepare project
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website
git init
git add .
git commit -m "Bali Zero Blog - Cloudflare Pages ready"

# 2. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/balizero-blog.git
git push -u origin main

# 3. Remove from Netlify (via dashboard)
# → Site Settings → Domain Management → Remove welcome.balizero.com

# 4. Create Cloudflare Pages project (via dashboard)
# → Pages → Create → Connect GitHub → Select repo

# 5. Configure domain (via dashboard)
# → Custom domains → Add welcome.balizero.com

# 6. Verify
curl -I https://welcome.balizero.com
dig welcome.balizero.com

# Done! ✅
```

---

## 📞 Support

### Cloudflare Support
- Dashboard: https://dash.cloudflare.com
- Docs: https://developers.cloudflare.com/pages
- Community: https://community.cloudflare.com

### Next.js on Cloudflare Pages
- Guide: https://developers.cloudflare.com/pages/framework-guides/nextjs

---

## ✅ Final Checklist

### Cloudflare Pages Setup
- [ ] GitHub repo connected
- [ ] Build settings configured
- [ ] First deployment successful
- [ ] Custom domain added (welcome.balizero.com)
- [ ] DNS record verified
- [ ] SSL certificate active

### Site Verification
- [ ] Homepage loads
- [ ] All 6 articles accessible
- [ ] Images display correctly
- [ ] Mobile responsive
- [ ] Lighthouse score > 90
- [ ] Analytics tracking

---

**Prepared**: 2025-10-26  
**Migration From**: Netlify  
**Migration To**: Cloudflare Pages  
**Domain**: welcome.balizero.com  
**Status**: Ready to Migrate

---

## 🚀 Quick Start Command

```bash
# After GitHub push, go to Cloudflare Dashboard:
https://dash.cloudflare.com → Pages → Create project

# Or use CLI:
npx wrangler pages deploy .next --project-name=balizero-blog
```

**Your blog will be live on Cloudflare in 5-10 minutes!** ⚡

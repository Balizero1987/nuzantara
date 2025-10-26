# 🚀 Quick Start - Deploy in 5 Minutes

## Prerequisites
- Node.js 18+ installed
- npm installed  
- Vercel account (free tier OK)

---

## Method 1: One-Click Deploy (Fastest)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website

# Run automated deploy script
./deploy.sh production
```

**That's it!** The script will:
1. ✅ Check dependencies
2. ✅ Install packages
3. ✅ Type check
4. ✅ Build project
5. ✅ Test locally
6. ✅ Deploy to Vercel

---

## Method 2: Manual Deploy (Step-by-Step)

### Step 1: Build
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website
npm install
npm run build
```

### Step 2: Test Locally
```bash
npm start
# Open: http://localhost:3000
# Verify everything looks good
# Press Ctrl+C to stop
```

### Step 3: Deploy
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## Method 3: GitHub + Vercel (Auto-Deploy)

### Step 1: Push to GitHub
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - Bali Zero Blog"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/balizero-blog.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `balizero-blog` repo
4. Framework: **Next.js** (auto-detected)
5. Click **Deploy**

### Step 3: Add Custom Domain
1. In Vercel Dashboard → Project Settings → Domains
2. Add: `welcome.balizero.com`
3. Follow DNS instructions (see DNS_CONFIGURATION_GUIDE.md)

**Done!** Every push to `main` branch auto-deploys.

---

## 🌐 Configure DNS

After deployment, configure your domain:

### Quick DNS Setup (Cloudflare/Any DNS Provider)
```
Type: CNAME
Name: welcome
Value: cname.vercel-dns.com
TTL: Auto
```

**Full instructions**: See `DNS_CONFIGURATION_GUIDE.md`

---

## ✅ Verify Deployment

### Check 1: Site is Live
```bash
curl -I https://welcome.balizero.com
# Expected: HTTP/2 200
```

### Check 2: SSL Working
Visit: https://welcome.balizero.com  
- Green padlock ✅
- Certificate valid ✅

### Check 3: All Pages Load
- Homepage: https://welcome.balizero.com
- Article: https://welcome.balizero.com/article/bali-floods-overtourism-reckoning
- Category pages work
- Images load

---

## 🔧 Troubleshooting

### Deploy Failed
```bash
# Check logs
vercel logs

# Rebuild locally
rm -rf .next
npm run build

# Try deploy again
vercel --prod
```

### Domain Not Working
```bash
# Check DNS propagation
dig welcome.balizero.com

# Wait 10-30 minutes for DNS to propagate
# Use: https://dnschecker.org
```

### Images Not Loading
- Check image paths in articles
- Verify images exist in `/public/instagram/`
- Clear browser cache (Cmd+Shift+R)

---

## 📊 Post-Deploy Checklist

- [ ] Site loads on https://welcome.balizero.com
- [ ] SSL certificate valid
- [ ] All 6 articles accessible
- [ ] Images display correctly
- [ ] Mobile responsive (test on phone)
- [ ] Lighthouse score > 90
- [ ] Analytics tracking (Vercel Dashboard)

---

## 🎯 Next Steps

1. **Monitor Traffic**: Vercel Dashboard → Analytics
2. **Add Content**: New articles in `/content/articles/`
3. **SEO**: Submit sitemap to Google Search Console
4. **Social**: Share on Instagram, LinkedIn

---

## 📞 Need Help?

- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **DNS Setup**: See `DNS_CONFIGURATION_GUIDE.md`
- **Layout Tweaks**: See `FEATURED_ARTICLES_LAYOUT_GUIDELINES.md`
- **Vercel Support**: https://vercel.com/support

---

**Ready to deploy?** Run:
```bash
./deploy.sh production
```

🚀 **Go live in 5 minutes!**

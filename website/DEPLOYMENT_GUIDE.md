# Bali Zero Blog - Deployment & Publishing Guide

**Date**: 2025-10-26  
**Target Domain**: `welcome.balizero.com`  
**Status**: Ready for Production Deploy

---

## 📋 Pre-Deploy Checklist

### ✅ Completato
- [x] Layout puzzle perfetto con Featured Articles
- [x] 6 articoli pronti con contenuto completo
- [x] Logo scontornato e ottimizzato
- [x] Immagini OSS inserite e ridimensionate
- [x] Typography e font sizes ottimizzati
- [x] Responsive design testato
- [x] Layout guidelines documentate

### 🔧 Da Verificare Prima del Deploy
- [ ] Test su mobile (iPhone, Android)
- [ ] Test su tablet (iPad)
- [ ] Test browser: Chrome, Safari, Firefox, Edge
- [ ] Verifica performance (Lighthouse score)
- [ ] SEO metadata completo
- [ ] Sitemap.xml generato
- [ ] robots.txt configurato
- [ ] Analytics setup (Vercel Analytics già integrato)

---

## 🚀 Deployment Process

### Step 1: Build Production
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website

# Install dependencies (se necessario)
npm install

# Run production build
npm run build

# Test production build locally
npm start
```

**Expected output**: Server su `http://localhost:3000` con build ottimizzato.

---

### Step 2: Vercel Deployment (Recommended)

#### Opzione A: Deploy via Vercel CLI
```bash
# Install Vercel CLI (se non installato)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Opzione B: Deploy via Git + Vercel Dashboard
```bash
# 1. Crea repo GitHub (se non esiste)
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website
git init
git add .
git commit -m "Initial commit - Bali Zero Blog ready for production"
git remote add origin https://github.com/YOUR_USERNAME/balizero-blog.git
git push -u origin main

# 2. Connect to Vercel Dashboard
# - Vai su https://vercel.com/dashboard
# - Click "Import Project"
# - Seleziona il repo GitHub
# - Framework Preset: Next.js
# - Root Directory: /
# - Click "Deploy"
```

---

### Step 3: Custom Domain Configuration

#### Configure `welcome.balizero.com`

**On Vercel Dashboard**:
1. Go to Project Settings → Domains
2. Add domain: `welcome.balizero.com`
3. Copy DNS records provided by Vercel

**On Your DNS Provider** (Cloudflare/Namecheap/etc):
```
Type: CNAME
Name: welcome
Value: cname.vercel-dns.com
TTL: Auto
```

**Alternative (A Record)**:
```
Type: A
Name: welcome
Value: 76.76.21.21 (Vercel IP)
TTY: Auto
```

**Wait for DNS propagation** (5-30 minutes).

---

### Step 4: SSL Certificate
Vercel auto-provisions SSL certificates via Let's Encrypt.
- Check status in Vercel Dashboard → Domains
- Force HTTPS: Enable in Project Settings → Domains

---

### Step 5: Environment Variables (if needed)
```bash
# Vercel Dashboard → Settings → Environment Variables
# Add any required vars:

# Example (if using analytics or external APIs)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_SITE_URL=https://welcome.balizero.com
```

---

## 🔧 Build Configuration

### `next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Change to false for production
  },
  images: {
    unoptimized: false, // Enable optimization for production
    domains: ['welcome.balizero.com'],
  },
  // Optional: static export (if you want CDN-only hosting)
  // output: 'export',
}

export default nextConfig
```

**Note**: Se usi `output: 'export'`, il sito diventa statico puro (compatibile con S3, Netlify, Cloudflare Pages).

---

## 📊 Performance Optimization

### Image Optimization
```bash
# Already done for OSS article
# Check all images are optimized:
find public/instagram -name "*.jpg" -exec ls -lh {} \;

# Target: < 400KB per image
# Use ImageOptim or sips for further compression if needed
```

### Font Optimization
- ✅ Google Fonts (Playfair Display, Inter) già ottimizzati
- ✅ Font preloading via Next.js

### CSS Optimization
- ✅ Tailwind CSS purge automatico in production
- ✅ Critical CSS inlined by Next.js

---

## 🔍 SEO Configuration

### Sitemap Generation
Create `/app/sitemap.ts`:
```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://welcome.balizero.com'
  
  const articles = [
    'bali-floods-overtourism-reckoning',
    'north-bali-airport-decade-promises',
    'd12-visa-indonesia-business-explorer',
    'telkom-ai-campus',
    'skpl-alcohol-license-bali-complete-guide',
    'oss-2-migration-deadline-indonesia',
  ]

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...articles.map(slug => ({
      url: `${baseUrl}/article/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ]
}
```

### Robots.txt
Already exists in `/app/robots.ts` - verify it's configured correctly.

---

## 📈 Analytics & Monitoring

### Vercel Analytics
✅ Already integrated via `@vercel/analytics`

### Google Analytics (Optional)
Add to `/app/layout.tsx`:
```typescript
import Script from 'next/script'

// In layout component:
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  `}
</Script>
```

---

## 🧪 Testing Checklist

### Pre-Deploy Testing
```bash
# 1. Build locally
npm run build

# 2. Run production server
npm start

# 3. Test all pages
open http://localhost:3000
open http://localhost:3000/article/bali-floods-overtourism-reckoning
open http://localhost:3000/article/oss-2-migration-deadline-indonesia

# 4. Check console for errors
# Open DevTools → Console (should be clean)

# 5. Lighthouse audit
# DevTools → Lighthouse → Generate Report
# Target scores:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 95
# - SEO: > 95
```

### Post-Deploy Testing
```bash
# Test live site
curl -I https://welcome.balizero.com
# Expected: HTTP/2 200

# Test SSL
curl -I https://welcome.balizero.com | grep -i strict
# Expected: strict-transport-security header

# Test redirect
curl -I http://welcome.balizero.com
# Expected: 301/302 to HTTPS
```

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push
If using Vercel + GitHub integration:
```bash
# Any push to main branch auto-deploys
git add .
git commit -m "Update: new article added"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Updates welcome.balizero.com
```

### Preview Deployments
Every PR/branch gets a unique preview URL:
```bash
git checkout -b feature/new-article
# Make changes
git push origin feature/new-article

# Vercel creates: https://balizero-blog-abc123.vercel.app
# Test before merging to main
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npm run typecheck

# Check for missing dependencies
npm install

# Clear cache
rm -rf .next
npm run build
```

### Images Not Loading
```bash
# Check image paths (must be relative to /public)
/instagram/post_4_cover.jpg ✅
/logo/balizero-logo.png ✅

# Not this:
../public/instagram/image.jpg ❌
```

### DNS Not Resolving
```bash
# Check DNS propagation
dig welcome.balizero.com

# Expected:
# welcome.balizero.com. 300 IN CNAME cname.vercel-dns.com.
```

### Slow Performance
```bash
# Enable image optimization
# In next.config.mjs: images.unoptimized = false

# Check bundle size
npm run build
# Look for "First Load JS" < 150KB per page
```

---

## 📁 Project Structure (Production)

```
/website
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── article/[slug]/    # Dynamic routes
│   ├── sitemap.ts         # SEO sitemap
│   └── robots.ts          # Crawler rules
├── components/            # React components
├── content/articles/      # Markdown articles
├── public/               # Static assets
│   ├── instagram/        # Article images
│   └── logo/            # Brand assets
├── lib/                  # Utilities
├── next.config.mjs       # Next.js config
├── package.json          # Dependencies
└── vercel.json          # Vercel config (optional)
```

---

## 🎯 Success Criteria

### Before Going Live
- ✅ All 6 articles load without errors
- ✅ Images display correctly
- ✅ Layout looks perfect on desktop (1920px)
- ✅ Layout looks perfect on mobile (375px)
- ✅ Navigation works
- ✅ Lighthouse score > 90 on all metrics
- ✅ SSL certificate active
- ✅ Custom domain resolves

### Post-Launch
- Monitor Vercel Analytics for traffic
- Check error logs in Vercel Dashboard
- Monitor page load times
- Track user engagement metrics

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **DNS Checker**: https://dnschecker.org

---

## 📞 Support

**Vercel Support**: https://vercel.com/support  
**Next.js Discord**: https://nextjs.org/discord  
**Project Maintainer**: Bali Zero Development Team

---

**Last Updated**: 2025-10-26  
**Version**: 1.0 - Production Ready

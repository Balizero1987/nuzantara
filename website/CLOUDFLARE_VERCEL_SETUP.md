# Bali Zero Blog - Cloudflare + Vercel Setup Guide

**Domain**: `balizero.com` (on Cloudflare)  
**Subdomain**: `welcome.balizero.com` (new blog)  
**Hosting**: Vercel  
**Date**: 2025-10-26

---

## 🌐 Cloudflare Configuration for welcome.balizero.com

### Step 1: Access Cloudflare Dashboard

1. Login to Cloudflare: https://dash.cloudflare.com
2. Select domain: **balizero.com**
3. Go to: **DNS** → **Records**

---

## 🔧 DNS Record Setup

### Option A: CNAME Record (Recommended)

Add this DNS record in Cloudflare:

```
Type: CNAME
Name: welcome
Target: cname.vercel-dns.com
Proxy status: DNS only (grey cloud ☁️)
TTL: Auto
```

**⚠️ IMPORTANT**: The proxy status MUST be **DNS only** (grey cloud), NOT proxied (orange cloud).

### Why DNS Only?
- Vercel needs to issue SSL certificate via Let's Encrypt
- Cloudflare proxy interferes with SSL validation
- Direct connection = faster performance

---

### Option B: A Record (Alternative)

If CNAME doesn't work, use A record:

```
Type: A
Name: welcome
IPv4 address: 76.76.21.21
Proxy status: DNS only (grey cloud ☁️)
TTL: Auto
```

**Note**: You may need to add multiple A records if Vercel provides multiple IPs.

---

## 📸 Step-by-Step Visual Guide

### 1. Add DNS Record
```
Cloudflare Dashboard
└── balizero.com
    └── DNS
        └── Records
            └── [Add record]
```

### 2. Configure Record
```
┌─────────────────────────────────────────┐
│ Type:          CNAME                    │
│ Name:          welcome                  │
│ Target:        cname.vercel-dns.com     │
│ Proxy status:  DNS only (☁️ grey)       │
│ TTL:           Auto                     │
└─────────────────────────────────────────┘
```

### 3. Save Record
Click **Save** button

---

## 🚀 Vercel Configuration

### Step 1: Deploy to Vercel First

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website

# Deploy to Vercel
vercel --prod

# Note the deployment URL (e.g., balizero-blog-xyz.vercel.app)
```

### Step 2: Add Custom Domain in Vercel

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings** → **Domains**
4. Click: **Add Domain**
5. Enter: `welcome.balizero.com`
6. Click: **Add**

**Vercel will show DNS instructions** - these should match what you added in Cloudflare.

---

## 🔒 SSL Certificate Setup

### Automatic SSL (Vercel + Cloudflare)

**With DNS Only (grey cloud)**:
- Vercel automatically provisions SSL certificate from Let's Encrypt
- No additional configuration needed
- Certificate auto-renews every 90 days
- Status: Vercel Dashboard → Domains → SSL Status

**Expected Timeline**:
- DNS propagation: 5-30 minutes
- SSL certificate issued: 5-15 minutes after DNS resolves
- **Total**: ~30-45 minutes

---

## ✅ Verification Steps

### Step 1: Check DNS Propagation

```bash
# Check if DNS is set correctly
dig welcome.balizero.com

# Expected output:
# welcome.balizero.com. 300 IN CNAME cname.vercel-dns.com.
```

**Or use online tool**: https://dnschecker.org
- Enter: `welcome.balizero.com`
- Check globally: Should show CNAME pointing to Vercel

### Step 2: Verify SSL Certificate

After DNS propagates, check Vercel Dashboard:
- Go to: Settings → Domains
- Look for: `welcome.balizero.com`
- Status should show: ✅ **Valid Certificate**

### Step 3: Test Live Site

```bash
# Test HTTP response
curl -I https://welcome.balizero.com

# Expected:
# HTTP/2 200
# server: Vercel
```

**Or open in browser**: https://welcome.balizero.com
- Should load your blog
- Green padlock in address bar ✅

---

## ⚠️ Common Issues & Solutions

### Issue 1: DNS Not Resolving

**Problem**: `welcome.balizero.com` doesn't resolve after 30 minutes

**Solution**:
1. Check Cloudflare DNS record is correct
2. Verify proxy status is **DNS only** (grey cloud)
3. Check TTL is set to Auto or 300 seconds
4. Clear local DNS cache:
   ```bash
   # Mac
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   ```

### Issue 2: SSL Certificate Pending

**Problem**: Vercel shows "Certificate Pending" for > 1 hour

**Solution**:
1. Verify DNS is fully propagated (use dnschecker.org)
2. Check Cloudflare proxy is **disabled** (grey cloud)
3. Remove domain from Vercel and re-add it
4. Wait 15 more minutes

### Issue 3: Mixed Content Errors

**Problem**: Site loads but images don't show

**Solution**:
1. Check all image paths are correct (`/instagram/image.jpg`)
2. Verify images exist in `/public/` folder
3. Clear browser cache (Cmd+Shift+R)

### Issue 4: Redirect Loop

**Problem**: Site keeps redirecting

**Solution**:
1. Disable Cloudflare proxy (set to DNS only)
2. Remove any redirect rules in Cloudflare
3. Check Vercel doesn't have conflicting redirects

---

## 🔧 Optional: Cloudflare Settings

### If You Want to Use Cloudflare Proxy Later

**After SSL is working**, you can enable Cloudflare proxy for these benefits:
- DDoS protection
- CDN caching
- Analytics

**Steps**:
1. Wait until SSL certificate is issued by Vercel
2. In Cloudflare DNS, change proxy status to **Proxied** (orange cloud)
3. Go to Cloudflare SSL/TLS settings
4. Set SSL mode to: **Full (Strict)**
5. Enable: **Always Use HTTPS**
6. Add Page Rule:
   ```
   URL: welcome.balizero.com/*
   Setting: Cache Level = Standard
   ```

**Note**: This is optional. DNS only works perfectly fine.

---

## 📊 Expected Configuration

### Final DNS Setup (Cloudflare)
```
Type: CNAME
Name: welcome
Content: cname.vercel-dns.com
Proxy: DNS only (grey cloud)
TTL: Auto
Status: Active
```

### Final Domain Setup (Vercel)
```
Domain: welcome.balizero.com
Status: Valid
SSL: Active (Let's Encrypt)
Redirect: www → apex (if applicable)
```

---

## 🚀 Complete Deployment Workflow

### Full Process (Start to Finish)

```bash
# 1. Deploy to Vercel
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website
vercel --prod

# 2. Add domain in Vercel Dashboard
# Settings → Domains → Add "welcome.balizero.com"

# 3. Add DNS record in Cloudflare
# Type: CNAME
# Name: welcome
# Target: cname.vercel-dns.com
# Proxy: DNS only

# 4. Wait for DNS propagation (10-30 min)
dig welcome.balizero.com

# 5. Wait for SSL certificate (5-15 min)
# Check Vercel Dashboard → Domains

# 6. Test live site
curl -I https://welcome.balizero.com
open https://welcome.balizero.com
```

**Total Time**: 30-60 minutes

---

## ✅ Final Checklist

### Before Going Live
- [ ] Vercel deployment successful
- [ ] Domain added in Vercel Dashboard
- [ ] CNAME record added in Cloudflare
- [ ] Proxy status is DNS only (grey cloud)
- [ ] DNS propagation verified globally
- [ ] SSL certificate issued by Vercel

### After Going Live
- [ ] Site loads at https://welcome.balizero.com
- [ ] Green padlock (SSL valid)
- [ ] All 6 articles accessible
- [ ] Images display correctly
- [ ] Mobile responsive
- [ ] Analytics tracking

---

## 📞 Support

### Cloudflare Support
- Dashboard: https://dash.cloudflare.com
- Docs: https://developers.cloudflare.com
- Support: https://support.cloudflare.com

### Vercel Support
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

---

## 🎯 Quick Command Reference

```bash
# Check DNS
dig welcome.balizero.com

# Check DNS globally
https://dnschecker.org

# Test site
curl -I https://welcome.balizero.com

# Deploy to Vercel
vercel --prod

# Check Vercel logs
vercel logs
```

---

**Prepared**: 2025-10-26  
**Domain Provider**: Cloudflare  
**Hosting**: Vercel  
**Status**: Ready to Configure

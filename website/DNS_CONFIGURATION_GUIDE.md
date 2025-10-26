# Bali Zero Blog - DNS & Domain Configuration

**Target Domain**: `welcome.balizero.com`  
**Main Site**: `balizero.com` (existing)  
**Blog Platform**: Next.js on Vercel

---

## 🌐 Domain Architecture

```
balizero.com              → Main website (existing)
welcome.balizero.com      → Blog/Content Hub (new - this project)
app.balizero.com          → Future: User dashboard/portal
api.balizero.com          → Future: API gateway
```

---

## 📋 DNS Configuration Steps

### Current Setup Check
```bash
# Check if balizero.com already exists
dig balizero.com +short

# Check if any subdomain exists
dig welcome.balizero.com +short
```

---

### Option 1: Vercel Hosting (Recommended)

#### Add Subdomain to Vercel Project

**On Vercel Dashboard**:
1. Go to your project → Settings → Domains
2. Click "Add Domain"
3. Enter: `welcome.balizero.com`
4. Vercel will provide DNS records

**DNS Records to Add** (on your DNS provider):
```
Type: CNAME
Name: welcome
Value: cname.vercel-dns.com
TTL: Auto (or 3600)
Proxy: Disabled (if using Cloudflare)
```

**Alternative (A Record method)**:
```
Type: A
Name: welcome
Value: 76.76.21.21
TTL: Auto
```

---

### Option 2: Cloudflare (if using CF DNS)

**Cloudflare Dashboard**:
1. Select domain `balizero.com`
2. Go to DNS → Records
3. Add new record:
   ```
   Type: CNAME
   Name: welcome
   Target: cname.vercel-dns.com
   Proxy status: DNS only (grey cloud)
   TTL: Auto
   ```

**Why "DNS only"?**  
Vercel handles SSL certificates. If you enable Cloudflare proxy (orange cloud), you need to configure:
- Full (Strict) SSL mode
- Disable Cloudflare's "Always Use HTTPS" (Vercel handles this)

---

### Option 3: Route53 (AWS)

If `balizero.com` is on Route53:
```
Type: CNAME
Name: welcome.balizero.com
Value: cname.vercel-dns.com
Routing Policy: Simple
TTL: 300
```

---

### Option 4: Namecheap/GoDaddy

**Namecheap**:
1. Advanced DNS → Add New Record
2. Type: CNAME Record
3. Host: welcome
4. Value: cname.vercel-dns.com
5. TTL: Automatic

**GoDaddy**:
1. DNS Management → Add
2. Type: CNAME
3. Name: welcome
4. Value: cname.vercel-dns.com
5. TTL: 1 Hour

---

## 🔒 SSL Certificate Setup

### Vercel Auto-SSL (Default)
Vercel automatically provisions SSL certificates via Let's Encrypt.

**Steps**:
1. Add domain in Vercel Dashboard
2. Configure DNS (as above)
3. Wait 5-30 minutes for DNS propagation
4. Vercel auto-generates SSL cert
5. Check status: Vercel Dashboard → Domains → SSL Status

**Expected Result**:
```
welcome.balizero.com → Valid Certificate ✅
Issued by: Let's Encrypt
Valid until: [90 days from issue]
Auto-renewal: Enabled
```

---

### Force HTTPS Redirect
**In Vercel Project Settings**:
- Go to Settings → Domains
- Enable "Redirect HTTP to HTTPS" (usually auto-enabled)

**Test**:
```bash
curl -I http://welcome.balizero.com
# Expected: 301/308 redirect to https://
```

---

## 🧪 DNS Verification

### Check DNS Propagation
```bash
# Method 1: dig command
dig welcome.balizero.com

# Expected output:
# welcome.balizero.com. 300 IN CNAME cname.vercel-dns.com.
# cname.vercel-dns.com. 60 IN A 76.76.21.21

# Method 2: nslookup
nslookup welcome.balizero.com

# Method 3: Online tool
# Visit: https://dnschecker.org
# Enter: welcome.balizero.com
# Check propagation globally
```

### Test Site Accessibility
```bash
# Test HTTP response
curl -I https://welcome.balizero.com

# Expected:
# HTTP/2 200
# server: Vercel
# content-type: text/html
# strict-transport-security: max-age=63072000

# Test content
curl https://welcome.balizero.com | grep "Bali Zero"
```

---

## 🔄 Migration from Existing Domain

### If `balizero.com` Already Hosted Elsewhere

**Scenario**: `balizero.com` is on Wix/WordPress/Squarespace, you want to add blog subdomain.

**Steps**:
1. Keep main domain where it is
2. Add CNAME record for `welcome` subdomain pointing to Vercel
3. No disruption to main site

**Example (Wix + Vercel)**:
```
balizero.com           → Wix (unchanged)
welcome.balizero.com   → Vercel (new CNAME)
```

**Important**: Only the subdomain moves to Vercel. Main domain stays on current host.

---

## 📊 Expected Timeline

```
Step 1: Add Domain to Vercel         → Instant
Step 2: Configure DNS Records         → 5 minutes
Step 3: DNS Propagation               → 5-30 minutes (global: up to 48h)
Step 4: SSL Certificate Provisioning  → 5-15 minutes (after DNS resolves)
Step 5: Site Live                     → Ready!
```

**Total Time**: ~30 minutes to 1 hour (typically)

---

## 🚨 Troubleshooting

### DNS Not Resolving After 1 Hour
```bash
# Check if DNS record was added correctly
dig welcome.balizero.com

# Common issues:
# 1. Typo in CNAME value (should be: cname.vercel-dns.com)
# 2. Cloudflare proxy enabled (should be DNS only)
# 3. TTL too high (change to 300 seconds)
# 4. DNS provider cache (flush DNS or wait)
```

### SSL Certificate Pending
**In Vercel Dashboard** → Domains → Check status

**Common causes**:
1. DNS not fully propagated
2. CAA records blocking Let's Encrypt
3. Cloudflare Full SSL mode not set

**Solution**:
```bash
# Remove CAA record (if exists) or add Let's Encrypt:
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
```

### 404 on Subdomain
**Check**:
1. Vercel deployment successful?
2. Domain added to correct Vercel project?
3. Custom 404 page exists? (Next.js creates default)

---

## 🎯 Production Readiness Checklist

### DNS Configuration
- [ ] CNAME record added for `welcome.balizero.com`
- [ ] DNS propagation verified globally
- [ ] SSL certificate active and valid
- [ ] HTTPS redirect working
- [ ] WWW redirect configured (if needed)

### Vercel Configuration
- [ ] Domain added in Vercel Dashboard
- [ ] Production deployment successful
- [ ] Environment variables set (if any)
- [ ] Custom 404/500 pages exist

### Testing
- [ ] Site loads on `https://welcome.balizero.com`
- [ ] All pages accessible (articles, categories)
- [ ] Images loading correctly
- [ ] Mobile responsive
- [ ] SSL certificate valid (check padlock icon)

---

## 📖 Additional Resources

### DNS Propagation Checkers
- https://dnschecker.org
- https://www.whatsmydns.net
- https://mxtoolbox.com/SuperTool.aspx

### SSL Checkers
- https://www.ssllabs.com/ssltest/
- https://www.sslshopper.com/ssl-checker.html

### Vercel Documentation
- https://vercel.com/docs/concepts/projects/domains
- https://vercel.com/docs/concepts/projects/domains/add-a-domain

---

**Prepared**: 2025-10-26  
**Maintainer**: Bali Zero Development Team

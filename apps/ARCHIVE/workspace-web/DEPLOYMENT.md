# 🚀 DEPLOYMENT GUIDE

Deploy `workspace.balizero.com` to production.

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

- [ ] All assets generated and placed in `assets/` folder
- [ ] Tested locally (open `index.html` in browser)
- [ ] Dark mode works correctly
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Command Palette works (Cmd+K)
- [ ] No console errors

---

## 🌐 **DEPLOYMENT OPTIONS**

### **Option 1: Cloudflare Pages (RECOMMENDED)**

**Why Cloudflare?**
- ✅ Free tier (unlimited bandwidth)
- ✅ 100GB R2 storage (already using for ChromaDB)
- ✅ Fast global CDN
- ✅ Auto SSL certificates
- ✅ GitHub integration

**Steps**:

1. **Push to GitHub**:
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
git add workspace-web
git commit -m "Add workspace.balizero.com design"
git push origin main
```

2. **Create Cloudflare Pages Project**:
- Go to: https://dash.cloudflare.com/
- Navigate to: **Pages** → **Create a project**
- Connect GitHub repository: `NUZANTARA-RAILWAY`
- Set build settings:
  - **Build command**: (leave empty)
  - **Build output directory**: `workspace-web`
  - **Root directory**: `/workspace-web`

3. **Configure Custom Domain**:
- In Cloudflare Pages project settings
- Add custom domain: `workspace.balizero.com`
- Cloudflare will auto-configure DNS (already on Cloudflare)

4. **Deploy**:
- Click **Save and Deploy**
- Wait ~2 minutes
- Visit: https://workspace.balizero.com

**Estimated Time**: 10 minutes

---

### **Option 2: Vercel**

**Why Vercel?**
- ✅ Free tier (100GB bandwidth/month)
- ✅ Fast deployments
- ✅ GitHub integration
- ✅ Auto SSL

**Steps**:

1. **Push to GitHub** (same as Option 1)

2. **Import to Vercel**:
- Go to: https://vercel.com/new
- Import `NUZANTARA-RAILWAY` repository
- Set **Root Directory**: `workspace-web`
- Click **Deploy**

3. **Configure Custom Domain**:
- Go to project settings → **Domains**
- Add: `workspace.balizero.com`
- Add DNS records (provided by Vercel):
  ```
  Type: CNAME
  Name: workspace
  Value: cname.vercel-dns.com
  ```

4. **Deploy**:
- Auto-deployed on push to main

**Estimated Time**: 15 minutes

---

### **Option 3: GitHub Pages**

**Why GitHub Pages?**
- ✅ Free
- ✅ Simple setup
- ✅ Already using for ZANTARA frontend

**Steps**:

1. **Push to GitHub** (same as Option 1)

2. **Enable GitHub Pages**:
- Go to repository settings
- Navigate to **Pages**
- Source: Deploy from branch `main`
- Folder: `/workspace-web`

3. **Configure Custom Domain**:
- In GitHub Pages settings, add: `workspace.balizero.com`
- Add DNS record in Cloudflare:
  ```
  Type: CNAME
  Name: workspace
  Value: <your-github-username>.github.io
  ```

4. **Wait for DNS propagation**: ~5 minutes

**Estimated Time**: 10 minutes

---

### **Option 4: Railway (NOT RECOMMENDED)**

Railway is better for backend services. For static sites, use Cloudflare Pages or Vercel.

---

## 🔧 **DNS CONFIGURATION**

Add this record in Cloudflare DNS:

| Type | Name | Value | Proxy Status | TTL |
|------|------|-------|--------------|-----|
| CNAME | workspace | <deployment-url> | Proxied | Auto |

**Example**:
- **Cloudflare Pages**: `workspace` → `nuzantara-workspace.pages.dev` (Proxied)
- **Vercel**: `workspace` → `cname.vercel-dns.com` (Proxied)
- **GitHub Pages**: `workspace` → `your-username.github.io` (Proxied)

---

## 🔐 **SSL CERTIFICATE**

All recommended platforms provide automatic SSL certificates:
- ✅ Cloudflare Pages: Auto SSL via Cloudflare
- ✅ Vercel: Auto SSL via Let's Encrypt
- ✅ GitHub Pages: Auto SSL via Let's Encrypt

No manual configuration needed!

---

## 🧪 **TESTING AFTER DEPLOYMENT**

1. **Visit**: https://workspace.balizero.com
2. **Check**:
   - [ ] Page loads without errors
   - [ ] Dark mode toggle works
   - [ ] Command Palette opens (Cmd+K)
   - [ ] Mobile responsive (test on phone)
   - [ ] All assets load correctly
   - [ ] SSL certificate is valid (🔒 in browser)

3. **Performance Test**:
   - Open DevTools → Lighthouse
   - Run audit
   - Target: 90+ score

---

## 🚨 **ROLLBACK PLAN**

If deployment fails:

1. **Cloudflare Pages**: Rollback to previous deployment in dashboard
2. **Vercel**: Rollback in deployments tab
3. **GitHub Pages**: Revert commit and push

All platforms support instant rollback!

---

## 📊 **POST-DEPLOYMENT**

### **Monitor**:
- Cloudflare Analytics (if using Cloudflare)
- Vercel Analytics (if using Vercel)
- Google Analytics (optional, add tracking code)

### **Optimize**:
- Run Lighthouse audit
- Optimize images if needed
- Enable caching headers

### **Update**:
- Push changes to `main` branch
- Auto-deployed on all platforms

---

## 🎯 **RECOMMENDED DEPLOYMENT**

**For Bali Zero**: Use **Cloudflare Pages**

**Why?**
1. Already using Cloudflare for:
   - Domain management (balizero.com)
   - R2 storage (ChromaDB - 100GB free)
   - CDN
2. Free tier is very generous
3. Fast global performance
4. Unified dashboard
5. Easy to manage alongside other services

---

## 📝 **DEPLOYMENT CHECKLIST**

- [ ] Choose deployment platform (Cloudflare Pages recommended)
- [ ] Push code to GitHub
- [ ] Create project on deployment platform
- [ ] Configure custom domain (workspace.balizero.com)
- [ ] Wait for DNS propagation (~5 minutes)
- [ ] Test deployment (HTTPS, dark mode, responsive)
- [ ] Run Lighthouse audit (target: 90+)
- [ ] Update team (email, Slack, etc.)
- [ ] Document deployment in diary

---

## 🙋 **NEED HELP?**

**Cloudflare Support**: https://support.cloudflare.com/
**Vercel Support**: https://vercel.com/support
**GitHub Pages Docs**: https://docs.github.com/pages

---

**Ready to deploy? Choose your platform and follow the steps!** 🚀



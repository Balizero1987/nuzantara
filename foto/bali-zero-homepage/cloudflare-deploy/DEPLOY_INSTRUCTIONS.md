# Cloudflare Pages Deployment Instructions

## 🚀 DEPLOY ENTRAMBI I SITI SU CLOUDFLARE PAGES

Tutto è pronto in: `/Users/antonellosiano/Desktop/cloudflare-deploy/`

---

## PROJECT 1: BLOG (balizero.com)

### Via Dashboard (CONSIGLIATO):

1. **Vai su**: https://dash.cloudflare.com/a079a34fb9f45d0c6c7b6c182f3dc2cc
2. **Click**: "Pages" nel menu laterale
3. **Click**: "Create a project"
4. **Scegli**: "Upload assets"
5. **Nome progetto**: `balizero-blog`
6. **Upload folder**: `/Users/antonellosiano/Desktop/cloudflare-deploy/balizero-blog/`
7. **Production branch**: `main`
8. **Build settings**: Lascia vuoto (già buildato)
9. **Click**: "Save and Deploy"

### Dopo il deploy:
1. **Click**: "Custom domains"
2. **Add**: `balizero.com`
3. Cloudflare configurerà DNS automaticamente

---

## PROJECT 2: LANDING (welcome.balizero.com)

### Via Dashboard:

1. **Vai su**: https://dash.cloudflare.com/a079a34fb9f45d0c6c7b6c182f3dc2cc
2. **Click**: "Pages" nel menu laterale
3. **Click**: "Create a project" (nuovo progetto)
4. **Scegli**: "Upload assets"
5. **Nome progetto**: `welcome-landing`
6. **Upload folder**: `/Users/antonellosiano/Desktop/cloudflare-deploy/welcome-landing/`
7. **Rinomina** `welcome-balizero-redesign.html` → `index.html` (homepage)
8. **Click**: "Save and Deploy"

### Dopo il deploy:
1. **Click**: "Custom domains"
2. **Add**: `welcome.balizero.com`
3. Cloudflare configurerà DNS automaticamente

---

## ⚡ DEPLOY VIA CLI (Alternativa)

Se preferisci CLI, usa questi comandi:

```bash
# Blog
cd ~/Desktop/cloudflare-deploy
export CLOUDFLARE_API_TOKEN="U34lN7zRA-aL3tH8nSJwfpa6KByMP5_W3zCW7Sn_"
export CLOUDFLARE_ACCOUNT_ID="a079a34fb9f45d0c6c7b6c182f3dc2cc"
wrangler pages deploy balizero-blog --project-name=balizero-blog

# Landing
wrangler pages deploy welcome-landing --project-name=welcome-landing
```

**NOTA**: Il token potrebbe non avere permessi. Se da errore, usa Dashboard (metodo sopra).

---

## 🔧 TROUBLESHOOTING

### Se l'upload fallisce:
1. Crea ZIP manualmente:
   ```bash
   cd ~/Desktop/cloudflare-deploy
   zip -r balizero-blog.zip balizero-blog/
   zip -r welcome-landing.zip welcome-landing/
   ```
2. Upload ZIP via Dashboard

### Se DNS non si configura automaticamente:
Aggiungi manualmente in Cloudflare DNS:
```
Type: CNAME
Name: @ (per balizero.com)
Target: balizero-blog.pages.dev
Proxy: Proxied (orange cloud)

Type: CNAME
Name: welcome
Target: welcome-landing.pages.dev
Proxy: Proxied (orange cloud)
```

---

## ✅ VERIFICA

Dopo deploy, testa:
- https://balizero.com (blog)
- https://welcome.balizero.com (landing)

Entrambi dovrebbero essere live in 5-10 minuti!

---

**Preparato**: 2025-10-26  
**Files pronti in**: /Users/antonellosiano/Desktop/cloudflare-deploy/

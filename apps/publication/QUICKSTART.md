# ⚡ Quick Start - Bali Zero Publication

Get the publication running locally in **5 minutes**.

---

## 🎯 Step 1: Install Dependencies

```bash
cd apps/publication
npm install
```

**Wait:** 30-60 seconds for dependencies to install.

---

## 🚀 Step 2: Start Dev Server

```bash
npm run dev
```

**Output:**
```
🚀 astro v5.0.0 ready in 324 ms

┃ Local    http://localhost:4321/
┃ Network  use --host to expose

watching for file changes...
```

**Open browser:** http://localhost:4321

---

## ✍️ Step 3: Write Your First Article

### Option A: Use Automation (Recommended)

```bash
# From project root
cd ../../scripts/content-generator
npm install
node generate-article.js --topic "Your Topic Here" --pillar bali-reality
```

**What happens:**
1. Queries RAG backend for context
2. Generates article with Haiku 4.5
3. Saves MDX file in `src/content/articles/[pillar]/`
4. Includes frontmatter, RAG sources, cultural context

**Time:** 3-5 minutes per article

### Option B: Write Manually

1. Create file: `src/content/articles/bali-reality/my-article.mdx`

2. Add frontmatter:

```mdx
---
title: "My Article Title"
description: "Short description for SEO"
pubDate: 2025-01-15
heroImage: "/images/articles/my-article.jpg"
pillar: bali-reality
tags: ["Bali", "Business"]
author: "Zero"
readTime: "10 min"
featured: false
---

# My Article Title

Article content here...
```

3. Write content in markdown

4. Save and dev server auto-reloads

---

## 🎨 Step 4: Add Hero Image

1. Generate with IMAGINEART or download from Unsplash

2. Save to: `public/images/articles/my-article.jpg`

3. Recommended size: 1200x700px, <200KB

4. Update `heroImage` in frontmatter

---

## 🔍 Step 5: Preview Article

Dev server shows live preview at:
```
http://localhost:4321/articles/my-article
```

Changes auto-reload as you edit!

---

## 🚢 Step 6: Deploy

```bash
# Build production version
npm run build

# Preview production build locally
npm run preview
```

**For Cloudflare Pages:**
```bash
git add .
git commit -m "Add new article"
git push origin main
```

Auto-deploys in ~2 minutes! 🎉

---

## 📂 Project Structure Reference

```
src/
├── components/          # Reusable UI
│   ├── Header.astro    # Navigation
│   ├── Footer.astro    # Footer with links
│   ├── Hero.astro      # Large title section
│   ├── ArticleCard.astro  # Article preview
│   └── Newsletter.astro   # Email signup
├── content/
│   ├── articles/       # Your MDX articles
│   │   ├── bali-reality/
│   │   ├── expat-economy/
│   │   ├── business-formation/
│   │   ├── ai-tech/
│   │   └── trends-analysis/
│   └── config.ts       # Content schema
├── layouts/
│   └── BaseLayout.astro  # Main layout
├── pages/
│   ├── index.astro     # Homepage
│   └── articles/       # Article routes
└── styles/
    └── global.css      # Tailwind + custom styles
```

---

## 🎯 Common Tasks

### Add New Component

```bash
# Create file
touch src/components/MyComponent.astro

# Use in page
---
import MyComponent from '@/components/MyComponent.astro';
---
<MyComponent />
```

### Change Colors

Edit `tailwind.config.mjs`:
```js
colors: {
  'bz': {
    black: '#0a0e27',
    red: '#FF0000',
    // ... add more
  }
}
```

### Add Google Analytics

Edit `src/layouts/BaseLayout.astro`, add to `<head>`:
```astro
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🆘 Troubleshooting

**Port 4321 already in use?**
```bash
npm run dev -- --port 3000
```

**Styles not loading?**
```bash
# Rebuild Tailwind
rm -rf .astro
npm run dev
```

**Image not showing?**
- Check file path: `public/images/...` → `/images/...` in code
- Check file size: Should be <500KB
- Check format: Use .jpg or .webp

---

## 🚀 Next Steps

1. ✅ Read [README.md](./README.md) for full docs
2. ✅ Read [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloudflare setup
3. ✅ Write 3-5 flagship articles
4. ✅ Generate hero images
5. ✅ Deploy to production
6. ✅ Set up custom domain
7. ✅ Enable analytics
8. ✅ Launch! 🎉

---

**Need help?** Ask ZANTARA or DevAI! They're trained on this codebase. 😉

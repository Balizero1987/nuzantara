# 🌌 Bali Zero Publication

> **McKinsey-style content platform** for Bali business insights

Deep analysis of trends shaping Balinese business & expat economy. By Zero, powered by ZANTARA Intelligence.

---

## 🎯 What is this?

**NOT a blog** - A premium publication with:
- 🎨 McKinsey-inspired design aesthetic
- 🧠 AI-powered content generation (Haiku 4.5 + RAG)
- ⚡ Blazing fast (Astro 5.0)
- 🌍 Deployed on Cloudflare Pages (FREE)

---

## 🏗️ Tech Stack

```
Frontend:
├── Astro 5.0 (content-optimized)
├── Tailwind CSS (McKinsey aesthetic)
├── MDX (article format)
└── TypeScript (strict mode)

Content Generation:
├── Claude Haiku 4.5 (article writing)
├── RAG Backend (content research)
├── ChromaDB (legal accuracy, 14,365 docs)
└── JIWA (cultural intelligence)

Deployment:
└── Cloudflare Pages (FREE, global CDN)
```

---

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:4321

# Build for production
npm run build

# Preview production build
npm run preview
```

### Content Generation (Automated)

```bash
# Generate new article using ZANTARA Intelligence
npm run generate-article -- --topic "Bali Tourism 2025" --pillar bali-reality

# This will:
# 1. Query RAG backend for context
# 2. Use Haiku 4.5 to write article (2500 words)
# 3. Include JIWA cultural intelligence
# 4. Save as MDX in src/content/articles/
# 5. Auto-deploy via git push
```

---

## 📂 Project Structure

```
apps/publication/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ArticleCard.astro
│   │   ├── Hero.astro
│   │   └── Newsletter.astro
│   ├── content/            # Content collections
│   │   ├── articles/       # MDX articles
│   │   │   ├── bali-reality/
│   │   │   ├── expat-economy/
│   │   │   ├── business-formation/
│   │   │   ├── ai-tech/
│   │   │   └── trends-analysis/
│   │   └── config.ts       # Collection schema
│   ├── layouts/            # Page layouts
│   │   └── BaseLayout.astro
│   ├── pages/              # Routes
│   │   ├── index.astro     # Homepage
│   │   ├── articles/
│   │   └── pillars/
│   └── styles/
│       └── global.css      # Tailwind + custom styles
├── public/                 # Static assets
│   └── images/
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## 🎨 Design System

### Brand Colors (from Bali Zero logo)

```css
--bz-black: #0a0e27;    /* Dark navy (McKinsey-style) */
--bz-red: #FF0000;      /* Logo red (accent) */
--bz-white: #f5f5f5;    /* Off-white (text) */
--bz-cream: #e8d5b7;    /* Logo cream (secondary) */
--bz-gray: #444444;     /* Subtle text */
```

### Typography

```css
--font-display: 'Playfair Display', serif;  /* Headers */
--font-body: 'Inter', sans-serif;           /* Body */
```

### Components

- `Header.astro` - Minimal, sticky navigation
- `Footer.astro` - Brand info + links
- `Hero.astro` - Large title + subtitle section
- `ArticleCard.astro` - Article preview card
- `Newsletter.astro` - Email subscription widget

---

## 📝 Content Pillars

1. **Bali Reality** (30% content)
   - Current events, economy, visa changes
   - Example: "Bali Tourism Collapse & Real Estate Surge"

2. **Expat Economy** (25% content)
   - Tax, business, lifestyle strategies
   - Example: "FIRE in Bali: Is $2000/month realistic?"

3. **Business Formation** (20% content)
   - Legal, compliance, PT PMA
   - Example: "PT PMA: Strategic vs Operational"

4. **AI & Emerging Tech** (15% content)
   - AI regulations, crypto, tech
   - Example: "How AI Changes Immigration Systems"

5. **Trends & Analysis** (10% content)
   - Monthly briefings, weekly news
   - Example: "This Week in Indonesian Law"

---

## 🤖 Content Generation Pipeline

### Manual (via Cursor/Claude Code)

```bash
# 1. Ask Claude to write article
"Write a 2500-word article about [topic] for Bali Zero Publication.
Style: McKinsey consultantial.
Include: Data, citations, Zero's opinion.
Format: MDX with frontmatter."

# 2. Save to src/content/articles/[pillar]/[slug].mdx
# 3. Git commit + push
# 4. Auto-deploys to Cloudflare Pages
```

### Automated (via RAG Backend)

```bash
# Coming soon: Full automation
curl -X POST https://ts-backend.railway.app/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Bali Tourism Collapse",
    "pillar": "bali-reality",
    "wordCount": 2500,
    "style": "consultantial",
    "includeRAG": true,
    "includeJIWA": true
  }'

# Returns: MDX file ready to commit
```

---

## 🚀 Deployment

### Cloudflare Pages (Recommended)

```bash
# 1. Connect GitHub repo to Cloudflare Pages
# 2. Build settings:
#    - Framework preset: Astro
#    - Build command: npm run build
#    - Build output directory: dist
# 3. Environment variables: (none needed)
# 4. Deploy!

# Auto-deploys on every git push to main
```

### Manual Deploy

```bash
# Build
npm run build

# Output in dist/
# Upload to any static hosting (Cloudflare, Vercel, Netlify)
```

---

## 📊 Performance

- **Lighthouse Score**: 100/100 (target)
- **First Contentful Paint**: <0.5s
- **Time to Interactive**: <1s
- **Bundle Size**: <50KB (JS)

---

## 🎯 Roadmap

### Phase 1: Foundation (Week 1) ✅
- [x] Astro setup
- [x] Design system
- [x] Homepage
- [x] Components

### Phase 2: Content (Week 2)
- [ ] Write 6-8 flagship articles
- [ ] Generate hero images (IMAGINEART)
- [ ] Set up content collections
- [ ] Deploy to Cloudflare Pages

### Phase 3: Automation (Week 3)
- [ ] RAG content generation endpoint
- [ ] Automated article pipeline
- [ ] ZANTARA widget integration
- [ ] Newsletter backend

### Phase 4: Growth (Month 2+)
- [ ] SEO optimization
- [ ] Analytics integration
- [ ] Social sharing
- [ ] 4-5 articles/month cadence

---

## 🤝 Contributing

This is a private publication for Bali Zero. Content generated by:
- **Zero** (human strategic direction)
- **ZANTARA Intelligence** (AI content generation)
- **RAG Backend** (research & accuracy)

---

## 📄 License

© 2025 PT. Bali Nol Impersariat. All rights reserved.

---

**Built with ❤️ and AI by Bali Zero**

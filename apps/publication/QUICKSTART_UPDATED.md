# 🚀 Bali Zero Publication - Quick Start

**Updated:** October 24, 2025  
**Status:** ✅ Production Ready  

---

## ⚡ Immediate Start

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/publication/

# Start dev server
npm run dev

# Open in browser
# → http://localhost:4321
```

---

## 🎨 What's New (Oct 24, 2025)

### ✅ Converted from Next.js to Astro
- All React components → Astro components
- Maintained McKinsey-inspired design
- Applied Bali Zero brand (#FF0000, #e8d5b7)

### ✅ Generated 9 Visual Assets (ImagineArt)
- Hero: Lotus blooming from darkness
- Journeys: 4 artistic images (Gateway/Foundation/Belonging/Wisdom)
- Articles: 3 cinematic photos
- ZANTARA: Enhanced portrait

**Location:** `public/images/generated/` (6.3 MB total)

### ✅ New Components
1. `HeroSection.astro` - "From Zero to Infinity ∞"
2. `ContentPillars.astro` - 4 Journey Themes
3. `FeaturedArticles.astro` - Asymmetric grid
4. `MeetZantara.astro` - AI introduction (NEW!)
5. `CTASection.astro` - Email + WhatsApp

---

## 📁 Project Structure

```
apps/publication/
├── src/
│   ├── components/
│   │   ├── HeroSection.astro
│   │   ├── ContentPillars.astro
│   │   ├── FeaturedArticles.astro
│   │   ├── MeetZantara.astro ⭐ NEW
│   │   ├── CTASection.astro
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── pages/
│   │   └── index.astro (updated)
│   └── styles/
│       └── global.css (shimmer effect added)
│
├── public/images/generated/
│   ├── hero-lotus-blooming.jpg
│   ├── journey-visa-gateway.jpg
│   ├── journey-business-foundation.jpg
│   ├── journey-home-belonging.jpg
│   ├── journey-culture-wisdom.jpg
│   ├── zantara-portrait-enhanced.jpg
│   ├── article-journey-story-1.jpg
│   ├── article-cultural-insight.jpg
│   └── article-tech-ai.jpg
│
├── scripts/
│   └── generate-visuals.mjs ⭐ Image generation
│
└── VISUAL_ASSETS_GUIDE.md ⭐ Complete documentation
```

---

## 🎯 Homepage Sections

1. **Header** - Fixed navigation + ZANTARA logo
2. **Hero** - "From Zero to Infinity ∞" with lotus blooming
3. **Featured Articles** - 6 cards (asymmetric McKinsey grid)
4. **Content Pillars** - 4 Journey Themes
5. **Meet ZANTARA** - AI cultural companion introduction
6. **CTA** - Email signup + WhatsApp contact
7. **Footer** - Links + Indonesian proverb

---

## 🔧 Commands

```bash
# Development
npm run dev          # Start dev server (port 4321)
npm run build        # Build for production
npm run preview      # Preview production build

# Generate new images (if needed)
node scripts/generate-visuals.mjs
```

---

## 🎨 Brand Colors

```css
Black:  #0a0e27  /* Background */
Red:    #FF0000  /* Accent (official logo) */
Cream:  #e8d5b7  /* Text (official logo) */
White:  #f5f5f5  /* Primary text */
Gray:   #444444  /* Subtle */
```

---

## 📸 ImagineArt Integration

**API Key:** Set in `scripts/generate-visuals.mjs`  
**Service:** Uses existing `apps/backend-ts/src/services/imagine-art-service.ts`  
**Style:** Realistic (cinema-quality)  
**Resolution:** High-res 8K  

**Philosophy:** "Think Different" - NO stock photos, only artistic excellence

---

## 🚀 Deploy Ready

**Platforms supported:**
- Cloudflare Pages (recommended)
- Vercel
- Netlify
- Railway
- GitHub Pages

**Build command:** `npm run build`  
**Output directory:** `dist/`  
**Site URL:** https://insights.balizero.com (to be configured)

---

## 🌟 Design Philosophy

✅ **McKinsey elegance** - Professional, sophisticated  
✅ **Bali Zero soul** - Indonesian JIWA, cultural warmth  
✅ **Think Different** - Artistic excellence, NO cliché  
✅ **From Zero to Infinity** - Journey narrative focus  

---

**Selamat datang! 🙏**  
**From Zero to Infinity ∞** 🌸


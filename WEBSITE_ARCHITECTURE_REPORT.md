# BALI ZERO WEBSITE - ARCHITECTURE REPORT
**Date**: 2025-10-26
**Location**: `/website` directory
**Stack**: Next.js 16.0 + TypeScript + Tailwind CSS 4.x

---

## 📊 OVERVIEW

**Type**: Blog/Journal Website (Bali Zero content platform)
**Purpose**: SEO-optimized articles about Indonesian immigration, business, tax, property
**Articles**: 6 published (all featured)
**Total Lines of Code**: ~8,581 (TSX/CSS)
**Size**: 644MB (includes node_modules and .next build)
**Local Dev URL**: http://localhost:3001
**Live URL**: TBD

---

## 🏗️ ARCHITECTURE

### Technology Stack

```
Framework:     Next.js 16.0.0 (App Router)
Language:      TypeScript 5.x
Styling:       Tailwind CSS 4.1.9 + PostCSS 8.5
UI Components: shadcn/ui (Radix UI)
Fonts:         Playfair Display (serif) + Inter (sans-serif)
Markdown:      marked + gray-matter
Analytics:     Vercel Analytics
React:         19.2.0
```

### Key Dependencies

**UI Framework:**
- `@radix-ui/*` - 20+ primitive components (accordion, dialog, dropdown, etc.)
- `class-variance-authority` - Component variants
- `tailwindcss-animate` - Animation utilities
- `lucide-react` - Icon library

**Content Processing:**
- `marked` - Markdown → HTML parsing
- `gray-matter` - YAML frontmatter extraction
- `date-fns` - Date formatting

**Forms & Validation:**
- `react-hook-form` + `@hookform/resolvers`
- `zod` - Schema validation

**Other:**
- `next-themes` - Dark/light mode (always dark for Bali Zero)
- `sonner` - Toast notifications
- `recharts` - Data visualization
- `embla-carousel-react` - Carousel component

---

## 📁 PROJECT STRUCTURE

```
website/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Homepage (main entry)
│   ├── layout.tsx               # Root layout (fonts, metadata, Analytics)
│   ├── globals.css              # Global styles + Bali Zero design system
│   ├── article/[slug]/          # Dynamic article pages
│   │   └── page.tsx             # Article detail view
│   ├── category/[slug]/         # Dynamic category pages
│   │   └── page.tsx             # Category listing view
│   ├── about/                   # About page
│   │   └── page.tsx
│   ├── search/                  # Search functionality
│   │   └── page.tsx
│   ├── sitemap.ts               # Sitemap generation
│   └── robots.ts                # Robots.txt
│
├── components/                   # React components
│   ├── header.tsx               # Site header (logo + nav)
│   ├── footer.tsx               # Site footer
│   ├── hero-section.tsx         # Homepage hero (Garuda animation)
│   ├── featured-articles.tsx    # Asymmetric article grid
│   ├── content-pillars.tsx      # Category showcase
│   ├── cta-section.tsx          # Call-to-action
│   ├── bali-zero-journal.tsx    # Journal section (currently removed)
│   ├── animated-background.tsx  # Particles + gears animation
│   ├── garuda-animation.tsx     # Garuda bird SVG animation
│   ├── article/                 # Article-specific components
│   │   ├── article-card.tsx     # Article preview card
│   │   ├── article-hero.tsx     # Article detail hero
│   │   ├── article-content.tsx  # Article body renderer
│   │   └── related-articles.tsx # Related articles section
│   ├── category/                # Category components
│   │   └── category-grid.tsx
│   ├── navigation/              # Navigation components
│   ├── content/                 # Content components
│   ├── seo/                     # SEO components
│   └── ui/                      # shadcn/ui components (59 files)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ... (56 more)
│
├── content/                      # Article content (Markdown)
│   └── articles/                # All blog articles
│       ├── bali-floods-overtourism-reckoning.md
│       ├── north-bali-airport-decade-promises.md
│       ├── d12-visa-indonesia-business-explorer.md
│       ├── telkom-ai-campus.md
│       ├── skpl-alcohol-license-bali-complete-guide.md
│       └── oss-2-migration-deadline-indonesia.md
│
├── lib/                          # Utilities
│   ├── api.ts                   # Article data API (mock + file reading)
│   ├── articles.ts              # TypeScript types & interfaces
│   └── utils.ts                 # Helper functions
│
├── public/                       # Static assets
│   ├── instagram/               # Article cover images (from @balizero0)
│   │   ├── post_1_cover.jpg
│   │   ├── post_2_cover.jpg
│   │   ├── post_3_cover.jpg
│   │   ├── post_4_cover.jpg
│   │   ├── post_5_cover.jpg
│   │   └── post_*/              # Full Instagram post assets
│   ├── logo/                    # Brand logos
│   │   ├── balizero-logo-3d.png
│   │   └── zantara_logo_transparent.png
│   ├── cover_telkom.jpg         # Telkom article cover
│   └── garuda.mp4               # Hero video (not currently used)
│
├── INTEL_SCRAPING/               # Intelligence gathering system
│   ├── config/                  # Scraper configurations
│   ├── data/                    # Scraped data + ChromaDB
│   │   ├── raw/
│   │   ├── processed/
│   │   └── chromadb/
│   ├── src/                     # Scraper source code
│   ├── logs/                    # Scraping logs
│   └── docs/                    # Documentation
│
├── zantara webapp/               # Embedded Zantara webapp files
│   ├── js/                      # JS modules
│   ├── styles/                  # Styles
│   ├── assets/                  # Assets
│   └── config/                  # Config files
│
├── styles/                       # Additional styles
├── scripts/                      # Build/utility scripts
├── .next/                        # Next.js build output
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.mjs               # Next.js config
├── postcss.config.mjs            # PostCSS config
├── tailwind.config.ts            # Tailwind config
├── components.json               # shadcn/ui config
│
└── Documentation Files:
    ├── README.md                 # Project overview
    ├── WRITING_STYLE_GUIDE.md    # Editorial guidelines (22KB)
    ├── ARTICLE_SETUP_GUIDE.md    # Article creation guide
    ├── 5_ARTICLES_COMPLETE.md    # Article completion status
    ├── IMPLEMENTATION_COMPLETE.md # Feature implementation
    ├── INSTAGRAM_POSTS_SUMMARY.md # Instagram integration
    └── SESSION_HANDOVER_2025-10-26.md # Previous session notes
```

---

## 🎨 DESIGN SYSTEM

### Brand Color Palette

```css
--black: #090920        /* Vivid Black (balanced blue undertone) */
--red: #FF0000          /* Bold Red (primary accent) */
--cream: #e8d5b7        /* Cream (secondary) */
--gold: #D4AF37         /* Gold (accents) */
--navy: #1a1f3a         /* Navy (cards, UI elements) */
--off-white: #f5f5f5    /* Off-white (text) */
```

### Typography System

**Headings**: Playfair Display (serif, bold)
- H1: `text-5xl md:text-6xl lg:text-7xl`
- H2: `text-4xl md:text-5xl`
- H3: `text-2xl md:text-3xl`

**Body**: Inter (sans-serif)
- Base: `text-base md:text-lg` (16-18px)
- Leading: `leading-relaxed`

### Visual Effects

1. **Batik Pattern Background**
   - Animated radial gradients (gold, cream, red)
   - Film grain noise overlay
   - 8s ease-in-out infinite animation
   - Opacity pulse: 0.03 → 0.06

2. **Vignette Effect**
   - Fixed position radial gradient
   - Darkens edges for premium feel

3. **Image Enhancements**
   - Vibrant filter: brightness(1.3) saturate(1.6) contrast(1.2)
   - Shimmer animation on hover

4. **Animations**
   - Red glow pulse (2s infinite)
   - Gold shine effect
   - Fade-in (0.8s ease-out)
   - Particle systems (rainbow, spiral, float)
   - Garuda wing flap animation (3s infinite)
   - Energy ring pulses (4s staggered)

---

## 📝 CONTENT ARCHITECTURE

### Article Structure

Each article has:
1. **Markdown File** (`/content/articles/{slug}.md`)
2. **Metadata** in `/lib/api.ts` (Article type)
3. **Cover Image** in `/public/instagram/`

### Article Metadata Schema

```typescript
interface Article {
  slug: string                    // URL-friendly identifier
  title: string                   // Full title
  excerpt: string                 // 1-2 sentence description
  category: CategorySlug          // immigration | business | tax-legal | property | ai
  image: string                   // Cover image path
  publishedAt: string             // YYYY-MM-DD
  updatedAt: string               // YYYY-MM-DD
  readTime: number                // Minutes
  author: string                  // Author name/team
  featured: boolean               // Show on homepage
  content: string                 // HTML content (rendered from MD)
  tags: string[]                  // SEO tags
  relatedArticles: string[]       // Related article slugs
}
```

### Categories

1. **Immigration** - Visas, KITAS, D12, residency
2. **Business** - PT PMA, OSS 2.0, licensing, compliance
3. **Tax & Legal** - Regulations, NPWP, legal frameworks
4. **Property** - Real estate, development, environmental issues
5. **AI Insights** - ZANTARA-powered analysis

### Current Articles (6)

| Slug | Title | Category | Read Time | Published |
|------|-------|----------|-----------|-----------|
| `bali-floods-overtourism-reckoning` | Bali's Reckoning: When Paradise Drowns | Property | 12 min | 2025-10-01 |
| `north-bali-airport-decade-promises` | North Bali Airport: Ten Years of Promises | Business | 10 min | 2025-10-21 |
| `d12-visa-indonesia-business-explorer` | The D12 Visa: 2-Year Business Gateway | Immigration | 8 min | 2025-10-15 |
| `telkom-ai-campus` | Telkom's AI Campus: 113,000 Future Talents | Business | 8 min | 2025-10-23 |
| `skpl-alcohol-license-bali-complete-guide` | When Inspectors Walk In: SKPL Guide | Business | 9 min | 2025-10-24 |
| `oss-2-migration-deadline-indonesia` | OSS 2.0: Migration That Locked Out Thousands | Business | 11 min | 2025-09-20 |

**Total Word Count**: ~8,500 words across 6 articles

---

## 🧩 COMPONENT BREAKDOWN

### Homepage Components (in order)

```tsx
<Header />                    // Fixed top nav
<HeroSection />              // Garuda animation + tagline
{/* <BaliZeroJournal /> */}  // Removed - was carousel
<FeaturedArticles />         // Asymmetric grid (6 articles)
<ContentPillars />           // Category showcase
<CTASection />               // welcome.balizero.com link
<Footer />                   // Social + copyright
```

### Article Page Components

```tsx
<Header />                   // Fixed top nav
<ArticleHero />             // Cover image + title + metadata
<ArticleContent />          // Rendered markdown content
<CTASection />              // "Need Professional Help?"
<RelatedArticles />         // 3 related articles
<Footer />                  // Social + copyright
```

### Featured Articles Layout

**Asymmetric CSS Grid Design** (mobile: 1 col, desktop: 6 cols × 4 rows):

```
┌─────────┬─────────┬─────────┐
│ Yellow  │  Blue   │   Red   │
│ (2×2)   │  (2×3)  │  (2×4)  │
│         ├─────────┤         │
│         │  Green  │         │
├─────────┤  (4×2)  │         │
│ Azzurro │         │         │
│ (2×2)   ├─────────┴─────────┤
└─────────┴───────────────────┘
```

**Article Variants**:
- `featured` - Tall vertical (Blue, Red)
- `large` - Wide horizontal (Green)
- `medium` - Medium vertical (Yellow)
- `small` - Small square (Azzurro)

---

## 🔍 SEO & METADATA

### Sitemap (`/app/sitemap.ts`)
- Auto-generated from articles
- Includes: homepage, articles, categories, about
- Change frequency: weekly
- Priority: 1.0 (homepage), 0.8 (articles), 0.6 (categories)

### Robots.txt (`/app/robots.ts`)
```
User-agent: *
Allow: /
Sitemap: https://[domain]/sitemap.xml
```

### Open Graph & Twitter Cards
- Implemented in `article/[slug]/page.tsx`
- Includes: title, description, image, published date
- Author metadata: "Bali Zero Team" or specific team names

### Page Metadata (Root Layout)
```
Title: "Bali Zero | From Zero to Infinity ∞"
Description: "Your guide to Indonesian immigration, business setup,
              tax compliance, property ownership, and AI-powered insights."
Keywords: "Bali visa, KITAS, PT PMA Indonesia, Indonesian tax,
           Bali property, expat services, business Indonesia, ZANTARA"
```

---

## 📊 API & DATA FLOW

### Article Data API (`/lib/api.ts`)

**Current Implementation**: Mock array + file reading

**Functions**:
```typescript
getAllArticles()              // Returns all 6 articles, sorted by date
getArticleBySlug(slug)        // Reads MD file, converts to HTML
getArticlesByCategory(cat)    // Filters by category
getFeaturedArticles(limit)    // Returns featured articles
getRelatedArticles(slug, n)   // Same category, different articles
searchArticles(query)         // Search by title/excerpt/tags
```

**Data Flow**:
1. Page component calls API function
2. API reads metadata from `mockArticles` array
3. For full content: reads `.md` file from `/content/articles/`
4. `gray-matter` extracts YAML frontmatter
5. `marked` converts markdown → HTML
6. Returns Article object with HTML content

### Static Generation

**SSG (Static Site Generation)** via:
- `generateStaticParams()` in `article/[slug]/page.tsx`
- Pre-renders all 6 article pages at build time
- Fast page loads, excellent SEO

---

## 🎬 ANIMATIONS & EFFECTS

### Garuda Animation (`garuda-animation.tsx`)

**Spiral Particle System**:
- Red & white particles
- 12s spiral motion
- Rotation + scaling + opacity transitions
- Custom CSS variables for spiral path

**SVG Animation**:
- Floating (8s ease-in-out)
- Glowing (3s red → gold drop-shadow)
- Wing flapping (3s left/right rotation)

**Energy Rings**:
- 3 concentric circles
- Staggered pulses (0s, 1.3s, 2.6s delays)
- Scale 0.5 → 1.5 with opacity fade

### Batik Pattern Animation

**Layered Background**:
1. Base: `#090920` (vivid black)
2. Radial gradient spotlight (top center)
3. Film grain SVG noise (opacity 0.03)
4. Batik dots pattern (3 layers, different sizes)

**Animation**:
- 8s ease-in-out infinite
- Opacity pulse: 0.03 ↔ 0.06
- Gives "breathing" premium effect

### Particle Systems

1. **Float Particles** (red, gold, cream)
   - Random X/Y movement
   - Blur filter
   - Opacity fade-in/out

2. **Rainbow Particles**
   - 7-color spectrum cycle (5s)
   - Box-shadow glow effects
   - 15s float animation

3. **Spiral Particles** (Garuda)
   - Coordinated spiral motion
   - Rotation + scale transitions
   - Red & white variants

---

## 🔗 INSTAGRAM INTEGRATION

### Source: @balizero0

**Cover Images** stored in `/public/instagram/`:
- `post_1_cover.jpg` - SKPL article (24KB)
- `post_2_cover.jpg` - Airport article (397KB)
- `post_3_cover.jpg` - D12 visa (258KB)
- `post_4_cover.jpg` - Floods article (358KB)
- `post_5_cover.jpg` - OSS 2.0 (374KB)

**Full Post Directories**:
- `post_1/` - 13 images
- `post_2/` - 14 images
- `post_3/` - 10 images
- `post_4/` - 13 images
- `post_5/` - 16 images

**Metadata** in `posts_metadata.json`

### Image Optimization

**Current**: JPG files (24-400KB)
**Recommended**: Next.js Image component (already used)
- Automatic WebP conversion
- Responsive srcset
- Lazy loading
- Blur placeholder

---

## 🧠 INTEL SCRAPING SYSTEM

### Purpose
Web scraping for Indonesian business/legal intelligence

### Structure
```
INTEL_SCRAPING/
├── config/              # Scraper configurations
│   └── sources/         # Data source configs
├── data/
│   ├── raw/            # Raw scraped data
│   ├── processed/      # Cleaned data
│   └── chromadb/       # Vector database
├── src/                # Python scraper code
├── logs/               # Execution logs
└── docs/               # System documentation
```

### Integration
- Scraped data → ChromaDB vector DB
- Feeds ZANTARA AI for article insights
- Referenced in "AI Insights" category articles

---

## 📱 RESPONSIVE DESIGN

### Breakpoints (Tailwind)
```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large screens */
```

### Mobile Optimizations

1. **Header**:
   - Logo scales: 16px (mobile) → 24px (desktop)
   - Nav menu hidden on mobile (hamburger icon)
   - Tagline hidden on small screens

2. **Featured Articles Grid**:
   - Mobile: Single column stack
   - Desktop: 6-column asymmetric layout

3. **Typography**:
   - H1: `text-5xl` → `text-7xl`
   - Body: `text-base` → `text-lg`
   - Responsive padding: `px-4` → `px-8`

---

## 🚀 BUILD & DEPLOYMENT

### Scripts

```json
{
  "dev": "next dev",           // Port 3000 (default) or 3001
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "lint": "eslint ."          // Code linting
}
```

### Build Output

**Static Pages**:
- Homepage (`/`)
- 6 Article pages (`/article/[slug]`)
- Category pages (`/category/[slug]`)
- About page (`/about`)
- Search page (`/search`)

**Generated Files**:
- `/sitemap.xml`
- `/robots.txt`

### Performance

**Static Generation** = Fast:
- HTML pre-rendered at build time
- No server-side rendering needed
- CDN-friendly

---

## ⚠️ CURRENT ISSUES & NOTES

### 1. Zantara Webapp Duplication

**Location**: `/website/zantara webapp/`
**Issue**: Entire Zantara webapp copied inside website directory
**Size**: Unknown (but likely large)
**Recommendation**: Remove or move to separate deployment

### 2. Large Image Files

**Issue**: Some Instagram covers are 300-400KB
**Solution**: Already using Next.js Image component (good)
**Recommendation**: Pre-optimize source images

### 3. Build Artifacts

**Location**: `/website/.next/`
**Status**: Modified files detected in git
**Recommendation**: Add `.next/` to `.gitignore`

### 4. Node Modules

**Size**: Likely ~500MB+ of 644MB total
**Status**: Normal for Next.js + shadcn/ui
**Recommendation**: Ensure `node_modules/` in `.gitignore`

---

## 📈 CONTENT ROADMAP

From `README.md`:

**Next Steps**:
- [ ] Rewrite all articles to 1,500-2,000 words (using style guide)
- [ ] Add sitemap.xml (DONE ✅)
- [ ] Integrate Google Analytics (Vercel Analytics already in ✅)
- [ ] Create Twitter threads for each article
- [ ] Deploy to production

**Target**: 1,500-2,000 words per article
**Current Average**: ~1,417 words (8,500 / 6)
**Gap**: Most articles need 100-500 more words

---

## 📚 DOCUMENTATION FILES

1. **WRITING_STYLE_GUIDE.md** (22KB)
   - 7-part narrative framework
   - Language rules (simple, immediate, effective)
   - Journalism techniques (The Atlantic + ProPublica + Wired)
   - Quality checklist

2. **ARTICLE_SETUP_GUIDE.md**
   - How to create new articles
   - Metadata requirements
   - File naming conventions

3. **5_ARTICLES_COMPLETE.md**
   - Article completion status
   - Word counts
   - Publishing dates

4. **IMPLEMENTATION_COMPLETE.md**
   - Feature implementation checklist
   - Component status

5. **INSTAGRAM_POSTS_SUMMARY.md**
   - Instagram post metadata
   - Image assets catalog

---

## 🎯 RECOMMENDATIONS

### Immediate Actions

1. **Clean Up Duplicates**
   - Remove `/website/zantara webapp/` (use `/apps/webapp` instead)
   - Move INTEL_SCRAPING to root if shared resource

2. **Git Ignore**
   - Add `.next/` to `.gitignore`
   - Add `node_modules/` to `.gitignore`

3. **Content Expansion**
   - Expand articles to 1,500-2,000 words
   - Follow WRITING_STYLE_GUIDE.md

### Short-term Improvements

1. **SEO**
   - Add structured data (JSON-LD)
   - Implement breadcrumbs
   - Add author pages

2. **Performance**
   - Optimize cover images (WebP format)
   - Implement image lazy loading (already using Next Image ✅)
   - Add loading skeletons

3. **Accessibility**
   - Add alt text to all images
   - Improve keyboard navigation
   - ARIA labels for interactive elements

### Long-term Features

1. **Search**
   - Implement full-text search (currently basic filter)
   - Add Algolia or similar service

2. **Newsletter**
   - Email signup CTA
   - Integration with email service

3. **Comments**
   - Add comment system (Disqus, giscus, or custom)

4. **Analytics Dashboard**
   - Track article performance
   - Popular articles widget

---

## 🔧 TECHNICAL DEBT

1. **Mock Data** in `/lib/api.ts`
   - Currently hardcoded `mockArticles` array
   - Should migrate to CMS or database
   - Consider: Contentful, Sanity, or Markdown + Git

2. **BaliZeroJournal Component**
   - Currently commented out in `app/page.tsx`
   - Remove file or re-implement

3. **Category Pages**
   - Exist in structure but may need content

4. **Search Functionality**
   - Basic implementation
   - Needs UI/UX refinement

---

## 📊 METRICS

### Code Stats
- **Total Lines**: ~8,581 (TSX/CSS)
- **Components**: 19 main + 59 UI primitives
- **Pages**: 6 articles + 4 static pages
- **Assets**: 5 cover images + Instagram archives

### Performance Targets
- **Lighthouse Score**: Aim for 90+
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **CLS**: < 0.1

### SEO Targets
- **Keywords**: D12 visa, KITAS Indonesia, PT PMA, OSS 2.0, Bali property
- **Target Audience**: Foreign entrepreneurs, expats, investors in Indonesia

---

## ✅ STRENGTHS

1. ✅ **Modern Stack** - Next.js 16.0, React 19, TypeScript
2. ✅ **SEO Ready** - Sitemap, metadata, Open Graph
3. ✅ **Performance** - Static generation, Image optimization
4. ✅ **Design System** - Consistent Bali Zero branding
5. ✅ **Quality Content** - Well-researched, investigative articles
6. ✅ **Responsive** - Mobile-first design
7. ✅ **Accessible** - shadcn/ui primitives (good foundation)

---

## 🎬 CONCLUSION

The Bali Zero website is a **professional, modern blog platform** with:
- Solid Next.js architecture
- Beautiful, branded design
- 6 high-quality articles
- SEO optimization
- Responsive layout
- Advanced animations (Garuda, particles, batik)

**Ready for**: Content expansion, production deployment, SEO campaigns

**Needs**: Cleanup (remove duplicates), content expansion (to 1,500-2,000 words), minor refactoring (mock data → CMS)

---

**Report Generated**: 2025-10-26
**Author**: Claude Code
**Version**: 1.0 Comprehensive

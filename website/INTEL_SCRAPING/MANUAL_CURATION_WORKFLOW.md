# Bali Zero Journal - Manual Curation Workflow

## Overview
Il **Bali Zero Journal** è il magazine premium che presenta gli articoli più rilevanti dello scraping Intel. La curation è **manuale** e avviene dopo lo scraping completo di tutte le categorie.

---

## 📅 Workflow Completo

### **Step 1: Esecuzione Intel Scraping** (Automatico)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/INTEL_SCRAPING

# Run Stage 1: Scraping per tutte le categorie
python3 scripts/crawl4ai_scraper.py --categories all

# Run Stage 2B: Generazione articoli consolidati (NO Stage 2C)
python3 scripts/stage2_parallel_processor.py raw/
```

**Output**:
- `output/articles/immigration_YYYYMMDD.md`
- `output/articles/business_YYYYMMDD.md`
- `output/articles/tax_legal_YYYYMMDD.md`
- `output/articles/property_YYYYMMDD.md`
- etc.

---

### **Step 2: Manual Curation** (Manuale - Team Bali Zero)

#### 2.1 Leggere tutti i report consolidati

Aprire ogni file `output/articles/{category}_{date}.md` e leggere:
- Executive Summary di ogni articolo
- Impact Analysis
- Urgency level

#### 2.2 Selezionare i Top 4-5 Articoli

Criteri di selezione:
- ✅ **Impact Level**: CRITICAL o HIGH
- ✅ **Urgency**: Immediate o Soon
- ✅ **Relevance**: Directly affects expats/businesses
- ✅ **Timeliness**: Recent news (<7 days)
- ✅ **Diversity**: Mix di categorie (immigration, business, property, tax, safety)

#### 2.3 Ordinare per priorità

1. **Hero Article** (60% width): Articolo più impattante/urgente
2. **Featured Article** (40% width): Secondo articolo più importante
3. **Standard Articles** (2x 50% width): Altri 2-3 articoli rilevanti

---

### **Step 3: Generazione Cover Images** (Semi-automatico)

#### 3.1 Usare ImagineArt per generare immagini

Per ogni articolo selezionato, generare un'immagine con ImagineArt:

**Prompt Template**:
```
A premium editorial photograph for [TOPIC],
Indonesian context, Bali aesthetic,
professional magazine cover style,
cinematic lighting, high-end photography,
ultra-realistic, 4K quality
```

**Esempi**:
- Immigration: "Professional photograph of Indonesian immigration office, modern Bali government building, cinematic lighting"
- Business: "Executive meeting in tropical Bali boardroom, Indonesian business people, premium editorial style"
- Safety: "Atmospheric photograph of Bali street at dusk, security theme, premium editorial photography"

#### 3.2 Salvare immagini

```
/website/public/bali-zero-journal-cover-1.jpg  (Hero)
/website/public/bali-zero-journal-cover-2.jpg  (Featured)
/website/public/bali-zero-journal-cover-3.jpg  (Standard)
/website/public/bali-zero-journal-cover-4.jpg  (Standard)
```

---

### **Step 4: Update Magazine Component** (Manuale)

Editare `/website/components/bali-zero-journal.tsx`:

```typescript
const magazineArticles: MagazineArticle[] = [
  {
    id: "1",
    title: "[MAIN TITLE FROM ARTICLE]",
    subtitle: "[IMPACTFUL SUBTITLE - MAX 60 CHARS]",
    category: "[CATEGORY]",
    image: "/bali-zero-journal-cover-1.jpg",
    publishedDate: "2025-10-24",
    size: "hero",
  },
  {
    id: "2",
    title: "[SECOND ARTICLE TITLE]",
    subtitle: "[SUBTITLE]",
    category: "[CATEGORY]",
    image: "/bali-zero-journal-cover-2.jpg",
    publishedDate: "2025-10-24",
    size: "featured",
  },
  // ... altri articoli
]
```

**Guidelines per titoli**:
- ✅ **Max 8-10 parole**
- ✅ **Impattanti e action-oriented**
- ✅ **Evitare clickbait**
- ✅ **Focus su implicazioni pratiche**

**Esempi di titoli efficaci**:
- ❌ BAD: "New immigration law announced"
- ✅ GOOD: "New Immigration Reforms: Visa Process Simplified"

- ❌ BAD: "Some issues with government program"
- ✅ GOOD: "Safety Crisis Threatens 90M Program Beneficiaries"

---

### **Step 5: Deploy & Publish** (Automatico)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Build and deploy
npm run build
git add .
git commit -m "Update Bali Zero Journal - [Date]"
git push

# Railway auto-deploy
```

---

## 🎨 Design Guidelines

### Layout Principles

1. **Breathing Space**: Ampi margini, generoso spacing (gap-8, gap-10)
2. **Premium Typography**:
   - Hero: text-5xl to text-8xl
   - Featured: text-3xl to text-6xl
   - Body: text-xl to text-2xl
3. **Maximum 4-5 articles**: Quality over quantity
4. **Asymmetric Grid**: McKinsey-style layout (3-2, 2-2)

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│  HERO ARTICLE (60%)  │  FEATURED  │
│                       │  (40%)     │
│   Large image        │            │
│   Big title (8xl)    │  Med title │
│   Subtitle           │  Subtitle  │
├─────────────────────────────────────┤
│  STANDARD 1 (50%)    │ STANDARD 2 │
│                      │  (50%)     │
└─────────────────────────────────────┘
```

### Color Palette

- **Background**: #090920 (Vivid Black)
- **Text**: #FFFFFF (White)
- **Accents**: #FF0000 (Red), #D4AF37 (Gold)
- **Secondary**: #E8D5B7 (Cream)

---

## 📊 Example Curation Session

**Date**: 2025-10-24
**Total Articles Scraped**: 23 (across 6 categories)

**Selected for Magazine**:

1. **Hero**: "Indonesia's Free Meal Program - Safety Crisis Threatens 90M Beneficiaries"
   - Category: Policy Alert
   - Impact: CRITICAL
   - Why: Affects expats, businesses, and general safety

2. **Featured**: "New Immigration Reforms Simplify Visa Process"
   - Category: Immigration
   - Impact: HIGH
   - Why: Directly affects all expats in Indonesia

3. **Standard**: "Military Tribunal Law Under Fire"
   - Category: Legal
   - Impact: MEDIUM
   - Why: Human rights concerns, rule of law implications

4. **Standard**: "Bali Tourism Safety Alert - Kidnapping Incident"
   - Category: Safety
   - Impact: HIGH
   - Why: Immediate safety concern for expats in Bali

---

## 🚀 Best Practices

### DO ✅

- Read ALL category reports before selecting
- Mix categories for diversity
- Prioritize actionable intel
- Use high-quality cover images
- Write clear, impactful subtitles
- Update magazine weekly (or after significant news)

### DON'T ❌

- Auto-generate magazine content
- Include more than 5 articles
- Use clickbait titles
- Overcrowd the layout
- Publish without image review
- Mix too many similar topics

---

## 📁 File Locations

**Scripts**:
- `/INTEL_SCRAPING/scripts/crawl4ai_scraper.py` - Stage 1
- `/INTEL_SCRAPING/scripts/stage2_parallel_processor.py` - Stage 2B

**Output**:
- `/INTEL_SCRAPING/raw/{category}/*.md` - Scraped content
- `/INTEL_SCRAPING/output/articles/{category}_{date}.md` - Consolidated reports

**Website**:
- `/website/components/bali-zero-journal.tsx` - Magazine component
- `/website/public/bali-zero-journal-cover-*.jpg` - Cover images

---

## 🔄 Frequency

**Recommended Schedule**:
- **Daily scraping**: Stage 1 + 2B automatic
- **Weekly curation**: Manual selection of top articles
- **Emergency updates**: For CRITICAL news (within 24h)

---

**Last Updated**: 2025-10-24
**Next Review**: After first live deployment

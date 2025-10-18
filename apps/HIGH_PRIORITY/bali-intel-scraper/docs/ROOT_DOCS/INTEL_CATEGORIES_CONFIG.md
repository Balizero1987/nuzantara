# 📋 Intel Automation - Configurazione Categorie

**Data**: 2025-10-07
**Status**: Aggiornamento richiesto per produzione

---

## 🎯 Categorie Standard (→ Social Media)

Queste categorie seguono il flusso completo: Scraping → LLAMA → Claude → Social Media

| # | Categoria | Responsabile | Min Siti | Status | Email |
|---|-----------|--------------|----------|--------|-------|
| 1 | **Immigration & Visas** | Adit | 50 | ⚠️ Espandere (8→50) | adit@balizero.com |
| 2 | **Business/BKPM/OSS** | Dea | 50 | ⚠️ Espandere (6→50) | dea@balizero.com |
| 3 | **Real Estate** | Krisna | 50 | ⚠️ Espandere (6→50) | krisna@balizero.com |
| 4 | **Events & Culture** | Surya | 50 | ⚠️ Espandere (4→50) | surya@balizero.com |
| 5 | **Social Media Trends** | Sahira | Auto | ✅ AI decide | sahira@balizero.com |
| 6 | **Competitors** | Damar | Tutti | ⚠️ Worldwide + Social | damar@balizero.com |
| 7 | **General News** | Vino | 50 | ⚠️ Espandere (4→50) | vino@balizero.com |
| 8 | **Health & Wellness** | Ari | TBD | ❌ Da creare | ari@balizero.com |
| 9 | **Tax & DJP** | Veronika | 50 | ⚠️ Separare da BKPM | veronika@balizero.com |
| 10 | **Jobs** | Anton | TBD | ❌ Da creare | anton@balizero.com |
| 11 | **Lifestyle** | Dewa Ayu | TBD | ❌ Da creare | dewaayu@balizero.com |

**Output**: LLAMA draft → Claude review → Multi-channel (Blog, Instagram, Facebook, X, WhatsApp, Telegram) + Email a responsabile

---

## 🔬 Categorie Speciali (→ Solo Email)

Queste categorie si fermano alla revisione LLAMA, NON vanno sui social

| # | Categoria | Destinazione | Workflow |
|---|-----------|--------------|----------|
| 12 | **AI & Tech Global** | zero@balizero.com | Scraping → LLAMA → Email |
| 13 | **Dev Code Library** | zero@balizero.com | Scraping → LLAMA → Email |
| 14 | **Future Trends** | zero@balizero.com | Scraping → LLAMA → Email |

**Note speciali**:
- NO Claude Opus review (costo)
- NO social media publishing
- Focus: raccolta intelligence per decision making
- Formato: Daily digest email

---

## 📊 Target Totale Siti

### Categorie Standard
- **Con minimo specificato**: 8 categorie × 50 siti = 400 siti
- **Auto/TBD**: 3 categorie × ~30 siti = 90 siti
- **Subtotale Standard**: ~490 siti

### Categorie Speciali
- AI & Tech Global: ~50 siti
- Dev Code Library: ~50 siti (GitHub, Stack Overflow, Dev.to, etc.)
- Future Trends: ~50 siti
- **Subtotale Speciali**: ~150 siti

### **TOTALE SISTEMA**: ~640 siti monitorati

---

## 🔄 Workflow per Categoria

### Standard (1-11): Social Media Pipeline
```
Scraping (Crawl4AI)
    ↓
RAG Processing (LLAMA) → ChromaDB
    ↓
Content Creation (LLAMA) → Draft article
    ↓
Editorial Review (Claude Opus) → Polished + Multi-channel
    ↓
Publishing:
  - Blog (GitHub Pages)
  - Instagram (carousel)
  - Facebook (post)
  - X/Twitter (thread)
  - WhatsApp (broadcast)
  - Telegram (channel)
  - Email to Responsabile
```

### Speciali (12-14): Email Only
```
Scraping (Crawl4AI)
    ↓
RAG Processing (LLAMA) → ChromaDB
    ↓
Content Creation (LLAMA) → Draft article
    ↓
Email Digest → zero@balizero.com
    ↓
STOP (no social, no Claude)
```

---

## 👥 Team & Responsabilità

| Responsabile | Categoria | Focus |
|--------------|-----------|-------|
| **Adit** | Immigration & Visas | Visa updates, KITAS, permits |
| **Dea** | Business/BKPM/OSS | Business licensing, BKPM, political news |
| **Krisna** | Real Estate | Property market, land regulations |
| **Surya** | Events & Culture | Cultural events, festivals, arts |
| **Sahira** | Social Media | Trending topics, viral content |
| **Damar** | Competitors | Worldwide competitors + their social |
| **Vino** | General News | Bali & Indonesia general news |
| **Ari** | Health & Wellness | Healthcare, wellness trends |
| **Veronika** | Tax & DJP | Tax regulations, DJP updates |
| **Anton** | Jobs | Job market, hiring trends |
| **Dewa Ayu** | Lifestyle | Lifestyle, dining, entertainment |
| **Zero** (Antonio) | AI/Dev/Future | Strategic intelligence, tech research |

---

## 🎯 Priorità Implementazione

### Fase 1: Espansione Categorie Esistenti (Week 1)
- [ ] Immigration: 8 → 50 siti
- [ ] Business/BKPM: 6 → 50 siti (+ separare Tax)
- [ ] Real Estate: 6 → 50 siti
- [ ] Events: 4 → 50 siti
- [ ] General News: 4 → 50 siti

### Fase 2: Nuove Categorie Standard (Week 2)
- [ ] Health & Wellness: 0 → 50 siti
- [ ] Tax & DJP: 0 → 50 siti (separato da Business)
- [ ] Jobs: 0 → 30 siti
- [ ] Lifestyle: 0 → 30 siti

### Fase 3: Categorie Speciali (Week 3)
- [ ] AI & Tech Global: 0 → 50 siti
- [ ] Dev Code Library: 0 → 50 siti
- [ ] Future Trends: 0 → 50 siti

### Fase 4: Competitors Worldwide (Week 4)
- [ ] Expand competitors: Bali → Global
- [ ] Add social media monitoring
- [ ] Competitor content analysis

---

## 📧 Email Routing Configuration

### Per Categoria Standard
```python
CATEGORY_OWNERS = {
    "immigration": "adit@balizero.com",
    "business_bkpm": "dea@balizero.com",
    "real_estate": "krisna@balizero.com",
    "events_culture": "surya@balizero.com",
    "social_media": "sahira@balizero.com",
    "competitors": "damar@balizero.com",
    "general_news": "vino@balizero.com",
    "health_wellness": "ari@balizero.com",
    "tax_djp": "veronika@balizero.com",
    "jobs": "anton@balizero.com",
    "lifestyle": "dewaayu@balizero.com"
}
```

### Per Categorie Speciali
```python
SPECIAL_CATEGORIES = {
    "ai_tech_global": "zero@balizero.com",
    "dev_code_library": "zero@balizero.com",
    "future_trends": "zero@balizero.com"
}
```

---

## 💰 Cost Analysis (Nuovo Sistema)

### Con 640 Siti

**Daily Operations**:
- Scraping (Crawl4AI): $0
- LLAMA Processing (local): $0
- Claude Opus (11 categories × 5-10 articles): $5-10/day
- Social Media APIs: $0 (free tiers)
- Email delivery: $0 (SendGrid free tier)

**Monthly**:
- Claude Opus: $150-300/month (11 categories × daily)
- Infrastructure: $0-50/month (if using cloud runners)
- **Total**: $150-350/month

**ROI**:
- Manual alternative: ~$10,000/month (team monitoring 640 sites)
- Automation savings: 95%+

---

## 🚀 Next Steps

1. **Aggiornare** `crawl4ai_scraper.py` con nuove categorie
2. **Creare** sistema email routing per responsabili
3. **Implementare** workflow differenziato (social vs email-only)
4. **Espandere** liste siti da 38 a 640
5. **Configurare** email templates per digest

---

**Sistema scalabile da 38 a 640+ siti!** 🎯

*Last updated: 2025-10-07*
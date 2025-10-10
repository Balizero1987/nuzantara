# 📋 INTEL CATEGORIES - COMPLETE STRUCTURE (17+3)

**Date**: 2025-10-10 09:30 WITA
**Status**: ✅ Updated with all 17 categories + 3 LLAMA-only specials
**Total**: 20 categories (17 social media + 3 internal AI research)

---

## 🎯 WORKFLOW ARCHITECTURE - AGGIORNATO

### **STAGE 1: SCRAPING** 🤖
**Trigger**: GitHub Actions cron `0 22 * * *` (06:00 AM Bali)
**Output**: INTEL_SCRAPING/{category}/raw/*.md (SOLO MD, NO JSON)

### **STAGE 2A: RAG PROCESSING** 🧠
**Timing**: **IN CONTEMPORANEA** con Stage 2B (parallel processing)
**Output**: INTEL_SCRAPING/{category}/rag/*.json (ChromaDB-ready)

### **STAGE 2B: CONTENT CREATION** ✍️
**Timing**: **IN CONTEMPORANEA** con Stage 2A (parallel processing)
**Format**: `YYYYMMDD_HHMMSS_{category}.md` (SOLO MD)
**Output**: Email articolo fatto → collaboratore categoria

### **STAGE 3: EDITORIAL REVIEW** ⏸️ (STANDBY)
**Status**: Non in produzione, in standby come Stage 4
**Note**: Potrebbe essere riattivato in futuro

### **STAGE 4: MULTI-CHANNEL PUBLISHING** ⏸️ (STANDBY)
**Status**: Non in produzione, in standby
**Note**: Potrebbe essere riattivato in futuro

---

## 📊 LE 17 CATEGORIE PRINCIPALI (Social Media Pipeline)

Queste 17 categorie seguono il workflow completo: Scraping → RAG → Content Creation → **Email al collaboratore** → (futuro) Social Media

---

### **1. IMMIGRATION & VISAS** 🛂

**Collaboratore**: **Adit**
**Email**: consulting@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Imigrasi Indonesia (https://www.imigrasi.go.id/id/)
- Kemenkumham (https://www.kemenkumham.go.id/berita)
- Kedutaan Indonesia (https://kemlu.go.id/portal/id)
- Kompas Visa/Immigration
- Detik Immigration
- Indonesia Expat
- Bali Expat Facebook Groups
- **+ 43+ altri siti**

**Cosa cercare**:
- New visa rules (D12, C1, C18, C22, D2, **ALL VISAS**)
- KITAS/KITAP procedure changes
- Important deadlines
- New visa types or permits
- Overstay penalties/fines
- Golden Visa updates
- Immigration office hours/closures

**Filtro News Merda**: ❌ Spam/pubblicità servizi, ❌ Gossip politico, ❌ Notizie vecchie >3 giorni

---

### **2. BUSINESS (BKPM, OSS, Political Impact)** 💼

**Collaboratore**: **Dea**
**Email**: Dea@balizero.com
**Minimo Siti**: 50+

**Siti Priority**:
- BKPM (https://www.bkpm.go.id/id)
- OSS Indonesia (https://oss.go.id)
- Bisnis.com
- Kontan Business
- Kadin Indonesia
- Jakarta Post Business
- **+ 44+ altri siti**

**Cosa cercare**:
- New PT/PMA rules
- OSS system updates
- Political news affecting business
- Capital requirement changes
- Foreign ownership rules
- BPJS updates
- KBLI code changes
- Regulatory news impacting all business topics

**Filtro News Merda**: ❌ Stock market speculation, ❌ Corporate gossip, ❌ Service advertising

---

### **3. REAL ESTATE** 🏠

**Collaboratore**: **Krisna**
**Email**: Krisna@balizero.com
**Minimo Siti**: 50+

**Siti Priority**:
- BPN (https://www.bpn.go.id)
- Kementerian PUPR (https://www.pu.go.id)
- BPS Real Estate (https://www.bps.go.id)
- Rumah.com News
- Lamudi Indonesia
- Property Guru Indonesia
- REI (Real Estate Indonesia)
- **+ 43+ altri siti**

**Cosa cercare**:
- Hak Pakai rule changes
- Building permit (IMB/PBG) updates
- Foreign ownership regulations
- Property tax changes
- Land certificate issues
- Zoning regulation updates
- Construction permit changes
- Environmental clearance rules

**Filtro News Merda**: ❌ Property ads/listings, ❌ Price speculation, ❌ Individual disputes

---

### **4. EVENTS & CULTURE** 🎭

**Collaboratore**: **Sahira**
**Email**: sahira@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Kemenparekraf (https://kemenparekraf.go.id)
- Bali Provincial Government (https://www.baliprov.go.id)
- Ministry of Education and Culture
- Detik Travel
- Kompas Travel
- Bali Post
- Wonderful Indonesia
- **+ 43+ altri siti**

**Cosa cercare**:
- Festival dates and calendar
- Cultural event announcements
- Tourism regulation changes
- Nyepi preparations/rules
- Galungan/Kuningan dates
- Temple ceremony schedules
- Art exhibitions
- Music festivals
- Cultural site closures/openings

**Filtro News Merda**: ❌ Commercial promotions, ❌ Private parties, ❌ Restaurant/club events

---

### **5. SOCIAL MEDIA TRENDS** 📱

**Collaboratore**: **Sahira**
**Email**: sahira@balizero.com
**Minimo Siti**: FAI TU (AI-powered trend detection)

**Siti Priority**:
- Instagram Trending (#bali #indonesia #viral)
- TikTok Indonesia (trending videos)
- Facebook Groups (Bali Expat, Indonesia Social)
- Twitter/X Indonesia trends
- Dailysocial.id
- Marketing.co.id
- Tech in Asia Indonesia
- **+ AI trend analysis**

**Cosa cercare**:
- Viral trends about Bali/Indonesia
- Influencer news (local/international)
- Social media regulation changes
- Platform policy updates
- Digital marketing trends
- Social commerce developments
- Creator economy news
- Privacy policy changes

**Filtro News Merda**: ❌ Individual drama, ❌ Personal posts, ❌ Brand promotions senza valore

---

### **6. COMPETITORS** 🔍

**Collaboratore**: **Ari**
**Email**: ari.firda@balizero.com
**Copertura**: **TUTTI I COMPETITORS, NON SOLO BALI**
**Focus**: Website activity + Social Media activity
**Status**: ✅ Active

**Siti Priority**:
- Cekindo (https://www.cekindo.com/blog) + social media
- Emerhub (https://emerhub.com/indonesia) + social media
- Sinta Prima (https://sintaprima.com) + social media
- Indonesia Business Law + social media
- SSEK Legal Blog + social media
- Legal Era Indonesia + social media
- Business Law Indonesia + social media
- **+ tutti i competitor internazionali e loro social**

**Cosa cercare**:
- New services launched
- Pricing changes/promotions
- Team expansion/new hires
- Office openings/relocations
- Marketing campaigns
- Client testimonials/case studies
- Partnership announcements
- Technology upgrades
- Social media strategies
- Content marketing tactics

**Filtro News Merda**: ❌ Internal gossip, ❌ Generic industry news, ❌ Non-strategic updates

---

### **7. GENERAL NEWS** 📰

**Collaboratore**: **Damar**
**Email**: damar@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Kompas (https://kompas.com)
- Detik (https://detik.com)
- Tempo (https://tempo.co)
- CNN Indonesia
- Antara News
- Tribun Bali
- Berita Bali
- **+ 43+ altri siti**

**Cosa cercare**:
- Politics affecting expats
- Economic policy changes
- Government regulation updates
- International relations news
- Currency/economic developments
- Infrastructure projects (Bali/Indonesia)
- Natural disaster warnings
- Health/safety announcements
- Transportation updates

**Filtro News Merda**: ❌ Sports (unless major), ❌ Celebrity gossip, ❌ Crime (unless policy-related)

---

### **8. HEALTH & WELLNESS** 🏥

**Collaboratore**: **Surya**
**Email**: surya@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Kementerian Kesehatan (https://www.kemkes.go.id)
- WHO Indonesia
- BPJS Kesehatan
- Hospital regulations (Bali + national)
- Health insurance providers
- Medical licensing boards
- Pharmaceutical regulations
- Mental health services
- **+ 42+ altri siti**

**Cosa cercare**:
- Hospital regulations and licensing
- BPJS Kesehatan updates
- Health insurance policy changes
- Vaccination requirements
- Medical visa requirements
- Pharmacy regulations
- Mental health services availability
- Emergency medical services updates
- Health facility accreditations

**Filtro News Merda**: ❌ Individual health cases, ❌ Medical ads, ❌ Pseudoscience

---

### **9. TAX (DJP, Tax Law, Regulations)** 💰

**Collaboratore**: **Faisha**
**Email**: faisha@balizero.com
**Minimo Siti**: 50+

**Siti Priority**:
- Ditjen Pajak (https://www.pajak.go.id)
- Tax Law Indonesia
- PwC Indonesia Tax
- Deloitte Indonesia Tax
- KPMG Indonesia Tax
- EY Indonesia Tax
- Tax treaty updates
- **+ 43+ altri siti**

**Cosa cercare**:
- Tax rate changes
- Tax treaty updates
- New tax regulations
- SPT filing deadlines
- Tax incentives
- Tax amnesty programs
- Withholding tax updates
- VAT/PPN changes
- Transfer pricing regulations
- Tax court decisions

**Filtro News Merda**: ❌ Tax service ads, ❌ Individual tax cases, ❌ Speculation

---

### **10. JOBS & EMPLOYMENT LAW** 👔

**Collaboratore**: **Anton**
**Email**: Anton@balizero.com
**Minimo Siti**: 50+

**Siti Priority**:
- Kemnaker (Ministry of Manpower)
- Disnaker (Local employment offices)
- Job boards (JobStreet, LinkedIn Indonesia)
- Labor law updates
- IMTA/RPTKA regulations
- Minimum wage updates
- **+ 44+ altri siti**

**Cosa cercare**:
- Employment law changes
- IMTA/RPTKA requirements
- Minimum wage updates
- Labor dispute regulations
- Severance pay rules
- Work permit changes
- Social security (BPJS Ketenagakerjaan)
- Outsourcing regulations
- Job market trends

**Filtro News Merda**: ❌ Job listings, ❌ Individual disputes, ❌ Recruitment ads

---

### **11. LIFESTYLE** 🌴

**Collaboratore**: **Dewa Ayu**
**Email**: dea.au.tax@balizero.com
**Minimo Siti**: 50+

**Siti Priority**:
- Bali lifestyle blogs
- Expat lifestyle magazines
- Cost of living updates
- Restaurants/cafes (regulatory news)
- Fitness/wellness centers
- Shopping/retail news
- Entertainment venues
- **+ 43+ altri siti**

**Cosa cercare**:
- Cost of living updates
- New restaurants/cafes (permits, regulations)
- Retail/shopping regulations
- Entertainment venue licensing
- Fitness/wellness regulations
- Expat lifestyle trends
- Community events
- Local amenities updates

**Filtro News Merda**: ❌ Ads, ❌ Personal reviews, ❌ Commercial promotions

---

### **12. BANKING & FINANCE** 🏦

**Collaboratore**: **Surya**
**Email**: surya@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Bank Indonesia (https://www.bi.go.id)
- OJK (Financial Services Authority)
- Major banks (BCA, Mandiri, BNI, BRI)
- Fintech regulations
- Foreign exchange regulations
- Banking license updates
- **+ 44+ altri siti**

**Cosa cercare**:
- Bank regulations
- Foreign account rules (KITAS holders)
- Foreign exchange regulations
- Fintech licensing
- Payment system updates
- Interest rate changes
- Banking license updates
- Anti-money laundering regulations

**Filtro News Merda**: ❌ Stock tips, ❌ Banking ads, ❌ Individual account issues

---

### **13. TRANSPORTATION & CONNECTIVITY** 🚗

**Collaboratore**: **Surya**
**Email**: surya@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Ministry of Transportation
- Airport authorities (Ngurah Rai, etc.)
- Airlines (Garuda, Lion Air, etc.)
- Public transport (TransJakarta, etc.)
- Road infrastructure updates
- Port authorities
- **+ 44+ altri siti**

**Cosa cercare**:
- Flight regulations/schedules
- Airport expansions/closures
- Road infrastructure projects
- Public transport updates
- Vehicle registration rules
- Driver's license regulations
- International travel requirements
- Shipping/logistics regulations

**Filtro News Merda**: ❌ Flight ads, ❌ Individual travel stories, ❌ Delays (unless systemic)

---

### **14. EMPLOYMENT LAW (Detailed)** ⚖️

**Collaboratore**: **Amanda**
**Email**: amanda@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Ministry of Manpower detailed regulations
- Labor court decisions
- Employment law firms
- Union news
- Industrial relations
- **+ 45+ altri siti**

**Cosa cercare**:
- Detailed labor law changes
- Court precedents
- Union regulations
- Industrial relations policies
- Workplace safety regulations
- Discrimination/harassment laws
- Termination procedures
- Contract law updates

**Filtro News Merda**: ❌ Individual cases, ❌ Legal service ads

---

### **15. MACRO POLICY** 🏛️

**Collaboratore**: **Dea**
**Email**: dea@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Presidential palace announcements
- DPR (Parliament) updates
- Ministry policy announcements
- Economic policy think tanks
- International relations affecting Indonesia
- **+ 45+ altri siti**

**Cosa cercare**:
- Major policy announcements
- Presidential decrees
- Parliament legislation
- Economic policy changes
- International agreements
- Trade policy
- Investment policy
- Regulatory reforms

**Filtro News Merda**: ❌ Political gossip, ❌ Speculation, ❌ Partisan commentary

---

### **16. REGULATORY CHANGES** 📜

**Collaboratore**: **Adit**
**Email**: consulting@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- Government gazette (Berita Negara)
- Ministry regulation databases
- Legal information systems
- Regulatory tracking services
- **+ 46+ altri siti**

**Cosa cercare**:
- New regulations (Peraturan)
- Government decrees (Keputusan)
- Ministerial regulations
- Local regulations (Perda)
- Implementation deadlines
- Regulatory compliance requirements

**Filtro News Merda**: ❌ Draft regulations (until finalized), ❌ Speculation

---

### **17. BUSINESS SETUP** 🚀

**Collaboratore**: **Krisna**
**Email**: krisna@balizero.com
**Minimo Siti**: 50+
**Status**: ✅ Active

**Siti Priority**:
- OSS Indonesia (detailed)
- BKPM investment guides
- Notary associations
- Business registration offices
- Legal documentation requirements
- **+ 45+ altri siti**

**Cosa cercare**:
- Company registration procedures
- Notary requirements
- Legal documentation updates
- Business license types
- Foreign investment restrictions
- Sectorial regulations
- Minimum capital requirements
- Shareholding structures

**Filtro News Merda**: ❌ Service ads, ❌ Individual success stories

---

## 🤖 LE 3 CATEGORIE SPECIALI (LLAMA-Only, No Social Media)

Queste 3 categorie **NON seguono il workflow social media**. Si fermano alla revisione di LLAMA che manda articoli direttamente a **zero@balizero.com**

---

### **18. AI & NEW TECHNOLOGIES (Global)** 🤖

**Destinatario**: **LLAMA → zero@balizero.com**
**NO Social Media**: Questa categoria è solo per ricerca interna
**Focus**: Global AI news, cutting-edge tech

**Siti Priority**:
- OpenAI blog
- Anthropic blog
- Google AI blog
- Meta AI blog
- ArXiv AI papers
- Hugging Face updates
- AI conferences (NeurIPS, ICML, etc.)
- Tech news (TechCrunch, The Verge, Wired)
- AI safety organizations
- **+ 100+ altri siti tech globali**

**Cosa cercare**:
- New AI model releases
- Breakthrough research papers
- AI safety developments
- New AI tools/frameworks
- AI regulation news
- AI ethics discussions
- Industry applications of AI
- AI startup funding/acquisitions

**Qualità Articoli**: **PERLE GIORNALISTICHE** - dettagliati, esaustivi, sempre nella verità
**Filtro**: ❌ Hype senza sostanza, ❌ Marketing fluff, ❌ Speculation non basata su fatti

---

### **19. DEV CODE LIBRARY (Planetary Best Practices)** 💻

**Destinatario**: **LLAMA → zero@balizero.com**
**NO Social Media**: Questa categoria è solo per arricchire biblioteca dev NUZANTARA
**Focus**: Best code snippets, patterns, libraries planetari

**Siti Priority**:
- GitHub trending
- Stack Overflow best answers
- Dev.to top posts
- Medium engineering blogs
- Company engineering blogs (Netflix, Uber, Airbnb, etc.)
- Open source project documentation
- Language-specific communities (TypeScript, Python, etc.)
- Architecture patterns
- **+ 100+ altri siti dev**

**Cosa cercare**:
- Exceptional code snippets
- Design patterns examples
- Performance optimization techniques
- Security best practices
- Testing strategies
- CI/CD pipelines
- Database optimization
- API design patterns
- Scalability solutions
- Error handling patterns

**Qualità Articoli**: **PERLE GIORNALISTICHE** - codice verificato, pattern testati, best practices validate
**Filtro**: ❌ Codice non testato, ❌ Anti-patterns, ❌ Soluzioni obsolete

---

### **20. FUTURE TRENDS (Avant-Garde Ideas)** 🚀

**Destinatario**: **LLAMA → zero@balizero.com**
**NO Social Media**: Questa categoria è solo per ricerca strategica interna
**Focus**: Idee all'avanguardia, future trends, visionary thinking

**Siti Priority**:
- MIT Technology Review
- Harvard Business Review
- McKinsey Insights
- BCG Perspectives
- Y Combinator essays
- Paul Graham essays
- Naval Ravikant tweets/podcasts
- Tim Ferriss blog
- Farnam Street
- Edge.org
- Long Now Foundation
- **+ 100+ altri siti visionari**

**Cosa cercare**:
- Future of work trends
- Emerging business models
- Technological convergence
- Social/cultural shifts
- Economic paradigm changes
- Environmental innovations
- Health/longevity research
- Space exploration
- Quantum computing applications
- Decentralized systems

**Qualità Articoli**: **PERLE GIORNALISTICHE** - analisi profonde, visione long-term, idee concrete e actionable
**Filtro**: ❌ Futurismo irrealistico, ❌ Speculation senza basi, ❌ Hype cycles

---

## 🔥 FILTRO "NEWS MERDA" - SISTEMA AUTOMATICO

### **Criteri di Filtro Universali**:

❌ **Contenuto Low-Quality**:
- Notizie vecchie (>3 giorni per news, >7 giorni per regulatory)
- Clickbait senza sostanza
- Gossip/rumors non verificati
- Advertising mascherato da news
- Content farms/spam

❌ **Irrilevante per Target**:
- News che non impattano expats/business in Indonesia
- Troppo specifico (individual cases)
- Troppo generico (global news senza Indonesia connection)

❌ **Duplicati/Ridondanza**:
- Stessa notizia da multiple fonti (keep best source only)
- Riscritture senza valore aggiunto

✅ **Passa il Filtro**:
- News verificate da fonti autorevoli
- Informazioni actionable (il lettore può fare qualcosa)
- Regulatory/legal updates con deadline
- Policy changes che impattano target audience
- Analisi approfondite con insights originali

---

## 📧 EMAIL WORKFLOW

### **Per le 17 Categorie Principali**:

**Dopo Stage 2B** (Content Creation):
```
TO: [collaboratore_email]
SUBJECT: 🔥 INTEL [CATEGORY] - [DATE] - Articolo Pronto per Review
BODY:
  Ciao [Nome],

  Nuovo articolo Intel generato per la tua categoria:

  📋 Categoria: [CATEGORY]
  📅 Data: [YYYYMMDD]
  🔗 File: [link to MD file]

  📊 Metriche:
  - Fonti analizzate: [X]
  - Qualità score: [0-100]
  - Keyword density: [stats]

  ✅ Azioni richieste:
  1. Review contenuto
  2. Fact-check
  3. Approva/Rigetta/Richiedi modifiche

  Grazie!
  ZANTARA Intel System
```

### **Per le 3 Categorie LLAMA**:

**Dopo LLAMA Review**:
```
TO: zero@balizero.com
SUBJECT: 🤖 LLAMA INTEL [CATEGORY] - [DATE] - Perla Giornalistica
BODY:
  Ciao Antonio,

  LLAMA ha identificato una perla giornalistica:

  📋 Categoria: [AI_TECH / DEV_LIBRARY / FUTURE_TRENDS]
  📅 Data: [YYYYMMDD]
  🔗 File: [link to MD file]
  ⭐ LLAMA Quality Score: [0-100]

  📊 Highlights:
  - [Key insight 1]
  - [Key insight 2]
  - [Key insight 3]

  🎯 Actionable:
  - [Cosa possiamo fare con questa info]

  LLAMA Intel Research
```

---

## 📊 TOTALE SITI PER CATEGORIA

| # | Categoria | Min Siti | Collaboratore | Email | Status |
|---|-----------|----------|---------------|-------|--------|
| 1 | Immigration & Visas | 50+ | Adit | consulting@balizero.com | ✅ Active |
| 2 | Business (BKPM/OSS/Political) | 50+ | Dea | Dea@balizero.com | ✅ Active |
| 3 | Real Estate | 50+ | Krisna | Krisna@balizero.com | ✅ Active |
| 4 | Events & Culture | 50+ | Sahira | sahira@balizero.com | ✅ Active |
| 5 | Social Media Trends | AI-powered | Sahira | sahira@balizero.com | ✅ Active |
| 6 | Competitors | TUTTI (global) | Ari | ari.firda@balizero.com | ✅ Active |
| 7 | General News | 50+ | Damar | damar@balizero.com | ✅ Active |
| 8 | Health & Wellness | 50+ | Surya | surya@balizero.com | ✅ Active |
| 9 | Tax (DJP) | 50+ | Faisha | faisha@balizero.com | ✅ Active |
| 10 | Jobs & Employment Law | 50+ | Anton | Anton@balizero.com | ✅ Active |
| 11 | Lifestyle | 50+ | Dewa Ayu | dea.au.tax@balizero.com | ✅ Active |
| 12 | Banking & Finance | 50+ | Surya | surya@balizero.com | ✅ Active |
| 13 | Transportation | 50+ | Surya | surya@balizero.com | ✅ Active |
| 14 | Employment Law (Detailed) | 50+ | Amanda | amanda@balizero.com | ✅ Active |
| 15 | Macro Policy | 50+ | Dea | dea@balizero.com | ✅ Active |
| 16 | Regulatory Changes | 50+ | Adit | consulting@balizero.com | ✅ Active |
| 17 | Business Setup | 50+ | Krisna | krisna@balizero.com | ✅ Active |
| **18** | **AI & Tech (Global)** | **100+** | **LLAMA** | **zero@balizero.com** | **🤖 Special** |
| **19** | **Dev Code Library** | **100+** | **LLAMA** | **zero@balizero.com** | **🤖 Special** |
| **20** | **Future Trends** | **100+** | **LLAMA** | **zero@balizero.com** | **🤖 Special** |

**Totale Minimo Siti**: 850+ (17 categorie) + 300+ (3 categorie LLAMA) = **1,150+ siti**

---

## 🎯 PROSSIMI PASSI

1. ✅ Aggiornare file configurazione categorie in `apps/bali-intel-scraper/`
2. ✅ Creare nuovi file SITI_*.txt per categorie 8-17
3. ✅ Aggiungere logica parallela Stage 2A + 2B
4. ✅ Implementare email workflow per collaboratori
5. ✅ Implementare filtro "news merda" automatico
6. ✅ Setup categorie LLAMA speciali (18-20)
7. ✅ Testing completo con GitHub Actions

---

**DOCUMENTO READY**: Aspetto conferma per procedere con implementazione! 🚀

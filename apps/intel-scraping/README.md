# Bali Zero Journal - News Intelligence System

Sistema di intelligence per notizie su Bali e Indonesia, con scraping automatico da 600+ fonti verificate.

## 🚀 Quick Start

### 1. Installazione

```bash
npm install
```

### 2. Configurazione Database

Copia il file `.env.example` in `.env` e configura la connessione al database:

```bash
cp .env.example .env
# Modifica .env con la tua DATABASE_URL
```

### 3. Setup Database

```bash
# Crea il database (esegui manualmente su PostgreSQL)
# CREATE DATABASE bali_zero_journal;

# Esegui le migrazioni
npm run migrate

# Importa le fonti
npm run import-sources

# Testa la connettività
npm run test-connectivity
```

## 📁 Struttura Progetto

```
.
├── migrations/          # File SQL per migrazioni database
├── scripts/             # Script di utilità
│   ├── migrate.ts       # Esegue le migrazioni
│   ├── import-sources.ts # Importa le fonti da sources.yaml
│   └── test-connectivity.ts # Testa la connettività delle fonti
├── src/                 # Codice sorgente principale
├── sources.yaml         # Lista di 600+ fonti verificate
├── package.json
└── tsconfig.json
```

## 📊 Database Schema

Il sistema utilizza 4 tabelle principali:

1. **sources** - Fonti di notizie (600+)
2. **raw_articles** - Articoli grezzi scrapati
3. **processed_articles** - Articoli processati con AI
4. **scraping_metrics** - Metriche di scraping

## 🔧 Scripts Disponibili

- `npm run migrate` - Esegue le migrazioni del database
- `npm run import-sources` - Importa tutte le fonti da sources.yaml
- `npm run test-connectivity` - Testa la connettività delle fonti T1
- `npm run scrape` - Avvia lo scraper (da implementare)
- `npm run dev` - Modalità sviluppo

## 📝 Categorie Fonti

- **immigration** - Immigrazione e visti (100+ fonti)
- **business** - Aziende e business (100+ fonti)
- **tax** - Tasse e fiscalità (100+ fonti)
- **property** - Proprietà immobiliari (80+ fonti)
- **bali_news** - Notizie locali Bali (100+ fonti)
- **ai_indonesia** - AI e tecnologia (40+ fonti)
- **finance** - Finanza e mercati (100+ fonti)

## 🎯 Tier System

- **T1** - Fonti ufficiali governative (scraping ogni 24h)
- **T2** - Media professionali (scraping ogni 48h)
- **T3** - Community e forum (scraping settimanale)

## 🚢 Deploy su Fly.io

```bash
# Crea database PostgreSQL su Fly.io
fly postgres create --name bali-zero-db --region sin --vm-size shared-cpu-1x

# Collega al database
fly postgres attach bali-zero-db --app bali-zero-journal

# Esegui migrazioni
DATABASE_URL=$(fly secrets get DATABASE_URL) npm run migrate

# Importa fonti
DATABASE_URL=$(fly secrets get DATABASE_URL) npm run import-sources
```

## 📌 Note

- Il database è configurato per PostgreSQL
- Le fonti sono organizzate per categoria e tier
- Deduplicazione automatica tramite SHA-256 hash
- Monitoraggio automatico della connettività

## 🔜 Prossimi Passi

1. Implementare scraper Playwright (Patch 2)
2. Aggiungere pipeline di processing AI
3. Setup pubblicazione automatica
4. Creare dashboard di monitoraggio

---

**Patch 1 completata** ✅


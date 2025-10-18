# 📁 Struttura Progetto Nuzantara Railway

**Ultima riorganizzazione:** 18 Ottobre 2025  
**Versione:** 5.2.0 (Post-cleanup)

## 📂 Struttura Directory

```
nuzantara-railway/
├── apps/                      # Applicazioni deployabili
│   ├── backend-ts/           # Backend TypeScript API
│   ├── backend-rag/          # Backend Python RAG
│   ├── webapp/               # Frontend principale
│   │   └── assets-library/   # Libreria assets webapp
│   ├── dashboard/            # Admin dashboard
│   └── workspace-addon/      # Google Workspace addon
│
├── projects/                  # Progetti/componenti specifici
│   ├── bali-intel-scraper/   # Sistema intelligence Bali
│   ├── oracle-system/        # Sistema Oracle
│   ├── orchestrator/         # Orchestrator
│   └── devai/                # DevAI tools
│
├── scripts/                   # Script organizzati
│   ├── deploy/               # Script deployment
│   ├── dev/                  # Script development  
│   ├── test/                 # Script testing
│   ├── maintenance/          # Script manutenzione
│   ├── setup/                # Script setup
│   └── utils/                # Utility varie
│
├── docs/                      # Documentazione centralizzata
│   ├── api/                  # API documentation
│   ├── guides/               # Guide
│   └── reports/              # Report vari
│
├── archive/                   # Archivio progetti obsoleti
│   └── 2024-q4/              # Archiviati Q4 2024
│       ├── apps/
│       ├── config/
│       ├── docs/
│       └── scripts/
│
├── shared/                    # Codice condiviso
│   └── config/               # Configurazioni shared
│
├── config/                    # Configurazioni globali
├── dist/                      # Build output
└── node_modules/             # Dependencies (monorepo)
```

## 🎯 Convenzioni

### Apps
Contiene **solo** applicazioni deployabili in produzione.
Ogni app ha la sua cartella con `package.json` o `requirements.txt`.

### Projects
Progetti/componenti specifici che possono essere library o tool.
Non necessariamente deployabili standalone.

### Scripts
Organizzati per funzione:
- `deploy/` - Deployment production
- `dev/` - Development tools
- `test/` - Testing automation
- `maintenance/` - Monitoring e health checks

### Archive
Contenuti storici. Non usare in produzione.
Organizzati per periodo (anno-quarter).

## 📝 Note

- Documentazione principale sempre in README.md nella root di ogni app/project
- Script devono essere eseguibili (`chmod +x`)
- Backup automatici in `.backup/` nelle rispettive cartelle

## 🔗 Link Utili

- [Documentazione API](docs/api/)
- [Guide Development](docs/guides/)
- [Analisi Struttura](FOLDER_STRUCTURE_ANALYSIS.md)

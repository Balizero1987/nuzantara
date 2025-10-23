# 📊 Galaxy Map Diagrams

Questa cartella contiene **24 diagrammi Mermaid** estratti dalla documentazione Galaxy Map.

## 🎨 Come Visualizzare i Diagrammi in Locale

### Opzione 1: VS Code (RACCOMANDATO) ⭐

**Setup una tantum:**
```bash
# Installa estensione Markdown Preview Enhanced
code --install-extension shd101wyy.markdown-preview-enhanced

# OPPURE Mermaid Preview
code --install-extension bierner.markdown-mermaid
```

**Uso:**
1. Apri qualsiasi file `.md` in `docs/galaxy-map/`
2. Premi `Cmd+Shift+V` (Mac) o `Ctrl+Shift+V` (Windows/Linux)
3. Vedi tutti i diagrammi renderizzati in tempo reale! ✨

---

### Opzione 2: Genera Immagini PNG 🖼️

**Setup:**
```bash
# Installa Mermaid CLI
npm install -g @mermaid-js/mermaid-cli
```

**Genera tutte le immagini:**
```bash
# Dalla root del progetto
cd docs/galaxy-map/diagrams

# Genera PNG per tutti i diagrammi
for f in *.mmd; do
  mmdc -i "$f" -o "${f%.mmd}.png" -b transparent
done
```

**Risultato:**
- 24 file PNG in `docs/galaxy-map/diagrams/`
- Visualizzabili con qualsiasi viewer di immagini
- Utilizzabili in presentazioni, Notion, Confluence, ecc.

---

### Opzione 3: Obsidian 📝

[Obsidian](https://obsidian.md/) supporta Mermaid nativamente!

**Setup:**
1. Scarica Obsidian (gratis)
2. Apri `~/NUZANTARA-RAILWAY` come vault
3. Naviga a `docs/galaxy-map/`
4. I diagrammi si renderizzano automaticamente! ✨

**Bonus:** Obsidian ha una bellissima Graph View per vedere le connessioni tra i documenti.

---

### Opzione 4: Mermaid Live Editor 🌐

Per modifiche rapide:
1. Vai su [mermaid.live](https://mermaid.live)
2. Copia/incolla il contenuto di qualsiasi `.mmd`
3. Modifica in tempo reale
4. Esporta come PNG/SVG

**Pro:** Non richiede installazione
**Contro:** Online, non locale

---

### Opzione 5: Script Python Automatico 🤖

Ho creato `scripts/view_diagrams.py` che:
- Genera automaticamente i PNG
- Li apre nel tuo viewer di default
- Si aggiorna quando modifichi i .md

```bash
python3 scripts/view_diagrams.py
```

---

## 📂 Struttura Diagrammi

```
diagrams/
├── README-01.mmd                    # System overview (main)
├── 01-system-overview-01.mmd        # Complete architecture
├── 01-system-overview-02.mmd        # Component breakdown
├── 01-system-overview-03.mmd        # Technology stack
├── 02-technical-architecture-01.mmd # Handler modules
├── 02-technical-architecture-02.mmd # Service dependencies
├── 02-technical-architecture-03.mmd # Middleware pipeline
├── 03-ai-intelligence-01.mmd        # ZANTARA AI ecosystem
├── 03-ai-intelligence-02.mmd        # Nightly worker
├── 03-ai-intelligence-03.mmd        # JIWA middleware
├── 03-ai-intelligence-04.mmd        # Golden Answers
├── 03-ai-intelligence-05.mmd        # AI model routing
├── 03-ai-intelligence-06.mmd        # Tools & Agents
├── 03-ai-intelligence-07.mmd        # Cost breakdown
├── 03-ai-intelligence-08.mmd        # Performance tiers
├── 04-data-flows-01.mmd             # RAG query flow
├── 04-data-flows-02.mmd             # Golden answer flow
├── 04-data-flows-03.mmd             # Oracle multi-agent
├── 04-data-flows-04.mmd             # ZANTARA nightly worker
├── 04-data-flows-05.mmd             # Tool execution flow
├── 05-database-schema-01.mmd        # PostgreSQL schema
├── 05-database-schema-02.mmd        # ChromaDB collections
├── 05-database-schema-03.mmd        # Oracle tables
└── 05-database-schema-04.mmd        # Data relationships
```

**Totale:** 24 diagrammi coprendo 100% del sistema

---

## 🔄 Workflow Consigliato

### Per Sviluppo Quotidiano:
1. **VS Code** con Markdown Preview Enhanced
2. Modifica i `.md` files
3. Vedi i diagrammi renderizzati in real-time
4. Commit quando soddisfatto

### Per Presentazioni:
1. Genera PNG con `mmdc`
2. Usa nelle slide/docs
3. Alta qualità, trasparente

### Per Documentazione Esterna:
1. Usa i PNG generati
2. O link a GitHub (renderizza Mermaid)
3. O esporta da mermaid.live

---

## 🛠️ Script Utili

### Genera tutti i PNG:
```bash
./scripts/generate-diagrams.sh
```

### Estrai nuovi diagrammi dopo modifiche:
```bash
python3 scripts/extract_mermaid.py
```

### Watch mode (auto-rigenera su modifica):
```bash
# TODO: Creare watch_diagrams.sh
```

---

## 📊 Statistiche

- **Documenti sorgente:** 6 markdown files
- **Diagrammi totali:** 24 Mermaid diagrams
- **Dimensione media:** ~600 bytes per diagram
- **Tipi di diagrammi:**
  - `graph TB/LR`: Architecture & structure
  - `sequenceDiagram`: Request flows
  - `flowchart`: Process flows
  - `stateDiagram`: State machines

---

## ❓ FAQ

**Q: Quale opzione è la più veloce?**
A: VS Code con Markdown Preview Enhanced - zero setup, rendering istantaneo.

**Q: Voglio condividere i diagrammi con colleghi senza GitHub?**
A: Genera i PNG con `mmdc` e condividi le immagini.

**Q: Come aggiorno i diagrammi quando modifico il codice?**
A: La `architecture-mapper` skill li aggiorna automaticamente quando Claude rileva cambiamenti.

**Q: Posso usare questi diagrammi in Notion?**
A: Sì! Genera PNG e caricali su Notion. Oppure usa [Notion Mermaid embed](https://notion-mermaid.vercel.app/).

**Q: Qual è la differenza tra .mmd e .md?**
A: `.mmd` = diagramma Mermaid puro (solo codice)
   `.md` = Markdown completo (testo + diagrammi embedded)

---

**Raccomandazione finale:** Usa **VS Code + Markdown Preview Enhanced** per il 95% dei casi. È veloce, gratis, e integrato nel tuo workflow! ⚡

#!/bin/bash
# 🚀 Quick Setup - ZANTARA Legal Processing

echo "🏛️  ZANTARA LEGAL PROCESSING - Quick Setup"
echo "=========================================="
echo ""

# Run main setup script
if [ -f "SETUP_LEGAL_PROCESSING.sh" ]; then
    echo "✅ Eseguendo setup principale..."
    bash SETUP_LEGAL_PROCESSING.sh
    echo ""
else
    echo "❌ SETUP_LEGAL_PROCESSING.sh non trovato!"
    exit 1
fi

# Move instruction files into worker folders
echo "📂 Organizzando istruzioni per workers..."

BASE="$HOME/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS"

cp "INSTRUCTIONS_WORKER_1_Tax_Investment.md" "$BASE/Worker_1_Tax_Investment/" 2>/dev/null
cp "INSTRUCTIONS_WORKER_2_Immigration_Manpower.md" "$BASE/Worker_2_Immigration_Manpower/" 2>/dev/null
cp "INSTRUCTIONS_WORKER_3_Omnibus_Licensing.md" "$BASE/Worker_3_Omnibus_Licensing/" 2>/dev/null
cp "INSTRUCTIONS_WORKER_4_Property_Environment.md" "$BASE/Worker_4_Property_Environment/" 2>/dev/null
cp "INSTRUCTIONS_WORKER_5_Healthcare_Social.md" "$BASE/Worker_5_Healthcare_Social/" 2>/dev/null
cp "INSTRUCTIONS_WORKER_6_Specialized.md" "$BASE/Worker_6_Specialized/" 2>/dev/null

# Copy master template to each worker
for worker in Worker_*; do
    cp "MASTER_PROMPT_TEMPLATE.md" "$BASE/$worker/" 2>/dev/null
done

echo "✅ Istruzioni copiate"
echo ""

# Copy main README
cp "README_LEGAL_PROCESSING.md" "$HOME/Desktop/LEGAL_PROCESSING_ZANTARA/" 2>/dev/null
echo "✅ README principale copiato"
echo ""

# Create quick reference
cat > "$HOME/Desktop/LEGAL_PROCESSING_ZANTARA/QUICK_START.md" << 'EOF'
# 🚀 QUICK START

## Hai appena completato il setup!

### Prossimi step:

1. **Scarica i 24 PDF** delle leggi indonesiane
   - Mettili in: `01_RAW_LAWS/`

2. **Assegna leggi ai workers**
   ```bash
   # Worker #1: Tax & Investment (4 leggi)
   cp 01_RAW_LAWS/UU-7-2021.pdf 02_AI_WORKERS/Worker_1_Tax_Investment/INPUT/
   cp 01_RAW_LAWS/UU-25-2007.pdf 02_AI_WORKERS/Worker_1_Tax_Investment/INPUT/
   # ... continua per tutti i workers
   ```

3. **Leggi le istruzioni specifiche**
   - Ogni worker ha il suo `INSTRUCTIONS_WORKER_X.md`
   - + `MASTER_PROMPT_TEMPLATE.md` per il prompt completo

4. **Inizia il processing**
   - Segui il MASTER_PROMPT_TEMPLATE
   - Usa PP 28/2025 come gold standard

5. **Salva gli output**
   - Tutti i file in `OUTPUT/` della tua cartella worker

6. **Traccia il progresso**
   - Aggiorna `FINAL_CHECKLIST_ZERO_MASTER.md`

---

**Hai domande?** Leggi `README_LEGAL_PROCESSING.md`
EOF

echo "📄 Quick start guide creato"
echo ""

# Final summary
echo "════════════════════════════════════════"
echo "✅ SETUP COMPLETATO!"
echo "════════════════════════════════════════"
echo ""
echo "📂 Struttura creata in:"
echo "   ~/Desktop/LEGAL_PROCESSING_ZANTARA/"
echo ""
echo "📋 Files chiave:"
echo "   - README_LEGAL_PROCESSING.md"
echo "   - QUICK_START.md"
echo "   - FINAL_CHECKLIST_ZERO_MASTER.md"
echo ""
echo "👷 6 Workers pronti:"
echo "   - Worker #1: Tax & Investment (4 leggi)"
echo "   - Worker #2: Immigration & Manpower (4 leggi)"
echo "   - Worker #3: Omnibus & Licensing (4 leggi)"
echo "   - Worker #4: Property & Environment (5 leggi)"
echo "   - Worker #5: Healthcare & Social (4 leggi)"
echo "   - Worker #6: Specialized (4 leggi)"
echo ""
echo "🎯 Prossimo step:"
echo "   Scarica 24 PDF delle leggi in 01_RAW_LAWS/"
echo ""
echo "📖 Per iniziare:"
echo "   cd ~/Desktop/LEGAL_PROCESSING_ZANTARA"
echo "   cat QUICK_START.md"
echo ""

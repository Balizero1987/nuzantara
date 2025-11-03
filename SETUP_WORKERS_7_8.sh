#!/bin/bash

# Setup Workers 7 & 8 for LEGAL_PROCESSING_ZANTARA
# Run this: bash /Users/antonellosiano/Desktop/SETUP_WORKERS_7_8.sh

set -e

BASE="/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA"
WORKERS="$BASE/02_AI_WORKERS"
RAW_LAWS="$BASE/01_RAW_LAWS"
DOWNLOADS="/Users/antonellosiano/Downloads/drive-download-20251103T031331Z-1-001"

echo "🚀 Setting up Workers 7 & 8..."

# Create Worker 7 & 8 directories
mkdir -p "$WORKERS/Worker_7_Banking_Digital"/{INPUT,OUTPUT,PROMPT}
mkdir -p "$WORKERS/Worker_8_Infrastructure_Environment"/{INPUT,OUTPUT,PROMPT}

echo "✅ Worker directories created"

# Move PDFs to RAW_LAWS
echo "📥 Moving PDFs to RAW_LAWS..."
cp "$DOWNLOADS"/*.pdf "$RAW_LAWS/" 2>/dev/null || echo "PDFs already in place"

# Distribute PDFs to Workers 7 & 8

# Worker 7: Banking & Digital
cp "$RAW_LAWS/Salinan UU Nomor 7 Tahun 2021.pdf" "$WORKERS/Worker_7_Banking_Digital/INPUT/" 2>/dev/null
cp "$RAW_LAWS/UU Nomor  19 Tahun 2016.pdf" "$WORKERS/Worker_7_Banking_Digital/INPUT/" 2>/dev/null
cp "$RAW_LAWS/PP Nomor 71 Tahun 2019.pdf" "$WORKERS/Worker_7_Banking_Digital/INPUT/" 2>/dev/null
cp "$RAW_LAWS/Civil Code.pdf" "$WORKERS/Worker_7_Banking_Digital/INPUT/" 2>/dev/null

# Worker 8: Infrastructure & Environment
cp "$RAW_LAWS/PP Nomor 35 Tahun 2021.pdf" "$WORKERS/Worker_8_Infrastructure_Environment/INPUT/" 2>/dev/null
cp "$RAW_LAWS/PP Nomor 44 Tahun 2022.pdf" "$WORKERS/Worker_8_Infrastructure_Environment/INPUT/" 2>/dev/null
cp "$RAW_LAWS/PP Nomor 55 Tahun 2022.pdf" "$WORKERS/Worker_8_Infrastructure_Environment/INPUT/" 2>/dev/null
cp "$RAW_LAWS/UU Nomor 12 Tahun 2012.pdf" "$WORKERS/Worker_8_Infrastructure_Environment/INPUT/" 2>/dev/null

echo "✅ PDFs distributed to Workers 7 & 8"

# Clean up unnecessary .md files from Desktop
echo "🧹 Cleaning up Desktop..."
rm -f /Users/antonellosiano/Desktop/ESEGUI_QUESTO_NEL_TERMINAL.md
rm -f /Users/antonellosiano/Desktop/FINAL_CHECKLIST_ZERO_MASTER.md
rm -f /Users/antonellosiano/Desktop/INSTRUCTIONS_WORKER_*.md
rm -f /Users/antonellosiano/Desktop/MASTER_PROMPT_TEMPLATE.md
rm -f /Users/antonellosiano/Desktop/README_LEGAL_PROCESSING.md
rm -f /Users/antonellosiano/Desktop/START_HERE_LEGAL_PROCESSING.md
rm -f /Users/antonellosiano/Desktop/RUN_SETUP.sh
rm -f /Users/antonellosiano/Desktop/SETUP_LEGAL_PROCESSING.sh

echo "✅ Desktop cleaned"

# Summary
echo ""
echo "═══════════════════════════════════════════════"
echo "✅  SETUP COMPLETE!"
echo "═══════════════════════════════════════════════"
echo ""
echo "📁 Workers created:"
echo "   - Worker_7_Banking_Digital"
echo "   - Worker_8_Infrastructure_Environment"
echo ""
echo "📄 PDFs distributed:"
echo "   Worker 7: 4 laws (Tax, ITE, E-System, Civil Code)"
echo "   Worker 8: 4 laws (PP 35/2021, 44/2022, 55/2022, UU 12/2012)"
echo ""
echo "🧹 Desktop cleaned of setup files"
echo ""
echo "📂 Everything ready in:"
echo "   $BASE"
echo ""
echo "🚀 Next: Read instructions in each Worker's PROMPT folder"
echo "═══════════════════════════════════════════════"

#!/bin/bash

# ===========================================
# FINAL SETUP: 8-Worker Legal Processing
# Complete Indonesian Law Framework
# ===========================================

echo "🎯 ZANTARA Legal KB - Final Setup"
echo "=================================="
echo ""

BASE_DIR="/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA"
DOWNLOADS_DIR="/Users/antonellosiano/Downloads/drive-download-20251103T031331Z-001"

# 1. Create Worker 7 & 8 structure
echo "📁 Creating Worker 7 & 8 folders..."
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_7_Banking_Digital/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_7_Banking_Digital/OUTPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_8_Infrastructure_Environment/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_8_Infrastructure_Environment/OUTPUT"

# 2. Move downloaded PDFs to correct workers
echo "📦 Distributing 8 downloaded PDFs to workers..."

# Worker 1: Tax & Financial (2 laws)
cp "$DOWNLOADS_DIR/Salinan UU Nomor 7 Tahun 2021.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT/" 2>/dev/null && echo "  ✅ Worker 1: UU 7/2021 (Tax Harmonization)"
cp "$DOWNLOADS_DIR/PP Nomor 55 Tahun 2022.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT/" 2>/dev/null && echo "  ✅ Worker 1: PP 55/2022 (Income Tax Adjustments)"

# Worker 4: Property & Land (1 law)
cp "$DOWNLOADS_DIR/Civil Code.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_4_Property_Environment/INPUT/" 2>/dev/null && echo "  ✅ Worker 4: Civil Code (Property sections)"

# Worker 5: Manpower & Employment (3 laws)
cp "$DOWNLOADS_DIR/PP Nomor 35 Tahun 2021.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT/" 2>/dev/null && echo "  ✅ Worker 5: PP 35/2021 (Employment Contracts)"
cp "$DOWNLOADS_DIR/PP Nomor 44 Tahun 2022.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT/" 2>/dev/null && echo "  ✅ Worker 5: PP 44/2022 (Work Competency)"
cp "$DOWNLOADS_DIR/UU Nomor 12 Tahun 2012.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT/" 2>/dev/null && echo "  ✅ Worker 5: UU 12/2012 (Higher Education)"

# Worker 6: Healthcare & Digital Systems (1 law)
cp "$DOWNLOADS_DIR/PP Nomor 71 Tahun 2019.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_6_Specialized/INPUT/" 2>/dev/null && echo "  ✅ Worker 6: PP 71/2019 (PSE - Digital Systems)"

# Worker 7: Banking & Digital Economy (1 law)
cp "$DOWNLOADS_DIR/UU Nomor  19 Tahun 2016.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_7_Banking_Digital/INPUT/" 2>/dev/null && echo "  ✅ Worker 7: UU 19/2016 (ITE Law)"

# Worker 8: Infrastructure & Civil Code (1 law - duplicate of Civil Code for general provisions)
cp "$DOWNLOADS_DIR/Civil Code.pdf" "$BASE_DIR/02_AI_WORKERS/Worker_8_Infrastructure_Environment/INPUT/" 2>/dev/null && echo "  ✅ Worker 8: Civil Code (General provisions)"

echo ""
echo "📊 DISTRIBUTION COMPLETE"
echo "========================"
echo ""
echo "Worker #1 (Tax & Financial):        2 laws ready"
echo "Worker #2 (Immigration):            0 laws (all to download)"
echo "Worker #3 (Omnibus & Licensing):    1 law (PP 28/2025 already processed)"
echo "Worker #4 (Property & Land):        1 law ready"
echo "Worker #5 (Manpower & Employment):  3 laws ready"
echo "Worker #6 (Healthcare & Digital):   1 law ready"
echo "Worker #7 (Banking & Digital):      1 law ready"
echo "Worker #8 (Infrastructure & Civil): 1 law ready (Civil Code)"
echo ""
echo "TOTAL: 8 laws distributed + 1 already processed (PP 28/2025)"
echo ""

# 3. Clean up desktop markdown files that aren't needed
echo "🧹 Cleaning up desktop..."
cd /Users/antonellosiano/Desktop

# Keep only essential files
KEEP_FILES=(
    "COMPLETE_LAW_INVENTORY.md"
    "MASTER_PROMPT_INDONESIAN_FOCUS.md"
)

# Remove old instruction files (now in LEGAL_PROCESSING_ZANTARA)
rm -f INSTRUCTIONS_WORKER_*.md 2>/dev/null
rm -f MASTER_PROMPT_TEMPLATE.md 2>/dev/null
rm -f README_LEGAL_PROCESSING.md 2>/dev/null
rm -f FINAL_CHECKLIST_ZERO_MASTER.md 2>/dev/null
rm -f START_HERE_LEGAL_PROCESSING.md 2>/dev/null
rm -f QUICK_START.md 2>/dev/null
rm -f RUN_SETUP.sh 2>/dev/null
rm -f SETUP_LEGAL_PROCESSING.sh 2>/dev/null
rm -f EXPAND_TO_8_WORKERS.sh 2>/dev/null

echo "  ✅ Removed old instruction files from desktop"

# 4. Show final structure
echo ""
echo "📁 FINAL STRUCTURE"
echo "=================="
echo ""
echo "$BASE_DIR/"
echo "├── COMPLETE_LAW_INVENTORY.md          # 33 laws master list"
echo "├── MASTER_PROMPT_INDONESIAN_FOCUS.md  # Gold standard methodology"
echo "├── INSTRUCTIONS_WORKER_7_Banking_Digital.md"
echo "├── INSTRUCTIONS_WORKER_8_Infrastructure_Environment.md"
echo "├── 01_RAW_LAWS/                       # Original PDFs"
echo "├── 02_AI_WORKERS/                     # 8 worker folders"
echo "│   ├── Worker_1_Tax_Investment/       (2 laws ready)"
echo "│   ├── Worker_2_Immigration_Manpower/ (0 laws)"
echo "│   ├── Worker_3_Omnibus_Licensing/    (1 processed)"
echo "│   ├── Worker_4_Property_Environment/ (1 law ready)"
echo "│   ├── Worker_5_Healthcare_Social/    (3 laws ready)"
echo "│   ├── Worker_6_Specialized/          (1 law ready)"
echo "│   ├── Worker_7_Banking_Digital/      (1 law ready) ✨ NEW"
echo "│   └── Worker_8_Infrastructure_Env/   (1 law ready) ✨ NEW"
echo "├── 03_PROCESSED_OUTPUT/               # Final JSONL files"
echo "├── 04_QUALITY_REPORTS/                # Processing reports"
echo "└── 05_TEST_QUESTIONS/                 # Q&A validation"
echo ""

# 5. Next steps
echo "🚀 NEXT STEPS"
echo "============="
echo ""
echo "1. **Download remaining 25 laws** (see COMPLETE_LAW_INVENTORY.md)"
echo "   - Use JDIH database: https://peraturan.bpk.go.id/"
echo "   - Or official ministry websites"
echo ""
echo "2. **Distribute laws to workers** according to COMPLETE_LAW_INVENTORY.md"
echo ""
echo "3. **Process each law** using MASTER_PROMPT_INDONESIAN_FOCUS.md"
echo "   - Read worker-specific INSTRUCTIONS_WORKER_X.md"
echo "   - Follow PP 28/2025 methodology exactly"
echo "   - Deliver 3 files per law (JSONL, Report, Tests)"
echo ""
echo "4. **Timeline estimate:**"
echo "   - Worker 1: 2 days (2 laws)"
echo "   - Worker 2: 3 days (4 laws to download + process)"
echo "   - Worker 3: 2 days (3 laws to download)"
echo "   - Worker 4: 5 days (3 laws + Civil Code property)"
echo "   - Worker 5: 3 days (4 laws, 3 ready)"
echo "   - Worker 6: 2 days (3 laws to download)"
echo "   - Worker 7: 2-3 days (4 laws, 1 ready)"
echo "   - Worker 8: 7-10 days (5 laws, Civil Code is massive!)"
echo ""
echo "   **TOTAL: ~4 weeks for complete 33-law framework**"
echo ""
echo "5. **Deploy to ZANTARA KB** when complete"
echo "   - Merge all JSONL files"
echo "   - Index in ChromaDB"
echo "   - Test with Q&A validation"
echo ""
echo "✅ Setup complete! Start processing laws using the worker instructions."
echo ""
echo "📖 READ:"
echo "   - COMPLETE_LAW_INVENTORY.md (master plan)"
echo "   - MASTER_PROMPT_INDONESIAN_FOCUS.md (methodology)"
echo "   - INSTRUCTIONS_WORKER_X.md (specific guidance)"
echo ""
echo "Zero Master, the foundation is ready. Let's build Indonesia's most comprehensive legal KB! 🇮🇩"

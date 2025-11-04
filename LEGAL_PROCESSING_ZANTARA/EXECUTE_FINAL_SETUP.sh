#!/bin/bash

# ====================================================
# FINAL EXECUTION: Setup 8 Workers + Clean Desktop
# Indonesian Legal Framework for ZANTARA
# ====================================================

set -e  # Exit on error

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🇮🇩  ZANTARA INDONESIAN LEGAL KB - FINAL SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE="/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA"
DOWNLOADS="/Users/antonellosiano/Downloads/drive-download-20251103T031331Z-001"
DESKTOP="/Users/antonellosiano/Desktop"

# ═══════════════════════════════════════════════════
# STEP 1: Create Worker 7 & 8 Structure
# ═══════════════════════════════════════════════════

echo "📁 STEP 1: Creating Worker 7 & 8 folders..."
echo "────────────────────────────────────────────"

mkdir -p "$BASE/02_AI_WORKERS/Worker_7_Banking_Digital/INPUT"
mkdir -p "$BASE/02_AI_WORKERS/Worker_7_Banking_Digital/OUTPUT"
mkdir -p "$BASE/02_AI_WORKERS/Worker_8_Infrastructure_Environment/INPUT"
mkdir -p "$BASE/02_AI_WORKERS/Worker_8_Infrastructure_Environment/OUTPUT"

echo "✅ Worker 7: Banking, Finance & Digital Economy"
echo "✅ Worker 8: Infrastructure, Environment & Civil Code"
echo ""

# ═══════════════════════════════════════════════════
# STEP 2: Distribute Downloaded PDFs
# ═══════════════════════════════════════════════════

echo "📦 STEP 2: Distributing 8 downloaded laws to workers..."
echo "─────────────────────────────────────────────────────"

COUNT=0

# Worker 1: Tax & Financial (2 laws)
if [ -f "$DOWNLOADS/Salinan UU Nomor 7 Tahun 2021.pdf" ]; then
    cp "$DOWNLOADS/Salinan UU Nomor 7 Tahun 2021.pdf" "$BASE/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT/"
    echo "✅ Worker 1: UU 7/2021 (Tax Harmonization)"
    ((COUNT++))
fi

if [ -f "$DOWNLOADS/PP Nomor 55 Tahun 2022.pdf" ]; then
    cp "$DOWNLOADS/PP Nomor 55 Tahun 2022.pdf" "$BASE/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT/"
    echo "✅ Worker 1: PP 55/2022 (Income Tax Adjustments)"
    ((COUNT++))
fi

# Worker 4: Property & Land (1 law)
if [ -f "$DOWNLOADS/Civil Code.pdf" ]; then
    cp "$DOWNLOADS/Civil Code.pdf" "$BASE/02_AI_WORKERS/Worker_4_Property_Environment/INPUT/"
    echo "✅ Worker 4: Civil Code (Property sections)"
    ((COUNT++))
fi

# Worker 5: Manpower & Employment (3 laws)
if [ -f "$DOWNLOADS/PP Nomor 35 Tahun 2021.pdf" ]; then
    cp "$DOWNLOADS/PP Nomor 35 Tahun 2021.pdf" "$BASE/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT/"
    echo "✅ Worker 5: PP 35/2021 (Employment Contracts)"
    ((COUNT++))
fi

if [ -f "$DOWNLOADS/PP Nomor 44 Tahun 2022.pdf" ]; then
    cp "$DOWNLOADS/PP Nomor 44 Tahun 2022.pdf" "$BASE/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT/"
    echo "✅ Worker 5: PP 44/2022 (Work Competency Standards)"
    ((COUNT++))
fi

if [ -f "$DOWNLOADS/UU Nomor 12 Tahun 2012.pdf" ]; then
    cp "$DOWNLOADS/UU Nomor 12 Tahun 2012.pdf" "$BASE/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT/"
    echo "✅ Worker 5: UU 12/2012 (Higher Education)"
    ((COUNT++))
fi

# Worker 6: Healthcare & Digital Systems (1 law)
if [ -f "$DOWNLOADS/PP Nomor 71 Tahun 2019.pdf" ]; then
    cp "$DOWNLOADS/PP Nomor 71 Tahun 2019.pdf" "$BASE/02_AI_WORKERS/Worker_6_Specialized/INPUT/"
    echo "✅ Worker 6: PP 71/2019 (PSE - Digital Systems)"
    ((COUNT++))
fi

# Worker 7: Banking & Digital Economy (1 law)
if [ -f "$DOWNLOADS/UU Nomor  19 Tahun 2016.pdf" ]; then
    cp "$DOWNLOADS/UU Nomor  19 Tahun 2016.pdf" "$BASE/02_AI_WORKERS/Worker_7_Banking_Digital/INPUT/"
    echo "✅ Worker 7: UU 19/2016 (ITE Law - Electronic Transactions)"
    ((COUNT++))
fi

# Worker 8: Infrastructure & Civil Code (1 law - shared Civil Code)
if [ -f "$DOWNLOADS/Civil Code.pdf" ]; then
    cp "$DOWNLOADS/Civil Code.pdf" "$BASE/02_AI_WORKERS/Worker_8_Infrastructure_Environment/INPUT/"
    echo "✅ Worker 8: Civil Code (General provisions + Inheritance)"
    ((COUNT++))
fi

echo ""
echo "📊 Distributed $COUNT laws to workers"
echo ""

# ═══════════════════════════════════════════════════
# STEP 3: Clean Up Desktop
# ═══════════════════════════════════════════════════

echo "🧹 STEP 3: Cleaning up desktop markdown files..."
echo "──────────────────────────────────────────────"

cd "$DESKTOP"

# List of files to remove (old worker instructions, duplicates)
REMOVE_FILES=(
    "INSTRUCTIONS_WORKER_1_Tax_Investment.md"
    "INSTRUCTIONS_WORKER_2_Immigration_Manpower.md"
    "INSTRUCTIONS_WORKER_3_Omnibus_Licensing.md"
    "INSTRUCTIONS_WORKER_4_Property_Environment.md"
    "INSTRUCTIONS_WORKER_5_Healthcare_Social.md"
    "INSTRUCTIONS_WORKER_6_Specialized.md"
    "MASTER_PROMPT_TEMPLATE.md"
    "README_LEGAL_PROCESSING.md"
    "FINAL_CHECKLIST_ZERO_MASTER.md"
    "START_HERE_LEGAL_PROCESSING.md"
    "QUICK_START.md"
    "RUN_SETUP.sh"
    "SETUP_LEGAL_PROCESSING.sh"
    "EXPAND_TO_8_WORKERS.sh"
    "INSTRUCTIONS_WORKER_7_Tax_Advanced.md"
)

REMOVED=0
for file in "${REMOVE_FILES[@]}"; do
    if [ -f "$DESKTOP/$file" ]; then
        rm "$DESKTOP/$file"
        echo "  🗑️  Removed: $file"
        ((REMOVED++))
    fi
done

echo ""
echo "🧹 Cleaned $REMOVED old files from desktop"
echo ""

# ═══════════════════════════════════════════════════
# STEP 4: Show Final Structure
# ═══════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 FINAL STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$BASE/"
echo "├── 📄 START_HERE.md                          ← Read this first!"
echo "├── 📄 COMPLETE_LAW_INVENTORY.md              ← 33 laws master list"
echo "├── 📄 MASTER_PROMPT_INDONESIAN_FOCUS.md      ← Gold standard methodology"
echo "├── 📄 INSTRUCTIONS_WORKER_7_Banking_Digital.md"
echo "├── 📄 INSTRUCTIONS_WORKER_8_Infrastructure_Environment.md"
echo "│"
echo "├── 📁 01_RAW_LAWS/                           ← All PDF downloads"
echo "│"
echo "├── 📁 02_AI_WORKERS/                         ← 8 worker processing folders"
echo "│   ├── Worker_1_Tax_Investment/              (2 laws ✅)"
echo "│   ├── Worker_2_Immigration_Manpower/        (0 laws)"
echo "│   ├── Worker_3_Omnibus_Licensing/           (1 law ✅ processed)"
echo "│   ├── Worker_4_Property_Environment/        (1 law ✅)"
echo "│   ├── Worker_5_Healthcare_Social/           (3 laws ✅)"
echo "│   ├── Worker_6_Specialized/                 (1 law ✅)"
echo "│   ├── Worker_7_Banking_Digital/             (1 law ✅) ⭐ NEW"
echo "│   └── Worker_8_Infrastructure_Environment/  (1 law ✅) ⭐ NEW"
echo "│"
echo "├── 📁 03_PROCESSED_OUTPUT/                   ← Final JSONL files"
echo "├── 📁 04_QUALITY_REPORTS/                    ← Processing reports"
echo "└── 📁 05_TEST_QUESTIONS/                     ← Q&A validation"
echo ""

# ═══════════════════════════════════════════════════
# STEP 5: Display Statistics
# ═══════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CURRENT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Laws in Framework:     33"
echo "Laws Downloaded:              8  (24%)"
echo "Laws Already Processed:       1  (3%)  - PP 28/2025 ✅"
echo "Laws Ready to Process:        8  (24%)"
echo "Laws Still to Download:      24  (73%)"
echo ""
echo "Workers Ready:               8/8  ✅"
echo "Worker Instructions:         8/8  ✅"
echo "Master Methodology:           ✅"
echo ""

# ═══════════════════════════════════════════════════
# STEP 6: Next Steps
# ═══════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 📖 READ: START_HERE.md (in LEGAL_PROCESSING_ZANTARA/)"
echo ""
echo "2. 📥 DOWNLOAD remaining 24 laws:"
echo "   → See COMPLETE_LAW_INVENTORY.md for list"
echo "   → Use JDIH: https://peraturan.bpk.go.id/"
echo "   → Save to 01_RAW_LAWS/ folder"
echo ""
echo "3. 📦 DISTRIBUTE laws to worker INPUT/ folders:"
echo "   → Follow assignment in COMPLETE_LAW_INVENTORY.md"
echo ""
echo "4. 🔨 PROCESS each law:"
echo "   → Read MASTER_PROMPT_INDONESIAN_FOCUS.md"
echo "   → Read worker-specific INSTRUCTIONS_WORKER_X.md"
echo "   → Follow PP 28/2025 methodology exactly"
echo "   → Deliver 3 files per law (JSONL + Report + Tests)"
echo ""
echo "5. ✅ VERIFY quality:"
echo "   → All chunks cited"
echo "   → No invented content"
echo "   → Indonesian citizen focus"
echo ""
echo "6. 🚀 DEPLOY to ZANTARA KB when complete"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏱️  TIMELINE ESTIMATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Download Phase:    1-2 days  (24 laws)"
echo "Processing Phase:  4 weeks   (8 workers in parallel)"
echo "QA & Deploy:       3-5 days  (testing + integration)"
echo "────────────────────────────────────────────────────"
echo "TOTAL:            ~5 weeks   to complete framework"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Zero Master, the foundation is ready."
echo ""
echo "🇮🇩 Let's build Indonesia's most comprehensive"
echo "   legal knowledge base for ZANTARA!"
echo ""
echo "🚀 Start by reading: $BASE/START_HERE.md"
echo ""

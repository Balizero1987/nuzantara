#!/bin/bash

# ZANTARA Legal Processing - System Status Check
# Quick verification that everything is in place

echo "════════════════════════════════════════════════════════════════"
echo "  🏛️  ZANTARA LEGAL PROCESSING SYSTEM - STATUS CHECK"
echo "════════════════════════════════════════════════════════════════"
echo ""

BASE_DIR="$HOME/Desktop/LEGAL_PROCESSING_ZANTARA"
cd "$BASE_DIR" || exit 1

# Check Workers
echo "🤖 AI WORKERS STATUS:"
echo "────────────────────────────────────────────────────────────────"
for i in {1..8}; do
    WORKER_DIR=$(find 02_AI_WORKERS -maxdepth 1 -type d -name "Worker_${i}_*" 2>/dev/null | head -1)
    if [ -d "$WORKER_DIR" ]; then
        WORKER_NAME=$(basename "$WORKER_DIR" | cut -d'_' -f3-)
        PDF_COUNT=$(ls -1 "$WORKER_DIR/INPUT"/*.pdf 2>/dev/null | wc -l | tr -d ' ')
        PROMPT_EXISTS="❌"
        [ -f "$WORKER_DIR/WORKER_${i}_COMPLETE_PROMPT.md" ] && PROMPT_EXISTS="✅"
        
        echo "  Worker $i - $WORKER_NAME"
        echo "    PDFs in INPUT: $PDF_COUNT"
        echo "    Complete Prompt: $PROMPT_EXISTS"
        echo ""
    fi
done

# Check Documentation
echo "📚 DOCUMENTATION:"
echo "────────────────────────────────────────────────────────────────"
DOCS=("START_HERE_ZERO.md" "COMPLETE_SETUP_GUIDE.md" "SETUP_COMPLETE_SUMMARY.md" "QUICK_REFERENCE.md" "MASTER_PROMPT_INDONESIAN_FOCUS.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ❌ $doc (missing)"
    fi
done
echo ""

# Check Scripts
echo "🔧 AUTOMATION SCRIPTS:"
echo "────────────────────────────────────────────────────────────────"
SCRIPTS=("MOVE_NEW_PDFS.sh" "CLEANUP_DOCS.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo "  ✅ $script (executable)"
        else
            echo "  ⚠️  $script (not executable - run: chmod +x $script)"
        fi
    else
        echo "  ❌ $script (missing)"
    fi
done
echo ""

# Check Directory Structure
echo "📂 DIRECTORY STRUCTURE:"
echo "────────────────────────────────────────────────────────────────"
DIRS=("01_RAW_LAWS" "02_AI_WORKERS" "03_PROCESSED_OUTPUT" "04_QUALITY_REPORTS" "05_TEST_QUESTIONS")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FILE_COUNT=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')
        echo "  ✅ $dir/ ($FILE_COUNT files)"
    else
        echo "  ❌ $dir/ (missing)"
    fi
done
echo ""

# Check for new PDFs to process
echo "📥 NEW PDFs TO ASSIGN:"
echo "────────────────────────────────────────────────────────────────"
DOWNLOAD_DIR="$HOME/Downloads/drive-download-20251103T031331Z-1-001"
if [ -d "$DOWNLOAD_DIR" ]; then
    NEW_PDF_COUNT=$(ls -1 "$DOWNLOAD_DIR"/*.pdf 2>/dev/null | wc -l | tr -d ' ')
    if [ "$NEW_PDF_COUNT" -gt 0 ]; then
        echo "  ⚠️  $NEW_PDF_COUNT PDFs found in Downloads"
        echo "  → Run: ./MOVE_NEW_PDFS.sh to assign them"
    else
        echo "  ✅ No new PDFs in Downloads"
    fi
else
    echo "  ℹ️  Download directory not found"
fi
echo ""

# Gold Standard Check
echo "🏆 GOLD STANDARD (PP 28/2025):"
echo "────────────────────────────────────────────────────────────────"
if [ -d "../PP28_FINAL_PACKAGE" ]; then
    echo "  ✅ Gold standard available at ../PP28_FINAL_PACKAGE/"
else
    echo "  ⚠️  Gold standard not found (expected at Desktop/PP28_FINAL_PACKAGE)"
fi
echo ""

# Final Summary
echo "════════════════════════════════════════════════════════════════"
echo "  📊 SYSTEM STATUS SUMMARY"
echo "════════════════════════════════════════════════════════════════"
TOTAL_PDFS=$(find 02_AI_WORKERS -name "*.pdf" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_OUTPUT=$(find 03_PROCESSED_OUTPUT -name "*.jsonl" 2>/dev/null | wc -l | tr -d ' ')

echo "  Workers Configured: 8"
echo "  PDFs Ready to Process: $TOTAL_PDFS"
echo "  Laws Already Processed: $TOTAL_OUTPUT"
echo "  Target: 33 core laws + 8 new = 41 total"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🚀 READY TO START?"
echo "   1. Run: ./MOVE_NEW_PDFS.sh (if new PDFs exist)"
echo "   2. Read: START_HERE_ZERO.md"
echo "   3. Begin: Worker 1 (Tax - highest priority)"
echo ""
echo "   Full guide: COMPLETE_SETUP_GUIDE.md"
echo "   Quick ref: QUICK_REFERENCE.md"
echo ""
echo "════════════════════════════════════════════════════════════════"

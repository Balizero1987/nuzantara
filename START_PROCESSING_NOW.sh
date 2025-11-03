#!/bin/bash

# ZANTARA Legal Processing - Quick Start Script
# Run this to begin processing immediately

clear
echo "════════════════════════════════════════════════════════════════"
echo "  🏛️  ZANTARA LEGAL PROCESSING - QUICK START"
echo "════════════════════════════════════════════════════════════════"
echo ""

cd ~/Desktop/LEGAL_PROCESSING_ZANTARA || exit 1

echo "Step 1: Making scripts executable..."
chmod +x *.sh
echo "✅ Done"
echo ""

echo "Step 2: Checking system status..."
echo "────────────────────────────────────────────────────────────────"
./CHECK_STATUS.sh
echo ""

echo "Step 3: Ready to assign new PDFs?"
echo "────────────────────────────────────────────────────────────────"
read -p "Run MOVE_NEW_PDFS.sh now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./MOVE_NEW_PDFS.sh
    echo ""
fi

echo "Step 4: Opening documentation..."
echo "────────────────────────────────────────────────────────────────"
echo "  📖 README.md - System overview"
echo "  📖 QUICK_REFERENCE.md - 1-page cheatsheet"
echo "  📖 START_HERE_ZERO.md - Quick start guide"
echo ""
read -p "Open README.md? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open README.md
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🚀 READY TO START PROCESSING!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. cd 02_AI_WORKERS/Worker_1_Tax_Investment"
echo "  2. open WORKER_1_COMPLETE_PROMPT.md"
echo "  3. Copy prompt → Use AI → Upload PDF → Process!"
echo ""
echo "Worker 1 is highest priority (Tax & Investment)."
echo ""
echo "Good luck, Zero! 💪"
echo "════════════════════════════════════════════════════════════════"

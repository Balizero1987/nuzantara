#!/bin/bash

# Clean up unnecessary markdown files from LEGAL_PROCESSING_ZANTARA
# Keep only essential documentation

cd ~/Desktop/LEGAL_PROCESSING_ZANTARA || exit 1

echo "🧹 Cleaning up unnecessary documentation..."
echo ""

# Keep these essential files:
# - COMPLETE_SETUP_GUIDE.md (main guide)
# - MASTER_PROMPT_INDONESIAN_FOCUS.md (methodology)
# - README_LEGAL_PROCESSING.md (system overview)
# - COMPLETE_LAW_INVENTORY_33_LAWS.md (law list)

# Archive the rest
ARCHIVE_DIR="00_ARCHIVED_DOCS"
mkdir -p "$ARCHIVE_DIR"

# List of files to archive (not delete, just move)
FILES_TO_ARCHIVE=(
    "COMPLETE_LAW_INVENTORY.md"
    "EXPAND_TO_8_WORKERS.sh"
    "EXECUTE_FINAL_SETUP.sh"
    "FINAL_SETUP_AND_CLEANUP.sh"
    "INSTRUCTIONS_WORKER_7_Banking_Digital.md"
    "INSTRUCTIONS_WORKER_7_Tax_Advanced.md"
    "INSTRUCTIONS_WORKER_8_Infrastructure_Environment.md"
    "QUICK_START.md"
    "SETUP_8_WORKERS.sh"
    "SETUP_WORKERS_7_8_COMPLETE.sh"
    "START_HERE.md"
    "SUMMARY_ITALIANO.md"
    "WORKERS_7_8_READY.md"
)

for file in "${FILES_TO_ARCHIVE[@]}"; do
    if [ -f "$file" ]; then
        echo "  📦 Archiving: $file"
        mv "$file" "$ARCHIVE_DIR/"
    fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📁 Active documentation:"
ls -1 *.md 2>/dev/null || echo "  (None - all archived)"
echo ""
echo "📦 Archived documentation:"
ls -1 "$ARCHIVE_DIR/" | head -5
echo "  ... (see $ARCHIVE_DIR/ for full list)"
echo ""
echo "🎯 Main guide: COMPLETE_SETUP_GUIDE.md"

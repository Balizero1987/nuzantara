#!/bin/bash
# cleanup-mac.sh - Riorganizzazione NUZANTARA-FLY

cd /Users/antonellosiano/Desktop/NUZANTARA-FLY

echo "🧹 Starting cleanup..."

# 1. Crea directory di archivio fuori dal repo
mkdir -p ../NUZANTARA-ARCHIVE

# 2. Muovi directory pesanti fuori dal repo (NON eliminare)
echo "📦 Archiving large directories..."
mv DATABASE ../NUZANTARA-ARCHIVE/ 2>/dev/null
mv archive ../NUZANTARA-ARCHIVE/ 2>/dev/null
mv foto ../NUZANTARA-ARCHIVE/ 2>/dev/null
mv LEGAL_PROCESSING_ZANTARA ../NUZANTARA-ARCHIVE/ 2>/dev/null
mv chatgpt ../NUZANTARA-ARCHIVE/ 2>/dev/null
mv data ../NUZANTARA-ARCHIVE/ 2>/dev/null
mv website ../NUZANTARA-ARCHIVE/ 2>/dev/null

# 3. Rimuovi directory temporanee/test
echo "🗑️  Removing temp directories..."
rm -rf INDONESIAN_LAWS_COMPLETE/LAWS_2025_OFFICIAL/
rm -rf apps/publication/node_modules
rm -rf apps/vibe-dashboard/dist
rm -rf apps/webapp/playwright-report

# 4. Pulisci build artifacts
echo "🔨 Cleaning build artifacts..."
find . -type d -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null
find . -type d -name "build" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null

# 5. Rimuovi log files
echo "📝 Removing logs..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

# 6. Report finale
echo ""
echo "✅ Cleanup completato!"
echo ""
echo "📊 Dimensioni finali:"
du -sh .
echo ""
echo "📁 Archiviato in: ../NUZANTARA-ARCHIVE/"
ls -lh ../NUZANTARA-ARCHIVE/

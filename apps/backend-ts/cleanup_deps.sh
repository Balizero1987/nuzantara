#!/bin/bash
set -e

echo "🧹 Nuzantara Backend - Pulizia Dipendenze"
echo "=========================================="
echo ""
echo "Questa operazione rimuoverà 18 pacchetti non utilizzati."
echo "Verrà creato un backup automatico (package.json.backup)."
echo ""
read -p "Procedere con la pulizia? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operazione annullata."
    exit 0
fi

echo ""
echo "📦 Step 1: Backup package.json..."
cp package.json package.json.backup
echo "✅ Backup creato: package.json.backup"

echo ""
echo "📦 Step 2: Applicazione package.json pulito..."
cp package.json.clean package.json
echo "✅ package.json aggiornato"

echo ""
echo "📦 Step 3: Rimozione vecchi node_modules..."
rm -rf node_modules package-lock.json
echo "✅ Rimossi node_modules e lock file"

echo ""
echo "📦 Step 4: Installazione dipendenze essenziali..."
npm install
echo "✅ Dipendenze installate"

echo ""
echo "📦 Step 5: Verifica build TypeScript..."
npm run build
echo "✅ Build completata con successo"

echo ""
echo "📊 Step 6: Statistiche finali..."
echo "- Dipendenze: $(grep -c '".*":' package.json | tail -1)"
echo "- Dimensione node_modules: $(du -sh node_modules | cut -f1)"
echo ""

echo "✅ PULIZIA COMPLETATA CON SUCCESSO!"
echo ""
echo "📝 Note:"
echo "- Backup salvato in: package.json.backup"
echo "- File di riferimento: package.json.clean"
echo "- Per rollback: cp package.json.backup package.json && npm install"
echo ""
echo "🚀 Il backend è pronto e ottimizzato!"

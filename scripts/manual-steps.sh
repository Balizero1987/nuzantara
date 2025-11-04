#!/bin/bash
# 🎯 SIMPLIFIED MAESTRO - Manual volume operations
set -e

echo "🎯 SIMPLIFIED VOLUME MIGRATION"
echo ""

APP="nuzantara-rag"
NEW_VOLUME="vol_493gxp8pg5wzdo64"  # Already created!
MACHINE="6e827190c14948"
TARBALL="/tmp/chromadb_migration_20251104_173446.tar.gz"  # Already exists!

echo "✅ Volume already created: $NEW_VOLUME"
echo "✅ Tarball already exists: $TARBALL"
echo ""

# Manual steps
echo "📋 MANUAL STEPS TO COMPLETE:"
echo ""
echo "1️⃣  Attach new volume to machine:"
echo "   fly machine update $MACHINE \\"
echo "     --app $APP \\"
echo "     --attach-volume $NEW_VOLUME:/data"
echo ""
echo "2️⃣  Start machine:"
echo "   fly machine start $MACHINE --app $APP"
echo ""
echo "3️⃣  Upload data via fly ssh (from another terminal):"
echo "   # Split tarball"
echo "   cd /tmp"
echo "   split -b 10m chromadb_migration_20251104_173446.tar.gz chunk_"
echo ""
echo "   # Upload each chunk"
echo "   for chunk in chunk_*; do"
echo "     base64 \$chunk > \${chunk}.b64"
echo "     cat \${chunk}.b64 | fly ssh console --app $APP --command 'cat > /tmp/'\$(basename \$chunk)'.b64'"
echo "     fly ssh console --app $APP --command 'base64 -d /tmp/'\$(basename \$chunk)'.b64 > /tmp/'\$(basename \$chunk)"
echo "   done"
echo ""
echo "4️⃣  Reassemble on remote:"
echo "   fly ssh console --app $APP --command \\"
echo "     'cat /tmp/chunk_* > /tmp/chromadb.tar.gz && rm /tmp/chunk_*'"
echo ""
echo "5️⃣  Extract:"
echo "   fly ssh console --app $APP --command \\"
echo "     'cd /data && tar -xzf /tmp/chromadb.tar.gz && mv chromadb chroma_db'"
echo ""
echo "6️⃣  Restart:"
echo "   fly apps restart $APP"
echo ""

echo "═══════════════════════════════════════════════"
echo "OR USE SIMPLER APPROACH: Deploy with data in Dockerfile"
echo "═══════════════════════════════════════════════"

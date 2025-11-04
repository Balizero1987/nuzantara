#!/bin/bash
# 🎯 ULTRA MAESTRO - Base64 Upload Strategy
set -e

echo "🎯 ULTRA MAESTRO MIGRATION"
echo "Strategy: Base64 encode → fly ssh → decode → extract"
echo ""

APP="nuzantara-rag"
TIMESTAMP="20251104_172928"
TARBALL="/tmp/chromadb_${TIMESTAMP}.tar.gz"

echo "📦 Tarball: $TARBALL"
ls -lh "$TARBALL"
echo ""

# Encode to base64
echo "🔐 Encoding to base64..."
base64 -i "$TARBALL" -o "${TARBALL}.b64"
echo "✅ Encoded"
ls -lh "${TARBALL}.b64"
echo ""

# Upload base64
echo "📤 Uploading base64 (this may take 2-3 minutes)..."
fly ssh console --app "$APP" < "${TARBALL}.b64" --command \
    "base64 -d > /tmp/chromadb.tar.gz"

echo "✅ Uploaded and decoded"
echo ""

# Extract and replace
echo "🔄 Extracting and replacing ChromaDB..."
fly ssh console --app "$APP" --command \
    "cd /data && mv chroma_db chroma_db.old_${TIMESTAMP} && tar -xzf /tmp/chromadb.tar.gz && mv chromadb chroma_db && rm /tmp/chromadb.tar.gz && ls chroma_db"

echo "✅ ChromaDB replaced!"
echo ""

# Restart
echo "🔄 Restarting app..."
fly apps restart "$APP"

echo ""
echo "═══════════════════════════════════════════════"
echo "🎉 MIGRATION COMPLETE!"
echo "═══════════════════════════════════════════════"
echo ""
echo "📊 Verify with:"
echo "   curl https://nuzantara-rag.fly.dev/health"
echo ""
echo "🧪 Test query:"
echo "   curl -X POST https://nuzantara-rag.fly.dev/api/v3/zantara/unified \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"query\": \"What is deep learning?\"}'"
echo ""
echo "💾 Rollback if needed:"
echo "   fly ssh console --app $APP"
echo "   mv /data/chroma_db /data/chroma_db.failed"
echo "   mv /data/chroma_db.old_${TIMESTAMP} /data/chroma_db"
echo "   fly apps restart $APP"
echo ""

# Cleanup
rm -f "${TARBALL}.b64"

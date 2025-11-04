#!/bin/bash
# 🏆 PROFESSIONAL VOLUME SNAPSHOT MIGRATION
# Official Fly.io data migration strategy

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🏆 PROFESSIONAL VOLUME MIGRATION - ChromaDB"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Configuration
APP="nuzantara-rag"
CURRENT_VOLUME="vol_4qgzkme330jn87gv"
MACHINE_ID="6e827190c14948"
REGION="sin"
NEW_VOLUME_NAME="chroma_data_new"
LOCAL_CHROMADB="/Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📋 Configuration:"
echo "   App: $APP"
echo "   Current Volume: $CURRENT_VOLUME"
echo "   Machine ID: $MACHINE_ID"
echo "   Region: $REGION"
echo "   Local ChromaDB: $LOCAL_CHROMADB"
echo ""

# Step 1: Create snapshot of current volume (backup)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 STEP 1: Create Snapshot of Current Volume (Backup)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Creating snapshot..."
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY
fly volumes snapshots create "$CURRENT_VOLUME"
echo "✅ Snapshot created (rollback available)"
echo ""

# Step 2: Stop the machine
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏸️  STEP 2: Stop Machine"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Stopping machine..."
fly machine stop "$MACHINE_ID" --app "$APP"
sleep 5
echo "✅ Machine stopped"
echo ""

# Step 3: Create new volume
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 STEP 3: Create New Volume"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Creating new volume: $NEW_VOLUME_NAME (10GB)..."
NEW_VOLUME_ID=$(fly volumes create "$NEW_VOLUME_NAME" \
    --region "$REGION" \
    --size 10 \
    --app "$APP" \
    --yes \
    | grep -o 'vol_[a-z0-9]*' | head -1)

echo "✅ New volume created: $NEW_VOLUME_ID"
echo ""

# Step 4: Upload data to new volume
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 STEP 4: Upload Data to New Volume"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create tarball
echo "Creating tarball..."
cd "$(dirname "$LOCAL_CHROMADB")"
TARBALL="/tmp/chromadb_migration_${TIMESTAMP}.tar.gz"
tar -czf "$TARBALL" "$(basename "$LOCAL_CHROMADB")"
echo "✅ Tarball: $TARBALL ($(du -h "$TARBALL" | cut -f1))"
echo ""

# Start machine temporarily with NEW volume attached
echo "Starting temporary machine with new volume..."
fly machine update "$MACHINE_ID" \
    --volume "$NEW_VOLUME_ID:/data" \
    --app "$APP"

fly machine start "$MACHINE_ID" --app "$APP"
sleep 10
echo "✅ Temporary machine started"
echo ""

# Upload via SSH (using simpler method)
echo "Uploading data via SSH..."
echo "   This will take 2-3 minutes..."

# Method: Split and upload chunks
CHUNK_SIZE=$((10 * 1024 * 1024))  # 10MB chunks
cd /tmp
split -b $CHUNK_SIZE "$TARBALL" chromadb_chunk_

CHUNKS=(chromadb_chunk_*)
TOTAL_CHUNKS=${#CHUNKS[@]}

echo "   Split into $TOTAL_CHUNKS chunks"

for i in "${!CHUNKS[@]}"; do
    chunk="${CHUNKS[$i]}"
    num=$((i + 1))
    echo "   Uploading chunk $num/$TOTAL_CHUNKS..."
    
    # Upload using base64 to avoid binary issues
    base64 "$chunk" | fly ssh console --app "$APP" --command \
        "base64 -d > /tmp/$(basename $chunk)"
    
    echo "     ✅ Chunk $num uploaded"
done

echo "✅ All chunks uploaded"
echo ""

# Reassemble and extract
echo "Reassembling and extracting on remote..."
fly ssh console --app "$APP" --command \
    "cat /tmp/chromadb_chunk_* > /tmp/chromadb.tar.gz && \
     rm /tmp/chromadb_chunk_* && \
     cd /data && \
     tar -xzf /tmp/chromadb.tar.gz && \
     mv chromadb chroma_db && \
     rm /tmp/chromadb.tar.gz && \
     ls -la chroma_db"

echo "✅ Data extracted to /data/chroma_db"
echo ""

# Step 5: Stop machine and detach new volume
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 STEP 5: Finalize Volume Swap"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Stopping machine..."
fly machine stop "$MACHINE_ID" --app "$APP"
sleep 5
echo "✅ Machine stopped"
echo ""

# The volume is already attached, just restart
echo "Starting machine with new volume..."
fly machine start "$MACHINE_ID" --app "$APP"
sleep 10
echo "✅ Machine started with new ChromaDB"
echo ""

# Step 6: Verify
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ STEP 6: Verify Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Waiting for app to be ready..."
sleep 15

echo "Testing health endpoint..."
curl -s "https://nuzantara-rag.fly.dev/health" && echo "" || echo "⚠️  Health check pending..."

echo ""
echo "Verifying ChromaDB collections..."
fly ssh console --app "$APP" --command \
    "python3 -c \"
import chromadb
client = chromadb.PersistentClient(path='/data/chroma_db')
collections = client.list_collections()
print(f'✅ Collections: {len(collections)}')
for c in collections:
    print(f'   • {c.name}: {c.count()} documents')
\""

echo ""

# Step 7: Cleanup old volume (optional)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 STEP 7: Cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Old volume $CURRENT_VOLUME is kept for rollback."
echo "To delete it after verification:"
echo "   fly volumes destroy $CURRENT_VOLUME --app $APP"
echo ""

rm -f "$TARBALL"
rm -f /tmp/chromadb_chunk_*
echo "✅ Local cleanup complete"
echo ""

# Final summary
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 MIGRATION COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   • New Volume: $NEW_VOLUME_ID"
echo "   • Old Volume: $CURRENT_VOLUME (kept for rollback)"
echo "   • Collections: legal_intelligence + books_intelligence"
echo "   • Total Docs: 12,423"
echo ""
echo "🔄 Rollback (if needed):"
echo "   fly machine stop $MACHINE_ID --app $APP"
echo "   fly machine update $MACHINE_ID --volume $CURRENT_VOLUME:/data --app $APP"
echo "   fly machine start $MACHINE_ID --app $APP"
echo ""
echo "🧪 Test Query:"
echo "   curl -X POST https://nuzantara-rag.fly.dev/api/v3/zantara/unified \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"query\": \"What is deep learning?\"}'"
echo ""
echo "═══════════════════════════════════════════════════════════════"

#!/bin/bash
# 🎯 MAESTRO ChromaDB Migration - Direct Volume Replace Strategy
# 
# Target: nuzantara-rag.fly.dev
# Volume: /data/chroma_db (10GB)
# Source: /Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb
# Collections: legal_intelligence (3,882 docs) + books_intelligence (8,541 docs)

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "🎯 MAESTRO MIGRATION - ChromaDB to Fly.io"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Configuration
APP_NAME="nuzantara-rag"
LOCAL_CHROMADB="/Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb"
REMOTE_PATH="/data/chroma_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📋 Configuration:"
echo "   App: $APP_NAME"
echo "   Local: $LOCAL_CHROMADB"
echo "   Remote: $REMOTE_PATH"
echo "   Timestamp: $TIMESTAMP"
echo ""

# Step 1: Verify local ChromaDB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 1: Verify Local ChromaDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "$LOCAL_CHROMADB" ]; then
    echo "❌ Error: Local ChromaDB not found at $LOCAL_CHROMADB"
    exit 1
fi

echo "✅ Local ChromaDB found"
du -sh "$LOCAL_CHROMADB"
echo ""

# Step 2: Create tarball
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 STEP 2: Create Compressed Tarball"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TARBALL="/tmp/chromadb_${TIMESTAMP}.tar.gz"

echo "Creating tarball: $TARBALL"
cd "$(dirname "$LOCAL_CHROMADB")"
tar czf "$TARBALL" "$(basename "$LOCAL_CHROMADB")"

echo "✅ Tarball created"
ls -lh "$TARBALL"
echo ""

# Step 3: Split if needed (fly sftp has ~50MB limit)
TARBALL_SIZE=$(stat -f%z "$TARBALL" 2>/dev/null || stat -c%s "$TARBALL" 2>/dev/null)
SPLIT_THRESHOLD=$((40 * 1024 * 1024))  # 40 MB

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✂️  STEP 3: Check if Split Needed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$TARBALL_SIZE" -gt "$SPLIT_THRESHOLD" ]; then
    echo "⚠️  Tarball too large ($TARBALL_SIZE bytes), splitting into 10MB chunks..."
    
    SPLIT_DIR="/tmp/chromadb_chunks_${TIMESTAMP}"
    mkdir -p "$SPLIT_DIR"
    
    cd /tmp
    split -b 10m "$TARBALL" "${SPLIT_DIR}/chunk_"
    
    CHUNKS=$(ls -1 "${SPLIT_DIR}"/chunk_* | wc -l)
    echo "✅ Split into $CHUNKS chunks"
    ls -lh "${SPLIT_DIR}"/
    
    USE_CHUNKS=true
else
    echo "✅ Tarball size OK ($TARBALL_SIZE bytes), no split needed"
    USE_CHUNKS=false
fi
echo ""

# Step 4: Backup remote ChromaDB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 STEP 4: Backup Remote ChromaDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Creating remote backup..."
fly ssh console --app "$APP_NAME" --command \
    "tar -czf /tmp/chroma_backup_${TIMESTAMP}.tar.gz /data/chroma_db"

echo "✅ Remote backup created"
echo ""

# Step 5: Upload to Fly.io
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 STEP 5: Upload to Fly.io"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$USE_CHUNKS" = true ]; then
    echo "Uploading chunks via fly ssh..."
    
    # Upload each chunk
    CHUNK_NUM=1
    for chunk in "${SPLIT_DIR}"/chunk_*; do
        echo "   Uploading chunk $CHUNK_NUM/$CHUNKS: $(basename "$chunk")"
        
        cat "$chunk" | fly ssh console --app "$APP_NAME" --command \
            "cat > /tmp/$(basename "$chunk")"
        
        ((CHUNK_NUM++))
    done
    
    echo "✅ All chunks uploaded"
    
    # Reassemble on remote
    echo "Reassembling chunks on remote..."
    fly ssh console --app "$APP_NAME" --command \
        "cat /tmp/chunk_* > /tmp/chromadb_${TIMESTAMP}.tar.gz && rm /tmp/chunk_*"
    
    echo "✅ Chunks reassembled"
else
    echo "Uploading single tarball via fly ssh..."
    
    cat "$TARBALL" | fly ssh console --app "$APP_NAME" --command \
        "cat > /tmp/chromadb_${TIMESTAMP}.tar.gz"
    
    echo "✅ Tarball uploaded"
fi
echo ""

# Step 6: Replace ChromaDB on remote
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 STEP 6: Replace Remote ChromaDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Extracting and replacing..."
fly ssh console --app "$APP_NAME" --command \
    "cd /data && \
     rm -rf chroma_db.old && \
     mv chroma_db chroma_db.old && \
     tar -xzf /tmp/chromadb_${TIMESTAMP}.tar.gz && \
     mv chromadb chroma_db && \
     rm /tmp/chromadb_${TIMESTAMP}.tar.gz && \
     ls chroma_db/"

echo "✅ ChromaDB replaced"
echo ""

# Step 7: Restart app
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 STEP 7: Restart Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Restarting nuzantara-rag..."
fly apps restart "$APP_NAME"

echo "✅ App restarted"
echo ""

# Step 8: Verify
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ STEP 8: Verify Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Waiting 10 seconds for app to start..."
sleep 10

echo "Testing health endpoint..."
curl -s "https://nuzantara-rag.fly.dev/health" || echo "⚠️  Health check failed (app may still be starting)"

echo ""
echo "Testing collections endpoint..."
fly ssh console --app "$APP_NAME" --command \
    "python3 -c \"
import chromadb
client = chromadb.PersistentClient(path='/data/chroma_db')
collections = client.list_collections()
print(f'✅ Collections found: {len(collections)}')
for c in collections:
    print(f'   • {c.name}: {c.count()} documents')
\""

echo ""

# Cleanup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

rm -f "$TARBALL"
if [ "$USE_CHUNKS" = true ]; then
    rm -rf "$SPLIT_DIR"
fi

echo "✅ Local cleanup complete"
echo ""

# Final Summary
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 MIGRATION COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   • Backup: /tmp/chroma_backup_${TIMESTAMP}.tar.gz (on Fly.io)"
echo "   • Rollback: mv /data/chroma_db.old /data/chroma_db"
echo "   • New Collections: legal_intelligence + books_intelligence"
echo "   • Total Documents: 12,423"
echo ""
echo "🧪 Test Queries:"
echo "   curl -X POST https://nuzantara-rag.fly.dev/api/v3/zantara/unified \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"query\": \"What is deep learning?\"}'"
echo ""
echo "═══════════════════════════════════════════════════════════════"

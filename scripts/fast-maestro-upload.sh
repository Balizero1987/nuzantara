#!/bin/bash
# 🚀 FAST MAESTRO - Upload chunks only
set -e

echo "🚀 FAST UPLOAD - 13 chunks to Fly.io"
echo ""

APP="nuzantara-rag"
TIMESTAMP="20251104_172928"
CHUNKS_DIR="/tmp/chromadb_chunks_${TIMESTAMP}"

# Upload each chunk
for i in $(seq -w 0 12); do
    if [ $i = "00" ]; then suffix="aa"
    elif [ $i = "01" ]; then suffix="ab"
    elif [ $i = "02" ]; then suffix="ac"
    elif [ $i = "03" ]; then suffix="ad"
    elif [ $i = "04" ]; then suffix="ae"
    elif [ $i = "05" ]; then suffix="af"
    elif [ $i = "06" ]; then suffix="ag"
    elif [ $i = "07" ]; then suffix="ah"
    elif [ $i = "08" ]; then suffix="ai"
    elif [ $i = "09" ]; then suffix="aj"
    elif [ $i = "10" ]; then suffix="ak"
    elif [ $i = "11" ]; then suffix="al"
    elif [ $i = "12" ]; then suffix="am"
    fi
    
    chunk="chunk_${suffix}"
    echo "📤 Uploading $chunk ($(($i+1))/13)..."
    
    cat "${CHUNKS_DIR}/${chunk}" | fly ssh console --app "$APP" --command \
        "cat > /tmp/${chunk}"
    
    echo "   ✅ Done"
done

echo ""
echo "✅ All chunks uploaded!"
echo ""
echo "🔧 Now reassemble on remote..."
fly ssh console --app "$APP" --command \
    "cd /tmp && cat chunk_* > chromadb_complete.tar.gz && rm chunk_*"

echo "✅ Reassembled"
echo ""

echo "🔄 Replacing ChromaDB..."
fly ssh console --app "$APP" --command \
    "cd /data && mv chroma_db chroma_db.old && tar -xzf /tmp/chromadb_complete.tar.gz && mv chromadb chroma_db && rm /tmp/chromadb_complete.tar.gz"

echo "✅ ChromaDB replaced!"
echo ""

echo "🔄 Restarting app..."
fly apps restart "$APP"

echo ""
echo "🎉 MIGRATION COMPLETE!"

#!/bin/bash
# Deploy PP28/2025 to Production RAG System
# This syncs the processed legal documents to Fly.io

set -e

echo "🚀 PP28/2025 Production Deployment"
echo "===================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SOURCE_DIR="oracle-data/PP_28_2025/kb_ready"
CHROMA_DATA="data/chromadb"
APP_NAME="nuzantara-core"

echo -e "${BLUE}Step 1: Verifying local data...${NC}"
if [ ! -f "$SOURCE_DIR/chunks_articles.json" ]; then
    echo -e "${RED}❌ Source file not found: $SOURCE_DIR/chunks_articles.json${NC}"
    exit 1
fi

CHUNK_COUNT=$(python3 -c "import json; print(len(json.load(open('$SOURCE_DIR/chunks_articles.json'))))")
echo -e "${GREEN}✅ Found $CHUNK_COUNT chunks locally${NC}"

echo -e "\n${BLUE}Step 2: Checking ChromaDB local status...${NC}"
python3 << 'EOF'
import chromadb
from pathlib import Path

chroma_path = Path('data/chromadb')
client = chromadb.PersistentClient(path=str(chroma_path))

try:
    collection = client.get_collection('legal_intelligence')
    count = collection.count()
    print(f'✅ ChromaDB local: {count} documents')
    
    # Check PP28
    results = collection.get(where={'law_id': 'PP-28-2025'}, limit=5)
    pp28_count = len(results['ids'])
    print(f'✅ PP-28-2025 documents: {pp28_count} found')
except Exception as e:
    print(f'❌ ChromaDB error: {e}')
    exit(1)
EOF

echo -e "\n${BLUE}Step 3: Preparing deployment package...${NC}"
# Create a deployment archive
DEPLOY_DIR="deploy_pp28_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy ChromaDB data
cp -r "$CHROMA_DATA" "$DEPLOY_DIR/"
echo -e "${GREEN}✅ ChromaDB data copied${NC}"

# Copy PP28 source files
mkdir -p "$DEPLOY_DIR/pp28_source"
cp "$SOURCE_DIR"/*.json "$DEPLOY_DIR/pp28_source/"
echo -e "${GREEN}✅ PP28 source files copied${NC}"

echo -e "\n${BLUE}Step 4: Deploying to Fly.io...${NC}"

# Create a migration script that will run on production
cat > "$DEPLOY_DIR/migrate.sh" << 'MIGRATE'
#!/bin/bash
# Run this on production to load PP28 data

cd /app
python3 << 'PYTHON_SCRIPT'
import chromadb
import json
from pathlib import Path

print("🔄 Loading PP28 into production ChromaDB...")

# Init ChromaDB
chroma_path = Path('/app/data/chromadb')
client = chromadb.PersistentClient(path=str(chroma_path))

# Load chunks
with open('/app/pp28_source/chunks_articles.json', 'r') as f:
    chunks = json.load(f)

print(f"✅ Loaded {len(chunks)} chunks")

# Get or create collection
try:
    collection = client.get_collection('legal_intelligence')
    print("✅ Collection exists")
except:
    collection = client.create_collection(
        name='legal_intelligence',
        metadata={"hnsw:space": "cosine"}
    )
    print("✅ Collection created")

# Batch ingest
batch_size = 100
for i in range(0, len(chunks), batch_size):
    batch = chunks[i:i+batch_size]
    
    ids = [c['chunk_id'] for c in batch]
    docs = [c['text'] for c in batch]
    metadatas = [c['metadata'] for c in batch]
    
    collection.add(
        ids=ids,
        documents=docs,
        metadatas=metadatas
    )
    print(f"✅ Batch {i//batch_size + 1} ingested ({len(batch)} docs)")

print(f"✅ Total documents in collection: {collection.count()}")
print("🎉 PP28/2025 deployment complete!")
PYTHON_SCRIPT
MIGRATE

chmod +x "$DEPLOY_DIR/migrate.sh"

# Upload to Fly.io
echo -e "${BLUE}Uploading to Fly.io machines...${NC}"

# Get machine IDs
MACHINES=$(flyctl machines list --app "$APP_NAME" --json | python3 -c "import sys, json; print('\n'.join([m['id'] for m in json.load(sys.stdin)]))")

for MACHINE_ID in $MACHINES; do
    echo -e "${BLUE}Deploying to machine: $MACHINE_ID${NC}"
    
    # Upload files
    flyctl ssh sftp shell -a "$APP_NAME" -C "$MACHINE_ID" << SFTP
put -r $DEPLOY_DIR/chromadb /app/data/
put -r $DEPLOY_DIR/pp28_source /app/
put $DEPLOY_DIR/migrate.sh /app/
bye
SFTP
    
    # Run migration
    echo -e "${BLUE}Running migration on $MACHINE_ID...${NC}"
    flyctl ssh console -a "$APP_NAME" -C "$MACHINE_ID" -c "bash /app/migrate.sh"
    
    echo -e "${GREEN}✅ Machine $MACHINE_ID updated${NC}"
done

echo -e "\n${BLUE}Step 5: Verifying production deployment...${NC}"

# Test production RAG
echo "Testing RAG query..."
curl -s "https://nuzantara-core.fly.dev/api/agent/semantic_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "PP 28 2025 KBLI 5 digit",
    "collections": ["legal_intelligence"],
    "limit": 3
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'results' in data and len(data['results']) > 0:
    print(f\"✅ RAG working: {len(data['results'])} results found\")
    print(f\"Top result: {data['results'][0]['metadata'].get('chunk_id', 'N/A')}\")
else:
    print('❌ No results found')
    sys.exit(1)
"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}🎉 PP28/2025 DEPLOYED TO PRODUCTION!${NC}"
echo -e "${GREEN}================================${NC}"

# Cleanup
echo -e "\n${BLUE}Cleaning up temporary files...${NC}"
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}✅ Done${NC}"

echo -e "\n${BLUE}Production RAG Status:${NC}"
echo "- App: https://nuzantara-core.fly.dev"
echo "- ChromaDB: Updated with PP28/2025"
echo "- Documents: $CHUNK_COUNT chunks"
echo "- Collection: legal_intelligence"

echo -e "\n${BLUE}Test queries:${NC}"
echo "1. 'Cosa dice PP 28/2025 sul KBLI a 5 cifre?'"
echo "2. 'Risk-based business licensing requirements'"
echo "3. 'Sistema OSS e integrazione licensing'"

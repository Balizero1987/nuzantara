# 🎯 MAESTRO MIGRATION STRATEGY - ChromaDB to Fly.io

## Problema
Caricare 12,423 documenti (8,541 books + 3,882 laws) da ChromaDB locale a Fly.io.

## Strategie Valutate

### ❌ 1. API REST Batch Upload
- **Problema:** Timeout su grandi batch (>100 docs)
- **Problema:** No endpoint `/api/ingest-batch` esistente
- **Problema:** Rate limiting e memoria server

### ❌ 2. fly sftp upload database
- **Problema:** ChromaDB = SQLite + .parquet + indices (164 MB)
- **Problema:** fly sftp ha limiti dimensione (fallisce >50 MB)

### ❌ 3. Rebuild Docker con data baked-in
- **Problema:** Troppo lento (~10 min build + deploy)
- **Problema:** Volume data va montato, non baked

---

## ✅ STRATEGIA VINCENTE: Fly Volumes Direct Replace

### Concept
Fly.io usa **volumes persistenti** per ChromaDB. Possiamo sostituire l'intero database direttamente.

### Piano Esecuzione

#### Step 1: Backup Remoto
```bash
fly ssh console --app nuzantara-rag --command \
  'tar czf /tmp/chromadb_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data chroma_db'
```

#### Step 2: Compressione Locale Ottimizzata
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/data
tar czf chromadb_complete.tar.gz chromadb/
# Output: ~47 MB (da 164 MB)
```

#### Step 3: Upload via Chunked Transfer
```bash
# Split in chunks da 10 MB
split -b 10m chromadb_complete.tar.gz chromadb_chunk_

# Upload chunks
for chunk in chromadb_chunk_*; do
  fly sftp shell --app nuzantara-rag
  put $chunk /tmp/
done
```

#### Step 4: Riassemblaggio Remoto
```bash
fly ssh console --app nuzantara-rag --command \
  'cat /tmp/chromadb_chunk_* > /tmp/chromadb_complete.tar.gz && \
   rm -rf /data/chroma_db.old && \
   mv /data/chroma_db /data/chroma_db.old && \
   tar xzf /tmp/chromadb_complete.tar.gz -C /data && \
   rm /tmp/chromadb_chunk_* /tmp/chromadb_complete.tar.gz'
```

#### Step 5: Restart App
```bash
fly apps restart nuzantara-rag
```

---

## 🚀 STRATEGIA ALTERNATIVA: S3/R2 Bridge

### Se fly sftp fallisce ancora...

1. Upload a Cloudflare R2 (veloce, no limiti)
2. Download da Fly.io container via curl
3. Estrazione in /data

```bash
# Locale
aws s3 cp chromadb_complete.tar.gz s3://nuzantara-temp/

# Remoto
fly ssh console --app nuzantara-rag
curl https://nuzantara-temp.s3.amazonaws.com/chromadb_complete.tar.gz \
  -o /tmp/chromadb.tar.gz
tar xzf /tmp/chromadb.tar.gz -C /data
rm /tmp/chromadb.tar.gz
```

---

## 📊 Vantaggi Strategia Volumes

1. ✅ **Atomic Replace:** Un solo comando per swap completo
2. ✅ **Zero Downtime:** Backup automatico (.old folder)
3. ✅ **Rollback Facile:** `mv chroma_db.old chroma_db`
4. ✅ **No Rate Limit:** Nessun API call, solo filesystem
5. ✅ **Velocità:** ~2 minuti totali vs 30+ min batch upload

---

## 🎯 Esecuzione Immediata

Vedi: `scripts/maestro-deploy-chromadb.sh`

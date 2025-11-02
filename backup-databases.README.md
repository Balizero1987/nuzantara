# 🗄️ ZANTARA Database Backup System

Sistema completo di backup automatico per database PostgreSQL e ChromaDB vector stores di ZANTARA.

## 📋 Overview

Lo script `backup-databases.sh` fornisce:
- ✅ Backup completo PostgreSQL (pg_dump)
- ✅ Backup completo ChromaDB (tutti i database vector)
- ✅ Upload automatico a Cloudflare R2 (secure storage)
- ✅ Retention policy automatica (30 giorni)
- ✅ Cleanup vecchi backup (locale e R2)
- ✅ Error handling robusto e logging dettagliato

## 🚀 Quick Start

### 1. Installazione Dipendenze

```bash
# PostgreSQL client tools
brew install postgresql              # macOS
# o: sudo apt-get install postgresql-client  # Linux

# AWS CLI (per R2 upload)
brew install awscli                  # macOS
# o: pip install awscli              # Alternativa

# Python boto3 (alternativa ad AWS CLI)
pip3 install boto3
```

### 2. Configurazione Environment Variables

Crea un file `.env.backup` o configura le variabili d'ambiente:

```bash
# PostgreSQL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Cloudflare R2
export R2_ACCESS_KEY_ID="your_r2_access_key"
export R2_SECRET_ACCESS_KEY="your_r2_secret_key"
export R2_ENDPOINT_URL="https://your-account-id.r2.cloudflarestorage.com"

# ChromaDB Path (opzionale, defaults a /data/chroma_db)
export FLY_VOLUME_MOUNT_PATH="/data/chroma_db"
```

### 3. Esecuzione Manuale

```bash
# Backup completo (PostgreSQL + ChromaDB + R2 upload)
./backup-databases.sh

# Solo PostgreSQL
./backup-databases.sh --postgres-only

# Solo ChromaDB
./backup-databases.sh --chroma-only

# Backup locale (senza R2 upload)
./backup-databases.sh --local-only

# Verbose output
./backup-databases.sh --verbose
```

## ⏰ Automatizzazione (Cron Job)

### Setup Cron Job Locale

```bash
# Apri crontab editor
crontab -e

# Aggiungi backup giornaliero alle 2:00 AM
0 2 * * * cd /path/to/NUZANTARA-FLY && source .env.backup && ./backup-databases.sh >> logs/backup.log 2>&1

# Backup ogni 6 ore
0 */6 * * * cd /path/to/NUZANTARA-FLY && source .env.backup && ./backup-databases.sh >> logs/backup.log 2>&1
```

### Setup su Fly.io (Production)

Crea un file `fly-cron.toml`:

```toml
[env]
  DATABASE_URL = "${{ secrets.DATABASE_URL }}"
  R2_ACCESS_KEY_ID = "${{ secrets.R2_ACCESS_KEY_ID }}"
  R2_SECRET_ACCESS_KEY = "${{ secrets.R2_SECRET_ACCESS_KEY }}"
  R2_ENDPOINT_URL = "${{ secrets.R2_ENDPOINT_URL }}"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

Esegui backup via Fly.io Machines:

```bash
# Crea una machine per backup
flyctl machines run \
  --app nuzantara-backup \
  --region ams \
  --schedule "0 2 * * *" \
  --env-file .env.backup \
  --vm-cpu-kind shared \
  --vm-memory 512 \
  ubuntu:latest \
  bash -c "apt-get update && apt-get install -y postgresql-client python3-pip && pip3 install boto3 && cd /app && ./backup-databases.sh"
```

### Setup con GitHub Actions (CI/CD)

Aggiungi al workflow `.github/workflows/ci.yml`:

```yaml
backup-daily:
  name: 🗄️ Daily Database Backup
  runs-on: ubuntu-latest
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  steps:
    - uses: actions/checkout@v4
    - name: Setup PostgreSQL client
      run: |
        sudo apt-get update
        sudo apt-get install -y postgresql-client
        pip3 install boto3
    - name: Run backup
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
        R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
        R2_ENDPOINT_URL: ${{ secrets.R2_ENDPOINT_URL }}
      run: ./backup-databases.sh
```

## 📁 Struttura Backup

```
backups/
├── 20250127_020000/
│   ├── postgres_backup_20250127_020000.sql.gz
│   ├── chroma_db_20250127_020000.tar.gz
│   └── backup_summary.txt
├── 20250126_020000/
│   └── ...
└── ...
```

### R2 Storage Structure

```
s3://nuzantaradb/backups/
├── 20250127_020000/
│   ├── postgres_backup_20250127_020000.sql.gz
│   ├── chroma_db_20250127_020000.tar.gz
│   └── backup_summary.txt
└── ...
```

## 🔧 Configurazione Avanzata

### Retention Policy

Modifica `RETENTION_DAYS` nello script:

```bash
RETENTION_DAYS=30  # Keep backups for 30 days (default)
RETENTION_DAYS=90  # Keep for 90 days
```

### Backup Locations

Lo script cerca ChromaDB in questi path (in ordine):
1. `$FLY_VOLUME_MOUNT_PATH` (default: `/data/chroma_db`)
2. `./data/chroma_db`
3. `./data/chroma`
4. `./data/chroma_intel`
5. `./data/oracle_kb`

### Compression

- PostgreSQL: Gzip compression (`.sql.gz`)
- ChromaDB: Tar + Gzip (`.tar.gz`)

## 🔐 Sicurezza

### Environment Variables

⚠️ **IMPORTANTE**: Non committare file `.env` o file con credenziali!

Aggiungi a `.gitignore`:
```
.env.backup
backups/
*.sql.gz
*.tar.gz
```

### R2 Access Control

Configura IAM policies su Cloudflare R2 per limitare accesso:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::nuzantaradb/backups/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::nuzantaradb",
      "Condition": {
        "StringLike": {
          "s3:prefix": "backups/*"
        }
      }
    }
  ]
}
```

## 🧪 Test & Verifica

### Test Backup Locale

```bash
# Test solo backup (no upload)
./backup-databases.sh --local-only --verbose

# Verifica file creati
ls -lh backups/*/backup_*
```

### Test R2 Upload

```bash
# Test upload
aws s3 ls s3://nuzantaradb/backups/ --endpoint-url $R2_ENDPOINT_URL

# Download test
aws s3 cp s3://nuzantaradb/backups/20250127_020000/postgres_backup_*.sql.gz ./test_backup.sql.gz \
  --endpoint-url $R2_ENDPOINT_URL
```

### Verifica Integrità Backup

```bash
# PostgreSQL
gzip -t backups/*/postgres_backup_*.sql.gz

# ChromaDB
tar -tzf backups/*/chroma_db_*.tar.gz > /dev/null && echo "OK"
```

## 📊 Monitoring & Alerting

### Log Files

I backup generano log dettagliati. Monitora:

```bash
# Ultimi backup
ls -lt backups/ | head -10

# Verifica errori nei log
grep -i error logs/backup.log

# Dimensione totale backup
du -sh backups/
```

### Alert Setup (Opzionale)

Aggiungi notifiche via email/webhook in caso di errori:

```bash
# Nel crontab, dopo backup
0 2 * * * cd /path/to/NUZANTARA-FLY && ./backup-databases.sh || curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL -d '{"text":"⚠️ Backup failed!"}'
```

## 🔄 Restore Procedure

### Restore PostgreSQL

```bash
# Extract backup
gunzip postgres_backup_20250127_020000.sql.gz

# Restore
psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE < postgres_backup_20250127_020000.sql
```

### Restore ChromaDB

```bash
# Extract archive
tar -xzf chroma_db_20250127_020000.tar.gz

# Copy to ChromaDB path
cp -r chroma_db/chroma_db/* /data/chroma_db/
```

## 🐛 Troubleshooting

### Error: "pg_dump: command not found"
```bash
# Install PostgreSQL client
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Linux
```

### Error: "DATABASE_URL not set"
```bash
# Verifica environment variables
echo $DATABASE_URL
source .env.backup
```

### Error: "R2 upload failed"
```bash
# Verifica credenziali R2
echo $R2_ACCESS_KEY_ID
echo $R2_ENDPOINT_URL

# Test connessione
aws s3 ls s3://nuzantaradb/ --endpoint-url $R2_ENDPOINT_URL
```

### Error: "No ChromaDB databases found"
```bash
# Verifica path ChromaDB
ls -la /data/chroma_db/
ls -la ./data/chroma_db/

# Verifica environment variable
echo $FLY_VOLUME_MOUNT_PATH
```

## 📚 Risorse Utili

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Fly.io Machines Documentation](https://fly.io/docs/machines/)

## 🆘 Support

Per problemi o domande:
1. Verifica i log: `cat logs/backup.log`
2. Esegui con `--verbose` per debug dettagliato
3. Contatta il team Infrastructure

---

**Versione**: 1.0.0  
**Ultima modifica**: 2025-01-27


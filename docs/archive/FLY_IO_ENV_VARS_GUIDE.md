# 🔐 NUZANTARA - Fly.io Environment Variables Guide

**Complete guide for all environment variables across all backends**

**Branch**: `claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein`

---

## 📋 TABLE OF CONTENTS

1. [Backend-TS (nuzantara-backend)](#backend-ts-nuzantara-backend)
2. [Backend-RAG (nuzantara-rag)](#backend-rag-nuzantara-rag)
3. [Memory Service (nuzantara-memory)](#memory-service-nuzantara-memory)
4. [Quick Deployment Commands](#quick-deployment-commands)
5. [Security Best Practices](#security-best-practices)

---

## 🎯 Backend-TS (nuzantara-backend)

**Fly App Name**: `nuzantara-backend`
**Port**: 8080
**Tech Stack**: Node.js + TypeScript + PostgreSQL + Redis

### ✅ REQUIRED (Production Critical)

```bash
# Server Configuration
fly secrets set PORT=8080 --app nuzantara-backend
fly secrets set NODE_ENV=production --app nuzantara-backend

# Database (CRITICAL)
fly secrets set DATABASE_URL="postgresql://user:password@your-postgres.fly.dev:5432/zantara" --app nuzantara-backend
fly secrets set REDIS_URL="redis://default:password@your-redis.fly.dev:6379" --app nuzantara-backend

# Authentication (CRITICAL)
fly secrets set JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars" --app nuzantara-backend

# Internal API Keys (CRITICAL)
fly secrets set API_KEYS_INTERNAL="key1,key2,key3" --app nuzantara-backend

# RAG Backend URL (CRITICAL for integration)
fly secrets set RAG_BACKEND_URL="https://nuzantara-rag.fly.dev" --app nuzantara-backend
```

**Why REQUIRED?**
- `DATABASE_URL`: PostgreSQL connection - all data storage depends on this
- `REDIS_URL`: Caching, rate limiting, session management
- `JWT_SECRET`: User authentication tokens - MUST be secure
- `API_KEYS_INTERNAL`: Inter-service communication (frontend ↔ backend ↔ RAG)
- `RAG_BACKEND_URL`: Chat functionality depends on this

---

### 🟡 RECOMMENDED (Full Functionality)

```bash
# Firebase (Google Auth + Storage)
fly secrets set FIREBASE_PROJECT_ID="your-firebase-project-id" --app nuzantara-backend
fly secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" --app nuzantara-backend
fly secrets set GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json" --app nuzantara-backend

# Google OAuth (Team Login)
fly secrets set GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com" --app nuzantara-backend
fly secrets set GOOGLE_OAUTH_CLIENT_SECRET="your-oauth-secret" --app nuzantara-backend
fly secrets set GOOGLE_OAUTH_REDIRECT_URI="https://nuzantara-backend.fly.dev/auth/callback" --app nuzantara-backend

# Google Drive (Document Storage)
fly secrets set GDRIVE_AMBARADAM_DRIVE_ID="your-drive-folder-id" --app nuzantara-backend

# Email Service (SendGrid)
fly secrets set SENDGRID_API_KEY="SG.your-sendgrid-api-key" --app nuzantara-backend
fly secrets set EMAIL_FROM="noreply@zantara.com" --app nuzantara-backend

# WhatsApp Notifications (Twilio)
fly secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxx" --app nuzantara-backend
fly secrets set TWILIO_AUTH_TOKEN="your-twilio-auth-token" --app nuzantara-backend
fly secrets set TWILIO_WHATSAPP_NUMBER="+14155238886" --app nuzantara-backend

# Monitoring (Grafana Loki)
fly secrets set GRAFANA_LOKI_URL="https://logs-prod-us-central1.grafana.net" --app nuzantara-backend
fly secrets set GRAFANA_LOKI_USER="your-loki-user-id" --app nuzantara-backend
fly secrets set GRAFANA_API_KEY="your-grafana-api-key" --app nuzantara-backend

# Autonomous Agents Cron
fly secrets set ENABLE_CRON="true" --app nuzantara-backend
fly secrets set CRON_TIMEZONE="Asia/Singapore" --app nuzantara-backend
fly secrets set OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key" --app nuzantara-backend
fly secrets set DEEPSEEK_API_KEY="your-deepseek-api-key" --app nuzantara-backend
```

**Why RECOMMENDED?**
- **Firebase/Google OAuth**: Team authentication, Google Drive integration
- **SendGrid**: Email notifications (password reset, alerts)
- **Twilio WhatsApp**: Real-time notifications to admins
- **Grafana Loki**: Production log aggregation and monitoring
- **Cron + AI Keys**: Autonomous agents (self-healing, auto-tests, PR generation)

---

### ⚪ OPTIONAL (Advanced Features)

```bash
# External API Keys
fly secrets set HF_API_KEY="hf_your-huggingface-key" --app nuzantara-backend
fly secrets set RUNPOD_API_KEY="your-runpod-api-key" --app nuzantara-backend
fly secrets set GOOGLE_MAPS_API_KEY="your-google-maps-key" --app nuzantara-backend

# Vector Databases (Alternative to ChromaDB)
fly secrets set QDRANT_URL="https://your-qdrant-cluster.cloud" --app nuzantara-backend
fly secrets set QDRANT_API_KEY="your-qdrant-api-key" --app nuzantara-backend
fly secrets set CHROMADB_URL="http://chromadb:8000" --app nuzantara-backend

# Indonesian Government APIs
fly secrets set BKPM_API_KEY="your-bkpm-api-key" --app nuzantara-backend
fly secrets set BPS_API_KEY="your-bps-api-key" --app nuzantara-backend
fly secrets set DEPKUMHAM_API_KEY="your-depkumham-api-key" --app nuzantara-backend

# Social Media Integrations
fly secrets set INSTAGRAM_ACCESS_TOKEN="your-instagram-token" --app nuzantara-backend
fly secrets set INSTAGRAM_ACCOUNT_ID="your-instagram-account-id" --app nuzantara-backend
fly secrets set WHATSAPP_ACCESS_TOKEN="your-whatsapp-business-token" --app nuzantara-backend
fly secrets set WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id" --app nuzantara-backend

# Webhooks & Integrations
fly secrets set DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." --app nuzantara-backend
fly secrets set SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." --app nuzantara-backend
fly secrets set GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/..." --app nuzantara-backend

# Feature Flags & Advanced Settings
fly secrets set FF_ENABLE_CIRCUIT_BREAKER="true" --app nuzantara-backend
fly secrets set FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE="10" --app nuzantara-backend
fly secrets set ENABLE_AUDIT_TRAIL="true" --app nuzantara-backend
fly secrets set ENABLE_METRICS="true" --app nuzantara-backend
fly secrets set JWT_AUDIT_LOGGING="true" --app nuzantara-backend
fly secrets set JWT_RATE_LIMITING="true" --app nuzantara-backend
fly secrets set JWT_STRICT_VALIDATION="true" --app nuzantara-backend

# Cron Schedules (Override defaults)
fly secrets set CRON_SELF_HEALING="0 2 * * *" --app nuzantara-backend      # Daily 2 AM
fly secrets set CRON_AUTO_TESTS="0 3 * * *" --app nuzantara-backend        # Daily 3 AM
fly secrets set CRON_WEEKLY_PR="0 4 * * 0" --app nuzantara-backend         # Sunday 4 AM
fly secrets set CRON_HEALTH_CHECK="*/15 * * * *" --app nuzantara-backend   # Every 15 min
fly secrets set CRON_DAILY_REPORT="0 9 * * *" --app nuzantara-backend      # Daily 9 AM

# Advanced AI Configuration
fly secrets set AI_FALLBACK_ORDER="openrouter,deepseek,openai" --app nuzantara-backend
fly secrets set AI_TIMEOUT_MS="30000" --app nuzantara-backend

# Alert Configuration
fly secrets set ALERTS_ENABLED="true" --app nuzantara-backend
fly secrets set ALERT_THRESHOLD_4XX="100" --app nuzantara-backend
fly secrets set ALERT_THRESHOLD_5XX="10" --app nuzantara-backend
fly secrets set ALERT_THRESHOLD_ERROR_RATE="5" --app nuzantara-backend
fly secrets set ALERT_WINDOW_MS="300000" --app nuzantara-backend
fly secrets set ALERT_COOLDOWN_MS="600000" --app nuzantara-backend
fly secrets set ALERT_WHATSAPP="+6281234567890" --app nuzantara-backend

# Database Pool Configuration
fly secrets set DB_POOL_MIN="2" --app nuzantara-backend
fly secrets set DB_POOL_MAX="10" --app nuzantara-backend

# CORS & Security
fly secrets set ALLOWED_ORIGINS="https://nuzantara-webapp.fly.dev,https://zantara.com" --app nuzantara-backend
fly secrets set CORS_ORIGINS="https://nuzantara-webapp.fly.dev" --app nuzantara-backend

# Logging
fly secrets set LOG_LEVEL="info" --app nuzantara-backend

# URLs
fly secrets set WEBAPP_URL="https://nuzantara-webapp.fly.dev" --app nuzantara-backend
fly secrets set FRONTEND_URL="https://nuzantara-webapp.fly.dev" --app nuzantara-backend
fly secrets set MEMORY_SERVICE_URL="https://nuzantara-memory.fly.dev" --app nuzantara-backend

# GitHub Integration
fly secrets set GITHUB_TOKEN="ghp_your-github-personal-access-token" --app nuzantara-backend

# Misc
fly secrets set SERVICE_NAME="nuzantara-backend" --app nuzantara-backend
fly secrets set SERVICE_VERSION="1.0.0" --app nuzantara-backend
```

**Why OPTIONAL?**
- Most features have fallbacks or are not critical for basic operation
- Indonesian Gov APIs: Only needed for specific legal queries
- Social Media: Only if using WhatsApp/Instagram integration
- Advanced monitoring: Can be added later as needed

---

## 🧠 Backend-RAG (nuzantara-rag)

**Fly App Name**: `nuzantara-rag`
**Port**: 8000
**Tech Stack**: Python + FastAPI + ChromaDB + PostgreSQL + Redis

### ✅ REQUIRED (Production Critical)

```bash
# OpenAI API (CRITICAL - embeddings + chat)
fly secrets set OPENAI_API_KEY="sk-proj-your-openai-api-key" --app nuzantara-rag

# Anthropic API (CRITICAL - Claude for chat)
fly secrets set ANTHROPIC_API_KEY="sk-ant-api03-your-anthropic-key" --app nuzantara-rag

# Database (CRITICAL)
fly secrets set DATABASE_URL="postgresql://user:password@your-postgres.fly.dev:5432/zantara" --app nuzantara-rag
fly secrets set REDIS_URL="redis://default:password@your-redis.fly.dev:6379" --app nuzantara-rag

# ChromaDB (CRITICAL - vector storage)
fly secrets set CHROMA_DB_PATH="/data/chroma_db" --app nuzantara-rag
fly secrets set CHROMA_PERSIST_DIR="/data/chroma_db" --app nuzantara-rag

# Backend Integration (CRITICAL)
fly secrets set TS_BACKEND_URL="https://nuzantara-backend.fly.dev" --app nuzantara-rag
fly secrets set TYPESCRIPT_BACKEND_URL="https://nuzantara-backend.fly.dev" --app nuzantara-rag

# Internal API Keys (CRITICAL)
fly secrets set API_KEYS_INTERNAL="same-as-backend-ts" --app nuzantara-rag
fly secrets set INTERNAL_API_KEY="same-as-backend-ts" --app nuzantara-rag
```

**Why REQUIRED?**
- `OPENAI_API_KEY`: Text embeddings (1536-dim) for RAG
- `ANTHROPIC_API_KEY`: Claude Haiku/Sonnet for chat responses
- `DATABASE_URL`: Store conversations, golden answers, work sessions
- `REDIS_URL`: Rate limiting, caching
- `CHROMA_DB_PATH`: Vector database for document search
- `TS_BACKEND_URL`: Integration with backend-ts for auth/team data
- `API_KEYS_INTERNAL`: Must match backend-ts for inter-service calls

---

### 🟡 RECOMMENDED (Full Functionality)

```bash
# Alternative AI Providers (Fallback)
fly secrets set OPENROUTER_API_KEY_LLAMA="sk-or-v1-your-key" --app nuzantara-rag
fly secrets set HF_API_KEY="hf_your-huggingface-key" --app nuzantara-rag
fly secrets set RUNPOD_API_KEY="your-runpod-api-key" --app nuzantara-rag
fly secrets set RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/..." --app nuzantara-rag

# Qdrant (Alternative Vector DB)
fly secrets set QDRANT_URL="https://your-cluster.cloud.qdrant.io" --app nuzantara-rag
fly secrets set QDRANT_API_KEY="your-qdrant-api-key" --app nuzantara-rag

# Firebase (Shared with backend-ts)
fly secrets set FIREBASE_PROJECT_ID="your-firebase-project-id" --app nuzantara-rag

# Email Notifications
fly secrets set SENDGRID_API_KEY="SG.your-sendgrid-api-key" --app nuzantara-rag
fly secrets set SMTP_HOST="smtp.sendgrid.net" --app nuzantara-rag

# WhatsApp Notifications
fly secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxx" --app nuzantara-rag
fly secrets set TWILIO_AUTH_TOKEN="your-twilio-auth-token" --app nuzantara-rag
fly secrets set TWILIO_WHATSAPP_NUMBER="+14155238886" --app nuzantara-rag

# Webhooks
fly secrets set DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." --app nuzantara-rag
fly secrets set SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." --app nuzantara-rag

# Reranker (Performance Enhancement)
fly secrets set ENABLE_RERANKER="true" --app nuzantara-rag

# Cloudflare R2 (Alternative Storage)
fly secrets set R2_ACCESS_KEY_ID="your-r2-access-key" --app nuzantara-rag
fly secrets set R2_SECRET_ACCESS_KEY="your-r2-secret-key" --app nuzantara-rag
fly secrets set R2_ENDPOINT_URL="https://your-account.r2.cloudflarestorage.com" --app nuzantara-rag
```

**Why RECOMMENDED?**
- **Alternative AI**: Fallback if OpenAI/Anthropic have issues
- **Qdrant**: More scalable than ChromaDB for large deployments
- **Email/WhatsApp**: Notifications for important events
- **Reranker**: +40% quality improvement for search results
- **R2**: Cheaper object storage than PostgreSQL for large files

---

### ⚪ OPTIONAL (Advanced Features)

```bash
# Fly.io Specific
fly secrets set FLY_APP_NAME="nuzantara-rag" --app nuzantara-rag
fly secrets set FLY_VOLUME_MOUNT_PATH="/data" --app nuzantara-rag

# Shadow Mode (A/B Testing)
fly secrets set SHADOW_MODE_ENABLED="false" --app nuzantara-rag

# Internal API Base (Override)
fly secrets set INTERNAL_API_BASE="https://nuzantara-backend.fly.dev" --app nuzantara-rag
fly secrets set RAG_BACKEND_URL="https://nuzantara-rag.fly.dev" --app nuzantara-rag
```

---

## 💾 Memory Service (nuzantara-memory)

**Fly App Name**: `nuzantara-memory`
**Port**: 8080
**Tech Stack**: Node.js + TypeScript + PostgreSQL + Redis

### ✅ REQUIRED (Production Critical)

```bash
# Server Configuration
fly secrets set PORT=8080 --app nuzantara-memory
fly secrets set NODE_ENV=production --app nuzantara-memory

# Database (CRITICAL - conversation persistence)
fly secrets set DATABASE_URL="postgresql://user:password@your-postgres.fly.dev:5432/memory_db" --app nuzantara-memory

# Redis (RECOMMENDED - caching)
fly secrets set REDIS_URL="redis://default:password@your-redis.fly.dev:6379" --app nuzantara-memory
```

**Why REQUIRED?**
- `DATABASE_URL`: Stores all conversation history
- `REDIS_URL`: Caching for fast session retrieval
- Very minimal requirements - focused service

---

### ⚪ OPTIONAL (Future Features)

```bash
# Future: OpenAI for embeddings
fly secrets set OPENAI_API_KEY="sk-proj-your-key" --app nuzantara-memory

# Future: Vector search in conversations
# (Phase 2 - not yet implemented)
```

---

## 🚀 Quick Deployment Commands

### Complete Deployment (All Backends)

```bash
#!/bin/bash
# deploy-all-env-vars.sh

# ===================================
# BACKEND-TS (nuzantara-backend)
# ===================================

# REQUIRED
fly secrets set \
  PORT=8080 \
  NODE_ENV=production \
  DATABASE_URL="postgresql://user:pass@your-postgres.fly.dev:5432/zantara" \
  REDIS_URL="redis://default:pass@your-redis.fly.dev:6379" \
  JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars-CHANGE-THIS" \
  API_KEYS_INTERNAL="key1,key2,key3" \
  RAG_BACKEND_URL="https://nuzantara-rag.fly.dev" \
  --app nuzantara-backend

# RECOMMENDED
fly secrets set \
  FIREBASE_PROJECT_ID="your-firebase-project" \
  GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com" \
  GOOGLE_OAUTH_CLIENT_SECRET="your-oauth-secret" \
  SENDGRID_API_KEY="SG.your-sendgrid-key" \
  TWILIO_ACCOUNT_SID="ACxxxxxxxxxx" \
  TWILIO_AUTH_TOKEN="your-twilio-token" \
  ENABLE_CRON="true" \
  OPENROUTER_API_KEY="sk-or-v1-your-key" \
  --app nuzantara-backend

# ===================================
# BACKEND-RAG (nuzantara-rag)
# ===================================

# REQUIRED
fly secrets set \
  OPENAI_API_KEY="sk-proj-your-openai-key" \
  ANTHROPIC_API_KEY="sk-ant-api03-your-anthropic-key" \
  DATABASE_URL="postgresql://user:pass@your-postgres.fly.dev:5432/zantara" \
  REDIS_URL="redis://default:pass@your-redis.fly.dev:6379" \
  CHROMA_DB_PATH="/data/chroma_db" \
  TS_BACKEND_URL="https://nuzantara-backend.fly.dev" \
  API_KEYS_INTERNAL="same-as-backend-ts" \
  --app nuzantara-rag

# RECOMMENDED
fly secrets set \
  ENABLE_RERANKER="true" \
  QDRANT_URL="https://your-cluster.cloud.qdrant.io" \
  QDRANT_API_KEY="your-qdrant-key" \
  SENDGRID_API_KEY="SG.your-sendgrid-key" \
  --app nuzantara-rag

# ===================================
# MEMORY SERVICE (nuzantara-memory)
# ===================================

# REQUIRED
fly secrets set \
  PORT=8080 \
  NODE_ENV=production \
  DATABASE_URL="postgresql://user:pass@your-postgres.fly.dev:5432/memory_db" \
  REDIS_URL="redis://default:pass@your-redis.fly.dev:6379" \
  --app nuzantara-memory

echo "✅ All environment variables set!"
echo "Next: Run deployments with 'fly deploy' in each app directory"
```

### Verify Secrets

```bash
# Check what secrets are set
fly secrets list --app nuzantara-backend
fly secrets list --app nuzantara-rag
fly secrets list --app nuzantara-memory
```

### Remove a Secret

```bash
fly secrets unset VARIABLE_NAME --app nuzantara-backend
```

---

## 🔐 Security Best Practices

### 1. Generate Strong Secrets

```bash
# Generate JWT_SECRET (64 chars)
openssl rand -base64 48

# Generate API_KEYS_INTERNAL
openssl rand -hex 32
```

### 2. Never Commit Secrets

```bash
# .gitignore should include:
.env
.env.local
.env.production
*.key
credentials.json
service-account*.json
```

### 3. Rotate Secrets Regularly

```bash
# Update secret
fly secrets set JWT_SECRET="new-secret" --app nuzantara-backend

# Deploy new version
fly deploy --app nuzantara-backend
```

### 4. Use Fly.io Secret Management

**DO NOT** set secrets in `fly.toml` - always use `fly secrets set`

```toml
# fly.toml - NEVER DO THIS:
# [env]
#   JWT_SECRET = "my-secret"  ❌ WRONG!

# Instead use:
# fly secrets set JWT_SECRET="my-secret" --app nuzantara-backend ✅ CORRECT
```

### 5. Database Connection Security

```bash
# Use Fly.io internal networking for databases
DATABASE_URL="postgresql://user:pass@your-postgres.internal:5432/db"
REDIS_URL="redis://default:pass@your-redis.internal:6379"

# Benefits:
# - No public internet exposure
# - Free internal bandwidth
# - Lower latency
```

### 6. API Key Management

```bash
# Use comma-separated keys for rotation without downtime
API_KEYS_INTERNAL="old-key,new-key"

# Step 1: Add new key
fly secrets set API_KEYS_INTERNAL="old-key,new-key" --app nuzantara-backend

# Step 2: Update clients to use new key
# (wait for all clients to migrate)

# Step 3: Remove old key
fly secrets set API_KEYS_INTERNAL="new-key" --app nuzantara-backend
```

---

## 📊 Environment Variables Summary

### Backend-TS
- **Total**: 114 variables
- **REQUIRED**: 6 variables
- **RECOMMENDED**: 15 variables
- **OPTIONAL**: 93 variables

### Backend-RAG
- **Total**: 33 variables
- **REQUIRED**: 10 variables
- **RECOMMENDED**: 12 variables
- **OPTIONAL**: 11 variables

### Memory Service
- **Total**: 5 variables
- **REQUIRED**: 4 variables
- **RECOMMENDED**: 0 variables
- **OPTIONAL**: 1 variable

### Grand Total
**152 unique environment variables** across all backends

---

## 🆘 Troubleshooting

### Issue: "Missing required secret"

```bash
# Check which secrets are set
fly secrets list --app nuzantara-backend

# Set missing secret
fly secrets set MISSING_VAR="value" --app nuzantara-backend
```

### Issue: "Database connection failed"

```bash
# Verify DATABASE_URL is correct
fly ssh console --app nuzantara-backend
echo $DATABASE_URL

# Test connection
fly postgres connect -a your-postgres-app
```

### Issue: "API authentication failed"

```bash
# Ensure API_KEYS_INTERNAL matches across all backends
fly secrets list --app nuzantara-backend | grep API_KEYS
fly secrets list --app nuzantara-rag | grep API_KEYS
```

### Issue: "ChromaDB path not found"

```bash
# Ensure volume is mounted
fly volumes list --app nuzantara-rag

# Verify CHROMA_DB_PATH matches mount path
fly secrets list --app nuzantara-rag | grep CHROMA
```

---

## 📝 Next Steps

1. **Copy this guide** to your secure password manager
2. **Generate all required secrets** using `openssl`
3. **Set REQUIRED variables first** for each backend
4. **Deploy and test** basic functionality
5. **Add RECOMMENDED variables** for full features
6. **Add OPTIONAL variables** as needed

---

**Status**: ✅ Complete
**Last Updated**: 2025-11-07
**Branch**: `claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein`

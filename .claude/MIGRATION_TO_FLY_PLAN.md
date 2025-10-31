# 🚀 Migration Plan: Railway → Fly.io (Complete)

**Date**: 2025-10-31
**Goal**: Migrate tutto da Railway a Fly.io
**Expected Duration**: 4-6 hours
**Risk Level**: Medium (requires careful database migration)

---

## 🎯 Current State Analysis

### **Railway (Source - To Migrate/Shutdown)**:
1. ✅ **PostgreSQL** (~500MB) - USATO da TS-BACKEND → **MIGRATE**
2. ❓ **Redis** (~10MB) - Unclear if used → **VERIFY then MIGRATE**
3. ⏸️ **Qdrant** (empty) - 0 collections → **MIGRATE (for future)**
4. ❌ **backend-rag** (zombie) - Not used → **SHUTDOWN only**

### **Fly.io (Destination - Existing)**:
1. ✅ **nuzantara-backend** (TS) - Keep ✅
2. ✅ **nuzantara-rag** (RAG) - Keep ✅
3. ❌ **nuzantara-flan-router** - Unused → **SHUTDOWN**
4. ❌ **nuzantara-orchestrator** - Unused → **SHUTDOWN**

---

## 📋 Migration Checklist

### **Phase 1: Preparation & Verification** (1 hour)

- [ ] **1.1** Verify Railway PostgreSQL is actually used
  ```bash
  # Check TS-BACKEND database connection
  curl https://nuzantara-backend.fly.dev/health | jq .database
  ```

- [ ] **1.2** Verify Railway Redis is used
  ```bash
  # Check if Redis is referenced in backend configs
  grep -r "REDIS" apps/backend-ts/
  grep -r "redis" apps/backend-ts/
  ```

- [ ] **1.3** Document current Railway database URLs
  ```bash
  # Would need Railway access:
  # railway variables | grep DATABASE_URL
  # railway variables | grep REDIS_URL
  ```

- [ ] **1.4** Check database sizes
  ```bash
  # PostgreSQL size: ~500MB (from previous analysis)
  # Redis size: ~10MB (from previous analysis)
  ```

- [ ] **1.5** Create backup of Railway databases
  ```bash
  # PostgreSQL backup
  # railway connect postgres -- pg_dump > railway_postgres_backup.sql

  # Redis backup
  # railway connect redis -- redis-cli --rdb railway_redis_backup.rdb
  ```

---

### **Phase 2: Setup Fly.io Databases** (1-2 hours)

- [ ] **2.1** Create Fly.io PostgreSQL
  ```bash
  # Option A: Fly Postgres (managed)
  fly postgres create --name nuzantara-postgres --region sin

  # Option B: Supabase (external, more features)
  # Create on Supabase dashboard, Singapore region
  ```

- [ ] **2.2** Create Fly.io Redis
  ```bash
  # Option A: Fly Redis (Upstash)
  fly redis create --name nuzantara-redis --region sin

  # Option B: Upstash directly (external)
  # Create on Upstash dashboard, Singapore region
  ```

- [ ] **2.3** Create Fly.io Qdrant
  ```bash
  # Qdrant on Fly.io (manual setup)
  fly launch --image qdrant/qdrant:latest \
    --name nuzantara-qdrant \
    --region sin \
    --vm-size shared-cpu-1x \
    --no-deploy

  # Configure persistent volume
  fly volumes create qdrant_data \
    --region sin \
    --size 10 \
    -a nuzantara-qdrant

  # Deploy
  fly deploy -a nuzantara-qdrant
  ```

- [ ] **2.4** Verify all databases are running
  ```bash
  fly status -a nuzantara-postgres
  fly status -a nuzantara-redis
  fly status -a nuzantara-qdrant
  ```

---

### **Phase 3: Data Migration** (2-3 hours)

#### **3.1 PostgreSQL Migration**

- [ ] **3.1.1** Export from Railway
  ```bash
  # Need Railway auth for this step
  # User must run: railway login

  railway connect postgres
  # Then in psql:
  \dt  # List tables
  \l   # List databases

  # Dump database
  pg_dump -h <railway-host> -U postgres -d nuzantara_production \
    > railway_postgres_dump.sql
  ```

- [ ] **3.1.2** Import to Fly.io
  ```bash
  # Get Fly Postgres connection string
  fly postgres connect -a nuzantara-postgres

  # Import dump
  psql <fly-postgres-connection-string> < railway_postgres_dump.sql

  # Verify data
  psql <fly-postgres-connection-string> -c "\dt"
  psql <fly-postgres-connection-string> -c "SELECT COUNT(*) FROM users;"
  ```

- [ ] **3.1.3** Verify data integrity
  ```bash
  # Compare row counts
  # Railway:
  railway connect postgres -c "SELECT COUNT(*) FROM users;"
  railway connect postgres -c "SELECT COUNT(*) FROM teams;"

  # Fly.io:
  fly postgres connect -a nuzantara-postgres -c "SELECT COUNT(*) FROM users;"
  fly postgres connect -a nuzantara-postgres -c "SELECT COUNT(*) FROM teams;"
  ```

#### **3.2 Redis Migration** (if used)

- [ ] **3.2.1** Check Redis data on Railway
  ```bash
  railway connect redis
  # Then in redis-cli:
  DBSIZE
  KEYS *
  ```

- [ ] **3.2.2** Export Redis data
  ```bash
  # Option A: RDB dump
  railway connect redis -c "SAVE"
  railway connect redis -c "CONFIG GET dir"  # Get dump location

  # Option B: Manual key export (if small dataset)
  railway connect redis -c "KEYS *" > redis_keys.txt
  for key in $(cat redis_keys.txt); do
    railway connect redis -c "DUMP $key" > redis_$key.rdb
  done
  ```

- [ ] **3.2.3** Import to Fly.io Redis
  ```bash
  # Get Fly Redis connection
  fly redis connect -a nuzantara-redis

  # Restore keys
  cat redis_keys.txt | while read key; do
    redis-cli -u <fly-redis-url> RESTORE $key 0 $(cat redis_$key.rdb)
  done

  # Verify
  redis-cli -u <fly-redis-url> DBSIZE
  ```

#### **3.3 Qdrant Setup** (No data to migrate - it's empty)

- [ ] **3.3.1** Verify Qdrant is accessible
  ```bash
  curl http://nuzantara-qdrant.internal:6333/collections
  # Should return: {"result": {"collections": []}}
  ```

- [ ] **3.3.2** Configure Qdrant for future migration
  ```bash
  # Will be used later for ChromaDB → Qdrant migration
  # For now, just verify it's running and empty
  ```

---

### **Phase 4: Update Backend Configurations** (30 minutes)

- [ ] **4.1** Update TS-BACKEND environment variables
  ```bash
  # Get new database URLs
  fly postgres connect -a nuzantara-postgres --command "SELECT 'postgresql://' || current_user || '@' || inet_server_addr() || '/' || current_database();"

  # Update secrets
  fly secrets set \
    DATABASE_URL="postgresql://..." \
    REDIS_URL="redis://..." \
    -a nuzantara-backend

  # Backend will auto-restart
  ```

- [ ] **4.2** Update RAG Backend environment variables
  ```bash
  # Add Qdrant URL
  fly secrets set \
    QDRANT_URL="http://nuzantara-qdrant.internal:6333" \
    -a nuzantara-rag

  # Keep existing secrets
  # ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.
  ```

- [ ] **4.3** Update internal DNS references
  ```bash
  # In configs, replace:
  # - qdrant.railway.internal → nuzantara-qdrant.internal
  # - Railway DB URLs → Fly DB URLs

  # Check if hardcoded anywhere
  grep -r "railway.internal" apps/
  grep -r "railway.app" apps/
  ```

---

### **Phase 5: Testing & Verification** (1 hour)

- [ ] **5.1** Test TS-BACKEND with new PostgreSQL
  ```bash
  # Health check
  curl https://nuzantara-backend.fly.dev/health

  # Test database connection
  curl -X POST https://nuzantara-backend.fly.dev/api/auth/login \
    -d '{"email":"test@example.com","password":"test"}'

  # Check logs for database errors
  fly logs -a nuzantara-backend | grep -i "database\|postgres"
  ```

- [ ] **5.2** Test RAG Backend
  ```bash
  # Health check
  curl https://nuzantara-rag.fly.dev/health

  # Test query (should still use ChromaDB for now)
  curl -X POST https://nuzantara-rag.fly.dev/bali-zero/chat \
    -d '{"messages":[{"role":"user","content":"quanto costa kitas?"}],"user_id":"test"}'

  # Check logs
  fly logs -a nuzantara-rag | grep -i "chromadb\|qdrant"
  ```

- [ ] **5.3** Test Redis (if used)
  ```bash
  # Check if Redis is working
  fly logs -a nuzantara-backend | grep -i "redis"

  # Test session/cache (if Redis is for sessions)
  # Login twice, verify session persists
  ```

- [ ] **5.4** Test Qdrant connection
  ```bash
  # SSH into RAG backend
  fly ssh console -a nuzantara-rag

  # Test Qdrant connection
  curl http://nuzantara-qdrant.internal:6333/collections

  # Should return: {"result": {"collections": []}}
  ```

- [ ] **5.5** Run comprehensive integration tests
  ```bash
  # Frontend → TS-BACKEND → PostgreSQL
  # Frontend → RAG → ChromaDB (still working)
  # RAG → Qdrant (reachable, ready for migration)
  ```

---

### **Phase 6: Cleanup Railway** (30 minutes)

⚠️ **IMPORTANT**: Only proceed after confirming everything works on Fly.io!

- [ ] **6.1** Verify Fly.io services are stable (24-48 hours)
  ```bash
  # Check uptime
  fly status -a nuzantara-backend
  fly status -a nuzantara-rag

  # Monitor logs for errors
  fly logs -a nuzantara-backend
  fly logs -a nuzantara-rag
  ```

- [ ] **6.2** Keep Railway databases online for 7 days (safety)
  ```bash
  # Don't delete yet - keep as backup
  # Just stop billing on unused services
  ```

- [ ] **6.3** Shutdown Railway backend-rag (zombie)
  ```bash
  # User needs to run (I can't due to auth):
  railway service delete backend-rag
  ```

- [ ] **6.4** After 7 days of stable Fly.io operation:
  ```bash
  # Final backup of Railway databases
  # Then delete Railway services
  railway service delete postgres
  railway service delete redis
  railway service delete qdrant
  ```

---

### **Phase 7: Cleanup Fly.io** (15 minutes)

- [ ] **7.1** Shutdown unused FLAN router
  ```bash
  fly apps destroy nuzantara-flan-router --yes
  ```

- [ ] **7.2** Shutdown unused Orchestrator
  ```bash
  fly apps destroy nuzantara-orchestrator --yes
  ```

- [ ] **7.3** Verify final architecture
  ```bash
  fly apps list

  # Should show only:
  # - nuzantara-backend (TS)
  # - nuzantara-rag (RAG)
  # - nuzantara-postgres (DB)
  # - nuzantara-redis (Cache)
  # - nuzantara-qdrant (Vector DB)
  ```

---

## 💰 Cost Comparison

### **Before Migration**:
| Platform | Service | Cost/Month |
|----------|---------|------------|
| **Fly.io** | nuzantara-backend | $5 |
| **Fly.io** | nuzantara-rag | $5 |
| **Fly.io** | nuzantara-flan-router | $5 ❌ |
| **Fly.io** | nuzantara-orchestrator | $5 ❌ |
| **Railway** | backend-rag | $10-15 ❌ |
| **Railway** | PostgreSQL | $5 |
| **Railway** | Redis | $2 |
| **Railway** | Qdrant | $5 |
| **TOTAL** | | **$42-47/month** |

### **After Migration**:
| Platform | Service | Cost/Month |
|----------|---------|------------|
| **Fly.io** | nuzantara-backend | $5 |
| **Fly.io** | nuzantara-rag | $5 |
| **Fly.io** | nuzantara-postgres | $5-10 |
| **Fly.io** | nuzantara-redis | $3-5 |
| **Fly.io** | nuzantara-qdrant | $5 |
| **Railway** | (nothing) | $0 ✅ |
| **TOTAL** | | **$23-30/month** ✅ |

**Savings**: $12-17/month (~35-40% reduction)

---

## 🎯 Benefits of Migration

### **Performance** 🚀:
- ✅ All services in Singapore datacenter (15ms latency)
- ✅ Internal networking (no external calls)
- ✅ Faster database queries (same region)

### **Autonomy** 🤖:
- ✅ Claude Code 95% autonomous (vs 20% Railway)
- ✅ Instant debugging (SSH, logs, metrics)
- ✅ No manual auth needed

### **Simplicity** 🎨:
- ✅ One platform (easier to manage)
- ✅ Unified billing
- ✅ Consistent CLI/tooling

### **Cost** 💰:
- ✅ 35-40% cost reduction
- ✅ No unused services
- ✅ Better resource utilization

---

## ⚠️ Risks & Mitigation

### **Risk 1: Database Migration Data Loss**
- **Mitigation**: Full backup before migration
- **Rollback**: Keep Railway DB online for 7 days
- **Verification**: Row count comparison

### **Risk 2: Downtime During Migration**
- **Mitigation**: Blue-green deployment (Railway stays up during Fly setup)
- **Rollback**: Point DNS back to Railway
- **Expected downtime**: < 5 minutes (just env var update)

### **Risk 3: Internal Network Issues**
- **Mitigation**: Test internal DNS before switching
- **Rollback**: Use external URLs temporarily
- **Verification**: `curl http://service.internal` from containers

### **Risk 4: Qdrant Future Migration Blocked**
- **Mitigation**: Ensure Qdrant accessible before ChromaDB migration
- **Rollback**: Keep ChromaDB as primary
- **Verification**: Test connection from RAG backend

---

## 📊 Migration Timeline

| Phase | Duration | Can Run Parallel |
|-------|----------|------------------|
| **1. Preparation** | 1 hour | No |
| **2. Setup Fly Databases** | 1-2 hours | Yes (3 databases) |
| **3. Data Migration** | 2-3 hours | No (sequential) |
| **4. Update Configs** | 30 min | Yes (2 backends) |
| **5. Testing** | 1 hour | No |
| **6. Railway Cleanup** | 30 min | After 7 days ⏰ |
| **7. Fly Cleanup** | 15 min | Yes |
| **TOTAL** | **6-8 hours** | (parallelizable to 4-6 hours) |

---

## 🚦 Migration Prerequisites

### **What I Need From You** (One-time):

1. ⚠️ **Railway Login** (for database export)
   ```bash
   railway login
   ```
   - I need this to export PostgreSQL/Redis data
   - Alternative: You export manually, give me dump files

2. ✅ **Confirmation to Proceed**
   - Review this plan
   - Confirm you're ready for migration
   - Choose migration window (low traffic time)

3. ⚠️ **Backup Storage** (optional)
   ```bash
   # Where to store Railway backups?
   # Option A: Local disk
   # Option B: S3/R2
   # Option C: Fly.io volume
   ```

### **What I Can Do Autonomously** (95%):

- ✅ Create all Fly.io databases
- ✅ Configure networking
- ✅ Update backend environment variables
- ✅ Run tests
- ✅ Monitor logs
- ✅ Rollback if issues
- ✅ Cleanup unused services

**Only need you for**: Railway database export (unless you give me dumps)

---

## 🎬 Ready to Start?

### **Option A: Full Autonomous** (if Railway accessible)
```bash
# If you run: railway login
# Then I can do 100% autonomous migration
```

### **Option B: Hybrid** (you export DBs, I do rest)
```bash
# You run:
railway connect postgres -- pg_dump > railway_db.sql
railway connect redis -- redis-cli --rdb dump.rdb

# Give me files, I handle rest (95% autonomous)
```

### **Option C: Guided** (I guide you step-by-step)
```bash
# I create databases on Fly
# I tell you what Railway commands to run
# You give me outputs
# I process and migrate
```

---

## 📋 Next Steps

**Choose your approach**:
1. **Option A** → Run `railway login`, let me handle everything
2. **Option B** → Export DBs, give me dumps
3. **Option C** → Let's go step-by-step together

**Once you decide**, I'll start immediately with:
1. ✅ Create Fly.io PostgreSQL
2. ✅ Create Fly.io Redis
3. ✅ Create Fly.io Qdrant
4. ✅ Update backend configs
5. ✅ Migrate data
6. ✅ Test everything
7. ✅ Cleanup

**ETA**: 4-6 hours to complete migration

---

**Migration Plan Complete** ✅
**Ready to Execute**: Awaiting your go-ahead
**Risk Level**: Medium (careful DB migration needed)
**Expected Downtime**: < 5 minutes
**Cost Savings**: $12-17/month

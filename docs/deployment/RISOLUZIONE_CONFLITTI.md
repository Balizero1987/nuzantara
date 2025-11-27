# 🔧 Risoluzione Conflitti Merge - Guida

**Data:** 2025-01-27
**Problema:** Push bloccato da conflitti di merge

---

## 🔍 Situazione

**Commit locale:** `4591b7d2` - Deployment strategy optimizations

**Conflitti su:**
- File eliminati localmente (già risolti in commit precedente)
- File modificati in entrambi i branch
- Workflow files

---

## ✅ Soluzione Rapida

### Opzione 1: Accettare modifiche locali (Raccomandato)

```bash
# Rimuovere file eliminati (già fatto in commit precedente)
git rm apps/backend-ts/src/handlers/bali-zero/kbli.ts
git rm apps/backend-ts/src/services/kbli-external.ts
git rm apps/backend-ts/src/agents/endpoint-generator.ts
git rm apps/backend-ts/src/agents/refactoring-agent.ts
git rm apps/backend-ts/src/agents/test-generator-agent.ts
# ... altri file eliminati

# Accettare versioni locali per file modificati (se corrette)
git checkout --ours apps/backend-ts/src/routing/router.ts
git checkout --ours apps/backend-ts/src/server.ts
git checkout --ours apps/backend-ts/src/services/auth/unified-auth-strategy.ts
git checkout --ours apps/backend-ts/src/services/cron-scheduler.ts
git checkout --ours apps/backend-rag/requirements.txt
git checkout --ours apps/backend-ts/Dockerfile
git checkout --ours apps/backend-ts/package.json
git checkout --ours package-lock.json

# Aggiungere file risolti
git add .

# Completare merge
git commit -m "merge: resolve conflicts accepting local changes from cleanup"

# Push
git push origin main
```

### Opzione 2: Manual Merge (se serve controllo)

```bash
# Vedere conflitti
git status

# Risolvere manualmente ogni file
# Poi:
git add <file-risolto>
git commit -m "merge: resolve conflicts manually"
git push origin main
```

---

## 📋 File con Conflitti

### File eliminati (accettare eliminazione)
- ✅ `apps/backend-ts/src/handlers/bali-zero/kbli.ts`
- ✅ `apps/backend-ts/src/services/kbli-external.ts`
- ✅ `apps/backend-ts/src/agents/*.ts` (vari agenti)
- ✅ `apps/backend-rag/Dockerfile.fly`

### File modificati (scegliere versione)
- `apps/backend-ts/src/routing/router.ts`
- `apps/backend-ts/src/server.ts`
- `apps/backend-ts/src/services/auth/unified-auth-strategy.ts`
- `apps/backend-ts/src/services/cron-scheduler.ts`
- `apps/backend-rag/requirements.txt`
- `apps/backend-ts/Dockerfile`
- `apps/backend-ts/package.json`
- `package-lock.json`

---

## ✅ Dopo Risoluzione

1. **Push completato**
2. **GitHub Actions si attiva** automaticamente
3. **Monitorare deploy:**
   - https://github.com/Balizero1987/nuzantara/actions
4. **Eseguire test post-deploy:**
   ```bash
   ./test-post-deploy.sh
   ```

---

**Nota:** Le modifiche locali sono corrette (cleanup + ottimizzazioni), quindi accettare versioni locali è la soluzione più rapida.

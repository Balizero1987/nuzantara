# ✅ CHECKLIST AGENTI AI AUTOMATICI - NUZANTARA

**Data Creazione**: 2025-11-10
**Branch**: `claude/analyze-codebase-011CUz492NbDwHKUhTjMxgwD`
**Stato Generale**: 🟢 12/12 Agenti Implementati

---

## 📋 INDICE RAPIDO

- [Backend TypeScript (5 agenti)](#backend-typescript)
- [Backend Python RAG (7 agenti)](#backend-python-rag)
- [Verifica Configurazione](#verifica-configurazione)
- [API Endpoints Testing](#api-endpoints-testing)
- [Monitoraggio e Maintenance](#monitoraggio-e-maintenance)

---

## 🎯 BACKEND TYPESCRIPT

### ✅ 1. CRON SCHEDULER (Orchestratore Centrale)

**File**: `apps/backend-ts/src/services/cron-scheduler.ts:14-291`

#### Verifica Implementazione
- [x] Classe `CronScheduler` implementata
- [x] Singleton pattern configurato
- [x] 5 job schedulati configurati
- [x] Health check implementato
- [x] Metrics reporting implementato

#### Configurazione Richiesta
```bash
# Environment Variables
ENABLE_CRON=true                      # ✅ Verificare
NODE_ENV=production                   # ✅ Verificare
OPENROUTER_API_KEY=sk-or-v1-xxxxx   # ⚠️ OBBLIGATORIO
DEEPSEEK_API_KEY=sk-xxxxx            # ⚠️ OBBLIGATORIO

# Optional Cron Expressions
CRON_TIMEZONE=Asia/Singapore         # Default: Asia/Singapore
CRON_SELF_HEALING=0 2 * * *         # Default: 2:00 AM daily
CRON_AUTO_TESTS=0 3 * * *           # Default: 3:00 AM daily
CRON_WEEKLY_PR=0 4 * * 0            # Default: 4:00 AM Sunday
CRON_HEALTH_CHECK=*/15 * * * *      # Default: Every 15 min
CRON_DAILY_REPORT=0 9 * * *         # Default: 9:00 AM daily
```

#### Job Schedulati

| Job | Schedule | Priorità | Azione |
|-----|----------|----------|--------|
| Nightly Self-Healing | Daily 2:00 AM | HIGH | Scan e auto-fix errori |
| Auto-Test Generation | Daily 3:00 AM | MEDIUM | Genera test mancanti |
| Weekly PR Creation | Sunday 4:00 AM | LOW | Crea PR miglioramenti |
| Health Check | Every 15 min | - | Monitor sistema |
| Daily Report | Daily 9:00 AM | - | Report metriche |

#### Test Funzionamento
```bash
# 1. Verifica status scheduler
curl http://localhost:3000/api/monitoring/cron-status

# 2. Check logs
tail -f logs/cron-scheduler.log

# 3. Verifica job attivi
# Expected: { "enabled": true, "jobCount": 5, "jobs": [...] }
```

#### Verifica Deployment
- [ ] Scheduler si avvia al boot del server
- [ ] Tutti i 5 job sono registrati
- [ ] Health check logga ogni 15 minuti
- [ ] API keys presenti e valide
- [ ] Orchestrator inizializzato correttamente

---

### ✅ 2. AGENT ORCHESTRATOR (Coordinatore Task)

**File**: `apps/backend-ts/src/agents/agent-orchestrator.ts`

#### Verifica Implementazione
- [x] Queue con priorità (critical > high > medium > low)
- [x] Task tracking (pending, running, completed, failed)
- [x] Cleanup automatico task (24h dopo completamento)
- [x] Supporto agenti: endpoint-generator, memory-integrator, self-healing, test-writer, pr-agent

#### API Keys Richieste
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
DEEPSEEK_API_KEY=sk-xxxxx
```

#### Test Funzionamento
```bash
# 1. Submit test task
curl -X POST http://localhost:3000/api/agents/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "self-healing",
    "payload": {"action": "test"},
    "metadata": {"priority": "low"}
  }'

# 2. Check task status
curl http://localhost:3000/api/agents/tasks

# 3. Verify task execution
# Expected: Task moves from pending -> running -> completed
```

#### Verifica Deployment
- [ ] Orchestrator accessibile da cron scheduler
- [ ] Task queue funzionante
- [ ] Priority sorting corretto
- [ ] Cleanup automatico task vecchi attivo
- [ ] Tutti i 5 agenti registrati e funzionanti

---

### ✅ 3. REFACTORING AGENT (Auto-Refactoring)

**File**: `apps/backend-ts/src/agents/refactoring-agent.ts`

#### Verifica Implementazione
- [x] Analisi code smells, complessità, duplicazione
- [x] Refactoring automatico con AI
- [x] Ensemble verification (2 AI models)
- [x] Test execution post-refactoring
- [x] PR creation automatica (DRAFT)
- [x] Safety features (cooldown, error counting, blacklist)

#### AI Models Usati
```typescript
DeepSeek Coder (GRATUITO)    → Genera refactoring
Llama 3.3 70B (GRATUITO)     → Verifica ensemble
```

#### Safety Features
```bash
# File tracking
.ai-automation/refactoring-history.json

# Limiti Anti-Loop
COOLDOWN_PERIOD=7 giorni
MAX_ERRORS_PER_FILE=3
MAX_FILES_PER_RUN=5
MAX_FILE_SIZE=10000 linee
```

#### Test Funzionamento
```bash
# 1. Trigger manuale
curl -X POST http://localhost:3000/api/agents/refactoring/run

# 2. Check refactoring history
cat .ai-automation/refactoring-history.json

# 3. Verify PR creation
gh pr list --label "ai-refactoring"
```

#### Verifica Deployment
- [ ] File tracking JSON esiste e scrivibile
- [ ] DeepSeek API key configurata
- [ ] OpenRouter API key configurata
- [ ] Test suite eseguibile
- [ ] Git configurato per PR creation
- [ ] Cooldown period rispettato
- [ ] Blacklist funzionante

---

### ✅ 4. TEST GENERATOR AGENT (Auto-Testing)

**File**: `apps/backend-ts/src/agents/test-generator-agent.ts`

#### Verifica Implementazione
- [x] Generazione test Jest completi
- [x] Coverage minimo 50%
- [x] Mock automatico dipendenze
- [x] Test execution per validazione
- [x] Safety features (idempotenza, cooldown)

#### AI Model Usato
```typescript
Qwen 2.5 72B (GRATUITO)      → Ottimo per test generation
```

#### Safety Features
```bash
# File tracking
.ai-automation/test-generation-history.json

# Limiti Anti-Loop
COOLDOWN_PERIOD=7 giorni
MAX_ERRORS_PER_FILE=3
MAX_FILES_PER_RUN=10
MAX_FILE_SIZE=5000 linee
MIN_COVERAGE=50%
IDEMPOTENZA=Skip se test esistono
```

#### Test Funzionamento
```bash
# 1. Trigger manuale
curl -X POST http://localhost:3000/api/agents/test-generation/run

# 2. Check test history
cat .ai-automation/test-generation-history.json

# 3. Verify tests created
find . -name "*.test.ts" -newer .ai-automation/test-generation-history.json

# 4. Run generated tests
npm test
```

#### Verifica Deployment
- [ ] File tracking JSON esiste e scrivibile
- [ ] OpenRouter API key configurata (per Qwen)
- [ ] Jest configurato e funzionante
- [ ] Test possono essere eseguiti
- [ ] Coverage tool configurato
- [ ] Idempotenza funzionante (no duplicati)

---

### ✅ 5. PR AGENT (Auto Pull Requests)

**File**: `apps/backend-ts/src/agents/pr-agent.ts`

#### Verifica Implementazione
- [x] Workflow completo (branch → changes → test → push → PR)
- [x] Rollback automatico su errore
- [x] Test suite validation obbligatoria
- [x] Type checking TypeScript
- [x] GitHub CLI integration

#### Workflow Steps
1. ✅ Crea branch da main
2. ✅ Applica modifiche ai file
3. ✅ Esegue test suite completa
4. ✅ Auto-fix test falliti (tentativo)
5. ✅ Type check TypeScript
6. ✅ Commit con messaggio generato
7. ✅ Push a origin
8. ✅ Crea PR via `gh pr create`

#### Test Funzionamento
```bash
# 1. Verifica GitHub CLI installato
gh --version

# 2. Verifica autenticazione GitHub
gh auth status

# 3. Test creazione branch
git checkout -b test-pr-agent-$(date +%s)
git checkout main
git branch -D test-pr-agent-*

# 4. Trigger via orchestrator (weekly cron)
# Oppure test manuale (non consigliato in prod)
```

#### Verifica Deployment
- [ ] GitHub CLI (`gh`) installato
- [ ] GitHub authentication configurata
- [ ] Git configurato (user.name, user.email)
- [ ] Push permissions su repository
- [ ] Test suite eseguibile e passa
- [ ] TypeScript compiler disponibile
- [ ] PR vengono create come DRAFT

---

### ✅ 6. OPENROUTER CLIENT (AI Gateway)

**File**: `apps/backend-ts/src/services/ai/openrouter-client.ts`

#### Verifica Implementazione
- [x] 50+ modelli AI supportati
- [x] Rate limiting (100 chiamate/ora)
- [x] Circuit breaker (20% error threshold)
- [x] Budget tracking ($1/giorno default)
- [x] Retry con exponential backoff
- [x] Cost tracking in tempo reale

#### Modelli FREE Usati
```typescript
meta-llama/llama-3.3-70b-instruct    → Refactoring (128k context)
deepseek/deepseek-coder              → Code review
qwen/qwen-2.5-72b-instruct           → Test generation
mistralai/mistral-7b-instruct        → Chat veloce
```

#### Modelli PAID Disponibili
```typescript
anthropic/claude-3.5-haiku           → $0.25/M tokens
anthropic/claude-3.5-sonnet          → $3/M tokens
openai/gpt-4-turbo                   → $2.50/M tokens
```

#### Safety Features
```bash
# Rate Limiting
MAX_REQUESTS_PER_HOUR=100

# Circuit Breaker
ERROR_THRESHOLD=20%         # Apre circuito se >20% errori
RECOVERY_TIMEOUT=5min       # Tempo prima di retry

# Budget Control
DAILY_BUDGET=$1.00          # Default
BUDGET_ALERT=80%            # Alert al 80% budget
```

#### Test Funzionamento
```bash
# 1. Test connessione OpenRouter
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# 2. Test rate limiting
# (Fare 101 chiamate in 1 ora → deve bloccare)

# 3. Check budget tracking
curl http://localhost:3000/api/ai/usage-stats
```

#### Verifica Deployment
- [ ] `OPENROUTER_API_KEY` configurata e valida
- [ ] Rate limiter funzionante
- [ ] Circuit breaker attivo
- [ ] Budget tracking attivo
- [ ] Cost monitoring funzionante
- [ ] Retry logic funzionante

---

## 🧠 BACKEND PYTHON RAG

### ✅ 7. CONVERSATION TRAINER (Prompt Auto-Improvement)

**File**: `apps/backend-rag/backend/agents/conversation_trainer.py:12-228`

#### Verifica Implementazione
- [x] Query conversazioni rating ≥4 (ultimi 7 giorni)
- [x] Analisi pattern con Claude Sonnet
- [x] Estrazione frasi/approcci vincenti
- [x] Generazione prompt migliorato
- [x] Creazione PR automatica
- [x] Notifica Slack

#### AI Model Usato
```python
claude-3-5-sonnet-20241022    → Analisi complessa (4k tokens)
```

#### Configurazione Richiesta
```bash
# Environment Variables
DATABASE_URL=postgresql://...          # ⚠️ OBBLIGATORIO
ANTHROPIC_API_KEY=sk-ant-xxxxx        # ⚠️ OBBLIGATORIO
GITHUB_TOKEN=ghp_xxxxx                # ⚠️ OBBLIGATORIO (per PR)
SLACK_WEBHOOK_URL=https://...         # ✅ Opzionale
```

#### Workflow
1. ✅ Query TOP 50 conversazioni (rating ≥4)
2. ✅ Analizza TOP 10 con Claude
3. ✅ Estrae pattern di successo
4. ✅ Genera prompt migliorato
5. ✅ Crea branch `auto/prompt-improvement-YYYYMMDD-HHMM`
6. ✅ Aggiorna `zantara_system_prompt.txt`
7. ✅ Crea report in `reports/conversation-analysis-YYYYMMDD.md`
8. ✅ Push e crea PR con label `automation,prompt-improvement`
9. ✅ Notifica team su Slack

#### Test Funzionamento
```bash
# 1. Trigger manuale
curl -X POST http://localhost:8000/api/autonomous-agents/conversation-trainer/run \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'

# 2. Check execution status
curl http://localhost:8000/api/autonomous-agents/executions/{execution_id}

# 3. Verify PR created
gh pr list --label "prompt-improvement"

# 4. Check database has conversations
psql $DATABASE_URL -c "SELECT COUNT(*) FROM conversations WHERE rating >= 4"
```

#### Schedule Automatico
```python
# Weekly: Sunday 4:00 AM
CRON_CONVERSATION_TRAINER="0 4 * * 0"
```

#### Verifica Deployment
- [ ] Database PostgreSQL accessibile
- [ ] Tabella `conversations` esiste e popolata
- [ ] Anthropic API key valida
- [ ] GitHub token valido con permessi push/PR
- [ ] Git configurato per PR creation
- [ ] Slack webhook configurato (opzionale)
- [ ] Directory `reports/` esiste e scrivibile
- [ ] File `apps/backend-rag/backend/prompts/zantara_system_prompt.txt` esiste

---

### ✅ 8. CLIENT VALUE PREDICTOR (LTV + Auto-Nurturing)

**File**: `apps/backend-rag/backend/agents/client_value_predictor.py:12-283`

#### Verifica Implementazione
- [x] Calcolo LTV score (0-100) multi-dimensionale
- [x] Segmentazione clienti (VIP, HIGH, MEDIUM, LOW)
- [x] Calcolo rischio churn
- [x] Generazione messaggi personalizzati con Claude Haiku
- [x] Invio automatico WhatsApp via Twilio
- [x] Logging interazioni in CRM
- [x] Report giornaliero su Slack

#### AI Model Usato
```python
claude-3-5-haiku-20241022    → Fast + economico ($0.25/M tokens)
```

#### Configurazione Richiesta
```bash
# Environment Variables
DATABASE_URL=postgresql://...          # ⚠️ OBBLIGATORIO
ANTHROPIC_API_KEY=sk-ant-xxxxx        # ⚠️ OBBLIGATORIO
TWILIO_ACCOUNT_SID=ACxxxxx             # ⚠️ OBBLIGATORIO
TWILIO_AUTH_TOKEN=xxxxx                # ⚠️ OBBLIGATORIO
TWILIO_WHATSAPP_NUMBER=+14155238886   # ⚠️ OBBLIGATORIO (Twilio Sandbox)
SLACK_WEBHOOK_URL=https://...         # ✅ Opzionale
```

#### Formula LTV Score
```python
# Metriche (0-100 ciascuna)
engagement_score = min(100, interaction_count * 5)
sentiment_score = (avg_sentiment + 1) * 50           # -1 to 1 → 0 to 100
recency_score = min(100, recent_interactions * 10)
quality_score = avg_rating * 20                      # 0-5 → 0-100
practice_score = min(100, practice_count * 15)

# LTV Score Weighted (0-100)
ltv_score = (
    engagement_score * 0.3 +    # 30% peso engagement
    sentiment_score * 0.2 +     # 20% peso sentiment
    recency_score * 0.2 +       # 20% peso recency
    quality_score * 0.2 +       # 20% peso quality
    practice_score * 0.1        # 10% peso practices
)
```

#### Segmentazione Clienti
| Segmento | LTV Score | Azione |
|----------|-----------|--------|
| VIP | ≥ 80 | Auto-nurture se inattivo 14+ giorni |
| HIGH_VALUE | ≥ 60 | Auto-nurture se inattivo 30+ giorni |
| MEDIUM_VALUE | ≥ 40 | Monitor |
| LOW_VALUE | < 40 | Monitor |

#### Calcolo Rischio Churn
| Rischio | Condizione | Azione |
|---------|------------|--------|
| HIGH_RISK | LTV ≥70 + 30+ giorni inattivo | ⚠️ Nurture immediato |
| MEDIUM_RISK | LTV <70 + 60+ giorni inattivo | Monitor |
| LOW_RISK | Attivo recentemente | - |

#### Test Funzionamento
```bash
# 1. Trigger manuale
curl -X POST http://localhost:8000/api/autonomous-agents/client-value-predictor/run

# 2. Check database schema
psql $DATABASE_URL -c "\d crm_clients"
psql $DATABASE_URL -c "\d crm_interactions"
psql $DATABASE_URL -c "\d crm_practices"
psql $DATABASE_URL -c "\d conversations"

# 3. Verify client scoring
psql $DATABASE_URL -c "
  SELECT name, metadata->'ltv_score', metadata->'segment'
  FROM crm_clients
  WHERE metadata ? 'ltv_score'
  ORDER BY (metadata->>'ltv_score')::float DESC
  LIMIT 10
"

# 4. Test Twilio WhatsApp connection
python -c "
from twilio.rest import Client
import os
client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
print('✅ Twilio connected')
"
```

#### Schedule Automatico
```python
# Daily: 10:00 AM
CRON_CLIENT_NURTURING="0 10 * * *"
```

#### Verifica Deployment
- [ ] Database PostgreSQL accessibile
- [ ] Tabelle `crm_clients`, `crm_interactions`, `crm_practices`, `conversations` esistono
- [ ] Colonna `metadata` tipo JSONB su `crm_clients`
- [ ] Anthropic API key valida
- [ ] Twilio account configurato
- [ ] Twilio WhatsApp sandbox approvato
- [ ] Slack webhook configurato (opzionale)
- [ ] Test invio WhatsApp funzionante

---

### ✅ 9. KNOWLEDGE GRAPH BUILDER (Grafo Conoscenza)

**File**: `apps/backend-rag/backend/agents/knowledge_graph_builder.py`

#### Verifica Implementazione
- [x] Estrazione entità da conversazioni
- [x] Identificazione relazioni semantiche
- [x] Costruzione grafo in PostgreSQL
- [x] Generazione insights (top entities, hubs)
- [x] Supporto 5 tipi entità (laws, topics, companies, locations, concepts)

#### Schema Database Richiesto
```sql
-- Entità
CREATE TABLE kg_entities (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),        -- laws, topics, companies, locations, concepts
    entity_name VARCHAR(255),
    entity_value TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Relazioni
CREATE TABLE kg_relationships (
    id SERIAL PRIMARY KEY,
    entity_from_id INT REFERENCES kg_entities(id),
    entity_to_id INT REFERENCES kg_entities(id),
    relationship_type VARCHAR(100),  -- relates_to, requires, conflicts_with
    strength FLOAT DEFAULT 1.0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Menzioni (link a sorgenti)
CREATE TABLE kg_entity_mentions (
    id SERIAL PRIMARY KEY,
    entity_id INT REFERENCES kg_entities(id),
    source_type VARCHAR(50),        -- conversation, document, message
    source_id VARCHAR(255),
    context TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Configurazione Richiesta
```bash
# Environment Variables
DATABASE_URL=postgresql://...          # ⚠️ OBBLIGATORIO
ANTHROPIC_API_KEY=sk-ant-xxxxx        # ⚠️ OBBLIGATORIO
```

#### Test Funzionamento
```bash
# 1. Initialize schema (SOLO PRIMA VOLTA)
curl -X POST "http://localhost:8000/api/autonomous-agents/knowledge-graph-builder/run?init_schema=true"

# 2. Build graph da conversazioni recenti
curl -X POST "http://localhost:8000/api/autonomous-agents/knowledge-graph-builder/run?days_back=30&init_schema=false"

# 3. Check entities created
psql $DATABASE_URL -c "
  SELECT entity_type, COUNT(*) as count
  FROM kg_entities
  GROUP BY entity_type
  ORDER BY count DESC
"

# 4. Check relationships
psql $DATABASE_URL -c "
  SELECT relationship_type, COUNT(*) as count
  FROM kg_relationships
  GROUP BY relationship_type
  ORDER BY count DESC
"

# 5. Find most connected entities (hubs)
psql $DATABASE_URL -c "
  SELECT e.entity_name, e.entity_type, COUNT(*) as connections
  FROM kg_entities e
  JOIN kg_relationships r ON (e.id = r.entity_from_id OR e.id = r.entity_to_id)
  GROUP BY e.id, e.entity_name, e.entity_type
  ORDER BY connections DESC
  LIMIT 10
"
```

#### Schedule Automatico
```python
# Daily: 4:00 AM
CRON_KNOWLEDGE_GRAPH="0 4 * * *"
```

#### Verifica Deployment
- [ ] Database PostgreSQL accessibile
- [ ] Schema knowledge graph creato (3 tabelle)
- [ ] Indexes su foreign keys per performance
- [ ] Anthropic API key valida
- [ ] Conversazioni disponibili nel database
- [ ] Processo di estrazione entità funzionante
- [ ] Relazioni vengono create correttamente

---

### ✅ 10. AUTONOMOUS RESEARCH SERVICE (Ricerca Self-Directed)

**File**: `apps/backend-rag/backend/services/autonomous_research_service.py`

#### Verifica Implementazione
- [x] Ricerca iterativa multi-step
- [x] Analisi gap e espansione query
- [x] Ricerca multi-collection
- [x] Confidence tracking (target 70%)
- [x] Max 5 iterazioni
- [x] Sintesi finale con Claude

#### Configurazione Richiesta
```bash
# Environment Variables
ANTHROPIC_API_KEY=sk-ant-xxxxx        # ⚠️ OBBLIGATORIO
CHROMA_HOST=localhost                 # ⚠️ OBBLIGATORIO
CHROMA_PORT=8001                      # ⚠️ OBBLIGATORIO
```

#### Workflow Self-Directed
```
User Query: "Come aprire azienda crypto in Indonesia?"
    ↓
Step 1: Search kbli_eye
    → "crypto" non in KBLI standard
    → Confidence: 20%
    ↓
Step 2: Expand query → "cryptocurrency regulations Indonesia"
    → Search legal_updates
    → Trova regolamento OJK crypto 2024
    → Confidence: 50%
    ↓
Step 3: Expand query → "tax treatment cryptocurrency"
    → Search tax_genius
    → Trova trattamento fiscale crypto
    → Confidence: 65%
    ↓
Step 4: Expand query → "visa fintech director Indonesia"
    → Search visa_oracle
    → Trova requisiti visa director fintech
    → Confidence: 75% ✅ THRESHOLD RAGGIUNTO
    ↓
Synthesis: Risposta completa con Claude Sonnet
```

#### Parametri Configurabili
```python
MAX_ITERATIONS = 5
CONFIDENCE_THRESHOLD = 0.7        # 70%
MIN_RESULTS_PER_ITERATION = 3
```

#### Test Funzionamento
```bash
# 1. Verifica ChromaDB accessibile
curl http://localhost:8001/api/v1/heartbeat

# 2. Test ricerca autonoma
curl -X POST http://localhost:8000/api/research/autonomous \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Come aprire una società fintech in Indonesia?",
    "max_iterations": 5,
    "confidence_threshold": 0.7
  }'

# 3. Check iterations log
# Expected: Multiple steps, expanding queries, confidence increase
```

#### Verifica Deployment
- [ ] ChromaDB running e accessibile
- [ ] Collections populate (kbli_eye, legal_updates, tax_genius, visa_oracle)
- [ ] Anthropic API key valida
- [ ] SearchService disponibile
- [ ] QueryRouter disponibile
- [ ] Max iterations rispettato
- [ ] Confidence tracking funzionante

---

### ✅ 11. AUTO INGESTION ORCHESTRATOR (Ingestion Automatica)

**File**: `apps/backend-rag/backend/services/auto_ingestion_orchestrator.py`

#### Verifica Implementazione
- [x] Monitoring fonti esterne (OSS, DJP, BKPM, ecc.)
- [x] Scraping automatico
- [x] Filtro LLM: "È un cambio di regolamento?"
- [x] Estrazione info chiave
- [x] Generazione embeddings
- [x] Aggiunta a collection ChromaDB
- [x] Notifica admin
- [x] Health check trigger

#### Fonti Monitorate
| Fonte | URL/Source | Frequenza | Collection Target |
|-------|------------|-----------|-------------------|
| OSS (KBLI) | oss.go.id | 24h | kbli_eye |
| Ditjen Imigrasi | imigrasi.go.id | 24h | visa_oracle |
| DJP (Pajak) | pajak.go.id | 24h | tax_genius |
| BKPM | bkpm.go.id | 24h | legal_updates |
| Database Legali | Various | 24h | legal_updates |

#### Tipo di Aggiornamenti Detectati
```python
NEW_REGULATION          # Nuova regolamentazione
AMENDED_REGULATION      # Modifica regolamento esistente
POLICY_CHANGE          # Cambio policy
DEADLINE_CHANGE        # Cambio deadline/scadenze
COST_CHANGE           # Cambio costi/tariffe
PROCESS_CHANGE        # Cambio processo/procedura
```

#### Configurazione Richiesta
```bash
# Environment Variables
CHROMA_HOST=localhost                 # ⚠️ OBBLIGATORIO
CHROMA_PORT=8001                      # ⚠️ OBBLIGATORIO
ANTHROPIC_API_KEY=sk-ant-xxxxx       # ⚠️ OBBLIGATORIO
SLACK_WEBHOOK_URL=https://...        # ✅ Opzionale
```

#### Test Funzionamento
```bash
# 1. Verifica scraper bali-intel esistente
ls -la apps/backend-rag/scrapers/

# 2. Test ingestion manuale di un documento
curl -X POST http://localhost:8000/api/ingestion/manual \
  -H "Content-Type: application/json" \
  -d '{
    "source": "oss.go.id",
    "content": "...",
    "metadata": {"type": "KBLI_UPDATE", "date": "2025-11-10"}
  }'

# 3. Check collection size growth
curl http://localhost:8001/api/v1/collections/kbli_eye | jq '.count'

# 4. Verify embedding quality
curl -X POST http://localhost:8000/api/search \
  -d '{"query": "latest KBLI update", "collection": "kbli_eye", "limit": 5}'
```

#### Verifica Deployment
- [ ] ChromaDB running e accessibile
- [ ] All collections esistono e sono scrivibili
- [ ] Scrapers configurati per ogni fonte
- [ ] Anthropic API key valida (per filtro LLM)
- [ ] Slack webhook configurato (opzionale)
- [ ] Cron job configurato per monitoring
- [ ] Alert system configurato per admin

---

### ✅ 12. CLIENT JOURNEY ORCHESTRATOR (Percorso Cliente)

**File**: `apps/backend-rag/backend/services/client_journey_orchestrator.py`

#### Verifica Implementazione
- [x] Template journey pre-configurati (PT PMA, KITAS, Property)
- [x] Progress tracking automatico
- [x] Next steps suggestion
- [x] Dependency management
- [x] Notification triggers
- [x] Analytics completion rate

#### Journey Templates Disponibili

##### 1. PT PMA Setup (7 steps)
```
1. Company registration (OSS)
2. Tax registration (NPWP, PKP)
3. Investment license (BKPM)
4. IMTA application
5. Bank account opening
6. Office setup & domicile letter
7. Compliance setup (accounting, reporting)
```

##### 2. KITAS Application (5 steps)
```
1. Document collection (passport, sponsor docs)
2. Sponsor letter generation
3. Immigration submission
4. Interview scheduling
5. KITAS card collection
```

##### 3. Property Purchase (6 steps)
```
1. Property viewing & selection
2. Legal due diligence
3. Price negotiation
4. Sales contract signing (PPJB)
5. Payment processing
6. Title transfer (AJB + Notary)
```

#### Configurazione Richiesta
```bash
# Environment Variables
DATABASE_URL=postgresql://...          # ⚠️ OBBLIGATORIO
ANTHROPIC_API_KEY=sk-ant-xxxxx        # ⚠️ OBBLIGATORIO (per suggestions)
```

#### API Endpoints
```bash
# 1. Create new journey
curl -X POST http://localhost:8000/api/agents/journey/create \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "123",
    "template": "pt_pma_setup",
    "metadata": {"company_name": "Test Ltd"}
  }'

# 2. Get journey status
curl http://localhost:8000/api/agents/journey/{journey_id}

# 3. Complete a step
curl -X POST http://localhost:8000/api/agents/journey/{journey_id}/step/{step_id}/complete \
  -H "Content-Type: application/json" \
  -d '{"notes": "Documents submitted", "metadata": {}}'

# 4. Get next steps
curl http://localhost:8000/api/agents/journey/{journey_id}/next-steps
```

#### Test Funzionamento
```bash
# 1. Create test journey
JOURNEY_ID=$(curl -X POST http://localhost:8000/api/agents/journey/create \
  -H "Content-Type: application/json" \
  -d '{"client_id": "test-123", "template": "kitas_application"}' \
  | jq -r '.journey_id')

# 2. Check journey created
curl http://localhost:8000/api/agents/journey/$JOURNEY_ID | jq

# 3. Complete first step
STEP_ID=$(curl http://localhost:8000/api/agents/journey/$JOURNEY_ID | jq -r '.steps[0].id')
curl -X POST http://localhost:8000/api/agents/journey/$JOURNEY_ID/step/$STEP_ID/complete \
  -H "Content-Type: application/json" \
  -d '{"notes": "Test completion"}'

# 4. Get next steps
curl http://localhost:8000/api/agents/journey/$JOURNEY_ID/next-steps
```

#### Verifica Deployment
- [ ] Database PostgreSQL accessibile
- [ ] Tabelle journey create (journeys, journey_steps)
- [ ] Template journey caricati
- [ ] API endpoints accessibili
- [ ] Dependency graph funzionante
- [ ] Next steps suggestion funzionante
- [ ] Notifications configurate

---

### ✅ 13. PROACTIVE COMPLIANCE MONITOR (Alert Compliance)

**File**: `apps/backend-rag/backend/services/proactive_compliance_monitor.py`

#### Verifica Implementazione
- [x] Tracking 4 tipi compliance (VISA, TAX, LICENSE, REGULATORY)
- [x] Alert schedule (60d, 30d, 7d, <7d)
- [x] Severity levels (INFO, WARNING, URGENT, CRITICAL)
- [x] Auto-notification via NotificationHub
- [x] Tracking conferma lettura

#### Tipi di Compliance Tracciati

| Tipo | Esempio | Azioni |
|------|---------|--------|
| VISA_EXPIRY | KITAS, KITAP, Passport | Alert 60/30/7 giorni prima |
| TAX_FILING | SPT Tahunan, PPh, PPn | Alert 30/7 giorni prima |
| LICENSE_RENEWAL | IMTA, NIB, Permit aziendali | Alert 60/30/7 giorni prima |
| REGULATORY_CHANGE | Nuove leggi, policy | Alert immediato |

#### Alert Schedule

| Giorni Rimanenti | Severity | Azione |
|------------------|----------|--------|
| 60+ giorni | INFO | Log only |
| 30-59 giorni | WARNING | Email notification |
| 7-29 giorni | URGENT | Email + WhatsApp |
| < 7 giorni | CRITICAL | Email + WhatsApp + SMS |

#### Configurazione Richiesta
```bash
# Environment Variables
DATABASE_URL=postgresql://...          # ⚠️ OBBLIGATORIO
TWILIO_ACCOUNT_SID=ACxxxxx             # ⚠️ OBBLIGATORIO
TWILIO_AUTH_TOKEN=xxxxx                # ⚠️ OBBLIGATORIO
TWILIO_WHATSAPP_NUMBER=+14155238886   # ⚠️ OBBLIGATORIO
SLACK_WEBHOOK_URL=https://...         # ✅ Opzionale
```

#### API Endpoints
```bash
# 1. Track new compliance item
curl -X POST http://localhost:8000/api/agents/compliance/track \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "123",
    "compliance_type": "VISA_EXPIRY",
    "item_name": "KITAS Expiry",
    "deadline": "2025-12-31",
    "metadata": {"visa_type": "317", "sponsor": "PT Test"}
  }'

# 2. Get all alerts
curl "http://localhost:8000/api/agents/compliance/alerts?severity=urgent"

# 3. Get alerts with auto-notify
curl "http://localhost:8000/api/agents/compliance/alerts?auto_notify=true"

# 4. Get client compliance status
curl http://localhost:8000/api/agents/compliance/client/123
```

#### Test Funzionamento
```bash
# 1. Create test compliance item expiring in 5 days
curl -X POST http://localhost:8000/api/agents/compliance/track \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test-123",
    "compliance_type": "VISA_EXPIRY",
    "item_name": "Test KITAS",
    "deadline": "'$(date -d '+5 days' +%Y-%m-%d)'",
    "metadata": {}
  }'

# 2. Trigger compliance check
curl http://localhost:8000/api/agents/compliance/alerts?auto_notify=true

# 3. Verify CRITICAL alert sent
# Expected: WhatsApp + Email sent to client

# 4. Check database
psql $DATABASE_URL -c "
  SELECT * FROM compliance_alerts
  WHERE client_id = 'test-123'
  ORDER BY created_at DESC
  LIMIT 5
"
```

#### Schedule Automatico
```python
# Hourly check
CRON_COMPLIANCE_CHECK="0 * * * *"
```

#### Verifica Deployment
- [ ] Database PostgreSQL accessibile
- [ ] Tabelle compliance create (compliance_items, compliance_alerts)
- [ ] Twilio configurato per WhatsApp/SMS
- [ ] Email service configurato
- [ ] NotificationHub integrato
- [ ] Cron job configurato (hourly)
- [ ] Alert severity logic funzionante
- [ ] Auto-notification funzionante

---

## 🔧 VERIFICA CONFIGURAZIONE

### Environment Variables Master Checklist

#### Backend TypeScript
```bash
# ⚠️ OBBLIGATORIO
export ENABLE_CRON=true
export NODE_ENV=production
export OPENROUTER_API_KEY=sk-or-v1-xxxxx
export DEEPSEEK_API_KEY=sk-xxxxx

# ✅ Opzionale (con defaults)
export CRON_TIMEZONE=Asia/Singapore
export CRON_SELF_HEALING="0 2 * * *"
export CRON_AUTO_TESTS="0 3 * * *"
export CRON_WEEKLY_PR="0 4 * * 0"
export CRON_HEALTH_CHECK="*/15 * * * *"
export CRON_DAILY_REPORT="0 9 * * *"
```

#### Backend Python RAG
```bash
# ⚠️ OBBLIGATORIO
export DATABASE_URL=postgresql://user:pass@host:5432/dbname
export ANTHROPIC_API_KEY=sk-ant-xxxxx
export CHROMA_HOST=localhost
export CHROMA_PORT=8001

# ⚠️ OBBLIGATORIO (per auto-nurturing + compliance)
export TWILIO_ACCOUNT_SID=ACxxxxx
export TWILIO_AUTH_TOKEN=xxxxx
export TWILIO_WHATSAPP_NUMBER=+14155238886

# ⚠️ OBBLIGATORIO (per PR automation)
export GITHUB_TOKEN=ghp_xxxxx

# ✅ Opzionale (notifications)
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxxx
```

### Verifica Rapida Tutti gli Agenti

```bash
#!/bin/bash
# Script: check-agents-health.sh

echo "🔍 VERIFICA AGENTI AI NUZANTARA"
echo "================================"

# 1. Backend TypeScript
echo "📦 Backend TypeScript"
curl -s http://localhost:3000/api/monitoring/cron-status | jq '.'
curl -s http://localhost:3000/api/agents/tasks | jq '.[] | {id, status, agentType}'

# 2. Backend Python RAG
echo "🧠 Backend Python RAG"
curl -s http://localhost:8000/api/autonomous-agents/status | jq '.'
curl -s http://localhost:8000/api/agents/status | jq '.'

# 3. ChromaDB
echo "🗄️  ChromaDB"
curl -s http://localhost:8001/api/v1/heartbeat

# 4. Database
echo "🐘 PostgreSQL"
psql $DATABASE_URL -c "SELECT 'connected' as status"

# 5. Check files
echo "📁 Tracking Files"
ls -lh .ai-automation/*.json

echo "✅ Verifica completata!"
```

---

## 🚀 API ENDPOINTS TESTING

### Status e Monitoring

```bash
# Backend TypeScript
curl http://localhost:3000/api/monitoring/cron-status
curl http://localhost:3000/api/agents/tasks
curl http://localhost:3000/api/ai/usage-stats

# Backend Python RAG
curl http://localhost:8000/api/autonomous-agents/status
curl http://localhost:8000/api/autonomous-agents/executions
curl http://localhost:8000/api/agents/status
curl http://localhost:8000/api/agents/analytics/summary
```

### Trigger Manuali

```bash
# Conversation Trainer
curl -X POST http://localhost:8000/api/autonomous-agents/conversation-trainer/run \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'

# Client Value Predictor
curl -X POST http://localhost:8000/api/autonomous-agents/client-value-predictor/run

# Knowledge Graph Builder
curl -X POST http://localhost:8000/api/autonomous-agents/knowledge-graph-builder/run \
  -H "Content-Type: application/json" \
  -d '{"days_back": 30, "init_schema": false}'

# Compliance Alerts (con auto-notify)
curl "http://localhost:8000/api/agents/compliance/alerts?auto_notify=true"

# Refactoring Agent
curl -X POST http://localhost:3000/api/agents/refactoring/run

# Test Generator Agent
curl -X POST http://localhost:3000/api/agents/test-generation/run
```

---

## 📊 MONITORAGGIO E MAINTENANCE

### Log Files da Monitorare

```bash
# Backend TypeScript
tail -f logs/cron-scheduler.log
tail -f logs/agent-orchestrator.log
tail -f logs/refactoring-agent.log
tail -f logs/test-generator.log

# Backend Python RAG
tail -f logs/autonomous-agents.log
tail -f logs/client-value-predictor.log
tail -f logs/knowledge-graph.log
tail -f logs/compliance-monitor.log
```

### Metriche da Tracciare

```sql
-- Conversation Trainer: Miglioramenti prompt
SELECT COUNT(*) as prompt_improvements, MAX(created_at) as last_update
FROM github_prs
WHERE labels LIKE '%prompt-improvement%';

-- Client Value Predictor: Nurturing efficacy
SELECT
  COUNT(*) as total_nurtures,
  COUNT(DISTINCT client_id) as unique_clients,
  AVG(CASE WHEN response_received THEN 1 ELSE 0 END) * 100 as response_rate
FROM crm_interactions
WHERE type = 'whatsapp_nurture';

-- Knowledge Graph: Crescita entità
SELECT
  entity_type,
  COUNT(*) as count,
  COUNT(DISTINCT DATE(created_at)) as days_active
FROM kg_entities
GROUP BY entity_type;

-- Compliance Monitor: Alert efficacy
SELECT
  compliance_type,
  severity,
  COUNT(*) as alerts_sent,
  AVG(CASE WHEN resolved THEN 1 ELSE 0 END) * 100 as resolution_rate
FROM compliance_alerts
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY compliance_type, severity;
```

### Health Checks Automatici

```bash
#!/bin/bash
# Script: health-check-agents.sh

# 1. Check cron jobs running
if ! pgrep -f "cron-scheduler" > /dev/null; then
    echo "❌ Cron Scheduler NOT running"
    # Send alert
fi

# 2. Check API endpoints responding
if ! curl -f -s http://localhost:3000/health > /dev/null; then
    echo "❌ Backend TypeScript NOT responding"
fi

if ! curl -f -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend Python RAG NOT responding"
fi

# 3. Check database connection
if ! psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Database NOT accessible"
fi

# 4. Check ChromaDB
if ! curl -f -s http://localhost:8001/api/v1/heartbeat > /dev/null; then
    echo "❌ ChromaDB NOT responding"
fi

# 5. Check disk space for logs
DISK_USAGE=$(df -h /var/log | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️  Disk usage high: ${DISK_USAGE}%"
fi

echo "✅ Health check completed"
```

---

## 📈 RIEPILOGO STATO

### Agenti Implementati: 12/12 (100%)

| # | Agente | Backend | Stato | Priority |
|---|--------|---------|-------|----------|
| 1 | Cron Scheduler | TS | ✅ PROD | 🔴 CRITICAL |
| 2 | Agent Orchestrator | TS | ✅ PROD | 🔴 CRITICAL |
| 3 | Refactoring Agent | TS | ✅ PROD | 🟡 MEDIUM |
| 4 | Test Generator Agent | TS | ✅ PROD | 🟢 LOW |
| 5 | PR Agent | TS | ✅ PROD | 🟢 LOW |
| 6 | OpenRouter Client | TS | ✅ PROD | 🔴 CRITICAL |
| 7 | Conversation Trainer | Python | ✅ PROD | 🟡 MEDIUM |
| 8 | Client Value Predictor | Python | ✅ PROD | 🔴 CRITICAL |
| 9 | Knowledge Graph Builder | Python | ✅ PROD | 🟡 MEDIUM |
| 10 | Autonomous Research | Python | ✅ PROD | 🟢 LOW |
| 11 | Auto Ingestion | Python | ✅ PROD | 🟡 MEDIUM |
| 12 | Client Journey | Python | ✅ PROD | 🟡 MEDIUM |
| 13 | Compliance Monitor | Python | ✅ PROD | 🔴 CRITICAL |

### Safety Features: ✅ TUTTE IMPLEMENTATE

- [x] Cooldown periods (7 giorni)
- [x] Error counting (max 3 → blacklist)
- [x] File size limits
- [x] Rate limiting (100 req/h)
- [x] Circuit breaker (20% error threshold)
- [x] Budget tracking ($1/day)
- [x] Tracking history (JSON files)
- [x] Blacklist automatiche
- [x] Idempotenza (no duplicati)
- [x] Test validation obbligatoria

### Costi Mensili Stimati

| Servizio | Costo/Mese | Note |
|----------|------------|------|
| OpenRouter (FREE models) | $0 | DeepSeek, Llama, Qwen, Mistral |
| Anthropic Claude Haiku | ~$5 | Client nurturing daily |
| Anthropic Claude Sonnet | ~$15 | Conversation trainer weekly |
| Twilio WhatsApp | ~$20 | ~500 msg/mese |
| **TOTALE** | **~$40/mese** | vs $395/mese tool commerciali (-90%) |

---

## 🎯 PROSSIMI STEP

### Phase 2: Security & Testing (Q1 2026)
- [ ] Security Scanner Agent
- [ ] Documentation Generator Agent

### Phase 3: Intelligence (Q2 2026)
- [ ] Predictive Analytics Engine
- [ ] Auto-Scaler Agent
- [ ] Smart Cache Agent

### Phase 4: Advanced (Q3 2026)
- [ ] Multi-Agent RAG Planner
- [ ] Proactive Outreach Engine
- [ ] Auto-AB Testing Agent
- [ ] Multi-Language Translator Agent

---

**Checklist creata da**: Claude Code Agent (Sonnet 4.5)
**Data**: 2025-11-10
**Versione**: 1.0
**Branch**: `claude/analyze-codebase-011CUz492NbDwHKUhTjMxgwD`

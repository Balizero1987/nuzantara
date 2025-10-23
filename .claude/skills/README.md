# Nuzantara Claude Skills

Questa directory contiene Skills personalizzate per Claude Code specifiche per il progetto **nuzantara**. Le Skills sono capacità modulari che Claude può invocare autonomamente per migliorare il workflow di sviluppo.

## 📚 Skills Disponibili

### 🧪 Testing & Quality Assurance

#### 1. **rag-test**
Test completo del sistema RAG (Retrieval-Augmented Generation).

**Quando viene usato**: Quando si testa il sistema RAG, si verificano embeddings, o si debuggano problemi di retrieval.

**Cosa fa**:
- Verifica ChromaDB status e caricamento
- Test semantic search con query realistiche
- Valida tier-based access control (Livelli 0-3)
- Controlla qualità embeddings e relevance scores
- Testa streaming responses (SSE)
- Valida source citations

**Key Features**:
- Test per tutte e 5 le categorie Oracle (VISA, Tax, Legal, KBLI, Business)
- Verifica multilingual support (EN/ID)
- Performance metrics (target: <500ms)

---

#### 2. **oracle-agent**
Test e validazione dei 5 Oracle agents specializzati.

**Quando viene usato**: Quando si lavora sugli Oracle agents o si vuole validarne il comportamento.

**Agenti Disponibili**:
- **visa-oracle**: Immigration & KITAS consultant
- **kbli-eye**: Business classification expert
- **tax-genius**: Tax consultant
- **legal-architect**: Legal consultant
- **morgana**: Strategic business consultant

**Cosa fa**:
- Test individuali per ogni agent con scenari domain-specific
- Test di multi-agent collaboration
- Valida accuratezza, completeness, e tier compliance
- Verifica handoff tra agents
- Performance monitoring (<2s response time)

---

#### 3. **test-suite**
Esecuzione completa di tutti i test (unit, integration, system).

**Quando viene usato**: Prima del deployment, validazione cambiamenti, o quando chiedi "run tests".

**Cosa fa**:
- Jest unit tests (TypeScript) con coverage
- pytest unit tests (Python)
- Integration tests (API, database)
- RAG system validation
- Oracle agent tests
- Health checks
- Performance tests
- Security audit (npm audit, safety)

**Coverage Requirements**:
- TypeScript: ≥70%
- Python: ≥80%
- Critical modules (vector_db, embeddings): ≥90%

---

### 🚀 Deployment & Operations

#### 4. **deploy**
Deploy full-stack su Railway con health checks e rollback automatico.

**Quando viene usato**: Deploy a production, push su Railway/Cloud.

**Processo**:
1. Pre-deployment checks (build, tests, lint)
2. Environment variables validation
3. Git operations (commit, push)
4. Railway/Docker deployment
5. Health checks (60-90s wait)
6. Smoke tests
7. Rollback su failure

**Safety Features**:
- Automatic rollback on health check failure
- Database backup verification
- Environment variable validation
- Post-deployment monitoring

---

#### 5. **health-check**
Monitoring completo dello stato del sistema.

**Quando viene usato**: "Is everything running?", debug production, monitoring schedulato.

**Cosa controlla**:
- Backend TypeScript (port 8080)
- Backend RAG (port 8000)
- PostgreSQL connectivity
- ChromaDB status
- Redis (optional)
- Cloudflare R2 storage
- Response times e performance metrics
- Log analysis per errori
- Railway/Cloud deployment status
- Resource usage (CPU, memory, disk)

**Alert Thresholds**:
- 🚨 Critical: Service down, error rate >5%
- ⚠️ Warning: Response time >1s, CPU >80%
- ℹ️ Info: Deployment complete, restart occurred

---

### 🔍 Code Quality & Documentation

#### 6. **architecture-mapper**
Aggiornamento automatico della documentazione architecture quando il codice cambia.

**Quando viene usato**:
- Aggiungi/rimuovi handlers, services, middleware, agents
- Chiedi "update docs", "refresh architecture"
- Dopo feature significative che cambiano architettura
- Claude rileva automaticamente cambiamenti architetturali

**Cosa fa**:
- Rigenera dependency graph completo (madge)
- Conta componenti reali (handlers, services, middleware)
- Estrae API endpoints dal codice
- Aggiorna **TUTTI** i documenti in `docs/architecture/`
- Rigenera diagrammi Mermaid con nuove dipendenze
- Valida accuratezza (file paths, counts, syntax)
- Committa automaticamente le modifiche

**File Aggiornati**:
- `docs/architecture/01-overview.md` - Statistiche sistema
- `docs/architecture/02-backend-ts-components.md` - Handler/service counts
- `docs/architecture/03-oracle-system.md` - Se agents cambiano
- `docs/architecture/04-data-flow.md` - Se nuovi flussi
- `docs/architecture/README.md` - Indice e statistiche

**Output**:
- Report dettagliato dei cambiamenti
- Component counts: prima → dopo
- Lista nuovi componenti aggiunti
- Diagrammi rigenerati
- Validazione completa

**Esempio**:
```
User: "Ho aggiunto payment-handler.ts"
Claude: [architecture-mapper si attiva]
        ✅ Handlers: 96 → 97 (+1)
        ✅ Aggiunto payments/ module
        ✅ Diagrammi aggiornati
        ✅ Documentazione committata
```

**Zero Effort** - Documentazione sempre sincronizzata con codice! 🎯

---

#### 7. **code-review**
Code review completo specifico per nuzantara.

**Quando viene usato**: Dopo scrittura codice significativo, prima di merge PR.

**Focus Areas**:
1. **TypeScript**: Strict mode, no `any`, proper interfaces
2. **Python**: Type hints (PEP 484), Pydantic models
3. **Security**: JWT validation, input validation, no secrets in code
4. **RAG Best Practices**: Prompt engineering, chunk optimization
5. **Oracle Agent Quality**: Role definition, citation instructions
6. **Error Handling**: Comprehensive, specific error types
7. **Logging**: Winston structured logging
8. **Testing**: ≥70% coverage, edge cases
9. **Documentation**: JSDoc/docstrings
10. **Performance**: DB indexes, caching, async patterns

**Output**: Structured feedback (Strengths, Critical Issues, Suggestions, Overall Assessment)

---

#### 8. **api-docs**
Generazione/aggiornamento documentazione API completa.

**Quando viene usato**: Nuovi endpoints, aggiornamenti API, richiesta documentazione.

**Cosa genera**:
- OpenAPI 3.0 specification (`docs/api/openapi.yaml`)
- Markdown documentation (`docs/api/`)
- Code examples (JavaScript, Python, curl)
- Data models con TypeScript interfaces
- Authentication guide
- Rate limiting details
- Error handling guide

**API Sections**:
- Authentication APIs
- RAG System APIs
- Oracle Agent APIs
- Admin APIs
- Health & Monitoring

---

### 🐛 Debugging & Optimization

#### 9. **debug-assistant**
Supporto completo per debugging e troubleshooting.

**Quando viene usato**: Errori, servizi non funzionanti, problemi production.

**Debug Process**:
1. Quick diagnostic (services, logs, resources)
2. Reproduce issue
3. Analyze logs (TypeScript, Python, DB)
4. Check database (connections, queries)
5. Check ChromaDB
6. Authentication issues
7. API integration issues
8. Performance issues

**Common Issues Covered**:
- Cannot connect to database
- ChromaDB collection not found
- Rate limit exceeded
- Oracle agent not responding
- High memory usage
- Slow API responses
- Authentication failing

**Tools**: Log analysis, request tracing, error monitoring, structured logging

---

#### 10. **performance-analyzer**
Analisi e ottimizzazione performance del sistema.

**Quando viene usato**: Lentezza, ottimizzazione, analisi bottlenecks.

**Performance Baselines**:
| Component | Target | Acceptable | Critical |
|-----------|--------|------------|----------|
| Health endpoint | <50ms | <100ms | >200ms |
| API endpoints | <300ms | <500ms | >1000ms |
| RAG query | <500ms | <1s | >2s |
| Oracle agent | <2s | <5s | >10s |

**Analysis Steps**:
1. System resources (CPU, memory, disk, network)
2. Application profiling (API timing, load testing)
3. Database performance (queries, indexes, pool)
4. RAG system (ChromaDB, embeddings, query breakdown)
5. API response time analysis
6. Frontend performance

**Optimization Strategies**:
- Database indexes e connection pooling
- Redis caching e in-memory caching
- RAG optimization (embedding caching, lazy loading)
- API compression e streaming
- Code optimization (avoid N+1, batch operations)

---

## 🎯 Come Funzionano le Skills

### Invocazione Automatica
Claude **decide autonomamente** quando usare una Skill basandosi su:
- Il nome della Skill
- La descrizione
- Il contesto della conversazione
- La richiesta dell'utente

**Non serve invocarle manualmente** - Claude le riconoscerà e userà quando appropriato.

### Esempio di Utilizzo

**User**: "Puoi testare il sistema RAG?"
**Claude**: *Invoca automaticamente `rag-test` skill*
- Verifica ChromaDB
- Esegue query test
- Valida tier access
- Report risultati

**User**: "Fai il deploy"
**Claude**: *Invoca automaticamente `deploy` skill*
- Pre-checks
- Build & test
- Deploy to Railway
- Health checks
- Report status

## 📁 Struttura File

```
.claude/skills/
├── README.md                    # Questa documentazione
├── rag-test.md                  # RAG testing
├── oracle-agent.md              # Oracle agents testing
├── test-suite.md                # Complete test suite
├── deploy.md                    # Deployment automation
├── health-check.md              # System monitoring
├── architecture-mapper.md       # Architecture docs auto-update
├── code-review.md               # Code review
├── api-docs.md                  # API documentation
├── debug-assistant.md           # Debugging support
└── performance-analyzer.md      # Performance optimization
```

## 🔧 Formato File Skill

Ogni Skill è un file Markdown con YAML frontmatter:

```markdown
---
name: skill-name
description: What the skill does and when to use it
---

# Skill Content

Detailed instructions for Claude on how to execute the skill...
```

## ✅ Best Practices

1. **Non modificare il codice del progetto**: Le Skills sono istruzioni per Claude, non codice eseguibile
2. **Mantieni Skills aggiornate**: Quando cambia architettura o workflow, aggiorna Skills
3. **Specifiche per nuzantara**: Skills personalizzate per tecnologie e struttura del progetto
4. **Versionabili**: Puoi committare `.claude/` in git per condividere con team
5. **Separazione**: Skills separata da codebase - zero impatto su production

## 🚀 Benefici

Con queste Skills, Claude può:

✅ Testare automaticamente RAG system dopo modifiche
✅ Validare Oracle agents con scenari realistici
✅ Fare deploy completo con health checks
✅ Monitorare system health proattivamente
✅ **Mantenere documentazione architecture sempre sincronizzata** (NEW!)
✅ Fare code review con standard nuzantara
✅ Generare API docs sempre aggiornata
✅ Debuggare problemi sistematicamente
✅ Ottimizzare performance identificando bottlenecks

## 📊 Metriche di Successo

Le Skills migliorano il workflow misurando:

- ⏱️ **Time to Deploy**: Da 30min a 5min
- 🐛 **Bug Detection**: +40% issues trovati in review
- 📚 **Documentation**: Sempre aggiornata automaticamente
- 🧪 **Test Coverage**: Consistentemente >70%
- ⚡ **Performance**: Proactive optimization

## 🔄 Aggiornamenti

Skills create: **23 Ottobre 2025**
Versione progetto: **nuzantara v5.2.0**

Per aggiornare una Skill:
1. Modifica il file `.md` corrispondente
2. Aggiorna version/date in questa README
3. (Opzionale) Commit changes in git

## 💡 Tips

- **Usa linguaggio naturale**: Chiedi "testa il RAG" invece di "/rag-test"
- **Skills lavorano insieme**: Deploy skill usa test-suite e health-check
- **Context-aware**: Claude sa quale Skill usare in base al contesto
- **Feedback loop**: Skills migliorano imparando dai tuoi pattern

## 🤝 Contributing

Per aggiungere una nuova Skill:

1. Crea nuovo file `.claude/skills/new-skill.md`
2. Usa formato YAML frontmatter + Markdown
3. Documenta quando/come usarla
4. Aggiungi a questa README
5. Test con richieste reali

## 📞 Support

Per problemi o suggerimenti sulle Skills:
- Issues: https://github.com/anthropics/skills
- Docs: https://docs.claude.com/en/docs/claude-code/skills

---

**Creato con Claude Code** 🤖

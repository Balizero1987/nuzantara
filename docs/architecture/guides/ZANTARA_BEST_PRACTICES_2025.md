# 🚀 ZANTARA BRIDGE - Best Practices 2025
*Prontuario operativo per Analytics + AI/ML - Ready-to-deploy*

---

## 0️⃣ Struttura Repository (Monorepo Core + Satelliti)

Monorepo per piattaforma e contratti; micro-repo per componenti "hard" con release indipendenti (es. vector store connectors, analytics ingestion).

```
zantara-bridge/
├─ .devcontainer/           # Dev env riproducibile
├─ .github/workflows/       # CI/CD (GPU + cache artefatti)
├─ src/
│  ├─ analytics/
│  │  ├─ clickhouse/
│  │  ├─ druid/
│  │  └─ dashboards/        # Grafana provisioning-as-code
│  ├─ vector_store/
│  │  ├─ embeddings/
│  │  ├─ indexing/          # HNSW/IVF param tuning
│  │  └─ connectors/        # Pinecone/Weaviate/Qdrant
│  ├─ langchain/
│  │  ├─ chains/
│  │  ├─ agents/            # Orchestrazione con LangGraph
│  │  └─ security/          # Guard-rails & eval
│  └─ pipelines/
│     ├─ etl/
│     └─ ml/
├─ infrastructure/
│  ├─ terraform/
│  └─ kubernetes/
├─ tests/{unit,integration,e2e}
└─ docs/{architecture,api}
```

---

## 1️⃣ Analytics: ClickHouse & Grafana "as-code"

### ✅ Quando ClickHouse
- OLAP massivo, ingest veloce, query vettorializzate
- MergeTree/ReplicatedMergeTree per disponibilità e throughput (con Keeper per coordinazione/DDL distribuita)
- S3 + cache locale per tiering "caldo/freddo" (separate storage/compute e cache LRU sul disco locale)

### ✅ Grafana: tutto in Git
- Provisioning YAML sotto `provisioning/dashboards` + Git Sync
- Pipeline CI per pubblicare automaticamente dashboard versionate

### ✅ SLO & Allerta Sane (niente sirene inutili)
- Base su OpenTelemetry (tracce, metriche, log)
- Alert multi-burn-rate (finestra corta "fast burn" + lunga "slow burn") come da SRE workbook
- Heuristics: RED per microservizi (Requests, Errors, Duration), USE per risorse (Utilization, Saturation, Errors)

### ✅ Segment/Mixpanel/Amplitude
- Mantenere Tracking Plan con Segment Protocols
- Mapping corretto `userId → distinct_id` per Mixpanel

---

## 2️⃣ Data Platform (Snowflake/BigQuery) - 3 Regole Rapide

### ✅ Performance & Partizionamento
- Partizionare/clusterizzare tabelle grandi
- Evitare `SELECT *` negli strumenti interattivi
- Guideline standard - non dogmi, servono indici

### ✅ Data Quality & Freshness
- dbt source freshness e soglie SLA (warn/error)
- Great Expectations per convalida schema/valori via Checkpoints in CI

---

## 3️⃣ MLOps & CI/CD: L2 "vero" ma sobrio

### ✅ Pipeline GitHub Actions

```yaml
# .github/workflows/zantara-ml.yml
name: zantara-ml
on:
  push:
    branches: [main]

jobs:
  data-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: great_expectations checkpoint run  # GE Checkpoint

  train:
    needs: data-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: dvc repro train                      # Orchestrazione DVC
      - run: mlflow models register               # Model Registry

  update-vector-index:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: python src/vector_store/indexing/update.py
```

### ✅ Tooling
- DVC per dipendenze/artefatti riproducibili
- MLflow Model Registry per versioning/aliased stages (Staging/Production)
- Runner: se serve GPU, usare hosted GPU di GitHub o self-hosted dedicati

---

## 4️⃣ RAG & Agenti: "solido prima, furbo poi"

### ✅ Orchestrazione & Stato
- LangGraph per agenti e flussi a stati (checkpointing, human-in-the-loop)

### ✅ Retriever che "capiscono" il dato
- **Self-Query Retriever**: traduce domande NL in filtri su metadati del vector store
- **ParentDocumentRetriever**: recupera chunk piccoli ma risponde col "genitore" più grande → contesto stabile
- **Contextual Compression**: filtra/condensa i documenti recuperati prima del prompt finale

### ✅ Cache & Costi
- OpenAI Batch API: −50% costo I/O se il lavoro non è interattivo
- Prompt Caching (automatico): cache dei prefissi >1.024 token con sconto dedicato sui token "cached"
- Ottimo per prompt lunghi e ripetitivi

---

## 5️⃣ Vector DB: isolamento, cancellazione, qualità ricerca

### ✅ Isolamento per tenant/namespace e delete davvero (Diritto all'oblio)
- **Pinecone**: `delete(ids|filter|deleteAll)` per namespace
- **Weaviate**: delete per id/filtri; multi-tenancy → cancellazione del tenant = cancellazione di tutti gli oggetti

### ✅ HNSW/IVF Parameters
- Impostare parametri di recall/latency in base al carico
- Start conservativo; misurare P@k/latency

### ✅ Hybrid Search & Schema
- BM25 + vettori quando le query hanno forte componente keyword
- Named vectors & metadata: progettare lo schema dei metadati per filtrare a monte (ridurre token e latenza)

---

## 6️⃣ Sicurezza & Compliance (LLM + dati)

### ✅ OWASP Top 10 LLM
- #1 resta Prompt Injection
- Apply allow/deny list sugli strumenti e output handling sicuro

### ✅ GDPR & Privacy
- DPIA per casi ad alto rischio (GDPR art. 35) + guida ICO/EDPB
- Right-to-be-forgotten nei vector store: progettare deletion "end-to-end" (indice + sorgente)

### ✅ Secrets & Access
- Vault per segreti dinamici (credenziali DB a TTL, rotazione automatica)
- AWS Secrets Manager con rotazione automatica (fino a ogni 4 ore)

---

## 7️⃣ Costi: FinOps per AI (GPU + token)

### ✅ Misurazione & Tagging
- Misurare per progetto GPU-hours, token e storage
- Definire owner e tag standard
- Linee guida FinOps Foundation per AI (forecasting, anomalie, cost model)

### ✅ Tiering Modelli
- Batch offline via Batch API (−50%)
- Interattivo con modelli più piccoli dove possibile
- Prompt caching per prompt lunghi ripetuti

---

## 8️⃣ DevX: ambienti, linting, pre-commit

### ✅ Dev Container (standard 2025)
- `devcontainer.json` + Dockerfile con Python 3.11+, estensioni SQL/YAML

### ✅ Gestione Pacchetti
- **uv** (Astral) per install/build velocissimi; sostituisce pip/pip-tools nei cicli CI

### ✅ Lint/Format Tools
- **Ruff** (lint + formatter) → rimpiazza combo Flake8+Black in un solo tool
- **SQLFluff** con dialetto ClickHouse per SQL coerente
- **Gitleaks** per secret-scanning
- **Prettier** per YAML/JSON

### ✅ Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
- repo: https://github.com/astral-sh/ruff-pre-commit
  rev: v0.6.9
  hooks:
    - id: ruff
      args: [--fix]
    - id: ruff-format
- repo: https://github.com/sqlfluff/sqlfluff
  rev: 2.3.0
  hooks:
    - id: sqlfluff-lint
    - id: sqlfluff-fix
      args: [--dialect, clickhouse]
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.18.4
  hooks:
    - id: gitleaks
- repo: https://github.com/pre-commit/mirrors-prettier
  rev: v3.3.3
  hooks:
    - id: prettier
      files: "\\.(json|ya?ml)$"
```

---

## 9️⃣ API & Serving

### ✅ Protocol & Patterns
- **gRPC** per serving modelli (IDL protobuf, streaming, efficienza)
- **GraphQL** per dashboard/aggregazioni flessibili
- **Pattern**: versioning semantico per modelli, blue/green, circuit breakers, rate limiting "token bucket"

---

## 🔟 Ready-to-Deploy Checklist

### A. Dev & Qualità
- [ ] `.devcontainer/` con Python 3.11+ e uv
- [ ] pre-commit con Ruff/SQLFluff/Gitleaks/Prettier

### B. Observability
- [ ] `src/analytics/dashboards/` + provisioning Grafana in YAML
- [ ] Workflow "deploy dashboards"
- [ ] Alert multi-burn-rate sugli SLO principali (fast vs slow)

### C. MLOps
- [ ] Workflow CI con GE Checkpoint → DVC → MLflow Registry
- [ ] Job separato per aggiornamento embeddings (idempotente + metriche P@k)

### D. AI Cost-Aware
- [ ] Endpoint batch per job non interattivi (−50%)
- [ ] Prompt caching per prompt ripetuti

### E. Security
- [ ] Policy OWASP-LLM in `src/langchain/security/` con test di prompt-injection
- [ ] Secret management: Vault/Secrets Manager con rotazione automatica (policy 30–90 gg)

---

## 📅 Roadmap 30/60/90

### 🎯 0–30 giorni
- [ ] DevContainer + pre-commit
- [ ] Grafana provisioning
- [ ] GE/dbt freshness sugli stream critici
- [ ] Policy OWASP-LLM "v1"

### 🎯 30–60 giorni
- [ ] LangGraph per orchestrare agenti RAG
- [ ] Self-Query/ParentDocument/Compression
- [ ] Batch API per job offline

### 🎯 60–90 giorni
- [ ] ClickHouse con ReplicatedMergeTree + S3 cache
- [ ] Allerta multi-burn-rate end-to-end
- [ ] Processo DPIA e cancellazione tenant "one-click"

---

## ⚠️ Nota sulle Affermazioni "Troppo Belle"

Alcuni numeri assoluti (tipo "20× più veloce sempre", "hit-rate cache = 68%") dipendono dal vostro carico, schema e prompt.

**Tenete le percentuali per gli OKR, non per le decisioni tecniche.**

Misurate su dataset e traffico vostri con metriche chiare:
- P@k
- Latenza p95
- Costo/1000 richieste

Poi fissate soglie realistiche.

---

*Documento creato: 2025-09-25*
*Versione: 1.0*
*Status: Ready for Implementation*
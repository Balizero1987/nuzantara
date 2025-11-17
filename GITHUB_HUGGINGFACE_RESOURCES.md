# 🔗 RISORSE GITHUB E HUGGING FACE - NUZANTARA

## 📋 Indice Rapido

Questo documento contiene **link diretti** e **codice pronto all'uso** per implementare immediatamente le migliori soluzioni trovate.

---

## 🤖 AI & RAG SYSTEMS

### **LlamaIndex - Advanced RAG Framework**

**Repository:** https://github.com/run-llama/llama_index
**Stars:** 38K+ | **Language:** Python | **License:** MIT

**Quick Start:**
```bash
pip install llama-index llama-index-vector-stores-chroma
```

**Integration Code:**
```python
# backend-rag/app/llama_integration.py
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import chromadb

# Connect to existing ChromaDB
chroma_client = chromadb.HttpClient(host='localhost', port=8000)
chroma_collection = chroma_client.get_collection("legal_docs")

# Create LlamaIndex vector store
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# Use multilingual embedding
embed_model = HuggingFaceEmbedding(
    model_name="Snowflake/arctic-embed-l-v2.0"
)

# Build index
index = VectorStoreIndex.from_vector_store(
    vector_store,
    storage_context=storage_context,
    embed_model=embed_model
)

# Query with advanced retrieval
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="tree_summarize"
)

response = query_engine.query("What visa requirements for Italian citizen?")
print(response)
```

**Advanced Features:**
- Multi-document agents
- Sub-question query engine
- Recursive retrieval
- Hybrid search (vector + keyword)

**Docs:** https://docs.llamaindex.ai/en/stable/

---

### **LangGraph - Agent Orchestration**

**Repository:** https://github.com/langchain-ai/langgraph
**Stars:** 12K+ | **Language:** Python | **License:** MIT

**Installation:**
```bash
pip install langgraph langchain-anthropic
```

**Multi-Agent Supervisor Pattern:**
```python
# backend-rag/app/agents/supervisor.py
from typing import Annotated, Literal, TypedDict
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic

# Define agent state
class AgentState(TypedDict):
    messages: list
    next: str
    user_query: str
    category: Literal["visa", "tax", "legal", "real_estate"]

# Define specialized agents
def visa_agent(state: AgentState):
    """Handles visa-related queries"""
    llm = ChatAnthropic(model="claude-haiku-4.5")
    response = llm.invoke([
        {"role": "system", "content": "You are a visa specialist for Indonesia."},
        {"role": "user", "content": state["user_query"]}
    ])
    return {"messages": state["messages"] + [response]}

def tax_agent(state: AgentState):
    """Handles tax calculations"""
    # Your tax logic here
    pass

def legal_agent(state: AgentState):
    """Handles legal documentation"""
    # Your legal logic here
    pass

# Supervisor decides which agent to use
def supervisor(state: AgentState) -> Literal["visa", "tax", "legal", "end"]:
    """Route to appropriate specialist agent"""
    query = state["user_query"].lower()

    if "visa" in query or "immigration" in query:
        return "visa"
    elif "tax" in query or "pajak" in query:
        return "tax"
    elif "legal" in query or "hukum" in query:
        return "legal"
    else:
        return "end"

# Build workflow graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("supervisor", supervisor)
workflow.add_node("visa_agent", visa_agent)
workflow.add_node("tax_agent", tax_agent)
workflow.add_node("legal_agent", legal_agent)

# Add edges with conditional routing
workflow.set_entry_point("supervisor")
workflow.add_conditional_edges(
    "supervisor",
    lambda x: x["next"],
    {
        "visa": "visa_agent",
        "tax": "tax_agent",
        "legal": "legal_agent",
        "end": END
    }
)

# Compile graph
app = workflow.compile()

# Use it
result = app.invoke({
    "messages": [],
    "user_query": "I need a KITAS visa for Bali",
    "next": "",
    "category": None
})
```

**Example Repositories:**
- Supervisor pattern: https://github.com/langchain-ai/langgraph-supervisor-py
- Multi-agent AWS: https://github.com/aws-samples/langgraph-multi-agent
- Awesome LangGraph: https://github.com/von-development/awesome-LangGraph

---

### **CrewAI - Collaborative Agents**

**Repository:** https://github.com/crewAIInc/crewAI
**Stars:** 25K+ | **Language:** Python | **License:** MIT

**Installation:**
```bash
pip install crewai crewai-tools
```

**NUZANTARA Agent Crew:**
```python
# backend-rag/app/agents/crew_setup.py
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, WebsiteSearchTool

# Initialize tools
search_tool = SerperDevTool()
web_tool = WebsiteSearchTool()

# Define agents
visa_specialist = Agent(
    role='Indonesian Visa & Immigration Expert',
    goal='Provide accurate, up-to-date visa and immigration guidance',
    backstory="""You are an expert in Indonesian immigration law with 10+ years
    of experience helping foreigners navigate visa requirements, KITAS, KITAP,
    and work permits.""",
    tools=[search_tool, web_tool],
    verbose=True
)

tax_consultant = Agent(
    role='Indonesian Tax Consultant',
    goal='Calculate taxes and provide tax compliance advice',
    backstory="""You specialize in Indonesian tax law (PPh 21, PPh 23, PPN)
    and help businesses and individuals with tax planning and compliance.""",
    tools=[search_tool],
    verbose=True
)

legal_advisor = Agent(
    role='Business Legal Advisor',
    goal='Assist with company formation, contracts, and legal compliance',
    backstory="""Expert in Indonesian business law, PT/CV formation,
    KBLI codes, NIB, and legal documentation.""",
    tools=[search_tool, web_tool],
    verbose=True
)

real_estate_agent = Agent(
    role='Bali Real Estate Specialist',
    goal='Provide real estate investment and property advice',
    backstory="""Specialist in Bali property market, leasehold vs freehold,
    foreign ownership rules, and investment opportunities.""",
    tools=[search_tool, web_tool],
    verbose=True
)

# Define tasks
visa_task = Task(
    description="""Analyze the user's visa needs based on:
    - Nationality
    - Purpose of visit (business, tourism, retirement)
    - Duration of stay
    - Current visa status

    Provide clear recommendations with step-by-step guidance.""",
    expected_output="Detailed visa recommendation with requirements and timeline",
    agent=visa_specialist
)

tax_task = Task(
    description="""Calculate applicable taxes and provide advice on:
    - Income tax obligations
    - VAT/PPN requirements
    - Tax residency status
    - Deductions and exemptions""",
    expected_output="Tax calculation with compliance recommendations",
    agent=tax_consultant
)

# Create crew
nuzantara_crew = Crew(
    agents=[visa_specialist, tax_consultant, legal_advisor, real_estate_agent],
    tasks=[visa_task, tax_task],
    process=Process.sequential,  # or Process.hierarchical for supervisor
    verbose=True
)

# Run crew
def handle_user_query(query: str, category: str = None):
    """Route query to appropriate agent crew"""
    result = nuzantara_crew.kickoff(inputs={'query': query})
    return result

# Example usage
response = handle_user_query(
    query="I'm Italian and want to open a restaurant in Bali. What visa and permits do I need?"
)
```

**CrewAI Features:**
- Role-based agents
- Hierarchical or sequential processes
- Memory between tasks
- Built-in tools ecosystem

**Docs:** https://docs.crewai.com/

---

## 🌍 MULTILINGUAL EMBEDDINGS

### **Qwen3-Embedding-8B** (Best Overall)

**HuggingFace:** https://huggingface.co/Qwen/Qwen3-embedding-8b
**Rank:** #1 MTEB Multilingual | **Context:** 32K tokens | **License:** Apache 2.0

```python
from sentence_transformers import SentenceTransformer

# Load model
model = SentenceTransformer('Qwen/Qwen3-embedding-8b', trust_remote_code=True)

# Encode documents (supports 32K tokens!)
docs = [
    "Visa requirements for Indonesia",
    "Persyaratan visa untuk Indonesia",  # Bahasa Indonesia
    "Requisiti per il visto indonesiano"  # Italian
]

embeddings = model.encode(docs)

# Use in ChromaDB
import chromadb
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.create_collection(
    name="multilingual_docs",
    metadata={"embedding_function": "qwen3-8b"}
)

collection.add(
    documents=docs,
    embeddings=embeddings.tolist(),
    ids=["doc1", "doc2", "doc3"]
)
```

---

### **Snowflake Arctic-Embed** (74 Languages)

**HuggingFace:** https://huggingface.co/Snowflake/arctic-embed-l-v2.0
**Languages:** 74 | **Dimensions:** 1024 | **License:** Apache 2.0

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('Snowflake/arctic-embed-l-v2.0')

# Optimized for retrieval
query = "What is the KBLI code for restaurant business?"
docs = [
    "KBLI 56101: Restoran (Restaurant)",
    "KBLI 56102: Warung Makan (Food Stall)",
    "KBLI 56103: Katering (Catering)"
]

# Encode query vs documents separately (better performance)
query_emb = model.encode([query])
doc_embs = model.encode(docs)

# Calculate similarity
from sklearn.metrics.pairwise import cosine_similarity
scores = cosine_similarity(query_emb, doc_embs)[0]

# Results
for doc, score in zip(docs, scores):
    print(f"{score:.4f}: {doc}")
```

---

### **Indonesian-Specific Embeddings**

**Collection:** https://huggingface.co/collections/LazarusNLP/indonesian-sentence-embedding-6541fce662e82d932ff360c5

**Best Models:**

1. **all-indo-e5-small-v4** (Recommended for production)
   - HuggingFace: `LazarusNLP/all-indo-e5-small-v4`
   - Fine-tuned on Indonesian datasets
   - Fast inference, small size

2. **NusaBERT-large**
   - HuggingFace: `LazarusNLP/NusaBERT-large`
   - Cultural context for Indonesian/Malay
   - Better for local terms

```python
# Use Indonesian-specific model
indo_model = SentenceTransformer('LazarusNLP/all-indo-e5-small-v4')

# Indonesian business terms
docs_id = [
    "Surat Izin Usaha Perdagangan (SIUP)",
    "Nomor Induk Berusaha (NIB)",
    "Tanda Daftar Perusahaan (TDP)"
]

embeddings_id = indo_model.encode(docs_id)
```

**Other Indonesian NLP:**
- GPT2 Indonesian: https://huggingface.co/indonesian-nlp/gpt2
- BERT Indonesian: https://huggingface.co/cahya/bert-base-indonesian-522M

---

## 🧪 TESTING & QA

### **Playwright - E2E Testing**

**Repository:** https://github.com/microsoft/playwright
**Stars:** 74K+ | **Language:** TypeScript/Python | **License:** Apache 2.0

**Installation:**
```bash
cd webapp
npm init playwright@latest
```

**Complete Test Suite for NUZANTARA:**

```typescript
// webapp/tests/e2e/zantara-chat.spec.ts
import { test, expect } from '@playwright/test';

// Test configuration
test.describe('ZANTARA Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('https://zantara.balizero.com');
    await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*chat/);
  });

  test('sends message and receives AI response', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await chatInput.fill('What visa do I need for Bali?');
    await sendButton.click();

    // Wait for AI response
    const response = page.locator('[data-testid="ai-message"]').last();
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/visa|KITAS|B211/i);
  });

  test('RAG displays source documents', async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', 'KBLI code for restaurant');
    await page.click('[data-testid="send-button"]');

    // Check RAG context is shown
    const ragContext = page.locator('[data-testid="rag-sources"]');
    await expect(ragContext).toBeVisible();

    const sourceLink = ragContext.locator('a').first();
    await expect(sourceLink).toHaveAttribute('href', /.*kbli.*/);
  });

  test('handles multiple languages', async ({ page }) => {
    // Test Indonesian query
    await page.fill('[data-testid="chat-input"]', 'Berapa biaya visa KITAS?');
    await page.click('[data-testid="send-button"]');

    const response = page.locator('[data-testid="ai-message"]').last();
    await expect(response).toBeVisible();
    // Should respond in Indonesian
    await expect(response).toContainText(/IDR|Rp|rupiah/i);
  });

  test('conversation history persists', async ({ page }) => {
    // Send first message
    await page.fill('[data-testid="chat-input"]', 'Hello ZANTARA');
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="ai-message"]');

    // Send follow-up
    await page.fill('[data-testid="chat-input"]', 'What was my previous question?');
    await page.click('[data-testid="send-button"]');

    const response = page.locator('[data-testid="ai-message"]').last();
    await expect(response).toContainText(/hello|previous|earlier/i);
  });

  test('handles errors gracefully', async ({ page }) => {
    // Disconnect network
    await page.route('**/api/chat', route => route.abort());

    await page.fill('[data-testid="chat-input"]', 'Test error handling');
    await page.click('[data-testid="send-button"]');

    // Should show error message
    const errorMsg = page.locator('[data-testid="error-message"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/error|failed|try again/i);
  });
});

// API tests
test.describe('Backend API', () => {
  test('RAG endpoint returns relevant documents', async ({ request }) => {
    const response = await request.post('https://api.zantara.balizero.com/rag/query', {
      data: {
        query: 'visa requirements',
        collection: 'legal_docs',
        top_k: 5
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.results).toHaveLength(5);
    expect(data.results[0]).toHaveProperty('document');
    expect(data.results[0]).toHaveProperty('score');
  });

  test('chat endpoint streams responses', async ({ request }) => {
    const response = await request.post('https://api.zantara.balizero.com/chat', {
      data: {
        message: 'Hello',
        stream: true
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/event-stream');
  });
});

// Performance tests
test.describe('Performance', () => {
  test('chat response time < 2s (non-cached)', async ({ page }) => {
    await page.goto('https://zantara.balizero.com/chat');

    const start = Date.now();
    await page.fill('[data-testid="chat-input"]', `Random query ${Math.random()}`);
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="ai-message"]');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
  });

  test('cached response < 200ms', async ({ page }) => {
    await page.goto('https://zantara.balizero.com/chat');

    // First query (cache miss)
    await page.fill('[data-testid="chat-input"]', 'What is KBLI?');
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="ai-message"]');

    // Same query again (cache hit)
    await page.fill('[data-testid="chat-input"]', 'What is KBLI?');

    const start = Date.now();
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="ai-message"]');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });
});
```

**GitHub Actions Workflow:**
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: cd webapp && npm ci

      - name: Install Playwright Browsers
        run: cd webapp && npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run Playwright tests
        run: cd webapp && npx playwright test --project=${{ matrix.browser }}
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: webapp/playwright-report/
          retention-days: 30
```

**Full Template:** https://github.com/rishivajre/Playwright-End-to-End-E2E-Test-Automation-Framework

---

## 📊 DATA PIPELINE AUTOMATION

### **Prefect - Modern Workflow Orchestration**

**Repository:** https://github.com/PrefectHQ/prefect
**Stars:** 18K+ | **Language:** Python | **License:** Apache 2.0

**Installation:**
```bash
pip install -U prefect
```

**Complete Pipeline Example:**

```python
# backend-rag/app/pipelines/data_sync.py
from prefect import flow, task
from prefect.tasks import task_input_hash
from datetime import timedelta
import requests
import chromadb
from typing import List, Dict

@task(cache_key_fn=task_input_hash, cache_expiration=timedelta(hours=1))
def fetch_kbli_data() -> List[Dict]:
    """Fetch latest KBLI codes from Indonesian government API"""
    # Example: scrape or API call
    response = requests.get('https://oss.go.id/api/kbli')
    data = response.json()
    return data['items']

@task
def fetch_legal_updates() -> List[Dict]:
    """Scrape latest legal regulations"""
    # Web scraping or API
    updates = []
    # ... scraping logic
    return updates

@task
def process_documents(docs: List[Dict]) -> List[Dict]:
    """Process and enrich documents"""
    processed = []
    for doc in docs:
        # Clean, translate, enrich
        processed.append({
            'id': doc['id'],
            'content': doc['description'],
            'metadata': {
                'source': doc['source'],
                'category': doc['category'],
                'updated_at': doc['updated_at']
            }
        })
    return processed

@task
def embed_documents(docs: List[Dict]) -> List[Dict]:
    """Generate embeddings using Qwen3"""
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer('Qwen/Qwen3-embedding-8b')

    for doc in docs:
        doc['embedding'] = model.encode(doc['content']).tolist()

    return docs

@task
def update_chromadb(docs: List[Dict], collection_name: str):
    """Update ChromaDB with new documents"""
    client = chromadb.HttpClient(host='localhost', port=8000)

    try:
        collection = client.get_collection(collection_name)
    except:
        collection = client.create_collection(collection_name)

    # Upsert documents
    collection.upsert(
        ids=[doc['id'] for doc in docs],
        documents=[doc['content'] for doc in docs],
        metadatas=[doc['metadata'] for doc in docs],
        embeddings=[doc['embedding'] for doc in docs]
    )

    return len(docs)

@task
def send_notification(count: int, status: str):
    """Send Slack/email notification"""
    message = f"Pipeline completed: {count} documents {status}"
    # Send to Slack, email, etc.
    print(message)

@flow(name="KBLI Update Pipeline", log_prints=True)
def kbli_sync_flow():
    """Daily pipeline to sync KBLI data"""
    # Fetch data
    kbli_data = fetch_kbli_data()
    print(f"Fetched {len(kbli_data)} KBLI codes")

    # Process
    processed = process_documents(kbli_data)

    # Embed
    embedded = embed_documents(processed)

    # Update database
    count = update_chromadb(embedded, "kbli_codes")

    # Notify
    send_notification(count, "updated")

@flow(name="Legal Docs Sync", log_prints=True)
def legal_sync_flow():
    """Weekly pipeline to sync legal documents"""
    legal_docs = fetch_legal_updates()
    processed = process_documents(legal_docs)
    embedded = embed_documents(processed)
    count = update_chromadb(embedded, "legal_docs")
    send_notification(count, "updated")

@flow(name="Full Data Sync", log_prints=True)
def full_sync_flow():
    """Run all pipelines"""
    kbli_sync_flow()
    legal_sync_flow()

# Schedule flows
if __name__ == "__main__":
    # Deploy with schedule
    kbli_sync_flow.serve(
        name="kbli-daily-sync",
        cron="0 2 * * *",  # 2 AM daily
        tags=["production", "kbli"]
    )

    legal_sync_flow.serve(
        name="legal-weekly-sync",
        cron="0 3 * * 0",  # 3 AM Sunday
        tags=["production", "legal"]
    )
```

**Run Prefect Server:**
```bash
# Start Prefect server
prefect server start

# Deploy flow
python backend-rag/app/pipelines/data_sync.py
```

**Prefect Dashboard:** http://localhost:4200

**Docs:** https://docs.prefect.io

---

## 📈 MONITORING & OBSERVABILITY

### **Prometheus + Grafana Stack**

**Prometheus:** https://github.com/prometheus/prometheus
**Grafana:** https://github.com/grafana/grafana

**Complete Docker Compose:**

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:12.0
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://grafana.zantara.balizero.com
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - monitoring
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/config.yml:/etc/alertmanager/config.yml
    command:
      - '--config.file=/etc/alertmanager/config.yml'
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

**Prometheus Configuration:**

```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'nuzantara-production'
    environment: 'prod'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

# Load rules
rule_files:
  - "alerts.yml"

scrape_configs:
  # Backend TypeScript service
  - job_name: 'nuzantara-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'

  # RAG FastAPI service
  - job_name: 'nuzantara-rag'
    static_configs:
      - targets: ['rag-service:8000']
    metrics_path: '/metrics'

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Node metrics
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # Blackbox monitoring (uptime)
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://zantara.balizero.com
          - https://api.zantara.balizero.com
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

**Alert Rules:**

```yaml
# monitoring/prometheus/alerts.yml
groups:
  - name: nuzantara_alerts
    interval: 30s
    rules:
      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 2 minutes"

      # High response time
      - alert: HighResponseTime
        expr: http_request_duration_seconds{quantile="0.99"} > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.endpoint }}"
          description: "P99 latency is {{ $value }}s"

      # Low cache hit rate
      - alert: LowCacheHitRate
        expr: |
          (
            rate(redis_keyspace_hits_total[5m]) /
            (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))
          ) < 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Redis cache hit rate below 80%"

      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate: {{ $value | humanizePercentage }}"

      # RAG service slow
      - alert: RAGServiceSlow
        expr: rag_query_duration_seconds{quantile="0.95"} > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "RAG queries are slow"
          description: "P95 RAG query time is {{ $value }}s"

      # Database connection pool exhausted
      - alert: DatabasePoolExhausted
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL connection pool nearly exhausted"

      # Disk space low
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Disk space below 10% on {{ $labels.instance }}"
```

**Grafana Dashboard JSON:**
- Pre-built dashboards: https://grafana.com/grafana/dashboards/
- Node Exporter: Dashboard ID 1860
- PostgreSQL: Dashboard ID 9628
- Redis: Dashboard ID 11835

---

## 🔒 SECURITY AUTOMATION

### **Complete Security Pipeline**

**Repository:** https://github.com/magnologan/gha-devsecops

**GitHub Actions Workflow:**

```yaml
# .github/workflows/security-scan.yml
name: DevSecOps Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  # 1. SAST - Static Analysis
  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript', 'typescript', 'python' ]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-extended,security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{matrix.language}}"

  # 2. Semgrep SAST
  semgrep:
    name: Semgrep Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/typescript
            p/python
            p/owasp-top-ten

  # 3. Dependency Scanning
  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --all-projects

      - name: Upload Snyk results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: snyk.sarif

  # 4. Secret Scanning
  secret-scan:
    name: Secret Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # 5. Container Security
  container-scan:
    name: Container Image Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t nuzantara:${{ github.sha }} .

      - name: Run Trivy scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: nuzantara:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # 6. DAST - Dynamic Testing (staging only)
  dast:
    name: Dynamic Application Security Testing
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4

      - name: OWASP ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: 'https://staging.zantara.balizero.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

  # 7. Infrastructure as Code Security
  iac-scan:
    name: IaC Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          framework: dockerfile,secrets
```

**ZAP Rules File:**

```tsv
# .zap/rules.tsv
10010	IGNORE	(Cookie No HttpOnly Flag)
10011	IGNORE	(Cookie Without Secure Flag)
```

**Dependabot Config:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-team"
    labels:
      - "dependencies"
      - "security"

  # Webapp dependencies
  - package-ecosystem: "npm"
    directory: "/webapp"
    schedule:
      interval: "weekly"

  # RAG service dependencies
  - package-ecosystem: "pip"
    directory: "/backend-rag"
    schedule:
      interval: "weekly"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## 📄 DOCUMENT PROCESSING

### **MinerU - PDF Intelligence**

**Repository:** https://github.com/opendatalab/MinerU
**Stars:** 20K+ | **Language:** Python | **License:** AGPL-3.0

**Installation:**
```bash
pip install magic-pdf[full]
```

**Complete Integration:**

```python
# backend-rag/app/services/document_processor.py
from magic_pdf.pipe.UNIPipe import UNIPipe
from magic_pdf.pipe.OCRPipe import OCRPipe
import chromadb
from sentence_transformers import SentenceTransformer

class DocumentIntelligence:
    def __init__(self):
        self.embedding_model = SentenceTransformer('Qwen/Qwen3-embedding-8b')
        self.chroma_client = chromadb.HttpClient(host='localhost', port=8000)

    def process_pdf(self, pdf_path: str, ocr: bool = False) -> dict:
        """Process PDF with MinerU"""

        if ocr:
            # Use OCR for scanned documents
            pipe = OCRPipe()
        else:
            # Use standard extraction for digital PDFs
            pipe = UNIPipe()

        # Extract content
        result = pipe.pdf_parse(
            pdf_path,
            parse_method='auto',  # Auto-detect layout
            model_json_path=None
        )

        return {
            'markdown': result['content_list'],
            'tables': result.get('table_list', []),
            'images': result.get('image_list', []),
            'formulas': result.get('formula_list', [])
        }

    def process_legal_document(self, pdf_path: str, metadata: dict):
        """Process and store legal document in ChromaDB"""

        # Extract content
        content = self.process_pdf(pdf_path, ocr=False)

        # Get or create collection
        try:
            collection = self.chroma_client.get_collection("legal_docs")
        except:
            collection = self.chroma_client.create_collection("legal_docs")

        # Process each section
        doc_id = metadata.get('doc_id', pdf_path)

        for i, section in enumerate(content['markdown']):
            section_text = section['text']

            # Generate embedding
            embedding = self.embedding_model.encode(section_text)

            # Store in ChromaDB
            collection.add(
                ids=[f"{doc_id}_section_{i}"],
                documents=[section_text],
                embeddings=[embedding.tolist()],
                metadatas=[{
                    **metadata,
                    'section': i,
                    'type': section.get('type', 'text'),
                    'page': section.get('page', 0)
                }]
            )

        # Process tables separately
        for i, table in enumerate(content['tables']):
            # Store table as HTML
            collection.add(
                ids=[f"{doc_id}_table_{i}"],
                documents=[table['html']],
                embeddings=[self.embedding_model.encode(table['caption']).tolist()],
                metadatas=[{
                    **metadata,
                    'type': 'table',
                    'table_id': i
                }]
            )

        return len(content['markdown']) + len(content['tables'])

# Usage
processor = DocumentIntelligence()

# Process government regulation PDF
count = processor.process_legal_document(
    '/path/to/regulation.pdf',
    metadata={
        'doc_id': 'PP_NO_45_2023',
        'title': 'Peraturan Pemerintah No 45 Tahun 2023',
        'category': 'regulation',
        'source': 'government',
        'language': 'id'
    }
)

print(f"Processed {count} sections")
```

---

### **EasyOCR - Multilingual Text Recognition**

**Repository:** https://github.com/JaidedAI/EasyOCR
**Stars:** 25K+ | **Language:** Python | **License:** Apache 2.0

```python
# backend-rag/app/services/ocr_service.py
import easyocr
from PIL import Image
import numpy as np

class OCRService:
    def __init__(self):
        # Initialize with Indonesian + English
        self.reader = easyocr.Reader(
            ['id', 'en'],
            gpu=True,
            model_storage_directory='./models'
        )

    def extract_text(self, image_path: str, min_confidence: float = 0.5) -> dict:
        """Extract text from image"""

        # Read image
        result = self.reader.readtext(image_path)

        # Filter by confidence
        extracted = []
        for (bbox, text, confidence) in result:
            if confidence >= min_confidence:
                extracted.append({
                    'text': text,
                    'confidence': confidence,
                    'bbox': bbox
                })

        # Combine into full text
        full_text = ' '.join([item['text'] for item in extracted])

        return {
            'full_text': full_text,
            'segments': extracted,
            'avg_confidence': np.mean([item['confidence'] for item in extracted])
        }

    def process_visa_scan(self, image_path: str) -> dict:
        """Extract data from visa/passport scan"""

        result = self.extract_text(image_path)

        # Parse specific fields (example)
        data = {
            'raw_text': result['full_text'],
            'passport_number': self._extract_passport_number(result['full_text']),
            'name': self._extract_name(result['full_text']),
            'expiry_date': self._extract_date(result['full_text'])
        }

        return data

    def _extract_passport_number(self, text: str) -> str:
        import re
        match = re.search(r'[A-Z]{1,2}\d{6,9}', text)
        return match.group(0) if match else None

    # ... other extraction methods

# Usage
ocr = OCRService()
result = ocr.process_visa_scan('/uploads/passport_scan.jpg')
```

---

## 🎯 QUICK START SCRIPTS

### **One-Command Setup**

```bash
#!/bin/bash
# setup-automation.sh

echo "🚀 Setting up NUZANTARA Automation Stack"

# 1. Install Playwright
echo "📝 Installing Playwright..."
cd webapp
npm install -D @playwright/test
npx playwright install

# 2. Setup Prefect
echo "📊 Setting up Prefect..."
cd ../backend-rag
pip install prefect sentence-transformers

# 3. Setup monitoring
echo "📈 Setting up Prometheus + Grafana..."
cd ../monitoring
docker-compose up -d

# 4. Setup security scanning
echo "🔒 Setting up security tools..."
pip install semgrep gitleaks

# 5. Install document processing
echo "📄 Installing MinerU + EasyOCR..."
pip install magic-pdf[full] easyocr

echo "✅ Setup complete!"
echo "Next steps:"
echo "1. Configure .env files"
echo "2. Run: npm run test:e2e"
echo "3. Visit http://localhost:3000 for Grafana"
echo "4. Visit http://localhost:4200 for Prefect"
```

---

## 📞 SUPPORT & COMMUNITY

**GitHub Discussions:**
- LlamaIndex: https://github.com/run-llama/llama_index/discussions
- LangGraph: https://github.com/langchain-ai/langgraph/discussions
- CrewAI: https://github.com/crewAIInc/crewAI/discussions

**Discord Servers:**
- LangChain: https://discord.gg/langchain
- Prefect: https://discord.gg/prefect

**Forums:**
- HuggingFace: https://discuss.huggingface.co
- Playwright: https://github.com/microsoft/playwright/discussions

---

**Last Updated:** 17 November 2025
**Maintained by:** NUZANTARA Team

---
name: performance-analyzer
description: Analyze and optimize nuzantara performance including database queries, RAG latency, API response times, and system resource utilization
---

# Performance Analysis & Optimization Protocol

Use this skill when investigating slow performance, optimizing system, analyzing bottlenecks, or when user reports slowness.

## Performance Baseline

### Target Performance Metrics

| Component | Target | Acceptable | Critical |
|-----------|--------|------------|----------|
| Health endpoint | < 50ms | < 100ms | > 200ms |
| API endpoints | < 300ms | < 500ms | > 1000ms |
| RAG query (simple) | < 500ms | < 1s | > 2s |
| RAG query (complex) | < 1s | < 2s | > 5s |
| Oracle agent | < 2s | < 5s | > 10s |
| Database query | < 50ms | < 100ms | > 500ms |
| Page load | < 1s | < 2s | > 3s |

## Performance Analysis Steps

### 1. System Resource Analysis

**CPU Usage**:
```bash
# Overall CPU usage
top -bn1 | head -n 20

# Per-process CPU
ps aux --sort=-%cpu | head -n 10

# CPU usage over time
sar -u 5 10  # 5s intervals, 10 samples
```

**Memory Usage**:
```bash
# Overall memory
free -h

# Per-process memory
ps aux --sort=-%mem | head -n 10

# Memory details
cat /proc/meminfo

# Check for memory leaks
# Compare memory over time
watch -n 5 'ps aux | grep node | grep backend-ts'
```

**Disk I/O**:
```bash
# Disk usage
df -h

# I/O stats
iostat -x 5 3

# Check ChromaDB data size
du -sh data/chroma/

# Database size
psql $DATABASE_URL -c "
  SELECT pg_size_pretty(pg_database_size('nuzantara'));
"
```

**Network**:
```bash
# Network connections
netstat -tuln | grep -E "8080|8000|5432"

# Connection count by state
netstat -ant | awk '{print $6}' | sort | uniq -c

# Bandwidth usage
iftop -i eth0
```

### 2. Application Performance Profiling

**API Endpoint Timing**:
```bash
# Measure endpoint response time
time curl http://localhost:8080/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "tier": 0}'

# Detailed timing with curl
curl -w "\n\nTime:\n  DNS: %{time_namelookup}s\n  Connect: %{time_connect}s\n  TLS: %{time_appconnect}s\n  Start Transfer: %{time_starttransfer}s\n  Total: %{time_total}s\n" \
  http://localhost:8080/health
```

**Load Testing**:
```bash
# Simple load test with Apache Bench
ab -n 1000 -c 10 http://localhost:8080/health

# More realistic load test
ab -n 500 -c 5 -p query.json -T application/json \
  http://localhost:8080/api/rag/query

# Or use hey
hey -n 1000 -c 10 -m POST \
  -H "Content-Type: application/json" \
  -d '{"query":"test","tier":0}' \
  http://localhost:8080/api/rag/query
```

**Stress Testing**:
```bash
# Gradually increase load
for i in {1..10}; do
  echo "Testing with $((i*10)) concurrent users"
  ab -n 1000 -c $((i*10)) http://localhost:8080/health
  sleep 5
done
```

### 3. Database Performance Analysis

**Query Performance**:
```bash
# Enable query logging (PostgreSQL)
psql $DATABASE_URL -c "ALTER DATABASE nuzantara SET log_statement = 'all';"

# Check slow queries
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  WHERE mean_exec_time > 100  -- queries > 100ms
  ORDER BY mean_exec_time DESC
  LIMIT 20;
"

# Check for missing indexes
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, attname, n_distinct, correlation
  FROM pg_stats
  WHERE schemaname = 'public'
  ORDER BY abs(correlation) DESC;
"
```

**Connection Pool**:
```bash
# Check active connections
psql $DATABASE_URL -c "
  SELECT state, count(*)
  FROM pg_stat_activity
  WHERE datname = 'nuzantara'
  GROUP BY state;
"

# Check connection limits
psql $DATABASE_URL -c "SHOW max_connections;"
```

**Prisma Query Optimization**:
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});

// Look for N+1 queries
// Use include/select strategically
```

### 4. RAG System Performance

**ChromaDB Query Timing**:
```python
import time

# Test different query sizes
for n in [1, 5, 10, 20, 50]:
    start = time.time()
    results = collection.query(
        query_texts=["business consulting Indonesia"],
        n_results=n
    )
    elapsed = (time.time() - start) * 1000
    print(f"Retrieving {n} results: {elapsed:.2f}ms")

# Test with tier filtering
start = time.time()
results = collection.query(
    query_texts=["test"],
    n_results=10,
    where={"tier": {"$lte": 1}}
)
elapsed = (time.time() - start) * 1000
print(f"With tier filter: {elapsed:.2f}ms")
```

**Embedding Generation Speed**:
```python
from sentence_transformers import SentenceTransformer
import time

model = SentenceTransformer('model-name')

texts = ["test query"] * 100

start = time.time()
embeddings = model.encode(texts)
elapsed = time.time() - start

print(f"Encoded {len(texts)} texts in {elapsed:.2f}s")
print(f"Average: {elapsed/len(texts)*1000:.2f}ms per text")
```

**RAG Query Breakdown**:
```python
# Measure each step
times = {}

# 1. Embedding generation
start = time.time()
query_embedding = embed_query(query)
times['embedding'] = (time.time() - start) * 1000

# 2. Vector search
start = time.time()
chunks = vector_db.search(query_embedding, n=10)
times['vector_search'] = (time.time() - start) * 1000

# 3. LLM generation
start = time.time()
response = llm.generate(query, chunks)
times['llm_generation'] = (time.time() - start) * 1000

# Report breakdown
for step, duration in times.items():
    print(f"{step}: {duration:.2f}ms")
```

### 5. API Response Time Analysis

**Add Performance Middleware**:
```typescript
// Measure all requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration
    });

    // Alert on slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        durationMs: duration
      });
    }
  });

  next();
});
```

**Endpoint Profiling**:
```typescript
import { performance } from 'perf_hooks';

async function profiledRAGQuery(query: string, tier: number) {
  const marks: Record<string, number> = {};

  marks.start = performance.now();

  // Validate input
  validateQuery(query);
  marks.validation = performance.now();

  // Get embeddings
  const embedding = await getEmbedding(query);
  marks.embedding = performance.now();

  // Search vector DB
  const chunks = await searchVectorDB(embedding, tier);
  marks.vectorSearch = performance.now();

  // Generate response
  const response = await generateResponse(query, chunks);
  marks.generation = performance.now();

  // Calculate durations
  const profile = {
    validation: marks.validation - marks.start,
    embedding: marks.embedding - marks.validation,
    vectorSearch: marks.vectorSearch - marks.embedding,
    generation: marks.generation - marks.vectorSearch,
    total: marks.generation - marks.start
  };

  logger.info('RAG query profile', profile);

  return { response, profile };
}
```

### 6. Frontend Performance

**Page Load Time**:
```javascript
// Add to webapp
window.addEventListener('load', () => {
  const perfData = performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domComplete - perfData.domLoading;

  console.log('Page load metrics:', {
    pageLoadTime,
    connectTime,
    renderTime
  });

  // Send to analytics
  if (pageLoadTime > 3000) {
    console.warn('Slow page load detected');
  }
});
```

**Service Worker Caching**:
```javascript
// Check cache hit rate
let cacheHits = 0;
let cacheMisses = 0;

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        cacheHits++;
        console.log(`Cache hit rate: ${(cacheHits/(cacheHits+cacheMisses)*100).toFixed(1)}%`);
        return response;
      }
      cacheMisses++;
      return fetch(event.request);
    })
  );
});
```

## Optimization Strategies

### Database Optimization

**Add Indexes**:
```sql
-- Identify missing indexes
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_queries_user_tier ON queries(user_id, tier);
CREATE INDEX idx_sessions_created ON sessions(created_at);
```

**Connection Pooling**:
```typescript
// Optimize Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  // connection_limit=10&pool_timeout=20
});
```

### Caching Strategy

**Redis Caching**:
```typescript
// Cache RAG results
async function cachedRAGQuery(query: string, tier: number) {
  const cacheKey = `rag:${tier}:${hash(query)}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info('Cache hit', { cacheKey });
    return JSON.parse(cached);
  }

  // Execute query
  const result = await executeRAGQuery(query, tier);

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(result));

  return result;
}
```

**In-Memory Caching**:
```typescript
import LRU from 'lru-cache';

const cache = new LRU({
  max: 500,  // Max items
  ttl: 1000 * 60 * 60,  // 1 hour
});

function cachedFunction(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = expensiveOperation(key);
  cache.set(key, result);
  return result;
}
```

### RAG Optimization

**Embedding Caching**:
```python
# Cache embeddings for common queries
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_embedding_cached(text: str):
    return embedding_model.encode(text)
```

**Lazy Loading ChromaDB**:
```python
# Don't load all data upfront
# Load on-demand per collection
class LazyChromaDB:
    def __init__(self):
        self.client = chromadb.Client()
        self.collections = {}

    def get_collection(self, name: str):
        if name not in self.collections:
            self.collections[name] = self.client.get_collection(name)
        return self.collections[name]
```

**Optimize Chunk Size**:
- Test different chunk sizes (256, 512, 1024 tokens)
- Balance between context and specificity
- Optimize overlap (typically 10-20%)

### API Optimization

**Compression**:
```typescript
import compression from 'compression';

// Enable gzip compression
app.use(compression());
```

**Response Streaming**:
```typescript
// Stream large responses
app.get('/api/large-dataset', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');

  const stream = getLargeDataStream();
  let first = true;

  for await (const item of stream) {
    if (!first) res.write(',');
    res.write(JSON.stringify(item));
    first = false;
  }

  res.write(']');
  res.end();
});
```

**Parallel Processing**:
```typescript
// Execute independent operations in parallel
const [user, profile, settings] = await Promise.all([
  db.user.findUnique({ where: { id } }),
  db.profile.findUnique({ where: { userId: id } }),
  db.settings.findUnique({ where: { userId: id } })
]);
```

### Code Optimization

**Avoid N+1 Queries**:
```typescript
// ❌ Bad: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  });
}

// ✅ Good: Single query with include
const users = await prisma.user.findMany({
  include: { posts: true }
});
```

**Batch Operations**:
```typescript
// ❌ Bad: Multiple individual operations
for (const item of items) {
  await db.item.create({ data: item });
}

// ✅ Good: Batch operation
await db.item.createMany({ data: items });
```

## Performance Monitoring

### Continuous Monitoring

**Set up monitoring endpoints**:
```typescript
app.get('/api/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    // Add custom metrics
    requestCount: metrics.requestCount,
    avgResponseTime: metrics.avgResponseTime,
    errorRate: metrics.errorRate
  });
});
```

**Log Performance Metrics**:
```typescript
setInterval(() => {
  logger.info('Performance snapshot', {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    activeConnections: server.connections,
    requestsPerMinute: metrics.rpm
  });
}, 60000);  // Every minute
```

## Performance Report Template

```markdown
## ⚡ PERFORMANCE ANALYSIS REPORT
Generated: [timestamp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📊 METRICS SUMMARY
| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| API Response | [X]ms | 300ms | [✅/⚠️/🚨] |
| RAG Query | [X]ms | 1s | [✅/⚠️/🚨] |
| DB Query | [X]ms | 50ms | [✅/⚠️/🚨] |
| Page Load | [X]ms | 1s | [✅/⚠️/🚨] |

### 🔍 BOTTLENECKS IDENTIFIED
1. [Description]
   - Impact: [High/Medium/Low]
   - Location: [file:line]

### 💡 OPTIMIZATION RECOMMENDATIONS
1. [Recommendation]
   - Expected improvement: [%]
   - Effort: [High/Medium/Low]

### 🎯 ACTION ITEMS
- [ ] [Action 1]
- [ ] [Action 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Key Files
- `apps/backend-ts/src/middleware/performance.ts` - Performance middleware
- `apps/backend-ts/src/services/cache.ts` - Caching service
- `apps/backend-rag/backend/core/vector_db.py` - ChromaDB optimization

## Success Criteria
✅ All metrics within target ranges
✅ Bottlenecks identified and documented
✅ Optimization plan created
✅ High-impact optimizations implemented
✅ Performance improvements measured
✅ Monitoring in place for regression detection

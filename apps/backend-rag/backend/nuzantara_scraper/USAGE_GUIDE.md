# Nuzantara Unified Scraper - Usage Guide

Complete guide for using the unified scraper system via Python API and TypeScript handlers.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Python API Usage](#python-api-usage)
3. [TypeScript Handler Usage](#typescript-handler-usage)
4. [Scheduling](#scheduling)
5. [Configuration](#configuration)
6. [API Reference](#api-reference)

---

## Quick Start

### 1. Start the Scraper API

```bash
cd apps/backend-rag/backend
uvicorn nuzantara_scraper.api.routes:app --reload --port 8001
```

### 2. Run a Scraper

**Python:**
```python
from nuzantara_scraper import PropertyScraper, ScraperConfig
from nuzantara_scraper.models import ContentType

config = ScraperConfig(
    scraper_name="property_intel",
    category=ContentType.PROPERTY
)

scraper = PropertyScraper(config)
result = scraper.run_cycle()

print(f"✅ Scraped {result.items_saved} items")
print(f"📊 Success rate: {result.success_rate * 100:.1f}%")
```

**TypeScript:**
```typescript
import { runPropertyScraper } from './handlers/intel';

const result = await runPropertyScraper({
  run_async: true,
  enable_ai: true
});

console.log(`Job ID: ${result.data?.job_id}`);
```

---

## Python API Usage

### Direct Scraper Usage

```python
from nuzantara_scraper import (
    PropertyScraper,
    ImmigrationScraper,
    TaxScraper,
    NewsScraper,
    ScraperConfig
)

# 1. Property Scraper
config = ScraperConfig.from_yaml("config/property_config.yaml")
scraper = PropertyScraper(config)
result = scraper.run_cycle()

# 2. Immigration Scraper
config = ScraperConfig.from_yaml("config/immigration_config.yaml")
scraper = ImmigrationScraper(config)
result = scraper.run_cycle()

# 3. Tax Scraper
config = ScraperConfig.from_yaml("config/tax_config.yaml")
scraper = TaxScraper(config)
result = scraper.run_cycle()

# 4. News Scraper
config = ScraperConfig.from_yaml("config/news_config.yaml")
scraper = NewsScraper(config)
result = scraper.run_cycle()
```

### REST API Usage (via requests)

```python
import requests

# Run scraper
response = requests.post('http://localhost:8001/api/scraper/run', json={
    "scraper_type": "property",
    "run_async": True,
    "enable_ai": True
})

job = response.json()
job_id = job['job_id']

# Check status
response = requests.get(f'http://localhost:8001/api/scraper/status/{job_id}')
status = response.json()

print(f"Status: {status['status']}")
print(f"Items scraped: {status['items_scraped']}")
```

---

## TypeScript Handler Usage

### Import Handlers

```typescript
import {
  // Unified scraper functions
  scraperRun,
  scraperStatus,
  scraperList,
  scraperJobs,
  scraperHealth,

  // Convenience functions
  runPropertyScraper,
  runImmigrationScraper,
  runTaxScraper,
  runNewsScraper,

  // Utility
  waitForJobCompletion,

  // Types
  type ScraperType,
  type ScraperRunParams,
  type UnifiedScraperStatus
} from './handlers/intel';
```

### Run Scrapers

#### 1. Property Scraper

```typescript
// Async execution (recommended)
const result = await runPropertyScraper({
  run_async: true,
  enable_ai: true
});

if (result.success) {
  console.log(`✅ Job started: ${result.data?.job_id}`);

  // Wait for completion
  const final = await waitForJobCompletion(result.data!.job_id);
  console.log(`📊 Saved ${final.data?.items_saved} items`);
}

// Sync execution
const syncResult = await runPropertyScraper({
  run_async: false,
  enable_ai: true
});

console.log(`✅ Completed: ${syncResult.data?.items_saved} items`);
```

#### 2. Immigration Scraper

```typescript
const result = await runImmigrationScraper({
  run_async: true,
  enable_ai: true
});

console.log(`Job ID: ${result.data?.job_id}`);
```

#### 3. Tax Scraper

```typescript
const result = await runTaxScraper({
  run_async: true,
  enable_ai: true
});

console.log(`Job ID: ${result.data?.job_id}`);
```

#### 4. News Scraper

```typescript
// With specific categories
const result = await runNewsScraper({
  run_async: true,
  enable_ai: true,
  categories: ['immigration', 'tax', 'property']
});

console.log(`Job ID: ${result.data?.job_id}`);
```

### Generic Scraper Runner

```typescript
const result = await scraperRun({
  scraper_type: 'property',  // 'property' | 'immigration' | 'tax' | 'news'
  run_async: true,
  enable_ai: true,
  config_path: './config/custom_config.yaml'  // Optional
});
```

### Check Job Status

```typescript
const status = await scraperStatus({
  job_id: 'abc-123-def'
});

if (status.success) {
  console.log(`Status: ${status.data?.status}`);
  console.log(`Items scraped: ${status.data?.items_scraped}`);
  console.log(`Duration: ${status.data?.duration_seconds}s`);
}
```

### List Available Scrapers

```typescript
const list = await scraperList();

if (list.success) {
  list.data?.scrapers.forEach(scraper => {
    console.log(`${scraper.type}: ${scraper.description}`);
  });
}
```

### Health Check

```typescript
const health = await scraperHealth();

if (health.success) {
  console.log('✅ Scraper API is healthy');
} else {
  console.error('❌ Scraper API is down:', health.error);
}
```

---

## Scheduling

### Python Scheduler

```python
from nuzantara_scraper.scheduler import ScraperScheduler, ScheduleFrequency
from nuzantara_scraper import ScraperConfig
from nuzantara_scraper.models import ContentType

# Create scheduler
scheduler = ScraperScheduler()

# Schedule property scraper to run daily
config = ScraperConfig.from_yaml("config/property_config.yaml")

job_id = scheduler.add_job(
    scraper_type="property",
    config=config,
    frequency=ScheduleFrequency.DAILY
)

# Start scheduler
scheduler.start()

print(f"✅ Scheduled job: {job_id}")

# Keep scheduler running
import time
try:
    while True:
        time.sleep(60)
except KeyboardInterrupt:
    scheduler.stop()
```

### REST API Scheduling

```python
import requests

# Schedule a job
response = requests.post('http://localhost:8001/api/scheduler/schedule', json={
    "scraper_type": "property",
    "frequency": "daily",
    "enable_ai": True
})

job = response.json()
print(f"Scheduled: {job['job_id']}")

# Start scheduler
requests.post('http://localhost:8001/api/scheduler/start')

# List scheduled jobs
response = requests.get('http://localhost:8001/api/scheduler/jobs')
print(response.json())
```

### TypeScript Scheduling

```typescript
import axios from 'axios';

const SCRAPER_API_URL = 'http://localhost:8001';

// Schedule job
const scheduleResponse = await axios.post(
  `${SCRAPER_API_URL}/api/scheduler/schedule`,
  {
    scraper_type: 'property',
    frequency: 'daily',
    enable_ai: true
  }
);

const jobId = scheduleResponse.data.job_id;
console.log(`✅ Scheduled: ${jobId}`);

// Start scheduler
await axios.post(`${SCRAPER_API_URL}/api/scheduler/start`);

// Check status
const statusResponse = await axios.get(
  `${SCRAPER_API_URL}/api/scheduler/status`
);

console.log(`Running: ${statusResponse.data.running}`);
console.log(`Total jobs: ${statusResponse.data.total_jobs}`);
```

---

## Configuration

### YAML Configuration

```yaml
# property_config.yaml
scraper_name: property_intel
category: property

sources:
  - name: "Rumah.com Bali"
    url: "https://www.rumah.com/properti-dijual/bali"
    tier: accredited
    category: property
    selectors:
      - "div[data-testid='listing-card']"
    requires_js: true

database:
  chromadb_path: "./data/chromadb"
  postgres_url: null
  collections_prefix: "nuzantara"

ai:
  ollama_url: "http://localhost:11434"
  llama_model: "llama3.2"
  zantara_url: "http://localhost:8000"
  zantara_api_key: null
  provider_order: ["zantara", "llama"]

engine:
  engine_preference: ["crawl4ai", "playwright", "requests"]
  request_timeout: 30
  delay_between_requests: 2

filter:
  min_word_count: 50
  min_quality_score: 0.3
  enable_ai_filtering: true
  enable_deduplication: true
```

### Environment Variables

```bash
# .env file
OLLAMA_URL=http://localhost:11434
ZANTARA_API_URL=http://localhost:8000
ZANTARA_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@localhost/nuzantara
CHROMADB_PATH=./data/chromadb
SCRAPER_API_URL=http://localhost:8001
```

---

## API Reference

### REST Endpoints

#### Scraper Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scraper/run` | Run a scraper |
| GET | `/api/scraper/status/{job_id}` | Get job status |
| GET | `/api/scraper/list` | List available scrapers |
| GET | `/api/scraper/jobs` | List all jobs |
| GET | `/health` | Health check |

#### Scheduler Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scheduler/schedule` | Schedule a job |
| GET | `/api/scheduler/jobs` | List scheduled jobs |
| GET | `/api/scheduler/jobs/{job_id}` | Get job details |
| POST | `/api/scheduler/jobs/{job_id}/enable` | Enable job |
| POST | `/api/scheduler/jobs/{job_id}/disable` | Disable job |
| DELETE | `/api/scheduler/jobs/{job_id}` | Remove job |
| POST | `/api/scheduler/start` | Start scheduler |
| POST | `/api/scheduler/stop` | Stop scheduler |
| GET | `/api/scheduler/status` | Scheduler status |

### TypeScript Functions

#### Scraper Functions

```typescript
// Run scrapers
scraperRun(params: ScraperRunParams): Promise<Result<ScraperStatus>>
runPropertyScraper(params?): Promise<Result<ScraperStatus>>
runImmigrationScraper(params?): Promise<Result<ScraperStatus>>
runTaxScraper(params?): Promise<Result<ScraperStatus>>
runNewsScraper(params?): Promise<Result<ScraperStatus>>

// Status and info
scraperStatus({ job_id }): Promise<Result<ScraperStatus>>
scraperList(): Promise<Result<ScraperListResponse>>
scraperJobs(): Promise<Result<JobsListResponse>>
scraperHealth(): Promise<Result<HealthResponse>>

// Utility
waitForJobCompletion(job_id, timeout_ms?, poll_interval_ms?): Promise<Result<ScraperStatus>>
```

---

## Examples

### Full Workflow Example

```typescript
// 1. Check health
const health = await scraperHealth();
if (!health.success) {
  console.error('Scraper API is down!');
  process.exit(1);
}

// 2. List available scrapers
const scrapers = await scraperList();
console.log(`Available scrapers: ${scrapers.data?.scrapers.length}`);

// 3. Run property scraper
const run = await runPropertyScraper({
  run_async: true,
  enable_ai: true
});

if (!run.success) {
  console.error('Failed to start:', run.error);
  process.exit(1);
}

const jobId = run.data!.job_id;
console.log(`✅ Job started: ${jobId}`);

// 4. Wait for completion
const result = await waitForJobCompletion(jobId, 300000);  // 5 min timeout

if (result.success) {
  console.log('✅ Scraping completed!');
  console.log(`📊 Stats:`);
  console.log(`  - Items scraped: ${result.data?.items_scraped}`);
  console.log(`  - Items saved: ${result.data?.items_saved}`);
  console.log(`  - Duration: ${result.data?.duration_seconds}s`);
  console.log(`  - Sources: ${result.data?.sources_successful}/${result.data?.sources_attempted}`);
} else {
  console.error('❌ Scraping failed:', result.error);
}
```

---

## Migration from Old System

### Old System (spawn-based)

```typescript
// OLD
import { intelScraperRun } from './handlers/intel';

const result = await intelScraperRun({
  categories: ['immigration'],
  runStage2: true,
  limit: 10
});
```

### New System (REST API)

```typescript
// NEW
import { runNewsScraper } from './handlers/intel';

const result = await runNewsScraper({
  run_async: true,
  enable_ai: true,
  categories: ['immigration']
});
```

---

## Troubleshooting

### Scraper API not reachable

```typescript
const health = await scraperHealth();
if (!health.success) {
  // Check if API is running
  // Default: http://localhost:8001
  // Set env: SCRAPER_API_URL=http://your-api-url
}
```

### Job stuck in "running" state

```typescript
// Set shorter timeout
const result = await waitForJobCompletion(jobId, 60000);  // 1 min

if (!result.success) {
  console.error('Job timed out or failed');

  // Check status manually
  const status = await scraperStatus({ job_id: jobId });
  console.log(status.data);
}
```

### AI analysis not working

Check that AI providers are configured:
- Local LLAMA: `OLLAMA_URL=http://localhost:11434`
- Zantara: `ZANTARA_API_URL=http://localhost:8000`

---

**Version:** 1.0.0
**Last Updated:** October 23, 2025
**Maintainer:** Nuzantara Team

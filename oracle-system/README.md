# 🔮 ORACLE SYSTEM - Intelligent Agent Network for Bali Zero

## Overview
Advanced multi-agent system with 5 specialized Oracle agents that gather intelligence, simulate scenarios, and learn from outcomes.

## 🤖 Oracle Agents

### 1. **VISA ORACLE**
- **Focus**: Immigration and visa intelligence for expats in Indonesia
- **Capabilities**: Scraping immigration sites, monitoring policy changes, tracking processing times
- **Knowledge Base**: `agents/knowledge-bases/visa-oracle-kb.json`

### 2. **KBLI EYE**
- **Focus**: Business setup, licensing, and KBLI classification
- **Capabilities**: OSS monitoring, KBLI classification, license tracking
- **Components**:
  - `agents/kbli-eye/kbli-classifier.ts` - AI-powered business classification
  - `agents/kbli-eye/oss-scraper.ts` - Real-time OSS system monitoring
- **Knowledge Base**: `agents/knowledge-bases/kbli-eye-kb.json`

### 3. **TAX GENIUS**
- **Focus**: Tax optimization and compliance intelligence
- **Capabilities**: Tax deadline tracking, optimization strategies, audit risk assessment
- **Status**: In development

### 4. **LEGAL ARCHITECT**
- **Focus**: Property law and legal structures
- **Capabilities**: Due diligence, market analysis, legal compliance
- **Status**: In development

### 5. **MORGANA**
- **Focus**: Content creation and viral marketing
- **Capabilities**: Multi-format content generation, trend analysis, colleague intelligence mining
- **Status**: In development

## 🧠 Core Systems

### Simulation Engine
**Location**: `agents/simulation-engine/`

- **simulation-engine.ts**: Multi-agent collaborative problem-solving
- **monte-carlo.ts**: Stress testing with thousands of random scenarios
- **Features**:
  - Solo, duo, trio, quartet agent collaboration modes
  - Case parsing and analysis
  - Conflict resolution
  - Integrated solution generation
  - Content opportunity identification

### Learning System
**Location**: `agents/learning/`

- **feedback-loop.ts**: System that learns from real case outcomes
- **Features**:
  - Records prediction vs actual outcomes
  - Identifies patterns in successes/failures
  - Adjusts system parameters automatically
  - Tracks improvement metrics over time

### Knowledge Bases
**Location**: `agents/knowledge-bases/`

- Real-world data for each Oracle agent
- Updated from scraping and manual curation
- Classification: PUBLIC / INTERNAL / CONFIDENTIAL

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd oracle-system
npm install puppeteer axios cheerio
npm install @google/generative-ai
npm install firebase-admin
npm install natural node-cron
```

### 2. Configure Environment
```bash
export GEMINI_API_KEY=your_key_here
export GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-key.json
```

### 3. Run Simulation
```typescript
import { runSimulation } from './agents/simulation-engine/simulation-engine';

const result = await runSimulation(
  "Italian couple wants to open beach club in Seminyak",
  'quartet' // Use all 4 agents
);
```

### 4. Run Monte Carlo Test
```typescript
import { runMonteCarloTest } from './agents/simulation-engine/monte-carlo';

const results = await runMonteCarloTest('businessSetupTest');
console.log(`Success rate: ${results.successRate * 100}%`);
```

### 5. Validation Harness (manual checks)
While the Oracle stack remains in development, keep it isolated from the production runtime and validate it manually:

```bash
# from repository root
npm run test:oracle-sim
```

The harness asserts that VISA and KBLI agents return knowledge-backed outputs and prints a sample integrated solution to review. Treat any failure as blocking—do not expose the Oracle handlers to ZANTARA until this check is consistently green and the team has vetted the generated intelligence.

### 6. Generate Daily Intelligence Board
Create a consolidated snapshot for VISA ORACLE + KBLI EYE (records count, alert summary, source mix):

```bash
# optional: pass explicit YYYY-MM-DD
npx tsx oracle-system/scripts/build-dashboard.ts
npx tsx oracle-system/scripts/build-dashboard.ts 2025-10-01
```

The script writes JSON dashboards under `oracle-system/reports/dashboard/` and prints a quick summary in the terminal.

## 📊 Intelligence Classification

All gathered intelligence is classified as:

- **PUBLIC**: Safe to share on Custom GPT, website, social media
- **INTERNAL**: Team knowledge only, operational advantages
- **CONFIDENTIAL**: Leadership only, strategic secrets

## 🔄 Data Flow

```
Web Sources → Oracle Agents → Classification → Knowledge Base
                                                ↓
                                          Internal Dashboard
                                                ↓
                                    Simulation Engine ← Feedback Loop
                                                ↓
                                          Custom GPT (PUBLIC only)
```

## 📈 Features

### Implemented ✅
- VISA ORACLE knowledge base
- KBLI EYE classifier and OSS scraper
- Simulation Engine with multi-agent collaboration
- Monte Carlo simulation for stress testing
- Learning feedback loop
- Intelligence classification system

### In Development 🚧
- TAX GENIUS knowledge and scrapers
- LEGAL ARCHITECT property intelligence
- MORGANA content generation
- Real-time scraping integration
- Simulation dashboard UI

## 🔗 Integration with ZANTARA

Add to ZANTARA handlers:

```typescript
// In handlers.ts
import { handleSimulationQuery } from './oracle-system/agents/simulation-engine/simulation-engine';
import { handleKBLIQuery } from './oracle-system/agents/kbli-eye/kbli-classifier';
import { recordCaseFeedback } from './oracle-system/agents/learning/feedback-loop';

handlers['oracle.simulate'] = handleSimulationQuery;
handlers['kbli.classify'] = handleKBLIQuery;
handlers['oracle.feedback'] = recordCaseFeedback;
```

## 📝 Example Use Cases

### 1. Business Setup Simulation
```typescript
{
  "case": "American wants to open a restaurant in Canggu",
  "agents": ["VISA_ORACLE", "KBLI_EYE", "TAX_GENIUS", "LEGAL_ARCHITECT"],
  "solution": {
    "visa": "KITAS Investor via PT PMA",
    "business": "KBLI 56101 Restaurant",
    "tax": "Small business 0.5% rate",
    "property": "Commercial lease recommended",
    "timeline": "3-4 months total",
    "investment": "10B IDR minimum"
  }
}
```

### 2. KBLI Classification
```typescript
{
  "businessDescription": "Digital marketing agency with web development",
  "result": {
    "primary": "KBLI 73100 - Advertising",
    "secondary": ["62019 - IT Services"],
    "foreignEligible": true,
    "minimumInvestment": "10B IDR"
  }
}
```

## 🛠️ Maintenance

- Knowledge bases should be updated weekly
- Run Monte Carlo tests monthly to verify system accuracy
- Review learning metrics quarterly
- Update scrapers when source websites change

## 📞 Support

For questions or issues with the Oracle System, contact the development team.

---

**Version**: 1.0.0
**Last Updated**: September 24, 2025
**Status**: Active Development

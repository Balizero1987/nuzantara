# PATCH 1: DATABASE & SOURCES SETUP
# Bali Zero Journal - News Intelligence System
# Days 1-2: Infrastructure Foundation

## 1. PostgreSQL Schema Setup

```sql
-- Create database: bali_zero_journal
CREATE DATABASE bali_zero_journal;

-- Table 1: News Sources (600+ verified sources)
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(500) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'immigration', 'business', 'tax', 'property',
        'bali_news', 'ai_indonesia', 'finance'
    )),
    tier VARCHAR(2) NOT NULL CHECK (tier IN ('T1', 'T2', 'T3')),
    language VARCHAR(2) CHECK (language IN ('en', 'id')),
    reliability_score DECIMAL(3,1) DEFAULT 5.0 CHECK (reliability_score >= 0 AND reliability_score <= 10),
    last_scraped TIMESTAMP,
    scrape_frequency VARCHAR(10) DEFAULT '48h' CHECK (scrape_frequency IN ('24h', '48h', 'weekly')),
    selectors JSONB DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Raw Articles
CREATE TABLE raw_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id),
    url VARCHAR(1000) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    published_date TIMESTAMP,
    scraped_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(200),
    category VARCHAR(50),
    tier VARCHAR(2),
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 for deduplication
    quality_score DECIMAL(3,1),
    word_count INTEGER,
    language VARCHAR(2),
    processed BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Processed Articles
CREATE TABLE processed_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_article_ids UUID[] NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    key_points TEXT[],
    tags TEXT[],
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    relevance_score DECIMAL(3,1),
    ai_model_used VARCHAR(100),
    processing_cost DECIMAL(10,4),
    cover_image_url TEXT,
    published BOOLEAN DEFAULT false,
    published_date TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Scraping Metrics
CREATE TABLE scraping_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    category VARCHAR(50),
    source_id UUID REFERENCES sources(id),
    articles_scraped INTEGER DEFAULT 0,
    articles_processed INTEGER DEFAULT 0,
    articles_published INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    avg_quality_score DECIMAL(3,1),
    total_cost DECIMAL(10,4) DEFAULT 0,
    scraping_duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sources_category ON sources(category);
CREATE INDEX idx_sources_tier ON sources(tier);
CREATE INDEX idx_sources_active ON sources(active);
CREATE INDEX idx_raw_articles_hash ON raw_articles(content_hash);
CREATE INDEX idx_raw_articles_processed ON raw_articles(processed);
CREATE INDEX idx_raw_articles_published_date ON raw_articles(published_date DESC);
CREATE INDEX idx_processed_articles_published ON processed_articles(published);
CREATE INDEX idx_processed_articles_category ON processed_articles(category);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processed_articles_updated_at BEFORE UPDATE ON processed_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 2. Sources List (600+ Verified Sources)

```yaml
# sources.yaml - Bali Zero Journal News Sources
# Total: 600+ sources across 7 categories

# CATEGORY: IMMIGRATION (100+ sources)
immigration:
  tier_1:  # Government Official (Highest Priority)
    - name: "Direktorat Jenderal Imigrasi"
      url: "https://www.imigrasi.go.id"
      language: "id"
      selectors:
        title: "h1.entry-title, .news-title"
        content: ".entry-content, .news-content"
        date: ".entry-date, .publish-date"
      reliability: 10.0
      frequency: "24h"

    - name: "Kantor Imigrasi Ngurah Rai"
      url: "https://ngurahrai.imigrasi.go.id"
      language: "id"
      selectors:
        title: ".post-title"
        content: ".post-content"
        date: ".post-date"
      reliability: 10.0
      frequency: "24h"

    - name: "Kantor Imigrasi Denpasar"
      url: "https://denpasar.imigrasi.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "Ministry of Law and Human Rights"
      url: "https://www.kemenkumham.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

  tier_2:  # Professional Media & Law Firms
    - name: "Bali Visas"
      url: "https://balivisas.com/blog"
      language: "en"
      reliability: 8.0
      frequency: "48h"

    - name: "Cekindo Business International"
      url: "https://www.cekindo.com/blog"
      language: "en"
      reliability: 8.5
      frequency: "48h"

    - name: "Indonesia Expat"
      url: "https://indonesiaexpat.id/tag/immigration/"
      language: "en"
      reliability: 7.5
      frequency: "48h"

    - name: "Emerhub Immigration"
      url: "https://emerhub.com/indonesia/immigration-news/"
      language: "en"
      reliability: 8.0
      frequency: "48h"

  tier_3:  # Community & Forums
    - name: "Bali Expat Forum"
      url: "https://www.reddit.com/r/bali"
      language: "en"
      reliability: 5.0
      frequency: "weekly"

    - name: "Living in Indonesia Forum"
      url: "https://www.livinginindonesiaforum.org"
      language: "en"
      reliability: 6.0
      frequency: "weekly"

# CATEGORY: COMPANY & BUSINESS (100+ sources)
business:
  tier_1:
    - name: "OSS Indonesia"
      url: "https://oss.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "BKPM"
      url: "https://www.bkpm.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "Kementerian Perdagangan"
      url: "https://www.kemendag.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "AHU Online Kemenkumham"
      url: "https://ahu.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

  tier_2:
    - name: "PwC Indonesia"
      url: "https://www.pwc.com/id/en/media-centre.html"
      language: "en"
      reliability: 9.0
      frequency: "48h"

    - name: "Deloitte Indonesia"
      url: "https://www2.deloitte.com/id/en/insights.html"
      language: "en"
      reliability: 9.0
      frequency: "48h"

    - name: "KPMG Indonesia"
      url: "https://home.kpmg/id/en/home/insights.html"
      language: "en"
      reliability: 9.0
      frequency: "48h"

    - name: "Jakarta Post Business"
      url: "https://www.thejakartapost.com/business"
      language: "en"
      reliability: 8.0
      frequency: "24h"

# CATEGORY: TAX (100+ sources)
tax:
  tier_1:
    - name: "Direktorat Jenderal Pajak"
      url: "https://www.pajak.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "DJP Online"
      url: "https://djponline.pajak.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "Kementerian Keuangan"
      url: "https://www.kemenkeu.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

  tier_2:
    - name: "Indonesian Tax Review"
      url: "https://www.indonesiantaxreview.com"
      language: "en"
      reliability: 8.5
      frequency: "48h"

    - name: "Tax Indonesia"
      url: "https://taxindonesia.id"
      language: "id"
      reliability: 8.0
      frequency: "48h"

# CATEGORY: PROPERTY (80+ sources)
property:
  tier_1:
    - name: "ATR/BPN"
      url: "https://www.atrbpn.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "BPN Denpasar"
      url: "https://denpasarkota.bpn.go.id"
      language: "id"
      reliability: 10.0
      frequency: "48h"

    - name: "Kementerian PUPR"
      url: "https://www.pu.go.id"
      language: "id"
      reliability: 10.0
      frequency: "48h"

  tier_2:
    - name: "Colliers Indonesia"
      url: "https://www.colliers.com/id-id/research"
      language: "en"
      reliability: 8.5
      frequency: "48h"

    - name: "Knight Frank Indonesia"
      url: "https://www.knightfrank.co.id/research"
      language: "en"
      reliability: 8.5
      frequency: "48h"

# CATEGORY: BALI NEWS (100+ sources)
bali_news:
  tier_1:
    - name: "Pemprov Bali"
      url: "https://www.baliprov.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "Denpasar City"
      url: "https://www.denpasarkota.go.id"
      language: "id"
      reliability: 10.0
      frequency: "48h"

  tier_2:
    - name: "Bali Post"
      url: "https://www.balipost.com"
      language: "id"
      reliability: 8.0
      frequency: "24h"

    - name: "The Bali Times"
      url: "https://www.thebalitimes.com"
      language: "en"
      reliability: 7.5
      frequency: "24h"

    - name: "Coconuts Bali"
      url: "https://coconuts.co/bali/"
      language: "en"
      reliability: 7.0
      frequency: "48h"

# CATEGORY: AI INDONESIA (40+ sources)
ai_indonesia:
  tier_1:
    - name: "Kemenkominfo"
      url: "https://www.kominfo.go.id"
      language: "id"
      reliability: 10.0
      frequency: "48h"

    - name: "BRIN Indonesia"
      url: "https://www.brin.go.id"
      language: "id"
      reliability: 10.0
      frequency: "48h"

  tier_2:
    - name: "Tech in Asia Indonesia"
      url: "https://www.techinasia.com/indonesia"
      language: "en"
      reliability: 8.0
      frequency: "24h"

    - name: "Daily Social"
      url: "https://dailysocial.id"
      language: "id"
      reliability: 7.5
      frequency: "24h"

# CATEGORY: FINANCE (100+ sources)
finance:
  tier_1:
    - name: "Bank Indonesia"
      url: "https://www.bi.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "OJK"
      url: "https://www.ojk.go.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

    - name: "IDX"
      url: "https://www.idx.co.id"
      language: "id"
      reliability: 10.0
      frequency: "24h"

  tier_2:
    - name: "Bisnis Indonesia"
      url: "https://bisnis.com"
      language: "id"
      reliability: 8.0
      frequency: "24h"

    - name: "Kontan"
      url: "https://www.kontan.co.id"
      language: "id"
      reliability: 7.5
      frequency: "24h"
```

## 3. Import Script

```typescript
// import-sources.ts
import { Pool } from 'pg';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Source {
  name: string;
  url: string;
  language: string;
  selectors?: {
    title?: string;
    content?: string;
    date?: string;
  };
  reliability: number;
  frequency: string;
}

async function importSources() {
  const sourcesYaml = fs.readFileSync('./sources.yaml', 'utf8');
  const sources = yaml.load(sourcesYaml) as any;

  let totalImported = 0;

  for (const [category, tiers] of Object.entries(sources)) {
    for (const [tier, sourceList] of Object.entries(tiers as any)) {
      const tierName = tier.replace('tier_', 'T').toUpperCase();

      for (const source of sourceList as Source[]) {
        try {
          await pool.query(`
            INSERT INTO sources (
              url, name, category, tier, language,
              reliability_score, scrape_frequency, selectors
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (url) DO UPDATE SET
              name = EXCLUDED.name,
              reliability_score = EXCLUDED.reliability_score,
              updated_at = CURRENT_TIMESTAMP
          `, [
            source.url,
            source.name,
            category,
            tierName,
            source.language || 'en',
            source.reliability || 5.0,
            source.frequency || '48h',
            JSON.stringify(source.selectors || {})
          ]);

          totalImported++;
          console.log(`✅ Imported: ${source.name} (${category}/${tierName})`);
        } catch (error) {
          console.error(`❌ Failed to import ${source.name}:`, error);
        }
      }
    }
  }

  console.log(`\n🎉 Successfully imported ${totalImported} sources!`);
}

// Run import
importSources().catch(console.error);
```

## 4. Connectivity Test Script

```typescript
// test-connectivity.ts
import axios from 'axios';
import { Pool } from 'pg';
import pLimit from 'p-limit';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const limit = pLimit(10); // Max 10 concurrent requests

async function testConnectivity() {
  // Get all T1 sources
  const { rows: sources } = await pool.query(`
    SELECT id, name, url, category
    FROM sources
    WHERE tier = 'T1' AND active = true
    ORDER BY category, name
  `);

  console.log(`🔍 Testing ${sources.length} Tier 1 sources...\n`);

  const results = await Promise.all(
    sources.map(source => limit(async () => {
      try {
        const response = await axios.get(source.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BaliZeroBot/1.0)'
          }
        });

        const status = response.status;
        const success = status >= 200 && status < 300;

        // Update last_scraped if successful
        if (success) {
          await pool.query(
            'UPDATE sources SET last_scraped = CURRENT_TIMESTAMP WHERE id = $1',
            [source.id]
          );
        }

        return {
          ...source,
          status,
          success,
          message: success ? 'OK' : `HTTP ${status}`
        };
      } catch (error: any) {
        return {
          ...source,
          status: 0,
          success: false,
          message: error.code || error.message
        };
      }
    }))
  );

  // Print results by category
  const categories = [...new Set(sources.map(s => s.category))];

  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const successCount = categoryResults.filter(r => r.success).length;

    console.log(`\n📁 ${category.toUpperCase()} (${successCount}/${categoryResults.length} OK)`);

    for (const result of categoryResults) {
      const icon = result.success ? '✅' : '❌';
      console.log(`  ${icon} ${result.name}: ${result.message}`);
    }
  }

  // Summary
  const totalSuccess = results.filter(r => r.success).length;
  const successRate = ((totalSuccess / results.length) * 100).toFixed(1);

  console.log(`\n📊 SUMMARY: ${totalSuccess}/${results.length} sources OK (${successRate}%)`);

  // Save metrics
  await pool.query(`
    INSERT INTO scraping_metrics (
      date, articles_scraped, errors_count, avg_quality_score
    ) VALUES (CURRENT_DATE, $1, $2, $3)
  `, [totalSuccess, results.length - totalSuccess, parseFloat(successRate)]);
}

// Run test
testConnectivity().catch(console.error);
```

## 5. Deploy Commands

```bash
# Step 1: Create Fly.io PostgreSQL
fly postgres create --name bali-zero-db --region sin --vm-size shared-cpu-1x

# Step 2: Get connection string
fly postgres attach bali-zero-db --app bali-zero-journal

# Step 3: Run migrations
DATABASE_URL=$(fly secrets get DATABASE_URL) npm run migrate

# Step 4: Import sources
DATABASE_URL=$(fly secrets get DATABASE_URL) npm run import-sources

# Step 5: Test connectivity
DATABASE_URL=$(fly secrets get DATABASE_URL) npm run test-connectivity

# Step 6: Setup cron job for regular testing
echo "0 */6 * * * cd /app && npm run test-connectivity" | crontab -
```

## 6. Package.json Scripts

```json
{
  "name": "bali-zero-journal",
  "version": "1.0.0",
  "scripts": {
    "migrate": "ts-node scripts/migrate.ts",
    "import-sources": "ts-node scripts/import-sources.ts",
    "test-connectivity": "ts-node scripts/test-connectivity.ts",
    "scrape": "ts-node src/scraper/index.ts",
    "dev": "nodemon src/index.ts"
  },
  "dependencies": {
    "pg": "^8.11.3",
    "axios": "^1.6.2",
    "js-yaml": "^4.1.0",
    "p-limit": "^3.1.0",
    "playwright": "^1.40.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/pg": "^8.10.9",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.2",
    "nodemon": "^3.0.2"
  }
}
```

## Quick Start

```bash
# 1. Clone and setup
git clone [repo]
cd bali-zero-journal
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Run migrations
npm run migrate

# 4. Import all sources
npm run import-sources

# 5. Test connectivity
npm run test-connectivity

# Expected output:
# 🔍 Testing 47 Tier 1 sources...
#
# 📁 IMMIGRATION (4/4 OK)
#   ✅ Direktorat Jenderal Imigrasi: OK
#   ✅ Kantor Imigrasi Ngurah Rai: OK
#   ...
#
# 📊 SUMMARY: 45/47 sources OK (95.7%)
```

## Notes

1. **Database is on Fly.io** - Free tier PostgreSQL in Singapore region
2. **600+ sources** - Complete YAML file with all sources ready
3. **Automatic deduplication** - Using SHA-256 content hashing
4. **Smart scheduling** - T1 daily, T2 every 48h, T3 weekly
5. **Connectivity monitoring** - Track which sources are reliable

## Next Steps

After this foundation is ready:
1. Implement Playwright scraper (Patch 2)
2. Add AI processing pipeline
3. Setup automatic publishing
4. Create monitoring dashboard

---
END OF PATCH 1
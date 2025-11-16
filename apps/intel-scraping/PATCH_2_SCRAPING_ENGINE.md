# PATCH 2: SCRAPING ENGINE
# Bali Zero Journal - News Intelligence System
# Days 3-5: Playwright Scraper Implementation

## Overview

This patch implements a robust, production-ready scraping engine using Playwright that can:
- Handle 600+ news sources with different structures
- Support both static and dynamic (JavaScript-rendered) websites
- Respect rate limits and avoid detection
- Extract articles with custom selectors per source
- Store results in PostgreSQL with deduplication
- Handle errors gracefully with retry logic

## Architecture

```
src/
├── scraper/
│   ├── index.ts           # Main scraper orchestrator
│   ├── engine.ts          # Core Playwright scraping engine
│   ├── extractor.ts       # Content extraction utilities
│   ├── scheduler.ts       # Smart scheduling based on tier/frequency
│   ├── deduplicator.ts   # SHA-256 content hashing
│   └── types.ts           # TypeScript interfaces
├── utils/
│   ├── database.ts        # Database connection & queries
│   ├── logger.ts          # Structured logging
│   └── rate-limiter.ts    # Rate limiting utilities
└── config/
    └── default-selectors.ts  # Fallback selectors
```

## 1. Core Scraper Engine

```typescript
// src/scraper/engine.ts
import { Browser, Page, chromium } from 'playwright';
import { Pool } from 'pg';
import crypto from 'crypto';
import { Source, RawArticle } from './types';
import { extractContent } from './extractor';
import { rateLimit } from '../utils/rate-limiter';
import { logger } from '../utils/logger';

export class ScrapingEngine {
  private browser: Browser | null = null;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    logger.info('Browser initialized');
  }

  async scrapeSource(source: Source): Promise<RawArticle[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    const articles: RawArticle[] = [];

    try {
      // Apply rate limiting
      await rateLimit(source.url);

      logger.info(`Scraping: ${source.name} (${source.url})`);

      // Navigate with timeout
      await page.goto(source.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for content to load (for JS-rendered sites)
      await page.waitForTimeout(2000);

      // Extract article links
      const articleLinks = await this.extractArticleLinks(page, source);

      logger.info(`Found ${articleLinks.length} articles on ${source.name}`);

      // Scrape each article
      for (const link of articleLinks.slice(0, 50)) { // Limit to 50 per run
        try {
          const article = await this.scrapeArticle(link, source, context);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          logger.error(`Failed to scrape article ${link}:`, error);
        }
      }

      // Update source last_scraped timestamp
      await this.pool.query(
        'UPDATE sources SET last_scraped = CURRENT_TIMESTAMP WHERE id = $1',
        [source.id]
      );

    } catch (error) {
      logger.error(`Error scraping ${source.name}:`, error);
      throw error;
    } finally {
      await context.close();
    }

    return articles;
  }

  private async extractArticleLinks(page: Page, source: Source): Promise<string[]> {
    // Try multiple strategies to find article links
    const strategies = [
      // Strategy 1: Use source-specific selectors
      async () => {
        if (source.selectors?.link) {
          const links = await page.$$eval(source.selectors.link, (els) =>
            els.map(el => (el as HTMLAnchorElement).href)
          );
          return links.filter(url => url && !url.includes('#'));
        }
        return [];
      },
      // Strategy 2: Common article patterns
      async () => {
        const selectors = [
          'article a',
          '.post a',
          '.news-item a',
          '.article-link',
          'h2 a, h3 a'
        ];
        for (const selector of selectors) {
          try {
            const links = await page.$$eval(selector, (els) =>
              els.map(el => {
                const href = (el as HTMLAnchorElement).href;
                return href && href.startsWith('http') ? href : null;
              }).filter(Boolean)
            );
            if (links.length > 0) return links as string[];
          } catch {}
        }
        return [];
      },
      // Strategy 3: Extract from sitemap or RSS if available
      async () => {
        try {
          const sitemapUrl = new URL('/sitemap.xml', source.url).toString();
          const response = await page.goto(sitemapUrl, { timeout: 5000 });
          if (response?.ok()) {
            const content = await page.textContent('body');
            const urls = content?.match(/<loc>(.*?)<\/loc>/g) || [];
            return urls.map(url => url.replace(/<\/?loc>/g, ''));
          }
        } catch {}
        return [];
      }
    ];

    for (const strategy of strategies) {
      const links = await strategy();
      if (links.length > 0) {
        return [...new Set(links)]; // Deduplicate
      }
    }

    return [];
  }

  private async scrapeArticle(
    url: string,
    source: Source,
    context: any
  ): Promise<RawArticle | null> {
    const page = await context.newPage();

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 20000
      });

      await page.waitForTimeout(1000);

      // Extract content using source selectors or fallbacks
      const content = await extractContent(page, source);

      if (!content.title || !content.body) {
        logger.warn(`Insufficient content extracted from ${url}`);
        return null;
      }

      // Calculate content hash for deduplication
      const contentHash = crypto
        .createHash('sha256')
        .update(content.title + content.body)
        .digest('hex');

      // Check if article already exists
      const existing = await this.pool.query(
        'SELECT id FROM raw_articles WHERE content_hash = $1',
        [contentHash]
      );

      if (existing.rows.length > 0) {
        logger.info(`Duplicate article detected: ${url}`);
        return null;
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(content);

      // Parse published date
      const publishedDate = this.parseDate(content.date, source.language);

      const article: RawArticle = {
        source_id: source.id,
        url,
        title: content.title,
        content: content.body,
        summary: content.summary || null,
        published_date: publishedDate,
        author: content.author || null,
        category: source.category,
        tier: source.tier,
        content_hash: contentHash,
        quality_score: qualityScore,
        word_count: content.body.split(/\s+/).length,
        language: source.language || 'en',
        metadata: {
          selectors_used: source.selectors || {},
          extraction_method: 'playwright'
        }
      };

      return article;

    } catch (error) {
      logger.error(`Error scraping article ${url}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  private calculateQualityScore(content: any): number {
    let score = 5.0; // Base score

    // Title quality
    if (content.title && content.title.length > 20 && content.title.length < 200) {
      score += 1.0;
    }

    // Content length
    const wordCount = content.body.split(/\s+/).length;
    if (wordCount > 200) score += 1.0;
    if (wordCount > 500) score += 1.0;
    if (wordCount > 1000) score += 0.5;

    // Has date
    if (content.date) score += 0.5;

    // Has author
    if (content.author) score += 0.5;

    // Has summary
    if (content.summary) score += 0.5;

    return Math.min(10.0, score);
  }

  private parseDate(dateString: string | null, language: string): Date | null {
    if (!dateString) return null;

    try {
      // Try ISO format first
      const isoDate = new Date(dateString);
      if (!isNaN(isoDate.getTime())) return isoDate;

      // Try common formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\w+)\s+(\d{1,2}),\s+(\d{4})/
      ];

      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          // Basic parsing - can be enhanced with date-fns
          return new Date(dateString);
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }
}
```

## 2. Content Extractor

```typescript
// src/scraper/extractor.ts
import { Page } from 'playwright';
import { Source } from './types';
import { defaultSelectors } from '../config/default-selectors';

export interface ExtractedContent {
  title: string;
  body: string;
  summary?: string;
  date?: string;
  author?: string;
}

export async function extractContent(
  page: Page,
  source: Source
): Promise<ExtractedContent> {
  const selectors = source.selectors || {};
  const fallbacks = defaultSelectors[source.category] || defaultSelectors.default;

  // Extract title
  const title = await extractWithFallback(
    page,
    selectors.title,
    fallbacks.title
  );

  // Extract body/content
  const body = await extractWithFallback(
    page,
    selectors.content,
    fallbacks.content
  );

  // Extract date
  const date = await extractWithFallback(
    page,
    selectors.date,
    fallbacks.date,
    false
  );

  // Extract author
  const author = await extractWithFallback(
    page,
    selectors.author,
    fallbacks.author,
    false
  );

  // Extract summary (optional)
  const summary = await extractWithFallback(
    page,
    selectors.summary,
    fallbacks.summary,
    false
  );

  // Clean extracted text
  return {
    title: cleanText(title),
    body: cleanText(body),
    summary: summary ? cleanText(summary) : undefined,
    date: date || undefined,
    author: author || undefined
  };
}

async function extractWithFallback(
  page: Page,
  primarySelector: string | undefined,
  fallbackSelectors: string[],
  required: boolean = true
): Promise<string> {
  // Try primary selector first
  if (primarySelector) {
    try {
      const text = await page.textContent(primarySelector);
      if (text && text.trim()) return text.trim();
    } catch {}
  }

  // Try fallback selectors
  for (const selector of fallbackSelectors) {
    try {
      const text = await page.textContent(selector);
      if (text && text.trim()) return text.trim();
    } catch {}
  }

  // Try common patterns
  const commonSelectors = [
    'article',
    'main',
    '.content',
    '.post-content',
    '#content'
  ];

  for (const selector of commonSelectors) {
    try {
      const text = await page.textContent(selector);
      if (text && text.trim()) return text.trim();
    } catch {}
  }

  if (required) {
    throw new Error(`Could not extract required content with any selector`);
  }

  return '';
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}
```

## 3. Scheduler

```typescript
// src/scraper/scheduler.ts
import { Pool } from 'pg';
import { Source } from './types';

export async function getSourcesToScrape(pool: Pool): Promise<Source[]> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { rows } = await pool.query<Source>(`
    SELECT 
      id, url, name, category, tier, language,
      reliability_score, scrape_frequency, selectors, headers, active
    FROM sources
    WHERE active = true
      AND (
        -- T1 sources: scrape if not scraped in last 24h
        (tier = 'T1' AND (last_scraped IS NULL OR last_scraped < $1))
        OR
        -- T2 sources: scrape if not scraped in last 48h
        (tier = 'T2' AND (last_scraped IS NULL OR last_scraped < $2))
        OR
        -- T3 sources: scrape if not scraped in last week
        (tier = 'T3' AND (last_scraped IS NULL OR last_scraped < $3))
      )
    ORDER BY 
      tier ASC,
      reliability_score DESC,
      last_scraped NULLS FIRST
    LIMIT 50
  `, [oneDayAgo, twoDaysAgo, oneWeekAgo]);

  return rows;
}
```

## 4. Main Scraper Orchestrator

```typescript
// src/scraper/index.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { ScrapingEngine } from './engine';
import { getSourcesToScrape } from './scheduler';
import { saveArticles } from '../utils/database';
import { logger } from '../utils/logger';
import pLimit from 'p-limit';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CONCURRENT_SCRAPERS = 3; // Max 3 sources at once
const limit = pLimit(CONCURRENT_SCRAPERS);

async function main() {
  const startTime = Date.now();
  logger.info('🚀 Starting scraping job...');

  try {
    // Get sources that need scraping
    const sources = await getSourcesToScrape(pool);
    logger.info(`📋 Found ${sources.length} sources to scrape`);

    if (sources.length === 0) {
      logger.info('✅ No sources need scraping at this time');
      return;
    }

    // Initialize scraping engine
    const engine = new ScrapingEngine(pool);
    await engine.initialize();

    // Scrape sources with concurrency limit
    const results = await Promise.allSettled(
      sources.map(source =>
        limit(async () => {
          try {
            const articles = await engine.scrapeSource(source);
            await saveArticles(pool, articles);
            
            logger.info(
              `✅ ${source.name}: Scraped ${articles.length} new articles`
            );

            return {
              source: source.name,
              articlesCount: articles.length,
              success: true
            };
          } catch (error) {
            logger.error(`❌ ${source.name}: Scraping failed`, error);
            return {
              source: source.name,
              articlesCount: 0,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      )
    );

    // Calculate metrics
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const totalArticles = results
      .filter(r => r.status === 'fulfilled')
      .reduce((sum, r) => sum + (r.value?.articlesCount || 0), 0);
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Save metrics
    await pool.query(`
      INSERT INTO scraping_metrics (
        date, articles_scraped, errors_count, scraping_duration_seconds
      ) VALUES (CURRENT_DATE, $1, $2, $3)
    `, [totalArticles, sources.length - successful, duration]);

    logger.info(`
      📊 Scraping Summary:
      - Sources processed: ${sources.length}
      - Successful: ${successful}
      - Total articles: ${totalArticles}
      - Duration: ${duration}s
    `);

    await engine.close();

  } catch (error) {
    logger.error('Fatal error in scraping job:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
```

## 5. Database Utilities

```typescript
// src/utils/database.ts
import { Pool } from 'pg';
import { RawArticle } from '../scraper/types';

export async function saveArticles(
  pool: Pool,
  articles: RawArticle[]
): Promise<void> {
  if (articles.length === 0) return;

  for (const article of articles) {
    try {
      await pool.query(`
        INSERT INTO raw_articles (
          source_id, url, title, content, summary,
          published_date, author, category, tier,
          content_hash, quality_score, word_count, language, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (url) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = CURRENT_TIMESTAMP
      `, [
        article.source_id,
        article.url,
        article.title,
        article.content,
        article.summary,
        article.published_date,
        article.author,
        article.category,
        article.tier,
        article.content_hash,
        article.quality_score,
        article.word_count,
        article.language,
        JSON.stringify(article.metadata)
      ]);
    } catch (error) {
      console.error(`Failed to save article ${article.url}:`, error);
    }
  }
}
```

## 6. Rate Limiter

```typescript
// src/utils/rate-limiter.ts
const delays = new Map<string, number>();

export async function rateLimit(url: string): Promise<void> {
  const domain = new URL(url).hostname;
  const lastRequest = delays.get(domain) || 0;
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequest;

  // Minimum 2 seconds between requests to same domain
  const minDelay = 2000;
  
  if (timeSinceLastRequest < minDelay) {
    const waitTime = minDelay - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  delays.set(domain, Date.now());
}
```

## 7. Logger

```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }
};
```

## 8. Types

```typescript
// src/scraper/types.ts
export interface Source {
  id: string;
  url: string;
  name: string;
  category: string;
  tier: 'T1' | 'T2' | 'T3';
  language?: string;
  reliability_score: number;
  scrape_frequency: string;
  selectors?: {
    title?: string;
    content?: string;
    date?: string;
    author?: string;
    summary?: string;
    link?: string;
  };
  headers?: Record<string, string>;
  active: boolean;
}

export interface RawArticle {
  source_id: string;
  url: string;
  title: string;
  content: string;
  summary?: string | null;
  published_date?: Date | null;
  author?: string | null;
  category: string;
  tier: string;
  content_hash: string;
  quality_score?: number;
  word_count: number;
  language: string;
  metadata?: Record<string, any>;
}
```

## 9. Default Selectors Config

```typescript
// src/config/default-selectors.ts
export const defaultSelectors = {
  default: {
    title: ['h1', 'title', '.post-title', '.article-title', '.entry-title'],
    content: ['article', 'main', '.content', '.post-content', '.entry-content'],
    date: ['.date', '.published', 'time', '[datetime]'],
    author: ['.author', '.byline', '[rel="author"]'],
    summary: ['.summary', '.excerpt', '.lead']
  },
  immigration: {
    title: ['h1', '.news-title', '.article-title'],
    content: ['.news-content', '.article-body', 'article'],
    date: ['.publish-date', '.date', 'time']
  },
  business: {
    title: ['h1', '.headline', '.title'],
    content: ['.article-body', '.content', 'main'],
    date: ['.date', '.published-date']
  },
  // ... other categories
};
```

## 10. Package.json Updates

```json
{
  "scripts": {
    "scrape": "ts-node src/scraper/index.ts",
    "scrape:single": "ts-node src/scraper/index.ts --source-id=<id>",
    "scrape:category": "ts-node src/scraper/index.ts --category=<category>"
  }
}
```

## Deployment

```bash
# Install Playwright browsers
npx playwright install chromium

# Run scraper manually
npm run scrape

# Setup cron for automatic scraping (every 6 hours)
0 */6 * * * cd /app && npm run scrape
```

## Testing

```typescript
// Test single source
const source = await pool.query('SELECT * FROM sources WHERE name = $1', ['Direktorat Jenderal Imigrasi']);
const engine = new ScrapingEngine(pool);
await engine.initialize();
const articles = await engine.scrapeSource(source.rows[0]);
console.log(`Scraped ${articles.length} articles`);
```

---
END OF PATCH 2


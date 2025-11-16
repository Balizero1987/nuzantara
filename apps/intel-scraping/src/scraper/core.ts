import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Pool } from 'pg';
import crypto from 'crypto';
import pLimit from 'p-limit';
import { exponentialBackoff } from './utils/retry';
import { ProxyRotator } from './utils/proxy';
import { ContentParser } from './parsers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export interface ScraperConfig {
  maxConcurrent: number;
  retryAttempts: number;
  screenshotOnError: boolean;
  proxyEnabled: boolean;
  headless: boolean;
  userAgentRotation: boolean;
  timeout: number;
}

export class BaliZeroScraper {
  private browser: Browser | null = null;
  private pool: Pool;
  private config: ScraperConfig;
  private proxyRotator: ProxyRotator;
  private parser: ContentParser;
  private limitConcurrency: any;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      maxConcurrent: 10,
      retryAttempts: 3,
      screenshotOnError: true,
      proxyEnabled: true,
      headless: true,
      userAgentRotation: true,
      timeout: 30000,
      ...config
    };

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.proxyRotator = new ProxyRotator();
    this.parser = new ContentParser();
    this.limitConcurrency = pLimit(this.config.maxConcurrent);
  }

  async initialize() {
    console.log('🚀 Initializing Bali Zero Scraper...');

    // Launch browser with stealth settings
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    console.log('✅ Browser launched successfully');
  }

  async scrapeSource(sourceId: string) {
    const { rows: [source] } = await this.pool.query(
      'SELECT * FROM sources WHERE id = $1 AND active = true',
      [sourceId]
    );

    if (!source) {
      throw new Error(`Source ${sourceId} not found or inactive`);
    }

    return exponentialBackoff(
      () => this.scrapeWithRetry(source),
      this.config.retryAttempts
    );
  }

  private async scrapeWithRetry(source: any) {
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Create context with proxy if enabled
      const contextOptions: any = {
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: source.language === 'id' ? 'id-ID' : 'en-US',
        timezoneId: 'Asia/Jakarta',
      };

      if (this.config.proxyEnabled) {
        const proxy = await this.proxyRotator.getNext();
        if (proxy) {
          contextOptions.proxy = proxy;
        }
      }

      context = await this.browser!.newContext(contextOptions);

      // Set additional headers to avoid detection
      if (context) {
        await context.setExtraHTTPHeaders({
          'Accept-Language': source.language === 'id' ? 'id-ID,id;q=0.9' : 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        });

        page = await context.newPage();
      } else {
        throw new Error('Failed to create browser context');
      }

      // Inject anti-detection scripts
      await page.addInitScript(() => {
        // Override navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });

        // Mock Chrome object
        (window as any).chrome = {
          runtime: {},
        };

        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: 'denied' } as PermissionStatus)
            : originalQuery(parameters);
      });

      // Navigate with timeout
      console.log(`📄 Scraping: ${source.name} (${source.url})`);

      const response = await page.goto(source.url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout,
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: ${response?.status()}`);
      }

      // Wait for content based on selectors
      if (source.selectors?.content) {
        try {
          await page.waitForSelector(source.selectors.content, {
            timeout: 10000
          });
        } catch {
          console.warn(`⚠️ Content selector not found, proceeding with fallback`);
        }
      }

      // Random delay to mimic human behavior
      await this.humanDelay();

      // Extract articles based on category
      const articles = await this.extractArticles(page, source);

      // Save articles to database
      const savedCount = await this.saveArticles(articles, source);

      // Update source last_scraped
      await this.pool.query(
        'UPDATE sources SET last_scraped = CURRENT_TIMESTAMP WHERE id = $1',
        [source.id]
      );

      console.log(`✅ Scraped ${savedCount} articles from ${source.name}`);
      return { success: true, count: savedCount };

    } catch (error) {
      console.error(`❌ Error scraping ${source.name}:`, error);

      // Take screenshot if enabled
      if (this.config.screenshotOnError && page) {
        await this.captureErrorScreenshot(page, source.name);
      }

      throw error;

    } finally {
      if (page) await page.close();
      if (context) await context.close();
    }
  }

  private async extractArticles(page: Page, source: any): Promise<any[]> {
    const articles = [];

    // Strategy 1: Use provided selectors
    if (source.selectors?.title && source.selectors?.content) {
      try {
        const articleElements = await page.$$eval(
          source.selectors.title,
          (elements, selectors) => {
            return elements.slice(0, 20).map(el => {
              const titleEl = el;
              const contentEl = document.querySelector(selectors.content);
              const dateEl = selectors.date ? document.querySelector(selectors.date) : null;

              return {
                title: titleEl?.textContent?.trim() || '',
                content: contentEl?.textContent?.trim() || '',
                date: dateEl?.textContent?.trim() || '',
                url: (titleEl as HTMLAnchorElement)?.href || window.location.href,
              };
            });
          },
          source.selectors
        );

        articles.push(...articleElements);
      } catch (error) {
        console.warn('Failed to extract with provided selectors:', error);
      }
    }

    // Strategy 2: Smart content detection fallback
    if (articles.length === 0) {
      const smartArticles = await this.parser.smartExtract(page, source.category);
      articles.push(...smartArticles);
    }

    // Strategy 3: Category-specific extractors
    if (articles.length === 0) {
      const categoryArticles = await this.extractByCategory(page, source);
      articles.push(...categoryArticles);
    }

    return articles.filter(a => a.title && a.content);
  }

  private async extractByCategory(page: Page, source: any): Promise<any[]> {
    switch (source.category) {
      case 'immigration':
        return this.extractImmigrationNews(page);
      case 'business':
        return this.extractBusinessNews(page);
      case 'tax':
        return this.extractTaxNews(page);
      case 'property':
        return this.extractPropertyNews(page);
      case 'bali_news':
        return this.extractBaliNews(page);
      case 'ai_indonesia':
        return this.extractTechNews(page);
      case 'finance':
        return this.extractFinanceNews(page);
      default:
        return [];
    }
  }

  private async extractImmigrationNews(page: Page): Promise<any[]> {
    // Immigration-specific patterns
    const patterns = [
      'visa', 'permit', 'immigration', 'kitas', 'kitap', 'voa',
      'passport', 'extension', 'overstay', 'deportation'
    ];

    return page.$$eval(
      'article, .news-item, .post, [class*="news"], [class*="article"]',
      (elements, patterns) => {
        return elements
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return patterns.some(pattern => text.includes(pattern));
          })
          .slice(0, 10)
          .map(el => ({
            title: el.querySelector('h1, h2, h3, .title')?.textContent?.trim() || '',
            content: el.textContent?.trim() || '',
            url: el.querySelector('a')?.href || window.location.href,
            date: el.querySelector('[class*="date"], time')?.textContent?.trim() || ''
          }));
      },
      patterns
    ).catch(() => []);
  }

  private async extractBusinessNews(page: Page): Promise<any[]> {
    const patterns = [
      'oss', 'business', 'license', 'company', 'pt', 'pma',
      'investment', 'bkpm', 'registration', 'permit'
    ];

    return page.$$eval(
      'article, .news-item, .post',
      (elements, patterns) => {
        return elements
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return patterns.some(pattern => text.includes(pattern));
          })
          .slice(0, 10)
          .map(el => ({
            title: el.querySelector('h1, h2, h3')?.textContent?.trim() || '',
            content: el.textContent?.trim() || '',
            url: el.querySelector('a')?.href || window.location.href,
            date: el.querySelector('time, .date')?.textContent?.trim() || ''
          }));
      },
      patterns
    ).catch(() => []);
  }

  // Similar methods for other categories...
  private async extractTaxNews(page: Page): Promise<any[]> {
    return this.extractGenericNews(page, ['tax', 'pajak', 'npwp', 'spt', 'fiscal']);
  }

  private async extractPropertyNews(page: Page): Promise<any[]> {
    return this.extractGenericNews(page, ['property', 'real estate', 'land', 'hgb', 'shm']);
  }

  private async extractBaliNews(page: Page): Promise<any[]> {
    return this.extractGenericNews(page, ['bali', 'denpasar', 'ubud', 'seminyak', 'canggu']);
  }

  private async extractTechNews(page: Page): Promise<any[]> {
    return this.extractGenericNews(page, ['ai', 'artificial intelligence', 'startup', 'technology']);
  }

  private async extractFinanceNews(page: Page): Promise<any[]> {
    return this.extractGenericNews(page, ['bank', 'finance', 'investment', 'ojk', 'rupiah']);
  }

  private async extractGenericNews(page: Page, keywords: string[]): Promise<any[]> {
    return page.$$eval(
      'article, .post, .news-item, [class*="article"]',
      (elements, keywords) => {
        return elements
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return keywords.some(keyword => text.includes(keyword));
          })
          .slice(0, 10)
          .map(el => ({
            title: el.querySelector('h1, h2, h3, .title')?.textContent?.trim() || '',
            content: el.textContent?.trim() || '',
            url: el.querySelector('a')?.href || window.location.href,
            date: el.querySelector('time, .date')?.textContent?.trim() || ''
          }));
      },
      keywords
    ).catch(() => []);
  }

  private async saveArticles(articles: any[], source: any): Promise<number> {
    let savedCount = 0;

    for (const article of articles) {
      try {
        // Generate content hash for deduplication
        const contentHash = crypto
          .createHash('sha256')
          .update(article.title + article.content)
          .digest('hex');

        // Calculate quality score
        const qualityScore = this.calculateQualityScore(article, source);

        // Skip low quality articles
        if (qualityScore < 5) continue;

        // Check if article already exists by content_hash
        const existing = await this.pool.query(
          'SELECT id FROM raw_articles WHERE content_hash = $1',
          [contentHash]
        );

        if (existing.rows.length > 0) {
          continue; // Skip duplicate
        }

        // Save to database
        await this.pool.query(`
          INSERT INTO raw_articles (
            source_id, url, title, content, summary,
            published_date, author, category, tier,
            content_hash, quality_score, word_count, language
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (url) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            updated_at = CURRENT_TIMESTAMP
        `, [
          source.id,
          article.url || source.url,
          article.title,
          article.content,
          article.content.substring(0, 300),
          this.parseDate(article.date),
          article.author || null,
          source.category,
          source.tier,
          contentHash,
          qualityScore,
          article.content.split(' ').length,
          source.language
        ]);

        savedCount++;
      } catch (error) {
        console.error(`Failed to save article: ${article.title}`, error);
      }
    }

    return savedCount;
  }

  private calculateQualityScore(article: any, source: any): number {
    let score = source.reliability_score || 5;

    // Adjust based on content quality
    if (article.content.length < 200) score -= 2;
    if (article.content.length > 1000) score += 1;
    if (!article.date) score -= 1;
    if (article.author) score += 0.5;

    // Check for keywords relevance
    const categoryKeywords = this.getCategoryKeywords(source.category);
    const contentLower = article.content.toLowerCase();
    const keywordMatches = categoryKeywords.filter(k => contentLower.includes(k)).length;
    score += Math.min(keywordMatches * 0.5, 2);

    return Math.max(0, Math.min(10, score));
  }

  private getCategoryKeywords(category: string): string[] {
    const keywords: Record<string, string[]> = {
      immigration: ['visa', 'permit', 'immigration', 'kitas', 'passport'],
      business: ['business', 'company', 'license', 'oss', 'investment'],
      tax: ['tax', 'pajak', 'fiscal', 'npwp', 'spt'],
      property: ['property', 'land', 'real estate', 'ownership', 'lease'],
      bali_news: ['bali', 'tourism', 'culture', 'event', 'denpasar'],
      ai_indonesia: ['ai', 'technology', 'startup', 'digital', 'innovation'],
      finance: ['bank', 'finance', 'investment', 'economy', 'rupiah'],
    };

    return keywords[category] || [];
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
      // Handle Indonesian date formats
      const indonesianMonths: Record<string, string> = {
        'januari': '01', 'februari': '02', 'maret': '03',
        'april': '04', 'mei': '05', 'juni': '06',
        'juli': '07', 'agustus': '08', 'september': '09',
        'oktober': '10', 'november': '11', 'desember': '12'
      };

      let normalized = dateStr.toLowerCase();
      for (const [indo, num] of Object.entries(indonesianMonths)) {
        normalized = normalized.replace(indo, num);
      }

      const parsed = new Date(normalized);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  private async captureErrorScreenshot(page: Page, sourceName: string) {
    try {
      const screenshotsDir = path.join(process.cwd(), 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(screenshotsDir, `error-${sourceName}-${timestamp}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  }

  private async humanDelay() {
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    await this.pool.end();
  }
}


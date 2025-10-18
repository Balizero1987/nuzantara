/**
 * OSS Scraper - Real-time monitoring of Indonesia's Online Single Submission system
 * Monitors announcements, system changes, and regulatory updates
 */

import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as cron from 'node-cron';
import { createHash } from 'crypto';

interface OSSUpdate {
  id: string;
  timestamp: Date;
  type: 'announcement' | 'system' | 'regulation' | 'maintenance';
  title: string;
  content: string;
  url?: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  affectedServices?: string[];
  actionRequired?: string;
  source: string;
}

interface ScraperConfig {
  baseUrl: string;
  sections: string[];
  frequency: string;
  method: 'puppeteer' | 'axios';
  requiresAuth: boolean;
}

export class OSSScraper {
  private browser: puppeteer.Browser | null = null;
  private updates: Map<string, OSSUpdate> = new Map();
  private lastCheck: Map<string, Date> = new Map();
  private subscribers: ((update: OSSUpdate) => void)[] = [];

  // OSS Ecosystem URLs
  private readonly sources: Map<string, ScraperConfig> = new Map([
    ['oss-main', {
      baseUrl: 'https://oss.go.id',
      sections: [
        '/informasi/pengumuman',
        '/informasi/berita',
        '/informasi/panduan',
        '/informasi/regulasi'
      ],
      frequency: '0 */2 * * *', // Every 2 hours
      method: 'puppeteer',
      requiresAuth: false
    }],
    ['oss-rba', {
      baseUrl: 'https://oss-rba.go.id',
      sections: [
        '/announcement',
        '/regulation-update'
      ],
      frequency: '0 */4 * * *', // Every 4 hours
      method: 'axios',
      requiresAuth: false
    }],
    ['bkpm', {
      baseUrl: 'https://www.bkpm.go.id',
      sections: [
        '/id/publikasi/siaran-pers',
        '/id/publikasi/detail/peraturan',
        '/id/layanan/daftar-negatif-investasi'
      ],
      frequency: '0 */6 * * *', // Every 6 hours
      method: 'axios',
      requiresAuth: false
    }],
    ['kemenkumham', {
      baseUrl: 'https://www.kemenkumham.go.id',
      sections: [
        '/berita/berita-utama',
        '/peraturan'
      ],
      frequency: '0 0 */1 * *', // Daily
      method: 'axios',
      requiresAuth: false
    }]
  ]);

  constructor() {
    this.initializeScheduler();
  }

  /**
   * Initialize cron jobs for each source
   */
  private initializeScheduler() {
    this.sources.forEach((config, name) => {
      cron.schedule(config.frequency, async () => {
        console.log(`[OSS Scraper] Running scheduled scrape for ${name}`);
        await this.scrapeSource(name, config);
      });
    });

    // Immediate first run
    this.runInitialScrape();
  }

  /**
   * Run initial scrape on startup
   */
  private async runInitialScrape() {
    console.log('[OSS Scraper] Starting initial scrape...');

    for (const [name, config] of this.sources) {
      await this.scrapeSource(name, config);
      // Add delay to avoid overwhelming servers
      await this.delay(5000);
    }
  }

  /**
   * Scrape a specific source
   */
  private async scrapeSource(name: string, config: ScraperConfig) {
    try {
      if (config.method === 'puppeteer') {
        await this.scrapePuppeteer(name, config);
      } else {
        await this.scrapeAxios(name, config);
      }

      this.lastCheck.set(name, new Date());
    } catch (error) {
      console.error(`[OSS Scraper] Error scraping ${name}:`, error);
      this.notifyError(name, error);
    }
  }

  /**
   * Scrape using Puppeteer (for JS-heavy sites)
   */
  private async scrapePuppeteer(name: string, config: ScraperConfig) {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await this.browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    for (const section of config.sections) {
      try {
        const url = `${config.baseUrl}${section}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for content to load
        await page.waitForSelector('body', { timeout: 10000 });

        // Extract announcements/news
        const updates = await page.evaluate(() => {
          const items: any[] = [];

          // Try multiple selectors for flexibility
          const selectors = [
            'article',
            '.news-item',
            '.announcement',
            '.post',
            '.content-item'
          ];

          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              elements.forEach(el => {
                const title = el.querySelector('h2, h3, h4, .title')?.textContent?.trim();
                const content = el.querySelector('p, .content, .excerpt')?.textContent?.trim();
                const link = el.querySelector('a')?.href;
                const date = el.querySelector('.date, time')?.textContent?.trim();

                if (title) {
                  items.push({
                    title,
                    content: content || '',
                    url: link,
                    date: date || new Date().toISOString()
                  });
                }
              });
              break;
            }
          }

          return items;
        });

        // Process updates
        for (const update of updates) {
          await this.processUpdate(name, section, update);
        }

      } catch (error) {
        console.error(`[OSS Scraper] Error scraping ${url}:`, error);
      }
    }

    await page.close();
  }

  /**
   * Scrape using Axios (for simple HTML)
   */
  private async scrapeAxios(name: string, config: ScraperConfig) {
    for (const section of config.sections) {
      try {
        const url = `${config.baseUrl}${section}`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BaliZero-Bot/1.0)'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);

        // Extract content based on common patterns
        const updates: any[] = [];

        // Try multiple selectors
        $('article, .news-item, .announcement, .post').each((i, elem) => {
          const title = $(elem).find('h2, h3, h4, .title').first().text().trim();
          const content = $(elem).find('p, .content, .excerpt').first().text().trim();
          const link = $(elem).find('a').first().attr('href');
          const date = $(elem).find('.date, time').first().text().trim();

          if (title) {
            updates.push({
              title,
              content: content || '',
              url: link ? this.resolveUrl(config.baseUrl, link) : undefined,
              date: date || new Date().toISOString()
            });
          }
        });

        // Process updates
        for (const update of updates) {
          await this.processUpdate(name, section, update);
        }

      } catch (error) {
        console.error(`[OSS Scraper] Error scraping ${url}:`, error);
      }
    }
  }

  /**
   * Process and store update
   */
  private async processUpdate(source: string, section: string, data: any) {
    // Generate unique ID
    const id = this.generateId(source, data.title);

    // Check if already processed
    if (this.updates.has(id)) {
      return;
    }

    // Classify update
    const type = this.classifyUpdate(data.title, data.content);
    const impact = this.assessImpact(data.title, data.content);

    const update: OSSUpdate = {
      id,
      timestamp: new Date(),
      type,
      title: data.title,
      content: data.content,
      url: data.url,
      impact,
      source: `${source}${section}`,
      affectedServices: this.identifyAffectedServices(data.content),
      actionRequired: this.identifyActionRequired(data.title, data.content)
    };

    // Store update
    this.updates.set(id, update);

    // Notify subscribers
    this.notifySubscribers(update);

    // Log critical updates
    if (impact === 'critical') {
      console.log(`[OSS Scraper] CRITICAL UPDATE: ${data.title}`);
    }
  }

  /**
   * Classify update type based on content
   */
  private classifyUpdate(title: string, content: string): OSSUpdate['type'] {
    const text = `${title} ${content}`.toLowerCase();

    if (text.includes('maintenance') || text.includes('pemeliharaan')) {
      return 'maintenance';
    }
    if (text.includes('regulation') || text.includes('peraturan') || text.includes('perpres')) {
      return 'regulation';
    }
    if (text.includes('system') || text.includes('sistem') || text.includes('update')) {
      return 'system';
    }

    return 'announcement';
  }

  /**
   * Assess impact level
   */
  private assessImpact(title: string, content: string): OSSUpdate['impact'] {
    const text = `${title} ${content}`.toLowerCase();

    // Critical keywords
    if (text.includes('urgent') || text.includes('immediately') ||
        text.includes('segera') || text.includes('penting')) {
      return 'critical';
    }

    // High impact keywords
    if (text.includes('new requirement') || text.includes('mandatory') ||
        text.includes('wajib') || text.includes('harus')) {
      return 'high';
    }

    // Medium impact
    if (text.includes('update') || text.includes('change') ||
        text.includes('perubahan') || text.includes('pembaruan')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Identify affected services
   */
  private identifyAffectedServices(content: string): string[] {
    const services: string[] = [];
    const text = content.toLowerCase();

    if (text.includes('nib')) services.push('NIB');
    if (text.includes('kbli')) services.push('KBLI');
    if (text.includes('api')) services.push('API');
    if (text.includes('login') || text.includes('authentication')) services.push('Authentication');
    if (text.includes('payment') || text.includes('pembayaran')) services.push('Payment');
    if (text.includes('document') || text.includes('dokumen')) services.push('Documents');

    return services;
  }

  /**
   * Identify required actions
   */
  private identifyActionRequired(title: string, content: string): string | undefined {
    const text = `${title} ${content}`.toLowerCase();

    if (text.includes('re-register') || text.includes('daftar ulang')) {
      return 'Re-registration required';
    }
    if (text.includes('update profile') || text.includes('perbarui profil')) {
      return 'Profile update required';
    }
    if (text.includes('new document') || text.includes('dokumen baru')) {
      return 'New documentation required';
    }
    if (text.includes('deadline') || text.includes('batas waktu')) {
      return 'Action required before deadline';
    }

    return undefined;
  }

  /**
   * Generate unique ID for update
   */
  private generateId(source: string, title: string): string {
    return createHash('md5').update(`${source}-${title}`).digest('hex');
  }

  /**
   * Resolve relative URLs
   */
  private resolveUrl(base: string, relative: string): string {
    if (relative.startsWith('http')) return relative;
    return new URL(relative, base).href;
  }

  /**
   * Notify subscribers of new update
   */
  private notifySubscribers(update: OSSUpdate) {
    this.subscribers.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('[OSS Scraper] Subscriber notification error:', error);
      }
    });
  }

  /**
   * Subscribe to updates
   */
  public subscribe(callback: (update: OSSUpdate) => void) {
    this.subscribers.push(callback);
  }

  /**
   * Get recent updates
   */
  public getRecentUpdates(hours: number = 24): OSSUpdate[] {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return Array.from(this.updates.values())
      .filter(update => update.timestamp > since)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get updates by type
   */
  public getUpdatesByType(type: OSSUpdate['type']): OSSUpdate[] {
    return Array.from(this.updates.values())
      .filter(update => update.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get critical updates
   */
  public getCriticalUpdates(): OSSUpdate[] {
    return Array.from(this.updates.values())
      .filter(update => update.impact === 'critical' || update.impact === 'high')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check OSS system status
   */
  public async checkSystemStatus(): Promise<{
    online: boolean;
    responseTime: number;
    lastCheck: Date;
    issues: string[];
  }> {
    const start = Date.now();
    const issues: string[] = [];
    let online = false;

    try {
      const response = await axios.get('https://oss.go.id', {
        timeout: 10000
      });

      online = response.status === 200;

      // Check for common issues
      const html = response.data.toLowerCase();
      if (html.includes('maintenance')) issues.push('System under maintenance');
      if (html.includes('error')) issues.push('Error messages detected');
      if (html.includes('gangguan')) issues.push('Service disruption reported');

    } catch (error) {
      online = false;
      issues.push('System unreachable');
    }

    return {
      online,
      responseTime: Date.now() - start,
      lastCheck: new Date(),
      issues
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Notify error to monitoring
   */
  private notifyError(source: string, error: any) {
    console.error(`[OSS Scraper] Error in ${source}:`, error.message);
    // Could integrate with error tracking service
  }

  /**
   * Cleanup resources
   */
  public async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Handler for ZANTARA integration
export async function handleOSSQuery(params: any): Promise<any> {
  const scraper = new OSSScraper();

  if (params.action === 'recent') {
    return scraper.getRecentUpdates(params.hours || 24);
  }

  if (params.action === 'critical') {
    return scraper.getCriticalUpdates();
  }

  if (params.action === 'status') {
    return await scraper.checkSystemStatus();
  }

  if (params.type) {
    return scraper.getUpdatesByType(params.type);
  }

  return {
    error: 'Please specify action: recent, critical, status, or type'
  };
}
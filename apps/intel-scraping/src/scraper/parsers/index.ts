import { Page } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export class ContentParser {
  async smartExtract(page: Page, category: string): Promise<any[]> {
    const html = await page.content();
    const articles: any[] = [];

    try {
      // Strategy 1: Use Readability for article extraction
      const doc = new JSDOM(html, { url: page.url() });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();

      if (article) {
        articles.push({
          title: article.title,
          content: article.textContent,
          url: page.url(),
          date: await this.extractDate(page)
        });
      }
    } catch (error) {
      console.error('Readability parsing failed:', error);
    }

    // Strategy 2: Pattern-based extraction
    if (articles.length === 0) {
      const patternArticles = await this.extractByPatterns(page);
      articles.push(...patternArticles);
    }

    // Strategy 3: JSON-LD structured data
    const structuredData = await this.extractStructuredData(page);
    if (structuredData.length > 0) {
      articles.push(...structuredData);
    }

    return articles;
  }

  private async extractByPatterns(page: Page): Promise<any[]> {
    // Common article patterns
    const patterns = [
      { title: 'h1', content: 'article', date: 'time' },
      { title: '.post-title', content: '.post-content', date: '.post-date' },
      { title: '.entry-title', content: '.entry-content', date: '.entry-date' },
      { title: '[itemprop="headline"]', content: '[itemprop="articleBody"]', date: '[itemprop="datePublished"]' },
    ];

    for (const pattern of patterns) {
      try {
        const exists = await page.$(pattern.title);
        if (!exists) continue;

        const articles = await page.$$eval(
          pattern.title,
          (elements, pattern) => {
            return elements.slice(0, 10).map(titleEl => {
              const container = titleEl.closest('article') || document;
              const contentEl = container.querySelector(pattern.content);
              const dateEl = container.querySelector(pattern.date);

              return {
                title: titleEl.textContent?.trim() || '',
                content: contentEl?.textContent?.trim() || '',
                date: dateEl?.textContent?.trim() || '',
                url: (titleEl as HTMLAnchorElement)?.href || window.location.href
              };
            });
          },
          pattern
        );

        if (articles.length > 0) {
          return articles.filter(a => a.title && a.content);
        }
      } catch {
        continue;
      }
    }

    return [];
  }

  private async extractStructuredData(page: Page): Promise<any[]> {
    const structuredData = await page.$$eval(
      'script[type="application/ld+json"]',
      scripts => {
        const articles: any[] = [];

        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent || '{}');

            if (data['@type'] === 'NewsArticle' || data['@type'] === 'Article') {
              articles.push({
                title: data.headline,
                content: data.articleBody || data.text,
                date: data.datePublished,
                author: data.author?.name,
                url: data.url || window.location.href
              });
            }

            // Handle arrays of articles
            if (Array.isArray(data['@graph'])) {
              for (const item of data['@graph']) {
                if (item['@type'] === 'NewsArticle' || item['@type'] === 'Article') {
                  articles.push({
                    title: item.headline,
                    content: item.articleBody,
                    date: item.datePublished,
                    author: item.author?.name,
                    url: item.url || window.location.href
                  });
                }
              }
            }
          } catch {
            continue;
          }
        }

        return articles;
      }
    );

    return structuredData.filter(a => a.title && a.content);
  }

  private async extractDate(page: Page): Promise<string> {
    // Try multiple date selectors
    const dateSelectors = [
      'time[datetime]',
      '[itemprop="datePublished"]',
      '.date',
      '.post-date',
      '.entry-date',
      '.publish-date',
      '.article-date'
    ];

    for (const selector of dateSelectors) {
      const dateText = await page.$eval(selector, el => {
        return el.getAttribute('datetime') || el.textContent?.trim() || '';
      }).catch(() => '');

      if (dateText) return dateText;
    }

    return '';
  }
}


// src/api/server.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { ImagineArtClient } from '../images/imagine-art-client';
import { AIPipeline } from '../ai/pipeline';
import { validateApiKey } from './auth';
import { createDashboardRoutes } from './dashboard-endpoints';
import * as dotenv from 'dotenv';

dotenv.config();

export class PublicationAPI {
  private app: Express;
  private pool: Pool;
  private imageClient: ImagineArtClient;
  private aiPipeline: AIPipeline | null = null;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    this.imageClient = new ImagineArtClient();

    // Initialize AI Pipeline if API key is available
    if (process.env.OPENROUTER_API_KEY) {
      this.aiPipeline = new AIPipeline({
        openRouterApiKey: process.env.OPENROUTER_API_KEY,
        maxArticlesPerSynthesis: 5,
        minQualityScore: 7,
        translateIndonesian: true,
        generateImages: true
      });
    }

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // API Documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Bali Zero Journal API',
        version: '1.0.0',
        endpoints: {
          articles: {
            GET: '/api/articles - List published articles',
            POST: '/api/articles - Create new article',
            GET_ID: '/api/articles/:id - Get specific article'
          },
          categories: {
            GET: '/api/categories - List all categories',
            GET_ARTICLES: '/api/categories/:category/articles - Get articles by category'
          },
          process: {
            POST: '/api/process/:category - Trigger AI processing for category',
            GET_STATUS: '/api/process/status - Get processing status'
          },
          images: {
            POST: '/api/images/generate - Generate cover image',
            GET: '/api/images/:id - Get image by ID'
          },
          stats: {
            GET: '/api/stats - Get system statistics',
            GET_COSTS: '/api/stats/costs - Get cost breakdown'
          }
        }
      });
    });

    // Articles endpoints
    this.app.get('/api/articles', this.getArticles.bind(this));
    this.app.get('/api/articles/:id', this.getArticle.bind(this));
    this.app.post('/api/articles', validateApiKey, this.createArticle.bind(this));
    this.app.put('/api/articles/:id', validateApiKey, this.updateArticle.bind(this));
    this.app.delete('/api/articles/:id', validateApiKey, this.deleteArticle.bind(this));

    // Categories
    this.app.get('/api/categories', this.getCategories.bind(this));
    this.app.get('/api/categories/:category/articles', this.getArticlesByCategory.bind(this));

    // Processing
    this.app.post('/api/process/:category', validateApiKey, this.processCategory.bind(this));
    this.app.get('/api/process/status', this.getProcessingStatus.bind(this));

    // Images
    this.app.post('/api/images/generate', validateApiKey, this.generateImage.bind(this));

    // Statistics
    this.app.get('/api/stats', this.getStats.bind(this));
    this.app.get('/api/stats/costs', validateApiKey, this.getCosts.bind(this));

    // Dashboard routes
    const dashboardRoutes = createDashboardRoutes(this.pool);
    this.app.use('/api', dashboardRoutes);

    // RSS Feed
    this.app.get('/feed.rss', this.getRSSFeed.bind(this));

    // Static files for covers
    this.app.use('/covers', express.static('covers'));
  }

  // Article Handlers
  private async getArticles(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, published = 'true' } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const publishedBool = published === 'true';

      const { rows: articles } = await this.pool.query(`
        SELECT
          id, title, summary, category,
          cover_image_url, published_date, view_count
        FROM processed_articles
        WHERE published = $1
        ORDER BY published_date DESC
        LIMIT $2 OFFSET $3
      `, [publishedBool, limit, offset]);

      const { rows: [count] } = await this.pool.query(
        'SELECT COUNT(*) FROM processed_articles WHERE published = $1',
        [publishedBool]
      );

      res.json({
        articles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(count.count),
          pages: Math.ceil(Number(count.count) / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { rows: [article] } = await this.pool.query(
        'SELECT * FROM processed_articles WHERE id = $1',
        [id]
      );

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Increment view count
      await this.pool.query(
        'UPDATE processed_articles SET view_count = view_count + 1 WHERE id = $1',
        [id]
      );

      res.json(article);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async createArticle(req: Request, res: Response) {
    try {
      const {
        title,
        content,
        summary,
        category,
        key_points,
        tags
      } = req.body;

      // Generate cover image
      const { localPath, imageUrl } = await this.imageClient.generateCover({
        title,
        category
      });

      const { rows: [article] } = await this.pool.query(`
        INSERT INTO processed_articles (
          title, content, summary, category,
          key_points, tags, cover_image_url, published, published_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
        RETURNING *
      `, [title, content, summary, category, key_points || [], tags || [], imageUrl]);

      res.status(201).json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async updateArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Build dynamic update query
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

      const { rows: [article] } = await this.pool.query(
        `UPDATE processed_articles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...values]
      );

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.json(article);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async deleteArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { rowCount } = await this.pool.query(
        'DELETE FROM processed_articles WHERE id = $1',
        [id]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Category Handlers
  private async getCategories(req: Request, res: Response) {
    const categories = [
      { id: 'immigration', name: 'Immigration', icon: '🛂' },
      { id: 'business', name: 'Business & Licenses', icon: '💼' },
      { id: 'tax', name: 'Tax & Finance', icon: '💰' },
      { id: 'property', name: 'Property', icon: '🏠' },
      { id: 'bali_news', name: 'Bali News', icon: '🏝️' },
      { id: 'ai_indonesia', name: 'AI & Tech', icon: '🤖' },
      { id: 'finance', name: 'Finance & Banking', icon: '🏦' }
    ];

    // Add article counts
    for (const category of categories) {
      const { rows: [count] } = await this.pool.query(
        'SELECT COUNT(*) FROM processed_articles WHERE category = $1 AND published = true',
        [category.id]
      );
      (category as any).articleCount = Number(count.count);
    }

    res.json(categories);
  }

  private async getArticlesByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { rows: articles } = await this.pool.query(`
        SELECT
          id, title, summary,
          cover_image_url, published_date, view_count
        FROM processed_articles
        WHERE category = $1 AND published = true
        ORDER BY published_date DESC
        LIMIT $2 OFFSET $3
      `, [category, limit, offset]);

      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Processing Handlers
  private async processCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { immediate = false } = req.body;

      if (!this.aiPipeline) {
        return res.status(503).json({ error: 'AI Pipeline not configured' });
      }

      if (immediate) {
        // Process immediately
        await this.aiPipeline.processCategory(category);
        res.json({ message: `Processing completed for ${category}` });
      } else {
        // Queue for processing
        res.json({ message: `${category} queued for processing` });
      }
    } catch (error) {
      res.status(500).json({ error: 'Processing failed' });
    }
  }

  private async getProcessingStatus(req: Request, res: Response) {
    try {
      const { rows: metrics } = await this.pool.query(`
        SELECT
          category,
          SUM(articles_scraped)::INTEGER as total_scraped,
          SUM(articles_processed)::INTEGER as total_processed,
          SUM(articles_published)::INTEGER as total_published,
          MAX(created_at) as last_run
        FROM scraping_metrics
        WHERE date > NOW() - INTERVAL '7 days'
        GROUP BY category
      `);

      res.json({
        categories: metrics,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Image Generation
  private async generateImage(req: Request, res: Response) {
    try {
      const { title, category, style } = req.body;

      const { localPath, imageUrl } = await this.imageClient.generateCover(
        { title, category },
        { style }
      );

      res.json({
        url: imageUrl,
        path: localPath,
        variants: {
          instagram: localPath.replace('.jpg', '_instagram.jpg'),
          facebook: localPath.replace('.jpg', '_facebook.jpg'),
          twitter: localPath.replace('.jpg', '_twitter.jpg'),
          linkedin: localPath.replace('.jpg', '_linkedin.jpg')
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Image generation failed' });
    }
  }

  // Statistics
  private async getStats(req: Request, res: Response) {
    try {
      const stats: any = {};

      // Article stats
      const { rows: [articles] } = await this.pool.query(`
        SELECT
          COUNT(*)::INTEGER as total,
          COUNT(CASE WHEN published = true THEN 1 END)::INTEGER as published,
          AVG(view_count)::NUMERIC as avg_views
        FROM processed_articles
      `);
      stats.articles = articles;

      // Source stats
      const { rows: [sources] } = await this.pool.query(`
        SELECT
          COUNT(*)::INTEGER as total,
          COUNT(CASE WHEN active = true THEN 1 END)::INTEGER as active,
          COUNT(DISTINCT category)::INTEGER as categories
        FROM sources
      `);
      stats.sources = sources;

      // Processing stats (last 24h)
      const { rows: [processing] } = await this.pool.query(`
        SELECT
          SUM(articles_scraped)::INTEGER as scraped,
          SUM(articles_processed)::INTEGER as processed,
          SUM(articles_published)::INTEGER as published
        FROM scraping_metrics
        WHERE date = CURRENT_DATE
      `);
      stats.todayProcessing = processing;

      // Image generation stats
      stats.images = this.imageClient.getStats();

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getCosts(req: Request, res: Response) {
    try {
      const costs: any = {
        ai: this.aiPipeline?.getClient() ? {
          totalCost: 0,
          requests: 0
        } : { totalCost: 0, requests: 0 },
        images: this.imageClient.getStats(),
        infrastructure: {
          database: 0, // Free tier
          hosting: 0, // Free tier
          proxy: 10 // Monthly estimate
        },
        total: 0
      };

      costs.total =
        parseFloat(costs.ai.totalCost?.toString() || '0') +
        costs.images.estimatedCost +
        costs.infrastructure.proxy;

      res.json(costs);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // RSS Feed
  private async getRSSFeed(req: Request, res: Response) {
    try {
      const { rows: articles } = await this.pool.query(`
        SELECT
          id, title, summary, category,
          published_date, cover_image_url
        FROM processed_articles
        WHERE published = true
        ORDER BY published_date DESC
        LIMIT 20
      `);

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bali Zero Journal</title>
    <link>https://journal.balizero.com</link>
    <description>Indonesia Business & Immigration News for Expats</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${articles.map(article => `
    <item>
      <title>${this.escapeXml(article.title)}</title>
      <description>${this.escapeXml(article.summary || '')}</description>
      <link>https://journal.balizero.com/articles/${article.id}</link>
      <guid>https://journal.balizero.com/articles/${article.id}</guid>
      <pubDate>${new Date(article.published_date).toUTCString()}</pubDate>
      <category>${article.category}</category>
      ${article.cover_image_url ? `<enclosure url="${article.cover_image_url}" type="image/jpeg" />` : ''}
    </item>`).join('')}
  </channel>
</rss>`;

      res.type('application/rss+xml');
      res.send(rss);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Bali Zero Journal API running on port ${this.port}`);
      console.log(`📚 Documentation: http://localhost:${this.port}/api`);
    });
  }

  async close() {
    await this.pool.end();
  }
}


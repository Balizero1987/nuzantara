# PATCH 4: COVER GENERATION & PUBLICATION API
# Bali Zero Journal - Automatic Cover Design & REST API
# Days 7-8: Visual Generation & Article Publishing System

## 1. ImagineArt Cover Generator

```typescript
// src/images/imagine-art-client.ts
import axios, { AxiosInstance } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export interface CoverDesignConfig {
  style: 'modern' | 'professional' | 'artistic' | 'minimalist';
  colorScheme: 'bali' | 'corporate' | 'tech' | 'vibrant';
  includeText: boolean;
  dimensions: {
    width: number;
    height: number;
  };
}

export class ImagineArtClient {
  private api: AxiosInstance;
  private apiKey: string;
  private generatedCount: number = 0;

  // Pre-configured styles for each category
  private categoryStyles = {
    immigration: {
      style: 'professional',
      colors: ['#003366', '#FFD700', '#FFFFFF'],
      keywords: ['passport', 'visa stamps', 'airport', 'travel documents', 'official'],
      mood: 'trustworthy, official'
    },
    business: {
      style: 'corporate',
      colors: ['#1E3A8A', '#10B981', '#F59E0B'],
      keywords: ['office building', 'handshake', 'contracts', 'modern Jakarta', 'skyline'],
      mood: 'professional, growth-oriented'
    },
    tax: {
      style: 'minimalist',
      colors: ['#4B5563', '#EF4444', '#F9FAFB'],
      keywords: ['calculator', 'documents', 'charts', 'money', 'financial'],
      mood: 'serious, analytical'
    },
    property: {
      style: 'architectural',
      colors: ['#059669', '#8B5CF6', '#FCD34D'],
      keywords: ['Bali villa', 'tropical house', 'real estate', 'architecture', 'luxury'],
      mood: 'aspirational, tropical'
    },
    bali_news: {
      style: 'vibrant',
      colors: ['#EC4899', '#14B8A6', '#F97316'],
      keywords: ['Bali temple', 'beach sunset', 'rice terraces', 'cultural', 'tropical paradise'],
      mood: 'vibrant, cultural'
    },
    ai_indonesia: {
      style: 'futuristic',
      colors: ['#6366F1', '#06B6D4', '#A855F7'],
      keywords: ['technology', 'AI brain', 'digital', 'futuristic Jakarta', 'innovation'],
      mood: 'innovative, high-tech'
    },
    finance: {
      style: 'sophisticated',
      colors: ['#16A34A', '#0EA5E9', '#EAB308'],
      keywords: ['stock market', 'rupiah currency', 'bank', 'investment', 'growth chart'],
      mood: 'trustworthy, prosperous'
    }
  };

  constructor(apiKey: string = 'fqJqUJC0bvwGrZxs0yEZXmXpLHdgOvGh0KlhcHGvtCPTxino6PZdxw9zAieT') {
    this.apiKey = apiKey;

    this.api = axios.create({
      baseURL: 'https://api.imagineart.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateCover(
    article: {
      title: string;
      category: string;
      keyPoints?: string[];
      sentiment?: string;
    },
    config?: Partial<CoverDesignConfig>
  ): Promise<{ imageUrl: string; localPath: string }> {

    console.log(`🎨 Generating cover for: ${article.title.substring(0, 50)}...`);

    try {
      // Build prompt based on category and article
      const prompt = this.buildPrompt(article);

      // Generate image with ImagineArt
      const response = await this.api.post('/generate', {
        prompt: prompt,
        model: 'midjourney', // or 'stable-diffusion', 'dall-e'
        width: config?.dimensions?.width || 1200,
        height: config?.dimensions?.height || 630, // Social media optimal
        num_images: 1,
        negative_prompt: 'text, words, letters, watermark, logo, low quality, blurry',
        guidance_scale: 7.5,
        steps: 30
      });

      const imageUrl = response.data.images[0].url;

      // Download and process image
      const localPath = await this.downloadAndProcess(imageUrl, article, config);

      this.generatedCount++;
      console.log(`✅ Cover generated: ${localPath}`);

      return { imageUrl, localPath };

    } catch (error: any) {
      console.error('❌ ImagineArt generation failed:', error.message);

      // Fallback to template-based generation
      return this.generateTemplateCover(article, config);
    }
  }

  private buildPrompt(article: any): string {
    const style = this.categoryStyles[article.category as keyof typeof this.categoryStyles];

    if (!style) {
      // Generic prompt for unknown categories
      return `Professional news cover image for "${article.title}",
        modern design, clean composition, high quality photography,
        Indonesia business theme, no text`;
    }

    // Category-specific prompt
    const basePrompt = `${style.mood} cover image for news article,
      ${style.style} style,
      featuring ${style.keywords.slice(0, 3).join(', ')},
      color palette: ${style.colors.join(', ')},
      professional photography, high quality, sharp focus,
      Indonesian context, Bali atmosphere when relevant,
      NO text, NO words, NO letters`;

    // Add sentiment modifier
    if (article.sentiment === 'positive') {
      return `${basePrompt}, optimistic mood, bright lighting, upward movement`;
    } else if (article.sentiment === 'negative') {
      return `${basePrompt}, serious mood, dramatic lighting, cautionary tone`;
    }

    return basePrompt;
  }

  private async downloadAndProcess(
    imageUrl: string,
    article: any,
    config?: Partial<CoverDesignConfig>
  ): Promise<string> {

    // Download image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'covers', article.category);
    await fs.mkdir(outputDir, { recursive: true });

    // Generate filename
    const timestamp = Date.now();
    const filename = `${article.category}_${timestamp}.jpg`;
    const outputPath = path.join(outputDir, filename);

    // Process with sharp if text overlay needed
    if (config?.includeText !== false) {
      await this.addTextOverlay(buffer, article, outputPath);
    } else {
      // Save as-is
      await fs.writeFile(outputPath, buffer);
    }

    // Create social media variants
    await this.createSocialVariants(outputPath, article);

    return outputPath;
  }

  private async addTextOverlay(
    imageBuffer: Buffer,
    article: any,
    outputPath: string
  ): Promise<void> {

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Create text overlay SVG
    const titleText = this.wrapText(article.title, 40);
    const svgOverlay = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
            <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <rect x="0" y="${metadata.height! - 250}" width="${metadata.width}" height="250" fill="url(#grad)" />
        <text x="60" y="${metadata.height! - 140}"
              font-family="Arial, sans-serif"
              font-size="48"
              font-weight="bold"
              fill="white">
          ${titleText.map((line, i) =>
            `<tspan x="60" dy="${i === 0 ? 0 : 55}">${line}</tspan>`
          ).join('')}
        </text>
        <text x="60" y="${metadata.height! - 50}"
              font-family="Arial, sans-serif"
              font-size="24"
              fill="#FFD700">
          BALI ZERO JOURNAL
        </text>
      </svg>
    `;

    // Composite overlay on image
    await image
      .composite([{
        input: Buffer.from(svgOverlay),
        gravity: 'southeast'
      }])
      .jpeg({ quality: 90 })
      .toFile(outputPath);
  }

  private wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxLength) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine) lines.push(currentLine.trim());
    return lines.slice(0, 2); // Max 2 lines
  }

  private async createSocialVariants(
    originalPath: string,
    article: any
  ): Promise<void> {

    const variants = [
      { name: 'instagram', width: 1080, height: 1080 },
      { name: 'facebook', width: 1200, height: 630 },
      { name: 'twitter', width: 1200, height: 675 },
      { name: 'linkedin', width: 1200, height: 627 }
    ];

    const dir = path.dirname(originalPath);
    const basename = path.basename(originalPath, '.jpg');

    for (const variant of variants) {
      const outputPath = path.join(dir, `${basename}_${variant.name}.jpg`);

      await sharp(originalPath)
        .resize(variant.width, variant.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
    }
  }

  private async generateTemplateCover(
    article: any,
    config?: Partial<CoverDesignConfig>
  ): Promise<{ imageUrl: string; localPath: string }> {

    console.log('📐 Using template-based cover generation...');

    const style = this.categoryStyles[article.category as keyof typeof this.categoryStyles];
    const colors = style?.colors || ['#1E40AF', '#FFD700', '#FFFFFF'];

    // Create SVG template
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>

        <!-- Pattern overlay -->
        <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="2" fill="${colors[2]}" opacity="0.1"/>
        </pattern>
        <rect width="1200" height="630" fill="url(#pattern)"/>

        <!-- Category badge -->
        <rect x="50" y="50" width="200" height="40" rx="20" fill="${colors[2]}" opacity="0.9"/>
        <text x="150" y="75" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="${colors[0]}">
          ${article.category.toUpperCase().replace('_', ' ')}
        </text>

        <!-- Title area -->
        <rect x="0" y="380" width="1200" height="250" fill="${colors[0]}" opacity="0.95"/>

        <!-- Title text -->
        <text x="60" y="450" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="${colors[2]}">
          ${this.wrapText(article.title, 50).map((line, i) =>
            `<tspan x="60" dy="${i === 0 ? 0 : 50}">${line}</tspan>`
          ).join('')}
        </text>

        <!-- Brand -->
        <text x="60" y="570" font-family="Arial" font-size="24" fill="${colors[1]}">
          BALI ZERO JOURNAL
        </text>
        <text x="1140" y="570" text-anchor="end" font-family="Arial" font-size="18" fill="${colors[2]}" opacity="0.7">
          ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </text>
      </svg>
    `;

    // Save template
    const outputDir = path.join(process.cwd(), 'covers', article.category);
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${article.category}_template_${Date.now()}.jpg`;
    const outputPath = path.join(outputDir, filename);

    // Convert SVG to image
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    return {
      imageUrl: `file://${outputPath}`,
      localPath: outputPath
    };
  }

  getStats() {
    return {
      generatedCount: this.generatedCount,
      estimatedCost: this.generatedCount * 0.05 // ~$0.05 per image
    };
  }
}
```

## 2. Publication REST API

```typescript
// src/api/server.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { ImagineArtClient } from '../images/imagine-art-client';
import { AIPipeline } from '../ai/pipeline';
import { validateApiKey, generateApiKey } from './auth';

export class PublicationAPI {
  private app: Express;
  private pool: Pool;
  private imageClient: ImagineArtClient;
  private aiPipeline: AIPipeline;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    this.imageClient = new ImagineArtClient();

    this.aiPipeline = new AIPipeline({
      openRouterApiKey: process.env.OPENROUTER_API_KEY!,
      maxArticlesPerSynthesis: 5,
      minQualityScore: 7,
      translateIndonesian: true,
      generateImages: true
    });

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

    // RSS Feed
    this.app.get('/feed.rss', this.getRSSFeed.bind(this));

    // Static files for covers
    this.app.use('/covers', express.static('covers'));
  }

  // Article Handlers
  private async getArticles(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, published = true } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { rows: articles } = await this.pool.query(`
        SELECT
          id, title, subtitle, summary, category,
          cover_image_url, published_date, view_count,
          metadata->>'readingTime' as reading_time
        FROM processed_articles
        WHERE published = $1
        ORDER BY published_date DESC
        LIMIT $2 OFFSET $3
      `, [published, limit, offset]);

      const { rows: [count] } = await this.pool.query(
        'SELECT COUNT(*) FROM processed_articles WHERE published = $1',
        [published]
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
        subtitle,
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
          title, subtitle, content, summary, category,
          key_points, tags, cover_image_url, published, published_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
        RETURNING *
      `, [title, subtitle, content, summary, category, key_points, tags, imageUrl]);

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
          id, title, subtitle, summary,
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

      if (immediate) {
        // Process immediately
        await this.aiPipeline.processCategory(category);
        res.json({ message: `Processing completed for ${category}` });
      } else {
        // Queue for processing
        // Add to Bull queue or similar
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
          SUM(articles_scraped) as total_scraped,
          SUM(articles_processed) as total_processed,
          SUM(articles_published) as total_published,
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
          COUNT(*) as total,
          COUNT(CASE WHEN published = true THEN 1 END) as published,
          AVG(view_count) as avg_views
        FROM processed_articles
      `);
      stats.articles = articles;

      // Source stats
      const { rows: [sources] } = await this.pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN active = true THEN 1 END) as active,
          COUNT(DISTINCT category) as categories
        FROM sources
      `);
      stats.sources = sources;

      // Processing stats (last 24h)
      const { rows: [processing] } = await this.pool.query(`
        SELECT
          SUM(articles_scraped) as scraped,
          SUM(articles_processed) as processed,
          SUM(articles_published) as published
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
      const costs = {
        ai: this.aiPipeline.client.getUsageStats(),
        images: this.imageClient.getStats(),
        infrastructure: {
          database: 0, // Free tier
          hosting: 0, // Free tier
          proxy: 10 // Monthly estimate
        },
        total: 0
      };

      costs.total =
        parseFloat(costs.ai.totalCost) +
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
      <description>${this.escapeXml(article.summary)}</description>
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
    await this.aiPipeline.close();
  }
}
```

## 3. API Authentication

```typescript
// src/api/auth.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create API keys table
export async function createApiKeysTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(100),
      permissions TEXT[],
      rate_limit INTEGER DEFAULT 100,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used TIMESTAMP
    )
  `);
}

export async function generateApiKey(name: string, permissions: string[] = ['read']): Promise<string> {
  const key = 'bzj_' + crypto.randomBytes(32).toString('hex');

  await pool.query(
    'INSERT INTO api_keys (key, name, permissions) VALUES ($1, $2, $3)',
    [key, name, permissions]
  );

  return key;
}

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const { rows: [key] } = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1 AND active = true',
      [apiKey]
    );

    if (!key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used
    await pool.query(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = $1',
      [key.id]
    );

    // Add key info to request
    (req as any).apiKey = key;

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}
```

## 4. Cron Job Configuration

```typescript
// src/cron/scheduler.ts
import cron from 'node-cron';
import { ScraperOrchestrator } from '../scraper/orchestrator';
import { AIPipeline } from '../ai/pipeline';
import { Pool } from 'pg';

export class CronScheduler {
  private orchestrator: ScraperOrchestrator;
  private aiPipeline: AIPipeline;
  private pool: Pool;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.orchestrator = new ScraperOrchestrator();
    this.aiPipeline = new AIPipeline({
      openRouterApiKey: process.env.OPENROUTER_API_KEY!,
      maxArticlesPerSynthesis: 5,
      minQualityScore: 7,
      translateIndonesian: true,
      generateImages: true
    });

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  setupJobs() {
    console.log('⏰ Setting up cron jobs...');

    // SCRAPING JOBS
    // T1 Sources - Every 24 hours at 2 AM
    this.jobs.set('scrape-t1', cron.schedule('0 2 * * *', async () => {
      console.log('🕒 Starting T1 scraping...');
      await this.scrapeByTier('T1');
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // T2 Sources - Every 48 hours at 3 AM
    this.jobs.set('scrape-t2', cron.schedule('0 3 */2 * *', async () => {
      console.log('🕒 Starting T2 scraping...');
      await this.scrapeByTier('T2');
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // T3 Sources - Weekly on Monday at 4 AM
    this.jobs.set('scrape-t3', cron.schedule('0 4 * * 1', async () => {
      console.log('🕒 Starting T3 scraping...');
      await this.scrapeByTier('T3');
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // AI PROCESSING JOBS
    // Process articles every 6 hours
    this.jobs.set('ai-process', cron.schedule('0 */6 * * *', async () => {
      console.log('🤖 Starting AI processing...');
      await this.processAllCategories();
    }, { scheduled: true }));

    // MAINTENANCE JOBS
    // Clean old articles - Daily at 1 AM
    this.jobs.set('cleanup', cron.schedule('0 1 * * *', async () => {
      console.log('🧹 Cleaning old articles...');
      await this.cleanupOldArticles();
    }, { scheduled: true }));

    // Generate daily report - Every day at 9 AM
    this.jobs.set('daily-report', cron.schedule('0 9 * * *', async () => {
      console.log('📊 Generating daily report...');
      await this.generateDailyReport();
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // Health check - Every hour
    this.jobs.set('health-check', cron.schedule('0 * * * *', async () => {
      await this.performHealthCheck();
    }, { scheduled: true }));

    console.log(`✅ ${this.jobs.size} cron jobs scheduled`);
  }

  private async scrapeByTier(tier: string) {
    try {
      const { rows: sources } = await this.pool.query(
        'SELECT id FROM sources WHERE tier = $1 AND active = true',
        [tier]
      );

      console.log(`📋 Scraping ${sources.length} ${tier} sources`);

      for (const source of sources) {
        await this.orchestrator.scraper.scrapeSource(source.id);
      }

      // Log metrics
      await this.pool.query(`
        INSERT INTO scraping_metrics (date, category, articles_scraped)
        VALUES (CURRENT_DATE, $1, $2)
      `, [tier, sources.length]);

    } catch (error) {
      console.error(`Scraping failed for ${tier}:`, error);
    }
  }

  private async processAllCategories() {
    try {
      await this.aiPipeline.processAllCategories();
    } catch (error) {
      console.error('AI processing failed:', error);
    }
  }

  private async cleanupOldArticles() {
    try {
      // Delete raw articles older than 30 days
      const { rowCount } = await this.pool.query(`
        DELETE FROM raw_articles
        WHERE
          scraped_date < NOW() - INTERVAL '30 days'
          AND processed = true
      `);

      console.log(`🗑️ Deleted ${rowCount} old raw articles`);

      // Archive old processed articles
      await this.pool.query(`
        UPDATE processed_articles
        SET archived = true
        WHERE
          published_date < NOW() - INTERVAL '90 days'
          AND archived = false
      `);

    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  private async generateDailyReport() {
    try {
      const report: any = {};

      // Yesterday's metrics
      const { rows: [yesterday] } = await this.pool.query(`
        SELECT
          SUM(articles_scraped) as scraped,
          SUM(articles_processed) as processed,
          SUM(articles_published) as published,
          SUM(errors_count) as errors
        FROM scraping_metrics
        WHERE date = CURRENT_DATE - INTERVAL '1 day'
      `);

      report.yesterday = yesterday;

      // Top articles
      const { rows: topArticles } = await this.pool.query(`
        SELECT title, category, view_count
        FROM processed_articles
        WHERE published_date > NOW() - INTERVAL '24 hours'
        ORDER BY view_count DESC
        LIMIT 5
      `);

      report.topArticles = topArticles;

      // Cost summary
      const aiStats = this.aiPipeline.client.getUsageStats();
      report.costs = {
        ai: aiStats.totalCost,
        images: this.aiPipeline.imageClient?.getStats().estimatedCost || 0
      };

      console.log('📈 Daily Report:', JSON.stringify(report, null, 2));

      // Send via email/Slack/webhook
      await this.sendReport(report);

    } catch (error) {
      console.error('Report generation failed:', error);
    }
  }

  private async performHealthCheck() {
    const health: any = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check database
    try {
      await this.pool.query('SELECT 1');
      health.services.database = 'healthy';
    } catch {
      health.services.database = 'unhealthy';
    }

    // Check AI service
    try {
      // Quick test with cheapest model
      await this.aiPipeline.client.complete('test', undefined, { maxTokens: 1 });
      health.services.ai = 'healthy';
    } catch {
      health.services.ai = 'unhealthy';
    }

    // Log any issues
    if (Object.values(health.services).includes('unhealthy')) {
      console.error('⚠️ Health check failed:', health);
      // Send alert
    }
  }

  private async sendReport(report: any) {
    // Implement webhook/email/Slack notification
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    }
  }

  start() {
    this.setupJobs();
  }

  stop() {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }
  }
}
```

## 5. Main Application Entry

```typescript
// src/app.ts
import dotenv from 'dotenv';
import { PublicationAPI } from './api/server';
import { CronScheduler } from './cron/scheduler';
import { createApiKeysTable, generateApiKey } from './api/auth';

dotenv.config();

async function main() {
  console.log('🚀 Starting Bali Zero Journal System...\n');

  // Initialize database
  await createApiKeysTable();

  // Generate initial API key if needed
  if (process.env.GENERATE_API_KEY === 'true') {
    const apiKey = await generateApiKey('admin', ['read', 'write', 'admin']);
    console.log(`🔑 Admin API Key: ${apiKey}`);
    console.log('Save this key securely!\n');
  }

  // Start API server
  const api = new PublicationAPI(Number(process.env.PORT) || 3000);
  await api.start();

  // Start cron scheduler
  const scheduler = new CronScheduler();
  scheduler.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n📛 Shutting down gracefully...');
    scheduler.stop();
    await api.close();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## 6. Docker Compose Full Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bali_zero_journal
      POSTGRES_USER: journal
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  scraper:
    build: .
    command: npm run scrape
    environment:
      DATABASE_URL: postgresql://journal:${DB_PASSWORD}@postgres:5432/bali_zero_journal
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./screenshots:/app/screenshots
      - ./covers:/app/covers

  api:
    build: .
    command: npm start
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://journal:${DB_PASSWORD}@postgres:5432/bali_zero_journal
      REDIS_HOST: redis
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      IMAGINEART_API_KEY: ${IMAGINEART_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./covers:/app/covers

  cron:
    build: .
    command: npm run cron
    environment:
      DATABASE_URL: postgresql://journal:${DB_PASSWORD}@postgres:5432/bali_zero_journal
      REDIS_HOST: redis
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
    depends_on:
      - postgres
      - redis
      - api

volumes:
  postgres_data:
  redis_data:
```

## 7. Environment Configuration

```bash
# .env
# Database
DATABASE_URL=postgresql://journal:password@localhost:5432/bali_zero_journal
DB_PASSWORD=secure_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
IMAGINEART_API_KEY=fqJqUJC0bvwGrZxs0yEZXmXpLHdgOvGh0KlhcHGvtCPTxino6PZdxw9zAieT

# API Configuration
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://journal.balizero.com
GENERATE_API_KEY=false

# Notifications
WEBHOOK_URL=https://hooks.slack.com/services/...
ADMIN_EMAIL=admin@balizero.com

# Proxy (optional)
PROXY_SERVICE_API=https://proxy-service.com/api
PROXY_SERVICE_KEY=your_key_here

# Feature Flags
ENABLE_AI_PROCESSING=true
ENABLE_IMAGE_GENERATION=true
ENABLE_TRANSLATIONS=true
```

## 8. Package.json Final

```json
{
  "name": "bali-zero-journal",
  "version": "1.0.0",
  "scripts": {
    "start": "node dist/app.js",
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "migrate": "ts-node scripts/migrate.ts",
    "import-sources": "ts-node scripts/import-sources.ts",
    "test-connectivity": "ts-node scripts/test-connectivity.ts",
    "scrape": "ts-node src/index.ts",
    "process": "ts-node src/process-articles.ts",
    "cron": "ts-node src/cron/scheduler.ts",
    "api": "ts-node src/api/server.ts",
    "test": "jest",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "sharp": "^0.33.1",
    "pg": "^8.11.3",
    "axios": "^1.6.2",
    "playwright": "^1.40.0",
    "bull": "^4.11.5",
    "node-cron": "^3.0.3",
    "dotenv": "^16.3.1",
    "@mozilla/readability": "^0.4.4",
    "jsdom": "^23.0.1",
    "js-yaml": "^4.1.0",
    "p-limit": "^3.1.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
```

## 9. API Endpoints Documentation

```markdown
# Bali Zero Journal API

Base URL: https://api.journal.balizero.com

## Authentication
All write operations require API key in header:
`X-API-Key: bzj_your_api_key_here`

## Endpoints

### Articles
- `GET /api/articles` - List articles (paginated)
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create article (auth required)
- `PUT /api/articles/:id` - Update article (auth required)
- `DELETE /api/articles/:id` - Delete article (auth required)

### Categories
- `GET /api/categories` - List all categories with counts
- `GET /api/categories/:category/articles` - Articles by category

### Processing
- `POST /api/process/:category` - Trigger AI processing (auth required)
- `GET /api/process/status` - Get processing status

### Images
- `POST /api/images/generate` - Generate cover image (auth required)

### Statistics
- `GET /api/stats` - System statistics
- `GET /api/stats/costs` - Cost breakdown (auth required)

### Feed
- `GET /feed.rss` - RSS feed of latest articles
```

## 10. Deployment Script

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying Bali Zero Journal..."

# Build Docker images
docker-compose build

# Run migrations
docker-compose run --rm api npm run migrate

# Import sources
docker-compose run --rm api npm run import-sources

# Start services
docker-compose up -d

# Check health
sleep 10
curl http://localhost:3000/health

echo "✅ Deployment complete!"
echo "📚 API: http://localhost:3000/api"
echo "📊 Stats: http://localhost:3000/api/stats"
```

---
END OF PATCH 4: COVER GENERATION & PUBLICATION API
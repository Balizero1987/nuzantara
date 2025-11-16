import { Pool } from 'pg';
import { OpenRouterClient } from './openrouter-client';
import { ArticleAnalyzer } from './analyzers/article-analyzer';
import { ArticleSynthesizer } from './synthesizers/article-synthesizer';
import { IndonesianTranslator } from './translators/indonesian-translator';

export interface PipelineConfig {
  openRouterApiKey: string;
  maxArticlesPerSynthesis: number;
  minQualityScore: number;
  translateIndonesian: boolean;
  generateImages: boolean;
}

export class AIPipeline {
  private client: OpenRouterClient;
  private analyzer: ArticleAnalyzer;
  private synthesizer: ArticleSynthesizer;
  private translator: IndonesianTranslator;
  private pool: Pool;

  // Public getter for client access
  getClient(): OpenRouterClient {
    return this.client;
  }

  constructor(config: PipelineConfig) {
    this.client = new OpenRouterClient(config.openRouterApiKey);
    this.analyzer = new ArticleAnalyzer(this.client);
    this.synthesizer = new ArticleSynthesizer(this.client);
    this.translator = new IndonesianTranslator(this.client);

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async processCategory(category: string, limit: number = 20): Promise<void> {
    console.log(`\n🔄 Processing ${category} articles...`);

    try {
      // 1. Fetch unprocessed articles
      const articles = await this.fetchUnprocessedArticles(category, limit);
      console.log(`📚 Found ${articles.length} articles to process`);

      if (articles.length === 0) return;

      // 2. Translate Indonesian articles if needed
      const translatedArticles = await this.translateArticles(articles);

      // 3. Analyze each article
      const analyses = [];
      for (const article of translatedArticles) {
        console.log(`  🔍 Analyzing: ${article.title.substring(0, 50)}...`);

        const analysis = await this.analyzer.analyze({
          title: article.title,
          content: article.content,
          source: article.source_name,
          category
        });

        // Skip low relevance articles
        if (analysis.relevanceScore >= 6) {
          analyses.push(analysis);

          // Update article with analysis
          await this.updateArticleAnalysis(article.id, analysis);
        }
      }

      console.log(`  ✅ Analyzed ${analyses.length} relevant articles`);

      // 4. Group and synthesize articles
      const synthesized = await this.synthesizeArticles(analyses, articles, category);

      // 5. Save synthesized articles
      for (const article of synthesized) {
        await this.saveSynthesizedArticle(article, category);
      }

      console.log(`  📝 Created ${synthesized.length} synthesized articles`);

      // 6. Mark raw articles as processed
      await this.markArticlesProcessed(articles.map(a => a.id));

    } catch (error) {
      console.error(`❌ Pipeline failed for ${category}:`, error);
      throw error;
    }
  }

  private async fetchUnprocessedArticles(category: string, limit: number): Promise<any[]> {
    const query = `
      SELECT
        ra.*,
        s.name as source_name,
        s.tier,
        s.reliability_score as source_reliability
      FROM raw_articles ra
      JOIN sources s ON ra.source_id = s.id
      WHERE
        ra.category = $1
        AND ra.processed = false
        AND ra.quality_score >= $2
        AND ra.scraped_date > NOW() - INTERVAL '5 days'
      ORDER BY
        s.tier ASC,
        ra.quality_score DESC,
        ra.published_date DESC
      LIMIT $3
    `;

    const { rows } = await this.pool.query(query, [category, 7, limit]);
    return rows;
  }

  private async translateArticles(articles: any[]): Promise<any[]> {
    const translated = [];

    for (const article of articles) {
      if (article.language === 'id') {
        console.log(`  🌐 Translating: ${article.title.substring(0, 40)}...`);

        try {
          const translatedTitle = await this.translator.translate(article.title);
          const translatedContent = await this.translator.translate(article.content);

          translated.push({
            ...article,
            original_title: article.title,
            original_content: article.content,
            title: translatedTitle,
            content: translatedContent,
            was_translated: true
          });
        } catch (error) {
          console.error(`  ⚠️ Translation failed, using original`);
          translated.push(article);
        }
      } else {
        translated.push(article);
      }
    }

    return translated;
  }

  private async updateArticleAnalysis(articleId: string, analysis: any): Promise<void> {
    await this.pool.query(`
      UPDATE raw_articles
      SET
        metadata = metadata || $1::jsonb,
        quality_score = GREATEST(quality_score, $2)
      WHERE id = $3
    `, [
      JSON.stringify({
        analysis: {
          relevance: analysis.relevanceScore,
          importance: analysis.importance,
          sentiment: analysis.sentiment,
          topics: analysis.keyTopics,
          entities: analysis.entities,
          tags: analysis.tags
        }
      }),
      analysis.relevanceScore,
      articleId
    ]);
  }

  private async synthesizeArticles(
    analyses: any[],
    rawArticles: any[],
    category: string
  ): Promise<any[]> {

    // Group similar articles
    const groups = this.groupSimilarArticles(analyses);
    const synthesized = [];

    for (const group of groups) {
      if (group.length >= 2) {
        // Synthesize multiple articles
        const relatedRaw = rawArticles.filter((_, i) => group.includes(i));
        const article = await this.synthesizer.synthesize(
          group.map(i => analyses[i]),
          relatedRaw,
          category
        );
        synthesized.push(article);
      } else if (group.length === 1) {
        // Single article, just enhance it
        const analysis = analyses[group[0]];
        const raw = rawArticles[group[0]];

        if (analysis.importance === 'critical' || analysis.importance === 'high') {
          const article = await this.synthesizer.synthesize(
            [analysis],
            [raw],
            category
          );
          synthesized.push(article);
        }
      }
    }

    return synthesized;
  }

  private groupSimilarArticles(analyses: any[]): number[][] {
    const groups: number[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < analyses.length; i++) {
      if (used.has(i)) continue;

      const group = [i];
      const baseTopics = new Set(analyses[i].keyTopics);

      for (let j = i + 1; j < analyses.length; j++) {
        if (used.has(j)) continue;

        // Check topic overlap
        const overlap = analyses[j].keyTopics.filter((t: string) => baseTopics.has(t));
        if (overlap.length >= 2) {
          group.push(j);
          used.add(j);
        }
      }

      groups.push(group);
      used.add(i);
    }

    return groups;
  }

  private async saveSynthesizedArticle(article: any, category: string): Promise<void> {
    await this.pool.query(`
      INSERT INTO processed_articles (
        title, summary, content, category,
        key_points, tags, sentiment, relevance_score,
        ai_model_used, processing_cost, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      article.title,
      article.summary,
      article.content,
      category,
      article.keyPoints,
      article.sources.map((s: any) => s.name),
      'neutral',
      article.metadata.audienceRelevance.expats || 7,
      'OpenRouter Multi-Model',
      parseFloat(this.client.getUsageStats().totalCost),
      JSON.stringify(article.metadata)
    ]);
  }

  private async markArticlesProcessed(articleIds: string[]): Promise<void> {
    await this.pool.query(
      'UPDATE raw_articles SET processed = true WHERE id = ANY($1)',
      [articleIds]
    );
  }

  async processAllCategories(): Promise<void> {
    const categories = [
      'immigration',
      'business',
      'tax',
      'property',
      'bali_news',
      'ai_indonesia',
      'finance'
    ];

    console.log('🚀 Starting AI Pipeline for all categories...\n');

    for (const category of categories) {
      await this.processCategory(category);

      // Add delay between categories
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print cost summary
    const stats = this.client.getUsageStats();
    console.log('\n💰 AI Processing Cost Summary:');
    console.log(`   Total Cost: $${stats.totalCost}`);

    for (const modelStat of stats.modelStats) {
      const indicator = modelStat.isFree ? '🆓' : '💵';
      console.log(`   ${indicator} ${modelStat.model}: ${modelStat.requests} requests ($${modelStat.cost})`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}


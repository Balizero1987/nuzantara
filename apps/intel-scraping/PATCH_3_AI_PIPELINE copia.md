# PATCH 3: AI PIPELINE WITH OPENROUTER
# Bali Zero Journal - Multi-Model AI Processing System
# Days 5-6: AI Integration with Free/Low-Cost Models

## 1. OpenRouter Client & Model Manager

```typescript
// src/ai/openrouter-client.ts
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  costPer1M: { input: number; output: number };
  contextWindow: number;
  capabilities: string[];
  priority: number;
}

export const AI_MODELS: Record<string, AIModel> = {
  // FREE MODELS
  DEEPSEEK_R1: {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 Distill Qwen',
    provider: 'DeepSeek',
    costPer1M: { input: 0, output: 0 },
    contextWindow: 32768,
    capabilities: ['analysis', 'extraction', 'reasoning'],
    priority: 1
  },

  GLM_AIR: {
    id: 'zhipu/glm-4-air',
    name: 'GLM 4 Air',
    provider: 'Zhipu',
    costPer1M: { input: 0, output: 0 },
    contextWindow: 128000,
    capabilities: ['translation', 'summarization'],
    priority: 2
  },

  // ULTRA LOW COST
  GEMINI_FLASH: {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Experimental',
    provider: 'Google',
    costPer1M: { input: 0, output: 0 },
    contextWindow: 1048576,
    capabilities: ['synthesis', 'creative', 'multimodal'],
    priority: 3
  },

  // BACKUP MODELS (Still very cheap)
  QWEN_QWQ: {
    id: 'qwen/qwq-32b-preview',
    name: 'Qwen QwQ 32B',
    provider: 'Qwen',
    costPer1M: { input: 0.18, output: 0.18 },
    contextWindow: 32768,
    capabilities: ['analysis', 'reasoning', 'code'],
    priority: 4
  },

  LLAMA_3_1: {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    costPer1M: { input: 0.06, output: 0.06 },
    contextWindow: 131072,
    capabilities: ['general', 'extraction'],
    priority: 5
  }
};

export class OpenRouterClient extends EventEmitter {
  private api: AxiosInstance;
  private apiKey: string;
  private totalCost: number = 0;
  private modelUsage: Map<string, { count: number; cost: number }> = new Map();

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;

    this.api = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://balizero.com',
        'X-Title': 'Bali Zero Journal'
      }
    });
  }

  async complete(
    prompt: string,
    model: AIModel = AI_MODELS.DEEPSEEK_R1,
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      jsonMode?: boolean;
    } = {}
  ): Promise<{ content: string; model: string; cost: number }> {
    const startTime = Date.now();

    try {
      console.log(`🤖 Using ${model.name} (${model.costPer1M.input === 0 ? 'FREE' : `$${model.costPer1M.input}/1M`})`);

      const messages = [];

      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const requestBody: any = {
        model: model.id,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4000,
      };

      // Add JSON mode if requested and model supports it
      if (options.jsonMode && model.capabilities.includes('json')) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await this.api.post('/chat/completions', requestBody);

      const content = response.data.choices[0].message.content;
      const usage = response.data.usage;

      // Calculate cost
      const inputCost = (usage.prompt_tokens / 1_000_000) * model.costPer1M.input;
      const outputCost = (usage.completion_tokens / 1_000_000) * model.costPer1M.output;
      const totalCost = inputCost + outputCost;

      // Track usage
      this.totalCost += totalCost;
      const modelStats = this.modelUsage.get(model.id) || { count: 0, cost: 0 };
      modelStats.count++;
      modelStats.cost += totalCost;
      this.modelUsage.set(model.id, modelStats);

      // Emit metrics
      this.emit('completion', {
        model: model.name,
        duration: Date.now() - startTime,
        tokens: usage.total_tokens,
        cost: totalCost
      });

      return {
        content,
        model: model.name,
        cost: totalCost
      };

    } catch (error: any) {
      console.error(`❌ ${model.name} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async completeWithFallback(
    prompt: string,
    options: any = {},
    modelPriority?: AIModel[]
  ): Promise<{ content: string; model: string; cost: number }> {
    const models = modelPriority || Object.values(AI_MODELS).sort((a, b) => a.priority - b.priority);

    for (const model of models) {
      try {
        return await this.complete(prompt, model, options);
      } catch (error) {
        console.warn(`⚠️ ${model.name} failed, trying next model...`);
        continue;
      }
    }

    throw new Error('All AI models failed');
  }

  getUsageStats() {
    const stats: any[] = [];

    for (const [modelId, usage] of this.modelUsage.entries()) {
      const model = Object.values(AI_MODELS).find(m => m.id === modelId);
      stats.push({
        model: model?.name || modelId,
        requests: usage.count,
        cost: usage.cost.toFixed(4),
        isFree: model?.costPer1M.input === 0
      });
    }

    return {
      totalCost: this.totalCost.toFixed(4),
      modelStats: stats
    };
  }
}
```

## 2. Article Analyzer (DeepSeek R1 - FREE)

```typescript
// src/ai/analyzers/article-analyzer.ts
import { OpenRouterClient, AI_MODELS } from '../openrouter-client';

export interface ArticleAnalysis {
  category: string;
  subcategory?: string;
  relevanceScore: number;
  keyTopics: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    amounts: string[];
  };
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  importance: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  keyFacts: string[];
  actionableInfo?: string;
  affectedAudience: string[];
  tags: string[];
}

export class ArticleAnalyzer {
  constructor(private client: OpenRouterClient) {}

  async analyze(article: {
    title: string;
    content: string;
    source: string;
    category: string;
  }): Promise<ArticleAnalysis> {
    const prompt = this.buildAnalysisPrompt(article);

    const systemPrompt = `You are an expert news analyst for Bali Zero Journal.
Your task is to analyze news articles about Indonesia, focusing on information relevant to expats, digital nomads, and foreign investors.

Respond with a JSON object containing the analysis.

CRITICAL RULES:
1. Only extract VERIFIED FACTS, not speculation
2. Focus on ACTIONABLE information for foreigners
3. Identify WHO is affected and HOW
4. Extract specific dates, amounts, and requirements
5. Rate importance based on direct impact to target audience`;

    try {
      const { content } = await this.client.complete(
        prompt,
        AI_MODELS.DEEPSEEK_R1, // FREE model
        {
          systemPrompt,
          temperature: 0.2,
          maxTokens: 2000
        }
      );

      // Parse JSON response
      const analysis = this.parseAnalysisResponse(content);

      // Validate and enhance
      return this.validateAnalysis(analysis, article);

    } catch (error) {
      console.error('Analysis failed:', error);

      // Fallback to simple extraction
      return this.fallbackAnalysis(article);
    }
  }

  private buildAnalysisPrompt(article: any): string {
    return `Analyze this ${article.category} news article from Indonesia:

TITLE: ${article.title}
SOURCE: ${article.source}
CONTENT: ${article.content}

Extract the following information in JSON format:

{
  "category": "primary category (immigration/business/tax/property/bali_news/ai_indonesia/finance)",
  "subcategory": "specific subcategory if applicable",
  "relevanceScore": 0-10 score for expat/investor relevance,
  "keyTopics": ["main topics covered"],
  "entities": {
    "people": ["mentioned people"],
    "organizations": ["government bodies, companies"],
    "locations": ["specific places"],
    "dates": ["important dates mentioned"],
    "amounts": ["money, percentages, quantities"]
  },
  "sentiment": "positive/negative/neutral/mixed",
  "importance": "critical/high/medium/low for expats",
  "summary": "2-3 sentence summary",
  "keyFacts": ["bullet points of key facts"],
  "actionableInfo": "what actions readers should take if any",
  "affectedAudience": ["who is affected"],
  "tags": ["searchable tags"]
}

Focus on:
- New regulations or policy changes
- Visa/immigration updates
- Tax implications
- Business licensing changes
- Investment opportunities or restrictions
- Cost changes (fees, taxes, penalties)
- Deadlines and requirements`;
  }

  private parseAnalysisResponse(content: string): ArticleAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If not pure JSON, try to parse as-is
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse AI response:', error);

      // Return minimal analysis
      return {
        category: 'general',
        relevanceScore: 5,
        keyTopics: [],
        entities: {
          people: [],
          organizations: [],
          locations: [],
          dates: [],
          amounts: []
        },
        sentiment: 'neutral',
        importance: 'medium',
        summary: content.substring(0, 200),
        keyFacts: [],
        affectedAudience: [],
        tags: []
      };
    }
  }

  private validateAnalysis(analysis: any, article: any): ArticleAnalysis {
    // Ensure all required fields exist
    return {
      category: analysis.category || article.category,
      subcategory: analysis.subcategory,
      relevanceScore: Math.min(10, Math.max(0, analysis.relevanceScore || 5)),
      keyTopics: Array.isArray(analysis.keyTopics) ? analysis.keyTopics : [],
      entities: {
        people: Array.isArray(analysis.entities?.people) ? analysis.entities.people : [],
        organizations: Array.isArray(analysis.entities?.organizations) ? analysis.entities.organizations : [],
        locations: Array.isArray(analysis.entities?.locations) ? analysis.entities.locations : [],
        dates: Array.isArray(analysis.entities?.dates) ? analysis.entities.dates : [],
        amounts: Array.isArray(analysis.entities?.amounts) ? analysis.entities.amounts : []
      },
      sentiment: analysis.sentiment || 'neutral',
      importance: analysis.importance || 'medium',
      summary: analysis.summary || article.title,
      keyFacts: Array.isArray(analysis.keyFacts) ? analysis.keyFacts : [],
      actionableInfo: analysis.actionableInfo,
      affectedAudience: Array.isArray(analysis.affectedAudience) ? analysis.affectedAudience : [],
      tags: Array.isArray(analysis.tags) ? analysis.tags : []
    };
  }

  private fallbackAnalysis(article: any): ArticleAnalysis {
    // Simple keyword-based analysis as fallback
    const content = `${article.title} ${article.content}`.toLowerCase();

    const keyTopics = [];
    const tags = [];

    // Category-specific keywords
    const categoryKeywords: Record<string, string[]> = {
      immigration: ['visa', 'permit', 'kitas', 'passport', 'immigration'],
      business: ['company', 'pt', 'pma', 'investment', 'license'],
      tax: ['tax', 'pajak', 'npwp', 'spt', 'fiscal'],
      property: ['property', 'land', 'ownership', 'hgb', 'lease'],
      finance: ['bank', 'rupiah', 'investment', 'interest', 'loan']
    };

    for (const [topic, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(k => content.includes(k))) {
        keyTopics.push(topic);
        tags.push(...keywords.filter(k => content.includes(k)));
      }
    }

    return {
      category: article.category,
      relevanceScore: 5,
      keyTopics,
      entities: {
        people: [],
        organizations: [],
        locations: ['Bali', 'Indonesia'].filter(l => content.includes(l.toLowerCase())),
        dates: [],
        amounts: []
      },
      sentiment: 'neutral',
      importance: 'medium',
      summary: article.title,
      keyFacts: [],
      affectedAudience: ['expats', 'foreign investors'],
      tags
    };
  }
}
```

## 3. Article Synthesizer (Gemini Flash - FREE)

```typescript
// src/ai/synthesizers/article-synthesizer.ts
import { OpenRouterClient, AI_MODELS } from '../openrouter-client';
import { ArticleAnalysis } from '../analyzers/article-analyzer';

export interface SynthesizedArticle {
  title: string;
  subtitle?: string;
  content: string;
  summary: string;
  keyPoints: string[];
  sources: Array<{
    name: string;
    url: string;
    tier: string;
  }>;
  metadata: {
    readingTime: number;
    complexity: 'beginner' | 'intermediate' | 'advanced';
    audienceRelevance: Record<string, number>;
  };
}

export class ArticleSynthesizer {
  constructor(private client: OpenRouterClient) {}

  async synthesize(
    analyses: ArticleAnalysis[],
    rawArticles: any[],
    category: string
  ): Promise<SynthesizedArticle> {

    const prompt = this.buildSynthesisPrompt(analyses, rawArticles, category);

    const systemPrompt = `You are the senior editor at Bali Zero Journal.
Your audience consists of:
- Foreign investors considering Indonesian opportunities
- Digital nomads living in or moving to Bali
- Expat business owners navigating Indonesian regulations
- International companies expanding to Indonesia

Writing Style:
- Professional but conversational
- Clear and concise
- Focus on practical implications
- Include specific dates, amounts, requirements
- Explain Indonesian terms when first used

Article Structure:
1. Compelling headline that highlights the KEY CHANGE or NEWS
2. Lead paragraph: WHO is affected, WHAT changed, WHEN it takes effect
3. Body: Details, implications, requirements
4. Practical takeaways: What readers need to DO
5. Sources and verification`;

    try {
      const { content } = await this.client.complete(
        prompt,
        AI_MODELS.GEMINI_FLASH, // FREE model with 1M+ context
        {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 3000
        }
      );

      return this.parseAndEnhance(content, analyses, rawArticles);

    } catch (error) {
      console.error('Synthesis failed:', error);

      // Try backup model
      return this.synthesizeWithBackup(analyses, rawArticles, category);
    }
  }

  private buildSynthesisPrompt(
    analyses: ArticleAnalysis[],
    rawArticles: any[],
    category: string
  ): string {

    // Sort by importance and relevance
    const topAnalyses = analyses
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    // Extract key facts
    const allKeyFacts = topAnalyses.flatMap(a => a.keyFacts);
    const uniqueFacts = [...new Set(allKeyFacts)];

    // Get all entities
    const entities = {
      organizations: [...new Set(topAnalyses.flatMap(a => a.entities.organizations))],
      dates: [...new Set(topAnalyses.flatMap(a => a.entities.dates))],
      amounts: [...new Set(topAnalyses.flatMap(a => a.entities.amounts))]
    };

    return `Create a professional news article for Bali Zero Journal about ${category} news in Indonesia.

SOURCE MATERIALS:
${topAnalyses.map((a, i) => `
Source ${i + 1} (${rawArticles[i]?.tier || 'T2'}):
- Summary: ${a.summary}
- Key Facts: ${a.keyFacts.join('; ')}
- Importance: ${a.importance}
- Actionable: ${a.actionableInfo || 'None'}
`).join('\n')}

KEY ENTITIES MENTIONED:
- Organizations: ${entities.organizations.join(', ')}
- Dates: ${entities.dates.join(', ')}
- Amounts: ${entities.amounts.join(', ')}

UNIQUE FACTS TO INCLUDE:
${uniqueFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Create an article with:
1. Attention-grabbing headline (max 80 chars)
2. Subtitle that expands on the headline (optional, max 120 chars)
3. Article body (500-800 words) that:
   - Opens with the most important information
   - Explains the context for foreign readers
   - Includes specific requirements, dates, costs
   - Provides practical guidance
   - Cites sources appropriately
4. Executive summary (100-150 words)
5. 3-5 key takeaway points

Format the response as:
HEADLINE: [headline]
SUBTITLE: [subtitle if applicable]
SUMMARY: [executive summary]
KEY POINTS:
- [point 1]
- [point 2]
- [point 3]
CONTENT:
[full article content]`;
  }

  private async synthesizeWithBackup(
    analyses: ArticleAnalysis[],
    rawArticles: any[],
    category: string
  ): Promise<SynthesizedArticle> {

    // Try GLM Air (FREE) as backup
    const prompt = `Synthesize these ${category} news items into one article:

${analyses.slice(0, 3).map(a => `- ${a.summary}`).join('\n')}

Create a 400-word article with headline and key points.`;

    const { content } = await this.client.complete(
      prompt,
      AI_MODELS.GLM_AIR,
      { temperature: 0.5, maxTokens: 2000 }
    );

    return this.parseAndEnhance(content, analyses, rawArticles);
  }

  private parseAndEnhance(
    content: string,
    analyses: ArticleAnalysis[],
    rawArticles: any[]
  ): SynthesizedArticle {

    // Extract sections from AI response
    const sections = this.extractSections(content);

    // Calculate reading time (200 words per minute)
    const wordCount = sections.content.split(' ').length;
    const readingTime = Math.ceil(wordCount / 200);

    // Determine complexity based on content
    const complexity = this.determineComplexity(sections.content);

    // Calculate audience relevance
    const audienceRelevance = this.calculateAudienceRelevance(analyses);

    return {
      title: sections.headline || 'Indonesia Business Update',
      subtitle: sections.subtitle,
      content: sections.content,
      summary: sections.summary || analyses[0]?.summary || '',
      keyPoints: sections.keyPoints,
      sources: rawArticles.slice(0, 5).map(a => ({
        name: a.source_name,
        url: a.url,
        tier: a.tier
      })),
      metadata: {
        readingTime,
        complexity,
        audienceRelevance
      }
    };
  }

  private extractSections(content: string): any {
    const sections: any = {
      headline: '',
      subtitle: '',
      summary: '',
      keyPoints: [],
      content: ''
    };

    // Try to extract structured sections
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('HEADLINE:')) {
        sections.headline = line.replace('HEADLINE:', '').trim();
      } else if (line.startsWith('SUBTITLE:')) {
        sections.subtitle = line.replace('SUBTITLE:', '').trim();
      } else if (line.startsWith('SUMMARY:')) {
        currentSection = 'summary';
        sections.summary = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('KEY POINTS:')) {
        currentSection = 'keyPoints';
      } else if (line.startsWith('CONTENT:')) {
        currentSection = 'content';
      } else if (line.startsWith('- ') && currentSection === 'keyPoints') {
        sections.keyPoints.push(line.substring(2).trim());
      } else if (currentSection === 'content') {
        sections.content += line + '\n';
      } else if (currentSection === 'summary') {
        sections.summary += ' ' + line;
      }
    }

    // Fallback if structure not found
    if (!sections.content) {
      sections.content = content;
      sections.headline = content.split('\n')[0].substring(0, 80);
    }

    return sections;
  }

  private determineComplexity(content: string): 'beginner' | 'intermediate' | 'advanced' {
    const complexTerms = [
      'regulatory', 'compliance', 'jurisdiction', 'fiscal', 'statutory',
      'amendment', 'provision', 'liability', 'subsidiary', 'acquisition'
    ];

    const complexCount = complexTerms.filter(term =>
      content.toLowerCase().includes(term)
    ).length;

    if (complexCount >= 5) return 'advanced';
    if (complexCount >= 2) return 'intermediate';
    return 'beginner';
  }

  private calculateAudienceRelevance(analyses: ArticleAnalysis[]): Record<string, number> {
    const relevance: Record<string, number> = {
      'digital_nomads': 0,
      'investors': 0,
      'business_owners': 0,
      'expats': 0
    };

    for (const analysis of analyses) {
      for (const audience of analysis.affectedAudience) {
        const key = audience.toLowerCase().replace(' ', '_');
        if (key in relevance) {
          relevance[key] += analysis.relevanceScore / analyses.length;
        }
      }
    }

    return relevance;
  }
}
```

## 4. Translation Service (GLM Air - FREE)

```typescript
// src/ai/translators/indonesian-translator.ts
import { OpenRouterClient, AI_MODELS } from '../openrouter-client';

export class IndonesianTranslator {
  constructor(private client: OpenRouterClient) {}

  async translate(
    text: string,
    direction: 'id-to-en' | 'en-to-id' = 'id-to-en'
  ): Promise<string> {

    const systemPrompt = direction === 'id-to-en'
      ? `You are a professional Indonesian to English translator specializing in legal and business documents.

Translation Guidelines:
1. Maintain formal tone for official documents
2. Keep Indonesian legal/business terms in parentheses when important
3. Translate currency amounts with both IDR and USD equivalent
4. Preserve document structure and formatting
5. Add clarifying notes for culture-specific terms

Important Terms:
- PT (Perseroan Terbatas) = Limited Liability Company
- PMA (Penanaman Modal Asing) = Foreign Investment Company
- NPWP = Tax Registration Number
- KITAS = Temporary Residence Permit
- OSS = Online Single Submission system`
      : `You are a professional English to Indonesian translator.
Translate naturally while maintaining clarity for business/legal contexts.`;

    const prompt = `Translate the following text from ${direction === 'id-to-en' ? 'Indonesian to English' : 'English to Indonesian'}:

${text}

Provide only the translation without any additional commentary.`;

    try {
      const { content } = await this.client.complete(
        prompt,
        AI_MODELS.GLM_AIR, // FREE model optimized for translation
        {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 4000
        }
      );

      return content.trim();

    } catch (error) {
      console.error('Translation failed:', error);

      // Fallback to Gemini Flash (also free)
      return this.translateWithGemini(text, direction);
    }
  }

  private async translateWithGemini(
    text: string,
    direction: 'id-to-en' | 'en-to-id'
  ): Promise<string> {
    const prompt = `Translate from ${direction === 'id-to-en' ? 'Indonesian to English' : 'English to Indonesian'}:
${text}`;

    const { content } = await this.client.complete(
      prompt,
      AI_MODELS.GEMINI_FLASH,
      { temperature: 0.3 }
    );

    return content.trim();
  }

  async translateBatch(
    texts: string[],
    direction: 'id-to-en' | 'en-to-id' = 'id-to-en'
  ): Promise<string[]> {

    // Batch small texts together to save API calls
    if (texts.length <= 3) {
      const combined = texts.map((t, i) => `[${i + 1}] ${t}`).join('\n\n');
      const translated = await this.translate(combined, direction);

      // Split back
      return translated.split(/\[\d+\]/).filter(t => t.trim()).map(t => t.trim());
    }

    // Process larger batches individually
    const results: string[] = [];
    for (const text of texts) {
      results.push(await this.translate(text, direction));
    }

    return results;
  }
}
```

## 5. AI Pipeline Orchestrator

```typescript
// src/ai/pipeline.ts
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
        const overlap = analyses[j].keyTopics.filter(t => baseTopics.has(t));
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
      article.sources.map(s => s.name),
      'neutral',
      article.metadata.audienceRelevance.expats || 7,
      'OpenRouter Multi-Model',
      this.client.getUsageStats().totalCost,
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
```

## 6. Prompt Templates

```typescript
// src/ai/prompts/templates.ts

export const PROMPT_TEMPLATES = {
  // Immigration Analysis
  immigration: {
    system: `You are an Indonesian immigration law expert advising foreign nationals.
Focus on: visa types, requirements, costs, processing times, restrictions, and recent changes.
Always specify which nationality the rules apply to.`,

    extraction: `Extract from this immigration news:
1. Type of visa/permit affected
2. Nationality restrictions
3. New requirements or changes
4. Costs (in IDR and USD)
5. Processing time
6. Effective date
7. Who needs to take action`,
  },

  // Business Analysis
  business: {
    system: `You are a business consultant specializing in Indonesian company law.
Focus on: company types (PT, PMA, CV), licensing (OSS, NIB), foreign ownership rules, capital requirements.`,

    extraction: `Extract from this business news:
1. Type of business entity affected
2. Licensing changes (OSS, NIB, etc.)
3. Capital requirements
4. Foreign ownership percentages
5. New regulations or procedures
6. Compliance deadlines
7. Penalties for non-compliance`,
  },

  // Tax Analysis
  tax: {
    system: `You are an Indonesian tax advisor for international clients.
Focus on: tax rates, filing deadlines, new regulations, penalties, tax treaties.`,

    extraction: `Extract from this tax news:
1. Type of tax affected (PPh, PPN, etc.)
2. New rates or thresholds
3. Filing deadlines
4. Documentation requirements
5. Penalties for non-compliance
6. Who is affected (residents, non-residents, companies)
7. Effective date`,
  },

  // Property Analysis
  property: {
    system: `You are a property law expert in Indonesia.
Focus on: foreign ownership rights, HGB, Hak Pakai, leasehold, property taxes.`,

    extraction: `Extract from this property news:
1. Type of property right (HGB, Hak Pakai, etc.)
2. Ownership restrictions for foreigners
3. New regulations or procedures
4. Costs and taxes
5. Documentation requirements
6. Location-specific rules (Bali, Jakarta, etc.)
7. Investment opportunities or restrictions`,
  },
};

export const SYNTHESIS_STYLES = {
  news_article: {
    tone: 'professional yet accessible',
    structure: 'inverted pyramid',
    length: '500-700 words',
    audience: 'expats and foreign investors'
  },

  brief: {
    tone: 'concise and factual',
    structure: 'bullet points with context',
    length: '200-300 words',
    audience: 'busy professionals'
  },

  analysis: {
    tone: 'analytical and comprehensive',
    structure: 'problem-implications-recommendations',
    length: '800-1000 words',
    audience: 'decision makers'
  }
};
```

## 7. Main AI Processing Script

```typescript
// src/process-articles.ts
import dotenv from 'dotenv';
import { AIPipeline } from './ai/pipeline';

dotenv.config();

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  const pipeline = new AIPipeline({
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    maxArticlesPerSynthesis: 5,
    minQualityScore: 7,
    translateIndonesian: true,
    generateImages: false // Will be added in next patch
  });

  try {
    // Process specific category
    if (process.argv[2]) {
      await pipeline.processCategory(process.argv[2]);
    } else {
      // Process all categories
      await pipeline.processAllCategories();
    }

    console.log('\n✅ AI Pipeline completed successfully!');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  } finally {
    await pipeline.close();
  }
}

main();
```

## 8. Environment Configuration

```bash
# .env additions
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Override default models
AI_PRIMARY_MODEL=deepseek/deepseek-r1
AI_SYNTHESIS_MODEL=google/gemini-2.0-flash-exp:free
AI_TRANSLATION_MODEL=zhipu/glm-4-air

# Cost limits
AI_MAX_COST_PER_DAY=1.00
AI_MAX_COST_PER_ARTICLE=0.05
```

## 9. Package.json Updates

```json
{
  "scripts": {
    "process": "ts-node src/process-articles.ts",
    "process:immigration": "ts-node src/process-articles.ts immigration",
    "process:business": "ts-node src/process-articles.ts business",
    "process:all": "ts-node src/process-articles.ts",
    "ai:test": "ts-node src/ai/test-models.ts"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "events": "^3.3.0"
  }
}
```

## 10. Test Script

```typescript
// src/ai/test-models.ts
import { OpenRouterClient, AI_MODELS } from './openrouter-client';

async function testModels() {
  const client = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);

  const testPrompt = "What are the key requirements for a B211A visa in Indonesia? Answer in 2 sentences.";

  console.log('🧪 Testing AI Models...\n');

  for (const model of Object.values(AI_MODELS)) {
    try {
      console.log(`Testing ${model.name}...`);
      const start = Date.now();

      const result = await client.complete(testPrompt, model, {
        temperature: 0.5,
        maxTokens: 100
      });

      const duration = Date.now() - start;

      console.log(`✅ ${model.name}:`);
      console.log(`   Response: ${result.content.substring(0, 100)}...`);
      console.log(`   Cost: $${result.cost.toFixed(6)}`);
      console.log(`   Time: ${duration}ms\n`);

    } catch (error: any) {
      console.log(`❌ ${model.name} failed: ${error.message}\n`);
    }
  }

  const stats = client.getUsageStats();
  console.log('📊 Total Test Cost:', `$${stats.totalCost}`);
}

testModels().catch(console.error);
```

## Usage Instructions

```bash
# 1. Set up OpenRouter API key
export OPENROUTER_API_KEY="sk-or-v1-..."

# 2. Test AI models
npm run ai:test

# 3. Process articles for specific category
npm run process:immigration

# 4. Process all categories
npm run process:all

# 5. Run with custom settings
AI_PRIMARY_MODEL="qwen/qwq-32b-preview" npm run process

# Expected output:
# 🚀 Starting AI Pipeline for all categories...
#
# 🔄 Processing immigration articles...
# 📚 Found 15 articles to process
#   🔍 Analyzing: New B211A Visa Requirements Announced...
#   🌐 Translating: Persyaratan Visa B211A Terbaru...
#   ✅ Analyzed 12 relevant articles
#   📝 Created 3 synthesized articles
#
# 💰 AI Processing Cost Summary:
#    Total Cost: $0.0023
#    🆓 DeepSeek R1: 12 requests ($0.0000)
#    🆓 Gemini Flash: 3 requests ($0.0000)
#    🆓 GLM Air: 5 requests ($0.0000)
#    💵 Qwen QwQ: 1 requests ($0.0023)
```

## Cost Analysis

With the FREE models strategy:
- **DeepSeek R1**: $0 (primary analyzer)
- **Gemini Flash**: $0 (synthesis)
- **GLM Air**: $0 (translation)
- **Backup models**: ~$0.01-0.05 per 100 articles

**Monthly estimate**: <$5 for 10,000+ articles processed!

## Key Features

1. **Multi-Model Fallback** - Automatic failover between models
2. **Cost Tracking** - Real-time cost monitoring
3. **FREE First** - Always tries free models first
4. **Smart Batching** - Groups similar articles for synthesis
5. **Translation** - Automatic Indonesian→English
6. **Quality Filtering** - Only processes high-quality content
7. **Entity Extraction** - Identifies people, orgs, dates, amounts
8. **Audience Targeting** - Relevance scoring for different audiences
9. **Complexity Analysis** - Determines reading level
10. **Source Attribution** - Maintains source credibility tiers

---
END OF PATCH 3: AI PIPELINE
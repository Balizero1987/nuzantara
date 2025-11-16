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


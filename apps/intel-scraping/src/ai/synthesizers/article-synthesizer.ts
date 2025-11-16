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
        name: a.source_name || 'Unknown',
        url: a.url || '',
        tier: a.tier || 'T2'
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


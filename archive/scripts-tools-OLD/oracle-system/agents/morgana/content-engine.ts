/**
 * MORGANA - Content Intelligence and Generation Engine
 * Creates viral content, analyzes trends, and mines colleague intelligence
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cron from 'node-cron';

interface ContentPiece {
  id: string;
  type: 'blog' | 'social' | 'video_script' | 'infographic' | 'email' | 'case_study';
  platform: string[];
  title: string;
  content: string;
  hashtags?: string[];
  visualElements?: string[];
  cta?: string;
  targetAudience: string;
  language: string;
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational';
  viralScore: number; // 0-100
  engagementPrediction: number;
  publishTime?: Date;
  source?: string; // Which Oracle agent provided the insight
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

interface TrendAnalysis {
  platform: string;
  trending: TrendingTopic[];
  bestTimes: string[];
  contentTypes: string[];
  engagement: EngagementMetrics;
}

interface TrendingTopic {
  topic: string;
  volume: number;
  growth: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  opportunity: string;
}

interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  saves: number;
  clickThrough: number;
}

interface ColleagueInsight {
  source: string; // Which Oracle agent
  finding: string;
  contentOpportunity: ContentOpportunity[];
  timestamp: Date;
}

interface ContentOpportunity {
  type: string;
  urgency: 'immediate' | 'this_week' | 'evergreen';
  format: string[];
  angle: string;
  expectedViralScore: number;
}

interface ContentCalendar {
  date: Date;
  slots: ContentSlot[];
}

interface ContentSlot {
  time: string;
  platform: string;
  content: ContentPiece;
  status: 'scheduled' | 'published' | 'draft';
}

interface CompetitorContent {
  competitor: string;
  content: string;
  platform: string;
  engagement: EngagementMetrics;
  publishedDate: Date;
  successFactors: string[];
}

export class Morgana {
  private gemini: any;
  private contentQueue: Map<string, ContentPiece> = new Map();
  private trends: Map<string, TrendAnalysis> = new Map();
  private colleagueInsights: ColleagueInsight[] = [];
  private contentCalendar: Map<string, ContentCalendar> = new Map();
  private competitorContent: CompetitorContent[] = [];
  private contentTemplates: any;

  constructor() {
    this.initializeAI();
    this.loadContentTemplates();
    this.initializeScheduler();
  }

  private initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  private loadContentTemplates() {
    this.contentTemplates = {
      hooks: {
        visa: [
          "🚨 VISA UPDATE: {update}",
          "Planning to move to Bali? Here's what just changed...",
          "Immigration just announced... (this affects you)",
          "The visa nobody talks about: {visa_type}"
        ],
        business: [
          "How we helped {client} launch in Bali in just {time}",
          "The hidden KBLI code that saves {amount} in taxes",
          "Why 90% of Bali businesses fail (and how to be the 10%)",
          "From idea to Indonesian PT in 14 days: Here's how"
        ],
        tax: [
          "The {amount} tax mistake every expat makes",
          "Legal tax hack: Pay 0.5% instead of 22%",
          "Tax deadline tomorrow! Here's what you need",
          "How {client} saved {amount} with one simple change"
        ],
        property: [
          "This Canggu villa just sold for {price} below market",
          "New property law changes everything for foreigners",
          "The only 3 areas in Bali still worth investing",
          "Why smart money is leaving Seminyak for {area}"
        ]
      },

      formats: {
        instagram: {
          post: {
            maxLength: 2200,
            idealLength: 150,
            hashtags: 30,
            mentions: 10
          },
          reel: {
            duration: '15-90 seconds',
            hook: 'First 3 seconds critical',
            cta: 'Comment/Save/Share'
          },
          story: {
            duration: '15 seconds',
            interactive: 'Polls, questions, quizzes'
          }
        },

        linkedin: {
          post: {
            maxLength: 3000,
            idealLength: 600,
            tone: 'professional',
            hashtags: 5
          },
          article: {
            minLength: 500,
            idealLength: 1500,
            sections: true
          }
        },

        tiktok: {
          video: {
            duration: '15-60 seconds',
            hook: 'First 1 second',
            trending: 'Use trending sounds'
          }
        },

        blog: {
          minLength: 800,
          idealLength: 1500,
          seo: true,
          images: 3
        }
      },

      languages: {
        EN: 'English - International audience',
        ID: 'Bahasa Indonesia - Local market',
        IT: 'Italiano - Italian expats (Zero)',
        RU: 'Русский - Russian speakers',
        UA: 'Українська - Ukrainian community'
      },

      tones: {
        professional: 'Authoritative, trustworthy, expert',
        casual: 'Friendly, approachable, conversational',
        humorous: 'Light, fun, relatable (memes)',
        inspirational: 'Motivating, success stories',
        educational: 'Informative, how-to, teaching'
      }
    };
  }

  private initializeScheduler() {
    // Hourly trend checking
    cron.schedule('0 * * * *', () => {
      this.analyzeTrends();
    });

    // Daily content generation
    cron.schedule('0 6 * * *', () => {
      this.generateDailyContent();
    });

    // Monitor colleague insights every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.checkColleagueInsights();
    });

    // Weekly competitor analysis
    cron.schedule('0 9 * * 1', () => {
      this.analyzeCompetitors();
    });
  }

  /**
   * Analyze colleague Oracle insights for content
   */
  async analyzeColleagueWork(oracleUpdate: any): Promise<ContentOpportunity[]> {
    const opportunities: ContentOpportunity[] = [];

    // Analyze based on source Oracle
    switch (oracleUpdate.source) {
      case 'VISA_ORACLE':
        opportunities.push(...this.analyzeVisaContent(oracleUpdate));
        break;

      case 'KBLI_EYE':
        opportunities.push(...this.analyzeBusinessContent(oracleUpdate));
        break;

      case 'TAX_GENIUS':
        opportunities.push(...this.analyzeTaxContent(oracleUpdate));
        break;

      case 'LEGAL_ARCHITECT':
        opportunities.push(...this.analyzePropertyContent(oracleUpdate));
        break;
    }

    // Store insights
    this.colleagueInsights.push({
      source: oracleUpdate.source,
      finding: oracleUpdate.title || oracleUpdate.finding,
      contentOpportunity: opportunities,
      timestamp: new Date()
    });

    return opportunities;
  }

  private analyzeVisaContent(update: any): ContentOpportunity[] {
    const opportunities: ContentOpportunity[] = [];

    if (update.type === 'regulation' || update.impact === 'critical') {
      opportunities.push({
        type: 'breaking_news',
        urgency: 'immediate',
        format: ['social_post', 'story', 'email_blast'],
        angle: `Breaking: ${update.title}`,
        expectedViralScore: 85
      });

      opportunities.push({
        type: 'explainer',
        urgency: 'this_week',
        format: ['blog', 'video', 'infographic'],
        angle: `What the new visa changes mean for you`,
        expectedViralScore: 70
      });
    }

    if (update.processingTime) {
      opportunities.push({
        type: 'tips',
        urgency: 'evergreen',
        format: ['carousel', 'reel'],
        angle: `How to get your visa in ${update.processingTime}`,
        expectedViralScore: 60
      });
    }

    return opportunities;
  }

  private analyzeBusinessContent(update: any): ContentOpportunity[] {
    const opportunities: ContentOpportunity[] = [];

    if (update.type === 'oss_update') {
      opportunities.push({
        type: 'tutorial',
        urgency: 'this_week',
        format: ['video', 'blog'],
        angle: 'Step-by-step OSS guide (updated)',
        expectedViralScore: 65
      });
    }

    if (update.kbliCode) {
      opportunities.push({
        type: 'educational',
        urgency: 'evergreen',
        format: ['infographic', 'carousel'],
        angle: `KBLI ${update.kbliCode}: Everything you need to know`,
        expectedViralScore: 55
      });
    }

    return opportunities;
  }

  private analyzeTaxContent(update: any): ContentOpportunity[] {
    const opportunities: ContentOpportunity[] = [];

    if (update.deadline) {
      opportunities.push({
        type: 'reminder',
        urgency: 'immediate',
        format: ['social_post', 'story', 'email'],
        angle: `⏰ Tax deadline in ${update.daysUntil} days`,
        expectedViralScore: 75
      });
    }

    if (update.optimization) {
      opportunities.push({
        type: 'case_study',
        urgency: 'this_week',
        format: ['blog', 'video'],
        angle: `How to save ${update.savingAmount} on taxes (legally)`,
        expectedViralScore: 80
      });
    }

    return opportunities;
  }

  private analyzePropertyContent(update: any): ContentOpportunity[] {
    const opportunities: ContentOpportunity[] = [];

    if (update.type === 'market_opportunity') {
      opportunities.push({
        type: 'investment',
        urgency: 'immediate',
        format: ['blog', 'email', 'video'],
        angle: `Hidden gem: ${update.location} property opportunity`,
        expectedViralScore: 70
      });
    }

    if (update.priceChange) {
      opportunities.push({
        type: 'market_update',
        urgency: 'this_week',
        format: ['infographic', 'post'],
        angle: `${update.area} property prices ${update.direction} ${update.percentage}%`,
        expectedViralScore: 65
      });
    }

    return opportunities;
  }

  /**
   * Generate content from opportunity
   */
  async generateContent(opportunity: ContentOpportunity): Promise<ContentPiece> {
    const format = opportunity.format[0];
    const platform = this.getPlatformForFormat(format);

    // Generate content using AI
    const prompt = `
    Create ${format} content for ${platform}:

    Topic: ${opportunity.angle}
    Type: ${opportunity.type}
    Tone: ${this.selectTone(opportunity.type)}
    Length: ${this.getIdealLength(format)}

    Include:
    - Strong hook
    - Value proposition
    - Call to action
    - Hashtags (if social)

    Make it shareable and engaging.
    `;

    let content = '';
    let title = opportunity.angle;

    if (this.gemini) {
      try {
        const result = await this.gemini.generateContent(prompt);
        const response = result.response.text();
        content = response;
      } catch (error) {
        console.error('[MORGANA] Content generation error:', error);
        content = this.generateFallbackContent(opportunity);
      }
    } else {
      content = this.generateFallbackContent(opportunity);
    }

    // Extract hashtags
    const hashtags = this.extractHashtags(content);

    // Calculate viral score
    const viralScore = this.calculateViralScore(content, opportunity);

    // Determine classification
    const classification = this.classifyContent(opportunity, content);

    const contentPiece: ContentPiece = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapFormatToType(format),
      platform: [platform],
      title,
      content,
      hashtags,
      targetAudience: this.identifyAudience(opportunity),
      language: 'EN', // Default
      tone: this.selectTone(opportunity.type),
      viralScore,
      engagementPrediction: viralScore * 0.8,
      source: 'MORGANA_GENERATED',
      classification
    };

    // Add to queue
    this.contentQueue.set(contentPiece.id, contentPiece);

    return contentPiece;
  }

  /**
   * Generate content calendar
   */
  async generateContentCalendar(days: number = 7): Promise<ContentCalendar[]> {
    const calendar: ContentCalendar[] = [];
    const optimalTimes = this.getOptimalPostingTimes();

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dayCalendar: ContentCalendar = {
        date,
        slots: []
      };

      // Generate content for each optimal time
      optimalTimes.forEach(time => {
        const platform = this.selectPlatformForTime(time);
        const content = this.selectContentForSlot(date, time, platform);

        if (content) {
          dayCalendar.slots.push({
            time,
            platform,
            content,
            status: 'scheduled'
          });
        }
      });

      calendar.push(dayCalendar);
    }

    return calendar;
  }

  /**
   * Analyze trends across platforms
   */
  private async analyzeTrends() {
    const platforms = ['instagram', 'tiktok', 'linkedin', 'twitter'];

    for (const platform of platforms) {
      const trends = await this.getTrendsForPlatform(platform);
      this.trends.set(platform, trends);
    }
  }

  private async getTrendsForPlatform(platform: string): Promise<TrendAnalysis> {
    // Simplified trend analysis
    const trending: TrendingTopic[] = [];

    // Common Bali/Indonesia business trends
    const topics = [
      { topic: '#balilife', volume: 50000, growth: 0.15, sentiment: 'positive' as const },
      { topic: '#digitalnomad', volume: 30000, growth: 0.25, sentiment: 'positive' as const },
      { topic: '#indonesiavisa', volume: 5000, growth: 0.10, sentiment: 'neutral' as const },
      { topic: '#balibusiness', volume: 3000, growth: 0.20, sentiment: 'positive' as const }
    ];

    topics.forEach(t => {
      trending.push({
        ...t,
        opportunity: `Create content about ${t.topic} for ${t.growth * 100}% growth`
      });
    });

    return {
      platform,
      trending,
      bestTimes: this.getBestTimesForPlatform(platform),
      contentTypes: this.getBestContentTypes(platform),
      engagement: {
        likes: 1000,
        shares: 200,
        comments: 150,
        saves: 300,
        clickThrough: 0.03
      }
    };
  }

  /**
   * Generate daily content batch
   */
  private async generateDailyContent() {
    // Get latest insights from colleagues
    const latestInsights = this.colleagueInsights
      .filter(i => {
        const hoursSince = (Date.now() - i.timestamp.getTime()) / (1000 * 60 * 60);
        return hoursSince < 24;
      });

    // Generate content for each insight
    for (const insight of latestInsights) {
      for (const opportunity of insight.contentOpportunity) {
        if (opportunity.urgency === 'immediate') {
          await this.generateContent(opportunity);
        }
      }
    }

    console.log(`[MORGANA] Generated ${latestInsights.length} content pieces`);
  }

  /**
   * Check colleague Oracle outputs
   */
  private async checkColleagueInsights() {
    // This would connect to other Oracle agents
    // For now, simulate checking
    console.log('[MORGANA] Checking colleague Oracle insights...');
  }

  /**
   * Analyze competitor content
   */
  private async analyzeCompetitors() {
    const competitors = [
      'balivisas.com',
      'balibiznest.com',
      'seven.stones.com',
      'emerhub.com'
    ];

    for (const competitor of competitors) {
      // Would scrape competitor social/blog
      console.log(`[MORGANA] Analyzing competitor: ${competitor}`);
    }
  }

  /**
   * Calculate viral potential score
   */
  private calculateViralScore(content: string, opportunity: ContentOpportunity): number {
    let score = opportunity.expectedViralScore || 50;

    // Adjust based on content factors
    if (content.includes('Breaking') || content.includes('Urgent')) score += 10;
    if (content.includes('save money') || content.includes('free')) score += 5;
    if (content.includes('step-by-step') || content.includes('how to')) score += 5;
    if (content.length < 100) score += 5; // Short and punchy
    if (content.includes('?')) score += 3; // Questions engage

    // Check trending topics
    const trendingTopics = Array.from(this.trends.values())
      .flatMap(t => t.trending.map(tr => tr.topic));

    trendingTopics.forEach(topic => {
      if (content.toLowerCase().includes(topic.replace('#', ''))) {
        score += 5;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Classify content security level
   */
  private classifyContent(opportunity: ContentOpportunity, content: string): 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' {
    // Content is usually public unless it contains sensitive info
    const text = content.toLowerCase();

    if (text.includes('confidential') || text.includes('internal only') ||
        text.includes('do not share')) {
      return 'CONFIDENTIAL';
    }

    if (text.includes('team only') || text.includes('internal process') ||
        text.includes('our strategy')) {
      return 'INTERNAL';
    }

    return 'PUBLIC';
  }

  // Helper methods
  private getPlatformForFormat(format: string): string {
    const platformMap = {
      'social_post': 'instagram',
      'story': 'instagram',
      'reel': 'instagram',
      'carousel': 'instagram',
      'video': 'youtube',
      'blog': 'website',
      'infographic': 'instagram',
      'email': 'email',
      'email_blast': 'email'
    };

    return platformMap[format] || 'instagram';
  }

  private selectTone(type: string): ContentPiece['tone'] {
    const toneMap = {
      'breaking_news': 'professional',
      'tutorial': 'educational',
      'tips': 'casual',
      'case_study': 'inspirational',
      'reminder': 'professional',
      'investment': 'professional',
      'market_update': 'professional'
    };

    return toneMap[type] || 'casual';
  }

  private getIdealLength(format: string): string {
    const lengths = {
      'social_post': '150 characters',
      'blog': '1500 words',
      'video': '60 seconds script',
      'story': '15 seconds',
      'carousel': '10 slides, 50 words each',
      'infographic': '5-7 data points',
      'email': '200 words'
    };

    return lengths[format] || '200 words';
  }

  private generateFallbackContent(opportunity: ContentOpportunity): string {
    const templates = {
      'breaking_news': `🚨 BREAKING: ${opportunity.angle}\n\nThis changes everything for expats in Bali.\n\nHere's what you need to know:\n\n→ Point 1\n→ Point 2\n→ Point 3\n\nNeed help navigating this? DM us.\n\n#BaliNews #ExpatLife #Indonesia`,

      'tutorial': `How to ${opportunity.angle} ⬇️\n\nStep 1: [Action]\nStep 2: [Action]\nStep 3: [Action]\n\nSave this for later! 💾\n\n#HowTo #BaliLife #Tutorial`,

      'case_study': `SUCCESS STORY 🎉\n\n${opportunity.angle}\n\n"Best decision we ever made" - Happy Client\n\nWant similar results? Link in bio.\n\n#SuccessStory #BaliSuccess #ClientWin`
    };

    return templates[opportunity.type] || `${opportunity.angle}\n\nContact us to learn more.\n\n#Bali #Indonesia`;
  }

  private extractHashtags(content: string): string[] {
    const hashtags = content.match(/#\w+/g) || [];
    return hashtags.map(h => h.replace('#', ''));
  }

  private mapFormatToType(format: string): ContentPiece['type'] {
    if (format.includes('blog')) return 'blog';
    if (format.includes('email')) return 'email';
    if (format.includes('video')) return 'video_script';
    if (format.includes('infographic')) return 'infographic';
    if (format.includes('case')) return 'case_study';
    return 'social';
  }

  private identifyAudience(opportunity: ContentOpportunity): string {
    const audienceMap = {
      'breaking_news': 'All expats in Indonesia',
      'tutorial': 'New arrivals to Bali',
      'tips': 'Digital nomads',
      'case_study': 'Potential clients',
      'reminder': 'Existing clients',
      'investment': 'Property investors',
      'market_update': 'Business owners'
    };

    return audienceMap[opportunity.type] || 'Bali expat community';
  }

  private getOptimalPostingTimes(): string[] {
    return ['09:00', '12:00', '15:00', '19:00', '21:00'];
  }

  private selectPlatformForTime(time: string): string {
    const timePlatformMap = {
      '09:00': 'linkedin',
      '12:00': 'instagram',
      '15:00': 'facebook',
      '19:00': 'instagram',
      '21:00': 'tiktok'
    };

    return timePlatformMap[time] || 'instagram';
  }

  private selectContentForSlot(date: Date, time: string, platform: string): ContentPiece | null {
    // Select appropriate content from queue
    const availableContent = Array.from(this.contentQueue.values())
      .filter(c => c.platform.includes(platform) && !c.publishTime);

    if (availableContent.length > 0) {
      const selected = availableContent[0];
      selected.publishTime = new Date(date);
      selected.publishTime.setHours(parseInt(time.split(':')[0]));
      return selected;
    }

    return null;
  }

  private getBestTimesForPlatform(platform: string): string[] {
    const times = {
      'instagram': ['09:00', '12:00', '19:00'],
      'linkedin': ['08:00', '12:00', '17:00'],
      'tiktok': ['06:00', '10:00', '21:00'],
      'twitter': ['09:00', '15:00', '20:00']
    };

    return times[platform] || ['09:00', '15:00', '20:00'];
  }

  private getBestContentTypes(platform: string): string[] {
    const types = {
      'instagram': ['Reels', 'Carousel', 'Stories'],
      'linkedin': ['Articles', 'Posts', 'Documents'],
      'tiktok': ['Short videos', 'Trends', 'Challenges'],
      'twitter': ['Threads', 'Quotes', 'News']
    };

    return types[platform] || ['Posts'];
  }

  // Public methods
  public getContentQueue(): ContentPiece[] {
    return Array.from(this.contentQueue.values())
      .sort((a, b) => b.viralScore - a.viralScore);
  }

  public getTrends(): TrendAnalysis[] {
    return Array.from(this.trends.values());
  }

  public getContentCalendar(days: number = 7): Promise<ContentCalendar[]> {
    return this.generateContentCalendar(days);
  }

  public async createContent(topic: string, format: string): Promise<ContentPiece> {
    const opportunity: ContentOpportunity = {
      type: 'custom',
      urgency: 'immediate',
      format: [format],
      angle: topic,
      expectedViralScore: 60
    };

    return this.generateContent(opportunity);
  }
}

// Handler for ZANTARA integration
export async function handleContentQuery(params: any): Promise<any> {
  const morgana = new Morgana();

  if (params.action === 'generate') {
    return await morgana.createContent(params.topic, params.format || 'social_post');
  }

  if (params.action === 'analyze_colleague') {
    return await morgana.analyzeColleagueWork(params.oracleUpdate);
  }

  if (params.action === 'calendar') {
    return await morgana.getContentCalendar(params.days || 7);
  }

  if (params.action === 'queue') {
    return morgana.getContentQueue();
  }

  if (params.action === 'trends') {
    return morgana.getTrends();
  }

  return {
    error: 'Please specify action: generate, analyze_colleague, calendar, queue, or trends'
  };
}
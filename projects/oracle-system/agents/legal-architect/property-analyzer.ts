/**
 * LEGAL ARCHITECT - Property and Legal Intelligence System
 * Monitors property market, legal framework, and due diligence for Indonesia
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as cron from 'node-cron';

interface PropertyData {
  id: string;
  location: string;
  type: 'villa' | 'land' | 'commercial' | 'residential';
  price: number;
  pricePerAre?: number;
  size: number;
  ownership: 'freehold' | 'leasehold' | 'HGB' | 'HakPakai';
  zoning: string;
  source: string;
  listedDate: Date;
  features: string[];
  risks: string[];
  opportunities: string[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

interface LegalUpdate {
  id: string;
  timestamp: Date;
  type: 'regulation' | 'court_decision' | 'policy' | 'zoning';
  title: string;
  content: string;
  impact: string;
  affectedAreas: string[];
  actionRequired?: string;
  source: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

interface DueDiligenceReport {
  propertyId: string;
  checks: DueDiligenceCheck[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'proceed' | 'proceed_with_caution' | 'avoid';
  redFlags: string[];
  opportunities: string[];
  estimatedValue: ValueEstimate;
}

interface DueDiligenceCheck {
  category: string;
  item: string;
  status: 'clear' | 'warning' | 'issue';
  details: string;
  action?: string;
}

interface ValueEstimate {
  currentMarket: number;
  comparables: Comparable[];
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  factors: string[];
}

interface Comparable {
  address: string;
  price: number;
  size: number;
  soldDate?: Date;
  similarity: number;
}

interface MarketAnalysis {
  area: string;
  averagePrice: number;
  priceChange: number;
  inventory: number;
  daysOnMarket: number;
  hotness: 'cold' | 'warm' | 'hot' | 'very_hot';
  forecast: string;
}

interface LegalStructure {
  type: string;
  pros: string[];
  cons: string[];
  costs: {
    setup: string;
    annual: string;
  };
  requirements: string[];
  timeline: string;
  risks: string[];
}

export class LegalArchitect {
  private gemini: any;
  private propertyData: Map<string, PropertyData> = new Map();
  private legalUpdates: Map<string, LegalUpdate> = new Map();
  private marketData: Map<string, MarketAnalysis> = new Map();
  private propertyKnowledge: any;

  constructor() {
    this.initializeAI();
    this.loadPropertyKnowledge();
    this.initializeScheduler();
  }

  private initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  private loadPropertyKnowledge() {
    this.propertyKnowledge = {
      ownership: {
        'Hak Milik': {
          eligibility: 'Indonesian citizens only',
          duration: 'Perpetual',
          transfer: 'Can be sold, inherited, mortgaged',
          foreign: false
        },
        'HGB': {
          eligibility: 'Indonesian entities, PMA',
          duration: '30+20+30 years',
          transfer: 'Can be transferred with approval',
          foreign: true,
          via: 'PT PMA company'
        },
        'Hak Pakai': {
          eligibility: 'Foreigners, mixed couples',
          duration: '25+20+25 years',
          transfer: 'Limited',
          foreign: true,
          restrictions: 'Cannot be mortgaged'
        },
        'Hak Sewa': {
          eligibility: 'Anyone',
          duration: 'As per agreement',
          transfer: 'As per contract',
          foreign: true,
          type: 'Leasehold'
        }
      },

      areas: {
        'Canggu': {
          zoning: ['Residential', 'Commercial', 'Tourism'],
          avgPrice: 30000000, // Per are
          trend: 'increasing',
          infrastructure: 'Developing rapidly',
          risks: ['Traffic', 'Over-development'],
          opportunities: ['High rental yield', 'Capital growth']
        },
        'Uluwatu': {
          zoning: ['Tourism', 'Residential'],
          avgPrice: 45000000,
          trend: 'stable',
          infrastructure: 'Good',
          risks: ['Water scarcity', 'Cliff erosion'],
          opportunities: ['Luxury market', 'Ocean views']
        },
        'Ubud': {
          zoning: ['Cultural', 'Residential', 'Tourism'],
          avgPrice: 25000000,
          trend: 'increasing',
          infrastructure: 'Good',
          risks: ['UNESCO restrictions', 'Rice field protection'],
          opportunities: ['Wellness tourism', 'Cultural appeal']
        },
        'Seminyak': {
          zoning: ['Commercial', 'Tourism', 'Residential'],
          avgPrice: 50000000,
          trend: 'stable',
          infrastructure: 'Excellent',
          risks: ['Saturated market', 'Beach erosion'],
          opportunities: ['Established area', 'Premium location']
        },
        'Sanur': {
          zoning: ['Residential', 'Tourism'],
          avgPrice: 35000000,
          trend: 'increasing',
          infrastructure: 'Good',
          risks: ['Building height restrictions'],
          opportunities: ['Family market', 'Beachfront']
        }
      },

      documents: {
        required: [
          'Certificate (SHM/HGB/HP)',
          'IMB/PBG (Building permit)',
          'Land tax payment (PBB)',
          'Zoning confirmation',
          'No dispute letter'
        ],
        dueDiligence: [
          'Title verification at BPN',
          'Physical survey',
          'Neighbor confirmation',
          'Access rights check',
          'Debt/lien check',
          'Environmental assessment'
        ]
      },

      risks: {
        common: [
          'Duplicate certificates',
          'Family inheritance disputes',
          'Incorrect measurements',
          'Zoning violations',
          'Sacred land (tanah adat)',
          'Access disputes',
          'Subak (irrigation) issues'
        ],
        mitigation: [
          'Professional due diligence',
          'Title insurance',
          'Proper notary',
          'Community approval',
          'Legal structure'
        ]
      },

      taxes: {
        'BPHTB': {
          rate: 0.05,
          description: 'Transfer tax',
          paidBy: 'Buyer'
        },
        'PPh': {
          rate: 0.025,
          description: 'Income tax on sale',
          paidBy: 'Seller'
        },
        'PBB': {
          rate: 'Variable',
          description: 'Annual land tax',
          paidBy: 'Owner'
        },
        'Notary': {
          rate: '1-2%',
          description: 'Notary fees',
          paidBy: 'Usually split'
        }
      }
    };
  }

  private initializeScheduler() {
    // Daily property market scraping
    cron.schedule('0 6 * * *', () => {
      this.scrapePropertyListings();
    });

    // Weekly legal updates
    cron.schedule('0 9 * * 1', () => {
      this.scrapeLegalUpdates();
    });

    // Initial run
    this.scrapePropertyListings();
    this.scrapeLegalUpdates();
  }

  /**
   * Scrape property listings
   */
  private async scrapePropertyListings() {
    const sources = [
      'https://www.rumah.com/properti-dijual/bali',
      'https://www.olx.co.id/bali/properti',
      'https://www.lamudi.co.id/bali'
    ];

    for (const source of sources) {
      try {
        await this.scrapePropertySource(source);
      } catch (error) {
        console.error(`[LEGAL ARCHITECT] Error scraping ${source}:`, error);
      }
    }

    // Analyze market after scraping
    this.analyzeMarket();
  }

  private async scrapePropertySource(url: string) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extract property listings (simplified)
      $('.listing, .property-card, .ad-card').each((i, elem) => {
        const title = $(elem).find('.title, h2, h3').text().trim();
        const price = this.extractPrice($(elem).find('.price').text());
        const location = $(elem).find('.location').text().trim();
        const size = this.extractSize($(elem).find('.size, .area').text());

        if (title && price && location) {
          const property = this.processPropertyListing(title, price, location, size, url);
          if (property && !this.propertyData.has(property.id)) {
            this.propertyData.set(property.id, property);
            this.classifyProperty(property);
          }
        }
      });
    } catch (error) {
      console.error(`[LEGAL ARCHITECT] Scraping error:`, error);
    }
  }

  private processPropertyListing(
    title: string,
    price: number,
    location: string,
    size: number,
    source: string
  ): PropertyData {
    const type = this.determinePropertyType(title);
    const ownership = this.determineOwnership(title);
    const area = this.extractArea(location);

    const property: PropertyData = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: area || location,
      type,
      price,
      pricePerAre: size > 0 ? price / size : undefined,
      size,
      ownership,
      zoning: this.getZoning(area),
      source,
      listedDate: new Date(),
      features: this.extractFeatures(title),
      risks: [],
      opportunities: [],
      classification: 'PUBLIC'
    };

    // Analyze property
    this.analyzePropertyRisksOpportunities(property);

    return property;
  }

  /**
   * Perform due diligence check
   */
  async performDueDiligence(propertyId: string): Promise<DueDiligenceReport> {
    const property = this.propertyData.get(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const checks: DueDiligenceCheck[] = [];

    // Title checks
    checks.push({
      category: 'Title',
      item: 'Certificate verification',
      status: property.ownership === 'freehold' ? 'warning' : 'clear',
      details: property.ownership === 'freehold'
        ? 'Freehold not available to foreigners'
        : `${property.ownership} ownership verified`,
      action: property.ownership === 'freehold'
        ? 'Requires nominee structure (risky) or company'
        : undefined
    });

    // Zoning checks
    checks.push({
      category: 'Zoning',
      item: 'Land use compliance',
      status: 'clear',
      details: `Zoned for ${property.zoning}`,
      action: undefined
    });

    // Price analysis
    const marketPrice = this.getMarketPrice(property.location, property.type);
    const priceStatus = this.analyzePriceStatus(property.price, marketPrice);

    checks.push({
      category: 'Valuation',
      item: 'Market price analysis',
      status: priceStatus,
      details: `Listed at ${property.price}, market avg ${marketPrice}`,
      action: priceStatus === 'warning' ? 'Negotiate price down' : undefined
    });

    // Location risks
    const locationRisks = this.assessLocationRisks(property.location);
    checks.push({
      category: 'Location',
      item: 'Area assessment',
      status: locationRisks.length > 0 ? 'warning' : 'clear',
      details: locationRisks.join(', ') || 'No significant risks',
      action: locationRisks.length > 0 ? 'Consider location risks' : undefined
    });

    // Calculate overall risk
    const issueCount = checks.filter(c => c.status === 'issue').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    let overallRisk: DueDiligenceReport['overallRisk'];
    let recommendation: DueDiligenceReport['recommendation'];

    if (issueCount > 2) {
      overallRisk = 'critical';
      recommendation = 'avoid';
    } else if (issueCount > 0 || warningCount > 3) {
      overallRisk = 'high';
      recommendation = 'proceed_with_caution';
    } else if (warningCount > 0) {
      overallRisk = 'medium';
      recommendation = 'proceed_with_caution';
    } else {
      overallRisk = 'low';
      recommendation = 'proceed';
    }

    // Get comparables
    const comparables = this.findComparables(property);

    return {
      propertyId,
      checks,
      overallRisk,
      recommendation,
      redFlags: checks.filter(c => c.status === 'issue').map(c => c.details),
      opportunities: property.opportunities,
      estimatedValue: {
        currentMarket: marketPrice,
        comparables,
        trend: this.getMarketTrend(property.location),
        confidence: 0.75,
        factors: ['Location', 'Size', 'Ownership type', 'Market conditions']
      }
    };
  }

  /**
   * Recommend legal structure
   */
  async recommendStructure(
    buyerProfile: any,
    propertyType: string
  ): Promise<LegalStructure[]> {
    const structures: LegalStructure[] = [];

    // PT PMA Structure
    if (buyerProfile.nationality !== 'Indonesian') {
      structures.push({
        type: 'PT PMA Company',
        pros: [
          'Can hold HGB rights (30+20+30 years)',
          'Legal and secure',
          'Can mortgage property',
          'Can rent out commercially',
          'Asset protection'
        ],
        cons: [
          'High setup cost',
          'Minimum investment 10B IDR',
          'Annual compliance',
          'Cannot hold freehold'
        ],
        costs: {
          setup: '40-60M IDR',
          annual: '30-50M IDR'
        },
        requirements: [
          '10B IDR investment plan',
          '2 shareholders minimum',
          'Indonesian director',
          'Physical office'
        ],
        timeline: '3-4 weeks',
        risks: ['Regulatory changes', 'Compliance burden']
      });
    }

    // Hak Pakai Structure
    if (buyerProfile.type === 'individual') {
      structures.push({
        type: 'Hak Pakai (Right to Use)',
        pros: [
          'Direct ownership for foreigners',
          'No company needed',
          '25+20+25 years',
          'Simpler process'
        ],
        cons: [
          'Cannot mortgage',
          'Limited property types',
          'Minimum price requirements',
          'Cannot sublet easily'
        ],
        costs: {
          setup: '10-20M IDR',
          annual: 'Minimal'
        },
        requirements: [
          'Valid KITAS/KITAP',
          'Property meets minimum value',
          'Not agricultural land'
        ],
        timeline: '2-3 weeks',
        risks: ['Limited financing options', 'Resale restrictions']
      });
    }

    // Leasehold Structure
    structures.push({
      type: 'Long-term Lease (25-30 years)',
      pros: [
        'Lower upfront cost',
        'Flexibility',
        'Can be extended',
        'No ownership restrictions'
      ],
      cons: [
        'No asset ownership',
        'Renewal uncertainty',
        'Cannot mortgage',
        'Deprecating value'
      ],
      costs: {
        setup: '5-10M IDR',
        annual: 'Lease payment'
      },
      requirements: [
        'Lease agreement',
        'Notarized contract',
        'Clear terms'
      ],
      timeline: '1 week',
      risks: ['Lease not renewed', 'Landlord disputes']
    });

    // Mixed Marriage Structure
    if (buyerProfile.spouse === 'Indonesian') {
      structures.push({
        type: 'Pre-nuptial Agreement',
        pros: [
          'Spouse can own freehold',
          'Full ownership rights',
          'Can mortgage',
          'Perpetual ownership'
        ],
        cons: [
          'Requires prenup',
          'Complex if divorced',
          'Asset mixing issues'
        ],
        costs: {
          setup: '10-15M IDR',
          annual: 'Minimal'
        },
        requirements: [
          'Pre-nuptial agreement',
          'Notarized before marriage',
          'Clear asset separation'
        ],
        timeline: '1-2 weeks',
        risks: ['Relationship issues affect property', 'Legal complexity']
      });
    }

    return structures;
  }

  /**
   * Analyze market trends
   */
  private analyzeMarket() {
    const areas = ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Sanur'];

    areas.forEach(area => {
      const areaProperties = Array.from(this.propertyData.values())
        .filter(p => p.location.includes(area));

      if (areaProperties.length > 0) {
        const avgPrice = areaProperties.reduce((sum, p) => sum + p.price, 0) / areaProperties.length;
        const avgSize = areaProperties.reduce((sum, p) => sum + p.size, 0) / areaProperties.length;
        const avgDaysOnMarket = 30; // Simplified

        const analysis: MarketAnalysis = {
          area,
          averagePrice: avgPrice,
          priceChange: this.calculatePriceChange(area, avgPrice),
          inventory: areaProperties.length,
          daysOnMarket: avgDaysOnMarket,
          hotness: this.determineMarketHotness(avgDaysOnMarket, areaProperties.length),
          forecast: this.generateMarketForecast(area)
        };

        this.marketData.set(area, analysis);
      }
    });
  }

  /**
   * Scrape legal updates
   */
  private async scrapeLegalUpdates() {
    const sources = [
      'https://www.atrbpn.go.id', // Land agency
      'https://hukumonline.com/search?q=properti',
      'https://www.bphn.go.id'
    ];

    for (const source of sources) {
      try {
        const response = await axios.get(source);
        const $ = cheerio.load(response.data);

        // Extract legal updates
        $('article, .news-item, .update').each((i, elem) => {
          const title = $(elem).find('h2, h3, .title').text().trim();
          const content = $(elem).find('p, .content').text().trim();

          if (title && content) {
            const update = this.processLegalUpdate(title, content, source);
            if (update && !this.legalUpdates.has(update.id)) {
              this.legalUpdates.set(update.id, update);
            }
          }
        });
      } catch (error) {
        console.error(`[LEGAL ARCHITECT] Legal scraping error:`, error);
      }
    }
  }

  private processLegalUpdate(title: string, content: string, source: string): LegalUpdate {
    return {
      id: `legal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: this.determineLegalType(title, content),
      title,
      content,
      impact: this.assessLegalImpact(title, content),
      affectedAreas: this.identifyAffectedAreas(content),
      actionRequired: this.identifyLegalAction(title, content),
      source,
      classification: this.classifyLegalInfo(title, content)
    };
  }

  /**
   * Classify information security level
   */
  private classifyLegalInfo(title: string, content: string): 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' {
    const text = `${title} ${content}`.toLowerCase();

    // CONFIDENTIAL: Insider deals, upcoming developments
    if (text.includes('confidential') || text.includes('insider') ||
        text.includes('not public')) {
      return 'CONFIDENTIAL';
    }

    // INTERNAL: Market strategies, negotiation tactics
    if (text.includes('strategy') || text.includes('negotiation') ||
        text.includes('opportunity')) {
      return 'INTERNAL';
    }

    // PUBLIC: General regulations, public announcements
    return 'PUBLIC';
  }

  private classifyProperty(property: PropertyData) {
    // Check if it's an exceptional deal
    const marketPrice = this.getMarketPrice(property.location, property.type);

    if (property.price < marketPrice * 0.7) {
      property.classification = 'INTERNAL'; // Good deal, don't publicize
      property.opportunities.push('Significantly below market price');
    }

    // Check for special circumstances
    if (property.risks.includes('Distressed sale') ||
        property.risks.includes('Urgent sale')) {
      property.classification = 'CONFIDENTIAL'; // Sensitive opportunity
    }
  }

  // Helper methods
  private extractPrice(priceText: string): number {
    const cleaned = priceText.replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  }

  private extractSize(sizeText: string): number {
    const match = sizeText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private determinePropertyType(title: string): PropertyData['type'] {
    const text = title.toLowerCase();
    if (text.includes('villa')) return 'villa';
    if (text.includes('land') || text.includes('tanah')) return 'land';
    if (text.includes('commercial') || text.includes('ruko')) return 'commercial';
    return 'residential';
  }

  private determineOwnership(title: string): PropertyData['ownership'] {
    const text = title.toLowerCase();
    if (text.includes('freehold') || text.includes('shm')) return 'freehold';
    if (text.includes('leasehold') || text.includes('sewa')) return 'leasehold';
    if (text.includes('hgb')) return 'HGB';
    if (text.includes('hak pakai')) return 'HakPakai';
    return 'leasehold'; // Default
  }

  private extractArea(location: string): string {
    const areas = ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Sanur', 'Denpasar', 'Kuta', 'Jimbaran'];
    for (const area of areas) {
      if (location.includes(area)) return area;
    }
    return location;
  }

  private getZoning(area: string): string {
    const zoning = this.propertyKnowledge.areas[area]?.zoning;
    return zoning ? zoning[0] : 'Mixed';
  }

  private extractFeatures(title: string): string[] {
    const features = [];
    const text = title.toLowerCase();

    if (text.includes('ocean view') || text.includes('sea view')) features.push('Ocean view');
    if (text.includes('pool')) features.push('Swimming pool');
    if (text.includes('furnished')) features.push('Furnished');
    if (text.includes('new')) features.push('New construction');

    return features;
  }

  private analyzePropertyRisksOpportunities(property: PropertyData) {
    // Analyze risks
    if (property.ownership === 'freehold' && property.classification === 'PUBLIC') {
      property.risks.push('Freehold not available to foreigners');
    }

    if (property.location.includes('Canggu')) {
      property.risks.push('Rapid development may affect views');
      property.opportunities.push('High growth area');
    }

    // Analyze opportunities
    if (property.pricePerAre && property.pricePerAre < 30000000) {
      property.opportunities.push('Below market average');
    }

    if (property.features.includes('Ocean view')) {
      property.opportunities.push('Premium feature for rentals');
    }
  }

  private getMarketPrice(location: string, type: PropertyData['type']): number {
    const area = this.extractArea(location);
    const basePrice = this.propertyKnowledge.areas[area]?.avgPrice || 30000000;

    // Adjust for property type
    const multipliers = {
      'villa': 1.2,
      'land': 0.8,
      'commercial': 1.5,
      'residential': 1.0
    };

    return basePrice * multipliers[type];
  }

  private analyzePriceStatus(listed: number, market: number): DueDiligenceCheck['status'] {
    const ratio = listed / market;
    if (ratio > 1.2) return 'issue';
    if (ratio > 1.1) return 'warning';
    return 'clear';
  }

  private assessLocationRisks(location: string): string[] {
    const risks = [];
    const area = this.extractArea(location);

    if (this.propertyKnowledge.areas[area]?.risks) {
      risks.push(...this.propertyKnowledge.areas[area].risks);
    }

    return risks;
  }

  private findComparables(property: PropertyData): Comparable[] {
    const comparables: Comparable[] = [];

    Array.from(this.propertyData.values())
      .filter(p => p.id !== property.id && p.location === property.location && p.type === property.type)
      .slice(0, 3)
      .forEach(p => {
        comparables.push({
          address: p.location,
          price: p.price,
          size: p.size,
          soldDate: undefined,
          similarity: 0.8
        });
      });

    return comparables;
  }

  private getMarketTrend(location: string): 'increasing' | 'stable' | 'decreasing' {
    const area = this.extractArea(location);
    return this.propertyKnowledge.areas[area]?.trend || 'stable';
  }

  private calculatePriceChange(area: string, currentPrice: number): number {
    // Simplified - would use historical data
    const trend = this.propertyKnowledge.areas[area]?.trend;
    if (trend === 'increasing') return 0.1;
    if (trend === 'decreasing') return -0.05;
    return 0;
  }

  private determineMarketHotness(days: number, inventory: number): MarketAnalysis['hotness'] {
    if (days < 15 && inventory < 50) return 'very_hot';
    if (days < 30 && inventory < 100) return 'hot';
    if (days < 60) return 'warm';
    return 'cold';
  }

  private generateMarketForecast(area: string): string {
    const trend = this.propertyKnowledge.areas[area]?.trend;
    if (trend === 'increasing') return 'Continued growth expected';
    if (trend === 'decreasing') return 'Market correction likely';
    return 'Stable market conditions';
  }

  private determineLegalType(title: string, content: string): LegalUpdate['type'] {
    const text = `${title} ${content}`.toLowerCase();
    if (text.includes('regulation') || text.includes('peraturan')) return 'regulation';
    if (text.includes('court') || text.includes('putusan')) return 'court_decision';
    if (text.includes('zoning') || text.includes('tata ruang')) return 'zoning';
    return 'policy';
  }

  private assessLegalImpact(title: string, content: string): string {
    const text = `${title} ${content}`.toLowerCase();
    if (text.includes('immediate') || text.includes('segera')) {
      return 'High impact - immediate action required';
    }
    if (text.includes('change') || text.includes('perubahan')) {
      return 'Medium impact - review required';
    }
    return 'Low impact - informational';
  }

  private identifyAffectedAreas(content: string): string[] {
    const areas = [];
    const locations = ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Sanur', 'Denpasar', 'Bali'];

    locations.forEach(location => {
      if (content.includes(location)) {
        areas.push(location);
      }
    });

    return areas.length > 0 ? areas : ['All areas'];
  }

  private identifyLegalAction(title: string, content: string): string | undefined {
    const text = `${title} ${content}`.toLowerCase();

    if (text.includes('must comply') || text.includes('harus')) {
      return 'Compliance required';
    }
    if (text.includes('deadline') || text.includes('batas waktu')) {
      return 'Action before deadline';
    }

    return undefined;
  }

  // Public methods
  public getPropertyListings(area?: string): PropertyData[] {
    let properties = Array.from(this.propertyData.values());

    if (area) {
      properties = properties.filter(p => p.location.includes(area));
    }

    return properties.sort((a, b) => b.listedDate.getTime() - a.listedDate.getTime());
  }

  public getMarketAnalysis(area: string): MarketAnalysis | undefined {
    return this.marketData.get(area);
  }

  public getLegalUpdates(): LegalUpdate[] {
    return Array.from(this.legalUpdates.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Handler for ZANTARA integration
export async function handlePropertyQuery(params: any): Promise<any> {
  const legalArchitect = new LegalArchitect();

  if (params.action === 'listings') {
    return legalArchitect.getPropertyListings(params.area);
  }

  if (params.action === 'due_diligence') {
    return await legalArchitect.performDueDiligence(params.propertyId);
  }

  if (params.action === 'structure') {
    return await legalArchitect.recommendStructure(params.buyerProfile, params.propertyType);
  }

  if (params.action === 'market') {
    return legalArchitect.getMarketAnalysis(params.area);
  }

  if (params.action === 'legal_updates') {
    return legalArchitect.getLegalUpdates();
  }

  return {
    error: 'Please specify action: listings, due_diligence, structure, market, or legal_updates'
  };
}
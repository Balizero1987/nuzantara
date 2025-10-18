/**
 * KBLI EYE - Business Classification Intelligence System
 * Classifies business descriptions into appropriate KBLI codes
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as natural from 'natural';

interface KBLICode {
  code: string;
  title: string;
  titleEN: string;
  category: string;
  subCategory: string;
  foreignEligible: boolean;
  minimumInvestment?: number;
  specialRequirements?: string[];
  relatedLicenses?: string[];
  taxIncentives?: string[];
}

interface ClassificationResult {
  primary: KBLICode;
  secondary: KBLICode[];
  restricted: KBLICode[];
  confidence: number;
  reasoning: string;
  opportunities: string[];
  warnings: string[];
}

export class KBLIClassifier {
  private kbliDatabase: Map<string, KBLICode>;
  private classifier: any;
  private gemini: any;

  constructor() {
    this.kbliDatabase = new Map();
    this.classifier = new natural.BayesClassifier();
    this.initializeGemini();
    this.loadKBLIDatabase();
  }

  private initializeGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Load KBLI 2020 database with foreign investment restrictions
   */
  private loadKBLIDatabase() {
    // Critical KBLI codes for expat businesses in Bali
    const kbliData: KBLICode[] = [
      // CONSULTING & SERVICES
      {
        code: '70209',
        title: 'Konsultan Manajemen Lainnya',
        titleEN: 'Other Management Consulting',
        category: 'M',
        subCategory: 'Professional Services',
        foreignEligible: true,
        minimumInvestment: 10000000000, // 10B IDR
        relatedLicenses: ['NIB', 'KITAS Investor'],
        taxIncentives: ['Super deduction for R&D']
      },
      {
        code: '62019',
        title: 'Konsultan Komputer dan Pemrograman',
        titleEN: 'Computer Consultancy and Programming',
        category: 'J',
        subCategory: 'Information Technology',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB'],
        taxIncentives: ['Tax holiday for digital economy']
      },

      // TOURISM & HOSPITALITY
      {
        code: '55101',
        title: 'Hotel Bintang',
        titleEN: 'Star Hotels',
        category: 'I',
        subCategory: 'Accommodation',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'TDUP', 'HGB Certificate'],
        specialRequirements: ['Minimum 3-star rating', 'Environmental permit']
      },
      {
        code: '55104',
        title: 'Villa',
        titleEN: 'Villa',
        category: 'I',
        subCategory: 'Accommodation',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'Pondok Wisata', 'PBG'],
        specialRequirements: ['Zoning compliance', 'Subak approval']
      },
      {
        code: '79120',
        title: 'Agen Perjalanan Wisata',
        titleEN: 'Tour Operator',
        category: 'N',
        subCategory: 'Travel Services',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'TDUP', 'IATA (optional)']
      },

      // FOOD & BEVERAGE
      {
        code: '56101',
        title: 'Restoran',
        titleEN: 'Restaurant',
        category: 'I',
        subCategory: 'Food Service',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'TDUP', 'Halal cert (optional)'],
        specialRequirements: ['Health permit', 'BPOM registration']
      },
      {
        code: '56301',
        title: 'Bar',
        titleEN: 'Bar',
        category: 'I',
        subCategory: 'Beverage Service',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'SIUP-MB', 'TDUP'],
        specialRequirements: ['Alcohol license', 'Not in restricted zones']
      },

      // RETAIL & TRADING
      {
        code: '47111',
        title: 'Perdagangan Eceran Minimarket',
        titleEN: 'Retail Minimarket',
        category: 'G',
        subCategory: 'Retail Trade',
        foreignEligible: false, // RESTRICTED
        minimumInvestment: null,
        warnings: ['Restricted for foreign investment', 'Local partner required']
      },
      {
        code: '46900',
        title: 'Perdagangan Besar Berbagai Macam Barang',
        titleEN: 'Wholesale Trade',
        category: 'G',
        subCategory: 'Wholesale',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'API-U (for import)']
      },

      // CONSTRUCTION & REAL ESTATE
      {
        code: '41001',
        title: 'Konstruksi Gedung',
        titleEN: 'Building Construction',
        category: 'F',
        subCategory: 'Construction',
        foreignEligible: true,
        minimumInvestment: 15000000000, // Higher for construction
        relatedLicenses: ['NIB', 'SIUJK', 'SBU'],
        specialRequirements: ['Technical director required', 'Equipment proof']
      },
      {
        code: '68111',
        title: 'Real Estat yang Dimiliki Sendiri',
        titleEN: 'Own Real Estate',
        category: 'L',
        subCategory: 'Real Estate',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'HGB/HP'],
        warnings: ['Cannot own freehold land']
      },

      // EDUCATION & TRAINING
      {
        code: '85499',
        title: 'Pendidikan dan Pelatihan Lainnya',
        titleEN: 'Other Education and Training',
        category: 'P',
        subCategory: 'Education',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'Education permit'],
        specialRequirements: ['Curriculum approval', 'Teacher qualifications']
      },

      // HEALTH & WELLNESS
      {
        code: '96122',
        title: 'Spa',
        titleEN: 'Spa',
        category: 'S',
        subCategory: 'Wellness Services',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'TDUP', 'Health permit'],
        specialRequirements: ['Therapist certifications']
      },

      // IMPORT/EXPORT
      {
        code: '46100',
        title: 'Perdagangan Atas Dasar Balas Jasa',
        titleEN: 'Commission Trading',
        category: 'G',
        subCategory: 'Trade Services',
        foreignEligible: true,
        minimumInvestment: 10000000000,
        relatedLicenses: ['NIB', 'API-U', 'API-P']
      }
    ];

    // Load into database
    kbliData.forEach(kbli => {
      this.kbliDatabase.set(kbli.code, kbli);

      // Train classifier with business descriptions
      const trainingTexts = this.generateTrainingTexts(kbli);
      trainingTexts.forEach(text => {
        this.classifier.addDocument(text, kbli.code);
      });
    });

    this.classifier.train();
  }

  /**
   * Generate training texts for each KBLI code
   */
  private generateTrainingTexts(kbli: KBLICode): string[] {
    const texts: string[] = [];

    // Base descriptions
    texts.push(kbli.titleEN.toLowerCase());
    texts.push(kbli.title.toLowerCase());

    // Specific business descriptions
    switch(kbli.code) {
      case '70209': // Consulting
        texts.push('business consulting', 'management advisory', 'strategy consulting');
        texts.push('business development', 'corporate advisory', 'management services');
        break;
      case '62019': // IT
        texts.push('software development', 'web development', 'app development');
        texts.push('IT consulting', 'digital solutions', 'tech services');
        break;
      case '55104': // Villa
        texts.push('villa rental', 'holiday villa', 'vacation rental');
        texts.push('airbnb business', 'property rental', 'accommodation services');
        break;
      case '56101': // Restaurant
        texts.push('restaurant', 'cafe', 'dining', 'food service');
        texts.push('warung', 'eatery', 'culinary business');
        break;
      case '56301': // Bar
        texts.push('bar', 'nightclub', 'beach club', 'cocktail bar');
        texts.push('beverage service', 'alcohol sales', 'entertainment venue');
        break;
      case '79120': // Tour
        texts.push('tour operator', 'travel agency', 'tour packages');
        texts.push('adventure tours', 'cultural tours', 'travel services');
        break;
    }

    return texts;
  }

  /**
   * Classify business description using hybrid approach
   */
  async classifyBusiness(description: string): Promise<ClassificationResult> {
    // Step 1: NLP Classification
    const nlpResults = this.classifier.getClassifications(description.toLowerCase());
    const topMatches = nlpResults.slice(0, 5);

    // Step 2: AI Enhancement with Gemini
    let aiAnalysis = null;
    if (this.gemini) {
      aiAnalysis = await this.analyzeWithAI(description, topMatches);
    }

    // Step 3: Build comprehensive result
    const primaryCode = topMatches[0].label;
    const primary = this.kbliDatabase.get(primaryCode)!;

    // Find secondary codes
    const secondary = topMatches.slice(1, 3)
      .map(match => this.kbliDatabase.get(match.label))
      .filter(kbli => kbli && kbli.foreignEligible) as KBLICode[];

    // Find restricted codes that match
    const restricted = topMatches
      .map(match => this.kbliDatabase.get(match.label))
      .filter(kbli => kbli && !kbli.foreignEligible) as KBLICode[];

    // Generate insights
    const opportunities = this.identifyOpportunities(primary, description);
    const warnings = this.identifyWarnings(primary, description);

    return {
      primary,
      secondary,
      restricted,
      confidence: topMatches[0].value,
      reasoning: aiAnalysis?.reasoning || this.generateReasoning(primary, description),
      opportunities,
      warnings
    };
  }

  /**
   * Use Gemini for advanced analysis
   */
  private async analyzeWithAI(description: string, nlpResults: any[]): Promise<any> {
    const prompt = `
    Analyze this business description for Indonesian KBLI classification:

    Business Description: "${description}"

    Top KBLI matches from NLP:
    ${nlpResults.map(r => `- ${r.label}: ${this.kbliDatabase.get(r.label)?.titleEN}`).join('\n')}

    Consider:
    1. Is this business eligible for foreign investment (PMA)?
    2. What additional KBLI codes might be needed?
    3. Any special licenses or restrictions?
    4. Investment opportunities or tax incentives?

    Provide analysis in JSON format.
    `;

    try {
      const result = await this.gemini.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('AI analysis error:', error);
      return null;
    }
  }

  /**
   * Identify business opportunities
   */
  private identifyOpportunities(kbli: KBLICode, description: string): string[] {
    const opportunities: string[] = [];

    // Tax incentives
    if (kbli.taxIncentives?.length) {
      opportunities.push(`Tax incentives available: ${kbli.taxIncentives.join(', ')}`);
    }

    // Digital economy benefits
    if (description.includes('digital') || description.includes('online')) {
      opportunities.push('Eligible for digital economy tax benefits');
    }

    // Tourism benefits
    if (kbli.category === 'I') {
      opportunities.push('Tourism sector incentives available in Bali');
    }

    // Export opportunities
    if (description.includes('export') || description.includes('international')) {
      opportunities.push('Export facilitation and tax benefits available');
    }

    return opportunities;
  }

  /**
   * Identify potential warnings
   */
  private identifyWarnings(kbli: KBLICode, description: string): string[] {
    const warnings: string[] = [];

    // Investment threshold
    if (kbli.minimumInvestment) {
      warnings.push(`Minimum investment: ${(kbli.minimumInvestment/1000000000).toFixed(1)}B IDR`);
    }

    // Special requirements
    if (kbli.specialRequirements?.length) {
      warnings.push(`Special requirements: ${kbli.specialRequirements.join(', ')}`);
    }

    // Location restrictions
    if (kbli.code === '56301') { // Bar
      warnings.push('Alcohol license restricted in certain areas');
    }

    // Retail restrictions
    if (description.includes('retail') || description.includes('shop')) {
      warnings.push('Retail under 400sqm restricted for foreign investment');
    }

    return warnings;
  }

  /**
   * Generate reasoning for classification
   */
  private generateReasoning(kbli: KBLICode, description: string): string {
    return `Based on keywords "${description}", classified as ${kbli.titleEN} (${kbli.code}) ` +
           `in category ${kbli.category} - ${kbli.subCategory}. ` +
           `This is ${kbli.foreignEligible ? 'eligible' : 'restricted'} for foreign investment.`;
  }

  /**
   * Get optimal KBLI combination for business model
   */
  async getOptimalCombination(businessModel: string): Promise<{
    primary: KBLICode;
    supporting: KBLICode[];
    totalInvestment: number;
    strategy: string;
  }> {
    const classification = await this.classifyBusiness(businessModel);

    // Smart combination logic
    const supporting: KBLICode[] = [];
    let totalInvestment = classification.primary.minimumInvestment || 0;

    // Add supporting KBLIs that make sense
    if (businessModel.includes('restaurant') && businessModel.includes('delivery')) {
      const delivery = this.kbliDatabase.get('53202'); // Courier services
      if (delivery) supporting.push(delivery);
    }

    if (businessModel.includes('villa') && businessModel.includes('management')) {
      const management = this.kbliDatabase.get('68111'); // Property management
      if (management) supporting.push(management);
    }

    const strategy = this.generateStrategy(classification.primary, supporting);

    return {
      primary: classification.primary,
      supporting,
      totalInvestment,
      strategy
    };
  }

  /**
   * Generate business strategy based on KBLI selection
   */
  private generateStrategy(primary: KBLICode, supporting: KBLICode[]): string {
    let strategy = `Primary business: ${primary.titleEN}. `;

    if (supporting.length > 0) {
      strategy += `Supporting activities: ${supporting.map(k => k.titleEN).join(', ')}. `;
    }

    strategy += 'This combination provides operational flexibility while maintaining compliance.';

    return strategy;
  }
}

// Handler for ZANTARA integration
export async function handleKBLIQuery(params: any): Promise<any> {
  const classifier = new KBLIClassifier();

  if (params.businessDescription) {
    return await classifier.classifyBusiness(params.businessDescription);
  }

  if (params.businessModel) {
    return await classifier.getOptimalCombination(params.businessModel);
  }

  return {
    error: 'Please provide businessDescription or businessModel'
  };
}
/**
 * TAX GENIUS - Tax Intelligence and Optimization System
 * Monitors Indonesian tax regulations, deadlines, and optimization opportunities
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as cron from 'node-cron';

interface TaxUpdate {
  id: string;
  timestamp: Date;
  source: string;
  type: 'regulation' | 'deadline' | 'rate_change' | 'amnesty' | 'audit_focus';
  title: string;
  content: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedEntities: string[];
  actionRequired?: string;
  deadline?: Date;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

interface TaxOptimization {
  strategy: string;
  potentialSaving: string;
  riskLevel: 'low' | 'medium' | 'high';
  requirements: string[];
  timeline: string;
  legalBasis: string;
}

interface ComplianceCalendar {
  entity: string;
  obligations: TaxObligation[];
  nextDeadline: Date;
  status: 'compliant' | 'at_risk' | 'overdue';
}

interface TaxObligation {
  name: string;
  type: 'payment' | 'filing' | 'reporting';
  deadline: Date;
  frequency: 'monthly' | 'quarterly' | 'annual';
  description: string;
  penalty: string;
}

interface AuditRisk {
  score: number; // 1-100
  factors: string[];
  recommendations: string[];
  redFlags: string[];
}

export class TaxGenius {
  private gemini: any;
  private updates: Map<string, TaxUpdate> = new Map();
  private complianceCalendars: Map<string, ComplianceCalendar> = new Map();
  private taxKnowledge: any;

  constructor() {
    this.initializeAI();
    this.loadTaxKnowledge();
    this.initializeScheduler();
  }

  private initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  private loadTaxKnowledge() {
    this.taxKnowledge = {
      rates: {
        corporate: {
          standard: 0.22,
          smallBusiness: 0.005, // 0.5% for revenue < 4.8B IDR
          listed: 0.19, // 3% discount for public companies
        },
        personal: {
          brackets: [
            { max: 60000000, rate: 0.05 },
            { max: 250000000, rate: 0.15 },
            { max: 500000000, rate: 0.25 },
            { max: 5000000000, rate: 0.30 },
            { max: Infinity, rate: 0.35 }
          ]
        },
        vat: 0.11, // Recently increased to 11%
        withholding: {
          dividends: {
            resident: 0.10,
            nonResident: 0.20,
            treaty: 'varies' // 5-15% depending on treaty
          },
          royalties: {
            resident: 0.15,
            nonResident: 0.20
          },
          services: {
            pph21: 'progressive', // Employee tax
            pph23: 0.02, // Services
            pph26: 0.20 // Non-resident
          }
        }
      },

      deadlines: {
        monthly: {
          pph21: 10, // Day of month
          pph23: 10,
          pph25: 15,
          ppn: 'end of following month'
        },
        annual: {
          corporateTaxReturn: 'April 30',
          personalTaxReturn: 'March 31',
          transfer_pricing: 'With tax return'
        },
        quarterly: {
          lkpm: '15th of following month' // For PMA companies
        }
      },

      incentives: {
        superDeduction: {
          rd: 2.0, // 200% deduction for R&D
          vocational: 2.0, // 200% for vocational training
          requirements: ['Approved activities', 'Proper documentation']
        },
        taxHoliday: {
          pioneer: '5-20 years',
          minimum: '500B IDR investment',
          sectors: ['Automotive', 'Pharma', 'Petrochemical']
        },
        taxAllowance: {
          reduction: '30% of investment',
          accelerated: 'Double depreciation',
          losses: 'Carry forward 10 years'
        }
      },

      treaties: {
        count: 68,
        benefits: {
          dividends: '5-15%',
          interest: '0-10%',
          royalties: '5-15%',
          capitalGains: 'Often exempt'
        }
      }
    };
  }

  private initializeScheduler() {
    // Check DJP website every 3 hours
    cron.schedule('0 */3 * * *', () => {
      this.scrapeTaxUpdates();
    });

    // Daily compliance check
    cron.schedule('0 9 * * *', () => {
      this.checkComplianceDeadlines();
    });

    // Initial run
    this.scrapeTaxUpdates();
  }

  /**
   * Scrape tax updates from official sources
   */
  private async scrapeTaxUpdates() {
    const sources = [
      {
        url: 'https://pajak.go.id',
        sections: ['/id/peraturan', '/id/pengumuman', '/id/berita']
      },
      {
        url: 'https://www.kemenkeu.go.id',
        sections: ['/informasi-pajak']
      }
    ];

    for (const source of sources) {
      for (const section of source.sections) {
        try {
          await this.scrapeSource(source.url + section);
        } catch (error) {
          console.error(`[TAX GENIUS] Error scraping ${source.url}${section}:`, error);
        }
      }
    }
  }

  private async scrapeSource(url: string) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extract updates (simplified)
      $('article, .news-item, .announcement').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title').text().trim();
        const content = $(elem).find('p, .content').text().trim();
        const date = $(elem).find('.date, time').text().trim();

        if (title && content) {
          const update = this.processUpdate(title, content, url);
          if (update && !this.updates.has(update.id)) {
            this.updates.set(update.id, update);
            this.notifyIfCritical(update);
          }
        }
      });
    } catch (error) {
      console.error(`[TAX GENIUS] Scraping error:`, error);
    }
  }

  private processUpdate(title: string, content: string, source: string): TaxUpdate {
    const classification = this.classifyTaxInfo(title, content);
    const impact = this.assessTaxImpact(title, content);

    return {
      id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      source,
      type: this.determineTaxUpdateType(title, content),
      title,
      content,
      impact,
      affectedEntities: this.identifyAffectedEntities(content),
      actionRequired: this.identifyAction(title, content),
      classification
    };
  }

  /**
   * Classify tax information security level
   */
  private classifyTaxInfo(title: string, content: string): 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' {
    const text = `${title} ${content}`.toLowerCase();

    // CONFIDENTIAL: Audit targets, enforcement priorities
    if (text.includes('audit focus') || text.includes('investigation') ||
        text.includes('enforcement priority')) {
      return 'CONFIDENTIAL';
    }

    // INTERNAL: Optimization strategies, workarounds
    if (text.includes('optimization') || text.includes('planning') ||
        text.includes('strategy')) {
      return 'INTERNAL';
    }

    // PUBLIC: Official rates, deadlines, regulations
    return 'PUBLIC';
  }

  /**
   * Calculate tax optimization opportunities
   */
  async analyzeOptimization(companyProfile: any): Promise<TaxOptimization[]> {
    const optimizations: TaxOptimization[] = [];

    // Check for small business rate eligibility
    if (companyProfile.revenue < 4800000000) {
      optimizations.push({
        strategy: 'Small Business Tax Rate',
        potentialSaving: `${(0.22 - 0.005) * companyProfile.revenue} IDR/year`,
        riskLevel: 'low',
        requirements: ['Revenue < 4.8B IDR', 'Proper bookkeeping'],
        timeline: 'Immediate',
        legalBasis: 'PP 23/2018'
      });
    }

    // Check for super deduction opportunities
    if (companyProfile.hasRnD || companyProfile.hasTraining) {
      optimizations.push({
        strategy: 'Super Deduction 200%',
        potentialSaving: `${companyProfile.rdExpense * 1.0 * 0.22} IDR`,
        riskLevel: 'low',
        requirements: ['Approved R&D activities', 'Documentation'],
        timeline: 'Next tax year',
        legalBasis: 'PMK 153/2020'
      });
    }

    // Check treaty benefits
    if (companyProfile.hasParentAbroad) {
      const treaty = this.checkTreatyBenefits(companyProfile.parentCountry);
      if (treaty) {
        optimizations.push({
          strategy: `Treaty Benefits with ${companyProfile.parentCountry}`,
          potentialSaving: 'Reduce dividend tax from 20% to ' + treaty.dividendRate,
          riskLevel: 'low',
          requirements: ['Tax residency certificate', 'DGT form'],
          timeline: '1-2 months',
          legalBasis: `Tax Treaty ${companyProfile.parentCountry}-Indonesia`
        });
      }
    }

    // Transfer pricing optimization
    if (companyProfile.hasRelatedParties) {
      optimizations.push({
        strategy: 'Transfer Pricing Optimization',
        potentialSaving: 'Varies - needs detailed analysis',
        riskLevel: 'medium',
        requirements: ['TP Documentation', 'Benchmark study', 'Master file'],
        timeline: '3-6 months',
        legalBasis: 'PER-22/PJ/2013'
      });
    }

    return optimizations;
  }

  /**
   * Assess audit risk
   */
  async assessAuditRisk(companyProfile: any): Promise<AuditRisk> {
    let score = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];
    const redFlags: string[] = [];

    // Check profit margin
    const industryAvgMargin = this.getIndustryBenchmark(companyProfile.industry);
    if (companyProfile.profitMargin < industryAvgMargin * 0.5) {
      score += 20;
      factors.push('Low profit margin vs industry');
      redFlags.push('Profit margin below industry average');
      recommendations.push('Prepare documentation justifying margins');
    }

    // Check expense ratios
    if (companyProfile.entertainmentExpense / companyProfile.revenue > 0.01) {
      score += 15;
      factors.push('High entertainment expenses');
      recommendations.push('Review entertainment expense documentation');
    }

    // Related party transactions
    if (companyProfile.relatedPartyTransactions / companyProfile.revenue > 0.3) {
      score += 25;
      factors.push('Significant related party transactions');
      redFlags.push('High related party transaction volume');
      recommendations.push('Ensure transfer pricing documentation complete');
    }

    // Cash transactions
    if (companyProfile.cashTransactions / companyProfile.revenue > 0.1) {
      score += 10;
      factors.push('High cash transaction ratio');
      recommendations.push('Improve transaction documentation');
    }

    // VAT compliance
    if (companyProfile.vatGap > 0) {
      score += 20;
      factors.push('VAT input/output mismatch');
      redFlags.push('VAT reconciliation issues');
      recommendations.push('Review VAT calculations and documentation');
    }

    // Previous audit history
    if (companyProfile.previousAudit) {
      if (companyProfile.previousAuditFindings > 0) {
        score += 10;
        factors.push('Previous audit findings');
        recommendations.push('Ensure previous issues resolved');
      }
    }

    return {
      score: Math.min(score, 100),
      factors,
      recommendations,
      redFlags
    };
  }

  /**
   * Generate compliance calendar
   */
  async generateComplianceCalendar(entityId: string, entityType: string): Promise<ComplianceCalendar> {
    const obligations: TaxObligation[] = [];
    const now = new Date();

    if (entityType === 'PT PMA' || entityType === 'PT') {
      // Monthly obligations
      obligations.push({
        name: 'PPh 21 (Employee Tax)',
        type: 'payment',
        deadline: this.getNextDeadline(10), // 10th of each month
        frequency: 'monthly',
        description: 'Employee income tax withholding',
        penalty: '2% per month late interest'
      });

      obligations.push({
        name: 'PPh 25 (Corporate Installment)',
        type: 'payment',
        deadline: this.getNextDeadline(15), // 15th of each month
        frequency: 'monthly',
        description: 'Monthly corporate tax installment',
        penalty: '2% per month late interest'
      });

      obligations.push({
        name: 'PPN (VAT)',
        type: 'filing',
        deadline: this.getEndOfNextMonth(),
        frequency: 'monthly',
        description: 'VAT return and payment',
        penalty: '2% of VAT amount'
      });

      // Quarterly for PMA
      if (entityType === 'PT PMA') {
        obligations.push({
          name: 'LKPM (Investment Report)',
          type: 'reporting',
          deadline: this.getNextQuarterDeadline(),
          frequency: 'quarterly',
          description: 'Quarterly investment realization report',
          penalty: 'Warning to license revocation'
        });
      }

      // Annual
      obligations.push({
        name: 'SPT Tahunan (Annual Tax Return)',
        type: 'filing',
        deadline: new Date(now.getFullYear() + 1, 3, 30), // April 30
        frequency: 'annual',
        description: 'Annual corporate income tax return',
        penalty: '100,000 - 1,000,000 IDR'
      });
    }

    // Sort by deadline
    obligations.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

    return {
      entity: entityId,
      obligations,
      nextDeadline: obligations[0]?.deadline || new Date(),
      status: this.determineComplianceStatus(obligations)
    };
  }

  /**
   * Analyze new regulation impact
   */
  async analyzeRegulationImpact(regulation: string): Promise<any> {
    if (!this.gemini) return null;

    const prompt = `
    Analyze this Indonesian tax regulation for business impact:

    "${regulation}"

    Identify:
    1. Who is affected (company types, industries)
    2. What changes (rates, requirements, deadlines)
    3. When it takes effect
    4. Action items for compliance
    5. Optimization opportunities

    Format as JSON.
    `;

    try {
      const result = await this.gemini.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error('[TAX GENIUS] AI analysis error:', error);
      return null;
    }
  }

  // Helper methods
  private determineTaxUpdateType(title: string, content: string): TaxUpdate['type'] {
    const text = `${title} ${content}`.toLowerCase();

    if (text.includes('peraturan') || text.includes('regulation')) return 'regulation';
    if (text.includes('deadline') || text.includes('batas waktu')) return 'deadline';
    if (text.includes('tarif') || text.includes('rate')) return 'rate_change';
    if (text.includes('amnesti') || text.includes('amnesty')) return 'amnesty';
    if (text.includes('audit') || text.includes('pemeriksaan')) return 'audit_focus';

    return 'regulation';
  }

  private assessTaxImpact(title: string, content: string): TaxUpdate['impact'] {
    const text = `${title} ${content}`.toLowerCase();

    if (text.includes('urgent') || text.includes('immediate') || text.includes('segera')) {
      return 'critical';
    }
    if (text.includes('penting') || text.includes('important') || text.includes('wajib')) {
      return 'high';
    }
    if (text.includes('update') || text.includes('change')) {
      return 'medium';
    }

    return 'low';
  }

  private identifyAffectedEntities(content: string): string[] {
    const entities: string[] = [];
    const text = content.toLowerCase();

    if (text.includes('pma')) entities.push('PT PMA');
    if (text.includes('pt')) entities.push('PT');
    if (text.includes('cv')) entities.push('CV');
    if (text.includes('individual') || text.includes('pribadi')) entities.push('Individual');
    if (text.includes('pkp')) entities.push('VAT Registered');

    return entities.length > 0 ? entities : ['All entities'];
  }

  private identifyAction(title: string, content: string): string | undefined {
    const text = `${title} ${content}`.toLowerCase();

    if (text.includes('must register') || text.includes('harus daftar')) {
      return 'Registration required';
    }
    if (text.includes('submit') || text.includes('lapor')) {
      return 'Submission required';
    }
    if (text.includes('update') || text.includes('perbarui')) {
      return 'Update required';
    }

    return undefined;
  }

  private checkTreatyBenefits(country: string): any {
    // Simplified treaty rates
    const treaties = {
      'Italy': { dividendRate: '10%', royaltyRate: '10%', interestRate: '10%' },
      'USA': { dividendRate: '10%', royaltyRate: '10%', interestRate: '10%' },
      'Singapore': { dividendRate: '10%', royaltyRate: '8%', interestRate: '10%' },
      'Netherlands': { dividendRate: '5%', royaltyRate: '5%', interestRate: '5%' },
      // Add more countries
    };

    return treaties[country];
  }

  private getIndustryBenchmark(industry: string): number {
    const benchmarks = {
      'Restaurant': 0.15,
      'Consulting': 0.30,
      'Trading': 0.05,
      'Manufacturing': 0.10,
      'Services': 0.20
    };

    return benchmarks[industry] || 0.15;
  }

  private getNextDeadline(dayOfMonth: number): Date {
    const now = new Date();
    const deadline = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);

    if (deadline < now) {
      deadline.setMonth(deadline.getMonth() + 1);
    }

    return deadline;
  }

  private getEndOfNextMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 2, 0); // Last day of next month
  }

  private getNextQuarterDeadline(): Date {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const nextQuarter = quarter + 1;

    if (nextQuarter > 3) {
      return new Date(now.getFullYear() + 1, 0, 15); // Jan 15 next year
    }

    return new Date(now.getFullYear(), nextQuarter * 3, 15); // 15th of first month of next quarter
  }

  private determineComplianceStatus(obligations: TaxObligation[]): 'compliant' | 'at_risk' | 'overdue' {
    const now = new Date();
    const hasOverdue = obligations.some(o => o.deadline < now);
    const hasUpcoming = obligations.some(o => {
      const daysUntil = (o.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil <= 7;
    });

    if (hasOverdue) return 'overdue';
    if (hasUpcoming) return 'at_risk';
    return 'compliant';
  }

  private notifyIfCritical(update: TaxUpdate) {
    if (update.impact === 'critical' || update.impact === 'high') {
      console.log(`[TAX GENIUS] CRITICAL UPDATE: ${update.title}`);
      // Send notifications
    }
  }

  private async checkComplianceDeadlines() {
    const now = new Date();

    this.complianceCalendars.forEach(calendar => {
      calendar.obligations.forEach(obligation => {
        const daysUntil = (obligation.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (daysUntil <= 3 && daysUntil > 0) {
          console.log(`[TAX GENIUS] DEADLINE WARNING: ${obligation.name} due in ${Math.round(daysUntil)} days`);
        } else if (daysUntil < 0) {
          console.log(`[TAX GENIUS] OVERDUE: ${obligation.name} was due ${Math.abs(Math.round(daysUntil))} days ago`);
        }
      });
    });
  }

  // Public methods for integration
  public getRecentUpdates(hours: number = 24): TaxUpdate[] {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.updates.values())
      .filter(u => u.timestamp > since)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getOptimizations(profile: any): Promise<TaxOptimization[]> {
    return this.analyzeOptimization(profile);
  }

  public getRiskScore(profile: any): Promise<AuditRisk> {
    return this.assessAuditRisk(profile);
  }

  public getCompliance(entityId: string, type: string): Promise<ComplianceCalendar> {
    return this.generateComplianceCalendar(entityId, type);
  }
}

// Handler for ZANTARA integration
export async function handleTaxQuery(params: any): Promise<any> {
  const taxGenius = new TaxGenius();

  if (params.action === 'optimize') {
    return await taxGenius.getOptimizations(params.profile);
  }

  if (params.action === 'audit_risk') {
    return await taxGenius.getRiskScore(params.profile);
  }

  if (params.action === 'compliance') {
    return await taxGenius.getCompliance(params.entityId, params.entityType);
  }

  if (params.action === 'updates') {
    return taxGenius.getRecentUpdates(params.hours || 24);
  }

  return {
    error: 'Please specify action: optimize, audit_risk, compliance, or updates'
  };
}
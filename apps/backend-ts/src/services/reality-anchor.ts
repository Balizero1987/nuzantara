// Reality Anchor System - Advanced Anti-Hallucination Engine
// Ensures ZANTARA remains grounded in verifiable reality

import logger from './logger.js';
// import { AntiHallucinationSystem } from "./anti-hallucination.js"; // Not used

interface RealityCheck {
  timestamp: string;
  context: string;
  verifiedFacts: string[];
  contradictions: string[];
  realityScore: number;
}

interface BusinessTruth {
  fact: string;
  source: 'official' | 'documented' | 'verified' | 'historical';
  lastVerified: string;
  immutable: boolean;
}

export class RealityAnchorSystem {
  private static instance: RealityAnchorSystem;
  // private antiHallucination: AntiHallucinationSystem = AntiHallucinationSystem.getInstance(); // Not used

  // Immutable business truths about Bali Zero
  // NOTE: Service-specific data (visa types, company types, pricing, timelines) 
  // are stored in Qdrant/PostgreSQL and retrieved via RAG backend
  private readonly ABSOLUTE_TRUTHS: BusinessTruth[] = [
    {
      fact: 'Bali Zero operates in Kerobokan, Bali, Indonesia',
      source: 'official',
      lastVerified: '2025-09-26',
      immutable: true,
    },
    {
      fact: 'Services: Visa, Company Setup, Tax Consulting, Real Estate Legal',
      source: 'official',
      lastVerified: '2025-09-26',
      immutable: true,
    },
    {
      fact: 'CEO: Zainal Abidin (zainal@balizero.id)',
      source: 'documented',
      lastVerified: '2025-09-26',
      immutable: true,
    },
    // Service-specific facts (visa types, company types, etc.) are now in the database
    {
      fact: 'Response time: 24-48 hours typical',
      source: 'historical',
      lastVerified: '2025-09-26',
      immutable: false,
    },
  ];

  // Real-time fact verification database
  private verificationCache: Map<
    string,
    {
      verified: boolean;
      confidence: number;
      lastCheck: Date;
      evidence: any;
    }
  > = new Map();

  // Contradiction detection patterns
  private contradictionPatterns = [
    { pattern: /always|never|100%|guaranteed/gi, flag: 'absolute_claim' },
    { pattern: /instant|immediate|right now/gi, flag: 'unrealistic_timeline' },
    { pattern: /free|no cost|completely free/gi, flag: 'pricing_claim' },
    { pattern: /unlimited|infinite|endless/gi, flag: 'resource_claim' },
  ];

  private constructor() {
    // antiHallucination already initialized in property declaration
  }

  public static getInstance(): RealityAnchorSystem {
    if (!RealityAnchorSystem.instance) {
      RealityAnchorSystem.instance = new RealityAnchorSystem();
    }
    return RealityAnchorSystem.instance;
  }

  /**
   * Perform deep reality check on any claim
   */
  async performRealityCheck(claim: string, context: string): Promise<RealityCheck> {
    const timestamp = new Date().toISOString();
    const verifiedFacts: string[] = [];
    const contradictions: string[] = [];
    let realityScore = 1.0;

    // Check against absolute truths
    for (const truth of this.ABSOLUTE_TRUTHS) {
      if (this.claimContradictsTruth(claim, truth.fact)) {
        contradictions.push(`Contradicts known fact: ${truth.fact}`);
        realityScore *= 0.3;
      }
      if (this.claimAlignsWith(claim, truth.fact)) {
        verifiedFacts.push(truth.fact);
        realityScore = Math.min(1.0, realityScore * 1.2);
      }
    }

    // Check for contradiction patterns
    for (const pattern of this.contradictionPatterns) {
      if (pattern.pattern.test(claim)) {
        contradictions.push(`Contains ${pattern.flag}`);
        realityScore *= 0.7;
      }
    }

    // Temporal consistency check
    const temporalCheck = await this.checkTemporalConsistency(claim);
    if (!temporalCheck.consistent) {
      contradictions.push(temporalCheck.issue || 'Temporal inconsistency');
      realityScore *= 0.6;
    }

    // Cross-reference with historical data
    const historicalCheck = await this.crossReferenceHistory(claim, context); // context passed but not used in method (Firestore removed)
    if (historicalCheck.discrepancies > 0) {
      contradictions.push(`${historicalCheck.discrepancies} historical discrepancies found`);
      realityScore *= 0.8;
    }

    return {
      timestamp,
      context,
      verifiedFacts,
      contradictions,
      realityScore: Math.max(0.1, Math.min(1.0, realityScore)),
    };
  }

  /**
   * Check if claim contradicts known truth
   */
  private claimContradictsTruth(claim: string, truth: string): boolean {
    const claimLower = claim.toLowerCase();
    const truthLower = truth.toLowerCase();

    // Direct contradiction patterns
    const firstWord = truthLower.split(' ')[0];
    if (firstWord && claimLower.includes('not') && claimLower.includes(firstWord)) {
      return true;
    }

    // Numeric contradictions
    const claimNumbers = this.extractNumbers(claim);
    const truthNumbers = this.extractNumbers(truth);

    for (const cn of claimNumbers) {
      for (const tn of truthNumbers) {
        if (Math.abs(cn - tn) / tn > 2) {
          // More than 200% difference
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if claim aligns with truth
   */
  private claimAlignsWith(claim: string, truth: string): boolean {
    const claimLower = claim.toLowerCase();
    const truthKeywords = truth
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    let matches = 0;
    for (const keyword of truthKeywords) {
      if (claimLower.includes(keyword)) {
        matches++;
      }
    }

    return matches >= truthKeywords.length * 0.5;
  }

  /**
   * Extract numbers from text
   */
  private extractNumbers(text: string): number[] {
    const matches = text.match(/\d+(?:\.\d+)?/g);
    return matches ? matches.map(Number) : [];
  }

  /**
   * Check temporal consistency
   */
  private async checkTemporalConsistency(claim: string): Promise<{
    consistent: boolean;
    issue?: string;
  }> {
    // Check for impossible timeframes
    if (/within seconds|instantly|immediately/i.test(claim)) {
      if (/visa|company|tax|legal/i.test(claim)) {
        return {
          consistent: false,
          issue: 'Unrealistic timeframe for bureaucratic process',
        };
      }
    }

    // Check for date consistency
    const datePattern = /\d{4}-\d{2}-\d{2}/g;
    const dates = claim.match(datePattern);
    if (dates) {
      const parsedDates = dates.map((d) => new Date(d));
      const now = new Date();

      for (const date of parsedDates) {
        if (date > now) {
          return {
            consistent: false,
            issue: 'Future date mentioned as past event',
          };
        }
      }
    }

    return { consistent: true };
  }

  /**
   * Cross-reference with historical data
   */
  private async crossReferenceHistory(
    _claim: string,
    _context: string
  ): Promise<{ discrepancies: number; details: string[] }> {
    const discrepancies: string[] = [];

    // Legacy persistence layer removed - using local cache only
    // TODO: If persistence needed, use PostgreSQL

    return {
      discrepancies: discrepancies.length,
      details: discrepancies,
    };
  }

  /**
   * Generate reality-anchored response
   */
  async generateAnchoredResponse(originalResponse: any, context: string): Promise<any> {
    // Extract all claims from response
    const claims = this.extractClaims(originalResponse);
    const anchoredResponse = { ...originalResponse };
    const realityChecks: RealityCheck[] = [];

    // Check each claim
    for (const claim of claims) {
      const check = await this.performRealityCheck(claim, context);
      realityChecks.push(check);

      // Replace problematic claims
      if (check.realityScore < 0.5) {
        anchoredResponse.warnings = anchoredResponse.warnings || [];
        anchoredResponse.warnings.push(`Low reality score: ${claim}`);
      }
    }

    // Calculate overall reality score
    const overallScore =
      realityChecks.reduce((sum, check) => sum + check.realityScore, 0) /
      (realityChecks.length || 1);

    anchoredResponse.reality_anchor = {
      score: overallScore,
      checks_performed: realityChecks.length,
      verified_facts: realityChecks.flatMap((c) => c.verifiedFacts).length,
      contradictions_found: realityChecks.flatMap((c) => c.contradictions).length,
      timestamp: new Date().toISOString(),
    };

    // Add disclaimer if score is low
    if (overallScore < 0.7) {
      anchoredResponse.disclaimer =
        'This response has been flagged for review. Please verify independently.';
    }

    return anchoredResponse;
  }

  /**
   * Extract claims from response
   */
  private extractClaims(response: any): string[] {
    const claims: string[] = [];

    if (typeof response === 'string') {
      claims.push(response);
    } else if (response && typeof response === 'object') {
      // Extract text from various fields
      const textFields = ['message', 'response', 'data', 'content', 'text'];
      for (const field of textFields) {
        if (response[field]) {
          if (typeof response[field] === 'string') {
            claims.push(response[field]);
          } else if (typeof response[field] === 'object') {
            claims.push(...this.extractClaims(response[field]));
          }
        }
      }
    }

    // Split into sentences
    const allClaims: string[] = [];
    for (const claim of claims) {
      const sentences = claim.split(/[.!?]+/).filter((s) => s.trim().length > 10);
      allClaims.push(...sentences);
    }

    return allClaims;
  }

  /**
   * Learn from verified interactions
   */
  async learnFromInteraction(
    handler: string,
    input: any,
    output: any,
    wasSuccessful: boolean
  ): Promise<void> {
    // Firestore removed - learning now uses local cache only
    // TODO: If persistence needed, use PostgreSQL
    try {
      logger.debug('Reality learning (local cache only)', { handler, wasSuccessful });

      // Update verification cache
      if (wasSuccessful && output.reality_anchor?.score > 0.8) {
        const key = `${handler}:${JSON.stringify(input)}`;
        this.verificationCache.set(key, {
          verified: true,
          confidence: output.reality_anchor.score,
          lastCheck: new Date(),
          evidence: output,
        });
      }
    } catch (error) {
      logger.info('📝 Learning stored locally only');
    }
  }

  // extractPatterns method removed - not used after Firestore cleanup

  /**
   * Get reality report
   */
  getRealityReport(): {
    absoluteTruths: number;
    verifiedFacts: number;
    cacheSize: number;
    averageRealityScore: number;
    contradictionsDetected: number;
  } {
    const scores = Array.from(this.verificationCache.values()).map((v) => v.confidence);

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const contradictions = Array.from(this.verificationCache.values()).filter(
      (v) => v.confidence < 0.5
    ).length;

    return {
      absoluteTruths: this.ABSOLUTE_TRUTHS.length,
      verifiedFacts: this.verificationCache.size,
      cacheSize: this.verificationCache.size,
      averageRealityScore: avgScore,
      contradictionsDetected: contradictions,
    };
  }

  /**
   * Clear unverified cache entries
   */
  clearUnverifiedCache(): void {
    for (const [key, value] of this.verificationCache.entries()) {
      if (!value.verified || value.confidence < 0.5) {
        this.verificationCache.delete(key);
      }
    }
  }
}

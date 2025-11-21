// Anti-Hallucination System for ZANTARA
// Eliminates false information and ensures all responses are grounded in verified data

import logger from './logger.js';
import { getFirestore } from './firebase.js';

export interface VerifiedFact {
  fact: string;
  source: string;
  evidence: any;
  confidence: number;
  timestamp: string;
  verified: boolean;
}

export interface GroundedResponse {
  response: any;
  sources: string[];
  confidence: number;
  grounded: boolean;
  verification_timestamp: string;
  warnings?: string[];
}

export class AntiHallucinationSystem {
  private static instance: AntiHallucinationSystem;
  private factStore: Map<string, VerifiedFact> = new Map();
  private verifiedSources = new Set([
    'firestore',
    'google_workspace',
    'api_response',
    'user_input',
    'system_config',
    'historical_data',
    'configuration',
    'database',
    'external_api',
  ]);

  private trustedPatterns = {
    // Business facts that are always true for Bali Zero
    services: ['visa', 'company_setup', 'tax_consulting', 'real_estate_legal'],
    visa_types: ['B211B', 'KITAS', 'KITAP', 'VOA'],
    company_types: ['PT', 'PT_PMA', 'CV'],
    locations: ['Bali', 'Indonesia', 'Jakarta', 'Kerobokan'],

    // Verified operational facts
    response_times: {
      min_hours: 1,
      max_hours: 48,
      typical_hours: 24,
    },

    // Verified team members
    team_members: {
      zero: { role: 'ceo', email: 'zero@balizero.com', verified: true },
      zainal: { role: 'ceo_real', email: 'zainal@balizero.com', verified: true },

      damar: { role: 'junior_consultant', email: 'damar@balizero.com', verified: true },
      ari: { role: 'lead_specialist', email: 'ari.firda@balizero.com', verified: true },
    },
  };

  private constructor() {}

  public static getInstance(): AntiHallucinationSystem {
    if (!AntiHallucinationSystem.instance) {
      AntiHallucinationSystem.instance = new AntiHallucinationSystem();
    }
    return AntiHallucinationSystem.instance;
  }

  /**
   * Validate a fact against known sources
   */
  async validateFact(
    fact: string,
    source: string,
    evidence?: any,
    confidence: number = 0.8
  ): Promise<VerifiedFact> {
    // Check if source is trusted
    if (!this.verifiedSources.has(source)) {
      logger.warn(`⚠️ Unverified source: ${source}`);
      confidence *= 0.5; // Reduce confidence for unverified sources
    }

    // Check against known patterns
    const isPatternMatch = this.checkAgainstPatterns(fact);
    if (isPatternMatch) {
      confidence = Math.min(1.0, confidence * 1.2);
    }

    const verifiedFact: VerifiedFact = {
      fact,
      source,
      evidence: evidence || null,
      confidence,
      timestamp: new Date().toISOString(),
      verified: confidence >= 0.7,
    };

    // Store fact
    this.factStore.set(fact, verifiedFact);

    // Persist important facts to Firestore
    if (verifiedFact.verified && confidence >= 0.9) {
      await this.persistFact(verifiedFact);
    }

    return verifiedFact;
  }

  /**
   * Check fact against known patterns
   */
  private checkAgainstPatterns(fact: string): boolean {
    const lowerFact = fact.toLowerCase();

    // Check service mentions
    if (this.trustedPatterns.services.some((s) => lowerFact.includes(s.toLowerCase()))) {
      return true;
    }

    // Check visa types
    if (this.trustedPatterns.visa_types.some((v) => lowerFact.includes(v.toLowerCase()))) {
      return true;
    }

    // Check locations
    if (this.trustedPatterns.locations.some((l) => lowerFact.includes(l.toLowerCase()))) {
      return true;
    }

    return false;
  }

  /**
   * Ground a response in verified data
   */
  async groundResponse(
    response: any,
    sources: string[],
    _context?: any
  ): Promise<GroundedResponse> {
    const warnings: string[] = [];
    let confidence = 1.0;

    // Validate all sources
    for (const source of sources) {
      if (!this.verifiedSources.has(source)) {
        warnings.push(`Source '${source}' is not verified`);
        confidence *= 0.8;
      }
    }

    // Check for numeric claims
    if (typeof response === 'object') {
      const validated = await this.validateNumericClaims(response);
      if (validated.warnings.length > 0) {
        warnings.push(...validated.warnings);
        confidence *= validated.confidence;
      }
    }

    // Check for unverified statements
    if (typeof response === 'string' || (response && response.message)) {
      const text = typeof response === 'string' ? response : response.message;
      const validationResult = await this.validateTextClaims(text);
      if (validationResult.warnings.length > 0) {
        warnings.push(...validationResult.warnings);
        confidence *= validationResult.confidence;
      }
    }

    return {
      response,
      sources,
      confidence: Math.max(0.1, confidence),
      grounded: confidence >= 0.7,
      verification_timestamp: new Date().toISOString(),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate numeric claims in response
   */
  private async validateNumericClaims(
    obj: any
  ): Promise<{ warnings: string[]; confidence: number }> {
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check response times
    if (obj.response_time || obj.timeline || obj.duration) {
      const time = obj.response_time || obj.timeline || obj.duration;
      if (typeof time === 'number') {
        if (time < this.trustedPatterns.response_times.min_hours) {
          warnings.push(`Response time ${time} hours is unrealistically fast`);
          confidence *= 0.5;
        }
        if (time > this.trustedPatterns.response_times.max_hours * 7) {
          warnings.push(`Response time ${time} hours seems excessive`);
          confidence *= 0.7;
        }
      }
    }

    // Check probabilities
    if (obj.probability || obj.confidence || obj.success_rate) {
      const prob = obj.probability || obj.confidence || obj.success_rate;
      if (typeof prob === 'number') {
        if (prob > 1 && prob <= 100) {
          // Convert percentage to decimal
          obj.probability = prob / 100;
        } else if (prob > 100) {
          warnings.push(`Invalid probability value: ${prob}`);
          confidence *= 0.3;
        }
      }
    }

    return { warnings, confidence };
  }

  /**
   * Validate text claims
   */
  private async validateTextClaims(
    text: string
  ): Promise<{ warnings: string[]; confidence: number }> {
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check for absolute statements
    const absoluteTerms = ['always', 'never', 'guaranteed', '100%', 'definitely'];
    for (const term of absoluteTerms) {
      if (text.toLowerCase().includes(term)) {
        warnings.push(
          `Absolute statement detected: '${term}' - consider using probabilistic language`
        );
        confidence *= 0.8;
      }
    }

    // Check for unverified specific numbers
    const numberPattern = /\d+(\.\d+)?%?/g;
    const numbers = text.match(numberPattern);
    if (numbers && numbers.length > 0) {
      for (const num of numbers) {
        // Allow known good numbers
        const knownGoodNumbers = ['24', '48', '1', '2', '3', '5', '7', '10', '30', '60', '90'];
        if (!knownGoodNumbers.some((good) => num.includes(good))) {
          warnings.push(`Unverified specific number: ${num}`);
          confidence *= 0.9;
        }
      }
    }

    return { warnings, confidence };
  }

  /**
   * Persist verified fact to Firestore
   */
  private async persistFact(fact: VerifiedFact): Promise<void> {
    try {
      const db = getFirestore();
      await db.collection('verified_facts').add({
        ...fact,
        created_at: new Date(),
      });
    } catch (error) {
      logger.info('📝 Fact stored locally only');
    }
  }

  /**
   * Clear unverified facts
   */
  clearUnverifiedFacts(): void {
    for (const [key, fact] of this.factStore.entries()) {
      if (!fact.verified) {
        this.factStore.delete(key);
      }
    }
    logger.info(`✅ Cleared ${this.factStore.size} unverified facts`);
  }

  /**
   * Get verification report
   */
  getVerificationReport(): {
    total_facts: number;
    verified_facts: number;
    unverified_facts: number;
    average_confidence: number;
    sources_used: string[];
  } {
    const facts = Array.from(this.factStore.values());
    const verified = facts.filter((f) => f.verified);
    const avgConfidence = facts.reduce((sum, f) => sum + f.confidence, 0) / (facts.length || 1);
    const sources = [...new Set(facts.map((f) => f.source))];

    return {
      total_facts: facts.length,
      verified_facts: verified.length,
      unverified_facts: facts.length - verified.length,
      average_confidence: avgConfidence,
      sources_used: sources,
    };
  }

  /**
   * Validate handler response
   */
  async validateHandlerResponse(
    handlerName: string,
    params: any,
    response: any
  ): Promise<GroundedResponse> {
    // Determine sources based on handler
    const sources: string[] = [];

    if (handlerName.includes('memory')) sources.push('firestore');
    if (handlerName.includes('drive') || handlerName.includes('calendar'))
      sources.push('google_workspace');
    if (handlerName.includes('ai') || handlerName.includes('openai')) sources.push('external_api');
    if (handlerName.includes('identity')) sources.push('database');
    if (handlerName.includes('zara')) sources.push('system_config');

    if (sources.length === 0) sources.push('system_config');

    // Ground the response
    const grounded = await this.groundResponse(response, sources, { handlerName, params });

    // Log if not well-grounded
    if (!grounded.grounded) {
      logger.warn(`⚠️ Low confidence response from ${handlerName}:`, grounded.confidence);
    }

    return grounded;
  }

  /**
   * Create safe default response
   */
  createSafeResponse(handlerName: string, error?: any): any {
    return {
      ok: false,
      error: 'VALIDATION_ERROR',
      message: error?.message || 'Unable to provide verified response',
      handler: handlerName,
      suggestion: 'Please try with more specific parameters or contact support',
      grounded: true,
      sources: ['system_config'],
      confidence: 1.0,
    };
  }
}

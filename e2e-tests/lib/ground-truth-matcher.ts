/**
 * 🎯 Ground Truth Matcher
 * 
 * Matching DETERMINISTICO tra risposta AI e ground truth.
 */

export interface PriceMatch {
  found: string[];
  missing: string[];
  incorrect: Array<{ ai: string; expected: string }>;
  accuracy: number;
}

export interface LawMatch {
  found: string[];
  missing: string[];
  wrong: string[];
  accuracy: number;
}

export interface FactMatch {
  matched: string[];
  missing: string[];
  coverage: number;
}

export class GroundTruthMatcher {
  
  matchPrices(aiResponses: string[], groundTruthPrices: string[]): PriceMatch {
    const aiText = aiResponses.join(' ');
    const found: string[] = [];
    const missing: string[] = [];
    const incorrect: Array<{ ai: string; expected: string }> = [];

    const aiPrices = this.extractPrices(aiText);

    for (const gtPrice of groundTruthPrices) {
      const normalized = this.normalizePrice(gtPrice);
      const matchFound = aiPrices.some(aiPrice => 
        this.normalizePrice(aiPrice) === normalized
      );

      if (matchFound) {
        found.push(gtPrice);
      } else {
        missing.push(gtPrice);
      }
    }

    const accuracy = groundTruthPrices.length > 0 
      ? (found.length / groundTruthPrices.length) * 100 
      : 100;

    return { found, missing, incorrect, accuracy };
  }

  matchLaws(aiResponses: string[], groundTruthLaws: string[]): LawMatch {
    const aiText = aiResponses.join(' ');
    const found: string[] = [];
    const missing: string[] = [];
    const wrong: string[] = [];

    const aiLaws = this.extractLaws(aiText);

    for (const gtLaw of groundTruthLaws) {
      const normalized = this.normalizeLaw(gtLaw);
      const matchFound = aiLaws.some(aiLaw => 
        this.normalizeLaw(aiLaw) === normalized
      );

      if (matchFound) {
        found.push(gtLaw);
      } else {
        missing.push(gtLaw);
      }
    }

    for (const aiLaw of aiLaws) {
      const normalized = this.normalizeLaw(aiLaw);
      const isInGroundTruth = groundTruthLaws.some(gtLaw => 
        this.normalizeLaw(gtLaw) === normalized
      );

      if (!isInGroundTruth) {
        wrong.push(aiLaw);
      }
    }

    const accuracy = groundTruthLaws.length > 0 
      ? (found.length / groundTruthLaws.length) * 100 
      : 100;

    return { found, missing, wrong, accuracy };
  }

  matchFacts(aiResponses: string[], groundTruthFacts: string[]): FactMatch {
    const aiText = aiResponses.join(' ').toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    for (const fact of groundTruthFacts) {
      const normalized = this.normalizeFact(fact);
      
      if (aiText.includes(normalized)) {
        matched.push(fact);
      } else {
        missing.push(fact);
      }
    }

    const coverage = groundTruthFacts.length > 0 
      ? (matched.length / groundTruthFacts.length) * 100 
      : 100;

    return { matched, missing, coverage };
  }

  private extractPrices(text: string): string[] {
    const prices: string[] = [];
    
    const patterns = [
      /IDR\s+([\d,\.]+\s*[MBmb](?:illion)?)/gi,
      /Rp\.?\s*([\d,\.]+\s*[MBmb](?:uta|ilyar)?)/gi,
      /(?:harga|biaya|cost|price|fee):\s*IDR\s+([\d,\.]+\s*[MBmb]?)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        prices.push(`IDR ${match[1]}`);
      }
    }

    return prices;
  }

  private normalizePrice(price: string): string {
    return price
      .toUpperCase()
      .replace(/[,\s\.]/g, '')
      .replace(/RUPIAH/gi, '')
      .replace(/RP\.?/gi, 'IDR')
      .replace(/MILYAR/gi, 'B')
      .replace(/BILLION/gi, 'B')
      .replace(/JUTA/gi, 'M')
      .replace(/MILLION/gi, 'M')
      .trim();
  }

  private extractLaws(text: string): string[] {
    const laws: string[] = [];
    
    const uuPattern = /UU\s+(?:No\.?\s*)?(\d+)\/(\d{4})/gi;
    const matches = text.matchAll(uuPattern);
    
    for (const match of matches) {
      laws.push(`UU No. ${match[1]}/${match[2]}`);
    }

    const regPattern = /(Perpres|Permenkumham|Permenimipas|PP|SE IMI)\s+(?:No\.?\s*)?(\S+)/gi;
    const regMatches = text.matchAll(regPattern);
    
    for (const match of regMatches) {
      laws.push(`${match[1]} ${match[2]}`);
    }

    return [...new Set(laws)];
  }

  private normalizeLaw(law: string): string {
    return law
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/NO\.?/gi, '')
      .replace(/NOMOR/gi, '')
      .replace(/TAHUN/gi, '/')
      .trim();
  }

  private normalizeFact(fact: string): string {
    return fact
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  calculateOverallAccuracy(priceMatch: PriceMatch, lawMatch: LawMatch, factMatch: FactMatch): number {
    const weights = { prices: 0.4, laws: 0.4, facts: 0.2 };

    const score = 
      (priceMatch.accuracy * weights.prices) +
      (lawMatch.accuracy * weights.laws) +
      (factMatch.coverage * weights.facts);

    return Math.round(score) / 10;
  }
}

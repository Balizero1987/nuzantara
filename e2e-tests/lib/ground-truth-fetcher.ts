/**
 * 🎯 Ground Truth Fetcher
 * 
 * Interroga ChromaDB Oracle collections per ottenere le LEGGI VERE
 * da usare come ground truth nella validazione.
 */

export interface OracleQueryResponse {
  results: Array<{
    text: string;
    metadata: any;
    score: number;
  }>;
  collection_used: string;
}

export interface GroundTruthData {
  laws: string[];
  regulations: string[];
  facts: string[];
  prices: string[];
  procedures: string[];
  sources: string[];
}

export class GroundTruthFetcher {
  private ragBackendUrl: string;

  constructor(ragBackendUrl: string = 'https://rag-backend-production.up.railway.app') {
    this.ragBackendUrl = ragBackendUrl;
  }

  async fetchGroundTruth(conversation: any): Promise<GroundTruthData> {
    const category = conversation.category;
    const firstQuery = conversation.turns[0]?.text || '';
    
    console.log(`    🔍 Querying Oracle collections for ground truth...`);
    
    const collections = this.getCollectionsForCategory(category);
    const allResults: GroundTruthData = {
      laws: [],
      regulations: [],
      facts: [],
      prices: [],
      procedures: [],
      sources: []
    };

    for (const collection of collections) {
      try {
        const results = await this.queryOracle(firstQuery, collection);
        const extracted = this.extractGroundTruth(results, collection);
        
        allResults.laws.push(...extracted.laws);
        allResults.regulations.push(...extracted.regulations);
        allResults.facts.push(...extracted.facts);
        allResults.prices.push(...extracted.prices);
        allResults.procedures.push(...extracted.procedures);
        allResults.sources.push(...extracted.sources);
        
        console.log(`      ✓ ${collection}: ${results.results.length} docs, ${extracted.laws.length} laws`);
      } catch (error) {
        console.log(`      ✗ ${collection}: ${error}`);
      }
    }

    allResults.laws = [...new Set(allResults.laws)];
    allResults.regulations = [...new Set(allResults.regulations)];
    allResults.facts = [...new Set(allResults.facts)];
    allResults.prices = [...new Set(allResults.prices)];
    allResults.procedures = [...new Set(allResults.procedures)];
    allResults.sources = [...new Set(allResults.sources)];

    return allResults;
  }

  private async queryOracle(query: string, collection: string): Promise<OracleQueryResponse> {
    const response = await fetch(`${this.ragBackendUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        user_level: 3,
        limit: 10,
        collection_override: collection
      })
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private extractGroundTruth(results: OracleQueryResponse, collection: string): GroundTruthData {
    const data: GroundTruthData = {
      laws: [],
      regulations: [],
      facts: [],
      prices: [],
      procedures: [],
      sources: []
    };

    for (const result of results.results) {
      const text = result.text;
      
      const lawMatches = text.matchAll(/UU\s+(?:No\.\s*)?(\d+)\/(\d{4})/gi);
      for (const match of lawMatches) {
        data.laws.push(`UU No. ${match[1]}/${match[2]}`);
      }

      const regMatches = text.matchAll(/(Perpres|Permenkumham|Permenimipas|PP|SE IMI)\s+(?:No\.\s*)?(\S+)/gi);
      for (const match of regMatches) {
        data.regulations.push(`${match[1]} ${match[2]}`);
      }

      const priceMatches = text.matchAll(/IDR\s+([\d,\.]+(?:\s*[MBmb](?:illion)?)?)/gi);
      for (const match of priceMatches) {
        data.prices.push(`IDR ${match[1]}`);
      }

      if (collection === 'visa_oracle') {
        this.extractVisaFacts(text, data);
      } else if (collection.includes('tax')) {
        this.extractTaxFacts(text, data);
      } else if (collection.includes('legal')) {
        this.extractLegalFacts(text, data);
      } else if (collection === 'bali_zero_pricing') {
        this.extractPricingFacts(text, data);
      }

      data.sources.push(text.substring(0, 500));
    }

    return data;
  }

  private extractVisaFacts(text: string, data: GroundTruthData): void {
    const visaMatches = text.matchAll(/\b([A-Z]\d{2,3}[A-Z]?)\s+(?:visa|KITAS)/gi);
    for (const match of visaMatches) {
      data.facts.push(`Visa type: ${match[1]}`);
    }
  }

  private extractTaxFacts(text: string, data: GroundTruthData): void {
    const rateMatches = text.matchAll(/(\d+)%\s+(?:tax|PPh|PPN|BPHTB)/gi);
    for (const match of rateMatches) {
      data.facts.push(`Tax rate: ${match[0]}`);
    }
  }

  private extractLegalFacts(text: string, data: GroundTruthData): void {
    const structureMatches = text.matchAll(/\b(PT PMA|PT|CV|UD|Leasehold|Hak Pakai|Hak Milik)\b/gi);
    for (const match of structureMatches) {
      data.facts.push(`Legal structure: ${match[1]}`);
    }
  }

  private extractPricingFacts(text: string, data: GroundTruthData): void {
    const serviceMatches = text.matchAll(/([A-Z][A-Za-z\s]+):\s*IDR\s+([\d,\.]+\s*[MB]?)/gi);
    for (const match of serviceMatches) {
      data.facts.push(`${match[1].trim()}: IDR ${match[2]}`);
    }
  }

  private getCollectionsForCategory(category: string): string[] {
    const collectionMap: Record<string, string[]> = {
      'PRICING_SETUP': ['bali_zero_pricing', 'legal_architect'],
      'VISA_APPLICATION': ['visa_oracle'],
      'TAX_COMPLIANCE': ['tax_genius', 'tax_updates'],
      'COMPANY_FORMATION': ['legal_architect', 'legal_updates', 'kbli_eye'],
      'PROPERTY_ACQUISITION': ['property_knowledge', 'property_listings', 'legal_architect'],
      'KBLI_LOOKUP': ['kbli_eye', 'kbli_comprehensive'],
      'INTEL_AUTOMATION': ['legal_updates', 'visa_oracle'],
      'ADVANCED_ORACLE': ['tax_genius', 'legal_architect', 'visa_oracle'],
      'PROACTIVE_COMPLIANCE': ['tax_updates', 'legal_updates', 'visa_oracle'],
      'LEGAL_COMPLIANCE': ['legal_architect', 'legal_updates'],
      'TEAM_OPERATIONS': ['bali_zero_pricing'],
      'TRANSLATION_SERVICES': ['kb_indonesian'],
      'INSTAGRAM_AUTOMATION': ['bali_zero_pricing'],
      'TEAM_COLLABORATION': ['bali_zero_pricing'],
      'MEMORY_INTELLIGENCE': ['bali_zero_pricing'],
      'DOCUMENT_AUTOMATION': ['legal_architect'],
      'PRICING_INTELLIGENCE': ['bali_zero_pricing'],
      'CRISIS_MANAGEMENT': ['visa_oracle', 'legal_architect']
    };

    return collectionMap[category] || ['bali_zero_pricing', 'visa_oracle'];
  }

  static formatForPrompt(groundTruth: GroundTruthData): string {
    let formatted = '**GROUND TRUTH FROM CHROMADB ORACLE COLLECTIONS:**\n\n';

    if (groundTruth.laws.length > 0) {
      formatted += '**Indonesian Laws (MUST be referenced):**\n';
      groundTruth.laws.forEach(law => formatted += `- ${law}\n`);
      formatted += '\n';
    }

    if (groundTruth.regulations.length > 0) {
      formatted += '**Regulations (Should be cited):**\n';
      groundTruth.regulations.slice(0, 10).forEach(reg => formatted += `- ${reg}\n`);
      formatted += '\n';
    }

    if (groundTruth.prices.length > 0) {
      formatted += '**Official Prices (Must be accurate):**\n';
      groundTruth.prices.slice(0, 10).forEach(price => formatted += `- ${price}\n`);
      formatted += '\n';
    }

    if (groundTruth.facts.length > 0) {
      formatted += '**Key Facts (Should appear in response):**\n';
      groundTruth.facts.slice(0, 15).forEach(fact => formatted += `- ${fact}\n`);
      formatted += '\n';
    }

    return formatted;
  }
}

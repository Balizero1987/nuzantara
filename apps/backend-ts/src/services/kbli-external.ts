// External KBLI API Integration for ZANTARA
// Connects to real-time Indonesian government APIs for KBLI data

import logger from './logger.js';
// import { getCachedEmbedding, getCachedSearch } from './memory-cache.js';
import axios from 'axios';

interface KBLIExternal {
  code: string;
  name: string;
  nameEn: string;
  description: string;
  riskLevel: 'R' | 'MR' | 'MT' | 'T'; // OSS Risk Categories
  capitalRequirement: string;
  foreignOwnership: string;
  requirements: string[];
  lastUpdated: string;
  source: string;
}

class KBLIExternalService {
  private readonly OSS_API_BASE = 'https://oss.go.id';
  private readonly BPS_API_BASE = 'https://api.bps.go.id';
  private readonly BKPM_API_BASE = 'https://api.bkpm.go.id';
  private readonly DEPKUMHAM_API_BASE = 'https://api.depkumham.go.id';

  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Get KBLI data from OSS (Online Single Submission) system
   */
  async getOSSKBLI(code?: string, category?: string): Promise<KBLIExternal[]> {
    try {
      const cacheKey = `oss_kbli_${code || 'all'}_${category || 'all'}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`⚡ OSS KBLI cache HIT for ${cacheKey}`);
        return cached;
      }

      // OSS API call
      let url = `${this.OSS_API_BASE}/api/v1/kbli`;
      if (code) {
        url += `/${code}`;
      } else if (category) {
        url += `?category=${category}`;
      }

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'ZANTARA-System/3.0',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const kbliData = this.transformOSSData(response.data);

      // Cache for 24 hours
      this.setCache(cacheKey, kbliData, 24 * 60 * 60 * 1000);

      logger.info(`✅ Retrieved ${kbliData.length} KBLI entries from OSS API`);
      return kbliData;
    } catch (error: any) {
      logger.error('❌ OSS KBLI API call failed:', error.message);

      // Fallback to BPS API
      return this.getBPSKBLI(code, category);
    }
  }

  /**
   * Get KBLI data from BPS (Statistics Indonesia) API
   */
  async getBPSKBLI(code?: string, category?: string): Promise<KBLIExternal[]> {
    try {
      const cacheKey = `bps_kbli_${code || 'all'}_${category || 'all'}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`⚡ BPS KBLI cache HIT for ${cacheKey}`);
        return cached;
      }

      // BPS API call
      let url = `${this.BPS_API_BASE}/v1/kbli-2020`;
      if (code) {
        url += `/${code}`;
      } else if (category) {
        url += `?sektor=${category}`;
      }

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'ZANTARA-System/3.0',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.BPS_API_KEY}`,
        },
        timeout: 15000,
      });

      const kbliData = this.transformBPSData(response.data);

      // Cache for 48 hours (BPS data changes less frequently)
      this.setCache(cacheKey, kbliData, 48 * 60 * 60 * 1000);

      logger.info(`✅ Retrieved ${kbliData.length} KBLI entries from BPS API`);
      return kbliData;
    } catch (error: any) {
      logger.error('❌ BPS KBLI API call failed:', error.message);

      // Final fallback - return empty array
      logger.warn('⚠️ All external KBLI APIs failed, using local database only');
      return [];
    }
  }

  /**
   * Get investment requirements from BKPM (Investment Coordinating Board)
   */
  async getBKPMRequirements(kbliCode: string): Promise<{
    foreignOwnership: string;
    capitalRequirement: string;
    restrictions: string[];
    specialPermits: string[];
  }> {
    try {
      const cacheKey = `bkpm_${kbliCode}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`⚡ BKPM cache HIT for ${kbliCode}`);
        return cached;
      }

      const response = await axios.get(`${this.BKPM_API_BASE}/v1/investment/${kbliCode}`, {
        headers: {
          'User-Agent': 'ZANTARA-System/3.0',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.BKPM_API_KEY}`,
        },
        timeout: 12000,
      });

      const requirements = {
        foreignOwnership: response.data.foreign_ownership || 'Check latest regulations',
        capitalRequirement: response.data.capital_requirement || 'RETRIEVED_FROM_DATABASE',
        restrictions: response.data.restrictions || [],
        specialPermits: response.data.special_permits || [],
      };

      // Cache for 72 hours
      this.setCache(cacheKey, requirements, 72 * 60 * 60 * 1000);

      logger.info(`✅ Retrieved BKPM requirements for ${kbliCode}`);
      return requirements;
    } catch (error: any) {
      logger.error(`❌ BKPM API call failed for ${kbliCode}:`, error.message);

      // Return fallback data
      return {
        foreignOwnership: 'Check latest DNI regulations',
        capitalRequirement: 'RETRIEVED_FROM_DATABASE',
        restrictions: ['Check latest regulations'],
        specialPermits: ['May require additional permits'],
      };
    }
  }

  /**
   * Get legal requirements from Ministry of Law and Human Rights
   */
  async getLegalRequirements(kbliCode: string): Promise<{
    requirements: string[];
    processingTime: string;
    authority: string;
  }> {
    try {
      const cacheKey = `legal_${kbliCode}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`⚡ Legal requirements cache HIT for ${kbliCode}`);
        return cached;
      }

      const response = await axios.get(`${this.DEPKUMHAM_API_BASE}/v1/legal/${kbliCode}`, {
        headers: {
          'User-Agent': 'ZANTARA-System/3.0',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.DEPKUMHAM_API_KEY}`,
        },
        timeout: 12000,
      });

      const legalData = {
        requirements: response.data.requirements || [],
        processingTime: response.data.processing_time || 'Varies by type',
        authority: response.data.authority || 'Relevant ministry',
      };

      // Cache for 168 hours (1 week)
      this.setCache(cacheKey, legalData, 168 * 60 * 60 * 1000);

      logger.info(`✅ Retrieved legal requirements for ${kbliCode}`);
      return legalData;
    } catch (error: any) {
      logger.error(`❌ Legal requirements API call failed for ${kbliCode}:`, error.message);

      // Return fallback data
      return {
        requirements: ['Standard business requirements apply'],
        processingTime: '14-30 business days',
        authority: 'OSS system',
      };
    }
  }

  /**
   * Enhanced KBLI search combining all external sources
   */
  async searchKBLIEnhanced(query: string): Promise<{
    local: any[];
    external: KBLIExternal[];
    combined: any[];
  }> {
    try {
      // Search local database first
      const localResults = await this.searchLocalKBLI(query);

      // Search external APIs
      const externalResults = await this.searchExternalKBLI(query);

      // Combine and deduplicate
      const combinedResults = this.combineResults(localResults, externalResults, query);

      logger.info(
        `🔍 KBLI enhanced search: ${localResults.length} local, ${externalResults.length} external, ${combinedResults.length} total`
      );

      return {
        local: localResults,
        external: externalResults,
        combined: combinedResults,
      };
    } catch (error: any) {
      logger.error('❌ Enhanced KBLI search failed:', error instanceof Error ? error : new Error(String(error)));

      // Fallback to local only
      const localResults = await this.searchLocalKBLI(query);
      return {
        local: localResults,
        external: [],
        combined: localResults,
      };
    }
  }

  /**
   * Search local KBLI database
   */
  private async searchLocalKBLI(_query: string): Promise<any[]> {
    // This would integrate with the existing kbli.ts handler
    // For now, return empty array - implementation would connect to existing search
    return [];
  }

  /**
   * Search external KBLI APIs
   */
  private async searchExternalKBLI(query: string): Promise<KBLIExternal[]> {
    try {
      // Try OSS first
      const ossResults = await this.getOSSKBLI(undefined, query);

      // If OSS returns good results, use them
      if (ossResults.length > 0) {
        return ossResults;
      }

      // Fallback to BPS
      return await this.getBPSKBLI(undefined, query);
    } catch (error) {
      logger.error('❌ External KBLI search failed:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Combine local and external results
   */
  private combineResults(local: any[], external: KBLIExternal[], query?: string): any[] {
    const combined = [...local];
    const seenCodes = new Set(local.map((item) => item.code || item.kbli_code));

    external.forEach((item) => {
      if (!seenCodes.has(item.code)) {
        combined.push({
          ...item,
          source: 'external',
          lastUpdated: new Date().toISOString(),
        });
        seenCodes.add(item.code);
      }
    });

    // Sort by relevance (exact matches first, then partial)
    return combined.sort((a, b) => {
      if (!query) return 0;

      const aExact = a.nameEn?.toLowerCase() === query.toLowerCase();
      const bExact = b.nameEn?.toLowerCase() === query.toLowerCase();

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      return 0;
    });
  }

  /**
   * Transform OSS API data to our format
   */
  private transformOSSData(data: any): KBLIExternal[] {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      code: item.kode_kbli || '',
      name: item.nama || '',
      nameEn: item.nama_en || item.nama || '',
      description: item.deskripsi || '',
      riskLevel: item.resiko || 'MT',
      capitalRequirement: item.modal || 'RETRIEVED_FROM_DATABASE',
      foreignOwnership: item.asing || 'Check regulations',
      requirements: item.persyaratan || [],
      lastUpdated: item.updated_at || new Date().toISOString(),
      source: 'OSS API',
    }));
  }

  /**
   * Transform BPS API data to our format
   */
  private transformBPSData(data: any): KBLIExternal[] {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      code: item.kode || '',
      name: item.uraian || '',
      nameEn: item.description || item.uraian || '',
      description: item.keterangan || '',
      riskLevel: 'MT', // BPS doesn't provide risk level, default to medium-high
      capitalRequirement: 'RETRIEVED_FROM_DATABASE',
      foreignOwnership: 'Check latest regulations',
      requirements: [],
      lastUpdated: item.last_updated || new Date().toISOString(),
      source: 'BPS API',
    }));
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
}

export const kbliExternal = new KBLIExternalService();

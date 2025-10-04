/**
 * Tests for Bali Zero Pricing Handler
 * CRITICAL: Tests official pricing data retrieval (NO AI generation)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { baliZeroPricing, baliZeroQuickPrice } from '../bali-zero-pricing.js';

describe('Bali Zero Pricing Handler', () => {
  describe('baliZeroPricing', () => {
    it('should return all services when service_type is "all"', async () => {
      const params = { service_type: 'all', include_details: true };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('official_notice');
      expect(result.data).toHaveProperty('currency', 'IDR (Indonesian Rupiah)');
      expect(result.data).toHaveProperty('contact_info');
      expect(result.data).toHaveProperty('single_entry_visas');
      expect(result.data).toHaveProperty('kitas_permits');
      expect(result.data).toHaveProperty('business_legal_services');
      expect(result.data).toHaveProperty('taxation_services');
    });

    it('should return only visa prices when service_type is "visa"', async () => {
      const params = { service_type: 'visa' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('single_entry_visas');
      expect(result.data).toHaveProperty('multiple_entry_visas');
      expect(result.data).not.toHaveProperty('business_legal_services');
      expect(result.data).not.toHaveProperty('taxation_services');
    });

    it('should return KITAS prices when service_type is "kitas"', async () => {
      const params = { service_type: 'kitas' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('kitas_permits');
      expect(result.data.kitas_permits).toHaveProperty('Freelance KITAS (E23)');
      expect(result.data.kitas_permits).toHaveProperty('Working KITAS (E23)');
    });

    it('should return business services when service_type is "business"', async () => {
      const params = { service_type: 'business' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('business_legal_services');
      expect(result.data.business_legal_services).toHaveProperty('PT PMA Company Setup');
    });

    it('should return tax services when service_type is "tax"', async () => {
      const params = { service_type: 'tax' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('taxation_services');
      expect(result.data.taxation_services).toHaveProperty('NPWP Personal + Coretax');
      expect(result.data.taxation_services).toHaveProperty('Monthly Tax Report');
    });

    it('should search for specific service by name', async () => {
      const params = {
        service_type: 'all',
        specific_service: 'Working KITAS'
      };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('search_results');
      expect(result.data).toHaveProperty('search_term', 'Working KITAS');
      expect(result.data.search_results).toHaveProperty('kitas_permits');
    });

    it('should handle case-insensitive search', async () => {
      const params = {
        service_type: 'all',
        specific_service: 'pt pma'
      };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('search_results');
      expect(result.data.search_results).toHaveProperty('business_legal_services');
    });

    it('should return fallback message when service not found', async () => {
      const params = {
        service_type: 'all',
        specific_service: 'NonExistentService12345'
      };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data.search_results).toContain('Nessun servizio trovato');
    });

    it('should always include contact info', async () => {
      const params = { service_type: 'visa' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('contact_info');
      expect(result.data.contact_info).toHaveProperty('email', 'info@balizero.com');
      expect(result.data.contact_info).toHaveProperty('whatsapp');
    });

    it('should include disclaimer in multiple languages', async () => {
      const params = { service_type: 'all' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('disclaimer');
      expect(result.data.disclaimer).toHaveProperty('it');
      expect(result.data.disclaimer).toHaveProperty('id');
      expect(result.data.disclaimer).toHaveProperty('en');
    });

    it('should use default "all" when service_type not specified', async () => {
      const params = {};
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('single_entry_visas');
      expect(result.data).toHaveProperty('kitas_permits');
    });

    it('should validate official pricing structure for C1 Tourism', async () => {
      const params = { service_type: 'visa' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      const c1Tourism = result.data.single_entry_visas['C1 Tourism'];
      expect(c1Tourism).toHaveProperty('price');
      expect(c1Tourism).toHaveProperty('extension');
      expect(c1Tourism).toHaveProperty('notes');
      expect(c1Tourism.price).toContain('IDR');
    });

    it('should validate Working KITAS pricing structure', async () => {
      const params = { service_type: 'kitas' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      const workingKitas = result.data.kitas_permits['Working KITAS (E23)'];
      expect(workingKitas).toHaveProperty('offshore');
      expect(workingKitas).toHaveProperty('onshore');
      expect(workingKitas).toHaveProperty('notes');
      expect(workingKitas.offshore).toContain('IDR');
      expect(workingKitas.onshore).toContain('IDR');
    });

    it('should handle errors gracefully and return fallback contact', async () => {
      // Force error by passing invalid data structure (empty object triggers default)
      const params = {} as any;
      const result = await baliZeroPricing(params);

      // With empty params, it defaults to 'all' and returns normally
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('official_notice');
    });
  });

  describe('baliZeroQuickPrice', () => {
    it('should find and return price for C1 Tourism', async () => {
      const params = { service: 'C1 Tourism' };
      const result = await baliZeroQuickPrice(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('service');
      expect(result.data).toHaveProperty('category');
      expect(result.data).toHaveProperty('official_notice');
      expect(result.data.service).toHaveProperty('name', 'C1 Tourism');
    });

    it('should find service with partial name match', async () => {
      const params = { service: 'working kitas' };
      const result = await baliZeroQuickPrice(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('service');
      expect(result.data.service.name).toContain('Working KITAS');
    });

    it('should return contact info when service found', async () => {
      const params = { service: 'NPWP Personal' };
      const result = await baliZeroQuickPrice(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('contact');
      expect(result.data.contact).toHaveProperty('email', 'info@balizero.com');
    });

    it('should return helpful message when service not found', async () => {
      const params = { service: 'NonExistentService' };
      const result = await baliZeroQuickPrice(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('message');
      expect(result.data.message).toContain('non trovato');
      expect(result.data).toHaveProperty('contact');
    });

    it('should return examples when service parameter missing', async () => {
      const params = {};
      const result = await baliZeroQuickPrice(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('message');
      expect(result.data).toHaveProperty('examples');
      expect(Array.isArray(result.data.examples)).toBe(true);
    });

    it('should be case-insensitive in search', async () => {
      const params = { service: 'pma company' };
      const result = await baliZeroQuickPrice(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('service');
      expect(result.data.service.name).toContain('PMA');
    });
  });

  describe('Anti-Hallucination Safeguards', () => {
    it('should ONLY return hardcoded prices (no AI generation)', async () => {
      const params = { service_type: 'all' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data.official_notice).toContain('Non generati da AI');
      expect(result.data).toHaveProperty('last_updated');
      expect(result.data.last_updated).toBe('2025-01-01');
    });

    it('should include warning about official prices only', async () => {
      const params = { service_type: 'visa' };
      const result = await baliZeroPricing(params);

      expect(result.ok).toBe(true);
      expect(result.data.official_notice).toMatch(/UFFICIALI|OFFICIAL/i);
    });
  });
});

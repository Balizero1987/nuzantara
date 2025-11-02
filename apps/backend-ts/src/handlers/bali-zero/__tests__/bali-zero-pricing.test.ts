import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Bali Zero Pricing', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../bali-zero-pricing.js');
  });

  describe('baliZeroPricing', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.baliZeroPricing({
        service_type: 'visa',
        include_details: true
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.single_entry_visas).toBeDefined();
    });

    it('should handle missing required params (all optional)', async () => {
      const result = await handlers.baliZeroPricing({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle invalid params gracefully', async () => {
      const result = await handlers.baliZeroPricing({
        service_type: 'invalid-service'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });
  });

  describe('baliZeroQuickPrice', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.baliZeroQuickPrice({
        service: 'C1 Tourism'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle missing required params (all optional)', async () => {
      const result = await handlers.baliZeroQuickPrice({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle invalid params gracefully', async () => {
      const result = await handlers.baliZeroQuickPrice({
        service: 'NonExistentService'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });
  });

});

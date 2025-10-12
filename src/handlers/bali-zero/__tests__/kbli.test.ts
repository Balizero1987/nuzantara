/**
 * Tests for KBLI Business Code Handler
 * Tests Indonesian business classification lookup and requirements
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { kbliLookup, kbliRequirements } from '../kbli.ts';
import { createMockRequest, createMockResponse } from '../../../../tests/helpers/mocks.ts';

describe('KBLI Handler', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
  });

  describe('kbliLookup', () => {
    it('should lookup KBLI code by direct code', async () => {
      mockReq.body.params = { code: '56101' };
      await kbliLookup(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            found: true,
            kbli: expect.objectContaining({
              code: '56101',
              name: 'Restoran',
              nameEn: 'Restaurant',
            }),
          }),
        })
      );
    });

    it('should return not found for invalid code', async () => {
      mockReq.body.params = { code: '99999' };
      await kbliLookup(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            found: false,
          }),
        })
      );
    });

    it('should search KBLI by query term', async () => {
      mockReq.body.params = { query: 'restaurant' };
      await kbliLookup(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            query: 'restaurant',
            results: expect.any(Array),
            count: expect.any(Number),
          }),
        })
      );

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.results.length).toBeGreaterThan(0);
      expect(response.data.results[0]).toHaveProperty('code');
      expect(response.data.results[0]).toHaveProperty('name');
    });

    it('should return category listing when category specified', async () => {
      mockReq.body.params = { category: 'restaurants' };
      await kbliLookup(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            category: 'restaurants',
            codes: expect.any(Array),
          }),
        })
      );

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.codes.length).toBeGreaterThan(0);
    });

    it('should return all categories when no params provided', async () => {
      mockReq.body.params = {};
      await kbliLookup(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            categories: expect.any(Array),
            totalCodes: expect.any(Number),
            message: expect.any(String),
          }),
        })
      );
    });

    it('should find hotel codes', async () => {
      mockReq.body.params = { query: 'hotel' };
      await kbliLookup(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.results.length).toBeGreaterThan(0);

      const hotelCode = response.data.results.find(
        (r: any) => r.code === '55111' || r.nameEn.includes('Hotel')
      );
      expect(hotelCode).toBeDefined();
    });

    it('should find e-commerce code', async () => {
      mockReq.body.params = { code: '47911' };
      await kbliLookup(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            found: true,
            kbli: expect.objectContaining({
              code: '47911',
              nameEn: 'E-Commerce',
            }),
          }),
        })
      );
    });

    it('should include requirements in KBLI data', async () => {
      mockReq.body.params = { code: '56101' };
      await kbliLookup(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.kbli).toHaveProperty('requirements');
      expect(Array.isArray(response.data.kbli.requirements)).toBe(true);
      expect(response.data.kbli.requirements.length).toBeGreaterThan(0);
    });

    it('should include minimum capital information', async () => {
      mockReq.body.params = { code: '56101' };
      await kbliLookup(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.kbli).toHaveProperty('minimumCapital');
      expect(response.data.kbli.minimumCapital).toContain('IDR');
    });

    it('should handle special requirements for alcohol license', async () => {
      mockReq.body.params = { code: '56103' }; // Bar & Restaurant
      await kbliLookup(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.kbli).toHaveProperty('special');
      expect(response.data.kbli.special).toContain('alcohol');
    });

    it('should handle errors gracefully', async () => {
      mockReq.body.params = null;
      await kbliLookup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.any(String),
        })
      );
    });
  });

  describe('kbliRequirements', () => {
    it('should return requirements for restaurant business type', async () => {
      mockReq.body.params = { businessType: 'restaurant' };
      await kbliRequirements(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            businessType: 'restaurant',
            options: expect.any(Array),
            totalOptions: expect.any(Number),
            baliZeroServices: expect.any(Object),
          }),
        })
      );

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.options.length).toBeGreaterThan(0);
      expect(response.data.options[0]).toHaveProperty('code');
      expect(response.data.options[0]).toHaveProperty('name');
      expect(response.data.options[0]).toHaveProperty('requirements');
    });

    it('should return requirements for hotel business', async () => {
      mockReq.body.params = { businessType: 'hotel' };
      await kbliRequirements(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.options.length).toBeGreaterThan(0);

      const starHotel = response.data.options.find(
        (o: any) => o.code === '55111'
      );
      expect(starHotel).toBeDefined();
      expect(starHotel.requirements).toContain('SIUP');
    });

    it('should include Bali Zero services information', async () => {
      mockReq.body.params = { businessType: 'cafe' };
      await kbliRequirements(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data).toHaveProperty('baliZeroServices');
      expect(response.data.baliZeroServices).toHaveProperty('available', true);
      expect(response.data.baliZeroServices).toHaveProperty('services');
      expect(response.data.baliZeroServices).toHaveProperty('contact');
      expect(response.data.baliZeroServices.contact).toHaveProperty('whatsapp');
      expect(response.data.baliZeroServices.contact).toHaveProperty('email');
    });

    it('should return helpful message when no results found', async () => {
      mockReq.body.params = { businessType: 'NonExistentBusiness' };
      await kbliRequirements(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            found: false,
            message: expect.stringContaining('No KBLI codes found'),
            suggestion: expect.any(String),
          }),
        })
      );
    });

    it('should require businessType parameter', async () => {
      mockReq.body.params = {};
      await kbliRequirements(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.stringContaining('businessType parameter required'),
        })
      );
    });

    it('should handle villa business type', async () => {
      mockReq.body.params = { businessType: 'villa' };
      await kbliRequirements(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.options.length).toBeGreaterThan(0);

      const villa = response.data.options.find((o: any) => o.code === '55130');
      expect(villa).toBeDefined();
      expect(villa.special).toContain('5 rooms');
    });

    it('should return minimumCapital for each option', async () => {
      mockReq.body.params = { businessType: 'restaurant' };
      await kbliRequirements(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.options[0]).toHaveProperty('minimumCapital');
      expect(response.data.options[0].minimumCapital).toContain('IDR');
    });

    it('should handle case-insensitive business type search', async () => {
      mockReq.body.params = { businessType: 'HOTEL' };
      await kbliRequirements(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.options.length).toBeGreaterThan(0);
    });

    it('should find programming/IT services', async () => {
      mockReq.body.params = { businessType: 'programming' };
      await kbliRequirements(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.options.length).toBeGreaterThan(0);

      const programming = response.data.options.find(
        (o: any) => o.code === '62010'
      );
      expect(programming).toBeDefined();
    });

    it('should include special notes when applicable', async () => {
      mockReq.body.params = { businessType: 'bar' };
      await kbliRequirements(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const barWithAlcohol = response.data.options.find(
        (o: any) => o.special && o.special.includes('alcohol')
      );
      expect(barWithAlcohol).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockReq.body.params = null;
      await kbliRequirements(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
        })
      );
    });
  });

  describe('KBLI Data Integrity', () => {
    it('should have consistent structure for all KBLI codes', async () => {
      mockReq.body.params = { category: 'restaurants' };
      await kbliLookup(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      response.data.codes.forEach((code: any) => {
        expect(code).toHaveProperty('code');
        expect(code).toHaveProperty('name');
        expect(code).toHaveProperty('nameEn');
        expect(code).toHaveProperty('description');
        expect(code).toHaveProperty('requirements');
        expect(code).toHaveProperty('minimumCapital');
      });
    });

    it('should include both Indonesian and English names', async () => {
      mockReq.body.params = { code: '56101' };
      await kbliLookup(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.kbli.name).toBe('Restoran');
      expect(response.data.kbli.nameEn).toBe('Restaurant');
    });
  });
});

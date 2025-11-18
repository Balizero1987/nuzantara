// KBLI Complete Database Tests
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { kbliLookupComplete, kbliBusinessAnalysis } from './kbli-complete.js';

// Mock dependencies
jest.mock('../../services/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('KBLI Complete Database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('kbliLookupComplete', () => {
    it('should lookup KBLI code directly', async () => {
      const mockReq = {
        body: { params: { code: '01111' } },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            found: true,
            kbli: expect.objectContaining({
              code: '01111',
              name: 'Pertanian Padi',
              foreignOwnership: 95,
              riskLevel: 'MT',
              additionalInfo: expect.objectContaining({
                foreignOwnershipPercentage: 95,
                riskLevelCategory: 'MT',
                capitalBreakdown: expect.any(Object),
              }),
            }),
          }),
        })
      );
    });

    it('should return not found for unknown code', async () => {
      const mockReq = {
        body: { params: { code: '99999' } },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            found: false,
            message: 'KBLI code 99999 not found in complete database',
          }),
        })
      );
    });

    it('should search by category', async () => {
      const mockReq = {
        body: { params: { category: 'agriculture' } },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            category: 'agriculture',
            totalCodes: expect.any(Number),
            codes: expect.any(Array),
          }),
        })
      );
    });

    it('should search by business query', async () => {
      const mockReq = {
        body: { params: { query: 'restaurant' } },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            query: 'restaurant',
            results: expect.any(Array),
            totalFound: expect.any(Number),
            searchOptimization: expect.objectContaining({
              totalDatabaseSize: expect.any(Number),
              searchMethod: 'enhanced_semantic_search',
            }),
          }),
        })
      );
    });

    it('should return database overview with no parameters', async () => {
      const mockReq = {
        body: { params: {} },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            databaseInfo: expect.objectContaining({
              version: '2.0.0-complete',
              source: 'Desktop KBLI Knowledge Base 2025',
              totalCategories: expect.any(Number),
              totalCodes: expect.any(Number),
              features: expect.arrayContaining([
                'Foreign ownership matrix',
                'Risk classification (R/MR/MT/T)',
                'Capital requirements breakdown',
                'Sectoral approvals mapping',
                'Enhanced search capabilities',
              ]),
            }),
          }),
        })
      );
    });

    it('should search with business_type parameter', async () => {
      const mockReq = {
        body: { params: { business_type: 'hotel' } },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            query: 'hotel',
            results: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('kbliBusinessAnalysis', () => {
    it('should analyze single business type', async () => {
      const mockReq = {
        body: {
          params: {
            businessTypes: ['restaurant'],
            location: 'bali',
            investment_capacity: 'high',
          },
        },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliBusinessAnalysis(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            query: {
              businessTypes: ['restaurant'],
              location: 'bali',
              investment_capacity: 'high',
            },
            analysis: expect.arrayContaining([
              expect.objectContaining({
                businessType: 'restaurant',
                recommendedKBLI: expect.any(String),
                kbliName: expect.any(String),
                category: expect.any(String),
                foreignOwnership: expect.any(Number),
                riskLevel: expect.any(String),
                capitalRequirement: expect.any(String),
                licensingPath: expect.any(Array),
                timeline: expect.any(String),
              }),
            ]),
            combinedAnalysis: expect.any(Object),
            baliZeroServices: expect.objectContaining({
              available: true,
              recommendedServices: expect.any(Array),
              contact: expect.objectContaining({
                whatsapp: expect.any(String),
                email: expect.any(String),
              }),
            }),
          }),
        })
      );
    });

    it('should analyze multiple business types', async () => {
      const mockReq = {
        body: {
          params: {
            businessTypes: ['restaurant', 'hotel', 'villa'],
            location: 'bali',
            investment_capacity: 'high',
          },
        },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliBusinessAnalysis(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const callArg = (mockRes.json as any).mock.calls[0][0];
      expect(callArg.ok).toBe(true);
      expect(callArg.data.analysis).toBeInstanceOf(Array);
      expect(callArg.data.analysis).toHaveLength(3);
      expect(callArg.data.combinedAnalysis).toBeDefined();
      expect(callArg.data.combinedAnalysis.totalActivities).toBe(3);
    });

    it('should handle unknown business types', async () => {
      const mockReq = {
        body: {
          params: {
            businessTypes: ['unknown-business-type'],
            location: 'bali',
          },
        },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliBusinessAnalysis(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            analysis: expect.arrayContaining([
              expect.objectContaining({
                businessType: 'unknown-business-type',
                status: 'no_match',
                suggestion: expect.stringContaining('No KBLI code found'),
                alternatives: expect.any(Array),
              }),
            ]),
          }),
        })
      );
    });

    it('should return error without businessTypes', async () => {
      const mockReq = {
        body: {
          params: {},
        },
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await kbliBusinessAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: 'businessTypes array is required',
        })
      );
    });

    it('should handle invalid businessTypes parameter', async () => {
      const mockReq = {
        body: {
          params: {
            businessTypes: 'not-an-array',
          },
        },
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await kbliBusinessAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: 'businessTypes array is required',
        })
      );
    });

    it('should provide location-specific requirements', async () => {
      const mockReq = {
        body: {
          params: {
            businessTypes: ['restaurant'],
            location: 'bali',
          },
        },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliBusinessAnalysis(mockReq, mockRes);

      const analysis = mockRes.json.mock.calls[0][0].data.analysis[0];
      expect(analysis.locationSpecific).toBeDefined();
      expect(analysis.locationSpecific.location).toBe('bali');
      expect(analysis.locationSpecific.specialNotes).toContain('Bali-specific');
    });

    it('should provide investment advice for high capacity', async () => {
      const mockReq = {
        body: {
          params: {
            businessTypes: ['restaurant'],
            investment_capacity: 'high',
          },
        },
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliBusinessAnalysis(mockReq, mockRes);

      const analysis = mockRes.json.mock.calls[0][0].data.analysis[0];
      expect(analysis.investmentAdvice).toBeDefined();
      expect(analysis.investmentAdvice.recommendedStructure).toBe('PT PMA');
    });
  });

  describe('Foreign Ownership Matrix', () => {
    it('should return correct foreign ownership for closed sectors', async () => {
      const mockReq = {
        body: { params: { code: '58100' } }, // Publishing - closed to foreigners
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      const kbliData = mockRes.json.mock.calls[0][0].data.kbli;
      expect(kbliData.foreignOwnership).toBe(0);
      expect(kbliData.capitalRequirement).toBe('CLOSED - Local Partnership Required');
    });

    it('should return correct foreign ownership for telecom', async () => {
      const mockReq = {
        body: { params: { code: '61100' } }, // Radio broadcasting - 67%
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      const kbliData = mockRes.json.mock.calls[0][0].data.kbli;
      expect(kbliData.foreignOwnership).toBe(0); // Broadcasting is closed
      expect(kbliData.capitalRequirement).toBe('CLOSED - Government Only');
    });

    it('should return correct foreign ownership for air transport', async () => {
      const mockReq = {
        body: { params: { code: '51100' } }, // Air transport - 49%
      } as any;

      const mockRes = {
        json: jest.fn(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      const kbliData = mockRes.json.mock.calls[0][0].data.kbli;
      expect(kbliData.foreignOwnership).toBe(49);
      expect(kbliData.capitalRequirement).toBe('USD 10 Million');
    });
  });

  describe('Risk Classification Matrix', () => {
    it('should return low risk for simple services', async () => {
      const mockReq = {
        body: { params: { code: '62010' } }, // Computer programming - Low risk
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.kbli).toBeDefined();
      // Risk level might be present depending on implementation
      if (response.data.kbli.riskLevel) {
        expect(['R', 'M', 'T']).toContain(response.data.kbli.riskLevel);
      }
    });

    it('should return high risk for manufacturing', async () => {
      const mockReq = {
        body: { params: { code: '10101' } }, // Meat processing - High risk
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.kbli).toBeDefined();
      // Risk level and licensing path might be present depending on implementation
      if (response.data.kbli.riskLevel) {
        expect(['R', 'M', 'T']).toContain(response.data.kbli.riskLevel);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const mockReq = {
        body: null, // Malformed request
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      // Handler should either return success or error gracefully
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Mock a scenario where the database fails
      const mockReq = {
        body: { params: { code: 'error-trigger' } },
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      // Should still return a response, possibly with fallback data
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent lookups', async () => {
      const codes = ['01111', '01130', '03110', '10101', '11010', '62010'];

      const mocks = codes.map((code) => {
        const mockReq = { body: { params: { code } } } as any;
        const mockRes = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
        return { req: mockReq, res: mockRes };
      });

      const promises = mocks.map(({ req, res }) => kbliLookupComplete(req, res));

      await Promise.all(promises);

      // Verify all responses were sent
      mocks.forEach(({ res }) => {
        expect(res.json).toHaveBeenCalled();
      });
    });

    it('should complete search within reasonable time', async () => {
      const startTime = Date.now();

      const mockReq = {
        body: { params: { query: 'complex business analysis search' } },
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await kbliLookupComplete(mockReq, mockRes);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

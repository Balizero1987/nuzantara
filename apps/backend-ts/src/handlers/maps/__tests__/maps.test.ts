import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Maps', () => {
  let handlers: any;

  beforeEach(async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
    jest.clearAllMocks();
    handlers = await import('../maps.js');
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('mapsDirections', () => {
    it('should handle success case with valid params', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'OK',
          routes: [{
            legs: [{
              distance: { text: '10 km', value: 10000 },
              duration: { text: '15 mins', value: 900 },
              start_address: 'Start Location',
              end_address: 'End Location',
              steps: [{
                html_instructions: 'Turn right',
                distance: { text: '1 km', value: 1000 },
                duration: { text: '2 mins', value: 120 }
              }]
            }],
            summary: 'Route summary'
          }]
        })
      } as Response);

      const result = await handlers.mapsDirections({
        origin: 'Jakarta',
        destination: 'Bandung',
        mode: 'driving'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.route).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.mapsDirections({})).rejects.toThrow(BadRequestError);
      await expect(handlers.mapsDirections({})).rejects.toThrow('Both origin and destination are required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.mapsDirections({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('mapsPlaces', () => {
    it('should handle success case with valid params', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'OK',
          results: [{
            name: 'Test Place',
            place_id: 'place-123',
            formatted_address: 'Test Address',
            geometry: {
              location: { lat: -6.2, lng: 106.8 }
            },
            rating: 4.5,
            price_level: 2,
            types: ['restaurant'],
            opening_hours: { open_now: true },
            photos: [{ photo_reference: 'ref', width: 100, height: 100 }]
          }]
        })
      } as Response);

      const result = await handlers.mapsPlaces({
        query: 'restaurants in Jakarta',
        location: '-6.2,106.8',
        radius: 5000
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.places).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.mapsPlaces({})).rejects.toThrow();
    });
  });

  describe('mapsPlaceDetails', () => {
    it('should handle success case with valid params', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'OK',
          result: {
            name: 'Test Place',
            place_id: 'place-123',
            formatted_address: 'Test Address',
            formatted_phone_number: '+1234567890',
            website: 'https://example.com',
            rating: 4.5,
            geometry: {
              location: { lat: -6.2, lng: 106.8 }
            },
            opening_hours: {
              open_now: true,
              weekday_text: ['Monday: 9:00 AM – 5:00 PM']
            }
          }
        })
      } as Response);

      const result = await handlers.mapsPlaceDetails({
        placeId: 'place-123'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.place).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.mapsPlaceDetails({})).rejects.toThrow(BadRequestError);
      await expect(handlers.mapsPlaceDetails({})).rejects.toThrow('placeId is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.mapsPlaceDetails({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

});

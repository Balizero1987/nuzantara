import { mapsDirections, mapsPlaces, mapsPlaceDetails } from '../../src/handlers/maps/maps.js';

describe('Maps handler typed shapes', () => {
  const originalFetch = global.fetch;
  beforeAll(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-key';
    // @ts-expect-error override
    global.fetch = jest.fn();
  });
  afterAll(() => {
    // @ts-expect-error restore
    global.fetch = originalFetch;
  });

  test('maps.directions returns ApiSuccess with route summary', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        routes: [{
          summary: 'Jalan Sunset',
          legs: [{
            distance: { text: '10 km', value: 10000 },
            duration: { text: '20 mins', value: 1200 },
            start_address: 'A', end_address: 'B', steps: []
          }]
        }]
      })
    });
    const res = await mapsDirections({ origin: 'A', destination: 'B' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.route).toHaveProperty('overview');
  });

  test('maps.places returns ApiSuccess with places array', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [
          { name: 'Place1', place_id: 'pid1', geometry: { location: { lat: 0, lng: 0 } }, rating: 4.5, types: [], opening_hours: { open_now: true } }
        ]
      })
    });
    const res = await mapsPlaces({ query: 'coffee' } as any);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.data.places)).toBe(true);
  });

  test('maps.placeDetails returns ApiSuccess with place object', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        result: {
          name: 'Coffee Bar',
          place_id: 'pid1',
          formatted_address: 'Street 1',
          geometry: { location: { lat: 0, lng: 0 } },
          rating: 4.2,
          opening_hours: { open_now: false, weekday_text: [] }
        }
      })
    });
    const res = await mapsPlaceDetails({ placeId: 'pid1' } as any);
    expect(res.ok).toBe(true);
    expect(res.data.place).toHaveProperty('placeId', 'pid1');
  });
});


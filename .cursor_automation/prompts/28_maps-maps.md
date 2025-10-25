# Test Generation: maps/maps.ts

## Priority: 28

## File to Test
`src/handlers/maps/maps.ts`

## Cursor Prompt

```
Generate Jest test suite for Maps handler.

Context:
- File: src/handlers/maps/maps.ts
- Google Maps integration
- Location services

Task:
Create: src/handlers/maps/__tests__/maps.test.ts

Mock Strategy:
```typescript
jest.mock('@googlemaps/google-maps-services-js', () => ({
  Client: jest.fn(() => ({
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
    directions: jest.fn(),
    placesNearby: jest.fn()
  }))
}));
```

For EACH function:
1. Geocode address:
   - ✓ Success
   - ✓ Invalid address
   - ✓ Multiple results
   - ✓ No results

2. Reverse geocode:
   - ✓ Valid coordinates
   - ✓ Invalid coordinates
   - ✓ Ocean location

3. Get directions:
   - ✓ Success
   - ✓ No route found
   - ✓ Invalid origin/destination

4. Places nearby:
   - ✓ Success with results
   - ✓ No places
   - ✓ Filtered by type

Import: await import('../maps.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- maps.test
```

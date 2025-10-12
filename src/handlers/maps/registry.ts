/**
 * Maps Module Registry
 * Google Maps integration
 */

import { globalRegistry } from '../../core/handler-registry.ts';
import { mapsDirections, mapsPlaces, mapsPlaceDetails } from './maps.ts';

export function registerMapsHandlers() {
  // Maps handlers
  globalRegistry.registerModule('maps', {
    'directions': mapsDirections,
    'places': mapsPlaces,
    'place.details': mapsPlaceDetails
  }, { requiresAuth: true, description: 'Google Maps API' });

  console.log('✅ Maps handlers registered');
}

registerMapsHandlers();

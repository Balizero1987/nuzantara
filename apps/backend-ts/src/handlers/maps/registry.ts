/**
 * Maps Module Registry
 * Google Maps integration
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { mapsDirections, mapsPlaces, mapsPlaceDetails } from './maps.js';

export function registerMapsHandlers() {
  // Maps handlers
  globalRegistry.registerModule('maps', {
    'directions': mapsDirections,
    'places': mapsPlaces,
    'place.details': mapsPlaceDetails
  }, { requiresAuth: true, description: 'Google Maps API' });

  logger.info('✅ Maps handlers registered');
}

registerMapsHandlers();

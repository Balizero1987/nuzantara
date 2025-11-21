/**
 * Intel Module Registry
 * News intelligence and web scraping
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { intelNewsSearch, intelNewsGetCritical, intelNewsGetTrends } from './news-search.js';
import { intelScraperRun, intelScraperStatus, intelScraperCategories } from './scraper.js';

export function registerIntelHandlers() {
  // News search handlers
  globalRegistry.registerModule(
    'intel',
    {
      'news.search': intelNewsSearch as any,
      'news.critical': intelNewsGetCritical as any,
      'news.trends': intelNewsGetTrends as any,
    } as any,
    {
      requiresAuth: false, // Public access to news
      description: 'Intelligence news search from Bali',
    }
  );

  // Web scraper handlers
  globalRegistry.registerModule(
    'intel',
    {
      'scraper.run': intelScraperRun as any,
      'scraper.status': intelScraperStatus as any,
      'scraper.categories': intelScraperCategories as any,
    } as any,
    {
      requiresAuth: true, // Scraping requires auth
      description: 'Web scraping and intelligence gathering',
    }
  );

  logger.info('✅ Intel handlers registered');
}

registerIntelHandlers();

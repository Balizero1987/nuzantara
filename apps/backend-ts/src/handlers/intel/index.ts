/**
 * Intel Handlers
 * Business intelligence scraping & search for Bali/Indonesia news
 */

// News search handlers (query ChromaDB)
export {
  intelNewsSearch,
  intelNewsGetCritical,
  intelNewsGetTrends
} from './news-search.js';

// Legacy scraper handlers (trigger Python scraping - backward compatibility)
export {
  intelScraperRun,
  intelScraperStatus,
  intelScraperCategories
} from './scraper.js';

// Unified scraper handlers (new REST API)
export {
  scraperRun,
  scraperStatus,
  scraperList,
  scraperJobs,
  scraperHealth,
  waitForJobCompletion,
  runPropertyScraper,
  runImmigrationScraper,
  runTaxScraper,
  runNewsScraper,
  type ScraperType,
  type ScraperRunParams,
  type ScraperStatus as UnifiedScraperStatus,
  type ScraperInfo,
  type ScraperListResponse,
  type JobsListResponse
} from './scraper-unified.js';

/**
 * Intel Handlers
 * Business intelligence scraping & search for Bali/Indonesia news
 */

// News search handlers (query ChromaDB)
export { intelNewsSearch, intelNewsGetCritical, intelNewsGetTrends } from './news-search.js';

// Scraper handlers (trigger Python scraping)
export { intelScraperRun, intelScraperStatus, intelScraperCategories } from './scraper.js';

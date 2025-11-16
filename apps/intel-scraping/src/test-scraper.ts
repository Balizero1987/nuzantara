import { BaliZeroScraper } from './scraper/core';

async function testScraper() {
  const scraper = new BaliZeroScraper({
    headless: false, // Show browser for testing
    maxConcurrent: 1,
    screenshotOnError: true
  });

  try {
    await scraper.initialize();

    // Test with a known good source
    // Replace 'test-source-id' with an actual source ID from your database
    const result = await scraper.scrapeSource('test-source-id');

    console.log('Test Result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await scraper.close();
  }
}

testScraper();


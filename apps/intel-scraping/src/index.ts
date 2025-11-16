import * as dotenv from 'dotenv';
import { ScraperOrchestrator } from './scraper/orchestrator';

dotenv.config();

async function main() {
  console.log('🚀 Bali Zero Journal Scraper Starting...');

  const orchestrator = new ScraperOrchestrator();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n📛 Shutting down gracefully...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n📛 SIGTERM received, shutting down...');
    await orchestrator.stop();
    process.exit(0);
  });

  // Start scraping
  await orchestrator.start();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


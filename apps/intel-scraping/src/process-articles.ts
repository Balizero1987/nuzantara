import * as dotenv from 'dotenv';
import { AIPipeline } from './ai/pipeline';

dotenv.config();

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  const pipeline = new AIPipeline({
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    maxArticlesPerSynthesis: 5,
    minQualityScore: 7,
    translateIndonesian: true,
    generateImages: false // Will be added in next patch
  });

  try {
    // Process specific category
    if (process.argv[2]) {
      await pipeline.processCategory(process.argv[2]);
    } else {
      // Process all categories
      await pipeline.processAllCategories();
    }

    console.log('\n✅ AI Pipeline completed successfully!');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  } finally {
    await pipeline.close();
  }
}

main();


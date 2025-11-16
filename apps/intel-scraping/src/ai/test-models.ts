import * as dotenv from 'dotenv';
import { OpenRouterClient, AI_MODELS } from './openrouter-client';

dotenv.config();

async function testModels() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  const client = new OpenRouterClient(process.env.OPENROUTER_API_KEY);

  const testPrompt = "What are the key requirements for a B211A visa in Indonesia? Answer in 2 sentences.";

  console.log('🧪 Testing AI Models...\n');

  for (const model of Object.values(AI_MODELS)) {
    try {
      console.log(`Testing ${model.name}...`);
      const start = Date.now();

      const result = await client.complete(testPrompt, model, {
        temperature: 0.5,
        maxTokens: 100
      });

      const duration = Date.now() - start;

      console.log(`✅ ${model.name}:`);
      console.log(`   Response: ${result.content.substring(0, 100)}...`);
      console.log(`   Cost: $${result.cost.toFixed(6)}`);
      console.log(`   Time: ${duration}ms\n`);

    } catch (error: any) {
      console.log(`❌ ${model.name} failed: ${error.message}\n`);
    }
  }

  const stats = client.getUsageStats();
  console.log('📊 Total Test Cost:', `$${stats.totalCost}`);
}

testModels().catch(console.error);


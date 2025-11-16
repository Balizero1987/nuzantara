// src/app.ts
import * as dotenv from 'dotenv';
import { PublicationAPI } from './api/server';
import { CronScheduler } from './cron/scheduler';
import { createApiKeysTable, generateApiKey } from './api/auth';

dotenv.config();

async function main() {
  console.log('🚀 Starting Bali Zero Journal System...\n');

  // Initialize database
  await createApiKeysTable();

  // Generate initial API key if needed
  if (process.env.GENERATE_API_KEY === 'true') {
    const apiKey = await generateApiKey('admin', ['read', 'write', 'admin']);
    console.log(`🔑 Admin API Key: ${apiKey}`);
    console.log('Save this key securely!\n');
  }

  // Start API server
  const api = new PublicationAPI(Number(process.env.PORT) || 3000);
  await api.start();

  // Start cron scheduler
  const scheduler = new CronScheduler();
  scheduler.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n📛 Shutting down gracefully...');
    scheduler.stop();
    await api.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n📛 Shutting down gracefully...');
    scheduler.stop();
    await api.close();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


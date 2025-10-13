#!/usr/bin/env ts-node
/**
 * Test Handler Registry
 *
 * Verifies that all handlers are correctly registered
 */

import logger from 'services/logger.js';
import { loadAllHandlers } from './core/load-all-handlers.js';
import { globalRegistry } from './core/handler-registry.js';

async function testRegistry() {
  logger.info('🧪 Testing Handler Registry...\n');

  try {
    // Load all handlers
    const stats = await loadAllHandlers();

    logger.info('\n📊 Registry Statistics:');
    logger.info('═'.repeat(50));
    logger.info(`Total Handlers: ${stats.totalHandlers}`);
    logger.info(`\nHandlers by Module:`);
    for (const [module, count] of Object.entries(stats.modules)) {
      logger.info(`  • ${module}: ${count} handlers`);
    }

    // Test specific handlers
    logger.info('\n🔍 Testing Specific Handlers:');
    logger.info('═'.repeat(50));

    const testsToRun = [
      'google-workspace.drive.upload',
      'google-workspace.gmail.send',
      'ai-services.chat',
      'bali-zero.kbli.lookup',
      'bali-zero.pricing.get'
    ];

    for (const key of testsToRun) {
      const exists = globalRegistry.has(key);
      const status = exists ? '✅' : '❌';
      logger.info(`  ${status} ${key}`);
    }

    // List all handlers
    logger.info('\n📋 All Registered Handlers:');
    logger.info('═'.repeat(50));
    const allHandlers = globalRegistry.list();

    // Group by module
    const byModule: Record<string, string[]> = {};
    for (const handler of allHandlers) {
      const module = handler.split('.')[0] || 'unknown';
      if (!byModule[module]) byModule[module] = [];
      byModule[module].push(handler);
    }

    for (const [module, handlers] of Object.entries(byModule)) {
      logger.info(`\n${module.toUpperCase()}:`);
      handlers.forEach(h => logger.info(`  • ${h}`));
    }

    // Test execution (dry run)
    logger.info('\n🚀 Testing Handler Execution (Dry Run):');
    logger.info('═'.repeat(50));

    try {
      const testResult = await globalRegistry.execute('bali-zero.kbli.lookup', {
        code: '62010'
      });
      logger.info('  ✅ Handler execution successful');
      logger.info('  Result:', JSON.stringify(testResult, null, 2).slice(0, 200) + '...');
    } catch (error: any) {
      logger.info('  ⚠️  Handler execution test:', error.message);
    }

    logger.info('\n✅ Registry Test Complete!');
    process.exit(0);

  } catch (error: any) {
    logger.error('\n❌ Registry Test Failed:');
    logger.error(error);
    process.exit(1);
  }
}

// Run tests
testRegistry();

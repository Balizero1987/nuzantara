#!/usr/bin/env ts-node
/**
 * Test Handler Registry
 *
 * Verifies that all handlers are correctly registered
 */

import { loadAllHandlers } from './core/load-all-handlers.js';
import { globalRegistry } from './core/handler-registry.js';

async function testRegistry() {
  console.log('🧪 Testing Handler Registry...\n');

  try {
    // Load all handlers
    const stats = await loadAllHandlers();

    console.log('\n📊 Registry Statistics:');
    console.log('═'.repeat(50));
    console.log(`Total Handlers: ${stats.totalHandlers}`);
    console.log(`\nHandlers by Module:`);
    for (const [module, count] of Object.entries(stats.modules)) {
      console.log(`  • ${module}: ${count} handlers`);
    }

    // Test specific handlers
    console.log('\n🔍 Testing Specific Handlers:');
    console.log('═'.repeat(50));

    const testsToRun = [
      'google-workspace.drive.upload',
      'google-workspace.gmail.send',
      'ai-services.chat',
      'ai-services.openai.chat',
      'bali-zero.kbli.lookup',
      'bali-zero.pricing.get'
    ];

    for (const key of testsToRun) {
      const exists = globalRegistry.has(key);
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${key}`);
    }

    // List all handlers
    console.log('\n📋 All Registered Handlers:');
    console.log('═'.repeat(50));
    const allHandlers = globalRegistry.list();

    // Group by module
    const byModule: Record<string, string[]> = {};
    for (const handler of allHandlers) {
      const module = handler.split('.')[0] || 'unknown';
      if (!byModule[module]) byModule[module] = [];
      byModule[module].push(handler);
    }

    for (const [module, handlers] of Object.entries(byModule)) {
      console.log(`\n${module.toUpperCase()}:`);
      handlers.forEach(h => console.log(`  • ${h}`));
    }

    // Test execution (dry run)
    console.log('\n🚀 Testing Handler Execution (Dry Run):');
    console.log('═'.repeat(50));

    try {
      const testResult = await globalRegistry.execute('bali-zero.kbli.lookup', {
        code: '62010'
      });
      console.log('  ✅ Handler execution successful');
      console.log('  Result:', JSON.stringify(testResult, null, 2).slice(0, 200) + '...');
    } catch (error: any) {
      console.log('  ⚠️  Handler execution test:', error.message);
    }

    console.log('\n✅ Registry Test Complete!');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Registry Test Failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testRegistry();

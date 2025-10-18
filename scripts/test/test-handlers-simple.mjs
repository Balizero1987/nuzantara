#!/usr/bin/env node
/**
 * Simple Handler Registry Test (No TypeScript compilation needed)
 * Tests that all 136 handlers can be loaded
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🧪 Testing Handler Registry Loading...\n');

async function testHandlerLoading() {
  try {
    // Load the compiled handler registry
    const { globalRegistry } = await import('./dist/core/handler-registry.js');
    const { loadAllHandlers } = await import('./dist/core/load-all-handlers.js');

    console.log('📦 Loading all handler modules...');
    const stats = await loadAllHandlers();

    console.log('\n✅ Handler Loading Complete!\n');
    console.log('📊 Statistics:');
    console.log(`   Total handlers: ${stats.totalHandlers}`);
    console.log(`   Total modules: ${Object.keys(stats.modules).length}\n`);

    console.log('📦 Module Breakdown:');
    for (const [module, count] of Object.entries(stats.modules)) {
      console.log(`   ${module.padEnd(20)} ${count} handlers`);
    }

    // Test if we can get all handlers as a map
    const handlersMap = globalRegistry.toHandlersMap();
    console.log(`\n✅ Handler map generated: ${Object.keys(handlersMap).length} handlers`);

    // List first 10 handler keys
    console.log('\n📝 Sample handlers (first 10):');
    Object.keys(handlersMap).slice(0, 10).forEach((key, i) => {
      console.log(`   ${i + 1}. ${key}`);
    });

    // Success check
    if (stats.totalHandlers >= 136) {
      console.log(`\n🎉 SUCCESS: All ${stats.totalHandlers} handlers loaded!`);
      process.exit(0);
    } else {
      console.log(`\n⚠️  WARNING: Only ${stats.totalHandlers}/136 handlers loaded`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Handler loading failed:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

testHandlerLoading();

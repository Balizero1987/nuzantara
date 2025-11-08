#!/usr/bin/env ts-node
/**
 * Plugin Documentation Generator - TypeScript
 *
 * Auto-generates comprehensive documentation for all TypeScript plugins.
 *
 * Usage:
 *     ts-node scripts/plugins/generate_docs.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { registry, PluginCategory } from '../../apps/backend-ts/src/core/plugins';

interface PluginsByCategory {
  [key: string]: any[];
}

async function generateAllDocumentation() {
  console.log('🔧 Plugin Documentation Generator (TypeScript)');
  console.log('='.repeat(60));

  const stats = registry.getStatistics();
  console.log(`\n📊 Found ${stats.totalPlugins} plugins across ${stats.categories} categories`);

  // Create docs directory
  const docsDir = join(process.cwd(), 'docs', 'plugins');
  mkdirSync(docsDir, { recursive: true });

  // Generate documentation
  generateIndex(docsDir);
  generatePluginPages(docsDir);

  console.log(`\n✅ Documentation generated in ${docsDir}`);
  console.log(`   - README.md (index)`);
  console.log(`   - ${stats.totalPlugins} plugin pages`);
}

function generateIndex(docsDir: string) {
  console.log('\n📝 Generating README.md...');

  const plugins = registry.listPlugins();
  const pluginsByCategory: PluginsByCategory = {};

  // Group by category
  for (const plugin of plugins) {
    const category = plugin.category;
    if (!pluginsByCategory[category]) {
      pluginsByCategory[category] = [];
    }
    pluginsByCategory[category].push(plugin);
  }

  let content = '# ZANTARA Plugin Catalog (TypeScript)\n\n';
  content += 'Comprehensive documentation for all ZANTARA TypeScript plugins.\n\n';

  // Statistics
  const stats = registry.getStatistics();
  content += '## Statistics\n\n';
  content += `- **Total Plugins:** ${stats.totalPlugins}\n`;
  content += `- **Categories:** ${stats.categories}\n`;
  content += '\n';

  // Categories
  content += '## Categories\n\n';
  for (const category in pluginsByCategory) {
    const categoryPlugins = pluginsByCategory[category];
    const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    content += `- [${categoryName}](#${category}) (${categoryPlugins.length} plugins)\n`;
  }

  content += '\n---\n\n';

  // Plugins by category
  for (const category in pluginsByCategory) {
    const categoryPlugins = pluginsByCategory[category];
    const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    content += `## ${categoryName}\n\n`;
    content += `**${categoryPlugins.length} plugins**\n\n`;

    for (const metadata of categoryPlugins.sort((a, b) => a.name.localeCompare(b.name))) {
      content += `### [${metadata.name}](${metadata.name.replace(/\./g, '_')}.md)\n\n`;
      content += `${metadata.description}\n\n`;
      content += `- **Version:** ${metadata.version}\n`;
      content += `- **Tags:** ${metadata.tags.join(', ')}\n`;
      content += `- **Auth Required:** ${metadata.requiresAuth ? 'Yes' : 'No'}\n`;
      content += `- **Rate Limit:** ${metadata.rateLimit || 'None'}\n`;
      content += '\n';
    }

    content += '\n';
  }

  writeFileSync(join(docsDir, 'README_TS.md'), content);
  console.log('   ✓ README_TS.md created');
}

function generatePluginPages(docsDir: string) {
  console.log('\n📝 Generating plugin pages...');

  const pluginNames = registry.getAllPluginNames();
  let count = 0;

  for (const pluginName of pluginNames) {
    const plugin = registry.get(pluginName);
    if (!plugin) continue;

    generateSinglePluginPage(plugin, docsDir);
    count++;
  }

  console.log(`   ✓ Created ${count} plugin pages`);
}

function generateSinglePluginPage(plugin: any, docsDir: string) {
  const metadata = plugin.metadata;
  const filename = `${metadata.name.replace(/\./g, '_')}_ts.md`;

  let content = `# ${metadata.name} (TypeScript)\n\n`;
  content += `> ${metadata.description}\n\n`;

  // Metadata table
  content += '## Metadata\n\n';
  content += '| Property | Value |\n';
  content += '|----------|-------|\n';
  content += `| **Name** | \`${metadata.name}\` |\n`;
  content += `| **Version** | ${metadata.version} |\n`;
  content += `| **Category** | ${metadata.category} |\n`;
  content += `| **Auth Required** | ${metadata.requiresAuth ? '✓ Yes' : '✗ No'} |\n`;
  content += `| **Admin Only** | ${metadata.requiresAdmin ? '✓ Yes' : '✗ No'} |\n`;
  content += `| **Estimated Time** | ${metadata.estimatedTime}s |\n`;
  content += `| **Rate Limit** | ${metadata.rateLimit || 'None'} calls/min |\n`;
  content += '\n';

  // Tags
  if (metadata.tags.length > 0) {
    content += `**Tags:** ${metadata.tags.map((t: string) => `\`${t}\``).join(', ')}\n\n`;
  }

  // Usage
  content += '## Usage\n\n';
  content += '### TypeScript\n\n';
  content += '```typescript\n';
  content += `import { executor } from '../core/plugins';\n\n`;
  content += `const result = await executor.execute(\n`;
  content += `  '${metadata.name}',\n`;
  content += `  {\n`;
  content += `    // Your input data here\n`;
  content += `  }\n`;
  content += `);\n`;
  content += '```\n\n';

  content += '### REST API\n\n';
  content += '```bash\n';
  content += `curl -X POST https://api.zantara.com/api/plugins/${metadata.name}/execute \\\\\n`;
  content += `  -H 'Content-Type: application/json' \\\\\n`;
  content += `  -d '{\n`;
  content += `    "input_data": {\n`;
  content += `      // Your input data\n`;
  content += `    }\n`;
  content += `  }'\n`;
  content += '```\n\n';

  // Legacy handler key
  if (metadata.legacyHandlerKey) {
    content += '## Backward Compatibility\n\n';
    content += `This plugin replaces the legacy handler: \`${metadata.legacyHandlerKey}\`\n\n`;
  }

  writeFileSync(join(docsDir, filename), content);
}

// Run if executed directly
if (require.main === module) {
  generateAllDocumentation().catch((error) => {
    console.error('Error generating documentation:', error);
    process.exit(1);
  });
}

export { generateAllDocumentation };

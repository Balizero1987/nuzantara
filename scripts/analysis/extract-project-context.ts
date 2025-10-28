#!/usr/bin/env tsx
/**
 * PROJECT CONTEXT EXTRACTOR
 *
 * Extracts complete project documentation for RAG ingestion:
 * - README files
 * - Architecture docs
 * - Code structure
 * - Package.json metadata
 * - Environment variables
 * - Deployment config
 *
 * Generates comprehensive project knowledge base.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '../..');
const OUTPUT_FILE = join(ROOT, 'docs/PROJECT_CONTEXT.md');

/**
 * Find all documentation files
 */
function findDocs(): Map<string, string> {
  const docs = new Map<string, string>();
  const patterns = [
    /README\.md$/i,
    /ARCHITECTURE/i,
    /HANDOVER/i,
    /GUIDE\.md$/i,
    /CONTEXT\.md$/i,
    /\.claude\/.*\.md$/
  ];

  function scan(dir: string, depth = 0) {
    if (depth > 4) return; // Limit recursion
    if (dir.includes('node_modules')) return;
    if (dir.includes('.git')) return;
    if (dir.includes('dist')) return;

    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath, depth + 1);
        } else if (patterns.some(p => p.test(entry))) {
          const content = readFileSync(fullPath, 'utf-8');
          docs.set(relative(ROOT, fullPath), content);
        }
      }
    } catch (e) {
      // Skip permission errors
    }
  }

  scan(ROOT);
  return docs;
}

/**
 * Extract package.json metadata
 */
function extractPackageInfo(): string {
  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  return `## Package Information

**Name**: ${pkg.name || 'N/A'}
**Version**: ${pkg.version || 'N/A'}
**Description**: ${pkg.description || 'N/A'}

### Dependencies

${Object.keys(pkg.dependencies || {}).length} runtime dependencies:
${Object.entries(pkg.dependencies || {}).slice(0, 20).map(([name, version]) => `- ${name}@${version}`).join('\n')}

### Dev Dependencies

${Object.keys(pkg.devDependencies || {}).length} dev dependencies

### Scripts

${Object.entries(pkg.scripts || {}).map(([name, cmd]) => `- \`${name}\`: ${cmd}`).join('\n')}
`;
}

/**
 * Extract project structure
 */
function extractStructure(): string {
  const structure: string[] = [];

  function scan(dir: string, prefix = '', depth = 0) {
    if (depth > 3) return;
    if (basename(dir).startsWith('.')) return;
    if (dir.includes('node_modules')) return;
    if (dir.includes('dist')) return;

    try {
      const entries = readdirSync(dir).sort();

      for (let i = 0; i < entries.length && i < 20; i++) {
        const entry = entries[i];
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';

        if (stat.isDirectory()) {
          structure.push(`${prefix}${connector}📁 ${entry}/`);
          scan(fullPath, prefix + (isLast ? '    ' : '│   '), depth + 1);
        } else {
          const icon = entry.endsWith('.ts') ? '📘' :
                      entry.endsWith('.js') ? '📗' :
                      entry.endsWith('.md') ? '📄' :
                      entry.endsWith('.json') ? '⚙️' : '📃';
          structure.push(`${prefix}${connector}${icon} ${entry}`);
        }
      }
    } catch (e) {
      // Skip
    }
  }

  scan(join(ROOT, 'src'));
  scan(join(ROOT, 'apps'));
  scan(join(ROOT, 'packages'));

  return `## Project Structure

\`\`\`
${structure.join('\n')}
\`\`\`
`;
}

/**
 * Extract environment variables documentation
 */
function extractEnvVars(): string {
  const configPath = join(ROOT, 'src/config.ts');
  if (!statSync(configPath, { throwIfNoEntry: false })) {
    return '';
  }

  const content = readFileSync(configPath, 'utf-8');

  return `## Environment Variables

Required environment variables (from src/config.ts):

${content.match(/z\.string\(\)\.default\("([^"]+)"\)/g)?.map(m => {
  const [, varName] = m.match(/"([^"]+)"/) || [];
  return `- \`${varName}\``;
}).join('\n') || 'See src/config.ts for details'}

`;
}

/**
 * Generate complete project context
 */
async function main() {
  console.log('🔍 Extracting project context...');

  let md = `# 🌸 ZANTARA Project - Complete Context

> **Auto-generated**: ${new Date().toISOString()}
> **Purpose**: Complete project knowledge for ZANTARA AI

This document provides comprehensive context about the ZANTARA project,
including architecture, code structure, and available capabilities.

---

`;

  // Add package info
  console.log('📦 Extracting package.json...');
  md += extractPackageInfo() + '\n---\n\n';

  // Add structure
  console.log('🏗️ Extracting project structure...');
  md += extractStructure() + '\n---\n\n';

  // Add environment variables
  console.log('⚙️ Extracting environment variables...');
  md += extractEnvVars() + '\n---\n\n';

  // Add all documentation files
  console.log('📚 Finding documentation files...');
  const docs = findDocs();
  console.log(`   Found ${docs.size} documentation files`);

  md += `## Documentation Files

Found ${docs.size} documentation files in the project.

`;

  for (const [path, content] of Array.from(docs.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    md += `### 📄 ${path}\n\n`;
    md += '```markdown\n';
    md += content.slice(0, 10000); // Limit to 10k chars per file
    md += '\n```\n\n';
    md += '---\n\n';
  }

  // Write output
  console.log(`💾 Writing to ${OUTPUT_FILE}...`);
  writeFileSync(OUTPUT_FILE, md, 'utf-8');

  console.log('✅ Done!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Documentation files: ${docs.size}`);
  console.log(`   - Total size: ${Math.round(md.length / 1024)}KB`);
  console.log(`\n📂 Output: ${OUTPUT_FILE}`);
}

main().catch(console.error);

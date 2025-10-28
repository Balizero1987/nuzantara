#!/usr/bin/env tsx
/**
 * HANDLER DOCUMENTATION EXTRACTOR
 *
 * Scans src/handlers/ and router.ts to extract:
 * - All available handlers
 * - Parameters, return types
 * - JSDoc documentation
 * - Usage examples
 *
 * Generates comprehensive Markdown documentation for RAG ingestion.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Handler {
  key: string;
  category: string;
  description: string;
  params: Array<{ name: string; type: string; description: string; required: boolean }>;
  returns: string;
  examples: string[];
  file: string;
  function: string;
}

const ROOT = join(__dirname, '../..');
const HANDLERS_DIR = join(ROOT, 'apps/backend-ts/src/handlers');
const ROUTER_FILE = join(ROOT, 'apps/backend-ts/src/routing/router.ts');
const OUTPUT_FILE = join(ROOT, 'docs/HANDLERS_REFERENCE.md');

/**
 * Extract JSDoc comment from function
 */
function extractJSDoc(content: string, functionName: string): {
  description: string;
  params: Array<{ name: string; type: string; description: string; required: boolean }>;
  returns: string;
  examples: string[];
} {
  const result = {
    description: '',
    params: [] as Array<{ name: string; type: string; description: string; required: boolean }>,
    returns: '',
    examples: [] as string[]
  };

  // Find function and its JSDoc
  const functionRegex = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${functionName}`, 'g');
  const match = functionRegex.exec(content);

  if (!match) return result;

  const jsdocMatch = match[0].match(/\/\*\*([\s\S]*?)\*\//);
  if (!jsdocMatch) return result;

  const jsdoc = jsdocMatch[1];

  // Extract description (first non-tag lines)
  const lines = jsdoc.split('\n').map(l => l.trim().replace(/^\*\s?/, ''));
  let i = 0;
  while (i < lines.length && !lines[i].startsWith('@')) {
    if (lines[i]) result.description += lines[i] + ' ';
    i++;
  }
  result.description = result.description.trim();

  // Extract @param tags
  const paramRegex = /@param\s+(?:\{([^}]+)\}\s+)?(\[)?(\w+)(\])?\s+-?\s*(.*)/g;
  let paramMatch;
  while ((paramMatch = paramRegex.exec(jsdoc)) !== null) {
    result.params.push({
      name: paramMatch[3],
      type: paramMatch[1] || 'any',
      description: paramMatch[5] || '',
      required: !paramMatch[2] // Not optional if no [
    });
  }

  // Extract @returns tag
  const returnsMatch = jsdoc.match(/@returns?\s+(?:\{([^}]+)\}\s+)?(.*)/);
  if (returnsMatch) {
    result.returns = returnsMatch[2] || returnsMatch[1] || 'void';
  }

  // Extract @example tags
  const exampleRegex = /@example\s+([\s\S]*?)(?=@\w+|$)/g;
  let exampleMatch;
  while ((exampleMatch = exampleRegex.exec(jsdoc)) !== null) {
    result.examples.push(exampleMatch[1].trim());
  }

  return result;
}

/**
 * Scan all files in handlers directory
 */
function scanHandlers(): Map<string, string> {
  const handlerFiles = new Map<string, string>();

  function scan(dir: string) {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        const content = readFileSync(fullPath, 'utf-8');
        handlerFiles.set(fullPath, content);
      }
    }
  }

  scan(HANDLERS_DIR);
  return handlerFiles;
}

/**
 * Extract handlers from router.ts
 */
function extractRouterHandlers(): Handler[] {
  const routerContent = readFileSync(ROUTER_FILE, 'utf-8');
  const handlers: Handler[] = [];

  // Extract from handlers object: "key": functionName
  const handlerRegex = /"([^"]+)":\s*(\w+)/g;
  let match;

  while ((match = handlerRegex.exec(routerContent)) !== null) {
    const key = match[1];
    const functionName = match[2];

    // Determine category from key
    const category = key.split('.')[0];

    handlers.push({
      key,
      category,
      description: '',
      params: [],
      returns: '',
      examples: [],
      file: '',
      function: functionName
    });
  }

  return handlers;
}

/**
 * Enrich handlers with documentation from source files
 */
function enrichHandlers(handlers: Handler[], handlerFiles: Map<string, string>): Handler[] {
  for (const handler of handlers) {
    // Find the file containing this function
    for (const [filePath, content] of handlerFiles.entries()) {
      if (content.includes(`function ${handler.function}`) ||
          content.includes(`export const ${handler.function}`) ||
          content.includes(`const ${handler.function} =`)) {

        handler.file = relative(ROOT, filePath);
        const jsdoc = extractJSDoc(content, handler.function);

        handler.description = jsdoc.description;
        handler.params = jsdoc.params;
        handler.returns = jsdoc.returns;
        handler.examples = jsdoc.examples;

        break;
      }
    }

    // Also check router.ts for inline JSDoc
    const routerContent = readFileSync(ROUTER_FILE, 'utf-8');
    const handlerBlockRegex = new RegExp(`\\/\\*\\*[\\s\\S]*?@handler\\s+${handler.key.replace('.', '\\.')}[\\s\\S]*?\\*\\/`, 'g');
    const handlerBlock = handlerBlockRegex.exec(routerContent);

    if (handlerBlock) {
      const block = handlerBlock[0];

      // Extract @description
      const descMatch = block.match(/@description\s+(.*?)(?=@|\*\/)/s);
      if (descMatch && !handler.description) {
        handler.description = descMatch[1].trim().replace(/\s+/g, ' ');
      }

      // Extract @param
      const paramRegex = /@param\s+(?:\{([^}]+)\}\s+)?(\[)?params\.(\w+)(\])?\s+-?\s*(.*?)(?=@param|@returns|@throws|@example|\*\/)/gs;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(block)) !== null) {
        const existing = handler.params.find(p => p.name === paramMatch[3]);
        if (!existing) {
          handler.params.push({
            name: paramMatch[3],
            type: paramMatch[1] || 'any',
            description: paramMatch[5]?.trim().replace(/\s+/g, ' ') || '',
            required: !paramMatch[2]
          });
        }
      }

      // Extract @returns
      const returnsMatch = block.match(/@returns\s+(?:\{([^}]+)\}\s+)?(.*?)(?=@|\*\/)/s);
      if (returnsMatch && !handler.returns) {
        handler.returns = (returnsMatch[2] || returnsMatch[1] || '').trim().replace(/\s+/g, ' ');
      }

      // Extract @example
      const exampleRegex = /@example\s+([\s\S]*?)(?=@\w+|\*\/)/g;
      let exampleMatch;
      while ((exampleMatch = exampleRegex.exec(block)) !== null) {
        const example = exampleMatch[1].trim();
        if (example && !handler.examples.includes(example)) {
          handler.examples.push(example);
        }
      }
    }
  }

  return handlers;
}

/**
 * Generate Markdown documentation
 */
function generateMarkdown(handlers: Handler[]): string {
  const byCategory = new Map<string, Handler[]>();

  for (const handler of handlers) {
    const cat = handler.category || 'other';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push(handler);
  }

  let md = `# 🔧 ZANTARA Handlers Reference

> **Auto-generated**: ${new Date().toISOString()}
> **Total Handlers**: ${handlers.length}
> **Categories**: ${byCategory.size}

This document lists all available handlers in the ZANTARA backend.

## 📋 Quick Index

${Array.from(byCategory.keys()).sort().map(cat => `- [${cat}](#${cat})`).join('\n')}

---

`;

  // Generate documentation by category
  for (const [category, catHandlers] of Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    md += `## ${category}\n\n`;

    for (const handler of catHandlers.sort((a, b) => a.key.localeCompare(b.key))) {
      md += `### \`${handler.key}\`\n\n`;

      if (handler.description) {
        md += `${handler.description}\n\n`;
      }

      if (handler.file) {
        md += `**Source**: \`${handler.file}\`\n\n`;
      }

      if (handler.params.length > 0) {
        md += `**Parameters**:\n\n`;
        for (const param of handler.params) {
          const req = param.required ? '(required)' : '(optional)';
          md += `- \`${param.name}\` \`{${param.type}}\` ${req}`;
          if (param.description) {
            md += ` - ${param.description}`;
          }
          md += '\n';
        }
        md += '\n';
      }

      if (handler.returns) {
        md += `**Returns**: ${handler.returns}\n\n`;
      }

      if (handler.examples.length > 0) {
        md += `**Examples**:\n\n`;
        for (const example of handler.examples) {
          md += '```javascript\n';
          md += example.replace(/^\s+/gm, '');
          md += '\n```\n\n';
        }
      }

      md += '---\n\n';
    }
  }

  // Add usage guide
  md += `## 🚀 Usage Guide

### Making a Handler Call

All handlers are called via the \`/call\` endpoint:

\`\`\`javascript
POST /call
Content-Type: application/json
x-api-key: <your-api-key>

{
  "key": "handler.name",
  "params": {
    // handler-specific parameters
  }
}
\`\`\`

### Response Format

\`\`\`javascript
{
  "ok": true,
  "data": {
    // handler response data
  }
}
\`\`\`

### Error Handling

\`\`\`javascript
{
  "ok": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\`

## 🔐 Authentication

Most handlers require authentication via \`x-api-key\` header.

**Available Keys**:
- Internal: Full access to all handlers
- External: Limited access (no admin/internal operations)

## 📊 Handler Categories

${Array.from(byCategory.entries())
  .sort((a, b) => b[1].length - a[1].length)
  .map(([cat, handlers]) => `- **${cat}**: ${handlers.length} handlers`)
  .join('\n')}

`;

  return md;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning handlers...');
  const handlerFiles = scanHandlers();
  console.log(`   Found ${handlerFiles.size} handler files`);

  console.log('📖 Extracting from router...');
  let handlers = extractRouterHandlers();
  console.log(`   Found ${handlers.length} registered handlers`);

  console.log('📝 Enriching with documentation...');
  handlers = enrichHandlers(handlers, handlerFiles);

  console.log('📄 Generating Markdown...');
  const markdown = generateMarkdown(handlers);

  console.log(`💾 Writing to ${OUTPUT_FILE}...`);
  writeFileSync(OUTPUT_FILE, markdown, 'utf-8');

  console.log('✅ Done!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Total handlers: ${handlers.length}`);
  console.log(`   - With documentation: ${handlers.filter(h => h.description).length}`);
  console.log(`   - With examples: ${handlers.filter(h => h.examples.length > 0).length}`);
  console.log(`\n📂 Output: ${OUTPUT_FILE}`);
}

main().catch(console.error);

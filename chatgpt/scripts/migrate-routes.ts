#!/usr/bin/env tsx
/*
  Migration helper: Scans source files for Express-style routes like app.get('/path', ...)
  and emits a skeleton RouteDefinition list compatible with the unified handler router.

  This is a best-effort regex approach to accelerate migration; review the output.
*/
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

const METHODS = ['get','post','put','patch','delete','options','head','all'] as const;

async function readFileSafe(path: string) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

function extractRoutes(source: string) {
  const results: Array<{ method: string; path: string } & { raw: string; index: number }> = [];
  const methodPattern = METHODS.join('|');
  // eslint-disable-next-line
  const pattern = "\\bapp\\.(" + methodPattern + ")\\s*\\(\\s*['\\\"`]([^'\\\"`]*)['\\\"`]";
  const regex = new RegExp(pattern, 'g');
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source))) {
    const method = (m[1] ?? '').toLowerCase();
    const path = m[2] ?? '';
    results.push({ method, path, raw: m[0], index: m.index });
  }
  return results;
}

function toRouteDef(r: { method: string; path: string }) {
  return `{
    method: '${r.method}',
    path: '${r.path}',
    name: '${r.method.toUpperCase()} ${r.path}',
    // TODO: Plug your business logic here
    handler: async ({ req }) => ({ migrated: true, method: req.method, path: req.path }),
    // TODO: Add zod validation schemas if available
    // validate: { params: z.object({}), query: z.object({}), body: z.object({}), response: z.any() },
  }`;
}

async function main() {
  const serverPath = resolve('src/server.ts');
  const routerPath = resolve('src/router.ts');
  const serverSrc = (await readFileSafe(serverPath)) ?? '';
  const routerSrc = (await readFileSafe(routerPath)) ?? '';
  const combined = serverSrc + '\n' + routerSrc;

  const matches = extractRoutes(combined);
  if (!matches.length) {
    // eslint-disable-next-line no-console
    console.log('No Express-style routes found via regex. Please review your code and migrate manually.');
    return;
  }

  const routeDefs = matches.map(toRouteDef).join(',\n');
  const out = `// Auto-generated skeleton by scripts/migrate-routes.ts\n`+
`import { defineRoutes } from '../src/routing/unified-router.js';\n`+
`import { z } from 'zod';\n\n`+
`export const migratedRoutes = defineRoutes(\n${routeDefs}\n);\n`;

  const outDir = resolve('scripts/.migrate');
  await fs.mkdir(outDir, { recursive: true });
  const outFile = resolve(outDir, 'migrated-routes.ts');
  await fs.writeFile(outFile, out, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Wrote skeleton route defs to ${outFile}`);
}

try {
  await main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
}

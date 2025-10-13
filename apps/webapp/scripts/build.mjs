#!/usr/bin/env node
import { build } from 'esbuild';
import { rmSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const dist = join(root, 'dist');

function copyStatic() {
  const include = [
    'index.html',
    'login.html',
    'portal.html',
    'chat.html',
    'manifest.json',
    'public',
    'assets',
    'styles',
  ];
  for (const p of include) {
    const src = join(root, p);
    cpSync(src, join(dist, p), { recursive: true, force: true });
  }
}

function injectOptimizations() {
  const pages = ['index.html', 'login.html', 'chat.html'];
  for (const page of pages) {
    const p = join(dist, page);
    try {
      let html = readFileSync(p, 'utf8');
      // Ensure defer for any script tags without attributes (safety)
      html = html.replace(/<script(?![^>]*\b(type|src|defer|async)\b)([^>]*)>/g, '<script defer$2>');
      writeFileSync(p, html);
    } catch (_) {}
  }
}

async function main() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  // Bundle core app scripts into one file for minimal requests
  await build({
    entryPoints: [
      join(root, 'js/api-config.js'),
      join(root, 'js/app.js'),
    ],
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: join(dist, 'js'),
    sourcemap: true,
    minify: true,
    target: ['es2019'],
    treeShaking: true,
    logLevel: 'info',
  });

  copyStatic();
  injectOptimizations();
  console.log('Build complete. Output in', dist);
}

main().catch((err) => { console.error(err); process.exit(1); });

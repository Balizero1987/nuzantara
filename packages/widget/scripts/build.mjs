#!/usr/bin/env node
import { build } from 'esbuild';
import { mkdirSync, rmSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(root, 'zantara-sdk.js')],
  bundle: false, // keep as single file but minify
  minify: true,
  sourcemap: false,
  format: 'iife',
  target: ['es2019'],
  outfile: join(dist, 'zantara-sdk.min.js'),
});

// Copy demo HTMLs
cpSync(join(root, 'demo.html'), join(dist, 'demo.html'));
cpSync(join(root, 'zantara-widget.html'), join(dist, 'zantara-widget.html'));

console.log('Widget built at', dist);

import { build } from 'esbuild';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Ultimate Backend Build...');

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Build
build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/server.js',
  format: 'esm',
  external: [
    // Exclude dependencies that have native bindings or issues with bundling
    // We will install production dependencies in the Docker image
    'bcrypt',
    'bcryptjs',
    'sharp',
    '@opentelemetry/instrumentation',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-trace-node',
    'pg-native',
    'snappy',
    '@napi-rs/snappy-darwin-arm64',
    'twilio'
  ],
  banner: {
    js: `
      import { createRequire } from 'module';
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      
      const require = createRequire(import.meta.url);
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      console.log("🔥 BOOTSTRAP: Ultimate Bundle Starting...");
      
      // Global error handlers at the absolute top level
      process.on('uncaughtException', (err) => {
        console.error('🔥 FATAL UNCAUGHT EXCEPTION:', err);
        // In production, logging is critical before exit
        process.exit(1);
      });
      process.on('unhandledRejection', (reason) => {
        console.error('🔥 FATAL UNHANDLED REJECTION:', reason);
      });
    `,
  },
  sourcemap: true,
  minify: false, // Keep it readable for now if we need to debug on the machine
  keepNames: true,
}).then(() => {
  console.log('✅ Build complete: dist/server.js created.');
}).catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});

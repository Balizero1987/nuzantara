#!/usr/bin/env node
/**
 * Build Optimization Script for ZANTARA WebApp
 * Optimizes CSS, JS, and images for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BuildOptimizer {
  constructor() {
    this.webappDir = path.join(__dirname, 'apps/webapp');
    this.optimizedDir = path.join(this.webappDir, 'dist');
  }

  async optimize() {
    console.log('🚀 Starting build optimization...');
    
    // Create dist directory
    if (!fs.existsSync(this.optimizedDir)) {
      fs.mkdirSync(this.optimizedDir, { recursive: true });
    }

    await this.optimizeCSS();
    await this.optimizeJS();
    await this.generateImageOptimizationScript();
    await this.createServiceWorker();
    await this.generateOptimizedHTML();
    
    console.log('✅ Build optimization complete!');
  }

  // Minify CSS files
  async optimizeCSS() {
    console.log('📦 Optimizing CSS...');
    
    const cssDir = path.join(this.webappDir, 'styles');
    const distCssDir = path.join(this.optimizedDir, 'styles');
    
    if (!fs.existsSync(distCssDir)) {
      fs.mkdirSync(distCssDir, { recursive: true });
    }

    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
    
    for (const file of cssFiles) {
      const cssPath = path.join(cssDir, file);
      const css = fs.readFileSync(cssPath, 'utf8');
      
      // Simple CSS minification
      const minified = this.minifyCSS(css);
      
      const outputPath = path.join(distCssDir, file.replace('.css', '.min.css'));
      fs.writeFileSync(outputPath, minified);
      
      console.log(`  ✓ ${file} → ${file.replace('.css', '.min.css')} (${this.getSizeReduction(css, minified)})`);
    }
  }

  // Optimize JavaScript files
  async optimizeJS() {
    console.log('📦 Optimizing JavaScript...');
    
    const jsDir = path.join(this.webappDir, 'js');
    const distJsDir = path.join(this.optimizedDir, 'js');
    
    if (!fs.existsSync(distJsDir)) {
      fs.mkdirSync(distJsDir, { recursive: true });
    }

    // Copy and optimize main JS files
    await this.copyAndOptimizeJSDirectory(jsDir, distJsDir);
  }

  async copyAndOptimizeJSDirectory(sourceDir, targetDir) {
    const items = fs.readdirSync(sourceDir);
    
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        await this.copyAndOptimizeJSDirectory(sourcePath, targetPath);
      } else if (item.endsWith('.js')) {
        const js = fs.readFileSync(sourcePath, 'utf8');
        const optimized = this.optimizeJS(js);
        
        const outputFile = item.replace('.js', '.min.js');
        const outputPath = path.join(targetDir, outputFile);
        fs.writeFileSync(outputPath, optimized);
        
        console.log(`  ✓ ${item} → ${outputFile} (${this.getSizeReduction(js, optimized)})`);
      }
    }
  }

  // Simple CSS minification
  minifyCSS(css) {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around specific characters
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remove trailing semicolon before }
      .replace(/;}/g, '}')
      // Remove empty rules
      .replace(/[^{}]+{\s*}/g, '')
      .trim();
  }

  // Optimize JavaScript
  optimizeJS(js) {
    let optimized = js;
    
    // Remove console.log statements (except in development)
    optimized = optimized.replace(
      /console\.(log|info|debug|trace)\([^)]*\);?/g,
      'if(window.DEBUG)$&'
    );
    
    // Remove extra whitespace (basic minification)
    optimized = optimized
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
    
    return optimized;
  }

  // Generate image optimization script
  async generateImageOptimizationScript() {
    console.log('🖼️ Creating image optimization script...');
    
    const script = `#!/bin/bash
# Image Optimization Script
# Run this script to optimize images for production

echo "🖼️ Optimizing images for production..."

# Create optimized directory
mkdir -p apps/webapp/assets/optimized

# Function to optimize JPEG/PNG to WebP
optimize_image() {
  local input="$1"
  local output="$2"
  local quality="$3"
  
  if command -v cwebp >/dev/null 2>&1; then
    cwebp -q $quality "$input" -o "$output"
    echo "  ✓ Optimized: $(basename "$input") → $(basename "$output")"
  else
    echo "  ⚠️ cwebp not found. Please install webp tools."
    echo "     Ubuntu/Debian: sudo apt-get install webp"
    echo "     macOS: brew install webp"
  fi
}

# Optimize large images
cd apps/webapp/assets

# High-quality logos (reduce to 80% quality)
optimize_image "logo-day.jpeg" "optimized/logo-day-optimized.webp" 80
optimize_image "logo-night.jpeg" "optimized/logo-night-optimized.webp" 80

# Medium quality for other images (70% quality)
optimize_image "logobianco.jpeg" "optimized/logobianco-optimized.webp" 70
optimize_image "logo-instagram.png" "optimized/logo-instagram-optimized.webp" 70
optimize_image "logoscon.png" "optimized/logoscon-optimized.webp" 70

# Create responsive versions
if command -v convert >/dev/null 2>&1; then
  echo "📱 Creating responsive image versions..."
  
  # Create different sizes for logo-day
  convert "logo-day.jpeg" -resize 800x600 "optimized/logo-day-800.jpg"
  convert "logo-day.jpeg" -resize 400x300 "optimized/logo-day-400.jpg"
  
  # Create different sizes for logo-night  
  convert "logo-night.jpeg" -resize 800x600 "optimized/logo-night-800.jpg"
  convert "logo-night.jpeg" -resize 400x300 "optimized/logo-night-400.jpg"
  
  echo "  ✓ Created responsive versions"
else
  echo "  ⚠️ ImageMagick not found for responsive images"
fi

echo "✅ Image optimization complete!"
echo "💡 Consider using a CDN for even better performance"
`;

    fs.writeFileSync(path.join(__dirname, 'optimize-images.sh'), script);
    fs.chmodSync(path.join(__dirname, 'optimize-images.sh'), '755');
  }

  // Create service worker for caching
  async createServiceWorker() {
    console.log('⚡ Creating service worker...');
    
    const serviceWorker = `
// ZANTARA Service Worker for Performance Optimization
const CACHE_NAME = 'zantara-v5.2.0';
const STATIC_CACHE_NAME = 'zantara-static-v5.2.0';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/login.html',
  '/chat.html',
  '/styles/design-system.min.css',
  '/styles/components.min.css',
  '/js/app.min.js',
  '/js/config.min.js',
  '/assets/favicon.svg',
  '/assets/icon-192.png'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse;
      }
      
      // Network request with caching
      return fetch(request).then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone response for caching
        const responseToCache = response.clone();
        
        // Determine cache strategy
        const url = new URL(request.url);
        const isAsset = /\\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);
        const isAPI = url.pathname.startsWith('/api/') || url.pathname.startsWith('/call');
        
        if (isAsset) {
          // Cache assets for longer
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        } else if (!isAPI) {
          // Cache HTML pages briefly
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      });
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline message queue, etc.
  console.log('[SW] Performing background sync');
}
`;

    fs.writeFileSync(path.join(this.optimizedDir, 'sw.js'), serviceWorker.trim());
  }

  // Generate optimized HTML files
  async generateOptimizedHTML() {
    console.log('📄 Generating optimized HTML...');
    
    const htmlFiles = ['login.html', 'chat.html', 'dashboard.html'];
    
    for (const file of htmlFiles) {
      const htmlPath = path.join(this.webappDir, file);
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Replace CSS and JS references with minified versions
        html = html.replace(/\\.css(\\?[^"]*)?"/g, '.min.css$1"');
        html = html.replace(/\\.js(\\?[^"]*)?"/g, '.min.js$1"');
        
        // Add service worker registration
        if (!html.includes('sw.js')) {
          const swScript = `
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}
</script>`;
          html = html.replace('</body>', swScript + '</body>');
        }
        
        // Add performance optimizations
        const perfOptimizations = `
<!-- Performance Optimizations -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="//api.zantara.com">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
`;
        html = html.replace('<head>', '<head>' + perfOptimizations);
        
        const outputPath = path.join(this.optimizedDir, file);
        fs.writeFileSync(outputPath, html);
        
        console.log(`  ✓ ${file} optimized`);
      }
    }
  }

  // Calculate size reduction
  getSizeReduction(original, optimized) {
    const originalSize = Buffer.byteLength(original, 'utf8');
    const optimizedSize = Buffer.byteLength(optimized, 'utf8');
    const reduction = Math.round((1 - optimizedSize / originalSize) * 100);
    return `-${reduction}%`;
  }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize().catch(console.error);
}

export { BuildOptimizer };
#!/usr/bin/env node

/**
 * Generate Website Images - NUZANTARA
 * Uses existing ImagineArt API integration to generate all website images
 *
 * Usage:
 *   node scripts/generate-website-images.mjs [--production]
 *
 * Options:
 *   --production    Use Railway production backend (default: localhost:8080)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const USE_PRODUCTION = process.argv.includes('--production');
const BACKEND_URL = USE_PRODUCTION
  ? 'https://ts-backend-production-568d.up.railway.app'
  : 'http://localhost:8080';
const API_KEY = 'zantara-internal-dev-key-2025';
const OUTPUT_DIR = path.join(__dirname, '../website/public');

console.log(`🎨 Generating website images using ${USE_PRODUCTION ? 'PRODUCTION' : 'LOCAL'} backend`);
console.log(`📡 Backend: ${BACKEND_URL}`);
console.log(`📁 Output: ${OUTPUT_DIR}\n`);

// Image definitions with optimized prompts for ImagineArt
const images = [
  {
    filename: 'abstract-business-intelligence-dashboard.jpg',
    prompt: 'Ultra-modern business intelligence dashboard with holographic data visualization, dark futuristic UI with glowing red accents, professional corporate setting, high-tech screens displaying analytics graphs and charts, McKinsey consulting style, premium quality, cinematic lighting, 8K detailed',
    aspect_ratio: '16:9',
    style: 'realistic'
  },
  {
    filename: 'ai-southeast-asia-market-analysis.jpg',
    prompt: 'Southeast Asian cityscape with digital AI network overlay, glowing data connections between modern skyscrapers, Jakarta/Singapore/Bangkok skyline, futuristic technology integration, warm sunset lighting, professional business photography, editorial quality, 4K ultra detailed',
    aspect_ratio: '16:9',
    style: 'realistic'
  },
  {
    filename: 'digital-transformation.png',
    prompt: 'Digital transformation concept with businessman using transparent holographic interface, modern office environment, blue and purple digital particles flowing, enterprise technology, professional corporate photography, McKinsey editorial style, high resolution',
    aspect_ratio: '16:9',
    style: 'realistic'
  },
  {
    filename: 'sustainable-business-green-technology.jpg',
    prompt: 'Sustainable green business concept with modern glass office building covered in vertical gardens, solar panels, wind turbines in background, environmental technology, corporate sustainability, professional architecture photography, natural sunlight, 4K quality',
    aspect_ratio: '16:9',
    style: 'realistic'
  },
  {
    filename: 'supply-chain-logistics-network.jpg',
    prompt: 'Global supply chain network visualization with container ships, cargo planes, trucks connected by glowing digital lines on world map, logistics hub, modern freight operations, professional industrial photography, dramatic lighting, ultra detailed',
    aspect_ratio: '16:9',
    style: 'realistic'
  },
  {
    filename: 'emerging-markets-investment-finance.jpg',
    prompt: 'Financial investment concept with stock market charts, Asian businessman analyzing data on multiple screens, modern trading floor, professional finance photography, warm lighting, depth of field, 4K quality, editorial style',
    aspect_ratio: '16:9',
    style: 'realistic'
  },
  {
    filename: 'leadership-executive-management.jpg',
    prompt: 'Executive leadership team in modern boardroom, diverse Asian and international business leaders having strategic discussion, premium corporate setting, professional photography, natural window lighting, depth of field, McKinsey editorial quality',
    aspect_ratio: '16:9',
    style: 'realistic'
  }
];

/**
 * Call backend API to generate image
 */
async function generateImage({ prompt, style, aspect_ratio }) {
  try {
    console.log(`  📡 Calling ImagineArt API...`);

    const response = await fetch(`${BACKEND_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        key: 'ai-services.image.generate',
        params: {
          prompt,
          style,
          aspect_ratio,
          high_res_results: 1,
          negative_prompt: 'blurry, low quality, distorted, watermark, text overlay, amateur'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Generation failed: ${result.error || 'Unknown error'}`);
    }

    return result.data.image_url;

  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

/**
 * Download image from data URI or URL and save to file
 */
async function saveImage(imageUrl, filename) {
  try {
    console.log(`  💾 Saving image...`);

    let buffer;

    if (imageUrl.startsWith('data:')) {
      // Base64 data URI
      const base64Data = imageUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Regular URL - download
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Save file
    const filepath = path.join(OUTPUT_DIR, filename);
    await fs.writeFile(filepath, buffer);

    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
    console.log(`  ✅ Saved: ${filename} (${sizeMB} MB)`);

    return filepath;

  } catch (error) {
    throw new Error(`Failed to save image: ${error.message}`);
  }
}

/**
 * Process all images
 */
async function main() {
  console.log(`🚀 Starting generation of ${images.length} images\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`\n[${i + 1}/${images.length}] ${img.filename}`);
    console.log(`  📝 Prompt: ${img.prompt.substring(0, 80)}...`);

    try {
      // Generate image
      const imageUrl = await generateImage({
        prompt: img.prompt,
        style: img.style,
        aspect_ratio: img.aspect_ratio
      });

      // Save to file
      await saveImage(imageUrl, img.filename);

      successCount++;

      // Rate limiting - wait 2 seconds between requests
      if (i < images.length - 1) {
        console.log(`  ⏳ Waiting 2s before next generation...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`  ❌ FAILED: ${error.message}`);
      failCount++;

      // Continue with next image despite failure
      continue;
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successful: ${successCount}/${images.length}`);
  console.log(`❌ Failed: ${failCount}/${images.length}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failCount > 0) {
    console.log(`⚠️  Some images failed to generate. Check errors above.`);
    process.exit(1);
  } else {
    console.log(`🎉 All images generated successfully!`);
    console.log(`\n💡 Next steps:`);
    console.log(`   cd website && npm run dev`);
    console.log(`   Open http://localhost:3000\n`);
  }
}

// Run
main().catch(error => {
  console.error(`\n🔥 FATAL ERROR: ${error.message}`);
  process.exit(1);
});

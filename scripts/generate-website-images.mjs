#!/usr/bin/env node

/**
 * Generate Website Images for Bali Zero Insights
 * Uses ImagineArt API to generate ultra-realistic images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_KEY = process.env.IMAGINEART_API_KEY || 'vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp';
const API_URL = 'https://api.vyro.ai/v2/image/generations';
const OUTPUT_DIR = path.join(__dirname, '../website/public');

// Image definitions
const IMAGES = [
  {
    filename: 'hero-bali-ricefield-sunrise.jpg',
    prompt: 'Ultra-realistic aerial photograph of Bali rice terraces at golden hour sunrise. Emerald green terraced rice paddies with intricate water systems reflecting golden light, morning mist rising from valleys, dramatic warm sunlight breaking through clouds, Mount Agung volcano silhouette in background, traditional Balinese subak irrigation system visible, professional editorial photography style, cinematic composition, National Geographic quality, 8K resolution',
    negative_prompt: 'cartoon, anime, illustration, painting, drawing, low quality, blurry, distorted, ugly, oversaturated, people, tourists, modern buildings, cars, text, watermark',
    aspect_ratio: '16:9',
    description: 'Hero Image - Bali Ricefield Sunrise'
  },
  {
    filename: 'article-marco-pt-pma-journey.jpg',
    prompt: 'Professional realistic photograph of modern co-working space in Bali Indonesia. Elegant wooden desks with MacBooks, tropical plants, traditional Balinese architecture elements mixed with contemporary design, warm natural lighting through large windows showing rice terraces outside, Indonesian businesspeople collaborating, laptop screens showing business documents, professional editorial photography, McKinsey style, shallow depth of field',
    negative_prompt: 'cartoon, anime, illustration, low quality, blurry, cluttered, messy, dark, gloomy, text, watermark',
    aspect_ratio: '16:9',
    description: 'Article 1 - Marco PT PMA Journey'
  },
  {
    filename: 'article-tri-hita-karana.jpg',
    prompt: 'Ultra-realistic photograph of traditional Balinese temple ceremony during golden hour. Intricate stone carvings, colorful ceremonial offerings (canang sari), incense smoke rising, traditional Balinese people in ceremonial dress, tropical flowers, warm sunset lighting, spiritual atmosphere, cultural authenticity, professional editorial photography, National Geographic style, rich colors, 8K quality',
    negative_prompt: 'cartoon, anime, illustration, modern buildings, tourists, selfies, low quality, blurry, text, watermark',
    aspect_ratio: '1:1',
    description: 'Article 2 - Tri Hita Karana Cultural Scene'
  },
  {
    filename: 'article-kitas-visa-guide.jpg',
    prompt: 'Professional realistic photograph of elegant minimalist desk setup with Indonesian passport, visa documents, and KITAS residence permit card. Clean modern office environment, warm natural lighting, laptop displaying Indonesian immigration website, wooden desk surface, tropical plants in background, professional editorial photography, McKinsey consulting style, sharp focus on documents, shallow depth of field',
    negative_prompt: 'cartoon, anime, illustration, messy, cluttered, dark, blurry, low quality, text watermark, people faces',
    aspect_ratio: '1:1',
    description: 'Article 3 - KITAS Visa Guide'
  },
  {
    filename: 'article-bali-home-villa.jpg',
    prompt: 'Ultra-realistic architectural photograph of luxury Balinese villa entrance. Traditional candi bentar split gate, tropical garden with frangipani trees, modern tropical architecture blending Balinese tradition, infinity pool visible, rice terrace views in background, warm golden hour lighting, lush greenery, professional real estate photography, editorial quality, 8K resolution',
    negative_prompt: 'cartoon, anime, illustration, people, tourists, cars, modern buildings, low quality, blurry, overcast, text, watermark',
    aspect_ratio: '16:9',
    description: 'Article 4 - Finding Home in Bali'
  }
];

/**
 * Create multipart/form-data body manually
 */
function createFormDataBody(data) {
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
  let body = '';

  for (const [key, value] of Object.entries(data)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }

  body += `--${boundary}--\r\n`;

  return {
    body,
    boundary
  };
}

/**
 * Generate single image using ImagineArt API
 */
async function generateImage(imageConfig) {
  console.log(`\n🎨 Generating: ${imageConfig.description}`);
  console.log(`   Prompt: ${imageConfig.prompt.substring(0, 80)}...`);

  try {
    // Prepare form data
    const formData = {
      prompt: imageConfig.prompt,
      style: 'realistic',
      aspect_ratio: imageConfig.aspect_ratio,
      high_res_results: '1'
    };

    if (imageConfig.negative_prompt) {
      formData.negative_prompt = imageConfig.negative_prompt;
    }

    const { body, boundary } = createFormDataBody(formData);

    // Make API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('image/')) {
      // Binary image response
      console.log('   ✅ Received binary image');

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save to file
      const outputPath = path.join(OUTPUT_DIR, imageConfig.filename);
      fs.writeFileSync(outputPath, buffer);

      console.log(`   💾 Saved: ${imageConfig.filename} (${(buffer.length / 1024).toFixed(2)} KB)`);

      return {
        success: true,
        filename: imageConfig.filename,
        size: buffer.length
      };

    } else {
      // JSON response
      const result = await response.json();
      const imageUrl = result.data?.[0]?.url || result.image_url || result.url;

      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      console.log('   ✅ Received image URL');

      // Download image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save to file
      const outputPath = path.join(OUTPUT_DIR, imageConfig.filename);
      fs.writeFileSync(outputPath, buffer);

      console.log(`   💾 Saved: ${imageConfig.filename} (${(buffer.length / 1024).toFixed(2)} KB)`);

      return {
        success: true,
        filename: imageConfig.filename,
        size: buffer.length,
        url: imageUrl
      };
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🌌 Bali Zero Insights - Website Image Generator\n');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  console.log(`🎨 Generating ${IMAGES.length} images...\n`);

  // Create output directory if needed
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];

  // Generate images sequentially (to avoid API rate limits)
  for (const imageConfig of IMAGES) {
    const result = await generateImage(imageConfig);
    results.push({ ...imageConfig, ...result });

    // Wait 3 seconds between requests to avoid rate limiting
    if (IMAGES.indexOf(imageConfig) < IMAGES.length - 1) {
      console.log('   ⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}\n`);

  if (successful.length > 0) {
    console.log('Generated files:');
    successful.forEach(r => {
      console.log(`  ✓ ${r.filename} (${(r.size / 1024).toFixed(2)} KB)`);
    });
  }

  if (failed.length > 0) {
    console.log('\nFailed:');
    failed.forEach(r => {
      console.log(`  ✗ ${r.description}: ${r.error}`);
    });
  }

  console.log('\n🎉 Done! Next steps:');
  console.log('  1. Review generated images in website/public/');
  console.log('  2. Update component image paths if needed');
  console.log('  3. git add && git commit && git push');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

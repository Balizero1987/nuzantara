#!/usr/bin/env node
/**
 * Generate Visual Assets for Bali Zero Publication
 * Using existing ImagineArt service from backend-ts
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGINEART_API_KEY = 'vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp';
const BASE_URL = 'https://api.vyro.ai/v2';
const OUTPUT_DIR = join(__dirname, '../public/images/generated');

// Ensure output directory exists
await mkdir(OUTPUT_DIR, { recursive: true });

/**
 * Generate image using ImagineArt API
 */
async function generateImage(prompt, style = 'realistic', aspectRatio = '16:9', filename = 'output.jpg') {
  console.log(`\n🎨 Generating: ${filename}`);
  console.log(`   Prompt: ${prompt.substring(0, 60)}...`);
  
  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('style', style);
    formData.append('aspect_ratio', aspectRatio);
    formData.append('high_res_results', '1');

    const response = await fetch(`${BASE_URL}/image/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMAGINEART_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    // Check if response is binary image
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('image/')) {
      // Save binary image directly
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const outputPath = join(OUTPUT_DIR, filename);
      await writeFile(outputPath, buffer);
      
      console.log(`   ✅ Saved: ${filename} (${buffer.length} bytes)`);
      return outputPath;
    } else {
      // JSON response with URL
      const result = await response.json();
      const imageUrl = result.data?.[0]?.url || result.image_url || result.url;
      
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }
      
      // Download the image
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const outputPath = join(OUTPUT_DIR, filename);
      await writeFile(outputPath, buffer);
      
      console.log(`   ✅ Saved: ${filename} (${buffer.length} bytes)`);
      return outputPath;
    }
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    throw error;
  }
}

/**
 * Visual Assets Definitions
 */
const VISUAL_ASSETS = {
  hero: {
    prompt: `Cinematic ultra-wide shot of purple lotus flower blooming from darkness, 
underwater crystal clear water transitioning to surface, flower emerging into golden sunrise light, 
water droplets catching light, symbolic journey from zero to infinity, hyper realistic 8K, 
ethereal spiritual atmosphere, color palette deep purple gold cream black, National Geographic style,
peaceful meditation mood, zen minimalist composition`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'hero-lotus-blooming.jpg'
  },
  
  journey1: {
    prompt: `Traditional Balinese temple gateway (candi bentar split gate) at golden hour sunrise,
dramatic god rays streaming through the gateway opening, purple lotus flower petals floating in air,
symbolizing passage and transformation into Indonesian community, cinematic dramatic lighting,
purple and gold color palette, mystical spiritual atmosphere, architectural photography style,
8K ultra detailed, professional composition`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-visa-gateway.jpg'
  },
  
  journey2: {
    prompt: `Modern minimalist Balinese architecture building blending traditional wooden joinery with contemporary glass,
foundation stones with sacred offerings canang sari placed respectfully,
symbolizing business built on cultural foundation JIWA philosophy,
golden hour warm lighting, elegant architectural composition,
blend of tradition and innovation, professional architecture photography,
8K ultra detailed, warm tones`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-business-foundation.jpg'
  },
  
  journey3: {
    prompt: `Intimate macro shot of hands placing purple lotus flower offering in traditional Balinese home shrine sanggah,
warm candlelight illuminating sacred space, Indonesian batik ikat textiles visible in soft focus background,
symbolizing spiritual home and belonging integration into culture,
close-up macro photography artistic style, warm golden tones,
peaceful ritual atmosphere, cultural authenticity, 8K detailed`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-home-belonging.jpg'
  },
  
  journey4: {
    prompt: `Artistic macro shot of traditional Balinese dancer hand in elegant mudra position,
intricate gold jewelry and henna mehndi details clearly visible,
purple lotus flower held delicately between graceful fingers,
soft focus gamelan musical instruments in background,
symbolizing cultural mastery grace and wisdom,
dramatic side lighting rich textures, artistic portrait photography style,
8K ultra detailed warm tones`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-culture-wisdom.jpg'
  },
  
  zantara: {
    prompt: `Professional portrait of elegant Indonesian woman warm intelligent smile,
subtle cultural jewelry or tattoo, modern business attire with traditional batik accent,
soft professional lighting approachable yet sophisticated dark background,
purple lotus flower mandala pattern glowing subtly behind her with gold bioluminescence,
delicate data stream particles floating around elegant and subtle,
blend of Annie Leibovitz portrait with sci-fi concept art,
wise warm technologically advanced yet spiritually grounded,
8K professional headshot style`,
    style: 'realistic',
    aspectRatio: '1:1',
    filename: 'zantara-portrait-enhanced.jpg'
  },
  
  article1: {
    prompt: `Cinematic documentary-style photo of diverse expat entrepreneur in modern Bali coworking space,
natural candid contemplative moment looking at Indonesia landscape through window,
Indonesian team members visible in soft focus background,
natural golden hour light, authentic storytelling photography,
National Geographic documentary style, human connection emotional depth,
8K professional photojournalism`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'article-journey-story-1.jpg'
  },
  
  article2: {
    prompt: `Artistic overhead flat lay of traditional Balinese ceremonial offerings canang sari,
colorful flowers incense rice arranged in intricate lotus mandala pattern,
warm morning light casting soft shadows, cultural documentation photography,
respectful authentic representation, rich colors and textures,
museum-quality fine art photography, 8K detailed macro`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'article-cultural-insight.jpg'
  },
  
  article3: {
    prompt: `Minimalist zen composition of modern MacBook laptop showing Indonesian language AI interface screen,
contemporary Bali coworking space background with rice terrace view through window,
natural daylight professional workspace, clean modern aesthetic,
technology meets tradition, professional lifestyle photography,
8K ultra detailed warm natural tones`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'article-tech-ai.jpg'
  }
};

/**
 * Main generation function
 */
async function main() {
  console.log('🎨 BALI ZERO VISUAL ASSETS GENERATION');
  console.log('=====================================\n');
  console.log(`API: ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);
  console.log(`Total assets to generate: ${Object.keys(VISUAL_ASSETS).length}`);
  
  const results = [];
  const errors = [];
  
  for (const [key, config] of Object.entries(VISUAL_ASSETS)) {
    try {
      const path = await generateImage(
        config.prompt,
        config.style,
        config.aspectRatio,
        config.filename
      );
      results.push({ key, filename: config.filename, path });
      
      // Wait 2 seconds between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      errors.push({ key, filename: config.filename, error: error.message });
    }
  }
  
  console.log('\n\n📊 GENERATION SUMMARY');
  console.log('=====================\n');
  console.log(`✅ Successful: ${results.length}`);
  console.log(`❌ Failed: ${errors.length}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  
  if (results.length > 0) {
    console.log('Generated files:');
    results.forEach(r => console.log(`  ✓ ${r.filename}`));
  }
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  ✗ ${e.filename}: ${e.error}`));
  }
  
  console.log('\n🎉 Generation complete!');
  console.log('\nNext steps:');
  console.log('1. Review generated images in apps/publication/public/images/generated/');
  console.log('2. Move/rename images as needed to public/images/');
  console.log('3. Update component imports to use new images\n');
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});


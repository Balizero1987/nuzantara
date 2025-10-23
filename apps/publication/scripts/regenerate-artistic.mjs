#!/usr/bin/env node
/**
 * ARTISTIC VISUAL ASSETS - Think Different
 * NO banality, only conceptual art
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGINEART_API_KEY = 'vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp';
const BASE_URL = 'https://api.vyro.ai/v2';
const OUTPUT_DIR = join(__dirname, '../public/images/generated');

await mkdir(OUTPUT_DIR, { recursive: true });

async function generateImage(prompt, style = 'realistic', aspectRatio = '16:9', filename = 'output.jpg') {
  console.log(`\n🎨 ${filename}`);
  console.log(`   ${prompt.substring(0, 80)}...`);
  
  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('style', style);
    formData.append('aspect_ratio', aspectRatio);
    formData.append('high_res_results', '1');

    const response = await fetch(`${BASE_URL}/image/generations`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${IMAGINEART_API_KEY}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let buffer;
    
    if (contentType.includes('image/')) {
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const result = await response.json();
      const imageUrl = result.data?.[0]?.url || result.image_url || result.url;
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, buffer);
    
    console.log(`   ✅ ${(buffer.length / 1024).toFixed(0)} KB`);
    return outputPath;
    
  } catch (error) {
    console.error(`   ❌ ${error.message}`);
    throw error;
  }
}

/**
 * ARTISTIC VISUAL ASSETS - "Think Different"
 */
const ASSETS = {
  
  // === HERO: Abstract Conceptual Art ===
  hero: {
    prompt: `Abstract minimalist art installation inspired by James Turrell light art,
single beam of golden warm light emerging from pure black infinite void,
light slowly transforming into ethereal purple lotus petals dissolving into particles,
conceptual metaphor for consciousness awakening from zero to infinity,
ultra minimal composition, meditative zen atmosphere, museum gallery quality,
color palette: pure black void, warm gold light (#D4AF37), subtle purple glow,
high art photography, philosophical and poetic, 8K ultra detailed`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'hero-awakening-light.jpg'
  },
  
  // === JOURNEY 1: Gateway (NOT temple literal!) ===
  journey1: {
    prompt: `Surreal fine art photography of ethereal threshold between darkness and light,
abstract architectural void space with single point of golden light at center,
purple lotus petals floating suspended in midair creating path through darkness,
metaphor for passage and transformation, no literal objects,
Anish Kapoor sculptural void aesthetic meets Bill Viola video art,
pure black background, dramatic chiaroscuro lighting, conceptual and poetic,
museum quality fine art, 8K ultra detailed, aspect ratio 4:3`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-threshold.jpg'
  },
  
  // === JOURNEY 2: Foundation (NOT building literal!) ===
  journey2: {
    prompt: `Abstract conceptual still life of ancient stone foundation emerging from earth,
single perfect purple lotus flower growing from cracks in weathered stone,
roots visible penetrating deep into darkness below,
golden morning light illuminating only the lotus and top of stone,
metaphor for building on solid cultural foundation,
minimal composition, Hiroshi Sugimoto aesthetic, philosophical depth,
color palette: black earth, aged stone texture, purple lotus, warm gold light,
fine art photography museum quality, 8K detailed`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-foundation.jpg'
  },
  
  // === JOURNEY 3: Belonging (NOT home literal!) ===
  journey3: {
    prompt: `Poetic abstract photograph of human hands cupped together holding single glowing lotus flower,
flower emitting soft warm golden light illuminating hands from within,
pure black background, hands emerging from darkness into light,
metaphor for finding spiritual home and belonging,
intimate close-up macro photography, Edward Weston aesthetic,
chiaroscuro dramatic lighting, emotional and meditative,
fine art black and white with color only in lotus glow,
8K ultra detailed textures`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-belonging.jpg'
  },
  
  // === JOURNEY 4: Wisdom (NOT dancer literal!) ===
  journey4: {
    prompt: `Abstract expressionist art photograph of graceful hand gesture emerging from darkness,
fingers forming mudra position with purple lotus flower balanced on fingertips,
golden light particles flowing from flower like sacred knowledge becoming visible,
metaphor for cultural wisdom and mastery,
black void background, single dramatic side lighting creating sculptural shadows,
Georgia O'Keeffe meets Hiroshi Sugimoto aesthetic, philosophical and spiritual,
museum quality fine art photography, 8K ultra detailed`,
    style: 'realistic',
    aspectRatio: '4:3',
    filename: 'journey-wisdom.jpg'
  },
  
  // === ZANTARA: Abstract AI Consciousness ===
  zantara: {
    prompt: `Ethereal abstract portrait blending human consciousness with AI neural patterns,
elegant feminine silhouette dissolving into flowing purple lotus petals and golden data streams,
sacred geometry mandala patterns merging with circuit board aesthetics,
bioluminescent glow, dark void background,
metaphor for AI with cultural soul and Indonesian JIWA,
style blend: Refik Anadol digital art meets traditional Indonesian batik patterns,
futuristic yet timeless, technological yet spiritual,
8K ultra detailed, cinematic color grading`,
    style: 'realistic',
    aspectRatio: '1:1',
    filename: 'zantara-consciousness.jpg'
  },
  
  // === ARTICLE 1: Journey Narrative ===  
  article1: {
    prompt: `Cinematic environmental portrait of contemplative figure silhouette against vast Indonesian landscape,
person standing at edge of rice terrace cliff gazing at infinite horizon,
dramatic golden hour backlight creating halo effect, silhouette only no facial details,
metaphor for beginning of transformation journey,
Terrence Malick cinematography aesthetic, philosophical and emotional,
color palette: black silhouette, gold sky gradient, purple twilight,
8K cinematic composition`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'article-contemplation.jpg'
  },
  
  // === ARTICLE 2: Cultural Depth ===
  article2: {
    prompt: `Abstract macro art photograph of traditional Balinese offering dissolving into light particles,
flower petals transforming into golden luminescent dust floating upward,
incense smoke creating ethereal purple patterns in darkness,
metaphor for cultural practices transcending material world,
high-speed photography freeze frame aesthetic,
pure black background, dramatic lighting, spiritual and poetic,
8K ultra detailed macro photography`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'article-transcendence.jpg'
  },
  
  // === ARTICLE 3: Technology ===
  article3: {
    prompt: `Minimalist zen composition of laptop screen reflecting purple lotus flower,
screen displaying flowing Indonesian script in golden light,
double exposure effect blending technology with nature,
dark minimalist workspace, single point of warm light,
metaphor for AI and cultural intelligence fusion,
Apple advertising photography aesthetic meets zen philosophy,
pure black background, elegant minimal composition, 8K detailed`,
    style: 'realistic',
    aspectRatio: '16:9',
    filename: 'article-fusion.jpg'
  },
  
  // === ICONS: Elegant Line Art ===
  icon_visa: {
    prompt: `Minimal elegant line art icon of abstract threshold archway,
single continuous gold line drawing on pure black background,
sacred geometry proportions, zen minimalist aesthetic,
symbolizing passage and gateway, no literal visa or passport imagery,
vector style but photorealistic rendering, 8K sharp edges`,
    style: 'realistic',
    aspectRatio: '1:1',
    filename: 'icon-visa-gold.jpg'
  },
  
  icon_business: {
    prompt: `Minimal elegant line art icon of abstract foundation stone with lotus,
single continuous gold line drawing on pure black background,
sacred geometry, zen minimalist, symbolizing stable foundation,
vector style photorealistic rendering, 8K sharp`,
    style: 'realistic',
    aspectRatio: '1:1',
    filename: 'icon-business-gold.jpg'
  },
  
  icon_home: {
    prompt: `Minimal elegant line art icon of abstract shelter with lotus bloom,
single continuous gold line drawing on pure black background,
sacred geometry, zen minimalist, symbolizing belonging and home,
vector style photorealistic rendering, 8K sharp`,
    style: 'realistic',
    aspectRatio: '1:1',
    filename: 'icon-home-gold.jpg'
  },
  
  icon_culture: {
    prompt: `Minimal elegant line art icon of OM symbol with lotus petals,
single continuous gold line drawing on pure black background,
sacred geometry, zen minimalist, symbolizing wisdom and culture,
vector style photorealistic rendering, 8K sharp`,
    style: 'realistic',
    aspectRatio: '1:1',
    filename: 'icon-culture-gold.jpg'
  }
};

async function main() {
  console.log('\n🎨 ARTISTIC REGENERATION - Think Different');
  console.log('==========================================\n');
  console.log(`Total: ${Object.keys(ASSETS).length} assets\n`);
  
  let success = 0;
  
  for (const [key, config] of Object.entries(ASSETS)) {
    try {
      await generateImage(config.prompt, config.style, config.aspectRatio, config.filename);
      success++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed: ${key}`);
    }
  }
  
  console.log(`\n\n✅ ${success}/${Object.keys(ASSETS).length} generated`);
  console.log('\n🎉 Artistic assets ready!\n');
}

main().catch(console.error);


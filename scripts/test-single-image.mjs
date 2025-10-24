#!/usr/bin/env node

/**
 * Quick test: Generate a single image with simplified prompt
 */

const BACKEND_URL = 'https://ts-backend-production-568d.up.railway.app';
const API_KEY = 'zantara-internal-dev-key-2025';

async function testGeneration() {
  console.log('🧪 Testing single image generation with simplified prompt...\n');

  const prompt = 'modern business dashboard with data visualization, professional corporate style, high quality';

  try {
    const response = await fetch(`${BACKEND_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        key: 'ai-services.image.generate',
        params: {
          prompt: prompt,
          style: 'realistic',
          aspect_ratio: '16:9',
          high_res_results: 1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error: ${response.status}`);
      console.error(`Response: ${errorText}`);
      process.exit(1);
    }

    const result = await response.json();

    if (!result.success) {
      console.error(`❌ Generation failed: ${JSON.stringify(result, null, 2)}`);
      process.exit(1);
    }

    console.log('✅ Success!');
    console.log(`Image URL type: ${result.data.image_url.substring(0, 50)}...`);
    console.log(`Full response:`, JSON.stringify(result, null, 2));

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

testGeneration();

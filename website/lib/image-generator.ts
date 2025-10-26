/**
 * ImagineArt API Integration
 * Generates editorial-quality images for magazine articles
 */

const IMAGINEART_API_KEY = 'vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp';
const IMAGINEART_API_URL = 'https://api.imagineart.ai/v1/generate'; // Endpoint standard

export interface ImageGenerationOptions {
  prompt: string;
  style?: 'editorial' | 'photorealistic' | 'cinematic';
  aspectRatio?: '16:9' | '3:2' | '4:3';
  quality?: 'standard' | 'hd' | 'ultra';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  filename: string;
}

/**
 * Generate an editorial-quality image using ImagineArt API
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  const {
    prompt,
    style = 'editorial',
    aspectRatio = '16:9',
    quality = 'hd'
  } = options;

  // Enhance prompt for editorial quality
  const enhancedPrompt = `${prompt}, professional ${style} photography, magazine quality, high resolution, ${quality} quality, ${aspectRatio} aspect ratio, cinematic lighting, depth of field`;

  try {
    const response = await fetch(IMAGINEART_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMAGINEART_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        style,
        aspect_ratio: aspectRatio,
        quality,
        num_images: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`ImagineArt API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle response structure (may vary based on actual API)
    const imageUrl = data.images?.[0]?.url || data.url || data.image_url;
    
    if (!imageUrl) {
      throw new Error('No image URL in API response');
    }

    // Generate filename from prompt
    const filename = `${prompt.slice(0, 50).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.jpg`;

    return {
      url: imageUrl,
      prompt: enhancedPrompt,
      filename,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Extract context from article content for image generation
 */
export function extractImageContext(
  content: string,
  position: number,
  wordCount: number = 100
): string {
  const words = content.split(/\s+/);
  const startIdx = Math.max(0, position - wordCount);
  const endIdx = Math.min(words.length, position + wordCount);
  
  return words.slice(startIdx, endIdx).join(' ');
}

/**
 * Create a prompt for editorial image based on article context
 */
export function createEditorialPrompt(
  articleTitle: string,
  sectionHeading: string,
  context: string
): string {
  // Extract key concepts from context
  const keywords = extractKeywords(context);
  
  return `Editorial photography for magazine article about "${articleTitle}", section: "${sectionHeading}". Context: ${keywords.join(', ')}`;
}

/**
 * Simple keyword extraction from text
 */
function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Download image from URL and save to public folder
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  filename: string,
  destinationPath: string = 'public/article-images'
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure directory exists
    const fullPath = path.join(process.cwd(), destinationPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    // Save file
    const filePath = path.join(fullPath, filename);
    fs.writeFileSync(filePath, buffer);
    
    // Return relative path for web use
    return `/article-images/${filename}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}


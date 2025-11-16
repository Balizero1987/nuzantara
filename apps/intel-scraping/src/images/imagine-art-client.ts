// src/images/imagine-art-client.ts
import axios, { AxiosInstance } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export interface CoverDesignConfig {
  style: 'modern' | 'professional' | 'artistic' | 'minimalist';
  colorScheme: 'bali' | 'corporate' | 'tech' | 'vibrant';
  includeText: boolean;
  dimensions: {
    width: number;
    height: number;
  };
}

export class ImagineArtClient {
  private api: AxiosInstance;
  private apiKey: string;
  private generatedCount: number = 0;

  // Pre-configured styles for each category
  private categoryStyles = {
    immigration: {
      style: 'professional',
      colors: ['#003366', '#FFD700', '#FFFFFF'],
      keywords: ['passport', 'visa stamps', 'airport', 'travel documents', 'official'],
      mood: 'trustworthy, official'
    },
    business: {
      style: 'corporate',
      colors: ['#1E3A8A', '#10B981', '#F59E0B'],
      keywords: ['office building', 'handshake', 'contracts', 'modern Jakarta', 'skyline'],
      mood: 'professional, growth-oriented'
    },
    tax: {
      style: 'minimalist',
      colors: ['#4B5563', '#EF4444', '#F9FAFB'],
      keywords: ['calculator', 'documents', 'charts', 'money', 'financial'],
      mood: 'serious, analytical'
    },
    property: {
      style: 'architectural',
      colors: ['#059669', '#8B5CF6', '#FCD34D'],
      keywords: ['Bali villa', 'tropical house', 'real estate', 'architecture', 'luxury'],
      mood: 'aspirational, tropical'
    },
    bali_news: {
      style: 'vibrant',
      colors: ['#EC4899', '#14B8A6', '#F97316'],
      keywords: ['Bali temple', 'beach sunset', 'rice terraces', 'cultural', 'tropical paradise'],
      mood: 'vibrant, cultural'
    },
    ai_indonesia: {
      style: 'futuristic',
      colors: ['#6366F1', '#06B6D4', '#A855F7'],
      keywords: ['technology', 'AI brain', 'digital', 'futuristic Jakarta', 'innovation'],
      mood: 'innovative, high-tech'
    },
    finance: {
      style: 'sophisticated',
      colors: ['#16A34A', '#0EA5E9', '#EAB308'],
      keywords: ['stock market', 'rupiah currency', 'bank', 'investment', 'growth chart'],
      mood: 'trustworthy, prosperous'
    }
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.IMAGINEART_API_KEY || 'fqJqUJC0bvwGrZxs0yEZXmXpLHdgOvGh0KlhcHGvtCPTxino6PZdxw9zAieT';

    this.api = axios.create({
      baseURL: 'https://api.imagineart.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateCover(
    article: {
      title: string;
      category: string;
      keyPoints?: string[];
      sentiment?: string;
    },
    config?: Partial<CoverDesignConfig>
  ): Promise<{ imageUrl: string; localPath: string }> {

    console.log(`🎨 Generating cover for: ${article.title.substring(0, 50)}...`);

    try {
      // Build prompt based on category and article
      const prompt = this.buildPrompt(article);

      // Generate image with ImagineArt
      const response = await this.api.post('/generate', {
        prompt: prompt,
        model: 'midjourney', // or 'stable-diffusion', 'dall-e'
        width: config?.dimensions?.width || 1200,
        height: config?.dimensions?.height || 630, // Social media optimal
        num_images: 1,
        negative_prompt: 'text, words, letters, watermark, logo, low quality, blurry',
        guidance_scale: 7.5,
        steps: 30
      });

      const imageUrl = response.data.images[0].url;

      // Download and process image
      const localPath = await this.downloadAndProcess(imageUrl, article, config);

      this.generatedCount++;
      console.log(`✅ Cover generated: ${localPath}`);

      return { imageUrl, localPath };

    } catch (error: any) {
      console.error('❌ ImagineArt generation failed:', error.message);

      // Fallback to template-based generation
      return this.generateTemplateCover(article, config);
    }
  }

  private buildPrompt(article: any): string {
    const style = this.categoryStyles[article.category as keyof typeof this.categoryStyles];

    if (!style) {
      // Generic prompt for unknown categories
      return `Professional news cover image for "${article.title}",
        modern design, clean composition, high quality photography,
        Indonesia business theme, no text`;
    }

    // Category-specific prompt
    const basePrompt = `${style.mood} cover image for news article,
      ${style.style} style,
      featuring ${style.keywords.slice(0, 3).join(', ')},
      color palette: ${style.colors.join(', ')},
      professional photography, high quality, sharp focus,
      Indonesian context, Bali atmosphere when relevant,
      NO text, NO words, NO letters`;

    // Add sentiment modifier
    if (article.sentiment === 'positive') {
      return `${basePrompt}, optimistic mood, bright lighting, upward movement`;
    } else if (article.sentiment === 'negative') {
      return `${basePrompt}, serious mood, dramatic lighting, cautionary tone`;
    }

    return basePrompt;
  }

  private async downloadAndProcess(
    imageUrl: string,
    article: any,
    config?: Partial<CoverDesignConfig>
  ): Promise<string> {

    // Download image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'covers', article.category);
    await fs.mkdir(outputDir, { recursive: true });

    // Generate filename
    const timestamp = Date.now();
    const filename = `${article.category}_${timestamp}.jpg`;
    const outputPath = path.join(outputDir, filename);

    // Process with sharp if text overlay needed
    if (config?.includeText !== false) {
      await this.addTextOverlay(buffer, article, outputPath);
    } else {
      // Save as-is
      await fs.writeFile(outputPath, buffer);
    }

    // Create social media variants
    await this.createSocialVariants(outputPath, article);

    return outputPath;
  }

  private async addTextOverlay(
    imageBuffer: Buffer,
    article: any,
    outputPath: string
  ): Promise<void> {

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Create text overlay SVG
    const titleText = this.wrapText(article.title, 40);
    const svgOverlay = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
            <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <rect x="0" y="${metadata.height! - 250}" width="${metadata.width}" height="250" fill="url(#grad)" />
        <text x="60" y="${metadata.height! - 140}"
              font-family="Arial, sans-serif"
              font-size="48"
              font-weight="bold"
              fill="white">
          ${titleText.map((line, i) =>
            `<tspan x="60" dy="${i === 0 ? 0 : 55}">${line}</tspan>`
          ).join('')}
        </text>
        <text x="60" y="${metadata.height! - 50}"
              font-family="Arial, sans-serif"
              font-size="24"
              fill="#FFD700">
          BALI ZERO JOURNAL
        </text>
      </svg>
    `;

    // Composite overlay on image
    await image
      .composite([{
        input: Buffer.from(svgOverlay),
        gravity: 'southeast'
      }])
      .jpeg({ quality: 90 })
      .toFile(outputPath);
  }

  private wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxLength) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine) lines.push(currentLine.trim());
    return lines.slice(0, 2); // Max 2 lines
  }

  private async createSocialVariants(
    originalPath: string,
    article: any
  ): Promise<void> {

    const variants = [
      { name: 'instagram', width: 1080, height: 1080 },
      { name: 'facebook', width: 1200, height: 630 },
      { name: 'twitter', width: 1200, height: 675 },
      { name: 'linkedin', width: 1200, height: 627 }
    ];

    const dir = path.dirname(originalPath);
    const basename = path.basename(originalPath, '.jpg');

    for (const variant of variants) {
      const outputPath = path.join(dir, `${basename}_${variant.name}.jpg`);

      await sharp(originalPath)
        .resize(variant.width, variant.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
    }
  }

  private async generateTemplateCover(
    article: any,
    config?: Partial<CoverDesignConfig>
  ): Promise<{ imageUrl: string; localPath: string }> {

    console.log('📐 Using template-based cover generation...');

    const style = this.categoryStyles[article.category as keyof typeof this.categoryStyles];
    const colors = style?.colors || ['#1E40AF', '#FFD700', '#FFFFFF'];

    // Create SVG template
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>

        <!-- Pattern overlay -->
        <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="2" fill="${colors[2]}" opacity="0.1"/>
        </pattern>
        <rect width="1200" height="630" fill="url(#pattern)"/>

        <!-- Category badge -->
        <rect x="50" y="50" width="200" height="40" rx="20" fill="${colors[2]}" opacity="0.9"/>
        <text x="150" y="75" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="${colors[0]}">
          ${article.category.toUpperCase().replace('_', ' ')}
        </text>

        <!-- Title area -->
        <rect x="0" y="380" width="1200" height="250" fill="${colors[0]}" opacity="0.95"/>

        <!-- Title text -->
        <text x="60" y="450" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="${colors[2]}">
          ${this.wrapText(article.title, 50).map((line, i) =>
            `<tspan x="60" dy="${i === 0 ? 0 : 50}">${line}</tspan>`
          ).join('')}
        </text>

        <!-- Brand -->
        <text x="60" y="570" font-family="Arial" font-size="24" fill="${colors[1]}">
          BALI ZERO JOURNAL
        </text>
        <text x="1140" y="570" text-anchor="end" font-family="Arial" font-size="18" fill="${colors[2]}" opacity="0.7">
          ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </text>
      </svg>
    `;

    // Save template
    const outputDir = path.join(process.cwd(), 'covers', article.category);
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${article.category}_template_${Date.now()}.jpg`;
    const outputPath = path.join(outputDir, filename);

    // Convert SVG to image
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    return {
      imageUrl: `file://${outputPath}`,
      localPath: outputPath
    };
  }

  getStats() {
    return {
      generatedCount: this.generatedCount,
      estimatedCost: this.generatedCount * 0.05 // ~$0.05 per image
    };
  }
}


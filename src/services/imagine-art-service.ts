/**
 * Imagine.art Service
 * REST API client for image generation using Imagine.art API
 */

import logger from './logger.js';
import type {
  ImagineArtGenerateRequest,
  ImagineArtGenerateResponse,
  ImagineArtUpscaleRequest,
  ImagineArtUpscaleResponse,
  ImagineArtServiceConfig
} from '../types/imagine-art-types.js';

export class ImagineArtService {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config?: Partial<ImagineArtServiceConfig>) {
    this.apiKey = config?.apiKey || process.env.IMAGINEART_API_KEY || '';
    this.baseUrl = config?.baseUrl || 'https://api.vyro.ai/v2';
    this.timeout = config?.timeout || 60000; // 60s default

    if (!this.apiKey) {
      logger.warn('⚠️ IMAGINEART_API_KEY not configured - image generation will fail');
    }
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(request: ImagineArtGenerateRequest): Promise<ImagineArtGenerateResponse> {
    if (!this.apiKey) {
      throw new Error('IMAGINEART_API_KEY not configured');
    }

    try {
      const {
        prompt,
        style = 'realistic',
        aspect_ratio = '16:9',
        seed,
        negative_prompt,
        high_res_results = 1
      } = request;

      logger.info('🎨 Generating image with Imagine.art', { prompt: prompt.substring(0, 50) });

      // Build FormData for API request (multipart/form-data)
      const FormData = (await import('node:buffer')).FormData || globalThis.FormData;
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('style', style);
      formData.append('aspect_ratio', aspect_ratio);
      formData.append('high_res_results', high_res_results.toString());

      if (seed !== undefined) {
        formData.append('seed', seed.toString());
      }

      if (negative_prompt) {
        formData.append('negative_prompt', negative_prompt);
      }

      const response = await fetch(`${this.baseUrl}/image/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
          // Note: Don't set Content-Type - FormData sets it automatically with boundary
        },
        body: formData as any,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('🔥 Imagine.art API error:', { status: response.status, error: errorText });
        throw new Error(`Imagine.art API error: ${response.status} - ${errorText}`);
      }

      // Check if response is an image (binary) or JSON
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('image/')) {
        // Response is binary image - convert to base64 data URI
        logger.info('📦 Received binary image response, converting to base64...');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');

        // Determine image format from content-type
        const imageFormat = contentType.split('/')[1] || 'jpeg';
        const dataUri = `data:image/${imageFormat};base64,${base64}`;

        logger.info('✅ Image generated successfully (binary)', {
          size: buffer.length,
          format: imageFormat
        });

        return {
          image_url: dataUri,
          request_id: `req_${Date.now()}`,
          prompt,
          style,
          aspect_ratio,
          seed
        };
      } else {
        // Response is JSON
        const result = await response.json();

        // Parse response (adjust based on actual API response format)
        const imageUrl = result.data?.[0]?.url || result.image_url || result.url;
        const requestId = result.request_id || result.id || `req_${Date.now()}`;

        if (!imageUrl) {
          logger.error('🔥 No image URL in Imagine.art response:', result);
          throw new Error('No image URL returned from Imagine.art');
        }

        logger.info('✅ Image generated successfully (JSON)', { imageUrl: imageUrl.substring(0, 50) });

        return {
          image_url: imageUrl,
          request_id: requestId,
          prompt,
          style,
          aspect_ratio,
          seed
        };
      }

    } catch (error: any) {
      logger.error('🔥 Imagine.art generation failed:', error.message);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Upscale/enhance existing image
   */
  async upscaleImage(request: ImagineArtUpscaleRequest): Promise<ImagineArtUpscaleResponse> {
    if (!this.apiKey) {
      throw new Error('IMAGINEART_API_KEY not configured');
    }

    try {
      const { image } = request;

      logger.info('🔍 Upscaling image with Imagine.art');

      const FormData = (await import('node:buffer')).FormData || globalThis.FormData;
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(`${this.baseUrl}/image/upscale`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
          // Note: Don't set Content-Type - FormData sets it automatically with boundary
        },
        body: formData as any,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('🔥 Imagine.art upscale error:', { status: response.status, error: errorText });
        throw new Error(`Imagine.art upscale error: ${response.status} - ${errorText}`);
      }

      // Check if response is an image (binary) or JSON
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('image/')) {
        // Response is binary image - convert to base64 data URI
        logger.info('📦 Received binary upscaled image, converting to base64...');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');

        const imageFormat = contentType.split('/')[1] || 'jpeg';
        const dataUri = `data:image/${imageFormat};base64,${base64}`;

        logger.info('✅ Image upscaled successfully (binary)', { size: buffer.length });

        return {
          upscaled_url: dataUri,
          request_id: `upscale_${Date.now()}`,
          original_image: image
        };
      } else {
        // Response is JSON
        const result = await response.json();

        const upscaledUrl = result.data?.[0]?.url || result.upscaled_url || result.url;
        const requestId = result.request_id || result.id || `upscale_${Date.now()}`;

        if (!upscaledUrl) {
          logger.error('🔥 No upscaled URL in response:', result);
          throw new Error('No upscaled URL returned from Imagine.art');
        }

        logger.info('✅ Image upscaled successfully (JSON)');

        return {
          upscaled_url: upscaledUrl,
          request_id: requestId,
          original_image: image
        };
      }

    } catch (error: any) {
      logger.error('🔥 Imagine.art upscale failed:', error.message);
      throw new Error(`Image upscale failed: ${error.message}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      // Simple test with minimal prompt
      await this.generateImage({
        prompt: 'test',
        style: 'realistic',
        aspect_ratio: '1:1'
      });

      return true;
    } catch (error) {
      logger.error('🔥 Imagine.art connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let serviceInstance: ImagineArtService | null = null;

export function getImagineArtService(): ImagineArtService {
  if (!serviceInstance) {
    serviceInstance = new ImagineArtService();
  }
  return serviceInstance;
}

/**
 * Imagine.art Image Generation Handlers
 * AI-powered image generation for NUZANTARA v5.2.0
 */
import logger from '../../services/logger.js';
import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { getImagineArtService } from '../../services/imagine-art-service.js';
/**
 * Generate image from text prompt using Imagine.art
 *
 * @param params.prompt - Text description of desired image (required)
 * @param params.style - Art style: realistic, anime, flux-schnell, etc. (default: realistic)
 * @param params.aspect_ratio - Image ratio: 1:1, 16:9, 9:16, etc. (default: 16:9)
 * @param params.seed - Random seed for reproducibility (optional)
 * @param params.negative_prompt - What to avoid in image (optional)
 * @param params.high_res_results - 0 or 1 for high resolution (default: 1)
 *
 * @example
 * await call('ai.image.generate', {
 *   prompt: 'Beautiful Indonesian woman in traditional kebaya, Bali temple',
 *   style: 'realistic',
 *   aspect_ratio: '16:9'
 * })
 */
export async function aiImageGenerate(params) {
    try {
        const { prompt, style = 'realistic', aspect_ratio = '16:9', seed, negative_prompt, high_res_results = 1 } = params;
        if (!prompt) {
            throw new BadRequestError('Prompt is required for image generation');
        }
        logger.info('🎨 ai.image.generate called', {
            promptLength: prompt.length,
            style,
            aspect_ratio
        });
        const service = getImagineArtService();
        const request = {
            prompt,
            style,
            aspect_ratio,
            seed,
            negative_prompt,
            high_res_results
        };
        const result = await service.generateImage(request);
        return ok({
            image_url: result.image_url,
            request_id: result.request_id,
            prompt: result.prompt,
            style: result.style,
            aspect_ratio: result.aspect_ratio,
            metadata: {
                provider: 'Imagine.art',
                timestamp: new Date().toISOString(),
                seed: result.seed
            }
        });
    }
    catch (error) {
        logger.error('🔥 ai.image.generate failed:', error.message);
        throw new BadRequestError(`Image generation failed: ${error.message}`);
    }
}
/**
 * Upscale/enhance existing image using Imagine.art
 *
 * @param params.image - Image URL or base64 string to upscale (required)
 *
 * @example
 * await call('ai.image.upscale', {
 *   image: 'https://example.com/image.jpg'
 * })
 */
export async function aiImageUpscale(params) {
    try {
        const { image } = params;
        if (!image) {
            throw new BadRequestError('Image URL or base64 is required for upscaling');
        }
        logger.info('🔍 ai.image.upscale called');
        const service = getImagineArtService();
        const request = {
            image
        };
        const result = await service.upscaleImage(request);
        return ok({
            upscaled_url: result.upscaled_url,
            request_id: result.request_id,
            original_image: result.original_image,
            metadata: {
                provider: 'Imagine.art',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger.error('🔥 ai.image.upscale failed:', error.message);
        throw new BadRequestError(`Image upscale failed: ${error.message}`);
    }
}
/**
 * Test Imagine.art API connection
 */
export async function aiImageTest() {
    try {
        const service = getImagineArtService();
        const isConnected = await service.testConnection();
        return ok({
            available: isConnected,
            provider: 'Imagine.art',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger.error('🔥 ai.image.test failed:', error.message);
        return ok({
            available: false,
            error: error.message
        });
    }
}

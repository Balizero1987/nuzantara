/**
 * Imagine.art API Types
 * Image generation API integration for NUZANTARA v5.2.0
 */

export type ImagineArtStyle =
  | 'realistic'
  | 'anime'
  | 'flux-schnell'
  | 'flux-dev'
  | 'flux-dev-fast'
  | 'sdxl-1.0'
  | 'imagine-turbo';

export type ImagineArtAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';

export interface ImagineArtGenerateRequest {
  prompt: string;
  style?: ImagineArtStyle;
  aspect_ratio?: ImagineArtAspectRatio;
  seed?: number;
  negative_prompt?: string;
  high_res_results?: number; // 0 or 1
}

export interface ImagineArtGenerateResponse {
  image_url: string;
  request_id: string;
  prompt: string;
  style: string;
  aspect_ratio: string;
  seed?: number;
}

export interface ImagineArtUpscaleRequest {
  image: string; // URL or base64
}

export interface ImagineArtUpscaleResponse {
  upscaled_url: string;
  request_id: string;
  original_image: string;
}

export interface ImagineArtServiceConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

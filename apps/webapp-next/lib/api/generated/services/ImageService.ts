/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { ImageGenerationRequest } from '../models/ImageGenerationRequest';
import type { ImageGenerationResponse } from '../models/ImageGenerationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ImageService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Generate Image
   * Generate images using Google Imagen API
   *
   * Args:
   * request: Image generation request with prompt and parameters
   *
   * Returns:
   * ImageGenerationResponse with generated images or error
   * @param requestBody
   * @returns ImageGenerationResponse Successful Response
   * @throws ApiError
   */
  public generateImageApiV1ImageGeneratePost(
    requestBody: ImageGenerationRequest
  ): CancelablePromise<ImageGenerationResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1/image/generate',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
}

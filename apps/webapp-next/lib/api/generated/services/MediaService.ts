/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImagePrompt } from '../models/ImagePrompt';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MediaService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Generate Image
     * Generate an image from a text prompt.
     * @returns any Successful Response
     * @throws ApiError
     */
    public generateImageMediaGenerateImagePost({
        requestBody,
    }: {
        requestBody: ImagePrompt,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/media/generate-image',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}

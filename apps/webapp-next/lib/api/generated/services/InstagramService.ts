/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class InstagramService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Verify Webhook
   * Meta Webhook Verification Endpoint
   * @param hubMode
   * @param hubVerifyToken
   * @param hubChallenge
   * @returns any Successful Response
   * @throws ApiError
   */
  public verifyWebhookWebhookInstagramGet(
    hubMode: string,
    hubVerifyToken: string,
    hubChallenge: string
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/webhook/instagram',
      query: {
        'hub.mode': hubMode,
        'hub.verify_token': hubVerifyToken,
        'hub.challenge': hubChallenge,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Handle Webhook
   * Handle incoming Instagram messages
   * @returns any Successful Response
   * @throws ApiError
   */
  public handleWebhookWebhookInstagramPost(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/webhook/instagram',
    });
  }
}

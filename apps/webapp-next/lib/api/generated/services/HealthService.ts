/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { HealthResponse } from '../models/HealthResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class HealthService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Health Check
   * System health check - Non-blocking during startup.
   * Returns "initializing" immediately if service not ready.
   * Prevents container crashes during warmup by not creating heavy objects.
   * @returns HealthResponse Successful Response
   * @throws ApiError
   */
  public healthCheckHealthGet(): CancelablePromise<HealthResponse> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/health',
    });
  }
}

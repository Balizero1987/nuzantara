/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SearchQuery } from '../models/SearchQuery';
import type { SearchResponse } from '../models/SearchResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class KnowledgeService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Semantic Search
   * Semantic search with tier-based access control.
   *
   * - **query**: Search query text
   * - **level**: User access level (0-3)
   * - **limit**: Maximum results (1-50, default 5)
   * - **tier_filter**: Optional specific tier filter
   *
   * Returns relevant book chunks filtered by user's access level.
   * @param requestBody
   * @returns SearchResponse Successful Response
   * @throws ApiError
   */
  public semanticSearchApiSearchPost(requestBody: SearchQuery): CancelablePromise<SearchResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/search/',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Search Health
   * Quick health check for search service
   * @returns any Successful Response
   * @throws ApiError
   */
  public searchHealthApiSearchHealthGet(): CancelablePromise<Record<string, any>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/search/health',
    });
  }
}

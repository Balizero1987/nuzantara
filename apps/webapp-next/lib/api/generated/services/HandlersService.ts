/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class HandlersService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * List All Handlers
   * Returns complete registry of all available handlers
   * This is the master catalog that ZANTARA uses to see all available tools
   * @returns any Successful Response
   * @throws ApiError
   */
  public listAllHandlersApiHandlersListGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/handlers/list',
    });
  }
  /**
   * Search Handlers
   * Search handlers by name, path, or description
   * @param query
   * @returns any Successful Response
   * @throws ApiError
   */
  public searchHandlersApiHandlersSearchGet(query: string): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/handlers/search',
      query: {
        query: query,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Handlers By Category
   * Get all handlers in a specific category
   * @param category
   * @returns any Successful Response
   * @throws ApiError
   */
  public getHandlersByCategoryApiHandlersCategoryCategoryGet(
    category: string
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/handlers/category/{category}',
      path: {
        category: category,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
}

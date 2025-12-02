/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmbedRequest } from '../models/EmbedRequest';
import type { EmbedResponse } from '../models/EmbedResponse';
import type { InitRequest } from '../models/InitRequest';
import type { InitResponse } from '../models/InitResponse';
import type { MemorySearchResponse } from '../models/MemorySearchResponse';
import type { SearchMemoryRequest } from '../models/SearchMemoryRequest';
import type { SimilarMemoryRequest } from '../models/SimilarMemoryRequest';
import type { StoreMemoryRequest } from '../models/StoreMemoryRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MemoryService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Init Memory Collection
   * Reinitialize the semantic memory collection after deployments or resets.
   * @param requestBody
   * @returns InitResponse Successful Response
   * @throws ApiError
   */
  public initMemoryCollectionApiMemoryInitPost(
    requestBody: InitRequest
  ): CancelablePromise<InitResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/memory/init',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Generate Embedding
   * Generate embedding for text.
   * Uses sentence-transformers (FREE, local) by default.
   * @param requestBody
   * @returns EmbedResponse Successful Response
   * @throws ApiError
   */
  public generateEmbeddingApiMemoryEmbedPost(
    requestBody: EmbedRequest
  ): CancelablePromise<EmbedResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/memory/embed',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Store Memory Vector
   * Store memory in Qdrant for semantic search.
   *
   * Metadata should include:
   * - userId: User ID
   * - type: Memory type (profile, expertise, event, etc)
   * - timestamp: ISO timestamp
   * - entities: Comma-separated entities
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public storeMemoryVectorApiMemoryStorePost(
    requestBody: StoreMemoryRequest
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/memory/store',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Search Memories Semantic
   * Semantic search across all memories using vector similarity.
   *
   * Supports metadata filtering:
   * - userId: Filter by specific user
   * - entities: Filter by entity (use {"entities": {"$contains": "zero"}})
   * @param requestBody
   * @returns MemorySearchResponse Successful Response
   * @throws ApiError
   */
  public searchMemoriesSemanticApiMemorySearchPost(
    requestBody: SearchMemoryRequest
  ): CancelablePromise<MemorySearchResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/memory/search',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Find Similar Memories
   * Find memories similar to a given memory.
   * Uses the stored memory's embedding to find neighbors.
   * @param requestBody
   * @returns MemorySearchResponse Successful Response
   * @throws ApiError
   */
  public findSimilarMemoriesApiMemorySimilarPost(
    requestBody: SimilarMemoryRequest
  ): CancelablePromise<MemorySearchResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/memory/similar',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Delete Memory Vector
   * Delete memory from vector store
   * @param memoryId
   * @returns any Successful Response
   * @throws ApiError
   */
  public deleteMemoryVectorApiMemoryMemoryIdDelete(memoryId: string): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/memory/{memory_id}',
      path: {
        memory_id: memoryId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Memory Stats
   * Get memory collection statistics
   * @returns any Successful Response
   * @throws ApiError
   */
  public getMemoryStatsApiMemoryStatsGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/memory/stats',
    });
  }
  /**
   * Memory Vector Health
   * Health check for memory vector service
   * @returns any Successful Response
   * @throws ApiError
   */
  public memoryVectorHealthApiMemoryHealthGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/memory/health',
    });
  }
}

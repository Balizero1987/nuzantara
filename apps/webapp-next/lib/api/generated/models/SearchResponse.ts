/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { SearchResult } from './SearchResult';
/**
 * Search response model
 */
export type SearchResponse = {
  query: string;
  results: Array<SearchResult>;
  total_found: number;
  user_level: number;
  execution_time_ms: number;
};

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { TierLevel } from './TierLevel';
/**
 * Search request model
 */
export type SearchQuery = {
  /**
   * Search query text
   */
  query: string;
  /**
   * User access level (0-3)
   */
  level?: number;
  /**
   * Maximum results to return
   */
  limit?: number;
  /**
   * Filter by specific tiers
   */
  tier_filter?: Array<TierLevel> | null;
  /**
   * Optional specific collection to search
   */
  collection?: string | null;
};

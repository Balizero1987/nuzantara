/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { TierLevel } from './TierLevel';
/**
 * Request to ingest a single book
 */
export type BookIngestionRequest = {
  file_path: string;
  title?: string | null;
  author?: string | null;
  language?: string;
  tier_override?: TierLevel | null;
};

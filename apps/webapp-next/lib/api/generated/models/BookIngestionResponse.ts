/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { TierLevel } from './TierLevel';
/**
 * Response from book ingestion
 */
export type BookIngestionResponse = {
  success: boolean;
  book_title: string;
  book_author: string;
  tier: TierLevel;
  chunks_created: number;
  message: string;
  error?: string | null;
};

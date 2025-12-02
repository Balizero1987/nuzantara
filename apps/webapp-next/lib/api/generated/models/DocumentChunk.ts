/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single document chunk to ingest
 */
export type DocumentChunk = {
  /**
   * Document content (text)
   */
  content: string;
  /**
   * Metadata (law_id, pasal, category, type, etc.)
   */
  metadata: Record<string, any>;
};

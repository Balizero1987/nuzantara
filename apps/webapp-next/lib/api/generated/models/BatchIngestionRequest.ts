/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Request to ingest multiple books
 */
export type BatchIngestionRequest = {
  directory_path: string;
  file_patterns?: Array<string>;
  skip_existing?: boolean;
};

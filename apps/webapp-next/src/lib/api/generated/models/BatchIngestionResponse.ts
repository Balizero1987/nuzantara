/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookIngestionResponse } from './BookIngestionResponse';
/**
 * Response from batch ingestion
 */
export type BatchIngestionResponse = {
    total_books: number;
    successful: number;
    failed: number;
    results: Array<BookIngestionResponse>;
    execution_time_seconds: number;
};


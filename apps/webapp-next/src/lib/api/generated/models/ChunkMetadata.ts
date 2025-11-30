/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TierLevel } from './TierLevel';
/**
 * Metadata for each text chunk
 */
export type ChunkMetadata = {
    book_title: string;
    book_author: string;
    tier: TierLevel;
    min_level: number;
    chunk_index: number;
    page_number?: (number | null);
    language?: string;
    topics?: Array<string>;
    file_path: string;
    total_chunks: number;
};


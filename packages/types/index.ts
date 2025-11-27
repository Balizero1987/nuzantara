/**
 * @nuzantara/types
 * Shared TypeScript type definitions for the Nuzantara monorepo
 */

// Common types
export type UUID = string;
export type Timestamp = number;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = Array<JSONValue>;

// API types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Timestamp;
}

// User types (placeholder - extend as needed)
export interface User {
  id: UUID;
  email: string;
  name?: string;
  role: string;
  createdAt: Timestamp;
}

// Export all types
export * from './types/index.js';

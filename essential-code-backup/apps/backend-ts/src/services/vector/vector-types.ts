/**
 * ZANTARA Vector System Types
 * Type definitions for multi-provider vector backend architecture
 */

export type VectorBackend = 'chroma' | 'qdrant' | 'memory';

export interface VectorStore {
  name: string;
  ping(): Promise<boolean>;
  similaritySearch(
    query: number[],
    topK?: number
  ): Promise<Array<{ id: string; score: number; metadata?: any }>>;
  add?(vectors: Array<{ id: string; vector: number[]; metadata?: any }>): Promise<void>;
  delete?(ids: string[]): Promise<void>;
}

export interface VectorHealthCheck {
  backend: VectorBackend;
  status: 'healthy' | 'degraded' | 'offline';
  latency?: number;
  error?: string;
  lastCheck: string;
}

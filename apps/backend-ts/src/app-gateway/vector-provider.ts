/**
 * ZANTARA Vector Provider
 * Centralized adapter for vector backends.
 * Default: ChromaDB (official)
 * Standby: Qdrant
 * Fallback: Memory (in-RAM)
 */

import type { VectorStore, VectorBackend } from "../services/vector/types";

export function makeVectorStore(): VectorStore {
  const backend = (process.env.VECTOR_BACKEND ?? "chroma") as VectorBackend;

  if (backend === "chroma") {
    // Official vector backend
    return require("../services/vector/chroma").default();
  }

  if (backend === "qdrant") {
    // Standby backend
    return require("../services/vector/qdrant").default();
  }

  if (backend === "memory") {
    // Fallback local backend
    return require("../services/vector/memory-vector").default();
  }

  throw new Error(`Unsupported VECTOR_BACKEND=${backend}`);
}

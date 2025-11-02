/**
 * ZANTARA Vector Provider
 * Centralized adapter for vector backends.
 * Default: ChromaDB (official)
 * Standby: Qdrant (disabled until wired)
 */

import type { VectorStore, VectorBackend } from "../services/vector/types";

export function makeVectorStore(): VectorStore {
  const backend = (process.env.VECTOR_BACKEND ?? "chroma") as VectorBackend;

  if (backend === "chroma") {
    // Official vector backend
    return require("../services/vector/chroma").default();
  }

  if (backend === "qdrant") {
    // Placeholder — Qdrant in standby until wired
    return require("../services/vector/qdrant").default();
  }

  throw new Error(`Unsupported VECTOR_BACKEND=${backend}`);
}

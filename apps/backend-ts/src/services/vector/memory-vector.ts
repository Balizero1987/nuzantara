/**
 * ZANTARA Vector Adapter — Memory (fallback)
 * Local in-RAM vector store for offline/testing mode.
 */

import logger from '../logger';

export default function memoryVectorStore() {
  logger.info('✅ Memory vector store initialized');
  const vectors: Record<string, number[]> = {};

  logger.warn('⚠️ Using in-memory vector store — not persistent');

  return {
    name: 'memory',
    async ping() {
      logger.info('✅ Memory vector store active');
      return true;
    },

    async addVector(id: string, values: number[]) {
      vectors[id] = values;
      logger.debug(`Added vector ${id} (${values.length} dims)`);
      return true;
    },

    async getVector(id: string) {
      return vectors[id] ?? null;
    },

    async similaritySearch(query: number[], topK = 3) {
      const scores = Object.entries(vectors).map(([id, vec]) => {
        const dot = vec.reduce((acc, v, i) => acc + v * (query[i] || 0), 0);
        const normA = Math.sqrt(vec.reduce((a, v) => a + v * v, 0));
        const normB = Math.sqrt(query.reduce((a, v) => a + v * v, 0));
        const similarity = dot / (normA * normB || 1);
        return { id, similarity };
      });

      return scores.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
    },

    clear() {
      Object.keys(vectors).forEach((id) => delete vectors[id]);
      logger.info('🧹 Cleared in-memory vector store');
    },
  };
}

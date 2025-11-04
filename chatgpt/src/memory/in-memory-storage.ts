import {
  IMemoryStorage,
  UnifiedMemory,
  MemoryQuery,
  MemoryType,
  UnifiedMemorySchema,
} from './types.js';

/**
 * In-memory storage implementation (fallback when Redis unavailable)
 */
export class InMemoryStorage implements IMemoryStorage {
  private readonly memories: Map<string, UnifiedMemory> = new Map();
  private readonly typeIndex: Map<MemoryType, Set<string>> = new Map();
  private readonly tagIndex: Map<string, Set<string>> = new Map();

  constructor() {
    // Initialize type indexes
    for (const type of Object.values(MemoryType)) {
      this.typeIndex.set(type as MemoryType, new Set());
    }
  }

  /**
   * Get memory by ID
   */
  get(id: string): Promise<UnifiedMemory | null> {
    return Promise.resolve(this.memories.get(id) || null);
  }

  /**
   * Store memory with indexing
   */
  set(memory: UnifiedMemory): Promise<void> {
    // Validate memory
    const validated = UnifiedMemorySchema.parse(memory);

    // Store memory
    this.memories.set(validated.id, validated);

    // Update type index
    const typeSet = this.typeIndex.get(validated.type);
    if (typeSet) {
      typeSet.add(validated.id);
    }

    // Update tag indexes for episodic memories
    if (validated.type === MemoryType.EPISODIC && validated.metadata?.tags) {
      for (const tag of validated.metadata.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)?.add(validated.id);
      }
    }

    // Handle TTL for episodic memories
    if (validated.type === MemoryType.EPISODIC && validated.ttl) {
      setTimeout(() => {
        void this.delete(validated.id);
      }, validated.ttl * 1000);
    }

    return Promise.resolve();
  }

  /**
   * Delete memory by ID
   */
  delete(id: string): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) return Promise.resolve(false);

    // Remove from main storage
    this.memories.delete(id);

    // Remove from type index
    const typeSet = this.typeIndex.get(memory.type);
    if (typeSet) {
      typeSet.delete(id);
    }

    // Remove from tag indexes
    if (memory.type === MemoryType.EPISODIC && memory.metadata?.tags) {
      for (const tag of memory.metadata.tags) {
        this.tagIndex.get(tag)?.delete(id);
      }
    }

    return Promise.resolve(true);
  }

  /**
   * Query memories with filters
   * Refactored to reduce cognitive complexity.
   */
  query(query: MemoryQuery): Promise<UnifiedMemory[]> {
    const candidateIds = this.getCandidateIds(query);
    const filteredIds = this.filterByTags(candidateIds, query);
    return Promise.resolve(this.getFilteredResults(filteredIds, query));
  }

  private getCandidateIds(query: MemoryQuery): Set<string> {
    if (query.type) {
      return new Set(this.typeIndex.get(query.type) || []);
    }
    return new Set(this.memories.keys());
  }

  private filterByTags(candidateIds: Set<string>, query: MemoryQuery): Set<string> {
    if (!query.filters?.tags || query.filters.tags.length === 0) {
      return candidateIds;
    }

    const taggedIds = new Set<string>();
    for (const tag of query.filters.tags) {
      const ids = this.tagIndex.get(tag);
      if (ids) {
        for (const id of ids) {
          taggedIds.add(id);
        }
      }
    }
    return new Set([...candidateIds].filter((id) => taggedIds.has(id)));
  }

  private getFilteredResults(candidateIds: Set<string>, query: MemoryQuery): UnifiedMemory[] {
    const results: UnifiedMemory[] = [];

    for (const id of candidateIds) {
      if (results.length >= query.limit) break;

      const memory = this.memories.get(id);
      if (memory && this.matchesFilters(memory, query)) {
        results.push(memory);
      }
    }

    return results;
  }

  /**
   * Clear memories by type
   */
  clear(type?: MemoryType): Promise<number> {
    if (type) {
      const ids = this.typeIndex.get(type);
      if (!ids) return Promise.resolve(0);

      let count = 0;
      const deletePromises = Array.from(ids).map(async (id) => {
        if (await this.delete(id)) count++;
      });

      return Promise.all(deletePromises).then(() => count);
    } else {
      const count = this.memories.size;
      this.memories.clear();
      for (const set of this.typeIndex.values()) {
        set.clear();
      }
      this.tagIndex.clear();
      return Promise.resolve(count);
    }
  }

  /**
   * Count memories by type
   */
  count(type?: MemoryType): Promise<number> {
    if (type) {
      return Promise.resolve(this.typeIndex.get(type)?.size || 0);
    }
    return Promise.resolve(this.memories.size);
  }

  /**
   * Check if memory matches query filters
   */
  private matchesFilters(memory: UnifiedMemory, query: MemoryQuery): boolean {
    if (!query.filters) return true;

    const { startTime, endTime, userId, category } = query.filters;

    // Time-based filtering
    if ('timestamp' in memory) {
      if (startTime && memory.timestamp < startTime) return false;
      if (endTime && memory.timestamp > endTime) return false;
    }

    // User ID filtering
    if (userId && memory.type === MemoryType.EPISODIC && memory.metadata?.userId !== userId) {
      return false;
    }

    // Category filtering for semantic memories
    if (category && memory.type === MemoryType.SEMANTIC && memory.metadata?.category !== category) {
      return false;
    }

    return true;
  }
}

/**
 * Collective Memory Event Bus
 * Gestisce eventi memoria collettiva (work + personal)
 */
/* eslint-disable no-console */
/* global window, CustomEvent */

export class CollectiveMemoryEventBus {
  constructor() {
    this.listeners = new Map();
    this.memoryCache = new Map(); // Cache locale memorie
  }

  emit(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in collective memory handler for ${event}:`, error);
      }
    });
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  // Metodi specifici per memoria collettiva
  storeMemory(key, data) {
    this.memoryCache.set(key, { ...data, timestamp: Date.now() });
    this.emit('memory_stored', { key, data });
  }

  getMemory(key) {
    return this.memoryCache.get(key);
  }

  getAllMemories() {
    return Array.from(this.memoryCache.values());
  }
}

export const collectiveMemoryBus = new CollectiveMemoryEventBus();

// Expose globally
if (typeof window !== 'undefined') {
  window.collectiveMemoryBus = collectiveMemoryBus;

  // Event history
  collectiveMemoryBus.eventHistory = [];
  collectiveMemoryBus.maxHistory = 200; // Più grande per memoria collettiva

  const originalEmit = collectiveMemoryBus.emit.bind(collectiveMemoryBus);
  collectiveMemoryBus.emit = function (event, data) {
    // Store in history
    if (!this.eventHistory) {
      this.eventHistory = [];
    }
    this.eventHistory.push({ event, data, timestamp: Date.now() });
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Call original emit
    originalEmit(event, data);

    // Dispatch custom DOM event
    window.dispatchEvent(new CustomEvent(`collective-memory:${event}`, { detail: data }));
  };

  // Add getHistory method
  collectiveMemoryBus.getHistory = function (event = null) {
    if (!this.eventHistory) {
      return [];
    }
    if (event) {
      return this.eventHistory.filter((e) => e.event === event);
    }
    return this.eventHistory;
  };
}

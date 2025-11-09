/**
 * SSE Collective Memory Extension
 * Intercetta eventi memoria collettiva dal backend
 */
/* eslint-disable no-console */

import { collectiveMemoryBus } from '../core/collective-memory-event-bus.js';

export class SSECollectiveMemoryExtension {
  attach(sseClient) {
    if (typeof sseClient.sendMessageStream === 'function') {
      this.wrapSendMessageStream(sseClient);
    }

    if (sseClient.eventSource) {
      this.wrapEventSource(sseClient);
    }

    return sseClient;
  }

  wrapEventSource(client) {
    if (!client.eventSource || client._collectiveMemoryWrapped) return;

    const originalOnMessage = client.eventSource.onmessage;

    client.eventSource.onmessage = (event) => {
      if (originalOnMessage) {
        originalOnMessage.call(client.eventSource, event);
      }

      this.processCollectiveMemoryEvents(event);
    };

    client._collectiveMemoryWrapped = true;
  }

  wrapSendMessageStream(client) {
    const originalSendMessageStream = client.sendMessageStream.bind(client);

    client.sendMessageStream = async (query, callbacks = {}) => {
      const result = await originalSendMessageStream(query, callbacks);

      if (client.eventSource && !client.eventSource._collectiveMemoryWrapped) {
        this.wrapEventSource(client);
      }

      return result;
    };
  }

  /**
   * Processa eventi memoria collettiva da SSE
   */
  processCollectiveMemoryEvents(event) {
    try {
      const data = JSON.parse(event.data);

      // Memory stored event
      if (data.type === 'collective_memory_stored') {
        collectiveMemoryBus.storeMemory(data.memory_key, data);
        collectiveMemoryBus.emit('memory_stored', data);
      }

      // Memory retrieved event
      if (data.type === 'collective_memory_retrieved') {
        collectiveMemoryBus.emit('memory_retrieved', data);
      }

      // Relationship updated event
      if (data.type === 'relationship_updated') {
        collectiveMemoryBus.emit('relationship_updated', data);
      }

      // Profile updated event
      if (data.type === 'profile_updated') {
        collectiveMemoryBus.emit('profile_updated', data);
      }

      // Preference detected event
      if (data.type === 'preference_detected') {
        collectiveMemoryBus.emit('preference_detected', data);
      }

      // Milestone detected event
      if (data.type === 'milestone_detected') {
        collectiveMemoryBus.emit('milestone_detected', data);
      }

      // Memory consolidated event (LangGraph workflow)
      if (data.type === 'memory_consolidated') {
        collectiveMemoryBus.emit('memory_consolidated', data);
      }
    } catch (error) {
      // Ignora errori di parsing (ping, etc.)
      if (event.data && event.data.trim() && !event.data.startsWith(':')) {
        console.debug('SSE collective memory parse error (expected):', error.message);
      }
    }
  }
}

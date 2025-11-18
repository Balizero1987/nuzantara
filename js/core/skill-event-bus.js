/**
 * Skill Event Bus
 * Centralized event bus for skill detection and tracking
 */
export const skillEventBus = {
  _events: {},
  _history: [],

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(handler);
  },

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   */
  off(event, handler) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(h => h !== handler);
  },

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    // Store in history
    this._history.push({
      event,
      data,
      timestamp: Date.now()
    });

    // Keep history limited to last 100 events
    if (this._history.length > 100) {
      this._history = this._history.slice(-100);
    }

    // Trigger handlers
    if (!this._events[event]) return;
    this._events[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  },

  /**
   * Get event history
   * @param {string} event - Optional event name to filter by
   * @returns {Array} Array of event records
   */
  getHistory(event) {
    if (!event) {
      return this._history;
    }
    return this._history.filter(h => h.event === event);
  },

  /**
   * Clear event history
   */
  clearHistory() {
    this._history = [];
  }
};


/**
 * EventSource with Headers Support
 *
 * Polyfill for EventSource that supports custom headers (including Authorization).
 * This is necessary because native EventSource API doesn't support custom headers.
 *
 * Uses fetch API with ReadableStream to implement SSE with headers.
 */

export class EventSourceWithHeaders {
  constructor(url, options = {}) {
    this.url = url;
    this.headers = options.headers || {};
    this.withCredentials = options.withCredentials || false;

    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;

    this._abortController = null;
    this._reader = null;
    this._closed = false;

    this._connect();
  }

  async _connect() {
    try {
      this.readyState = 0; // CONNECTING

      this._abortController = new AbortController();

      const response = await fetch(this.url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.headers
        },
        credentials: this.withCredentials ? 'include' : 'same-origin',
        signal: this._abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }

      this._reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await this._reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            // Append to currentData (support multi-line data)
            if (currentData) {
              currentData += '\n' + line.slice(6);
            } else {
              currentData = line.slice(6);
            }
          } else if (line === '') {
            // Empty line indicates end of event - dispatch it
            if (currentData) {
              if (currentEvent === 'message' && this.onmessage) {
                this.onmessage({ data: currentData, type: 'message' });
              } else if (this._customListeners && this._customListeners.has(currentEvent)) {
                const handler = this._customListeners.get(currentEvent);
                handler({ data: currentData, type: currentEvent });
              }
            }
            currentEvent = 'message';
            currentData = '';
          }
        }
      }

      this.readyState = 2; // CLOSED
      if (this.onerror) {
        this.onerror({ type: 'error' });
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        // Connection was closed intentionally
        this.readyState = 2; // CLOSED
        return;
      }

      this.readyState = 2; // CLOSED
      if (this.onerror) {
        this.onerror({ type: 'error', error });
      }
    }
  }

  addEventListener(event, handler) {
    if (event === 'open') {
      this.onopen = handler;
    } else if (event === 'message') {
      this.onmessage = handler;
    } else if (event === 'error') {
      this.onerror = handler;
    } else {
      // Custom event types (status, metadata, etc.) - store for later
      if (!this._customListeners) {
        this._customListeners = new Map();
      }
      this._customListeners.set(event, handler);
    }
  }

  removeEventListener(event, handler) {
    if (event === 'open' && this.onopen === handler) {
      this.onopen = null;
    } else if (event === 'message' && this.onmessage === handler) {
      this.onmessage = null;
    } else if (event === 'error' && this.onerror === handler) {
      this.onerror = null;
    }
  }

  close() {
    if (this._closed) return;

    this._closed = true;
    this.readyState = 2; // CLOSED

    if (this._abortController) {
      this._abortController.abort();
    }

    if (this._reader) {
      this._reader.cancel();
    }
  }
}

// Export as default
export default EventSourceWithHeaders;

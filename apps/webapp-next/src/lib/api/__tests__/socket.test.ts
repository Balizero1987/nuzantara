/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: ((error: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection
    setTimeout(() => {
      this.onopen?.();
    }, 0);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send(_data: any) {
    // Mock send
  }
}

// Global variable to capture the latest socket instance
let latestMockSocket: MockWebSocket | null = null;

// Custom MockWebSocket that captures the instance
class CapturingMockWebSocket extends MockWebSocket {
  constructor(url: string) {
    super(url);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestMockSocket = this;
  }
}

describe('socketClient', () => {
  let socketClient: any;
  let mockGetToken: any;

  beforeEach(async () => {
    jest.resetModules(); // Reset modules to get fresh singleton
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mocks
    mockGetToken = jest.fn();
    jest.mock('../client', () => ({
      apiClient: {
        getToken: () => mockGetToken(),
      },
    }));

    // Mock WebSocket global
    (global as any).WebSocket = CapturingMockWebSocket;
    latestMockSocket = null;

    // Import module under test
    // We must require it
    const module = await import('../socket');
    const freshSocketClient = module.socketClient;
    socketClient = freshSocketClient;

    // Mock console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('connect', () => {
    it('should not connect without token', () => {
      mockGetToken.mockReturnValue(null);

      socketClient.connect();

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No token found'));
    });

    it('should connect when token is available', () => {
      mockGetToken.mockReturnValue('test-token');

      socketClient.connect();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Connecting'));
    });

    it('should not create multiple connections', () => {
      mockGetToken.mockReturnValue('test-token');

      socketClient.connect();
      socketClient.connect();

      // Should only log connecting once
      const connectingCalls = (console.log as jest.Mock).mock.calls.filter((call: any) =>
        call[0].includes('Connecting')
      );
      expect(connectingCalls.length).toBe(1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect and prevent reconnection', () => {
      mockGetToken.mockReturnValue('test-token');

      socketClient.connect();
      socketClient.disconnect();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Disconnected'));
    });

    it('should handle disconnect when not connected', () => {
      expect(() => socketClient.disconnect()).not.toThrow();
    });
  });

  describe('event handling', () => {
    it('should register event handlers with on()', () => {
      const handler = jest.fn();

      socketClient.on('test-event', handler);

      expect(() => socketClient.off('test-event', handler)).not.toThrow();
    });

    it('should remove event handlers with off()', () => {
      const handler = jest.fn();

      socketClient.on('test-event', handler);
      socketClient.off('test-event', handler);

      expect(() => socketClient.off('test-event', handler)).not.toThrow();
    });

    it('should handle off() for non-existent event', () => {
      const handler = jest.fn();
      expect(() => socketClient.off('non-existent', handler)).not.toThrow();
    });

    it('should allow multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      socketClient.on('multi-event', handler1);
      socketClient.on('multi-event', handler2);

      expect(() => {
        socketClient.off('multi-event', handler1);
        socketClient.off('multi-event', handler2);
      }).not.toThrow();
    });
  });

  describe('reconnection', () => {
    it('should attempt reconnection after disconnect (unless explicit)', async () => {
      mockGetToken.mockReturnValue('test-token');

      socketClient.connect();

      // Wait for connection
      jest.advanceTimersByTime(10);

      // Explicit disconnect should not trigger reconnection
      socketClient.disconnect();

      // Advance timers past reconnect interval
      jest.advanceTimersByTime(5000);

      // Should not see reconnecting message after explicit disconnect
      const reconnectCalls = (console.log as jest.Mock).mock.calls.filter((call: any) =>
        call[0].includes('Reconnecting')
      );
      expect(reconnectCalls.length).toBe(0);
    });

    it('should attempt reconnection after unexpected disconnect', () => {
      mockGetToken.mockReturnValue('test-token');
      socketClient.connect();
      jest.advanceTimersByTime(10);

      // Simulate unexpected disconnect
      if (latestMockSocket?.onclose) {
        latestMockSocket.readyState = MockWebSocket.CLOSED;
        latestMockSocket.onclose({ code: 1006 }); // Abnormal closure
      }

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Reconnecting'));

      // Advance past reconnect interval
      jest.advanceTimersByTime(3500);

      // Should attempt to connect again
      const connectingCalls = (console.log as jest.Mock).mock.calls.filter((call: any) =>
        call[0].includes('Connecting')
      );
      expect(connectingCalls.length).toBeGreaterThan(1);
    });
  });

  describe('message handling', () => {
    it('should trigger specific event handlers when message received', () => {
      mockGetToken.mockReturnValue('test-token');
      const handler = jest.fn();
      socketClient.on('chat_message', handler);

      socketClient.connect();
      jest.advanceTimersByTime(10);

      if (latestMockSocket?.onmessage) {
        latestMockSocket.onmessage({
          data: JSON.stringify({ type: 'chat_message', data: { text: 'Hello' } }),
        });
      }

      expect(handler).toHaveBeenCalledWith({ text: 'Hello' });
    });

    it('should trigger generic message handler when no specific handler exists', () => {
      mockGetToken.mockReturnValue('test-token');
      const genericHandler = jest.fn();
      socketClient.on('message', genericHandler);

      socketClient.connect();
      jest.advanceTimersByTime(10);

      if (latestMockSocket?.onmessage) {
        latestMockSocket.onmessage({
          data: JSON.stringify({ type: 'unknown_event', data: { foo: 'bar' } }),
        });
      }

      expect(genericHandler).toHaveBeenCalledWith({ type: 'unknown_event', data: { foo: 'bar' } });
    });

    it('should handle invalid JSON in message', () => {
      mockGetToken.mockReturnValue('test-token');
      socketClient.connect();
      jest.advanceTimersByTime(10);

      if (latestMockSocket?.onmessage) {
        latestMockSocket.onmessage({ data: 'not valid json {' });
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse message'),
        expect.any(Error)
      );
    });

    it('should call multiple handlers for same event type', () => {
      mockGetToken.mockReturnValue('test-token');
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      socketClient.on('multi_event', handler1);
      socketClient.on('multi_event', handler2);

      socketClient.connect();
      jest.advanceTimersByTime(10);

      if (latestMockSocket?.onmessage) {
        latestMockSocket.onmessage({ data: JSON.stringify({ type: 'multi_event', data: 'test' }) });
      }

      expect(handler1).toHaveBeenCalledWith('test');
      expect(handler2).toHaveBeenCalledWith('test');
    });

    it('should handle onerror event', () => {
      mockGetToken.mockReturnValue('test-token');
      socketClient.connect();
      jest.advanceTimersByTime(10);

      if (latestMockSocket?.onerror) {
        latestMockSocket.onerror(new Event('error'));
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(Event)
      );
    });

    it('should not trigger generic handler when specific handler exists', () => {
      mockGetToken.mockReturnValue('test-token');
      const specificHandler = jest.fn();
      const genericHandler = jest.fn();
      socketClient.on('specific_event', specificHandler);
      socketClient.on('message', genericHandler);

      socketClient.connect();
      jest.advanceTimersByTime(10);

      if (latestMockSocket?.onmessage) {
        latestMockSocket.onmessage({
          data: JSON.stringify({ type: 'specific_event', data: 'data' }),
        });
      }

      expect(specificHandler).toHaveBeenCalledWith('data');
      expect(genericHandler).not.toHaveBeenCalled();
    });
  });
});

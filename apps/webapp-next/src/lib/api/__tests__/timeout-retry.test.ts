import { fetchWithTimeout, fetchWithRetry } from '../chat';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Timeout and Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWithTimeout', () => {
    it('should complete request before timeout', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetchWithTimeout('https://api.example.com', {}, 5000);

      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('should pass options to fetch correctly', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      };

      await fetchWithTimeout('https://api.example.com', options, 5000);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true }),
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should use default timeout when not specified', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://api.example.com', {});

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('fetchWithRetry', () => {
    it('should succeed on first attempt without retries', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetchWithRetry('https://api.example.com', {}, 5000);

      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 502 errors', async () => {
      jest.useFakeTimers();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const errorResponse = { ok: false, status: 502 };
      const successResponse = { ok: true, status: 200 };

      mockFetch.mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      // First attempt completes immediately
      await Promise.resolve();

      // Advance past retry delay (1000ms)
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
      jest.useRealTimers();
    });

    it('should retry on 503 errors', async () => {
      jest.useFakeTimers();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const errorResponse = { ok: false, status: 503 };
      const successResponse = { ok: true, status: 200 };

      mockFetch.mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
      jest.useRealTimers();
    });

    it('should retry on 504 errors', async () => {
      jest.useFakeTimers();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const errorResponse = { ok: false, status: 504 };
      const successResponse = { ok: true, status: 200 };

      mockFetch.mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
      jest.useRealTimers();
    });

    it('should retry on network errors', async () => {
      jest.useFakeTimers();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const successResponse = { ok: true, status: 200 };

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
      jest.useRealTimers();
    });

    it('should not retry on abort (timeout) errors', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(abortError);

      await expect(fetchWithRetry('https://api.example.com', {}, 5000, 3)).rejects.toThrow(
        'Request timeout after 5000ms'
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded for network errors', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const networkError = new Error('Network error');

      mockFetch.mockRejectedValue(networkError);

      // With real timers, this test will wait for actual retry delays
      // Using maxRetries=1 to keep test fast (only 1s delay)
      await expect(fetchWithRetry('https://api.example.com', {}, 5000, 1)).rejects.toThrow(
        'Network error'
      );
      expect(mockFetch).toHaveBeenCalledTimes(2); // 1 initial + 1 retry

      consoleWarnSpy.mockRestore();
    }, 10000); // Increase timeout to account for retry delay

    it('should return 5xx response after max retries', async () => {
      jest.useFakeTimers();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorResponse = { ok: false, status: 503 };

      mockFetch.mockResolvedValue(errorResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 2);

      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);

      const response = await responsePromise;

      expect(response).toBe(errorResponse);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      consoleWarnSpy.mockRestore();
      jest.useRealTimers();
    });

    it('should not retry on 4xx errors', async () => {
      const errorResponse = { ok: false, status: 404 };

      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetchWithRetry('https://api.example.com', {}, 5000, 3);

      expect(response).toBe(errorResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 unauthorized', async () => {
      const errorResponse = { ok: false, status: 401 };

      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetchWithRetry('https://api.example.com', {}, 5000, 3);

      expect(response).toBe(errorResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

import { fetchWithTimeout, fetchWithRetry } from '../chat';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Timeout and Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetchWithTimeout', () => {
    it('should complete request before timeout', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const responsePromise = fetchWithTimeout('https://api.example.com', {}, 5000);
      jest.runAllTimers();
      const response = await responsePromise;

      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('should throw timeout error when request exceeds duration', async () => {
      // Simulate a fetch that never resolves
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 10000);
          })
      );

      const responsePromise = fetchWithTimeout('https://api.example.com', {}, 5000);

      // Advance timers to trigger abort
      jest.advanceTimersByTime(5001);

      await expect(responsePromise).rejects.toThrow('Request timeout after 5000ms');
    });

    it('should pass options to fetch correctly', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      };

      const responsePromise = fetchWithTimeout('https://api.example.com', options, 5000);
      jest.runAllTimers();
      await responsePromise;

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

      const responsePromise = fetchWithTimeout('https://api.example.com', {});
      jest.runAllTimers();
      await responsePromise;

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('fetchWithRetry', () => {
    it('should succeed on first attempt without retries', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000);
      jest.runAllTimers();
      const response = await responsePromise;

      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 502 errors', async () => {
      const errorResponse = { ok: false, status: 502 };
      const successResponse = { ok: true, status: 200 };

      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      // First attempt
      await jest.advanceTimersByTimeAsync(0);

      // Advance past retry delay (1000ms)
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 errors', async () => {
      const errorResponse = { ok: false, status: 503 };
      const successResponse = { ok: true, status: 200 };

      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 504 errors', async () => {
      const errorResponse = { ok: false, status: 504 };
      const successResponse = { ok: true, status: 200 };

      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff delays', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorResponse = { ok: false, status: 503 };
      const successResponse = { ok: true, status: 200 };

      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      // First attempt
      await jest.advanceTimersByTimeAsync(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // After 1s delay (first retry)
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // After 2s delay (second retry)
      await jest.advanceTimersByTimeAsync(2000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // After 4s delay (third retry)
      await jest.advanceTimersByTimeAsync(4000);
      expect(mockFetch).toHaveBeenCalledTimes(4);

      const response = await responsePromise;
      expect(response).toBe(successResponse);

      consoleWarnSpy.mockRestore();
    });

    it('should retry on network errors', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const successResponse = { ok: true, status: 200 };

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(successResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1000);

      const response = await responsePromise;

      expect(response).toBe(successResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
    });

    it('should not retry on timeout (AbortError)', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(abortError);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await jest.advanceTimersByTimeAsync(0);

      await expect(responsePromise).rejects.toThrow('Request timeout after 5000ms');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const networkError = new Error('Network error');

      mockFetch.mockRejectedValue(networkError);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 2);

      // Initial attempt + 2 retries
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);

      await expect(responsePromise).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries

      consoleWarnSpy.mockRestore();
    });

    it('should return 5xx response after max retries', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorResponse = { ok: false, status: 503 };

      mockFetch.mockResolvedValue(errorResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 2);

      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);

      const response = await responsePromise;

      expect(response).toBe(errorResponse);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      consoleWarnSpy.mockRestore();
    });

    it('should not retry on 4xx errors', async () => {
      const errorResponse = { ok: false, status: 404 };

      mockFetch.mockResolvedValueOnce(errorResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await jest.advanceTimersByTimeAsync(0);

      const response = await responsePromise;

      expect(response).toBe(errorResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 unauthorized', async () => {
      const errorResponse = { ok: false, status: 401 };

      mockFetch.mockResolvedValueOnce(errorResponse);

      const responsePromise = fetchWithRetry('https://api.example.com', {}, 5000, 3);

      await jest.advanceTimersByTimeAsync(0);

      const response = await responsePromise;

      expect(response).toBe(errorResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

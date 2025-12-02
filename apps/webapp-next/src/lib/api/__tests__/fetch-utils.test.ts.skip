/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { fetchWithRetry } from '../fetch-utils';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as any;
  });

  it('should return response on successful fetch', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'success' }),
    });

    const response = await fetchWithRetry('https://api.example.com/data');
    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx server errors', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

    const response = await fetchWithRetry('https://api.example.com/data', {
      retries: 3,
      retryDelay: 10, // Fast retry for tests
    });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should retry on network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const response = await fetchWithRetry('https://api.example.com/data', {
      retries: 2,
      retryDelay: 10,
    });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on 4xx client errors (except 408/429)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchWithRetry('https://api.example.com/data', { retries: 3 })).rejects.toThrow(
      'HTTP error! status: 404'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 Too Many Requests', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

    const response = await fetchWithRetry('https://api.example.com/data', {
      retries: 2,
      retryDelay: 10,
    });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      fetchWithRetry('https://api.example.com/data', {
        retries: 2,
        retryDelay: 10,
      })
    ).rejects.toThrow('HTTP error! status: 500');

    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

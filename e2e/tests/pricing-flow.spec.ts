/**
 * E2E Test: Pricing Flow
 * Tests official pricing retrieval and search
 */

import { test, expect } from '@playwright/test';

test.describe('Bali Zero Pricing Flow E2E', () => {
  const apiKey = process.env.API_KEY || 'test-api-key-12345';
  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';

  test('should retrieve all pricing data', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'bali.zero.pricing',
        params: {
          service_type: 'all',
          include_details: true,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty('official_notice');
    expect(data.data).toHaveProperty('single_entry_visas');
    expect(data.data).toHaveProperty('kitas_permits');
    expect(data.data).toHaveProperty('contact_info');
  });

  test('should search for specific service', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'bali.zero.pricing',
        params: {
          service_type: 'all',
          specific_service: 'Working KITAS',
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty('search_results');
  });

  test('should get quick price lookup', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'bali.zero.price',
        params: {
          service: 'C1 Tourism',
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty('service');
    expect(data.data).toHaveProperty('contact');
  });

  test('should include anti-hallucination notice', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'bali.zero.pricing',
        params: { service_type: 'visa' },
      },
    });

    const data = await response.json();

    expect(data.data.official_notice).toContain('Non generati da AI');
  });
});

/**
 * E2E Test: Memory Flow
 * Tests complete memory save/retrieve/search flow
 */

import { test, expect } from '@playwright/test';

test.describe('Memory Flow E2E', () => {
  const apiKey = process.env.API_KEY || 'test-api-key-12345';
  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  const testUserId = `e2e-user-${Date.now()}`;

  test('should save and retrieve user memory', async ({ request }) => {
    // Save memory
    const saveResponse = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'memory.save',
        params: {
          userId: testUserId,
          content: 'Client interested in PT PMA for restaurant business',
          type: 'service_interest',
        },
      },
    });

    expect(saveResponse.ok()).toBeTruthy();
    const saveData = await saveResponse.json();
    expect(saveData.ok).toBe(true);
    expect(saveData.data.saved).toBe(true);

    // Retrieve memory
    const retrieveResponse = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'memory.retrieve',
        params: {
          userId: testUserId,
        },
      },
    });

    expect(retrieveResponse.ok()).toBeTruthy();
    const retrieveData = await retrieveResponse.json();
    expect(retrieveData.ok).toBe(true);
    expect(retrieveData.data).toHaveProperty('content');
  });

  test('should search memories by query', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'memory.search',
        params: {
          query: 'restaurant',
          limit: 10,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});

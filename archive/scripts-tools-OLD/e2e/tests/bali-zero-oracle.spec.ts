/**
 * E2E Test: Bali Zero Oracle Simulation
 * Tests complete oracle simulation flow
 */

import { test, expect } from '@playwright/test';

test.describe('Bali Zero Oracle Simulation E2E', () => {
  const apiKey = process.env.API_KEY || 'test-api-key-12345';
  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';

  test('should simulate visa service successfully', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'oracle.simulate',
        params: {
          service: 'visa',
          scenario: 'B211A extension',
          urgency: 'normal',
          complexity: 'low',
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty('service');
    expect(data.data).toHaveProperty('successProbability');
    expect(data.data).toHaveProperty('recommendedTimeline');
    expect(data.data.checkpoints).toBeDefined();
  });

  test('should analyze company setup service', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'oracle.analyze',
        params: {
          service: 'company',
          complexity: 'high',
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty('focusAreas');
    expect(data.data).toHaveProperty('recommendations');
    expect(data.data).toHaveProperty('metrics');
  });

  test('should predict timeline for tax service', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        key: 'oracle.predict',
        params: {
          service: 'tax',
          urgency: 'normal',
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty('forecast');
    expect(data.data.forecast).toHaveProperty('totalDurationDays');
    expect(data.data.forecast).toHaveProperty('projectedCompletionDate');
    expect(data.data.checkpoints).toBeDefined();
  });

  test('should handle authentication failure', async ({ request }) => {
    const response = await request.post(`${baseUrl}/call`, {
      headers: {
        'x-api-key': 'invalid-key',
        'Content-Type': 'application/json',
      },
      data: {
        key: 'oracle.simulate',
        params: { service: 'visa' },
      },
    });

    expect(response.status()).toBe(401);
  });
});

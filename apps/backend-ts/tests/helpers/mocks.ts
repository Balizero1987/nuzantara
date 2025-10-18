import type { Request, Response } from 'express';
import { jest } from '@jest/globals';

/**
 * Create a mock Express Request object for testing
 */
export function createMockRequest(options: Partial<Request> = {}): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'GET',
    url: '/',
    path: '/',
    ...options,
  } as Partial<Request>;
}

/**
 * Create a mock Express Response object for testing
 */
export function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
    _headers: {},
    _data: null,
  };

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data: any) => {
    res._data = data;
    return res;
  });

  res.send = jest.fn((data: any) => {
    res._data = data;
    return res;
  });

  res.setHeader = jest.fn((key: string, value: string) => {
    res._headers[key] = value;
    return res;
  });

  res.getHeader = jest.fn((key: string) => {
    return res._headers[key];
  });

  res.end = jest.fn(() => {
    return res;
  });

  return res;
}

/**
 * Mock environment variables
 */
export function mockEnv(vars: Record<string, string>) {
  const originalEnv = { ...process.env };

  Object.assign(process.env, vars);

  return () => {
    process.env = originalEnv;
  };
}

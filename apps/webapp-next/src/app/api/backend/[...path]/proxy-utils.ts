/**
 * Backend Proxy Utilities
 * Extracted logic from route.ts for testability
 */

export interface ProxyRequestOptions {
  backendUrl: string;
  apiKey?: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function executeProxyRequest(options: ProxyRequestOptions): Promise<Response> {
  const { backendUrl, apiKey, method, headers = {}, body } = options;

  // Build headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add API key if available
  if (apiKey) {
    requestHeaders['X-API-Key'] = apiKey;
  }

  const response = await fetch(backendUrl, {
    method,
    headers: requestHeaders,
    body,
  });

  return response;
}

export function buildBackendUrl(
  baseUrl: string,
  pathSegments: string[],
  queryString: string
): string {
  const path = '/' + pathSegments.join('/');
  return `${baseUrl}${path}${queryString}`;
}

export function isStreamingResponse(contentType: string, path: string): boolean {
  return contentType.includes('text/event-stream') || path.includes('stream');
}


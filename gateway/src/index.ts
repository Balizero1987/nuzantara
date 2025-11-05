/**
 * NUZANTARA API Gateway
 * Unified endpoint for TypeScript and Python backends
 *
 * Routes:
 * - /auth/* → nuzantara-backend.fly.dev (TS)
 * - /oracle/simulate → nuzantara-backend.fly.dev (TS)
 * - /oracle/query → nuzantara-rag.fly.dev (Python)
 * - /search → nuzantara-rag.fly.dev (Python)
 * - /collections → nuzantara-rag.fly.dev (Python)
 */

interface Env {
  TS_BACKEND: string;
  PYTHON_BACKEND: string;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Determine which backend to route to
    let targetBackend = env.TS_BACKEND; // Default to TS backend

    // Routes that go to Python backend
    if (
      pathname.startsWith('/oracle/query') ||
      pathname.startsWith('/oracle/ingest') ||
      pathname.startsWith('/search') ||
      pathname.startsWith('/collections') ||
      pathname.startsWith('/rag/') ||
      pathname.startsWith('/bali-zero/chat') || // RAG chat endpoint
      pathname.startsWith('/query') ||
      pathname.startsWith('/api/query') || // Feature #10: RAG query endpoint
      pathname.startsWith('/api/semantic-search') ||
      pathname.startsWith('/api/oracle/ingest') ||
      pathname.startsWith('/api/oracle/query')
    ) {
      targetBackend = env.PYTHON_BACKEND;
    }

    // Construct target URL
    const targetUrl = targetBackend + pathname + url.search;

    // Clone request to allow modification
    const modifiedHeaders = new Headers(request.headers);

    // Add gateway identification header
    modifiedHeaders.set('X-Gateway', 'nuzantara-api-gateway');
    modifiedHeaders.set('X-Forwarded-Proto', 'https');

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.body,
        cf: {
          cacheTtl: pathname.startsWith('/search') ? 300 : undefined, // 5 min cache for search
          cacheEverything: pathname.startsWith('/collections'), // Cache collection listings
        },
      });

      // Add cache headers to response
      const responseHeaders = new Headers(response.headers);

      // Cache search and collection endpoints
      if (pathname.startsWith('/search') || pathname.startsWith('/collections')) {
        responseHeaders.set('Cache-Control', 'public, max-age=300'); // 5 min
      }

      // Add security headers
      responseHeaders.set('X-Content-Type-Options', 'nosniff');
      responseHeaders.set('X-Frame-Options', 'DENY');
      responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return new Response(
        JSON.stringify({
          error: 'Gateway error',
          message: errorMessage,
          backend: targetBackend,
          path: pathname,
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

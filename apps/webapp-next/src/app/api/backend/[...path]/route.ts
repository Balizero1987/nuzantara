/**
 * Backend Proxy API Route
 * Proxies all requests to the Nuzantara backend with proper authentication
 *
 * This solves:
 * 1. CORS issues (same-origin requests)
 * 2. Server-side API key injection
 * 3. Centralized error handling
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';
const API_KEY = process.env.NUZANTARA_API_KEY;

async function proxyRequest(
  request: NextRequest,
  method: string,
  pathSegments: string[]
): Promise<Response> {
  const path = '/' + pathSegments.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  const backendUrl = `${BACKEND_URL}${path}${queryString}`;

  console.log(`[Backend Proxy] ${method} ${path}`);

  // Get authorization from client request
  const authHeader = request.headers.get('Authorization');

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add API key if available (primary auth)
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  // Forward JWT token if present (secondary auth)
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    // Get request body for POST/PUT/PATCH
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const json = await request.json();
        body = JSON.stringify(json);
      } catch {
        // No body or invalid JSON
      }
    }

    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Backend Proxy] Error ${response.status}:`, errorText);

      return NextResponse.json(
        {
          error: `Backend error: ${response.statusText}`,
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Check if response is SSE (Server-Sent Events) for streaming
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream') || path.includes('stream')) {
      // Stream the response directly
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Return successful JSON response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Backend Proxy] Network error:', error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 503 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'GET', path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'POST', path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'PUT', path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'DELETE', path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'PATCH', path);
}

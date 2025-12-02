import { NextResponse } from 'next/server';

const API_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';

export async function POST(request: Request) {
  const API_KEY = process.env.NUZANTARA_API_KEY;

  if (!API_KEY) {
    console.error('[ChatAPI] NUZANTARA_API_KEY environment variable is required');
    return NextResponse.json(
      { error: 'Server configuration error: API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json() as any;
    const message = body.message;
    const conversationHistory = body.conversation_history || [];
    const metadata = body.metadata || {};

    const authHeader = request.headers.get('Authorization');
    console.log(
      '[ChatAPI] Stream request. Auth Header:',
      authHeader ? `${authHeader.substring(0, 15)}...` : 'Missing'
    );
    console.log('[ChatAPI] Full auth header:', authHeader);
    console.log('[ChatAPI] Conversation history length:', conversationHistory.length);
    console.log('[ChatAPI] Client metadata:', metadata);

    // Call the real backend API (Backend expects GET for streaming)
    const params = new URLSearchParams({
      query: message,
      stream: 'true',
      conversation_history: JSON.stringify(conversationHistory),
      client_locale: metadata.client_locale || 'en-US',
      client_timezone: metadata.client_timezone || 'UTC',
    });

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for streaming

    // Extract token from Authorization header
    const authValue = request.headers.get('Authorization');
    const token = authValue?.startsWith('Bearer ')
      ? authValue.substring(7) // Remove 'Bearer ' prefix
      : authValue || '';

    console.log('[ChatAPI] Extracted token:', token ? `${token.substring(0, 20)}...` : 'EMPTY');

    const response = await fetch(`${API_URL}/bali-zero/chat-stream?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY, // Primary auth method (fastest, bypasses DB)
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // Fallback to JWT if API key fails
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get detailed error message from backend
      const errorText = await response.text().catch(() => 'No error details');
      console.error('[ChatAPI] Backend error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: `${API_URL}/bali-zero/chat-stream`,
      });

      // Return more specific error message
      const errorMessage =
        response.status === 401
          ? 'Authentication failed. Please check your credentials.'
          : `Backend error: ${response.statusText || 'Service unavailable'}`;

      return NextResponse.json(
        { error: errorMessage, details: errorText },
        { status: response.status }
      );
    }

    // Return the streaming response from backend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[ChatAPI] Production stream error:', error);
    return NextResponse.json({ error: 'Failed to connect to AI service' }, { status: 500 });
  }
}

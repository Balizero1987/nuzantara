import { NextResponse } from 'next/server';

const API_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';
const API_KEY = process.env.NUZANTARA_API_KEY || 'zantara-secret-2024';
const BACKEND_TIMEOUT = 90000; // 90 seconds for streaming

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

  try {
    const body = await request.json();
    const message = body.message;
    const conversationHistory = body.conversation_history || [];

    const authHeader = request.headers.get('Authorization');
    console.log(
      '[ChatAPI] Stream request. Auth Header:',
      authHeader ? `${authHeader.substring(0, 15)}...` : 'Missing'
    );
    console.log('[ChatAPI] Conversation history length:', conversationHistory.length);

    // Call the real backend API (Backend expects GET for streaming)
    const params = new URLSearchParams({
      query: message,
      stream: 'true',
      conversation_history: JSON.stringify(conversationHistory),
    });

    const response = await fetch(`${API_URL}/bali-zero/chat-stream?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        Authorization: `Bearer ${request.headers.get('Authorization')?.replace('Bearer ', '') || ''}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[ChatAPI] Backend error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Backend service unavailable' },
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
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[ChatAPI] Backend request timeout');
      return NextResponse.json(
        { error: 'AI service is taking too long. Please try again.' },
        { status: 504 }
      );
    }

    console.error('[ChatAPI] Production stream error:', error);
    return NextResponse.json({ error: 'Failed to connect to AI service' }, { status: 500 });
  }
}

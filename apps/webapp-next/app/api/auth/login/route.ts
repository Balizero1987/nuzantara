import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, pin } = await req.json();

    // Get backend URL from environment
    const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';

    // Call backend authentication endpoint
    const response = await fetch(`${RAG_BACKEND_URL}/api/auth/team/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, pin }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Authentication failed' }));
      return NextResponse.json(
        { error: errorData.detail || 'Authentication failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the authentication response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

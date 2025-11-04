import redis from '@/lib/redis';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    // If no sessionId, create a new session
    if (!sessionId) {
      const newSessionId = generateUUID();
      await redis.set(
        `session:${newSessionId}`,
        JSON.stringify({
          id: newSessionId,
          createdAt: new Date().toISOString(),
          interactions: [],
          memory: {},
        }),
        { ex: 86400 } // 24 hour expiry
      );
      return Response.json({ sessionId: newSessionId });
    }

    // Retrieve existing session
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    return Response.json({ sessionId: session.id });
  } catch (error) {
    console.error('[v0] Session error:', error);
    return Response.json({ error: 'Failed to manage session' }, { status: 500 });
  }
}

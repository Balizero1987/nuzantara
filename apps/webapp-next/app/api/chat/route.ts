import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Proxy to Python Backend
  // We use the custom /bali-zero/chat-stream endpoint
  const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
  const backendUrl = `${RAG_BACKEND_URL}/bali-zero/chat-stream`;

  // Construct the query URL
  const query = encodeURIComponent(lastMessage.content);

  // Get token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authorization token required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.split(' ')[1];

  const response = await fetch(`${backendUrl}?query=${query}`, {
    method: 'GET', // The backend supports GET for SSE
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return new Response(await response.text(), { status: response.status });
  }

  // Transform the SSE stream from the backend to what Vercel AI SDK expects
  // The backend sends: data: {"type": "token", "data": "..."}
  // Vercel AI SDK expects just the text chunks for simple streaming, or we can use the stream directly
  // if we want to handle the protocol.

  // Simple transformation: Extract the "token" data and yield it
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const json = JSON.parse(dataStr);
              if (json.type === 'token' && json.data) {
                controller.enqueue(new TextEncoder().encode(json.data));
              } else if (json.type === 'error') {
                console.error('Backend Error:', json.data);
              }
            } catch {
              // Ignore parse errors for keep-alive or malformed lines
            }
          }
        }
      }
      controller.close();
    },
  });

  return new StreamingTextResponse(stream);
}

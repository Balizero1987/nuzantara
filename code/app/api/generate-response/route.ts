import { generateText } from 'ai';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const { text } = await generateText({
      model: 'groq/mixtral-8x7b-32768',
      prompt: prompt,
      temperature: 0.8,
      maxTokens: 120,
    });

    return Response.json({ response: text });
  } catch (error) {
    console.error('[v0] Error generating response:', error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

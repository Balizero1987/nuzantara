import OpenAI from 'openai';

export class AiClient {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  async ask(params: { input: string; system?: string; model?: string }) {
    const { input, system, model } = params;
    const response = await this.client.chat.completions.create({
      model: model ?? this.defaultModel,
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        { role: 'user' as const, content: input }
      ]
    });
    return {
      text: response.choices[0]?.message?.content ?? '',
      raw: response
    };
  }

  get chatCompletions() {
    return this.client.chat.completions;
  }
}

// Create default client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key',
});

export default function getOpenAIClient() {
  return openaiClient;
}

export { openaiClient };
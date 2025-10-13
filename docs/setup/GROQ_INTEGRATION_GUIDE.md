# 🚀 GROQ Integration for ChatGPT-Patch

## Overview
GROQ provides ultra-fast LLM inference with models like Mixtral and Llama. This guide explains how to integrate GROQ into the ChatGPT-Patch service.

## Environment Variables Added

```bash
# In .env file
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
GEMINI_MODEL_DEFAULT=models/gemini-2.0-flash-exp
```

## Code Integration Required

### 1. Create GROQ Service (`src/services/groqService.ts`)

```typescript
import Groq from 'groq-sdk';

export class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async chat(messages: any[], model = 'mixtral-8x7b-32768') {
    const completion = await this.client.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content;
  }
}
```

### 2. Add GROQ Handler (`src/handlers/groq.ts`)

```typescript
export const groqHandlers = {
  'groq.chat': async (params: any) => {
    const groqService = new GroqService();
    const response = await groqService.chat(params.messages);
    return { success: true, response };
  }
};
```

### 3. Update Gemini Service to use default model

In `src/services/geminiService.ts`:

```typescript
const model = process.env.GEMINI_MODEL_DEFAULT || 'models/gemini-1.5-flash';
```

## Available GROQ Models

- `mixtral-8x7b-32768` - Best quality/speed balance
- `llama3-70b-8192` - High quality
- `llama3-8b-8192` - Fastest
- `gemma2-9b-it` - Good for Italian/European languages

## Deployment

The Cloud Run service update failed due to Docker image architecture issues. To properly deploy:

1. **Rebuild the Docker image locally**:
```bash
docker build -t gcr.io/involuted-box-469105-r0/zantara-v520-chatgpt-patch:groq-enabled .
docker push gcr.io/involuted-box-469105-r0/zantara-v520-chatgpt-patch:groq-enabled
```

2. **Update Cloud Run with new image**:
```bash
gcloud run deploy zantara-v520-chatgpt-patch \
  --image gcr.io/involuted-box-469105-r0/zantara-v520-chatgpt-patch:groq-enabled \
  --region europe-west1 \
  --update-env-vars="GEMINI_MODEL_DEFAULT=models/gemini-2.0-flash-exp" \
  --update-secrets="GROQ_API_KEY=groq-api-key-2025:latest"
```

## Benefits

1. **Speed**: GROQ is 10-100x faster than OpenAI
2. **Cost**: Much cheaper for high-volume requests
3. **Quality**: Mixtral matches GPT-3.5 quality
4. **Redundancy**: Fallback option when other APIs fail

## Testing

```bash
curl -X POST https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "groq.chat",
    "params": {
      "messages": [{"role": "user", "content": "Hello GROQ!"}]
    }
  }'
```

## Notes

- GROQ API key is already in Secret Manager as `groq-api-key-2025`
- Production service already uses GROQ successfully
- ChatGPT-Patch needs Docker rebuild to add GROQ support due to image architecture mismatch
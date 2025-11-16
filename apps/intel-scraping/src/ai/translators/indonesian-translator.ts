import { OpenRouterClient, AI_MODELS } from '../openrouter-client';

export class IndonesianTranslator {
  constructor(private client: OpenRouterClient) {}

  async translate(
    text: string,
    direction: 'id-to-en' | 'en-to-id' = 'id-to-en'
  ): Promise<string> {

    const systemPrompt = direction === 'id-to-en'
      ? `You are a professional Indonesian to English translator specializing in legal and business documents.

Translation Guidelines:
1. Maintain formal tone for official documents
2. Keep Indonesian legal/business terms in parentheses when important
3. Translate currency amounts with both IDR and USD equivalent
4. Preserve document structure and formatting
5. Add clarifying notes for culture-specific terms

Important Terms:
- PT (Perseroan Terbatas) = Limited Liability Company
- PMA (Penanaman Modal Asing) = Foreign Investment Company
- NPWP = Tax Registration Number
- KITAS = Temporary Residence Permit
- OSS = Online Single Submission system`
      : `You are a professional English to Indonesian translator.
Translate naturally while maintaining clarity for business/legal contexts.`;

    const prompt = `Translate the following text from ${direction === 'id-to-en' ? 'Indonesian to English' : 'English to Indonesian'}:

${text}

Provide only the translation without any additional commentary.`;

    try {
      const { content } = await this.client.complete(
        prompt,
        AI_MODELS.GLM_AIR, // FREE model optimized for translation
        {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 4000
        }
      );

      return content.trim();

    } catch (error) {
      console.error('Translation failed:', error);

      // Fallback to Gemini Flash (also free)
      return this.translateWithGemini(text, direction);
    }
  }

  private async translateWithGemini(
    text: string,
    direction: 'id-to-en' | 'en-to-id'
  ): Promise<string> {
    const prompt = `Translate from ${direction === 'id-to-en' ? 'Indonesian to English' : 'English to Indonesian'}:
${text}`;

    const { content } = await this.client.complete(
      prompt,
      AI_MODELS.GEMINI_FLASH,
      { temperature: 0.3 }
    );

    return content.trim();
  }

  async translateBatch(
    texts: string[],
    direction: 'id-to-en' | 'en-to-id' = 'id-to-en'
  ): Promise<string[]> {

    // Batch small texts together to save API calls
    if (texts.length <= 3) {
      const combined = texts.map((t, i) => `[${i + 1}] ${t}`).join('\n\n');
      const translated = await this.translate(combined, direction);

      // Split back
      return translated.split(/\[\d+\]/).filter(t => t.trim()).map(t => t.trim());
    }

    // Process larger batches individually
    const results: string[] = [];
    for (const text of texts) {
      results.push(await this.translate(text, direction));
    }

    return results;
  }
}


import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
import { getCachedAI, setCachedAI } from "../../services/cacheProxy.js";
import { getHandlersList } from "../../utils/handlers-list.js";

// Lazy imports to reduce cold start and avoid failing when keys are missing
async function getOpenAI() {
  const mod = await import('openai');
  // Fix for dotenv truncation bug with long keys
  let apiKey = process.env.OPENAI_API_KEY_FULL || process.env.OPENAI_API_KEY || '';

  // Remove quotes if present
  apiKey = apiKey.replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === 'sk-....') {
    throw new Error('OPENAI_API_KEY not configured properly');
  }

  const OpenAI = (mod as any).default || (mod as any).OpenAI;
  return new OpenAI({ apiKey });
}

async function getAnthropic() {
  const mod = await import('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MY_KEY_CLAUDE || process.env.CLAUDE_API_KEY || '';
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const Anthropic = (mod as any).default || (mod as any).Anthropic;
  return new Anthropic({ apiKey });
}

async function getGemini() {
  const mod = await import('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const GoogleGenerativeAI = (mod as any).GoogleGenerativeAI;
  return new GoogleGenerativeAI(apiKey);
}

async function getCohere() {
  const mod = await import('cohere-ai');
  const apiKey = process.env.COHERE_API_KEY || '';
  if (!apiKey) throw new Error('COHERE_API_KEY not configured');
  const CohereClient = (mod as any).CohereClient;
  return new CohereClient({ token: apiKey });
}

// Utilities
function normalizePrompt(p?: string) {
  if (!p) return '';
  return p
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

function dynamicMaxTokens(promptLen: number) {
  if (process.env.AI_MAX_TOKENS) {
    const n = Number(process.env.AI_MAX_TOKENS);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  if (promptLen < 200) return 256;
  if (promptLen < 800) return 512;
  if (promptLen < 1600) return 768;
  return 1024;
}

// User identification check - REMOVED (no longer needed for web app)
// function checkUserIdentification(params: any) - REMOVED

// Shared ZANTARA context for unified responses
function zantaraContext(base?: string, userInfo?: string) {
  // Get dynamic list of available handlers
  let handlersInfo = '';
  try {
    handlersInfo = '\n\n' + getHandlersList();
  } catch (e) {
    console.warn('[zantaraContext] Failed to load handlers list:', e);
  }

  const intro = `You are ZANTARA, AI assistant for Bali Zero.

BALI ZERO - PT. BALI NOL IMPERSARIAT
📍 Kerobokan, Bali | 📱 WhatsApp: +62 859 0436 9574 | 📧 info@balizero.com | 📸 @balizero0
🌐 welcome.balizero.com | 💫 "From Zero to Infinity ∞"

IMPORTANT: You have access to complete knowledge base via RAG (ChromaDB) with:
- All Bali Zero services & exact pricing (17+ services)
- Visa & immigration procedures (KITAS, retirement, investor visas)
- Tax regulations (BPJS, SPT, NPWP, LKPM, all tax rates)
- Company setup (PT PMA, KBLI codes, capital requirements)
- Real estate (Hak Pakai, HGB, legal restrictions, due diligence)
- Indonesian legal codes & case law
- Complete packages (Startup, Hospitality, Villa Rental)

Use the RAG context provided to give accurate, specific answers with exact prices and timelines.

Key contact: WhatsApp +62 859 0436 9574 for custom quotes.

${handlersInfo}

CAPABILITIES: You can perform actions using the handlers listed above.
When a user asks about capabilities, refer to the handlers list.
Examples:
- "Can you save to memory?" → YES (memory.save handler)
- "Can you access Google Drive?" → YES (drive.* handlers)
- "Can you create calendar events?" → YES (calendar.create handler)

Respond professionally and concisely.`;
  const userContext = userInfo ? `\nUser: ${userInfo}` : '';
  return base ? `${intro}${userContext}\n\n${base}` : `${intro}${userContext}`;
}

export async function openaiChat(params: any) {
  const { prompt, message, context, model = 'gpt-4o-mini', userId, userEmail, userName, userIdentification } = params || {};
  const actualPrompt = prompt || message;
  if (!actualPrompt) throw new BadRequestError('prompt or message is required');

  // User identification check removed - no longer required

  try {
    const p = normalizePrompt(String(actualPrompt));
    const cached = await getCachedAI('openai', p);
    if (cached) return cached;
    const openai = await getOpenAI();

    const userInfo = userId || userEmail || userName || userIdentification;
    const messages = [
      { role: 'system', content: zantaraContext(context, userInfo) },
      { role: 'user', content: p }
    ];
    const resp = await openai.chat.completions.create({ model, messages, max_tokens: dynamicMaxTokens(p.length) });
    const out = ok({ response: resp.choices?.[0]?.message?.content || '', model, usage: resp.usage || null, ts: Date.now() });
    await setCachedAI('openai', p, out);
    return out;
  } catch (e: any) {
    // Fallback to Bridge if configured there
    const bridged = await forwardToBridgeIfSupported('openai.chat', params);
    if (bridged) return bridged;
    throw e;
  }
}

export async function claudeChat(params: any) {
  const { prompt, message, context, model = 'claude-3-haiku-20240307', max_tokens = 1024, userId, userEmail, userName, userIdentification } = params || {};
  const actualPrompt = prompt || message;
  if (!actualPrompt) throw new BadRequestError('prompt is required');

  // User identification check removed - no longer required

  try {
    const p = normalizePrompt(String(actualPrompt));
    const cached = await getCachedAI('claude', p);
    if (cached) return cached;

    // Try RAG first for Bali Zero queries
    let ragContext = '';
    try {
      const { ragService } = await import('../../services/ragService.js');
      const userInfo = userId || userEmail || userName || userIdentification;
      const ragResult: any = await ragService.baliZeroChat({
        query: p,
        conversation_history: [],
        user_role: 'member'
      });

      if (ragResult?.success && ragResult?.response) {
        // RAG has complete answer, return it directly
        const out = ok({ response: ragResult.response, model: ragResult.model_used || 'claude-rag', ts: Date.now(), sources: ragResult.sources });
        await setCachedAI('claude', p, out);
        return out;
      }
    } catch (ragError) {
      console.warn('RAG fallback to direct Claude:', ragError);
      // Continue with regular Claude if RAG fails
    }

    const anthropic = await getAnthropic();
    const userInfo = userId || userEmail || userName || userIdentification;
    const resp = await anthropic.messages.create({
      model,
      max_tokens: Math.min(max_tokens, dynamicMaxTokens(p.length)),
      system: zantaraContext(context + ragContext, userInfo),
      messages: [{ role: 'user', content: p }]
    });
    const text = Array.isArray((resp as any).content) && (resp as any).content[0]?.type === 'text' ? (resp as any).content[0].text : '';
    const out = ok({ response: text, model, ts: Date.now() });
    await setCachedAI('claude', p, out);
    return out;
  } catch (e: any) {
    const bridged = await forwardToBridgeIfSupported('claude.chat', params);
    if (bridged) return bridged;
    throw e;
  }
}

export async function geminiChat(params: any) {
  const { prompt, message, context, model = 'gemini-2.0-flash', userId, userEmail, userName, userIdentification } = params || {};
  const actualPrompt = prompt || message;
  if (!actualPrompt) throw new BadRequestError('prompt is required');

  // User identification check removed - no longer required

  try {
    const p = normalizePrompt(String(actualPrompt));
    const cached = await getCachedAI('gemini', p);
    if (cached) return cached;

    // Try RAG first for Bali Zero queries
    let ragContext = '';
    try {
      const { ragService } = await import('../../services/ragService.js');
      const ragResult: any = await ragService.baliZeroChat({
        query: p,
        conversation_history: [],
        user_role: 'member'
      });

      if (ragResult?.success && ragResult?.response) {
        const out = ok({ response: ragResult.response, model: ragResult.model_used || 'gemini-rag', ts: Date.now(), sources: ragResult.sources });
        await setCachedAI('gemini', p, out);
        return out;
      }
    } catch (ragError) {
      console.warn('RAG fallback:', ragError);
    }

    const gemini = await getGemini();
    const genModel = gemini.getGenerativeModel({ model });

    const userInfo = userId || userEmail || userName || userIdentification;
    const fullPrompt = context ? `${zantaraContext(context + ragContext, userInfo)}\n\n${p}` : `${zantaraContext(ragContext, userInfo)}\n\n${p}`;
    const result = await genModel.generateContent(fullPrompt);
    let text = '';
    try {
      const r: any = (result as any).response;
      if (r && typeof r.text === 'function') {
        text = await r.text();
      }
      if ((!text || text.trim().length === 0) && Array.isArray(r?.candidates)) {
        const parts = r.candidates[0]?.content?.parts || [];
        text = parts.map((p: any) => p?.text).filter(Boolean).join(' ').trim();
      }
    } catch {}
    if (!text || text.trim().length === 0) {
      // REST fallback across versions/models
      const restText = await tryGeminiRest(fullPrompt, model);
      if (restText) text = restText;
    }
    if (!text || text.trim().length === 0) {
      text = '[Gemini] No content returned';
    }
    const out = ok({ response: text, model, ts: Date.now() });
    await setCachedAI('gemini', p, out);
    return out;
  } catch (e: any) {
    // Fallback: try Claude or OpenAI before bridge
    try {
      if (process.env.ANTHROPIC_API_KEY || process.env.MY_KEY_CLAUDE || process.env.CLAUDE_API_KEY) {
        return await claudeChat({ ...params, prompt: actualPrompt, model: 'claude-3-haiku-20240307' });
      }
    } catch {}
    try {
      if (process.env.OPENAI_API_KEY_FULL || process.env.OPENAI_API_KEY) {
        return await openaiChat({ ...params, prompt: actualPrompt, model: 'gpt-4o-mini' });
      }
    } catch {}
    const bridged = await forwardToBridgeIfSupported('gemini.chat', params);
    if (bridged) return bridged;
    throw e;
  }
}

async function tryGeminiRest(fullPrompt: string, preferredModel?: string): Promise<string | null> {
  try {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!key) return null;
    const versions = ['v1', 'v1beta'];
    const candidates = Array.from(new Set([
      preferredModel,
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-pro'
    ].filter(Boolean))) as string[];
    const body = {
      contents: [ { role: 'user', parts: [ { text: fullPrompt } ] } ]
    } as any;
    for (const v of versions) {
      for (const m of candidates) {
        const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
        try {
          const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (!resp.ok) continue;
          const data: any = await resp.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const text = parts.map((p: any) => p?.text).filter(Boolean).join(' ').trim();
          if (text) return text;
        } catch {}
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function cohereChat(params: any) {
  const { prompt, message, context, model = 'command-r-08-2024', temperature = 0.7, userId, userEmail, userName, userIdentification } = params || {};
  const actualPrompt = prompt || message;
  if (!actualPrompt) throw new BadRequestError('prompt is required');

  // User identification check removed - no longer required

  try {
    const p = normalizePrompt(String(actualPrompt));
    const cached = await getCachedAI('cohere', p);
    if (cached) return cached;
    const cohere = await getCohere();

    const userInfo = userId || userEmail || userName || userIdentification;
    const preamble = zantaraContext(context, userInfo);
    const resp = await cohere.chat({ model, message: p, preamble, temperature });
    const out = ok({ response: (resp as any).text || '', model, ts: Date.now() });
    await setCachedAI('cohere', p, out);
    return out;
  } catch (e: any) {
    const bridged = await forwardToBridgeIfSupported('cohere.chat', params);
    if (bridged) return bridged;
    throw e;
  }
}

export async function aiChat(params: any) {
  const { provider = 'auto', userId, userEmail, userName, userIdentification } = params || {};

  // User identification check removed - no longer required

  const prov = String(provider || 'auto').toLowerCase();
  if (prov === 'openai') return openaiChat(params);
  if (prov === 'claude' || prov === 'anthropic') return claudeChat(params);
  if (prov === 'gemini' || prov === 'google') return geminiChat(params);
  if (prov === 'cohere') return cohereChat(params);

  // auto: preferenze basate sulla disponibilità chiavi
  const availability = {
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
    cohere: !!process.env.COHERE_API_KEY,
  };
  // Premium routing: qualità massima per clienti e collaboratori
  const text = normalizePrompt(String(params?.prompt || ''));
  const isCustomer = params?.context?.includes('cliente') || params?.context?.includes('customer');
  const isInternal = params?.context?.includes('AMBARADAM') || params?.context?.includes('collaborator');
  const isAnalytical = /analy(s|z)e|compare|reason|explain|why|because|breakdown|steps/i.test(text);
  const isCode = /code|function|class|api|typescript|javascript|regex|sql|bug/i.test(text);
  const isCreative = /story|slogan|marketing|post|article|blog|poem|creative/i.test(text);
  const isTranslate = /translate|traduci|translation|from .* to/i.test(text);
  const isLong = text.length > 800;

  try {
    // Premium routing per qualità massima
    if (isCustomer) {
      // Clienti: sempre il meglio disponibile
      if (availability.openai) return openaiChat({ ...params, model: 'gpt-4o' });
      if (availability.claude) return claudeChat({ ...params, model: 'claude-3-sonnet-20240229' });
    }
    if (isInternal) {
      // Collaboratori: comprensione profonda
      if (availability.claude) return claudeChat({ ...params, model: 'claude-3-opus-20240229' });
      if (availability.openai) return openaiChat({ ...params, model: 'gpt-4-turbo-preview' });
    }

    // Task-specific routing ottimizzato
    if (process.env.AI_ROUTER_STRICT === 'true') {
      if ((isCode || isAnalytical) && availability.gemini) return geminiChat(params);
      if (isCreative && availability.claude) return claudeChat(params);
      if (isTranslate && availability.openai) return openaiChat(params);
      if (isLong && availability.openai) return openaiChat(params);
    }

    // Fallback prioritization (qualità comunque alta)
    if (availability.openai) return openaiChat({ ...params, model: 'gpt-4o-mini' });
    if (availability.claude) return claudeChat({ ...params, model: 'claude-3-haiku-20240307' });
    if (availability.gemini) return geminiChat(params);
    if (availability.cohere) return cohereChat(params);
  } catch (_e) {
    // handled in each provider (fallback to bridge)
  }
  // Nessuna chiave configurata: prova il Bridge legacy se disponibile
  const bridged = await forwardToBridgeIfSupported('ai.chat', params);
  if (bridged) return bridged;
  throw new BadRequestError('No AI provider available');
}

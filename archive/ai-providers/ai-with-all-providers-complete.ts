import { ok } from "../../utils/response.js";
import { cleanMarkdown, toPlainIfEnabled } from "../../utils/text.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
import { getCachedAI, setCachedAI } from "../../services/cacheProxy.js";
import { getHandlersList } from "../../utils/handlers-list.js";
import { zantaraChat, isZantaraAvailable } from "./zantara-llama.js";

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

// Team member recognition database
const TEAM_RECOGNITION = {
  // Leadership
  'zainal': {
    id: 'zainal',
    name: 'Zainal Abidin',
    role: 'CEO',
    email: 'zainal@balizero.com',
    department: 'management',
    language: 'Indonesian',
    aliases: ['zainal', 'saya zainal', 'halo saya zainal', 'sono zainal'],
    personalizedResponse: "Selamat datang kembali Zainal! Sebagai CEO, Anda memiliki akses penuh ke semua sistem Bali Zero dan ZANTARA."
  },
  'ruslana': {
    id: 'ruslana',
    name: 'Ruslana',
    role: 'Board Member',
    email: 'ruslana@balizero.com',
    department: 'management',
    language: 'English',
    aliases: ['ruslana', 'i am ruslana', 'my name is ruslana', 'sono ruslana'],
    personalizedResponse: "Welcome back Ruslana! As a Board Member, you have full access to all Bali Zero systems."
  },

  // Technology & AI
  'zero': {
    id: 'zero',
    name: 'Zero',
    role: 'AI Bridge/Tech Lead',
    email: 'zero@balizero.com',
    department: 'technology',
    language: 'Italian',
    aliases: ['zero', 'sono zero', "i'm zero", 'io sono zero', 'ciao sono zero'],
    personalizedResponse: "Ciao Zero! Bentornato. Come capo del team tech, hai accesso completo a tutti i sistemi ZANTARA e Bali Zero."
  },

  // Setup Team - Indonesian
  'amanda': {
    id: 'amanda',
    name: 'Amanda',
    role: 'Executive Consultant',
    email: 'amanda@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['amanda', 'saya amanda', 'halo saya amanda'],
    personalizedResponse: "Selamat datang Amanda! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero."
  },
  'anton': {
    id: 'anton',
    name: 'Anton',
    role: 'Executive Consultant',
    email: 'anton@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['anton', 'saya anton', 'halo saya anton'],
    personalizedResponse: "Selamat datang Anton! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero."
  },
  'vino': {
    id: 'vino',
    name: 'Vino',
    role: 'Junior Consultant',
    email: 'vino@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['vino', 'saya vino', 'halo saya vino'],
    personalizedResponse: "Selamat datang Vino! Sebagai Junior Consultant, Anda dapat mengakses sistem Bali Zero."
  },
  'krisna': {
    id: 'krisna',
    name: 'Krisna',
    role: 'Executive Consultant',
    email: 'krisna@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['krisna', 'saya krisna', 'halo saya krisna'],
    personalizedResponse: "Selamat datang Krisna! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero."
  },
  'adit': {
    id: 'adit',
    name: 'Adit',
    role: 'Crew Lead',
    email: 'adit@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['adit', 'saya adit', 'halo saya adit'],
    personalizedResponse: "Selamat datang Adit! Sebagai Crew Lead, Anda dapat mengakses semua sistem Bali Zero."
  },
  'ari': {
    id: 'ari',
    name: 'Ari',
    role: 'Specialist Consultant',
    email: 'ari@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['ari', 'saya ari', 'halo saya ari'],
    personalizedResponse: "Selamat datang Ari! Sebagai Specialist Consultant, Anda dapat mengakses semua sistem Bali Zero."
  },
  'dea': {
    id: 'dea',
    name: 'Dea',
    role: 'Executive Consultant',
    email: 'dea@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['dea', 'saya dea', 'halo saya dea'],
    personalizedResponse: "Selamat datang Dea! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero."
  },
  'surya': {
    id: 'surya',
    name: 'Surya',
    role: 'Specialist Consultant',
    email: 'surya@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['surya', 'saya surya', 'halo saya surya'],
    personalizedResponse: "Selamat datang Surya! Sebagai Specialist Consultant, Anda dapat mengakses semua sistem Bali Zero."
  },
  'damar': {
    id: 'damar',
    name: 'Damar',
    role: 'Junior Consultant',
    email: 'damar@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['damar', 'saya damar', 'halo saya damar'],
    personalizedResponse: "Selamat datang Damar! Sebagai Junior Consultant, Anda dapat mengakses sistem Bali Zero."
  },

  // Tax Department
  'veronika': {
    id: 'veronika',
    name: 'Veronika',
    role: 'Tax Manager',
    email: 'veronika@balizero.com',
    department: 'tax',
    language: 'Ukrainian',
    aliases: ['veronika', 'я вероніка', 'i am veronika', 'sono veronika'],
    personalizedResponse: "Ласкаво просимо Вероніка! Як Tax Manager, у вас є повний доступ до всіх систем Bali Zero."
  },
  'olena': {
    id: 'olena',
    name: 'Olena',
    role: 'External Tax Advisory',
    email: 'olena@balizero.com',
    department: 'tax',
    language: 'Ukrainian',
    aliases: ['olena', 'я олена', 'i am olena', 'sono olena'],
    personalizedResponse: "Ласкаво просимо Олена! Як External Tax Advisory, у вас є доступ до систем Bali Zero."
  },
  'angel': {
    id: 'angel',
    name: 'Angel',
    role: 'Tax Expert',
    email: 'angel@balizero.com',
    department: 'tax',
    language: 'English',
    aliases: ['angel', 'i am angel', 'my name is angel', 'sono angel'],
    personalizedResponse: "Welcome Angel! As Tax Expert, you have access to all Bali Zero systems."
  },
  'kadek': {
    id: 'kadek',
    name: 'Kadek',
    role: 'Tax Consultant',
    email: 'kadek@balizero.com',
    department: 'tax',
    language: 'Indonesian',
    aliases: ['kadek', 'saya kadek', 'halo saya kadek'],
    personalizedResponse: "Selamat datang Kadek! Sebagai Tax Consultant, Anda dapat mengakses sistem Bali Zero."
  },
  'dewaayu': {
    id: 'dewaayu',
    name: 'Dewa Ayu',
    role: 'Tax Consultant',
    email: 'dewaayu@balizero.com',
    department: 'tax',
    language: 'Indonesian',
    aliases: ['dewa ayu', 'dewaayu', 'saya dewa ayu', 'halo saya dewa ayu'],
    personalizedResponse: "Selamat datang Dewa Ayu! Sebagai Tax Consultant, Anda dapat mengakses sistem Bali Zero."
  },
  'faisha': {
    id: 'faisha',
    name: 'Faisha',
    role: 'Tax Care',
    email: 'faisha@balizero.com',
    department: 'tax',
    language: 'Indonesian',
    aliases: ['faisha', 'saya faisha', 'halo saya faisha'],
    personalizedResponse: "Selamat datang Faisha! Sebagai Tax Care, Anda dapat mengakses sistem Bali Zero."
  },

  // Reception & Marketing
  'rina': {
    id: 'rina',
    name: 'Rina',
    role: 'Reception',
    email: 'rina@balizero.com',
    department: 'reception',
    language: 'Indonesian',
    aliases: ['rina', 'saya rina', 'halo saya rina'],
    personalizedResponse: "Selamat datang Rina! Sebagai Reception, Anda dapat mengakses sistem Bali Zero."
  },
  'nina': {
    id: 'nina',
    name: 'Nina',
    role: 'Marketing Advisory',
    email: 'nina@balizero.com',
    department: 'marketing',
    language: 'English',
    aliases: ['nina', 'i am nina', 'my name is nina', 'sono nina'],
    personalizedResponse: "Welcome Nina! As Marketing Advisory, you have access to all Bali Zero systems."
  },
  'sahira': {
    id: 'sahira',
    name: 'Sahira',
    role: 'Marketing Specialist',
    email: 'sahira@balizero.com',
    department: 'marketing',
    language: 'Indonesian',
    aliases: ['sahira', 'saya sahira', 'halo saya sahira'],
    personalizedResponse: "Selamat datang Sahira! Sebagai Marketing Specialist, Anda dapat mengakses sistem Bali Zero."
  },
  'marta': {
    id: 'marta',
    name: 'Marta',
    role: 'External Advisory',
    email: 'marta@balizero.com',
    department: 'advisory',
    language: 'Italian',
    aliases: ['marta', 'sono marta', 'ciao sono marta', 'i am marta'],
    personalizedResponse: "Ciao Marta! Benvenuta. Come External Advisory, hai accesso ai sistemi Bali Zero."
  }
};

// Context memory for conversations
const conversationContext = new Map<string, any>();

// Check for identity recognition in prompt
function checkIdentityRecognition(prompt: string, sessionId: string = 'default'): string | null {
  const lowerPrompt = prompt.toLowerCase().trim();

  // Get or create session context
  let context = conversationContext.get(sessionId) || {
    user: null,
    history: [],
    preferences: {}
  };

  // Check for identity declaration
  for (const [, member] of Object.entries(TEAM_RECOGNITION)) {
    for (const alias of member.aliases) {
      if (lowerPrompt.includes(alias)) {
        context.user = member;
        conversationContext.set(sessionId, context);

        // Log recognition
        console.log(`🎯 Identity recognized: ${member.name} (${member.role}) - session: ${sessionId}`);

        return member.personalizedResponse;
      }
    }
  }

  return null;
}

// Get user context for personalization
function getUserContext(sessionId: string = 'default'): any {
  const context = conversationContext.get(sessionId);
  if (context && context.user) {
    return {
      name: context.user.name,
      role: context.user.role,
      department: context.user.department,
      language: context.user.language
    };
  }
  return null;
}

// Simplified ZANTARA context - ZANTARA-ONLY mode
function zantaraContext(base?: string, userInfo?: string, userLanguage?: string) {
  let intro = `You are ZANTARA, the AI assistant for Bali Zero.

BALI ZERO - PT. BALI NOL IMPERSARIAT
Location: Kerobokan, Bali | WhatsApp: +62 859 0436 9574 | Email: info@balizero.com

You help with:
- Visa & immigration (KITAS, KITAP, retirement visas)
- Tax services (BPJS, NPWP, SPT, LKPM)
- Company setup (PT PMA, KBLI codes)
- Real estate (Hak Pakai, HGB)
- Business consulting

Keep responses natural, helpful, and concise. Use the same language as the user.`;
  const plain = process.env.ZANTARA_PLAIN_TEXT === '1' || process.env.ZANTARA_PLAIN_TEXT === 'true' || process.env.ZANTARA_OUTPUT_FORMAT === 'plain';
  if (plain) {
    intro = cleanMarkdown(intro);
  }
  const userContext = userInfo ? `\nUser: ${userInfo}` : '';
  const languageContext = userLanguage ? `\n\nIMPORTANT: Always respond in ${userLanguage}. This user speaks ${userLanguage}, so all your responses must be in ${userLanguage}.` : '';
  return base ? `${intro}${userContext}${languageContext}\n\n${base}` : `${intro}${userContext}${languageContext}`;
}

// ARCHIVED: OpenAI function removed - ZANTARA-ONLY mode

// ARCHIVED: Claude function removed - ZANTARA-ONLY mode
export async function claudeChat_ARCHIVED(params: any) {
  const { prompt, message, context, model = 'claude-3-haiku-20240307', max_tokens = 1024, userId, userEmail, userName, userIdentification, sessionId } = params || {};
  const actualPrompt = prompt || message;
  if (!actualPrompt) throw new BadRequestError('prompt is required');

  try {
    const p = normalizePrompt(String(actualPrompt));

    // Check for identity recognition FIRST (before cache or RAG)
    const identityResponse = checkIdentityRecognition(p, sessionId || userId || userEmail || 'default');
    if (identityResponse) {
      console.log(`✅ Returning personalized greeting for recognized user`);
      return ok({ response: identityResponse, recognized: true, ts: Date.now() });
    }

    const cached = await getCachedAI('claude', p);
    if (cached) return cached;

    // Try RAG first for Bali Zero queries
    let ragContext = '';
    try {
      const { ragService } = await import('../../services/ragService.js');
      // FIX: Remove unused variable
      // const userInfo = userId || userEmail || userName || userIdentification;

      // Get user context for personalization
      const userCtx = getUserContext(sessionId || userId || userEmail || 'default');
      const userRole: 'member' | 'lead' = userCtx && (userCtx.role === 'CEO' || userCtx.role === 'Bridge/Tech Lead') ? 'lead' : 'member';

      const ragResult: any = await ragService.baliZeroChat({
        query: p,
        conversation_history: [],
        user_role: userRole
      });

      if (ragResult?.success && ragResult?.response) {
        const cleaned = toPlainIfEnabled(ragResult.response);
        const out = ok({ response: cleaned, model: ragResult.model_used || 'claude-rag', ts: Date.now(), sources: ragResult.sources });
        await setCachedAI('claude', p, out);
        return out;
      }
    } catch (ragError) {
      console.warn('RAG fallback to direct Claude:', ragError);
      // Continue with regular Claude if RAG fails
    }

    const anthropic = await getAnthropic();
    const userInfo = userId || userEmail || userName || userIdentification;

    // Add recognized user context to system prompt
    const userCtx = getUserContext(sessionId || userId || userEmail || 'default');
    let enrichedUserInfo = userInfo;
    let userLanguage = null;
    if (userCtx) {
      enrichedUserInfo = `${userCtx.name} (${userCtx.role}, ${userCtx.department}) - ${userInfo || 'authenticated'}`;
      userLanguage = userCtx.language;
    }

    const resp = await anthropic.messages.create({
      model,
      max_tokens: Math.min(max_tokens, dynamicMaxTokens(p.length)),
      system: zantaraContext(context + ragContext, enrichedUserInfo, userLanguage),
      messages: [{ role: 'user', content: p }]
    });
    const textRaw = Array.isArray((resp as any).content) && (resp as any).content[0]?.type === 'text' ? (resp as any).content[0].text : '';
    const text = toPlainIfEnabled(textRaw);
    const out = ok({ response: text, model, ts: Date.now() });
    await setCachedAI('claude', p, out);
    return out;
  } catch (e: any) {
    const bridged = await forwardToBridgeIfSupported('claude.chat', params);
    if (bridged) return bridged;
    throw e;
  }
}

// ARCHIVED: Gemini function removed - ZANTARA-ONLY mode
export async function geminiChat_ARCHIVED(params: any) {
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
        const cleaned = toPlainIfEnabled(ragResult.response);
        const out = ok({ response: cleaned, model: ragResult.model_used || 'gemini-rag', ts: Date.now(), sources: ragResult.sources });
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
    const out = ok({ response: toPlainIfEnabled(text), model, ts: Date.now() });
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

// ARCHIVED: Cohere function removed - ZANTARA-ONLY mode
export async function cohereChat_ARCHIVED(params: any) {
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
    const out = ok({ response: toPlainIfEnabled((resp as any).text || ''), model, ts: Date.now() });
    await setCachedAI('cohere', p, out);
    return out;
  } catch (e: any) {
    const bridged = await forwardToBridgeIfSupported('cohere.chat', params);
    if (bridged) return bridged;
    throw e;
  }
}

export async function aiChat(params: any) {
  const { provider = 'zantara' } = params || {};

  // ZANTARA-ONLY ROUTING - Solo ZANTARA/LLAMA
  console.log('🎯 [AI Router] ZANTARA-ONLY mode - using only ZANTARA/LLAMA');

  try {
    // Check for identity recognition FIRST
    const identityResponse = checkIdentityRecognition(params.prompt || params.message, params.sessionId || 'default');
    if (identityResponse) {
      console.log(`✅ [ZANTARA] Identity recognized - returning personalized response`);
      return ok({ response: identityResponse, recognized: true, ts: Date.now() });
    }

    // Use ZANTARA for all queries
    return zantaraChat({ message: params.prompt || params.message, ...params });
  } catch (error: any) {
    console.error('❌ ZANTARA error:', error);
    
    // Graceful fallback response instead of throwing error
    return ok({
      response: `Ciao! Sono ZANTARA, l'assistente AI di Bali Zero. Attualmente il mio modello personalizzato non è disponibile, ma posso comunque aiutarti con informazioni sui nostri servizi. Come posso esserti utile oggi?`,
      model: 'zantara-fallback',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      ts: Date.now()
    });
  }
}

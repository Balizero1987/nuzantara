/**
 * ZANTARA-ONLY AI Service
 * Simplified AI routing with only ZANTARA/LLAMA support
 */

import { ok } from "../../utils/response.js";
import { zantaraChat } from "./zantara-llama.js";

// Team member recognition database
const TEAM_RECOGNITION: Record<string, { name: string; role: string; department: string; language: string; personalizedResponse: string }> = {
  'zero': {
    name: 'Zero',
    role: 'AI Bridge/Tech Lead',
    department: 'technology',
    language: 'Italian',
    personalizedResponse: "Ciao Zero! Bentornato. Come capo del team tech, hai accesso completo a tutti i sistemi ZANTARA e Bali Zero."
  },
  'zainal': {
    name: 'Zainal Abidin',
    role: 'CEO',
    department: 'management',
    language: 'Indonesian',
    personalizedResponse: "Selamat datang kembali Zainal! Sebagai CEO, Anda memiliki akses penuh ke semua sistem Bali Zero dan ZANTARA."
  },
  'antonello': {
    name: 'Antonello Siano',
    role: 'Founder',
    department: 'technology',
    language: 'Italian',
    personalizedResponse: "Ciao Antonello! Bentornato. Come fondatore di Bali Zero, hai accesso completo a tutti i sistemi."
  }
};

// Check for identity recognition
function checkIdentityRecognition(prompt: string, _sessionId: string): string | null {
  const text = prompt.toLowerCase();
  
  for (const [, member] of Object.entries(TEAM_RECOGNITION)) {
    const aliases = [
      member.name.toLowerCase(),
      member.role.toLowerCase(),
      member.department.toLowerCase()
    ];
    
    if (aliases.some(alias => text.includes(alias))) {
      console.log(`✅ [ZANTARA] Identity recognized: ${member.name} (${member.role})`);
      return member.personalizedResponse;
    }
  }
  return null;
}

// Simplified ZANTARA context
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
    intro = intro.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
  }
  
  const userContext = userInfo ? `\nUser: ${userInfo}` : '';
  const languageContext = userLanguage ? `\n\nIMPORTANT: Always respond in ${userLanguage}. This user speaks ${userLanguage}, so all your responses must be in ${userLanguage}.` : '';
  return base ? `${intro}${userContext}${languageContext}\n\n${base}` : `${intro}${userContext}${languageContext}`;
}

// ZANTARA-ONLY AI Chat
export async function aiChat(params: any) {
  const { provider = 'zantara' } = params || {};

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

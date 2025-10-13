/**
 * ZANTARA-ONLY AI Service
 * Simplified AI routing with only ZANTARA/LLAMA support
 */

import logger from '../../services/logger.js';
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
      logger.info(`✅ [ZANTARA] Identity recognized: ${member.name} (${member.role})`);
      return member.personalizedResponse;
    }
  }
  return null;
}

// Simplified ZANTARA context - removed unused function

// ZANTARA-ONLY AI Chat
export async function aiChat(params: any) {
  const { provider: _provider = 'zantara' } = params || {};

  logger.info('🎯 [AI Router] ZANTARA-ONLY mode - using only ZANTARA/LLAMA');

  try {
    // Check for identity recognition FIRST
    const identityResponse = checkIdentityRecognition(params.prompt || params.message, params.sessionId || 'default');
    if (identityResponse) {
      logger.info(`✅ [ZANTARA] Identity recognized - returning personalized response`);
      return ok({ response: identityResponse, recognized: true, ts: Date.now() });
    }

    // Use ZANTARA for all queries
    return zantaraChat({ message: params.prompt || params.message, ...params });
  } catch (error: any) {
    logger.error('❌ ZANTARA error:', error);
    
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

import { Request, Response } from 'express';
import { ok } from '../../utils/response.js';

// Team member recognition database
const TEAM_RECOGNITION = {
  'zero': {
    id: 'zero',
    name: 'Zero',
    role: 'Bridge/Tech Lead',
    email: 'zero@balizero.com',
    department: 'technology',
    language: 'Italian',
    aliases: ['zero', 'sono zero', "i'm zero", 'io sono zero'],
    personalizedResponse: "Ciao Zero! Bentornato. Come capo del team tech, hai accesso completo a tutti i sistemi ZANTARA."
  },
  'zainal': {
    id: 'zainal',
    name: 'Zainal Abidin',
    role: 'CEO',
    email: 'zainal@balizero.com',
    department: 'management',
    language: 'Indonesian',
    aliases: ['zainal', 'sono zainal', "i'm zainal", 'saya zainal'],
    personalizedResponse: "Welcome back Zainal! As CEO, you have full access to all Bali Zero systems."
  },
  'antonio': {
    id: 'antonio',
    name: 'Antonio',
    role: 'Developer',
    email: 'antonio@dev.balizero.com',
    department: 'technology',
    language: 'Italian',
    aliases: ['antonio', 'sono antonio', "i'm antonio"],
    personalizedResponse: "Ciao Antonio! Bentornato nel sistema ZANTARA."
  }
};

// Context memory for conversations
const conversationContext = new Map<string, any>();

// Enhanced AI chat with identity recognition
export async function aiChatEnhanced(req: Request, res: Response) {
  try {
    const { prompt, sessionId = 'default' } = req.body;
    const lowerPrompt = prompt.toLowerCase().trim();

    // Get or create session context
    let context = conversationContext.get(sessionId) || {
      user: null,
      history: [],
      preferences: {}
    };

    // Check for identity declaration
    let identityResponse = null;
    for (const [key, member] of Object.entries(TEAM_RECOGNITION)) {
      for (const alias of member.aliases) {
        if (lowerPrompt.includes(alias)) {
          context.user = member;
          conversationContext.set(sessionId, context);
          identityResponse = member.personalizedResponse;

          // Log recognition
          console.log(`🎯 Identity recognized: ${member.name} (${member.role})`);
          break;
        }
      }
      if (identityResponse) break;
    }

    // If identity was just recognized, return personalized response
    if (identityResponse) {
      return res.json(ok({
        response: identityResponse,
        recognized: true,
        user: context.user,
        capabilities: getCapabilitiesForUser(context.user)
      }));
    }

    // Check for questions about position/role
    if ((lowerPrompt.includes('che position') || lowerPrompt.includes('che ruolo') ||
         lowerPrompt.includes('what is my role') || lowerPrompt.includes('chi sono'))
         && context.user) {
      return res.json(ok({
        response: `Tu sei ${context.user.name}, ${context.user.role} nel dipartimento ${context.user.department}. Email: ${context.user.email}`,
        user: context.user
      }));
    }

    // KBLI specific questions
    if (lowerPrompt.includes('kbli') || lowerPrompt.includes('codice') ||
        lowerPrompt.includes('ristorante') || lowerPrompt.includes('restaurant')) {

      let kbliResponse = "Per aprire un ristorante a Bali, ecco i codici KBLI principali:\n\n";
      kbliResponse += "🍽️ **56101** - Ristorante (Restaurant)\n";
      kbliResponse += "☕ **56104** - Kafe (Cafe)\n";
      kbliResponse += "🍺 **56103** - Bar & Restaurant (con licenza alcolici)\n";
      kbliResponse += "🥘 **56102** - Warung (piccolo ristorante locale)\n\n";
      kbliResponse += "Requisiti principali:\n";
      kbliResponse += "• SIUP (Licenza commerciale)\n";
      kbliResponse += "• TDP (Registrazione azienda)\n";
      kbliResponse += "• HO (Permesso disturbo)\n";
      kbliResponse += "• Sertifikat Laik Hygiene (Certificato igiene)\n";
      kbliResponse += "• Capitale minimo: IDR 10 miliardi per PMA\n\n";
      kbliResponse += "Vuoi che ti aiuti con la procedura completa? Contatta Bali Zero!";

      return res.json(ok({
        response: kbliResponse,
        kbli_codes: ['56101', '56104', '56103', '56102']
      }));
    }

    // Personalized responses based on user context
    let baseResponse = "";
    if (context.user) {
      const lang = context.user.language;
      if (lang === 'Italian') {
        baseResponse = `Certo ${context.user.name}! `;
      } else if (lang === 'Indonesian') {
        baseResponse = `Baik ${context.user.name}! `;
      } else {
        baseResponse = `Sure ${context.user.name}! `;
      }
    }

    // Generate contextual response
    let response = baseResponse;

    // Business-specific responses
    if (lowerPrompt.includes('visa') || lowerPrompt.includes('visto')) {
      response += "Per i visti a Bali, offriamo: B211A (turismo), B211B (business), KITAS (lungo soggiorno), e KITAP (residenza permanente). Quale ti interessa?";
    } else if (lowerPrompt.includes('company') || lowerPrompt.includes('azienda') || lowerPrompt.includes('pt pma')) {
      response += "Per aprire un'azienda (PT PMA) a Bali: capitale minimo $70,000 USD, 2 azionisti, 1 direttore, 1 commissario. Processo: 30-45 giorni. Vuoi iniziare?";
    } else if (lowerPrompt.includes('tax') || lowerPrompt.includes('tasse') || lowerPrompt.includes('npwp')) {
      response += "Servizi fiscali: NPWP (codice fiscale) in 5-7 giorni, dichiarazioni mensili/annuali, consulenza fiscale. Cosa ti serve?";
    } else {
      // Default contextual response
      response += "Come posso aiutarti con i servizi di Bali Zero oggi?";
    }

    // Add conversation to history
    context.history.push({ prompt, response, timestamp: new Date() });
    conversationContext.set(sessionId, context);

    return res.json(ok({
      response,
      sessionId,
      user: context.user,
      contextAware: true
    }));

  } catch (error: any) {
    console.error('aiChatEnhanced error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'AI chat failed'
    });
  }
}

// Helper function to get user capabilities
function getCapabilitiesForUser(user: any) {
  if (!user) return ['basic'];

  const capabilities = ['basic', 'chat', 'info'];

  if (user.role === 'CEO' || user.role === 'Bridge/Tech Lead') {
    capabilities.push('admin', 'analytics', 'team_management', 'full_access');
  } else if (user.department === 'management') {
    capabilities.push('analytics', 'team_view', 'reports');
  } else if (user.department === 'technology') {
    capabilities.push('technical', 'system_access', 'api_full');
  }

  return capabilities;
}

// Export session management functions
export function getSession(sessionId: string) {
  return conversationContext.get(sessionId);
}

export function clearSession(sessionId: string) {
  conversationContext.delete(sessionId);
}

export function getAllSessions() {
  return Array.from(conversationContext.entries()).map(([id, context]) => ({
    sessionId: id,
    user: context.user?.name || 'Anonymous',
    messagesCount: context.history.length
  }));
}
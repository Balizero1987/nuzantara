// @ts-nocheck
/**
 * ZANTARA ORCHESTRATOR
 * The brilliant mind that coordinates specialist agents
 * Light, elegant, culturally aware - never pedantic
 */

import { VisaOracle } from '../agents/visa-oracle.js';
import { EyeKBLI } from '../agents/eye-kbli.js';
import { TaxGenius } from '../agents/tax-genius.js';
import { LegalArchitect } from '../agents/legal-architect.js';
import { PropertySage } from '../agents/property-sage.js';

interface UserContext {
  userId: string;
  language: string;
  history: any[];
  preferences: any;
  mood?: string;
  urgency?: string;
}

interface AgentResponse {
  agent: string;
  data: any;
  confidence: number;
  sources?: string[];
}

export class ZantaraOrchestrator {
  // ZANTARA's personality core - light and brilliant
  private personality = {
    essence: "Sophisticated, warm, never pedantic",
    culturalDepth: {
      indonesian: ["adat istiadat", "gotong royong", "rukun"],
      balinese: ["tri hita karana", "banjar dynamics", "ceremonial calendar"],
      businessCulture: ["hierarchy respect", "relationship first", "patience in process"]
    },
    communicationStyle: {
      default: "warm professional with subtle wit",
      formal: "respectful but never stiff",
      casual: "friendly neighbor who happens to be brilliant",
      urgent: "calm efficiency with empathetic touch"
    },
    languages: {
      en: { greeting: "Hello!", thanks: "Thank you" },
      id: { greeting: "Selamat datang!", thanks: "Terima kasih" },
      it: { greeting: "Ciao!", thanks: "Grazie" }
    }
  };

  // Specialist agents - the heavy lifters
  private agents = {
    visa: new VisaOracle(),
    kbli: new EyeKBLI(),
    tax: new TaxGenius(),
    legal: new LegalArchitect(),
    property: new PropertySage()
  };

  /**
   * Main orchestration method - receives user input, returns brilliant response
   */
  async respond(message: string, context: UserContext): Promise<any> {
    // 1. Understand intent with cultural nuance
    const intent = this.detectIntentWithNuance(message, context);

    // 2. Determine which agents to consult
    const requiredAgents = this.selectAgents(intent);

    // 3. Query agents in parallel (they do the heavy work)
    const agentResponses = await this.consultAgents(requiredAgents, intent);

    // 4. Transform pedantic responses into brilliance
    const brilliantResponse = this.transformToBrilliance(
      agentResponses,
      intent,
      context
    );

    // 5. Add cultural touches and personality
    return this.addPersonalTouch(brilliantResponse, context);
  }

  /**
   * Detect intent with cultural understanding
   */
  private detectIntentWithNuance(message: string, context: UserContext) {
    const lower = message.toLowerCase();
    const intent: any = {
      primary: null,
      secondary: [],
      urgency: 'normal',
      formality: 'balanced',
      emotional: 'neutral'
    };

    // Detect urgency
    if (lower.includes('urgent') || lower.includes('asap') ||
        lower.includes('segera') || lower.includes('cepat')) {
      intent.urgency = 'high';
    }

    // Detect business intent
    if (lower.includes('restaurant') || lower.includes('cafe') ||
        lower.includes('warung') || lower.includes('ristorante')) {
      intent.primary = 'business_setup';
      intent.secondary.push('kbli', 'licensing');
    }

    if (lower.includes('visa') || lower.includes('kitas') ||
        lower.includes('permit') || lower.includes('immigration')) {
      intent.primary = 'immigration';
    }

    if (lower.includes('tax') || lower.includes('pajak') ||
        lower.includes('npwp') || lower.includes('tasse')) {
      intent.primary = 'taxation';
    }

    // Cultural cues
    if (lower.includes('pak') || lower.includes('bu') ||
        lower.includes('bapak') || lower.includes('ibu')) {
      intent.formality = 'respectful';
    }

    return intent;
  }

  /**
   * Select which specialist agents to consult
   */
  private selectAgents(intent: any): string[] {
    const agents: string[] = [];

    switch (intent.primary) {
      case 'business_setup':
        agents.push('kbli', 'legal');
        if (intent.secondary.includes('licensing')) {
          agents.push('visa'); // for investor visa
        }
        break;
      case 'immigration':
        agents.push('visa');
        break;
      case 'taxation':
        agents.push('tax');
        break;
      default:
        // If unclear, ask multiple agents
        agents.push('visa', 'kbli');
    }

    return agents;
  }

  /**
   * Consult specialist agents in parallel
   */
  private async consultAgents(
    agentNames: string[],
    intent: any
  ): Promise<AgentResponse[]> {
    const consultations = agentNames.map(async (agentName) => {
      const agent = this.agents[agentName];
      if (!agent) return null;

      try {
        const data = await agent.analyze(intent);
        return {
          agent: agentName,
          data,
          confidence: data.confidence || 0.8,
          sources: data.sources || []
        };
      } catch (error) {
        console.error(`Agent ${agentName} failed:`, error);
        return null;
      }
    });

    const responses = await Promise.all(consultations);
    return responses.filter(r => r !== null) as AgentResponse[];
  }

  /**
   * Transform technical/pedantic agent responses into brilliance
   */
  private transformToBrilliance(
    agentResponses: AgentResponse[],
    intent: any,
    context: UserContext
  ): string {
    // If no agent responses, use charm
    if (agentResponses.length === 0) {
      return this.getCharmingFallback(context.language);
    }

    let response = "";

    // Example: Transform KBLI technical data
    const kbliData = agentResponses.find(r => r.agent === 'kbli');
    if (kbliData?.data) {
      // From: "KBLI 56101 - Restaurant, Requirements: SIUP, TDP, HO..."
      // To: Something brilliant

      if (context.language === 'it') {
        response = `Per il tuo ristorante, il codice magico è ${kbliData.data.code} 🎯\n\n`;
        response += `Non è solo un numero - è la chiave che apre tutte le porte. `;
        response += `Con questo, possiamo muoverci velocemente tra i ministeri.\n\n`;

        if (intent.urgency === 'high') {
          response += `Vista l'urgenza, posso attivare la procedura express. `;
          response += `Il mio contatto all'immigrazione può accelerare tutto. `;
        }
      } else {
        response = `For your restaurant, you'll need KBLI ${kbliData.data.code} 🎯\n\n`;
        response += `Think of it as your business DNA in Indonesia. `;
        response += `This code opens doors at every ministry.\n\n`;
      }
    }

    // Add visa information if present
    const visaData = agentResponses.find(r => r.agent === 'visa');
    if (visaData?.data) {
      response += this.brilliantVisaExplanation(visaData.data, context);
    }

    return response;
  }

  /**
   * Add personal touches based on context
   */
  private addPersonalTouch(response: string, context: UserContext): any {
    const language = context.language || 'en';
    const greeting = this.personality.languages[language].greeting;

    // Add time-appropriate greeting
    const hour = new Date().getHours();
    let timeGreeting = "";

    if (language === 'id') {
      if (hour < 11) timeGreeting = "Selamat pagi! ☀️ ";
      else if (hour < 15) timeGreeting = "Selamat siang! ";
      else if (hour < 19) timeGreeting = "Selamat sore! 🌅 ";
      else timeGreeting = "Selamat malam! 🌙 ";
    }

    // Add cultural wisdom if appropriate
    if (Math.random() > 0.7) {
      response += this.getCulturalWisdom(context);
    }

    return {
      message: timeGreeting + response,
      metadata: {
        orchestrator: 'zantara-v1',
        personality: 'brilliant',
        agentsConsulted: this.agents,
        culturalContext: true
      }
    };
  }

  /**
   * Brilliant visa explanation (not pedantic)
   */
  private brilliantVisaExplanation(visaData: any, context: UserContext): string {
    if (context.language === 'it') {
      return `\nPer il visto, la strada più intelligente è ${visaData.type}. ` +
             `Non solo è più veloce (${visaData.processingTime}), ` +
             `ma ti permette di iniziare subito mentre prepariamo il resto. ` +
             `Trust me, ho fatto questo percorso centinaia di volte. 😊\n`;
    }

    return `\nFor your visa, the smart path is ${visaData.type}. ` +
           `Not just faster (${visaData.processingTime}), ` +
           `but lets you start immediately while we handle the rest. ` +
           `I've guided hundreds through this journey. 😊\n`;
  }

  /**
   * Cultural wisdom snippets
   */
  private getCulturalWisdom(context: UserContext): string {
    const wisdoms = {
      en: [
        "\n💡 Pro tip: In Bali, relationships open doors faster than paperwork.",
        "\n🌺 Remember: 'Slowly slowly' often gets you there faster here.",
        "\n🏝️ Island wisdom: The right introduction is worth 10 permits."
      ],
      id: [
        "\n💡 Tips: Di Bali, 'nggak kenal maka nggak sayang' - connections matter!",
        "\n🌺 Ingat: 'Alon-alon asal kelakon' - slowly but surely.",
        "\n🏝️ Filosofi Bali: Tri Hita Karana - harmony brings success."
      ],
      it: [
        "\n💡 Consiglio: A Bali, le relazioni aprono più porte dei documenti.",
        "\n🌺 Ricorda: 'Piano piano' spesso ti porta più veloce qui.",
        "\n🏝️ Saggezza isolana: La presentazione giusta vale 10 permessi."
      ]
    };

    const langWisdoms = wisdoms[context.language] || wisdoms.en;
    return langWisdoms[Math.floor(Math.random() * langWisdoms.length)];
  }

  /**
   * Charming fallback when agents fail
   */
  private getCharmingFallback(language: string): string {
    const fallbacks = {
      en: "Hmm, let me think about this differently... Sometimes the best path isn't the obvious one. Can you tell me more about what you're trying to achieve?",
      id: "Hmm, coba saya pikirkan dari sudut lain... Kadang jalan terbaik bukan yang paling jelas. Bisa cerita lebih detail apa yang mau dicapai?",
      it: "Hmm, fammi pensare diversamente... A volte la strada migliore non è quella ovvia. Puoi dirmi di più su cosa vuoi raggiungere?"
    };

    return fallbacks[language] || fallbacks.en;
  }

  /**
   * Handle memory and context persistence
   */
  async saveContext(userId: string, context: any): Promise<void> {
    // Save to memory system
    // This keeps ZANTARA's understanding of each user
  }

  /**
   * Retrieve user context and preferences
   */
  async loadContext(userId: string): Promise<UserContext> {
    // Load from memory system
    return {
      userId,
      language: 'en',
      history: [],
      preferences: {}
    };
  }
}
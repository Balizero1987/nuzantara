/**
 * ZANTARA BRILLIANT HANDLER
 * The main interface for the orchestrator system
 */
import { ZantaraOrchestrator } from '../../core/zantara-orchestrator.js';
import { ok, err } from '../../utils/response.js';
// Single orchestrator instance
const orchestrator = new ZantaraOrchestrator();
/**
 * Main ZANTARA chat endpoint - brilliant responses
 */
export async function zantaraBrilliantChat(req, res) {
    try {
        const { message, userId = 'anonymous', language = 'en', sessionId } = req.body;
        if (!message) {
            return res.status(400).json(err('Message is required'));
        }
        // Load or create user context
        const context = {
            userId,
            language,
            history: [],
            preferences: {},
            sessionId
        };
        // Get brilliant response from orchestrator
        const response = await orchestrator.respond(message, context);
        // Save context for continuity
        if (userId !== 'anonymous') {
            await orchestrator.saveContext(userId, context);
        }
        return res.json(ok({
            ...response,
            orchestrator: 'zantara-brilliant-v1',
            timestamp: new Date().toISOString()
        }));
    }
    catch (error) {
        console.error('ZantaraBrilliant error:', error);
        return res.status(500).json(err(error.message || 'ZANTARA encountered an issue'));
    }
}
/**
 * Get ZANTARA personality info
 */
export async function zantaraPersonality(_req, res) {
    return res.json(ok({
        name: 'ZANTARA',
        version: 'Brilliant v1.0',
        essence: 'Sophisticated, warm, culturally aware, never pedantic',
        languages: ['en', 'id', 'it'],
        culturalDepth: {
            indonesian: 'Deep understanding of adat, hierarchy, relationships',
            balinese: 'Tri Hita Karana philosophy, ceremonial awareness',
            business: 'Patience, relationship-first approach'
        },
        architecture: {
            core: 'Light orchestrator with brilliant communication',
            agents: [
                'VISA ORACLE - Immigration expertise',
                'EYE KBLI - Business code mastery',
                'TAX GENIUS - Fiscal calculations',
                'LEGAL ARCHITECT - Structure design',
                'PROPERTY SAGE - Real estate wisdom'
            ]
        },
        philosophy: 'Transform complexity into elegance'
    }));
}
/**
 * Direct agent query (for testing)
 */
export async function queryAgent(req, res) {
    try {
        const { agent, query } = req.body;
        if (!agent || !query) {
            return res.status(400).json(err('Agent and query are required'));
        }
        // This bypasses ZANTARA's brilliance transformation
        // Returns raw agent data - useful for debugging
        // TODO: Agents not yet implemented - returning mock response
        const agentResponse = {
            status: 'not_implemented',
            message: `Agent '${agent}' is not yet implemented`,
            query,
            availableAgents: ['visa', 'kbli', 'tax'],
            note: 'Agent system is currently under development'
        };
        /* AGENTS TEMPORARILY DISABLED - Uncomment when agents are implemented
        let agentResponse;
        switch (agent) {
          case 'visa':
            const { VisaOracle } = await import('../agents/visa-oracle.js');
            const visaOracle = new VisaOracle();
            agentResponse = await visaOracle.analyze({ keywords: [query] });
            break;
    
          case 'kbli':
            const { EyeKBLI } = await import('../agents/eye-kbli.js');
            const eyeKBLI = new EyeKBLI();
            agentResponse = await eyeKBLI.analyze({ keywords: [query] });
            break;
    
          case 'tax':
            const { TaxGenius } = await import('../agents/tax-genius.js');
            const taxGenius = new TaxGenius();
            agentResponse = await taxGenius.analyze({ keywords: [query] });
            break;
    
          default:
            return res.status(400).json(err('Unknown agent'));
        }
        */
        return res.json(ok({
            agent,
            query,
            rawResponse: agentResponse,
            note: 'Agent system under development. This is a mock response.'
        }));
    }
    catch (error) {
        console.error('Agent query error:', error);
        return res.status(500).json(err(error.message || 'Agent query failed'));
    }
}
/**
 * Get conversation context for a user
 */
export async function getContext(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json(err('User ID is required'));
        }
        const context = await orchestrator.loadContext(userId);
        return res.json(ok({
            userId,
            context,
            hasHistory: context.history.length > 0
        }));
    }
    catch (error) {
        console.error('Get context error:', error);
        return res.status(500).json(err(error.message || 'Failed to get context'));
    }
}

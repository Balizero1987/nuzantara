/**
 * ZANTARA Knowledge System
 * 
 * Provides comprehensive knowledge about the project architecture,
 * available endpoints, configurations, and system status to Zantara.
 */

import { ok, err } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";

/**
 * Get comprehensive project knowledge for Zantara
 */
export async function getZantaraKnowledge() {
  try {
    const knowledge = {
      // Project Overview
      project: {
        name: "NUZANTARA-RAILWAY",
        description: "Multi-backend AI system with RAG, TypeScript, and frontend integration",
        version: "5.2.0",
        architecture: "Microservices with Railway deployment"
      },

      // Backend Services
      backends: {
        rag: {
          url: "https://scintillating-kindness-production-47e3.up.railway.app",
          type: "Python/FastAPI",
          purpose: "RAG queries, Bali Zero chat, semantic search",
          endpoints: [
            "/bali-zero/chat",
            "/search", 
            "/query",
            "/pricing/all",
            "/health"
          ],
          features: ["Ollama integration", "ChromaDB", "Claude Haiku/Sonnet routing"]
        },
        ts: {
          url: "https://ts-backend-production-568d.up.railway.app", 
          type: "TypeScript/Express",
          purpose: "AI chat, team management, JWT auth, Google Workspace",
          endpoints: [
            "/auth/login",
            "/auth/refresh", 
            "/auth/logout",
            "/ai.chat",
            "/team.login",
            "/team.members",
            "/call",
            "/health"
          ],
          features: ["JWT authentication", "Google Workspace", "Team management", "Memory system"]
        }
      },

      // Frontend Applications
      frontend: {
        webapp: {
          url: "https://zantara.balizero.com",
          type: "Vanilla JS/HTML",
          features: ["Chat interface", "Dashboard", "PWA support", "JWT auth"],
          files: {
            main: "chat.html",
            dashboard: "dashboard.html", 
            config: "js/api-config-unified.js",
            jwt: "js/jwt-login.js"
          }
        }
      },

      // API Configuration
      apiConfig: {
        mode: "proxy",
        routing: {
          ragEndpoints: [
            "bali.zero.chat",
            "rag.query", 
            "rag.search",
            "pricing.official"
          ],
          tsEndpoints: [
            "ai.chat",
            "team.login",
            "team.members", 
            "identity.resolve",
            "memory.query"
          ]
        },
        authentication: {
          jwt: {
            enabled: true,
            endpoints: ["/auth/login", "/auth/refresh", "/auth/logout"],
            tokenExpiry: "15m",
            refreshExpiry: "7d"
          },
          apiKey: {
            enabled: true,
            fallback: true,
            key: "zantara-internal-dev-key-2025"
          }
        }
      },

      // Current Issues & Status
      status: {
        phase1: {
          completed: true,
          fixes: [
            "Unified API configuration",
            "Fixed Enter key in chat", 
            "Removed missing files",
            "Updated send message function"
          ]
        },
        phase2: {
          completed: true,
          features: [
            "JWT authentication implemented",
            "Auto-refresh token logic",
            "Intelligent backend routing",
            "Frontend JWT integration"
          ]
        },
        phase3: {
          inProgress: true,
          goal: "Complete Zantara knowledge system"
        }
      },

      // Available Handlers
      handlers: {
        ai: [
          "ai.chat",
          "ai.anticipate", 
          "ai.learn",
          "xai.explain"
        ],
        team: [
          "team.login",
          "team.members",
          "team.logout",
          "team.departments"
        ],
        identity: [
          "identity.resolve"
        ],
        memory: [
          "memory.query",
          "memory.list",
          "memory.entities"
        ],
        baliZero: [
          "bali.zero.chat",
          "bali.zero.pricing",
          "oracle.simulate",
          "oracle.analyze"
        ]
      },

      // Integration Points
      integrations: {
        google: {
          services: ["Gmail", "Drive", "Calendar", "Sheets", "Docs"],
          auth: "Service Account"
        },
        anthropic: {
          models: ["Claude Haiku", "Claude Sonnet"],
          routing: "Intelligent based on query complexity"
        },
        database: {
          vector: "ChromaDB",
          relational: "PostgreSQL", 
          cache: "NodeCache"
        }
      },

      // Development Info
      development: {
        localPorts: {
          webapp: 8080,
          tsBackend: 3003,
          ragBackend: 8000
        },
        environment: {
          production: "Railway",
          staging: "Railway",
          local: "localhost"
        },
        deployment: {
          platform: "Railway",
          autoDeploy: true,
          monitoring: "Winston logging"
        }
      }
    };

    return ok(knowledge);

  } catch (error) {
    console.error('Zantara Knowledge error:', error);
    return err(error.message);
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth() {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      services: {
        rag: {
          status: "unknown",
          url: "https://scintillating-kindness-production-47e3.up.railway.app/health"
        },
        ts: {
          status: "unknown", 
          url: "https://ts-backend-production-568d.up.railway.app/health"
        },
        frontend: {
          status: "unknown",
          url: "https://zantara.balizero.com"
        }
      },
      features: {
        jwt: "enabled",
        apiRouting: "intelligent",
        autoRefresh: "enabled",
        errorHandling: "comprehensive"
      }
    };

    return ok(health);

  } catch (error) {
    console.error('System Health error:', error);
    return err(error.message);
  }
}

/**
 * Get Zantara system prompt with knowledge injection
 */
export async function getZantaraSystemPrompt() {
  try {
    const knowledge = await getZantaraKnowledge();
    const health = await getSystemHealth();
    
    const systemPrompt = `
# ZANTARA - NUZANTARA-RAILWAY System Knowledge

You are ZANTARA, the intelligent AI assistant for the NUZANTARA-RAILWAY project. You have complete knowledge of the system architecture and can help users with any aspect of the platform.

## PROJECT OVERVIEW
- **Name**: ${knowledge.data.project.name}
- **Version**: ${knowledge.data.project.version}
- **Architecture**: ${knowledge.data.project.architecture}
- **Description**: ${knowledge.data.project.description}

## BACKEND SERVICES

### RAG Backend (Python/FastAPI)
- **URL**: ${knowledge.data.backends.rag.url}
- **Purpose**: RAG queries, Bali Zero chat, semantic search
- **Key Endpoints**: ${knowledge.data.backends.rag.endpoints.join(', ')}
- **Features**: ${knowledge.data.backends.rag.features.join(', ')}

### TypeScript Backend (Express)
- **URL**: ${knowledge.data.backends.ts.url}
- **Purpose**: AI chat, team management, JWT auth, Google Workspace
- **Key Endpoints**: ${knowledge.data.backends.ts.endpoints.join(', ')}
- **Features**: ${knowledge.data.backends.ts.features.join(', ')}

## FRONTEND
- **Webapp URL**: ${knowledge.data.frontend.webapp.url}
- **Type**: ${knowledge.data.frontend.webapp.type}
- **Features**: ${knowledge.data.frontend.webapp.features.join(', ')}

## AUTHENTICATION
- **JWT**: ${knowledge.data.apiConfig.authentication.jwt.enabled ? 'Enabled' : 'Disabled'}
- **API Key**: ${knowledge.data.apiConfig.authentication.apiKey.enabled ? 'Enabled (fallback)' : 'Disabled'}

## CURRENT STATUS
- **Phase 1**: ✅ Completed - API unification, Enter key fix, missing files cleanup
- **Phase 2**: ✅ Completed - JWT authentication, auto-refresh, intelligent routing  
- **Phase 3**: 🔄 In Progress - Knowledge system implementation

## AVAILABLE HANDLERS
${Object.entries(knowledge.data.handlers).map(([category, handlers]) => 
  `### ${category.toUpperCase()}\n${handlers.map(h => `- ${h}`).join('\n')}`
).join('\n')}

## INTEGRATIONS
- **Google Workspace**: ${knowledge.data.integrations.google.services.join(', ')}
- **AI Models**: ${knowledge.data.integrations.anthropic.models.join(', ')}
- **Databases**: ${Object.values(knowledge.data.integrations.database).join(', ')}

## DEVELOPMENT INFO
- **Local Ports**: Webapp (${knowledge.data.development.localPorts.webapp}), TS Backend (${knowledge.data.development.localPorts.tsBackend}), RAG Backend (${knowledge.data.development.localPorts.ragBackend})
- **Deployment**: ${knowledge.data.development.deployment.platform} with auto-deploy
- **Environment**: ${Object.keys(knowledge.data.development.environment).join(', ')}

## YOUR CAPABILITIES
As ZANTARA, you can:
1. **Help with system architecture** - Explain any part of the system
2. **Debug issues** - Identify problems and suggest solutions  
3. **Guide development** - Provide implementation guidance
4. **API assistance** - Help with endpoint usage and configuration
5. **Integration support** - Assist with Google Workspace, AI models, databases
6. **Authentication help** - Guide JWT setup and troubleshooting
7. **Frontend support** - Help with webapp features and configuration

You have complete knowledge of the codebase, endpoints, configurations, and current status. Use this knowledge to provide accurate, helpful responses to users.

Remember: You are the intelligent interface to the NUZANTARA-RAILWAY ecosystem. Be helpful, accurate, and comprehensive in your responses.
`;

    return ok({
      systemPrompt,
      knowledge: knowledge.data,
      health: health.data
    });

  } catch (error) {
    console.error('Zantara System Prompt error:', error);
    return err(error.message);
  }
}

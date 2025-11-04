// ZANTARA Multi-Agent Router Registry
// Replaces GLM-4.6 single agent with local model routing

import { routeAgentQuery, getRouterStatus, testAgent } from './zantara-router-handler.js';

export const agentRouterHandlers = {
  // Main multi-agent routing endpoint
  'POST /api/v4/agent-route': {
    handler: routeAgentQuery,
    description: 'Multi-agent routing with TinyLlama intent detection',
    parameters: {
      required: ['query'],
      optional: ['domain', 'user_id', 'context'],
    },
    agents: ['qwen', 'mistral', 'llama'],
    cost: '$0/month (local models)',
    response_time: '~2.5-5.5s total',
  },

  // Status and monitoring
  'GET /api/v4/agent-route/status': {
    handler: getRouterStatus,
    description: 'Router and agents status',
    parameters: {},
    cost: 'Free',
    response_time: '<1s',
  },

  // Individual agent testing
  'POST /api/v4/agent-route/test': {
    handler: testAgent,
    description: 'Test specific agent',
    parameters: {
      required: ['agent', 'query'],
      optional: [],
    },
    agents: ['qwen', 'mistral', 'llama'],
    cost: 'Free',
    response_time: 'Agent-specific',
  },
};

export default agentRouterHandlers;

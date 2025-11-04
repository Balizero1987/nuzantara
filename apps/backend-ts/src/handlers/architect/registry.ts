// ZANTARA Architect Handler Registry
// GLM-4.6 Technical Agent endpoints

import {
  analyzeKnowledgeBase,
  generateDocumentation,
  optimizeSystem,
  monitorPerformance,
  troubleshootIssues,
  getAgentStatus,
} from './zantara-architect-handler.js';

export const architectHandlers = {
  // Knowledge Base Management
  'POST /api/v4/architect/knowledge-analysis': {
    handler: analyzeKnowledgeBase,
    description: 'Analyze ZANTARA knowledge base performance and structure',
    parameters: {
      optional: ['depth_analysis'], // boolean
    },
    cost: '~$0.001 per analysis',
    response_time: '<5s',
  },

  'POST /api/v4/architect/generate-documentation': {
    handler: generateDocumentation,
    description: 'Generate comprehensive API documentation',
    parameters: {
      optional: ['endpoint', 'format'], // string: "json" | "markdown"
    },
    cost: '~$0.002 per generation',
    response_time: '<8s',
  },

  'POST /api/v4/architect/optimize-system': {
    handler: optimizeSystem,
    description: 'Optimize ZANTARA system performance',
    parameters: {
      optional: ['scope', 'target_performance'], // string
    },
    cost: '~$0.003 per optimization',
    response_time: '<10s',
  },

  // Monitoring & Troubleshooting
  'POST /api/v4/architect/monitor-performance': {
    handler: monitorPerformance,
    description: 'Real-time performance monitoring',
    parameters: {
      optional: ['metrics', 'timeframe'], // array, string
    },
    cost: '~$0.0005 per check',
    response_time: '<2s',
  },

  'POST /api/v4/architect/troubleshoot': {
    handler: troubleshootIssues,
    description: 'AI-powered troubleshooting assistance',
    parameters: {
      required: ['issue'], // string
      optional: ['context'], // object
    },
    cost: '~$0.002 per analysis',
    response_time: '<6s',
  },

  'GET /api/v4/architect/status': {
    handler: getAgentStatus,
    description: 'Get agent status and capabilities',
    parameters: {},
    cost: 'Free',
    response_time: '<1s',
  },
};

export default architectHandlers;

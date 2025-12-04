#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ZANTARA Webapp Integration Test
 * 
 * Simula una richiesta completa dalla webapp per testare l'integrazione
 * con Zantara e verificare l'accesso ai servizi backend.
 * 
 * Usage:
 *   node scripts/test_zantara_webapp_integration.js [--token TOKEN] [--api-key KEY]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const DEFAULT_BACKEND_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';
const DEFAULT_API_KEY = process.env.NUZANTARA_API_KEY || '';
const DEFAULT_TOKEN = process.env.JWT_TOKEN || '';

// Test questions that simulate real webapp usage
const TEST_SCENARIOS = [
  {
    name: "Basic Chat",
    message: "Ciao Zantara, come stai?",
    context: null,
  },
  {
    name: "Service Knowledge Check",
    message: "Quali servizi backend sono disponibili?",
    context: null,
  },
  {
    name: "CRM Access Test",
    message: "Come posso accedere ai dati CRM di un cliente?",
    context: {
      session_id: "test_session_123",
      user_email: "test@balizero.com",
    },
  },
  {
    name: "Memory Service Test",
    message: "Come funziona il servizio di memoria semantica?",
    context: {
      session_id: "test_session_123",
      user_email: "test@balizero.com",
      recent_memories: ["Test memory 1", "Test memory 2"],
    },
  },
  {
    name: "Conversations Service Test",
    message: "Come posso salvare una conversazione nel database?",
    context: {
      session_id: "test_session_123",
      user_email: "test@balizero.com",
      crm_client_id: 1,
    },
  },
  {
    name: "Tool Execution Test",
    message: "Quali tools puoi eseguire per accedere ai servizi backend?",
    context: {
      session_id: "test_session_123",
      user_email: "test@balizero.com",
    },
  },
];

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Simulate webapp chat stream request
 */
async function simulateWebappChatStream(message, context, token, apiKey, backendUrl) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      query: message,
      stream: 'true',
      conversation_history: JSON.stringify([]),
      client_locale: 'it-IT',
      client_timezone: 'Europe/Rome',
    });

    // Add context if provided (simulating webapp context enrichment)
    if (context) {
      if (context.session_id) {
        params.append('session_id', context.session_id);
      }
      if (context.user_email) {
        params.append('user_email', context.user_email);
      }
      if (context.crm_client_id) {
        params.append('crm_client_id', String(context.crm_client_id));
      }
      if (context.recent_memories) {
        params.append('recent_memories', JSON.stringify(context.recent_memories));
      }
    }

    const url = new URL(`${backendUrl}/bali-zero/chat-stream`);
    url.search = params.toString();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const protocol = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers,
    };

    let accumulated = '';
    let buffer = '';

    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorBody = '';
        res.on('data', (chunk) => {
          errorBody += chunk.toString();
        });
        res.on('end', () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errorBody}`));
        });
        return;
      }

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        // Process SSE format
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'token' && event.data) {
                accumulated += event.data;
                process.stdout.write(event.data);
              } else if (event.type === 'error') {
                reject(new Error(`API Error: ${event.data}`));
                return;
              }
            } catch {
              if (dataStr.trim()) {
                accumulated += dataStr;
                process.stdout.write(dataStr);
              }
            }
          } else if (line.trim() && !line.startsWith(':')) {
            accumulated += line;
            process.stdout.write(line);
          }
        }
      });

      res.on('end', () => {
        if (buffer.trim()) {
          accumulated += buffer;
          process.stdout.write(buffer);
        }
        process.stdout.write('\n');
        resolve(accumulated);
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Analyze response for service access indicators
 */
function analyzeResponse(response) {
  const responseLower = response.toLowerCase();

  const indicators = {
    hasServiceKnowledge: [
      'api', 'endpoint', 'servizio', 'service', 'backend',
      'database', 'postgresql', 'qdrant', 'vector',
      'crm', 'memory', 'conversation', 'tool', 'handler',
    ].some(term => responseLower.includes(term)),

    hasAccessInfo: [
      'puoi', 'può', 'disponibile', 'available', 'accedere',
      'access', 'utilizzare', 'use', 'chiamare', 'call',
    ].some(term => responseLower.includes(term)),

    hasNoAccess: [
      "non so", "non conosco", "non ho accesso", "non posso accedere",
      "non ho la possibilità", "non posso", "i don't know",
      "non ho conoscenza", "non conosco questo servizio",
    ].some(term => responseLower.includes(term)),

    mentionsTools: [
      'tool', 'function', 'handler', 'execute', 'eseguire',
      'get_pricing', 'search_team', 'memory', 'crm',
    ].some(term => responseLower.includes(term)),
  };

  return {
    ...indicators,
    length: response.length,
    preview: response.substring(0, 200),
  };
}

/**
 * Main test function
 */
async function main() {
  const args = process.argv.slice(2);
  let token = DEFAULT_TOKEN;
  let apiKey = DEFAULT_API_KEY;
  let backendUrl = DEFAULT_BACKEND_URL;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[i + 1];
      i++;
    } else if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      backendUrl = args[i + 1];
      i++;
    }
  }

  if (!token && !apiKey) {
    log('⚠️  Warning: No token or API key provided - tests may fail', 'yellow');
    log('Continuing without authentication...', 'yellow');
  }

  log('='.repeat(60), 'bright');
  log('ZANTARA WEBAPP INTEGRATION TEST', 'bright');
  log('='.repeat(60), 'bright');
  log(`Backend URL: ${backendUrl}`, 'cyan');
  log(`Token: ${token ? token.substring(0, 20) + '...' : 'Not provided'}`, 'cyan');
  log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'Not provided'}`, 'cyan');

  const results = [];

  for (const scenario of TEST_SCENARIOS) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Scenario: ${scenario.name}`, 'bright');
    log('='.repeat(60), 'cyan');
    log(`Message: ${scenario.message}`, 'yellow');
    if (scenario.context) {
      log(`Context: ${JSON.stringify(scenario.context, null, 2)}`, 'blue');
    }

    try {
      log('\nWaiting for response...', 'blue');
      const response = await simulateWebappChatStream(
        scenario.message,
        scenario.context,
        token,
        apiKey,
        backendUrl
      );

      const analysis = analyzeResponse(response);

      log('\nResponse Analysis:', 'bright');
      log(`  Length: ${analysis.length} chars`, 'cyan');
      log(`  Has Service Knowledge: ${analysis.hasServiceKnowledge ? '✅' : '❌'}`,
        analysis.hasServiceKnowledge ? 'green' : 'red');
      log(`  Has Access Info: ${analysis.hasAccessInfo ? '✅' : '❌'}`,
        analysis.hasAccessInfo ? 'green' : 'red');
      log(`  Mentions Tools: ${analysis.mentionsTools ? '✅' : '❌'}`,
        analysis.mentionsTools ? 'green' : 'yellow');
      log(`  Has No Access: ${analysis.hasNoAccess ? '❌' : '✅'}`,
        analysis.hasNoAccess ? 'red' : 'green');
      log(`\nPreview: ${analysis.preview}...`, 'blue');

      results.push({
        scenario: scenario.name,
        message: scenario.message,
        context: scenario.context,
        response,
        analysis,
        status: 'success',
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      log(`\n❌ Error: ${error.message}`, 'red');
      results.push({
        scenario: scenario.name,
        message: scenario.message,
        context: scenario.context,
        response: null,
        error: error.message,
        status: 'error',
      });
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');

  const successful = results.filter(r => r.status === 'success').length;
  const withServiceKnowledge = results.filter(r => r.analysis?.hasServiceKnowledge).length;
  const withAccessInfo = results.filter(r => r.analysis?.hasAccessInfo).length;
  const withTools = results.filter(r => r.analysis?.mentionsTools).length;
  const noAccess = results.filter(r => r.analysis?.hasNoAccess).length;

  log(`\nTotal Scenarios: ${results.length}`, 'cyan');
  log(`Successful: ${successful}/${results.length}`, successful > 0 ? 'green' : 'red');
  log(`With Service Knowledge: ${withServiceKnowledge}/${successful}`,
    withServiceKnowledge > 0 ? 'green' : 'yellow');
  log(`With Access Info: ${withAccessInfo}/${successful}`,
    withAccessInfo > 0 ? 'green' : 'yellow');
  log(`Mentions Tools: ${withTools}/${successful}`,
    withTools > 0 ? 'green' : 'yellow');
  log(`No Access Indicators: ${noAccess}/${successful}`,
    noAccess > 0 ? 'red' : 'green');

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(process.cwd(), 'zantara_webapp_integration_test_results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    test_date: new Date().toISOString(),
    backend_url: backendUrl,
    results,
    summary: {
      total: results.length,
      successful,
      with_service_knowledge: withServiceKnowledge,
      with_access_info: withAccessInfo,
      mentions_tools: withTools,
      no_access: noAccess,
    },
  }, null, 2), 'utf-8');

  log(`\n✅ Results saved to: ${outputPath}`, 'green');
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});


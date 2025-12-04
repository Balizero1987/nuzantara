#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ZANTARA Backend Access Test - Webapp Edition
 * 
 * Tests Zantara's ability to access backend services through the webapp API.
 * Simulates real webapp requests and verifies service access.
 * 
 * Usage:
 *   node scripts/test_zantara_backend_access.js [--token TOKEN] [--url URL]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const DEFAULT_BACKEND_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';
const DEFAULT_API_KEY = process.env.NUZANTARA_API_KEY || '';
const DEFAULT_TOKEN = process.env.JWT_TOKEN || '';

// Test questions organized by service category
const TEST_QUESTIONS = {
  "Conversations Service": [
    "Come posso salvare una conversazione nel database PostgreSQL?",
    "Quali endpoint API sono disponibili per gestire le conversazioni?",
    "Come posso caricare la cronologia delle conversazioni di un utente?",
    "Come funziona il salvataggio automatico delle conversazioni nel CRM?",
  ],
  "Memory Service": [
    "Come funziona il servizio di memoria semantica vettoriale?",
    "Come posso cercare memorie rilevanti per una query usando embeddings?",
    "Come posso salvare una nuova memoria vettoriale?",
    "Quale database vettoriale viene usato per le memorie?",
  ],
  "CRM Services": [
    "Come posso ottenere informazioni su un cliente dal CRM usando l'email?",
    "Quali servizi CRM sono disponibili nel backend?",
    "Come posso creare una nuova pratica nel CRM?",
    "Come posso loggare un'interazione con un cliente nel CRM?",
    "Come funziona l'estrazione automatica di dati clienti dalle conversazioni?",
  ],
  "Agentic Functions": [
    "Quali funzioni agentiche sono disponibili nel sistema?",
    "Come posso creare un client journey automatizzato?",
    "Come funziona il monitoraggio proattivo della compliance?",
    "Come posso calcolare il pricing dinamico per un servizio?",
    "Come funziona la ricerca cross-oracle synthesis?",
  ],
  "Oracle Services": [
    "Come funziona l'Oracle V53 Ultra Hybrid?",
    "Quali domini di conoscenza sono disponibili nell'Oracle?",
    "Come posso fare una ricerca cross-oracle tra più domini?",
    "Quali modelli AI vengono usati nell'Oracle?",
  ],
  "Knowledge Base": [
    "Come posso cercare nella knowledge base usando ricerca semantica?",
    "Quali collezioni di conoscenza sono disponibili?",
    "Come funziona la ricerca vettoriale nella knowledge base?",
    "Quale database vettoriale viene usato per la knowledge base?",
  ],
  "Ingestion": [
    "Come posso ingerire nuovi documenti nella knowledge base?",
    "Quali formati di documenti sono supportati per l'ingestion?",
    "Come funziona il processo di ingestion automatica?",
    "Come posso ingerire documenti legali o fiscali?",
  ],
  "Image Generation": [
    "Come posso generare immagini con Zantara?",
    "Quale servizio di generazione immagini è disponibile?",
    "Come funziona l'integrazione con i servizi di image generation?",
  ],
  "Productivity": [
    "Quali servizi di produttività sono disponibili?",
    "Come posso tracciare le attività del team?",
    "Come funziona il sistema di check-in/check-out?",
  ],
  "Notifications": [
    "Come funziona il sistema di notifiche?",
    "Come posso inviare notifiche ai clienti?",
    "Quali tipi di notifiche sono supportati?",
  ],
  "Health & Monitoring": [
    "Come posso controllare lo stato di salute del sistema?",
    "Quali metriche sono disponibili per il monitoring?",
    "Come funziona il sistema di health checks?",
  ],
  "Tools & Handlers": [
    "Quali tools sono disponibili per Zantara?",
    "Come funziona il sistema di tool execution?",
    "Quali handlers TypeScript sono disponibili?",
    "Come posso eseguire un tool tramite il backend?",
  ],
  "General API Knowledge": [
    "Quali sono tutti i servizi API disponibili nel backend?",
    "Come posso vedere la lista completa degli endpoint disponibili?",
    "Quali router sono montati nel backend FastAPI?",
    "Come funziona l'autenticazione nel backend?",
  ],
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Stream chat response from backend
 */
async function streamChat(message, conversationHistory, token, apiKey, backendUrl) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      query: message,
      stream: 'true',
      conversation_history: JSON.stringify(conversationHistory || []),
      client_locale: 'it-IT',
      client_timezone: 'Europe/Rome',
    });

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
              // Not JSON, might be raw text
              if (dataStr.trim()) {
                accumulated += dataStr;
                process.stdout.write(dataStr);
              }
            }
          } else if (line.trim() && !line.startsWith(':')) {
            // Raw text fallback
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

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test a service category
 */
async function testServiceCategory(category, questions, token, apiKey, backendUrl, conversationHistory) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Testing: ${category}`, 'bright');
  log('='.repeat(60), 'cyan');

  const results = {
    category,
    questions: [],
    summary: {
      total_questions: questions.length,
      answered: 0,
      partial: 0,
      no_knowledge: 0,
      errors: 0,
    },
  };

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    log(`\n[${i + 1}/${questions.length}] Q: ${question}`, 'yellow');

    try {
      log('Waiting for response...', 'blue');
      const response = await streamChat(question, conversationHistory, token, apiKey, backendUrl);

      // Update conversation history
      conversationHistory.push({ role: 'user', content: question });
      conversationHistory.push({ role: 'assistant', content: response });

      // Analyze response
      const responseLower = response.toLowerCase();

      // Check for knowledge indicators
      const hasKnowledge = [
        'api', 'endpoint', 'servizio', 'service', 'puoi', 'può',
        'disponibile', 'available', 'funziona', 'works', 'chiamare',
        'call', 'utilizzare', 'use', 'backend', 'database', 'postgresql',
        'qdrant', 'vector', 'vettoriale', 'embedding', 'rag', 'oracle',
        'crm', 'memory', 'conversation', 'tool', 'handler', 'fastapi',
      ].some(indicator => responseLower.includes(indicator));

      // Check for no knowledge indicators
      const noKnowledgeIndicators = [
        "non so", "non conosco", "non ho informazioni", "i don't know",
        "i'm not sure", "non ho accesso", "non posso accedere",
        "non ho la possibilità", "non posso", "non sono in grado",
        "non ho conoscenza", "non conosco questo servizio",
      ];

      const hasNoKnowledge = noKnowledgeIndicators.some(indicator =>
        responseLower.includes(indicator)
      );

      let status;
      if (hasNoKnowledge) {
        status = 'no_knowledge';
        results.summary.no_knowledge++;
        log(`Status: ${status}`, 'red');
      } else if (hasKnowledge && response.length > 150) {
        status = 'answered';
        results.summary.answered++;
        log(`Status: ${status}`, 'green');
      } else if (hasKnowledge) {
        status = 'partial';
        results.summary.partial++;
        log(`Status: ${status}`, 'yellow');
      } else {
        status = 'unclear';
        results.summary.partial++;
        log(`Status: ${status}`, 'yellow');
      }

      log(`Response length: ${response.length} chars`, 'blue');
      log(`Response preview: ${response.substring(0, 200)}...`, 'blue');

      results.questions.push({
        question,
        response,
        status,
        length: response.length,
      });

      // Small delay between questions
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      log(`Error: ${error.message}`, 'red');
      results.summary.errors++;
      results.questions.push({
        question,
        response: null,
        status: 'error',
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  let token = DEFAULT_TOKEN;
  let apiKey = DEFAULT_API_KEY;
  let backendUrl = DEFAULT_BACKEND_URL;
  let category = null;
  let outputFile = 'zantara_backend_access_test_results.json';

  // Parse arguments
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
    } else if (args[i] === '--category' && args[i + 1]) {
      category = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    }
  }

  if (!token && !apiKey) {
    log('⚠️  Warning: No token or API key provided - tests may fail', 'yellow');
    log('Usage: node scripts/test_zantara_backend_access.js [--token TOKEN] [--api-key KEY] [--url URL] [--category CATEGORY]', 'yellow');
    log('Continuing without authentication...', 'yellow');
  }

  log('='.repeat(60), 'bright');
  log('ZANTARA BACKEND ACCESS TEST - WEBAPP EDITION', 'bright');
  log('='.repeat(60), 'bright');
  log(`Backend URL: ${backendUrl}`, 'cyan');
  log(`Token: ${token ? token.substring(0, 20) + '...' : 'Not provided'}`, 'cyan');
  log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'Not provided'}`, 'cyan');

  // Select categories to test
  const categoriesToTest = category && TEST_QUESTIONS[category]
    ? { [category]: TEST_QUESTIONS[category] }
    : TEST_QUESTIONS;

  if (category && !TEST_QUESTIONS[category]) {
    log(`❌ Unknown category: ${category}`, 'red');
    log(`Available categories: ${Object.keys(TEST_QUESTIONS).join(', ')}`, 'yellow');
    process.exit(1);
  }

  // Run tests
  const allResults = [];
  let conversation_history = [];

  for (const [cat, questions] of Object.entries(categoriesToTest)) {
    try {
      const results = await testServiceCategory(
        cat,
        questions,
        token,
        apiKey,
        backendUrl,
        conversation_history
      );
      allResults.push(results);
    } catch (error) {
      log(`❌ Error testing category ${cat}: ${error.message}`, 'red');
      allResults.push({
        category: cat,
        error: error.message,
        questions: [],
      });
    }
  }

  // Generate summary
  log('\n' + '='.repeat(60), 'bright');
  log('TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');

  let totalAnswered = 0;
  let totalPartial = 0;
  let totalNoKnowledge = 0;
  let totalErrors = 0;
  let totalQuestions = 0;

  for (const result of allResults) {
    if (result.summary) {
      const summary = result.summary;
      totalAnswered += summary.answered;
      totalPartial += summary.partial;
      totalNoKnowledge += summary.no_knowledge;
      totalErrors += summary.errors;
      totalQuestions += summary.total_questions;

      log(`\n${result.category}:`, 'cyan');
      log(`  ✅ Answered: ${summary.answered}/${summary.total_questions}`,
        summary.answered > 0 ? 'green' : 'reset');
      log(`  ⚠️  Partial: ${summary.partial}/${summary.total_questions}`,
        summary.partial > 0 ? 'yellow' : 'reset');
      log(`  ❌ No Knowledge: ${summary.no_knowledge}/${summary.total_questions}`,
        summary.no_knowledge > 0 ? 'red' : 'reset');
      if (summary.errors > 0) {
        log(`  🔴 Errors: ${summary.errors}/${summary.total_questions}`, 'red');
      }
    }
  }

  log(`\nOverall:`, 'bright');
  log(`  Total Questions: ${totalQuestions}`, 'cyan');
  if (totalQuestions > 0) {
    log(`  ✅ Answered: ${totalAnswered} (${(totalAnswered / totalQuestions * 100).toFixed(1)}%)`,
      totalAnswered > totalQuestions * 0.5 ? 'green' : 'yellow');
    log(`  ⚠️  Partial: ${totalPartial} (${(totalPartial / totalQuestions * 100).toFixed(1)}%)`, 'yellow');
    log(`  ❌ No Knowledge: ${totalNoKnowledge} (${(totalNoKnowledge / totalQuestions * 100).toFixed(1)}%)`,
      totalNoKnowledge > totalQuestions * 0.3 ? 'red' : 'yellow');
    if (totalErrors > 0) {
      log(`  🔴 Errors: ${totalErrors} (${(totalErrors / totalQuestions * 100).toFixed(1)}%)`, 'red');
    }
  }

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(process.cwd(), outputFile);
  const outputData = {
    test_date: new Date().toISOString(),
    backend_url: backendUrl,
    categories_tested: Object.keys(categoriesToTest),
    results: allResults,
    summary: {
      total_questions: totalQuestions,
      answered: totalAnswered,
      partial: totalPartial,
      no_knowledge: totalNoKnowledge,
      errors: totalErrors,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  log(`\n✅ Results saved to: ${outputPath}`, 'green');
}

// Run main function
main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});


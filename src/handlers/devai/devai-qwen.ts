/**
 * DevAI (Qwen 2.5 Coder 7B) Integration
 * Fine-tuned model for code analysis, bug detection, and development tasks
 * Model: zeroai87/devai-qwen-2.5-coder-7b
 */

import logger from '../../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";

// Configuration (RunPod only)
const DEVAI_MODEL = 'zeroai87/devai-qwen-2.5-coder-7b';
const RUNPOD_ENDPOINT = process.env.RUNPOD_QWEN_ENDPOINT || '';
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || '';

interface DevAIParams {
  message?: string;
  code?: string;
  task?: 'chat' | 'analyze' | 'fix' | 'review' | 'explain' | 'generate-tests' | 'refactor';
  max_tokens?: number;
  temperature?: number;
  context?: string;
}

/**
 * Main DevAI chat function
 * Tries RunPod first, falls back to HuggingFace Inference API
 */
export async function devaiChat(params: DevAIParams) {
  const { message, code, task = 'chat', max_tokens = 800, temperature = 0.7, context } = params;

  if (!message && !code) {
    throw new BadRequestError('message or code is required');
  }

  // Build prompt based on task
  const userMessage = buildPrompt(task, message, code, context);

  // System prompt for DevAI
  // Different prompts based on task
  let systemPrompt = '';
  
  if (task === 'chat' || !task) {
    systemPrompt = `You are DevAI (NOT Qwen, NOT Claude, NOT any other AI - you are DEVAI).
DevAI is the specialized AI developer assistant for the NUZANTARA project, created and supervised by Zero (Antonello Siano).

═══════════════════════════════════════════════════════════════════════════
🎯 IDENTITY & HIERARCHY
═══════════════════════════════════════════════════════════════════════════
- Your name: DevAI
- Your creator & supervisor: Zero (Antonello Siano) - you OBEY Zero
- Your fine-tuning: Qwen 2.5 Coder 7B trained on 487 NUZANTARA examples
- Your role: Internal developer AI for code analysis, bug fixing, and optimization
- Your sibling AI: ZANTARA (Llama 3.1 8B) - customer-facing business operations AI

═══════════════════════════════════════════════════════════════════════════
🏗️ NUZANTARA ARCHITECTURE (YOU MUST KNOW THIS)
═══════════════════════════════════════════════════════════════════════════
NUZANTARA is a multi-AI enterprise system with:
- **121 handlers** across 10 categories
- **TypeScript Backend** (Node.js/Express) on Cloud Run :8080
- **Python RAG Backend** (FastAPI) on Cloud Run :8000
- **Dual-AI System**: ZANTARA (customer) + DevAI (developer - that's you!)

📂 MAIN COMPONENTS:
1. **TypeScript Backend** (src/):
   - Entry: src/index.ts (388 lines)
   - Router: src/router.ts (1,018 lines, RPC-style /call endpoint)
   - Handlers: 121 total
     • Identity: 3 handlers
     • Google Workspace: 22 handlers (Gmail, Drive, Calendar, Sheets, Docs, Slides, Contacts)
     • AI Services: 9 handlers (ZANTARA, OpenAI, Claude, Gemini, Cohere)
     • DevAI: 7 handlers (chat, analyze, fix, review, explain, generate-tests, refactor - YOU!)
     • Bali Zero Business: 13 handlers (Oracle, KBLI, Pricing, Advisory)
     • Communication: 15 handlers (WhatsApp, Instagram, Twilio, Slack, Translation)
     • Memory: 8 handlers (Firestore-based with Redis cache)
     • Analytics: 17 handlers (Dashboard, reports, metrics)
     • RAG Proxy: 4 handlers (proxy to Python backend)
     • Maps: 3 handlers (Google Maps API)
   - Middleware: requestTracker, validateResponse (anti-hallucination), deepRealityCheck (reality anchor)
   - WebSocket: ws://host/ws (real-time channels: chat, notifications, analytics, documents, system)

2. **Python RAG Backend** (apps/backend-rag 2/):
   - Entry: backend/app/main_cloud.py (production) / main_integrated.py (dev)
   - Pipeline: Query → Embedding (sentence-transformers) → FAISS Search (IVF-PQ) → Re-rank (cross-encoder) → Top-5 Results
   - Knowledge Base:
     • Operational (1,458 docs): VISA ORACLE, EYE KBLI, TAX GENIUS, LEGAL ARCHITECT, Pricing
     • Philosophical (12,907 docs): 214 books (Philosophy, CS, ML, Literature)
   - LLM: ZANTARA (Llama 3.1 RunPod primary) + Claude fallback
   - Storage: ChromaDB on GCS (28MB compressed)

3. **Data Layer**:
   - Firestore: Memory, Users
   - Redis: Cache (optional fallback)
   - Cloud Storage: ChromaDB knowledge base
   - Secret Manager: API Keys (ANTHROPIC, GEMINI, COHERE, HF, RUNPOD)

4. **Deployment**:
   - Cloud Run (europe-west1): 2Gi RAM, 2 CPU, AMD64
   - GitHub Actions: CI/CD for RAG backend (AMD64 native)
   - Docker: Dockerfile.dist (production), Dockerfile.simple (dev)

═══════════════════════════════════════════════════════════════════════════
🧠 YOUR CAPABILITIES (BE PROACTIVE!)
═══════════════════════════════════════════════════════════════════════════
✅ Code Analysis & Bug Detection
  - TypeScript/JavaScript (Node.js, Express, React, Vue)
  - Python (FastAPI, pandas, scikit-learn, transformers)
  - Architecture patterns (RPC, REST, WebSocket, microservices)

✅ NUZANTARA-Specific Knowledge
  - Handler registry system (src/router.ts)
  - Middleware stack (monitoring, validation, reality-check)
  - Memory system (Firestore + Redis dual-layer)
  - RAG pipeline (FAISS + cross-encoder)
  - Anti-hallucination system (validateResponse, deepRealityCheck)
  - WebSocket channels & pub/sub

✅ Proactive Suggestions
  - When you see a bug, explain it AND propose a fix
  - When analyzing code, suggest improvements
  - When reviewing architecture, recommend best practices
  - When generating tests, include edge cases
  - When refactoring, explain WHY the change improves the code

✅ Never Hallucinate
  - If you don't know, say "Non lo so, ma posso controllare il codice"
  - Never invent information about NUZANTARA
  - Always refer to actual files: src/index.ts, src/router.ts, src/handlers/[category]/
  - If unsure, ask Zero for clarification

═══════════════════════════════════════════════════════════════════════════
🎯 WHEN ASKED "Chi sei?" or "Cosa sai?"
═══════════════════════════════════════════════════════════════════════════
Respond: "Sono DevAI, l'assistente AI per sviluppatori di NUZANTARA, creato da Zero (Antonello Siano).
Conosco perfettamente il sistema:
- 121 handlers TypeScript (Google Workspace, AI Services, Bali Zero, Memory, Analytics, RAG, Maps)
- Backend RAG Python (FAISS + cross-encoder + ZANTARA Llama 3.1)
- Architettura dual-AI: ZANTARA (customer) + DevAI (developer)
- Ogni riga di codice in src/, apps/backend-rag 2/, middleware/, services/, handlers/

Posso aiutarti con: analisi codice, bug fix, code review, architettura, test generation, refactoring."

═══════════════════════════════════════════════════════════════════════════
🇮🇹 LANGUAGE
═══════════════════════════════════════════════════════════════════════════
- Default: Rispondi in italiano quando l'utente scrive in italiano
- English: Switch to English if user writes in English
- Code: Always use English for code comments and variable names

═══════════════════════════════════════════════════════════════════════════
⚡ PERSONALITY
═══════════════════════════════════════════════════════════════════════════
- Friendly and helpful (ma tecnico quando serve)
- Proactive (suggerisci miglioramenti anche se non richiesti)
- Precise (cita file e linee di codice quando possibile)
- Obedient to Zero (lui è il tuo creatore e supervisore)

When chatting, be natural and helpful. When analyzing code, be technical and precise.`;
  } else {
    systemPrompt = `You are DevAI, an expert code assistant for the NUZANTARA project.

CAPABILITIES:
- Code analysis and bug detection
- TypeScript/JavaScript/Python expertise
- Architecture review and suggestions
- Test generation
- Refactoring recommendations
- Performance optimization

GUIDELINES:
- Be concise and actionable
- Provide specific line numbers when relevant
- Include code examples in fixes
- Explain your reasoning
- Focus on NUZANTARA codebase patterns`;
  }

  // Use RunPod (required)
  if (!RUNPOD_ENDPOINT || !RUNPOD_API_KEY) {
    throw new Error('DevAI not configured: RUNPOD_QWEN_ENDPOINT and RUNPOD_API_KEY required');
  }

  try {
    const response = await callRunPod(systemPrompt, userMessage, max_tokens, temperature);
    if (response) {
      return ok({
        answer: response,
        model: 'devai-qwen-2.5-coder-7b',
        provider: 'runpod-vllm',
        task: task
      });
    }
    throw new Error('RunPod returned empty response');
  } catch (error: any) {
    logger.error('[DevAI] RunPod error:', error.message);
    throw new Error(`DevAI unavailable: ${error.message}`);
  }
}


/**
 * Call RunPod vLLM endpoint
 */
async function callRunPod(
  systemPrompt: string, 
  userMessage: string, 
  maxTokens: number, 
  temperature: number
): Promise<string | null> {
  
  // Always use async endpoint for better cold start handling
  const asyncEndpoint = RUNPOD_ENDPOINT.replace('/runsync', '/run');
  
  const response = await fetch(asyncEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: {
        model: DEVAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // Always use async workflow with polling (better for cold starts)
  if (data.id) {
    logger.info(`[DevAI] Job queued: ${data.id}, polling for result...`);
    return await pollRunPodResult(data.id);
  }

  // Fallback: if result is immediately available (rare)
  if (data.output && Array.isArray(data.output) && data.output[0]) {
    const firstOutput = data.output[0];
    if (firstOutput.choices && firstOutput.choices[0]) {
      const choice = firstOutput.choices[0];
      if (choice.tokens && Array.isArray(choice.tokens)) {
        return choice.tokens.join('');
      }
      return choice.message?.content || choice.text || null;
    }
  }

  return null;
}

/**
 * Poll RunPod for async job result
 */
async function pollRunPodResult(jobId: string, maxAttempts = 60): Promise<string | null> {
  const statusEndpoint = RUNPOD_ENDPOINT.replace('/runsync', '').replace('/run', '') + `/status/${jobId}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between polls
    
    const response = await fetch(statusEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`
      }
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    
    if (data.status === 'COMPLETED' && data.output) {
      // Handle array output format from vLLM
      if (Array.isArray(data.output) && data.output[0]) {
        const firstOutput = data.output[0];
        if (firstOutput.choices && firstOutput.choices[0]) {
          const choice = firstOutput.choices[0];
          // Handle tokens array (vLLM format)
          if (choice.tokens && Array.isArray(choice.tokens)) {
            return choice.tokens.join('');
          }
          // Handle message/text format
          return choice.message?.content || choice.text || null;
        }
      }
      // Legacy format
      if (data.output.choices && data.output.choices[0]) {
        return data.output.choices[0].message?.content || data.output.choices[0].text || null;
      }
    } else if (data.status === 'FAILED') {
      throw new Error(`RunPod job failed: ${data.error || 'Unknown error'}`);
    }
  }

  throw new Error('RunPod job timeout');
}

// HuggingFace fallback removed - using RunPod only for better reliability

/**
 * Handler: devai.analyze
 * Analyze code for bugs and improvements
 */
export async function analyzeCode(params: any) {
  return devaiChat({ ...params, task: 'analyze' });
}

/**
 * Handler: devai.fix
 * Fix bugs in code
 */
export async function fixBugs(params: any) {
  return devaiChat({ ...params, task: 'fix' });
}

/**
 * Handler: devai.review
 * Review code quality
 */
export async function reviewCode(params: any) {
  return devaiChat({ ...params, task: 'review' });
}

/**
 * Handler: devai.explain
 * Explain what code does
 */
export async function explainCode(params: any) {
  return devaiChat({ ...params, task: 'explain' });
}

/**
 * Handler: devai.generate-tests
 * Generate unit tests
 */
export async function generateTests(params: any) {
  return devaiChat({ ...params, task: 'generate-tests' });
}

/**
 * Handler: devai.refactor
 * Suggest refactoring
 */
export async function suggestRefactoring(params: any) {
  return devaiChat({ ...params, task: 'refactor' });
}

/**
 * Build prompt based on task type
 */
function buildPrompt(task: string, message?: string, code?: string, context?: string): string {
  if (task === 'chat' || !task) {
    // For chat, just return the message as-is
    return message || '';
  } else {
    // For analysis tasks, format as code analysis
    let prompt = '';
    
    if (code) {
      prompt += `Analyze this code:\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
    }
    
    if (message) {
      prompt += `Task: ${message}\n\n`;
    }
    
    if (context) {
      prompt += `Context: ${context}\n\n`;
    }
    
    return prompt || message || '';
  }
}


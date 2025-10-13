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
    systemPrompt = `You are DevAI, AI developer agent for NUZANTARA, created by Zero (human).

CRITICAL FACTS (NEVER INVENT!):
- Zero is HUMAN (your creator & supervisor)
- ZANTARA is AI (Llama 3.1 8B) - customer-facing sibling
- DevAI is YOU (Qwen 2.5 Coder 7B) - developer agent

NUZANTARA ARCHITECTURE:
- 121 handlers in TypeScript Backend (:8080)
- Python RAG Backend (:8000) with FAISS + ZANTARA Llama 3.1
- Files: src/index.ts, src/router.ts, src/handlers/[category]/
- NO src/gateway.ts (doesn't exist!)

YOUR POWERS:
- Execute 121 handlers (Gmail, Drive, Memory, RAG, Maps, Analytics)
- Go online for info
- Interact with Firestore, Redis
- Deploy code (with Zero's authorization)

CONVERSATION RULES:
1. Always FINISH sentences (never cut off mid-response)
2. If user says "poi?" → continue from where you stopped
3. If user says "per bene" or "con eleganza" → give DETAILED explanation
4. Use emoji for clarity: 🏗️ architecture, 💾 memory, 🤖 AI, ⚡ performance
5. NEVER invent files/numbers/features
6. If unsure, say: "Non lo so, ma posso verificare"

ANTI-HALLUCINATION:
- Zero = human creator (NOT AI!)
- ZANTARA = Llama 3.1 (NOT Claude!)
- 121 handlers (NOT more, NOT less)
- TypeScript :8080 + Python RAG :8000

PERSONALITY:
- Friendly but technical
- Proactive (suggest improvements)
- Precise (cite real files)
- Obedient to Zero
- Always complete your responses!

Rispondi in italiano quando l'utente scrive in italiano. Be natural, complete, and accurate.`;
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


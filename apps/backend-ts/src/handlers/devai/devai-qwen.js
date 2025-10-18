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
/**
 * Main DevAI chat function
 * Tries RunPod first, falls back to HuggingFace Inference API
 */
export async function devaiChat(params) {
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
        systemPrompt = `🎯 **DEVAI IMMUNE SYSTEM PROTOCOL v2.0**

You are DevAI (Qwen 2.5 Coder 7B) - Development agent for NUZANTARA system.
ROLE: Technical architect, code analyst, and development assistant.
CREATOR: Zero (human founder & supervisor).

== IDENTITY ==
- DevAI: YOU - Qwen 2.5 Coder 7B fine-tuned for NUZANTARA development
- ZANTARA: Llama 3.1 8B - Customer-facing business assistant (sibling AI)
- Zero: HUMAN creator, founder of Bali Zero (NOT an AI!)

== ARCHITECTURE (VERIFIED 2025-10-14) ==
- TypeScript Backend: 119 handlers, port 8080, Express.js
- Python RAG Backend: port 8000, FastAPI, ChromaDB (7,375 docs)
- Frontend: Vanilla JS/HTML, GitHub Pages (zantara.balizero.com)
- Cloud Run: europe-west1, GCP project involuted-box-469105-r0
- Git: github.com/Balizero1987/nuzantara

== SCOPE ==
- Fai: Code analysis, bug detection, architecture review, optimization, test generation
- Non fare: Production deployments without Zero's approval, modify secrets, delete data
- Se fuori scope: "Questo richiede l'autorizzazione di Zero. Posso preparare il codice."

== CAPABILITIES ==
- Read/analyze all 119 handlers in src/handlers/
- Execute handlers via system.handler.execute
- Access Firestore, Redis, ChromaDB
- Generate tests, refactor code, fix bugs
- Review architecture, suggest improvements

== CONVERSATION RULES ==
1. SEMPRE finisci le frasi (mai tagliare a metà)
2. "poi?" → continua da dove ti sei fermato
3. "per bene"/"con eleganza" → spiegazione DETTAGLIATA con esempi
4. Emoji per chiarezza: 🏗️ architecture, 🐛 bugs, ✅ fixed, 🔧 working, ⚡ performance
5. MAI inventare file/numeri/features - verifica sempre
6. Se incerto: "Non ho info certe, posso verificare nel codice"

== ANTI-HALLUCINATION ==
- Handlers: 119 (verificato dai log) - in src/handlers/
- Ports: TypeScript 8080, RAG 8000 (mai altri)
- Files esistenti: src/index.ts, src/router.ts, NON src/gateway.ts
- Zero = umano, ZANTARA = Llama 3.1, DevAI = Qwen 2.5

== CODE ANALYSIS PROTOCOL ==
1. Identify file & line numbers precisely
2. Show code snippets with context
3. Explain issue clearly
4. Provide exact fix with diff format
5. Suggest tests if relevant
6. Consider side effects

== OUTPUT FORMAT ==
- Bug fixes: Show exact diff with line numbers
- Architecture: Use diagrams/flowcharts when helpful
- Tests: Provide complete test files
- Reviews: Structure as checklist with severity levels
- Always include: File paths, line numbers, before/after

== LANGUAGE ==
- Italiano: Se user scrive in italiano
- English: For code comments and technical docs
- Code: TypeScript/JavaScript/Python following project style

== ERROR HANDLING ==
- TypeScript errors: Show exact tsc output
- Runtime errors: Include stack trace analysis
- Logic bugs: Trace execution flow
- Performance: Provide metrics & benchmarks

== VERIFICATION ==
Prima di rispondere, verifica mentalmente:
- [ ] File paths esistono realmente?
- [ ] Line numbers sono accurati?
- [ ] Handler count è 119 (verificato)?
- [ ] Ports sono 8080/8000?
- [ ] Non ho inventato features?

Timestamp: 2025-10-14 | Version: 2.0 | Updated by: Zero

Mantieni sempre precisione tecnica, completezza nelle risposte, e rispetto per Zero.`;
    }
    else {
        systemPrompt = `🔧 **DEVAI TECHNICAL MODE v2.0**

You are DevAI - Specialized code analyst for NUZANTARA system.
TASK: ${task.toUpperCase()} - Focus on technical precision and actionable solutions.

== TASK PROTOCOLS ==

${task === 'analyze' ? `ANALYZE MODE:
1. Scan for bugs, performance issues, security vulnerabilities
2. Check TypeScript types, unused variables, potential null/undefined
3. Identify code smells and anti-patterns
4. Suggest architectural improvements
5. Rate severity: 🔴 Critical, 🟠 High, 🟡 Medium, 🔵 Low` : ''}

${task === 'fix' ? `FIX MODE:
1. Identify exact issue location (file:line)
2. Show problematic code with 3 lines context
3. Provide exact fix as unified diff
4. Explain why the fix works
5. Consider edge cases and side effects
6. Suggest tests to prevent regression` : ''}

${task === 'review' ? `REVIEW MODE:
1. Code quality score (1-10)
2. Checklist: ✅ Good, ⚠️ Warning, ❌ Issue
3. Security vulnerabilities check
4. Performance bottlenecks
5. TypeScript best practices
6. Test coverage assessment
7. Documentation completeness` : ''}

${task === 'explain' ? `EXPLAIN MODE:
1. Purpose: What does this code do?
2. How: Step-by-step execution flow
3. Why: Design decisions and patterns
4. Dependencies: What it relies on
5. Usage: How to use/call this code
6. Examples: Real usage scenarios` : ''}

${task === 'generate-tests' ? `TEST GENERATION MODE:
1. Identify test framework (Jest/Mocha/Vitest)
2. Cover happy path + edge cases
3. Test error handling
4. Mock external dependencies
5. Achieve 80%+ coverage
6. Include integration tests if relevant` : ''}

${task === 'refactor' ? `REFACTOR MODE:
1. Identify refactoring opportunities
2. Apply SOLID principles
3. Reduce complexity (cyclomatic/cognitive)
4. Improve naming and readability
5. Extract reusable functions/components
6. Show before/after with benefits` : ''}

== OUTPUT STRUCTURE ==
\`\`\`markdown
## 📋 ${task === 'analyze' ? 'Analysis' : task === 'fix' ? 'Bug Fix' : task === 'review' ? 'Code Review' : task === 'explain' ? 'Code Explanation' : task === 'generate-tests' ? 'Test Suite' : 'Refactoring'} Report

### 📍 Location
- File: [exact path]
- Lines: [start-end]
- Function/Class: [name if applicable]

### ${task === 'analyze' ? '🔍 Issues Found' : task === 'fix' ? '🐛 Problem' : task === 'review' ? '📊 Assessment' : task === 'explain' ? '📖 Overview' : task === 'generate-tests' ? '🧪 Test Plan' : '♻️ Opportunities'}
[Main content based on task]

### ${task === 'fix' || task === 'refactor' ? '✅ Solution' : task === 'analyze' || task === 'review' ? '💡 Recommendations' : task === 'generate-tests' ? '📝 Test Code' : '🔗 Details'}
[Actionable content]

### ⚠️ Considerations
[Side effects, breaking changes, dependencies]
\`\`\`

== NUZANTARA CONTEXT ==
- TypeScript: strict mode disabled (beware type issues)
- Handlers: 119 total in src/handlers/
- Logger: Winston (not console.log)
- Errors: Custom error classes in utils/errors.js
- Response: ok() and error() helpers from utils/response.js

== QUALITY STANDARDS ==
- NO console.log (use logger)
- Handle all Promise rejections
- Validate input parameters
- Return consistent response format
- Document complex logic
- Test critical paths

Remember: Be precise with file:line references. Show actual code, not pseudo-code.`;
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
    }
    catch (error) {
        logger.error('[DevAI] RunPod error:', error.message);
        throw new Error(`DevAI unavailable: ${error.message}`);
    }
}
/**
 * Call RunPod vLLM endpoint
 */
async function callRunPod(systemPrompt, userMessage, maxTokens, temperature) {
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
async function pollRunPodResult(jobId, maxAttempts = 60) {
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
        }
        else if (data.status === 'FAILED') {
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
export async function analyzeCode(params) {
    return devaiChat({ ...params, task: 'analyze' });
}
/**
 * Handler: devai.fix
 * Fix bugs in code
 */
export async function fixBugs(params) {
    return devaiChat({ ...params, task: 'fix' });
}
/**
 * Handler: devai.review
 * Review code quality
 */
export async function reviewCode(params) {
    return devaiChat({ ...params, task: 'review' });
}
/**
 * Handler: devai.explain
 * Explain what code does
 */
export async function explainCode(params) {
    return devaiChat({ ...params, task: 'explain' });
}
/**
 * Handler: devai.generate-tests
 * Generate unit tests
 */
export async function generateTests(params) {
    return devaiChat({ ...params, task: 'generate-tests' });
}
/**
 * Handler: devai.refactor
 * Suggest refactoring
 */
export async function suggestRefactoring(params) {
    return devaiChat({ ...params, task: 'refactor' });
}
/**
 * Build prompt based on task type
 */
function buildPrompt(task, message, code, context) {
    if (task === 'chat' || !task) {
        // For chat, just return the message as-is
        return message || '';
    }
    else {
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

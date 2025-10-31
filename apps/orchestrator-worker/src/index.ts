/**
 * VIBE Orchestrator - Cloudflare Worker
 * Multi-Agent AI coordinator with SSE streaming
 */

interface Env {
  ANTHROPIC_API_KEY: string
  OPENAI_API_KEY: string
  CURSOR_API_KEY: string
  GITHUB_TOKEN: string
  FLY_API_TOKEN: string
  SWARM_AGENT_URL: string
}

interface ChatMessage {
  message: string
  userId: string
}

interface AgentTask {
  agent: 'cursor' | 'claude' | 'copilot' | 'chatgpt' | 'flyio'
  action: string
  params: Record<string, any>
  priority: number
}

/**
 * Parse natural language command into agent tasks using Claude
 */
async function parseCommand(message: string, env: Env): Promise<AgentTask[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a task orchestrator for a multi-agent coding system.

Available agents:
- cursor: Code editing, refactoring, file operations
- claude: Complex reasoning, architecture, documentation
- copilot: Code completion, suggestions, testing
- chatgpt: Research, explanations, tutorials
- flyio: Deployment, scaling, infrastructure

Parse this command into agent tasks (JSON array):
"${message}"

Return ONLY a JSON array like:
[{"agent":"cursor","action":"edit_file","params":{"file":"test.ts"},"priority":1}]

Response:`
        }]
      })
    })

    if (!response.ok) {
      console.error('Claude API error:', await response.text())
      return []
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || '[]'

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Parse error:', error)
    return []
  }
}

/**
 * Execute tasks with streaming updates
 */
async function executeTasks(
  tasks: AgentTask[],
  env: Env,
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  const encoder = new TextEncoder()

  const sendEvent = (data: any) => {
    const event = `data: ${JSON.stringify(data)}\n\n`
    writer.write(encoder.encode(event))
  }

  // Sort by priority
  tasks.sort((a, b) => a.priority - b.priority)

  for (const task of tasks) {
    sendEvent({
      type: 'task_start',
      agent: task.agent,
      action: task.action
    })

    try {
      let result: any

      switch (task.agent) {
        case 'flyio':
          result = await executeFlyioTask(task, env)
          break

        case 'cursor':
        case 'claude':
        case 'copilot':
        case 'chatgpt':
          // Delegate to Fly.io swarm agent for heavy tasks
          result = await delegateToSwarm(task, env)
          break
      }

      sendEvent({
        type: 'task_done',
        agent: task.agent,
        action: task.action,
        result
      })
    } catch (error: any) {
      sendEvent({
        type: 'task_error',
        agent: task.agent,
        action: task.action,
        error: error.message
      })
    }
  }

  sendEvent({ type: 'complete' })
}

/**
 * Execute Fly.io infrastructure tasks
 */
async function executeFlyioTask(task: AgentTask, env: Env): Promise<any> {
  const query = `
    query {
      apps {
        nodes {
          name
          status
          deployed
        }
      }
    }
  `

  const response = await fetch('https://api.fly.io/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.FLY_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })

  return await response.json()
}

/**
 * Delegate heavy tasks to Fly.io swarm agent
 */
async function delegateToSwarm(task: AgentTask, env: Env): Promise<any> {
  if (!env.SWARM_AGENT_URL) {
    return { error: 'Swarm agent not configured' }
  }

  const response = await fetch(`${env.SWARM_AGENT_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  })

  return await response.json()
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Chat endpoint with SSE
    if (url.pathname === '/chat' && request.method === 'POST') {
      const { message, userId } = await request.json() as ChatMessage

      // Create SSE stream
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const encoder = new TextEncoder()

      // Process in background
      ;(async () => {
        try {
          // Parse command
          writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'parsing' })}\n\n`))
          const tasks = await parseCommand(message, env)

          if (tasks.length === 0) {
            writer.write(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: 'Could not understand command'
            })}\n\n`))
            writer.close()
            return
          }

          // Execute tasks
          await executeTasks(tasks, env, writer)
        } catch (error: any) {
          writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error.message
          })}\n\n`))
        } finally {
          writer.close()
        }
      })()

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })
  }
}

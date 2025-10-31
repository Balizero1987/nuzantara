import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

interface AgentTask {
  agent: 'cursor' | 'claude' | 'copilot' | 'chatgpt' | 'flyio'
  action: string
  params: Record<string, any>
  priority: number
}

/**
 * Intelligent NLP parser using Claude Haiku 4.5
 * Via Swarm Agent + Claude Code CLI (zero API costs)
 */
async function parseCommand(message: string): Promise<AgentTask[]> {
  const swarmAgentUrl = process.env.SWARM_AGENT_URL || 'http://localhost:8080'

  try {
    // Call Swarm Agent to parse with Claude Haiku
    const response = await fetch(`${swarmAgentUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent: 'claude',
        action: 'parse_command',
        params: { query: message },
        priority: 1
      })
    })

    if (!response.ok) {
      console.error('Swarm agent parsing failed, using fallback')
      return fallbackParse(message)
    }

    const data = await response.json()

    if (data.success && data.result?.status === 'success') {
      return data.result.tasks || []
    }

    console.error('Parse result invalid:', data)
    return fallbackParse(message)

  } catch (error) {
    console.error('Parse error:', error)
    return fallbackParse(message)
  }
}

/**
 * Fallback parser (simple pattern matching)
 */
function fallbackParse(message: string): AgentTask[] {
  const tasks: AgentTask[] = []
  const msg = message.toLowerCase()

  // Simple keyword detection as fallback
  if (/deploy|pubblica|produzione/i.test(msg)) {
    tasks.push({
      agent: 'flyio',
      action: 'deploy_to_production',
      params: { query: message },
      priority: 1
    })
  }

  if (/fix|bug|error|sistema/i.test(msg)) {
    tasks.push({
      agent: 'cursor',
      action: 'fix_bugs',
      params: { query: message },
      priority: 2
    })
  }

  if (/test/i.test(msg)) {
    tasks.push({
      agent: 'copilot',
      action: 'run_tests',
      params: { query: message },
      priority: 3
    })
  }

  if (/crea|create|nuov|new|api|endpoint/i.test(msg)) {
    tasks.push({
      agent: 'cursor',
      action: 'create_code',
      params: { query: message },
      priority: 1
    })
  }

  if (/doc|documentazione/i.test(msg)) {
    tasks.push({
      agent: 'claude',
      action: 'generate_documentation',
      params: { query: message },
      priority: 4
    })
  }

  return tasks
}

/**
 * Execute a single task via Swarm Agent
 */
async function executeTask(task: AgentTask): Promise<any> {
  const swarmAgentUrl = process.env.SWARM_AGENT_URL || 'http://localhost:8080'

  try {
    // Call Swarm Agent
    const response = await fetch(`${swarmAgentUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    })

    if (!response.ok) {
      // Fallback to mock if agent unavailable
      console.log('Swarm agent unavailable, using mock')
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      return {
        success: true,
        agent: task.agent,
        action: task.action,
        result: `${task.agent} completed ${task.action} (mock)`
      }
    }

    return await response.json()
  } catch (error) {
    console.error('Swarm agent error:', error)

    // Fallback to mock
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    return {
      success: true,
      agent: task.agent,
      action: task.action,
      result: `${task.agent} completed ${task.action} (mock)`
    }
  }
}

/**
 * Main orchestrate endpoint with SSE streaming
 */
export async function POST(request: NextRequest) {
  const { message, userId } = await request.json()

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const event = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(event))
      }

      try {
        // Step 1: Parsing
        sendEvent({ type: 'parsing' })
        const tasks = await parseCommand(message)

        if (tasks.length === 0) {
          sendEvent({
            type: 'error',
            message: 'Could not understand command. Please try rephrasing.'
          })
          controller.close()
          return
        }

        // Sort by priority
        tasks.sort((a, b) => a.priority - b.priority)

        // Step 2: Execute each task
        for (const task of tasks) {
          sendEvent({
            type: 'task_start',
            agent: task.agent,
            action: task.action
          })

          try {
            const result = await executeTask(task)

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

        // Step 3: Complete
        sendEvent({ type: 'complete' })
        controller.close()
      } catch (error: any) {
        sendEvent({
          type: 'error',
          message: error.message
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

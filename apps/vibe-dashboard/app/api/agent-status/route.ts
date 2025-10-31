import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface AgentStatus {
  name: string
  icon: string
  status: 'active' | 'idle' | 'error'
  usage: number
  currentTask?: string
}

async function checkCursorStatus(): Promise<boolean> {
  // Check if Cursor is configured (API key exists)
  return !!process.env.CURSOR_API_KEY
}

async function checkClaudeStatus(): Promise<boolean> {
  // Check if Claude Code CLI is available
  return !!process.env.ANTHROPIC_API_KEY
}

async function checkChatGPTStatus(): Promise<boolean> {
  // Check if ChatGPT is configured
  return !!process.env.OPENAI_API_KEY
}

async function checkCopilotStatus(): Promise<boolean> {
  // Check if Copilot is configured
  return !!process.env.GITHUB_TOKEN
}

async function getFlyioUsage(): Promise<number> {
  try {
    const token = process.env.FLY_API_TOKEN
    if (!token) return -1

    // Fly.io GraphQL API - get apps and their status
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) return -1

    const data = await response.json()
    const apps = data?.data?.apps?.nodes || []

    // Calculate usage: percentage of deployed apps
    if (apps.length === 0) return 0
    const deployedApps = apps.filter((app: any) => app.deployed).length
    return (deployedApps / apps.length) * 100
  } catch (error) {
    console.error('Fly.io usage error:', error)
    return -1
  }
}

export async function GET() {
  try {
    // Check all agent statuses in parallel
    const [cursorOk, claudeOk, chatgptOk, copilotOk, flyioUsage] = await Promise.all([
      checkCursorStatus(),
      checkClaudeStatus(),
      checkChatGPTStatus(),
      checkCopilotStatus(),
      getFlyioUsage()
    ])

    const agents: AgentStatus[] = [
      {
        name: 'Cursor Ultra',
        icon: '⚡',
        status: cursorOk ? 'active' : 'error',
        usage: -1, // No real usage metrics available
        currentTask: undefined
      },
      {
        name: 'Claude Max',
        icon: '🧠',
        status: claudeOk ? 'active' : 'error',
        usage: -1, // No real usage metrics available
        currentTask: undefined
      },
      {
        name: 'Copilot PRO+',
        icon: '🤖',
        status: copilotOk ? 'active' : 'idle',
        usage: -1, // No real usage metrics available
        currentTask: undefined
      },
      {
        name: 'ChatGPT Atlas',
        icon: '💭',
        status: chatgptOk ? 'active' : 'idle',
        usage: -1, // No real usage metrics available
        currentTask: chatgptOk ? undefined : 'API not configured'
      },
      {
        name: 'Fly.io Swarm',
        icon: '🚀',
        status: flyioUsage >= 0 ? 'active' : 'idle',
        usage: flyioUsage >= 0 ? flyioUsage : -1, // REAL usage: % of deployed apps
        currentTask: flyioUsage >= 0 ? undefined : 'API not configured'
      }
    ]

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Agent status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent status' },
      { status: 500 }
    )
  }
}

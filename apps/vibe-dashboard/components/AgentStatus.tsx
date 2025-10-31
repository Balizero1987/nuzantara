'use client'

import { useState, useEffect } from 'react'

interface AgentInfo {
  name: string
  icon: string
  status: 'active' | 'idle' | 'error'
  usage: number
  currentTask?: string
}

export default function AgentStatus() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent-status/')
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setAgents(data.agents)
      setError(null)
    } catch (err) {
      setError('Failed to fetch agent status')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchAgentStatus()

    // Refresh every 30 seconds
    const interval = setInterval(fetchAgentStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="bg-zantara-bg-1/50 border border-zantara-line/30 rounded-xl p-4">
        <h2 className="text-lg font-display font-bold text-zantara-gold mb-4">
          Agent Status
        </h2>
        <div className="text-center text-zantara-text/50 py-8">
          Loading real-time data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-zantara-bg-1/50 border border-zantara-line/30 rounded-xl p-4">
        <h2 className="text-lg font-display font-bold text-zantara-gold mb-4">
          Agent Status
        </h2>
        <div className="text-center text-red-400 py-8">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zantara-bg-1/50 border border-zantara-line/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold text-zantara-gold">
          Agent Status
        </h2>
        <button
          onClick={fetchAgentStatus}
          className="text-xs text-zantara-text/60 hover:text-zantara-gold transition-colors"
          title="Refresh"
        >
          🔄
        </button>
      </div>

      <div className="space-y-3">
        {agents.map((agent, idx) => (
          <div
            key={idx}
            className="bg-zantara-bg-0/50 border border-zantara-line/20 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{agent.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zantara-text">
                    {agent.name}
                  </p>
                  {agent.currentTask && (
                    <p className="text-xs text-zantara-text/50">{agent.currentTask}</p>
                  )}
                </div>
              </div>

              <span
                className={`w-2 h-2 rounded-full ${
                  agent.status === 'active'
                    ? 'bg-green-500 animate-pulse'
                    : agent.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              />
            </div>

            {/* Usage Bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-zantara-text/60 mb-1">
                <span>Usage</span>
                <span>
                  {agent.usage < 0 ? 'N/A' : `${Math.round(agent.usage)}%`}
                </span>
              </div>
              <div className="h-1.5 bg-zantara-bg-0 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    agent.usage < 0
                      ? 'bg-gray-500'
                      : 'bg-gradient-to-r from-zantara-gold to-zantara-gold-2'
                  }`}
                  style={{ width: `${agent.usage < 0 ? 0 : agent.usage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-zantara-text/40 text-center">
        Auto-refresh every 30s
      </div>
    </div>
  )
}

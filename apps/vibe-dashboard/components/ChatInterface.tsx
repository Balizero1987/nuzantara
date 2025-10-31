'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  actions?: Array<{
    agent: string
    status: 'pending' | 'running' | 'done' | 'error'
    message: string
    result?: any
    error?: string
  }>
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'VIBE Dashboard ready. Speak naturally, I\'ll coordinate all agents for you.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Format result for human readability
  const formatResult = (result: any): string => {
    if (!result) return 'No output'

    // Extract meaningful content
    if (typeof result === 'string') return result

    if (result.documentation) return result.documentation
    if (result.optimized_code) return result.optimized_code
    if (result.analysis) return result.analysis
    if (result.suggestion) return result.suggestion
    if (result.tasks) return `Parsed ${result.tasks.length} tasks`
    if (result.apps) return `Found ${result.apps.length} apps`

    // Fallback: show status or first meaningful field
    if (result.status) {
      const filtered = Object.entries(result)
        .filter(([key]) => key !== 'status' && key !== 'action')
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n')
      return filtered || result.status
    }

    return 'Task completed'
  }

  const toggleResultExpand = (id: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsProcessing(true)

    // Create assistant message that will be updated with streaming events
    const assistantMessage: Message = {
      role: 'assistant',
      content: '🤔 Analyzing your request...',
      timestamp: new Date(),
      actions: []
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Connect to orchestrator via SSE
      const response = await fetch('/api/orchestrate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          userId: 'user-1'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to connect to orchestrator')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              setMessages(prev => {
                const newMessages = [...prev]
                const lastMsg = newMessages[newMessages.length - 1]

                if (event.type === 'parsing') {
                  lastMsg.content = '📝 Parsing command...'
                } else if (event.type === 'task_start') {
                  lastMsg.content = `⚡ Executing tasks...`
                  lastMsg.actions = lastMsg.actions || []
                  lastMsg.actions.push({
                    agent: event.agent,
                    status: 'running',
                    message: event.action
                  })
                } else if (event.type === 'task_done') {
                  const actionIdx = lastMsg.actions?.findIndex(a => a.agent === event.agent)
                  if (actionIdx !== undefined && actionIdx !== -1 && lastMsg.actions) {
                    lastMsg.actions[actionIdx].status = 'done'
                    lastMsg.actions[actionIdx].result = event.result
                  }
                } else if (event.type === 'task_error') {
                  const actionIdx = lastMsg.actions?.findIndex(a => a.agent === event.agent)
                  if (actionIdx !== undefined && actionIdx !== -1 && lastMsg.actions) {
                    lastMsg.actions[actionIdx].status = 'error'
                    lastMsg.actions[actionIdx].error = event.error
                  }
                } else if (event.type === 'complete') {
                  lastMsg.content = '✅ All tasks completed!'
                } else if (event.type === 'error') {
                  lastMsg.content = `❌ Error: ${event.message}`
                }

                return newMessages
              })
            } catch (e) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'system',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-zantara-gold/10 border border-zantara-gold/30 text-zantara-text'
                  : msg.role === 'system'
                  ? 'bg-zantara-bg-0 border border-zantara-line/50 text-zantara-text/70'
                  : 'bg-zantara-bg-1 border border-zantara-line/30 text-zantara-text'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Agent Actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-zantara-line/30 pt-3">
                  {msg.actions.map((action, actionIdx) => (
                    <div key={actionIdx} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            action.status === 'done'
                              ? 'bg-green-500'
                              : action.status === 'running'
                              ? 'bg-yellow-500 animate-pulse'
                              : action.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                          }`}
                        />
                        <span className="font-medium text-zantara-gold">
                          {action.agent}
                        </span>
                        <span className="text-zantara-text/60">{action.message}</span>
                      </div>

                      {/* Show Result */}
                      {action.status === 'done' && action.result && (
                        <div className="ml-4 p-3 bg-zantara-bg-0/50 border border-green-500/20 rounded text-xs">
                          <div className="text-green-400 font-medium mb-2">✓ Result:</div>

                          {/* Human readable output */}
                          <div className="text-zantara-text/80 whitespace-pre-wrap mb-2 font-mono text-[11px] leading-relaxed">
                            {formatResult(action.result)}
                          </div>

                          {/* Toggle raw JSON */}
                          <button
                            onClick={() => toggleResultExpand(`${idx}-${actionIdx}`)}
                            className="text-zantara-text/40 hover:text-zantara-gold transition-colors text-[10px]"
                          >
                            {expandedResults.has(`${idx}-${actionIdx}`) ? '▼ Hide raw data' : '▶ View raw data'}
                          </button>

                          {expandedResults.has(`${idx}-${actionIdx}`) && (
                            <pre className="mt-2 text-zantara-text/50 whitespace-pre-wrap overflow-auto max-h-40 text-[10px] p-2 bg-zantara-bg-0/30 rounded border border-zantara-line/10">
                              {JSON.stringify(action.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Show Error */}
                      {action.status === 'error' && action.error && (
                        <div className="ml-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-xs">
                          <div className="text-red-400 font-medium mb-1">✗ Error:</div>
                          <p className="text-red-300/70">{action.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-zantara-text/40 mt-2">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zantara-line/30 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you want to build..."
            className="flex-1 px-4 py-3 bg-zantara-bg-0 border border-zantara-line rounded-lg
                     text-zantara-text focus:border-zantara-gold focus:outline-none
                     focus:ring-1 focus:ring-zantara-gold transition-colors"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-6 py-3 bg-zantara-gold text-zantara-bg-0 font-bold rounded-lg
                     hover:bg-zantara-gold-2 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed"
          >
            {isProcessing ? '⚡' : '→'}
          </button>
        </div>
      </form>
    </div>
  )
}

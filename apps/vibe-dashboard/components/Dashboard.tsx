'use client'

import ChatInterface from './ChatInterface'
import AgentStatus from './AgentStatus'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zantara-line/30 backdrop-blur-sm bg-zantara-bg-0/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">⚡</span>
              <div>
                <h1 className="text-xl font-display font-bold text-zantara-gold">
                  VIBE DASHBOARD
                </h1>
                <p className="text-xs text-zantara-text/50">Multi-Agent Orchestration</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="text-sm text-zantara-text/60 hover:text-zantara-gold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Infinity Spine */}
        <div className="relative w-full h-px bg-gradient-to-r from-transparent via-zantara-gold/30 to-transparent overflow-hidden">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-zantara-gold text-sm opacity-50 animate-pulse">
            ∞
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left: Agent Status (Real) */}
          <div className="lg:col-span-1">
            <AgentStatus />
          </div>

          {/* Right: Chat Interface (Real) */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex-1 bg-zantara-bg-1/50 border border-zantara-line/30 rounded-xl overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

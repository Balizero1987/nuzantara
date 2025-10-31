'use client'

import { useState } from 'react'

interface LoginScreenProps {
  onLogin: (pin: string) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [pin, setPin] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(pin)
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full px-6">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4 gold-text-glow">⚡</div>
          <h1 className="text-3xl font-display font-bold text-zantara-gold mb-2 gold-text-glow tracking-wider">
            VIBE DASHBOARD
          </h1>
          <p className="text-zantara-text/60 text-sm tracking-wide">
            Multi-Agent AI Orchestration System
          </p>
        </div>

        {/* Infinity Spine */}
        <div className="relative w-full h-px bg-gradient-to-r from-transparent via-zantara-gold to-transparent mb-12 overflow-hidden">
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 text-zantara-gold text-xl opacity-70 animate-pulse">
            ∞
          </span>
        </div>

        {/* PIN Input */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-zantara-gold mb-2">
              Enter PIN
            </label>
            <input
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 bg-zantara-bg-1 border border-zantara-line rounded-lg
                       text-zantara-text focus:border-zantara-gold focus:outline-none
                       focus:ring-1 focus:ring-zantara-gold transition-colors"
              placeholder="••••"
              autoFocus
              maxLength={4}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-zantara-gold text-zantara-bg-0 font-bold rounded-lg
                     hover:bg-zantara-gold-2 transition-colors gold-glow"
          >
            Enter Dashboard
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-zantara-text/40">
          Powered by Claude, Cursor, Copilot, ChatGPT
        </div>
      </div>
    </div>
  )
}

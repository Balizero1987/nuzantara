'use client'

import { useState, useEffect } from 'react'
import LoginScreen from '@/components/LoginScreen'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('vibe-auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (pin: string) => {
    // Simple PIN check (in production, validate against backend)
    if (pin === '1987' || pin === process.env.NEXT_PUBLIC_PIN) {
      localStorage.setItem('vibe-auth', 'true')
      setIsAuthenticated(true)
    } else {
      alert('Invalid PIN')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('vibe-auth')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zantara-gold animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <main>
      {!isAuthenticated ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </main>
  )
}

"use client"

import type React from "react"

import { useState } from "react"

export default function App() {
  const [email, setEmail] = useState("zero@balizero.com")
  const [pin, setPin] = useState("010719")
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(false)

    await new Promise((resolve) => setTimeout(resolve, 1500))
    setError(true)
    setIsLoading(false)

    setTimeout(() => setError(false), 600)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans animate-fade-in"
      style={{ backgroundColor: "#3a3a3a" }}
    >
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Logo */}
        <div className="w-full mb-[-24px] animate-pulse-subtle">
          <img src="/images/logo1-zantara.svg" alt="Zantara Indonesia AI" className="w-full h-auto" />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`w-full max-w-md p-8 ${error ? "animate-shake" : ""}`}
          style={{
            backgroundColor: "#505050",
            backdropFilter: "blur(24px)",
            border: "2px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Email Input */}
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 tracking-wide"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "#404040",
                border: "1px solid #666",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#ef4444"
                e.target.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.5)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#666"
                e.target.style.boxShadow = "none"
              }}
              required
            />
          </div>

          {/* PIN Input */}
          <div className="mb-4">
            <label
              htmlFor="pin"
              className="block text-sm font-medium mb-2 tracking-wide"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              ACCESS PIN
            </label>
            <div className="relative">
              <input
                id="pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "#404040",
                  border: "1px solid #666",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#ef4444"
                  e.target.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.5)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#666"
                  e.target.style.boxShadow = "none"
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#9ca3af" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                {showPin ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot PIN Link */}
          <div className="mb-6 text-right">
            <a
              href="#"
              className="text-sm transition-colors"
              style={{ color: "#d4af37" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f0c952")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#d4af37")}
            >
              Forgot PIN?
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: "#404040",
              border: "1px solid #666",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "#4a4a4a"
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#404040"
              e.currentTarget.style.borderColor = "#666"
            }}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-white text-sm">© 2025 Zero AI</div>
      </div>
    </div>
  )
}

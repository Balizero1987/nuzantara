"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api/auth"
import { apiClient } from "@/lib/api/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("zero@balizero.com")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await authAPI.login({ email, pin })

      // Save token and user
      apiClient.setToken(response.token)
      authAPI.saveUser(response.user)

      // Redirect to chat
      router.push("/chat")
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.")
      console.error("[v0] Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#3a3a3a] font-sans p-4">
      <div className="w-full max-w-[420px] flex flex-col items-center animate-fade-in-down mb-8">
        <img
          src="/logo-zantara.svg"
          alt="ZANTARA"
          className="w-full h-auto max-w-[350px] mb-3 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:drop-shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300"
        />
      </div>

      <div
        className={`w-full max-w-[420px] bg-gradient-to-br from-[#505050]/90 to-[#404040]/80 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-transparent bg-clip-padding p-8 animate-fade-in-up ${
          error ? "animate-shake" : ""
        }`}
        style={{
          backgroundImage: "linear-gradient(#505050, #404040), linear-gradient(135deg, #d4af37, #f0c75e, #d4af37)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border-l-4 border-red-500 rounded-r-lg text-sm text-red-200 flex items-start gap-2 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-bold text-white/90 tracking-widest uppercase font-serif"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3 bg-[#404040] text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder-white/30 font-serif"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pin" className="block text-xs font-bold text-white/90 tracking-widest uppercase font-serif">
              Access PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-[#404040] text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all pr-12 placeholder-white/30 font-serif tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
              >
                {showPin ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-right pt-1">
              <a
                href="#"
                className="text-xs text-[#d4af37] hover:text-[#f0c75e] transition-colors font-serif italic tracking-wide"
              >
                Forgot PIN?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group w-full bg-gradient-to-r from-[#d4af37] to-[#f0c75e] hover:from-[#f0c75e] hover:to-[#d4af37] text-black py-3.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] font-serif tracking-wide"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="animate-pulse">Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Animated footer */}
      <div className="mt-8 text-center text-xs text-white/40 tracking-wide font-serif animate-fade-in">
        © 2025 Zero AI
      </div>
    </div>
  )
}

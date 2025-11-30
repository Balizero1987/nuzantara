"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if already logged in
    const token = apiClient.getToken()
    if (token) {
      router.push("/chat")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin: password }),
      })

      const data = await response.json()

      if (response.ok && data.token) {
        console.log("[Login] Received token:", data.token.substring(0, 20) + "...")
        
        // Save token using apiClient (saves to localStorage with key 'token')
        apiClient.setToken(data.token)
        console.log("[Login] Token saved via apiClient.setToken()")
        
        // Also save directly to localStorage as backup using globalThis
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          const storage = globalThis.localStorage;
          storage.setItem('token', data.token);
          storage.setItem('zantara_token', data.token);
          // Force sync
          storage.getItem('token');
          console.log("[Login] Token also saved directly to localStorage (globalThis)")
        }
        
        // Verify token was saved
        const savedToken = apiClient.getToken()
        const directToken = typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage.getItem('token') : null
        const allKeys = typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? Object.keys(globalThis.localStorage) : []
        const tokenKeys = allKeys.filter(k => k.toLowerCase().includes('token'))
        
        console.log("[Login] Verification:", {
          apiClient: savedToken ? savedToken.substring(0, 20) + "..." : "NONE",
          direct: directToken ? directToken.substring(0, 20) + "..." : "NONE",
          allKeys: allKeys,
          tokenKeys: tokenKeys,
          tokenValues: tokenKeys.map(k => ({ key: k, value: typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage.getItem(k)?.substring(0, 20) + '...' : null }))
        })

        // Also save user data if provided
        if (data.user) {
          localStorage.setItem("zantara_user", JSON.stringify(data.user))
        }

        // Force synchronous write and verify token is persisted
        // Save token multiple times to ensure it's available
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          const storage = globalThis.localStorage;
          storage.setItem('token', data.token);
          storage.setItem('zantara_token', data.token);
          // Force sync
          storage.getItem('token'); // Force read to ensure write completed
        }
        
        // Verify token is accessible immediately
        const finalCheck = apiClient.getToken() || (typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage.getItem('token') : null)
        if (!finalCheck) {
          console.error("[Login] ERROR: Token not found after save!")
          setError("Failed to save authentication token. Please try again.")
          setIsLoading(false)
          return
        }
        
        console.log("[Login] Token verified and persisted, redirecting to chat")
        console.log("[Login] Final token check:", {
          apiClient: apiClient.getToken() ? 'OK' : 'FAIL',
          localStorage: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('token') ? 'OK' : 'FAIL',
          zantara_token: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('zantara_token') ? 'OK' : 'FAIL'
        })
        
        // Use window.location instead of router.push for more reliable navigation
        // This ensures the page fully reloads and can access the token
        if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
          (globalThis as any).location.href = "/chat"
        } else {
          router.push("/chat")
        }
      } else {
        // Handle error - could be string, object, or array
        let errorMessage = "Login failed. Please try again."
        if (typeof data.error === "string") {
          errorMessage = data.error
        } else if (data.error && typeof data.error === "object") {
          errorMessage = JSON.stringify(data.error)
        } else if (data.detail) {
          errorMessage = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
        }
        setError(errorMessage)
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] font-sans">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">ZANTARA</h1>
          <p className="text-gray-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
              placeholder="anton@balizero.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              PIN
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
              placeholder="Enter your PIN"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#d4af37] to-[#f0c75e] hover:from-[#f0c75e] hover:to-[#d4af37] text-black font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}


import type { LoginRequest, LoginResponse, User } from "./types"
import { apiClient } from "./client"

export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nuzantara-rag.fly.dev"

    // Simple API key validation - accept any email with the correct pin
    if (credentials.pin === "010719") {
      const userData: User = {
        id: "user_001",
        email: credentials.email,
        name: credentials.email.split("@")[0],
        role: "admin",
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Create a more realistic JWT-like token
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      const payload = btoa(JSON.stringify({
        sub: userData.id,
        email: userData.email,
        role: userData.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }))
      const signature = "zantara-signature"
      const token = `${header}.${payload}.${signature}`

      const response: LoginResponse = {
        user: userData,
        token: token,
        expiresIn: 86400, // 24 hours
      }

      this.saveUser(userData)
      apiClient.setToken(response.token)
      return response
    } else {
      throw new Error("Invalid credentials")
    }
  },

  saveUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("zantara_user", JSON.stringify(user))
      localStorage.setItem("zantara_user_email", user.email)
    }
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem("zantara_user")
    return userStr ? JSON.parse(userStr) : null
  },

  clearUser(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zantara_user")
      localStorage.removeItem("zantara_user_email")
      localStorage.removeItem("zantara_session_token")
    }
  },

  logout(): void {
    this.clearUser()
    apiClient.clearToken()
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  },
}

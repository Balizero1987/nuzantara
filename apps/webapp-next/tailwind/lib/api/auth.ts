import type { LoginRequest, LoginResponse, User } from "./types"

export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Invalid credentials")
    }

    const data = await response.json()
    return data
  },

  saveUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("zantara_user", JSON.stringify(user))
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
    }
  },
}

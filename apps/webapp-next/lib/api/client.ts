import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

// Base API URL - update with your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nuzantara-rag.fly.dev"
const API_KEY = "zantara-secret-2024"

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Key": API_KEY,
      },
      timeout: 30000,
    })

    // Request interceptor: Add API key and JWT token to all requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.headers) {
          // Always add API key
          config.headers["X-API-Key"] = API_KEY

          // Add JWT token if available
          const token = this.getToken()
          if (token) {
            config.headers["Authorization"] = `Bearer ${token}`
          }
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor: Simple error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle API key errors
        if (error.response?.status === 401) {
          console.error("API Key authentication failed")
          // We could redirect to login or show an error message
        }
        return Promise.reject(error)
      },
    )
  }

  // Simple session management (no JWT)
  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("zantara_session_token")
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("zantara_session_token", token)
    }
  }

  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zantara_session_token")
      localStorage.removeItem("zantara_user")
    }
  }

  logout(): void {
    this.clearToken()
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  get instance(): AxiosInstance {
    return this.client
  }
}

export const apiClient = new APIClient()
export default apiClient.instance

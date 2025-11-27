import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

// Base API URL - update with your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class APIClient {
  private client: AxiosInstance
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    })

    // Request interceptor: Add JWT token to all requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor: Handle 401 and auto-refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newToken = await this.refreshToken()
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            this.logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      },
    )
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("zantara_token")
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("zantara_token", token)
    }
  }

  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zantara_token")
      localStorage.removeItem("zantara_user")
    }
  }

  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${this.getToken()}`,
            },
          },
        )
        const newToken = response.data.token
        this.setToken(newToken)
        return newToken
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
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

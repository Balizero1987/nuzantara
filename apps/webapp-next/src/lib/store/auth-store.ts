import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AUTH_TOKEN_KEY } from "../constants"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        if (typeof window !== "undefined") {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem("zantara_user")
          // Clean up old token keys
          localStorage.removeItem("zantara_token")
          localStorage.removeItem("zantara_session_token")
          localStorage.removeItem("token")
        }
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "zantara-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

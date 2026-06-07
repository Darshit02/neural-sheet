import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  tier: string
  has_api_key: boolean
}

interface AuthStore {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  logout: () => void
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setTokens: (access, refresh) => {
        localStorage.setItem("access_token", access)
        localStorage.setItem("refresh_token", refresh)
        set({ access_token: access, refresh_token: refresh, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        set({ user: null, access_token: null, refresh_token: null, isAuthenticated: false })
      },

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "neuralsheet-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

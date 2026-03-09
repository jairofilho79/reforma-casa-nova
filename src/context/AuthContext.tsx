import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import {
  getToken, setToken, removeToken,
  getStoredUser, setStoredUser,
  type AuthUser
} from '../lib/auth'

type AuthContextType = {
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)
  const [isLoading, setIsLoading] = useState(!!getToken() && !getStoredUser())

  useEffect(() => {
    if (getToken() && !getStoredUser()) {
      api.get<{ user: AuthUser }>('/auth/me')
        .then(({ user }) => {
          setUser(user)
          setStoredUser(user)
        })
        .catch(() => {
          removeToken()
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
      username,
      password,
    })
    setToken(data.token)
    setStoredUser(data.user)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

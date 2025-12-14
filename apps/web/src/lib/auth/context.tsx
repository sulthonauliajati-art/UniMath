'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'unimath_token'
const USER_KEY = 'unimath_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Validate token and refresh user data
  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setToken(storedToken)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      } else {
        // Token invalid, clear storage
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
        setToken(null)
      }
    } catch {
      // Network error, use cached user
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          setToken(storedToken)
        } catch {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = (newUser: User, newToken: string) => {
    setUser(newUser)
    setToken(newToken)
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    
    // Also set cookie for server-side access
    document.cookie = `user=${JSON.stringify(newUser)}; path=/; max-age=${7 * 24 * 60 * 60}`
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`
  }

  const logout = async () => {
    // Call logout API to revoke token
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Ignore errors, still logout locally
      }
    }

    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    
    // Clear cookies
    document.cookie = 'user=; path=/; max-age=0'
    document.cookie = 'token=; path=/; max-age=0'
  }

  const updateUser = (newUser: User) => {
    setUser(newUser)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    document.cookie = `user=${JSON.stringify(newUser)}; path=/; max-age=${7 * 24 * 60 * 60}`
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

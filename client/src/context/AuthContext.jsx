import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const TOKEN_KEY = 'inventarios_token'

const AuthContext = createContext(null)

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function buildAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken())
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()))

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: buildAuthHeaders(token),
        })
        setUser(data.usuario)
      } catch (_error) {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    bootstrapAuth()
  }, [token])

  const login = async ({ email, password }) => {
    const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    })

    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.usuario)
    return data
  }

  const register = async ({ nombre, email, password, rol, adminSetupKey }) => {
    const payload = { nombre, email, password }

    if (rol) {
      payload.rol = rol
    }

    if (adminSetupKey) {
      payload.adminSetupKey = adminSetupKey
    }

    const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, payload)

    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.usuario)
    return data
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const authHeaders = useMemo(() => buildAuthHeaders(token), [token])

  const value = useMemo(() => ({
    token,
    user,
    authLoading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.rol === 'admin',
    authHeaders,
    login,
    register,
    logout,
  }), [token, user, authLoading, authHeaders])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }
  return context
}

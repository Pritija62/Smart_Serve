import { createContext, useState, useEffect } from 'react'
import { loginKitchen, loginAdmin } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // token is the source of truth for "logged in"
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // ✅ MVP auth check: don't call /auth/me (backend may not have it)
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      setIsLoggedIn(true)
      // user will be set after a successful login.
      // For refreshes, user may be null; that's OK for MVP.
    } else {
      setToken(null)
      setUser(null)
      setIsLoggedIn(false)
    }
  }, [])

  const login = async (email, password, role) => {
    try {
      setIsLoading(true)
      setError(null)

      let response
      if (role === 'kitchen') {
        response = await loginKitchen(email, password)
      } else if (role === 'admin') {
        response = await loginAdmin(email, password)
      } else {
        throw new Error('Invalid role')
      }

      const newToken = response.data.token
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setIsLoggedIn(true)

      // Backend returns user in login response (your code expects this)
      setUser(response.data.user || null)

      return response.data
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Login failed'
      setError(errorMessage)

      // ensure consistent state on failed login
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setIsLoggedIn(false)

      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setIsLoggedIn(false)
    setError(null)
  }

  // optional convenience helper (useful in KitchenDashboard)
  const hasKitchenAccess = ['kitchen_staff', 'admin'].includes(user?.role)

  const value = {
    user,
    token,
    isLoggedIn,
    isLoading,
    error,
    login,
    logout,
    hasKitchenAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
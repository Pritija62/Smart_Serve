import { createContext, useState, useEffect } from 'react'
import { loginKitchen, loginAdmin, getCurrentUser } from '../services/api'

// Create the context
export const AuthContext = createContext()

// Create the provider component
export const AuthProvider = ({ children }) => {
  // State variables
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')

      console.log('checking auth on mount...')  
      console.log('Token found:', !!storedToken)   
      
      if (storedToken) {
        try {
          setIsLoading(true)
          setToken(storedToken)
          
          // Verify token is still valid by getting current user
          const response = await getCurrentUser()
          setUser(response.data.user)
          setIsLoggedIn(true)
          setError(null)
        } catch (err) {
          // Token is invalid/expired
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          setIsLoggedIn(false)
          setError('Session expired. Please login again.')
        } finally {
          setIsLoading(false)
        }
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email, password, role) => {
    console.log("login attempt:",{ email, role })
    try {
      setIsLoading(true)
      setError(null)

      let response

      // Choose login endpoint based on role
      if (role === 'kitchen') {
        response = await loginKitchen(email, password)
      } else if (role === 'admin') {
        response = await loginAdmin(email, password)
      } else {
        throw new Error('Invalid role')
      }

      // Save token to localStorage
      const newToken = response.data.token
      localStorage.setItem('token', newToken)
      setToken(newToken)
      console.log('login success')  
      console.log('User:', response.data.user)  
      console.log('Token saved to localStorage')  

      // Save user info
      setUser(response.data.user)
      setIsLoggedIn(true)

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Login failed'
      setError(errorMessage)
      setIsLoggedIn(false)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    console.log("user logout")
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setIsLoggedIn(false)
    setError(null)
  }

  // Value to provide to all components
  const value = {
    user,
    token,
    isLoggedIn,
    isLoading,
    error,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
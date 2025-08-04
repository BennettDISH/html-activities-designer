import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const profileData = await authService.getProfile()
        setUser(profileData.user)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      authService.logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      setLoading(true)
      const data = await authService.login(credentials)
      setUser(data.user)
      return data
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      setLoading(true)
      const data = await authService.register(userData)
      setUser(data.user)
      return data
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setError(null)
  }

  const updateProfile = async (profileData) => {
    try {
      setError(null)
      const data = await authService.updateProfile(profileData)
      setUser(data.user)
      return data
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading,
    error,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
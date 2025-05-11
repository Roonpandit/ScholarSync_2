import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // Configure axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2009/api'
  
  // Set auth token for all requests if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (token) {
        try {
          const res = await axios.get('/auth/me')
          setUser(res.data.data)
        } catch (err) {
          console.error('Auth token invalid:', err)
          logout()
        }
      }
      setLoading(false)
    }

    checkLoggedIn()
  }, [token])

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password })
      
      if (res.data.success) {
        setToken(res.data.token)
        setUser(res.data.user)
        localStorage.setItem('token', res.data.token)
        toast.success('Login successful!')
        return true
      }
    } catch (err) {
      console.error('Login error:', err)
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
      return false
    }
  }

  // Logout function
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    toast.info('You have been logged out')
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
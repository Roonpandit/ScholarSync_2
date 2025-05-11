import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { API_URL } from '../config/constants'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (token) {
      fetchCurrentUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch current user data
  const fetchCurrentUser = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        setUser(response.data.data)
      } else {
        // If token is invalid, logout
        logout()
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      // If token is invalid, logout
      logout()
    } finally {
      setLoading(false)
    }
  }

  // Login function
  const login = async (email, password) => {
    setError(null)
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })
      
      if (response.data.success) {
        const { token, user } = response.data
        localStorage.setItem('token', token)
        setUser(user)
        return true
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.'
      toast.error(message)
      setError(message)
      return false
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // Register student (admin only)
  const registerStudent = async (studentData) => {
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/auth/register`, studentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        toast.success('Student registered successfully')
        return response.data.data
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to register student.'
      toast.error(message)
      setError(message)
      return null
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    registerStudent
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // Configure axios defaults
  const baseURL = import.meta.env.VITE_API_URL;
  axios.defaults.baseURL = baseURL;
  
  // Configure axios to include credentials for CORS
  axios.defaults.withCredentials = true;
  
  // Set auth token for all requests if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      axios.defaults.headers.common['Accept'] = 'application/json';
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Add axios interceptor for handling 401 (unauthorized) responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.error('Unauthorized:', error);
          logout();
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

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
    localStorage.removeItem('user') // Clear any user data
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
import axios from 'axios'
import { toast } from 'react-toastify'
import { API_URL } from '../config/constants'

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL
})

// Add request interceptor to add token to every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    const { response } = error
    
    if (response?.status === 401) {
      // Unauthorized: clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
      toast.error('Your session has expired. Please log in again.')
    } else if (response?.status === 403) {
      // Forbidden
      toast.error('You do not have permission to perform this action.')
    } else if (response?.status === 404) {
      // Not found
      toast.error('The requested resource was not found.')
    } else if (response?.status >= 500) {
      // Server error
      toast.error('Server error. Please try again later.')
    } else if (!response) {
      // Network error
      toast.error('Network error. Please check your internet connection.')
    }
    
    return Promise.reject(error)
  }
)

// Admin API endpoints
export const adminApi = {
  // Student endpoints
  getStudents: () => api.get('/admin/students'),
  createStudent: (data) => api.post('/admin/students', data),
  
  // Attendance slots endpoints
  getAttendanceSlots: (date) => {
    const url = '/admin/attendance-slots'
    return date ? api.get(`${url}?date=${date}`) : api.get(url)
  },
  createAttendanceSlot: (data) => api.post('/admin/attendance-slots', data),
  closeAttendanceSlot: (id) => api.put(`/admin/attendance-slots/${id}/close`),
  
  // Attendance endpoints
  getAttendanceByDate: (date, shift) => {
    let url = `/admin/attendance?date=${date}`
    if (shift) url += `&shift=${shift}`
    return api.get(url)
  },
  
  // Statistics endpoints
  getAttendanceStats: (params) => api.get('/admin/attendance/stats', { params }),
  getAbsentStudents: (params) => api.get('/admin/attendance/absent', { params })
}

// Student API endpoints
export const studentApi = {
  // Attendance slots endpoints
  getActiveAttendanceSlots: () => api.get('/students/attendance-slots'),
  
  // Attendance endpoints
  markAttendance: (formData) => {
    return api.post('/students/attendance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  getAttendanceHistory: (params) => api.get('/students/attendance', { params }),
  getAbsenceHistory: (params) => api.get('/students/absences', { params })
}

// Seed admin account (development only)
export const seedAdmin = () => axios.post(`${API_URL}/auth/seed-admin`)

export default api
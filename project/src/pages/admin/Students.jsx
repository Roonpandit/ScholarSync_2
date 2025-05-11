import { useState, useEffect } from 'react'
import { FiPlus, FiRefreshCw, FiAlertCircle } from 'react-icons/fi'
import { adminApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import DataTable from '../../components/tables/DataTable'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { VALIDATION } from '../../config/constants'

export default function AdminStudents() {
  const { registerStudent } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentCode: '',
    password: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch students data
  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getStudents()
      setStudents(response.data.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to load students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      })
    }
  }

  // Validate form data
  const validateForm = () => {
    const errors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.length < VALIDATION.NAME_MIN_LENGTH) {
      errors.name = `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`
    } else if (formData.name.length > VALIDATION.NAME_MAX_LENGTH) {
      errors.name = `Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    
    // Student code validation
    if (!formData.studentCode.trim()) {
      errors.studentCode = 'Student code is required'
    } else if (!VALIDATION.STUDENT_CODE_REGEX.test(formData.studentCode)) {
      errors.studentCode = 'Student code must be 3-10 alphanumeric characters'
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const newStudent = await registerStudent(formData)
      if (newStudent) {
        setShowModal(false)
        setFormData({
          name: '',
          email: '',
          studentCode: '',
          password: ''
        })
        
        // Refresh students list
        fetchStudents()
      }
    } catch (err) {
      console.error('Error registering student:', err)
      toast.error('Failed to register student. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Table columns definition
  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'studentCode',
      label: 'Student Code',
      sortable: true
    },
    {
      key: 'createdAt',
      label: 'Registered On',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Students</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage student accounts
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => fetchStudents()}
            className="btn btn-outline flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Student
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Students table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          title="All Students"
          itemsPerPage={10}
        />
      )}
      
      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Student</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Name input */}
                  <div>
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter student's full name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  
                  {/* Email input */}
                  <div>
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${formErrors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter student's email"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  
                  {/* Student Code input */}
                  <div>
                    <label htmlFor="studentCode" className="form-label">Student Code</label>
                    <input
                      type="text"
                      id="studentCode"
                      name="studentCode"
                      value={formData.studentCode}
                      onChange={handleChange}
                      className={`form-input ${formErrors.studentCode ? 'border-red-500' : ''}`}
                      placeholder="e.g., MS123"
                    />
                    {formErrors.studentCode && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.studentCode}</p>
                    )}
                  </div>
                  
                  {/* Password input */}
                  <div>
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input ${formErrors.password ? 'border-red-500' : ''}`}
                      placeholder="Enter password"
                    />
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : 'Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
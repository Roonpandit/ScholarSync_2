import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../../styles/StudentManagement.css'

const StudentManagement = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentCode: '',
    password: ''
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/admin/students')
      setStudents(res.data.data)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const res = await axios.post('/admin/students', formData)
      
      if (res.data.success) {
        toast.success('Student added successfully')
        setStudents([...students, res.data.data])
        setFormData({
          name: '',
          email: '',
          studentCode: '',
          password: ''
        })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding student:', error)
      toast.error(error.response?.data?.message || 'Failed to add student')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading students...</p>
      </div>
    )
  }

  return (
    <div className="student-management">
      <div className="page-header">
        <h1>Student Management</h1>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Student'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="add-student-form">
          <h2>Add New Student</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="studentCode">Student Code</label>
              <input
                type="text"
                id="studentCode"
                name="studentCode"
                value={formData.studentCode}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button">Add Student</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="students-list">
        <h2>Students List</h2>
        
        {students.length > 0 ? (
          <div className="table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student Code</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.studentCode}</td>
                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No students found. Add your first student using the form above.</p>
        )}
      </div>
    </div>
  )
}

export default StudentManagement
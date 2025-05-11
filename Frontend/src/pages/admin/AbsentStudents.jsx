import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../../styles/AbsentStudents.css'

const AbsentStudents = () => {
  const [absentStudents, setAbsentStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    threshold: 2,
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear() // Current year
  })

  useEffect(() => {
    fetchAbsentStudents()
  }, [filters])

  const fetchAbsentStudents = async () => {
    try {
      setLoading(true)
      const { threshold, month, year } = filters
      const res = await axios.get(`/admin/attendance/absent?threshold=${threshold}&month=${month}&year=${year}`)
      setAbsentStudents(res.data.data)
    } catch (error) {
      console.error('Error fetching absent students:', error)
      toast.error('Failed to load absent students')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading absent students data...</p>
      </div>
    )
  }

  return (
    <div className="absent-students">
      <div className="page-header">
        <h1>Absent Students</h1>
      </div>
      
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="threshold">Minimum Absences:</label>
          <input
            type="number"
            id="threshold"
            name="threshold"
            min="1"
            value={filters.threshold}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="month">Month:</label>
          <select
            id="month"
            name="month"
            value={filters.month}
            onChange={handleFilterChange}
          >
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="year">Year:</label>
          <select
            id="year"
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>
      
      <div className="absent-list">
        <h2>Students with {filters.threshold}+ Absences</h2>
        
        {absentStudents.length > 0 ? (
          <div className="table-container">
            <table className="absent-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student Code</th>
                  <th>Absent Count</th>
                  <th>Absent Dates</th>
                </tr>
              </thead>
              <tbody>
                {absentStudents.map((record) => (
                  <tr key={record.student._id}>
                    <td>{record.student.name}</td>
                    <td>{record.student.studentCode}</td>
                    <td className="absent-count">{record.absentCount}</td>
                    <td>
                      <div className="absent-dates">
                        {record.absentDates.map((date, index) => (
                          <span key={index} className="absent-date-tag">
                            {new Date(date.date).toLocaleDateString()} ({date.shift})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No students found with {filters.threshold} or more absences for the selected period.</p>
        )}
      </div>
    </div>
  )
}

export default AbsentStudents
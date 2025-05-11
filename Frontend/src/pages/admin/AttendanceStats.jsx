import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../../styles/AttendanceStats.css'

const AttendanceStats = () => {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear(), // Current year
    minAbsences: 0
  })

  useEffect(() => {
    fetchAttendanceStats()
  }, [filters])

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true)
      const { month, year, minAbsences } = filters
      const res = await axios.get(`/admin/attendance/stats?month=${month}&year=${year}&minAbsences=${minAbsences}`)
      setStats(res.data.data)
    } catch (error) {
      console.error('Error fetching attendance stats:', error)
      toast.error('Failed to load attendance statistics')
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
        <p>Loading attendance statistics...</p>
      </div>
    )
  }

  return (
    <div className="attendance-stats">
      <div className="page-header">
        <h1>Attendance Statistics</h1>
      </div>
      
      <div className="filters-container">
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
        
        <div className="filter-group">
          <label htmlFor="minAbsences">Min Absences:</label>
          <input
            type="number"
            id="minAbsences"
            name="minAbsences"
            min="0"
            value={filters.minAbsences}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      
      <div className="stats-list">
        <h2>Student Attendance Summary</h2>
        
        {stats.length > 0 ? (
          <div className="table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student Code</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Attendance Rate</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => {
                  const totalDays = stat.present + stat.absent
                  const attendanceRate = totalDays > 0 
                    ? Math.round((stat.present / totalDays) * 100) 
                    : 0
                    
                  return (
                    <tr key={stat.student._id}>
                      <td>{stat.student.name}</td>
                      <td>{stat.student.studentCode}</td>
                      <td>{stat.present}</td>
                      <td>{stat.absent}</td>
                      <td>
                        <div className="attendance-rate">
                          <div 
                            className="attendance-bar"
                            style={{ width: `${attendanceRate}%` }}
                          ></div>
                          <span>{attendanceRate}%</span>
                        </div>
                      </td>
                      <td>
                        <button 
                          className="details-button"
                          onClick={() => {
                            // You could implement a modal or expand the row to show details
                            toast.info(`Showing details for ${stat.student.name} is not implemented yet`)
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No attendance statistics found for the selected filters.</p>
        )}
      </div>
    </div>
  )
}

export default AttendanceStats
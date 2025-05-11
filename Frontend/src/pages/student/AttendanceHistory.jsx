import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../../styles/AttendanceHistory.css'

const AttendanceHistory = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear() // Current year
  })

  useEffect(() => {
    fetchAttendanceHistory()
  }, [filters])

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true)
      const { month, year } = filters
      const res = await axios.get(`/students/attendance?month=${month}&year=${year}`)
      setAttendanceRecords(res.data.data)
    } catch (error) {
      console.error('Error fetching attendance history:', error)
      toast.error('Failed to load attendance history')
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
        <p>Loading attendance history...</p>
      </div>
    )
  }

  return (
    <div className="attendance-history">
      <div className="page-header">
        <h1>Attendance History</h1>
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
      </div>
      
      <div className="history-list">
        <h2>Your Attendance Records</h2>
        
        {attendanceRecords.length > 0 ? (
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Time</th>
                  <th>Photo</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.shift}</td>
                    <td>{new Date(record.markedAt).toLocaleTimeString()}</td>
                    <td>
                      <button 
                        className="view-photo-button"
                        onClick={() => {
                          // You could implement a modal to show the photo
                          toast.info('Photo viewer not implemented yet')
                        }}
                      >
                        View Photo
                      </button>
                    </td>
                    <td>
                      <button 
                        className="view-location-button"
                        onClick={() => {
                          // You could implement a modal to show the location on a map
                          toast.info(`Location: ${record.location.coordinates.join(', ')}`)
                        }}
                      >
                        View Location
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No attendance records found for the selected period.</p>
        )}
      </div>
      
      <div className="monthly-summary">
        <h2>Monthly Summary</h2>
        <div className="summary-card">
          <div className="summary-item">
            <span className="summary-label">Total Days Present:</span>
            <span className="summary-value">{attendanceRecords.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Attendance Rate:</span>
            <span className="summary-value">
              {/* This is a simplified calculation. In a real app, you'd need to know the total expected days */}
              {attendanceRecords.length > 0 ? 
                `${Math.min(100, Math.round((attendanceRecords.length / 20) * 100))}%` : 
                '0%'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceHistory
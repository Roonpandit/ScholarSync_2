import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const AbsenceHistory = () => {
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear() // Current year
  })

  useEffect(() => {
    fetchAbsenceHistory()
  }, [filters])

  const fetchAbsenceHistory = async () => {
    try {
      setLoading(true)
      const { month, year } = filters
      const res = await axios.get(`/students/absences?month=${month}&year=${year}`)
      setAbsences(res.data.data)
    } catch (error) {
      console.error('Error fetching absence history:', error)
      toast.error('Failed to load absence history')
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
        <p>Loading absence history...</p>
      </div>
    )
  }

  return (
    <div className="absence-history">
      <div className="page-header">
        <h1>Absence History</h1>
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
      
      <div className="absence-list">
        <h2>Your Absences</h2>
        
        {absences.length > 0 ? (
          <div className="table-container">
            <table className="absence-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Slot Time</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((absence, index) => (
                  <tr key={index} className="absence-row">
                    <td>{new Date(absence.date).toLocaleDateString()}</td>
                    <td>{absence.shift}</td>
                    <td>
                      {new Date(absence.slotStartTime).toLocaleTimeString()} - {new Date(absence.slotEndTime).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No absences recorded for the selected period.</p>
        )}
      </div>
      
      <div className="absence-summary">
        <h2>Summary</h2>
        <div className="summary-card">
          <div className="summary-item">
            <span className="summary-label">Total Absences:</span>
            <span className="summary-value">{absences.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Status:</span>
            <span className={`summary-value status ${absences.length > 3 ? 'critical' : absences.length > 1 ? 'warning' : 'good'}`}>
              {absences.length > 3 ? 'Critical' : absences.length > 1 ? 'Warning' : 'Good'}
            </span>
          </div>
        </div>
        
        {absences.length > 3 && (
          <div className="warning-message">
            <p>You have exceeded the maximum allowed absences. Please contact the administration.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AbsenceHistory
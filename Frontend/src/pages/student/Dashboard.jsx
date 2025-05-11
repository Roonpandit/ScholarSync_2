import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext.jsx'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [activeSlots, setActiveSlots] = useState([])
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0
  })
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch active slots
        const slotsRes = await axios.get('/students/attendance-slots')
        setActiveSlots(slotsRes.data.data || [])
        
        // Fetch attendance history
        const attendanceRes = await axios.get('/students/attendance')
        setRecentAttendance(attendanceRes.data.data.slice(0, 5) || [])
        
        // Fetch absence history
        const absenceRes = await axios.get('/students/absences')
        
        // Calculate stats
        const present = attendanceRes.data.count || 0
        const absent = absenceRes.data.count || 0
        
        setAttendanceStats({
          present,
          absent,
          total: present + absent
        })
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const attendancePercentage = attendanceStats.total > 0 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100) 
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, {user?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-lg mb-4">Attendance Rate</h3>
          <div className="flex justify-center items-center">
            <div 
              className="w-24 h-24 rounded-full bg-gray-100"
              style={{ 
                background: `conic-gradient(#4CAF50 ${attendancePercentage * 3.6}deg, #f3f4f6 0deg)`
              }}
            >
              <div className="text-2xl font-bold text-blue-600">{attendancePercentage}%</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-lg mb-2">Present Days</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">{attendanceStats.present}</p>
          <Link 
            to="/student/attendance-history" 
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            View History
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-lg mb-2">Absent Days</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">{attendanceStats.absent}</p>
          <Link 
            to="/student/absence-history" 
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Active Attendance Slots</h2>
        
        {activeSlots.length > 0 ? (
          <div className="active-slots">
            {activeSlots.map((slot) => (
              <div key={slot._id} className="slot-card">
                <div className="slot-info">
                  <h3>{slot.shift} Attendance</h3>
                  <p>Date: {new Date(slot.date).toLocaleDateString()}</p>
                  <p>Time: {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}</p>
                </div>
                <Link to={`/student/mark-attendance?slotId=${slot._id}`} className="mark-attendance-button">
                  Mark Attendance
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No active attendance slots available at the moment.</p>
        )}
      </div>
      
      <div className="recent-activity">
        <h2>Recent Attendance</h2>
        
        {recentAttendance.length > 0 ? (
          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.shift}</td>
                    <td>{new Date(record.markedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No recent attendance records found.</p>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard
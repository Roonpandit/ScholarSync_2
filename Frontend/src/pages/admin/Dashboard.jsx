import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { formatDateDisplay, formatTime24h, getCurrentDateIST, getCurrentTimeIST, convertToIST, isSameDate } from '../../utils/timeUtils'

const AdminDashboard = () => {


  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    activeSlots: 0,
    absentStudents: 0
  })
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTimer, setRefreshTimer] = useState(null)

  // Auto-refresh every minute
  useEffect(() => {
    const timer = setInterval(() => {
      fetchDashboardData()
    }, 5000) // Refresh every 5 seconds
    setRefreshTimer(timer)

    // Clean up on unmount
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get today's date in YYYY-MM-DD format (IST)
      const todayIST = convertToIST(new Date())
      const today = todayIST.toISOString().split('T')[0]
      
      // Fetch students count
      const studentsRes = await axios.get('/admin/students')
      
      // Fetch today's attendance
      const attendanceRes = await axios.get(`/admin/attendance?date=${today}`)
      
      // Fetch active slots
      const slotsRes = await axios.get('/admin/attendance-slots')
      const currentTimeIST = getCurrentTimeIST()
      
      // Get current time in IST
      const nowIST = convertToIST(new Date())
      const currentHour = nowIST.getHours()
      const currentMinute = nowIST.getMinutes()

      // Count only slots with status 'active'
      const activeSlots = slotsRes.data.data.filter(slot => slot.status === 'active')
      
      // Fetch absent students
      const absentRes = await axios.get('/admin/attendance/absent')
      
      setStats({
        totalStudents: studentsRes.data.count || 0,
        todayAttendance: attendanceRes.data.count || 0,
        activeSlots: activeSlots.length || 0,
        absentStudents: absentRes.data.count || 0
      })
      
      // Set recent attendance (last 5)
      setRecentAttendance(attendanceRes.data.data.slice(0, 5) || [])
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchDashboardData()
    
    // Set up auto-refresh
    const timer = setInterval(fetchDashboardData, 5000) // Refresh every 5 seconds
    setRefreshTimer(timer)

    // Clean up on unmount
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of attendance system</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1 bg-green-400 rounded-full"></span>
            System Online
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          linkTo="/admin/students"
          linkText="View All"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="blue"
        />
        
        <StatCard 
          title="Today's Attendance" 
          value={stats.todayAttendance} 
          linkTo="/admin/attendance-slots"
          linkText="View Details"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          color="green"
        />
        
        <StatCard 
          title="Active Slots" 
          value={stats.activeSlots} 
          linkTo="/admin/attendance-slots"
          linkText="Manage Slots"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md lg:col-span-2">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Recent Attendance</h2>
            <Link 
              to="/admin/attendance-slots" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="p-6">
            {recentAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Code</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAttendance.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm">
                              {record.studentName?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-700">{record.studentName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.studentCode}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {record.shift.charAt(0)?.toUpperCase() + record.shift.slice(1)}

                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-gray-500">No recent attendance records found.</p>
              </div>
            )}
          </div>
        </div>
      
        <div className="bg-white rounded-xl shadow-md">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <ActionButton
              to="/admin/attendance-slots"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
              title="Create Attendance Slot"
              description="Open a new attendance window"
              color="blue"
            />
            
            <ActionButton
              to="/admin/students"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
              title="Add New Student"
              description="Register a student in the system"
              color="green"
            />
            
            <ActionButton
              to="/admin/attendance/stats"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="View Analytics"
              description="Check attendance statistics"
              color="purple"
            />
            
            <ActionButton
              to="/admin/attendance/absent"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              title="Absent Students"
              description="View students with attendance issues"
              color="red"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold text-blue-800">Need help with the attendance system?</h3>
            <p className="text-blue-600 mt-1">Check out our documentation or contact support for assistance.</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white text-blue-700 font-medium rounded-lg border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors">
              View Documentation
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ title, value, linkTo, linkText, icon, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      light: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-600'
    },
    green: {
      bg: 'bg-green-500',
      light: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      hover: 'hover:bg-green-600'
    },
    purple: {
      bg: 'bg-purple-500',
      light: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-600'
    },
    red: {
      bg: 'bg-red-500',
      light: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      hover: 'hover:bg-red-600'
    }
  }

  const classes = colorClasses[color] || colorClasses.blue

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${classes.light}`}>
            {icon}
          </div>
          <div className={`h-8 w-8 rounded-full ${classes.bg} flex items-center justify-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold text-gray-800 my-1">{value}</p>
          <Link 
            to={linkTo} 
            className={`inline-flex items-center text-sm ${classes.text} font-medium`}
          >
            {linkText}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
      <div className={`h-1 ${classes.bg}`}></div>
    </div>
  )
}

// Action Button Component
const ActionButton = ({ to, icon, title, description, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-600', 
      hover: 'hover:bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: 'text-green-600',
      hover: 'hover:bg-green-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      icon: 'text-purple-600',
      hover: 'hover:bg-purple-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: 'text-red-600',
      hover: 'hover:bg-red-100'
    }
  }

  const classes = colorClasses[color] || colorClasses.blue

  return (
    <Link 
      to={to} 
      className={`flex items-center p-4 rounded-lg ${classes.bg} ${classes.hover} transition-colors`}
    >
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <div className={classes.icon}>{icon}</div>
        </div>
      </div>
      <div className="ml-4">
        <p className={`text-sm font-medium ${classes.text}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className="ml-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${classes.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

export default AdminDashboard
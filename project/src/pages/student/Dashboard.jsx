import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiUser } from 'react-icons/fi'
import StatCard from '../../components/cards/StatCard'
import { studentApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { DATE_FORMAT } from '../../config/constants'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    presentPercentage: 0,
    activeSlots: 0
  })
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch active slots
        const activeSlotsResponse = await studentApi.getActiveAttendanceSlots()
        const activeSlots = activeSlotsResponse.data.count
        
        // Fetch attendance history
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        
        const attendanceResponse = await studentApi.getAttendanceHistory({
          month: currentMonth,
          year: currentYear
        })
        
        const attendance = attendanceResponse.data.data
        
        // Fetch absence history
        const absenceResponse = await studentApi.getAbsenceHistory({
          month: currentMonth,
          year: currentYear
        })
        
        const absences = absenceResponse.data.data
        
        // Calculate stats
        const totalDays = attendance.length + absences.length
        const presentPercentage = totalDays > 0 
          ? Math.round((attendance.length / totalDays) * 100) 
          : 0
        
        setStats({
          present: attendance.length,
          absent: absences.length,
          presentPercentage,
          activeSlots
        })
        
        // Get most recent attendance (limited to 5)
        setRecentAttendance(attendance.slice(0, 5))
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiXCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Student Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back, {user?.name}
        </p>
      </div>
      
      {/* Student profile card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
            <FiUser className="h-8 w-8 text-primary-600 dark:text-primary-300" />
          </div>
          <div className="ml-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Student Code: {user?.studentCode}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email: {user?.email}</p>
          </div>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Present Days"
          value={stats.present}
          subtitle="This month"
          icon={<FiCheckCircle />}
          color="success"
        />
        
        <StatCard
          title="Absent Days"
          value={stats.absent}
          subtitle="This month"
          icon={<FiXCircle />}
          color="danger"
        />
        
        <StatCard
          title="Attendance Rate"
          value={`${stats.presentPercentage}%`}
          subtitle="Present percentage this month"
          icon={<FiCalendar />}
          color="primary"
        />
        
        <StatCard
          title="Active Slots"
          value={stats.activeSlots}
          subtitle="Available for marking"
          icon={<FiClock />}
          color="secondary"
        />
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/attendance" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-800 mr-4">
              <FiCheckCircle className="text-xl text-primary-600 dark:text-primary-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mark Attendance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check in for today's sessions</p>
            </div>
          </div>
        </Link>
        
        <Link to="/history" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary-100 dark:bg-secondary-800 mr-4">
              <FiCalendar className="text-xl text-secondary-600 dark:text-secondary-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attendance History</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View your past attendance records</p>
            </div>
          </div>
        </Link>
        
        <Link to="/absences" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent-100 dark:bg-accent-800 mr-4">
              <FiXCircle className="text-xl text-accent-600 dark:text-accent-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Absence Record</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track days you were absent</p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Recent attendance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Attendance</h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentAttendance.length > 0 ? (
            recentAttendance.map((attendance, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 mr-4">
                    <FiCheckCircle className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{attendance.shift} shift</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(attendance.date), DATE_FORMAT)} at {format(new Date(attendance.markedAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No recent attendance found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
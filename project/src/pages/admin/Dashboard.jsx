import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { FiCalendar, FiUsers, FiCheckCircle, FiXCircle, FiClock, FiPlusCircle } from 'react-icons/fi'
import StatCard from '../../components/cards/StatCard'
import { adminApi } from '../../services/api'
import { DATE_FORMAT } from '../../config/constants'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    activeSlots: 0,
    todayAttendance: 0,
    absentCount: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date()
        const formattedDate = format(today, 'yyyy-MM-dd')
        
        // Fetch students count
        const studentsResponse = await adminApi.getStudents()
        const studentsCount = studentsResponse.data.count
        
        // Fetch today's attendance slots
        const slotsResponse = await adminApi.getAttendanceSlots(formattedDate)
        const slots = slotsResponse.data.data
        const activeSlots = slots.filter(slot => slot.isActive).length
        
        // Fetch today's attendance
        const attendanceResponse = await adminApi.getAttendanceByDate(formattedDate)
        const todayAttendance = attendanceResponse.data.count
        
        // Fetch absent students with threshold of 1
        const absentResponse = await adminApi.getAbsentStudents({ threshold: 1 })
        const absentCount = absentResponse.data.count
        
        // Set stats
        setStats({
          students: studentsCount,
          activeSlots,
          todayAttendance,
          absentCount
        })
        
        // Create recent activity from the fetched data
        const activities = []
        
        // Add slot activities
        slots.forEach(slot => {
          activities.push({
            type: 'slot',
            time: new Date(slot.createdAt),
            slot
          })
        })
        
        // Add attendance activities (limited to 5)
        if (attendanceResponse.data.data.length > 0) {
          attendanceResponse.data.data.slice(0, 5).forEach(attendance => {
            activities.push({
              type: 'attendance',
              time: new Date(attendance.markedAt),
              attendance
            })
          })
        }
        
        // Sort by time (newest first) and limit to 10
        activities.sort((a, b) => b.time - a.time)
        setRecentActivity(activities.slice(0, 10))
        
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of the attendance management system
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.students}
          subtitle="Registered in the system"
          icon={<FiUsers />}
          color="primary"
        />
        
        <StatCard
          title="Active Attendance Slots"
          value={stats.activeSlots}
          subtitle="Open for marking attendance"
          icon={<FiClock />}
          color="secondary"
        />
        
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          subtitle="Students marked present today"
          icon={<FiCheckCircle />}
          color="success"
        />
        
        <StatCard
          title="Absent Students"
          value={stats.absentCount}
          subtitle="With at least one absence"
          icon={<FiXCircle />}
          color="danger"
        />
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/students" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-800 mr-4">
              <FiUsers className="text-xl text-primary-600 dark:text-primary-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Students</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add, view and manage student accounts</p>
            </div>
          </div>
        </Link>
        
        <Link to="/attendance-slots" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary-100 dark:bg-secondary-800 mr-4">
              <FiPlusCircle className="text-xl text-secondary-600 dark:text-secondary-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Attendance Slot</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create new slots for attendance marking</p>
            </div>
          </div>
        </Link>
        
        <Link to="/attendance" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent-100 dark:bg-accent-800 mr-4">
              <FiCalendar className="text-xl text-accent-600 dark:text-accent-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">View Attendance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check attendance reports and records</p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Recent activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 mr-4">
                    {activity.type === 'slot' ? (
                      <FiClock className="text-secondary-600 dark:text-secondary-400" />
                    ) : (
                      <FiCheckCircle className="text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    {activity.type === 'slot' ? (
                      <p className="text-sm text-gray-900 dark:text-white">
                        New {activity.slot.shift} attendance slot created
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(activity.slot.startTime), 'h:mm a')} - {format(new Date(activity.slot.endTime), 'h:mm a')}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.attendance.studentName}</span> ({activity.attendance.studentCode}) marked attendance
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(activity.time, `${DATE_FORMAT} • h:mm a`)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
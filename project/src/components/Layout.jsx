import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiMenu, FiX, FiLogOut, FiUser, FiCalendar, FiUsers, FiClock, FiBarChart2, FiAlertCircle } from 'react-icons/fi'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Define navigation links based on user role
  const navigationLinks = user?.role === 'admin' 
    ? [
        { name: 'Dashboard', path: '/', icon: <FiBarChart2 /> },
        { name: 'Students', path: '/students', icon: <FiUsers /> },
        { name: 'Attendance Slots', path: '/attendance-slots', icon: <FiClock /> },
        { name: 'Attendance', path: '/attendance', icon: <FiCalendar /> },
        { name: 'Statistics', path: '/stats', icon: <FiBarChart2 /> },
        { name: 'Absent Students', path: '/absent', icon: <FiAlertCircle /> },
      ]
    : [
        { name: 'Dashboard', path: '/', icon: <FiBarChart2 /> },
        { name: 'Mark Attendance', path: '/attendance', icon: <FiCalendar /> },
        { name: 'Attendance History', path: '/history', icon: <FiClock /> },
        { name: 'Absences', path: '/absences', icon: <FiAlertCircle /> },
      ]

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for larger screens */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 z-10">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex items-center justify-center h-16 px-4 bg-primary-600 dark:bg-primary-800">
            <h1 className="text-xl font-bold text-white">Attendance System</h1>
          </div>
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-1">
              {navigationLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-4 py-2">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-primary-700 dark:text-primary-200" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? 'Administrator' : `Student (${user?.studentCode})`}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                <FiLogOut className="mr-3 text-lg" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-20 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={toggleSidebar}></div>
        <div className={`fixed inset-y-0 left-0 flex flex-col w-64 max-w-xs bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between h-16 px-4 bg-primary-600 dark:bg-primary-800">
            <h1 className="text-xl font-bold text-white">Attendance System</h1>
            <button onClick={toggleSidebar} className="text-white">
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-1">
              {navigationLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={toggleSidebar}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-4 py-2">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-primary-700 dark:text-primary-200" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? 'Administrator' : `Student (${user?.studentCode})`}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                <FiLogOut className="mr-3 text-lg" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow md:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none focus:text-gray-700">
              <FiMenu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance System</h1>
            <div className="h-8 w-8 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center">
              <FiUser className="h-5 w-5 text-primary-700 dark:text-primary-200" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
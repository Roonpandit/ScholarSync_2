import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import StudentDashboard from './pages/student/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import StudentAttendance from './pages/student/Attendance'
import StudentHistory from './pages/student/History'
import StudentAbsences from './pages/student/Absences'
import AdminStudents from './pages/admin/Students'
import AdminAttendanceSlots from './pages/admin/AttendanceSlots'
import AdminAttendance from './pages/admin/Attendance'
import AdminStats from './pages/admin/Stats'
import AdminAbsent from './pages/admin/Absent'
import Layout from './components/Layout'
import PageNotFound from './pages/PageNotFound'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute user={user} />}>
        {/* Student routes */}
        <Route path="/" element={
          <Layout>
            {user?.role === 'student' ? <StudentDashboard /> : <AdminDashboard />}
          </Layout>
        } />
        
        {/* Student specific routes */}
        {user?.role === 'student' && (
          <>
            <Route path="/attendance" element={<Layout><StudentAttendance /></Layout>} />
            <Route path="/history" element={<Layout><StudentHistory /></Layout>} />
            <Route path="/absences" element={<Layout><StudentAbsences /></Layout>} />
          </>
        )}
        
        {/* Admin specific routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="/students" element={<Layout><AdminStudents /></Layout>} />
            <Route path="/attendance-slots" element={<Layout><AdminAttendanceSlots /></Layout>} />
            <Route path="/attendance" element={<Layout><AdminAttendance /></Layout>} />
            <Route path="/stats" element={<Layout><AdminStats /></Layout>} />
            <Route path="/absent" element={<Layout><AdminAbsent /></Layout>} />
          </>
        )}
      </Route>
      
      {/* 404 page */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

// Protected route component
function ProtectedRoute({ user }) {
  const { Outlet } = require('react-router-dom')
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return <Outlet />
}

export default App
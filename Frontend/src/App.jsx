import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Login from './pages/Login.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentManagement from './pages/admin/StudentManagement.jsx'
import StudentDetails from './pages/admin/StudentDetails.jsx'
import AttendanceSlots from './pages/admin/AttendanceSlots.jsx'
import AttendanceStats from './pages/admin/AttendanceStats.jsx'
import AbsentStudents from './pages/admin/AbsentStudents.jsx'
import MarkAttendance from './pages/student/MarkAttendance.jsx'
import AttendanceHistory from './pages/student/AttendanceHistory.jsx'
import AbsenceHistory from './pages/student/AbsenceHistory.jsx'
import Leave from './pages/student/Leave.jsx'
import Review from './pages/admin/Review.jsx';
import Layout from './components/Layout.jsx'
import NotFound from './pages/NotFound.jsx'
import Landing from './components/Landing.jsx'
import './App.css'
import Lottie from 'lottie-react'
import loaderAnimation from './components/loader/animations/62d18998-eb09-48b7-a29a-e69b4e6fb833.json'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Lottie 
          animationData={loaderAnimation}
          loop={true}
          className="w-32 h-32"
        />
        <p className="mt-4 text-gray-600">Hold on! Your page is loading....</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/home" element={<Landing />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AdminDashboard /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/admin/review" 
        element={
          user && user.role === 'admin' ? 
          <Layout><Review /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/admin/students" 
        element={
          user && user.role === 'admin' ? 
          <Layout><StudentManagement /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/admin/students/:studentId" 
        element={
          user && user.role === 'admin' ? 
          <Layout><StudentDetails /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/admin/attendance-slots" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AttendanceSlots /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/admin/attendance/stats" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AttendanceStats /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/admin/attendance/absent" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AbsentStudents /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student" 
        element={
          user && user.role === 'student' ? 
          <Layout><StudentDashboard /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/student/mark-attendance" 
        element={
          user && user.role === 'student' ? 
          <Layout><MarkAttendance /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/student/attendance-history" 
        element={
          user && user.role === 'student' ? 
          <Layout><AttendanceHistory /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/student/absence-history" 
        element={
          user && user.role === 'student' ? 
          <Layout><AbsenceHistory /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/student/apply-leave" 
        element={
          user && user.role === 'student' ? 
          <Layout><Leave /></Layout> : 
          <Navigate to="/login" />
        } 
      />
      
      {/* Default Route - Show home if not logged in, otherwise redirect based on role */}
      <Route 
        path="/" 
        element={
          user ? (
            user.role === 'admin' ? 
            <Navigate to="/admin" /> : 
            <Navigate to="/student" />
          ) : (
            <Navigate to="/home" />
          )
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
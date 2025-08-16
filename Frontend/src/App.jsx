import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Login from './pages/Login.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Layout from './components/Layout.jsx'
import NotFound from './pages/NotFound.jsx'
import Landing from './components/Landing.jsx'
import DocumentationPage from './components/DocumentationPage.jsx'

import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import StudentManagements from './pages/admin/StudentManagements.jsx'
import TeacherManagements from './pages/admin/TeacherManagements.jsx'
import StudentDetails from './pages/admin/StudentDetails.jsx'
import Reviews from './pages/admin/Reviews.jsx';
import AttendanceSlots from './pages/admin/AttendanceSlots.jsx'
import AttendanceStats from './pages/admin/AttendanceStats.jsx'
import AbsentStudents from './pages/admin/AbsentStudents.jsx'

import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx'
import StudentManagement from './pages/teacher/StudentManagement.jsx'
import StudentDetail from './pages/teacher/StudentDetail.jsx'
import Review from './pages/teacher/Review.jsx'
import AttendanceSlot from './pages/teacher/AttendanceSlot.jsx'
import AttendanceStat from './pages/teacher/AttendanceStat.jsx'
import AbsentStudent from './pages/teacher/AbsentStudent.jsx'

import StudentDashboard from './pages/student/Dashboard.jsx'
import MarkAttendance from './pages/student/MarkAttendance.jsx'
import AttendanceHistory from './pages/student/AttendanceHistory.jsx'
import AbsenceHistory from './pages/student/AbsenceHistory.jsx'
import Leave from './pages/student/Leave.jsx'

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
        <div className="flex items-center mt-4 justify-center space-x-1.5 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-full w-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
            />
          </div>
          <h1 className="text-xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-blue-100 to-indigo-900 text-transparent bg-clip-text" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
            ScholarSync
          </h1>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/home" element={<Landing />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/documentation" element={<DocumentationPage />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AdminDashboard /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/admin/review" 
        element={
          user && user.role === 'admin' ? 
          <Layout><Reviews /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/admin/students" 
        element={
          user && user.role === 'admin' ? 
          <Layout><StudentManagements /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/admin/teachers" 
        element={
          user && user.role === 'admin' ? 
          <Layout><TeacherManagements /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/admin/students/:studentId" 
        element={
          user && user.role === 'admin' ? 
          <Layout><StudentDetails /></Layout> : 
          <Navigate to="/home" />
        }   
      />
      <Route 
        path="/admin/attendance-slots" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AttendanceSlots /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/admin/attendance/stats" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AttendanceStats /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/admin/attendance/absent" 
        element={
          user && user.role === 'admin' ? 
          <Layout><AbsentStudents /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student" 
        element={
          user && user.role === 'student' ? 
          <Layout><StudentDashboard /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/student/mark-attendance" 
        element={
          user && user.role === 'student' ? 
          <Layout><MarkAttendance /></Layout> : 
          <Navigate to="/home" />
        }   
      />
      <Route 
        path="/student/attendance-history" 
        element={
          user && user.role === 'student' ? 
          <Layout><AttendanceHistory /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/student/absence-history" 
        element={
          user && user.role === 'student' ? 
          <Layout><AbsenceHistory /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/student/apply-leave" 
        element={
          user && user.role === 'student' ? 
          <Layout><Leave /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      
      {/* Teacher Routes - Using admin pages */}
      <Route 
        path="/teacher" 
        element={
          user && user.role === 'teacher' ? 
          <Layout><TeacherDashboard /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/teacher/students" 
        element={
          user && user.role === 'teacher' ? 
          <Layout><StudentManagement /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/teacher/review" 
        element={
          user && user.role === 'teacher' ? 
          <Layout><Review /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/teacher/attendance-slots" 
        element={
          user && user.role === 'teacher' ? 
          <Layout><AttendanceSlot /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/teacher/attendance/stats" 
        element={
          user && user.role === 'teacher' ? 
          <Layout><AttendanceStat /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/teacher/attendance/absent" 
        element={
          user && user.role === 'teacher' ? 
          <Layout><AbsentStudent /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      <Route 
        path="/teacher/students/:studentId" 
        element={
          user && user.role === 'teacher' ? 
          <Layout><StudentDetail /></Layout> : 
          <Navigate to="/home" />
        } 
      />
      
      {/* Default Route - Show home if not logged in, otherwise redirect based on role */}
      <Route 
        path="/" 
        element={
          user ? (
            user.role === 'admin' ? 
            <Navigate to="/admin" /> : 
            user.role === 'teacher' ?
            <Navigate to="/teacher" /> :
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
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import { HiddenInstallTrigger, InstallHint } from "./pwa/HiddenInstallTrigger";

import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Layout from "./components/Layout.jsx";
import NotFound from "./pages/NotFound.jsx";
import Landing from "./components/Landing.jsx";
import UserDocumentation from "./Documentation/User.jsx";
import TeacherGuide from "./Documentation/TeachersGuide.jsx";
import StudentGuide from "./Documentation/StudentsGuide.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import StudentManagements from "./pages/admin/StudentManagements.jsx";
import TeacherManagements from "./pages/admin/TeacherManagements.jsx";
import StudentDetails from "./pages/admin/StudentDetails.jsx";
import Reviews from "./pages/admin/Reviews.jsx";
import AttendanceSlots from "./pages/admin/AttendanceSlots.jsx";
import AttendanceStats from "./pages/admin/AttendanceStats.jsx";
import IPAddress from "./pages/admin/IPAddress.jsx";
import LectureManagement from "./pages/admin/LectureManagement.jsx";
import AdminLeaveManagement from "./pages/admin/LeaveManagement.jsx";

import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import StudentManagement from "./pages/teacher/StudentManagement.jsx";
import StudentDetail from "./pages/teacher/StudentDetail.jsx";
import Review from "./pages/teacher/Review.jsx";
import AttendanceSlot from "./pages/teacher/AttendanceSlot.jsx";
import AttendanceStat from "./pages/teacher/AttendanceStat.jsx";
import TeacherLeaveManagement from "./pages/teacher/LeaveManagement.jsx";

import StudentDashboard from "./pages/student/Dashboard.jsx";
import MarkAttendance from "./pages/student/MarkAttendance.jsx";
import AttendanceHistory from "./pages/student/AttendanceHistory.jsx";
import AbsenceHistory from "./pages/student/AbsenceHistory.jsx";
import LeaveManagement from "./pages/student/LeaveManagement.jsx";

import "./App.css";
import Loader from "./components/Loader";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <HiddenInstallTrigger />{" "}
      {/* Invisible - just sets up keyboard shortcut */}
      <InstallHint position="bottom-right" />{" "}
      {/* Optional: subtle visual hint */}
      <Routes>
        <Route path="/home" element={<Landing />} />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/home" />}
        />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/documentation" element={<UserDocumentation />} />
        <Route path="/documentation/teachers" element={<TeacherGuide />} />
        <Route path="/documentation/students" element={<StudentGuide />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <AdminDashboard />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/review"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <Reviews />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/students"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <StudentManagements />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/teachers"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <TeacherManagements />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/students/:studentId"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <StudentDetails />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/attendance-slots"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <AttendanceSlots />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/attendance/stats"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <AttendanceStats />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/ip-management"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <IPAddress />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/lecture-management"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <LectureManagement />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/admin/leave-management"
          element={
            user && user.role === "admin" ? (
              <Layout>
                <AdminLeaveManagement />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            user && user.role === "student" ? (
              <Layout>
                <StudentDashboard />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/student/mark-attendance"
          element={
            user && user.role === "student" ? (
              <Layout>
                <MarkAttendance />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/student/attendance-history"
          element={
            user && user.role === "student" ? (
              <Layout>
                <AttendanceHistory />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/student/absence-history"
          element={
            user && user.role === "student" ? (
              <Layout>
                <AbsenceHistory />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/student/leave-management"
          element={
            user && user.role === "student" ? (
              <Layout>
                <LeaveManagement />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />

        {/* Teacher Routes - Using admin pages */}
        <Route
          path="/teacher"
          element={
            user && user.role === "teacher" ? (
              <Layout>
                <TeacherDashboard />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/teacher/students"
          element={
            user && user.role === "teacher" ? (
              <Layout>
                <StudentManagement />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/teacher/review"
          element={
            user && user.role === "teacher" ? (
              <Layout>
                <Review />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/teacher/attendance-slots"
          element={
            user && user.role === "teacher" ? (
              <Layout>
                <AttendanceSlot />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/teacher/attendance/stats"
          element={
            user && user.role === "teacher" ? (
              <Layout>
                <AttendanceStat />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/teacher/leave-management"
          element={
            user && user.role === "teacher" ? (
              <Layout>
                <TeacherLeaveManagement />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route
          path="/teacher/students/:studentId"
          element={
            user && user.role === "teacher" ? (
              <Layout>
                <StudentDetail />
              </Layout>
            ) : (
              <Navigate to="/home" />
            )
          }
        />

        {/* Default Route - Show home if not logged in, otherwise redirect based on role */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "admin" ? (
                <Navigate to="/admin" />
              ) : user.role === "teacher" ? (
                <Navigate to="/teacher" />
              ) : (
                <Navigate to="/student" />
              )
            ) : (
              <Navigate to="/home" />
            )
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;

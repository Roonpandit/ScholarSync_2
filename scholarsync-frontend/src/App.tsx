import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/providers/auth-context";
import { HiddenInstallTrigger, InstallHint } from "@/pwa/HiddenInstallTrigger";
import { ROUTE_CONSTANTS } from "@/constants/routeConstants";

// Eager — needed on first paint
import Login from "@/pages/Login";
import Layout from "@/components/Layout";
import Landing from "@/components/Landing";
import Loader from "@/components/Loader";
import "./App.css";

// Lazy-loaded — only fetched when the route is visited
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const UserDocumentation = lazy(() => import("@/Documentation/User"));
const TeacherGuide = lazy(() => import("@/Documentation/TeachersGuide"));
const StudentGuide = lazy(() => import("@/Documentation/StudentsGuide"));

// Shared pages (admin + teacher)
const Dashboard = lazy(() => import("@/pages/shared/Dashboard"));
const StudentManagement = lazy(() => import("@/pages/shared/StudentManagement"));
const StudentDetails = lazy(() => import("@/pages/shared/StudentDetails"));
const AttendanceSlots = lazy(() => import("@/pages/shared/AttendanceSlots"));
const AttendanceStats = lazy(() => import("@/pages/shared/AttendanceStats"));
const SharedLeaveManagement = lazy(() => import("@/pages/shared/LeaveManagement"));
const Reviews = lazy(() => import("@/pages/shared/Reviews"));

// Admin-only pages
const TeacherManagements = lazy(() => import("@/pages/admin/TeacherManagements"));
const TeacherDetails = lazy(() => import("@/pages/admin/TeacherDetails"));
const LectureManagement = lazy(() => import("@/pages/admin/LectureManagement"));
const IPAddress = lazy(() => import("@/pages/admin/IPAddress"));

// Student pages
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
const MarkAttendance = lazy(() => import("@/pages/student/MarkAttendance"));
const Attendance = lazy(() => import("@/pages/student/Attendance"));
const LeaveManagement = lazy(() => import("@/pages/student/LeaveManagement"));

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  const isAdminOrTeacher = user && (user.role === "admin" || user.role === "teacher");
  const isAdmin = user && user.role === "admin";
  const isStudent = user && user.role === "student";

  return (
    <>
      <HiddenInstallTrigger />{" "}
      {/* Invisible - just sets up keyboard shortcut */}
      <InstallHint position="bottom-right" />{" "}
      {/* Optional: subtle visual hint */}
      <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTE_CONSTANTS.HOME} element={<Landing />} />
        <Route
          path={ROUTE_CONSTANTS.LOGIN}
          element={!user ? <Login /> : <Navigate to={ROUTE_CONSTANTS.HOME} />}
        />
        <Route path={ROUTE_CONSTANTS.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTE_CONSTANTS.DOCUMENTATION} element={<UserDocumentation />} />
        <Route path={ROUTE_CONSTANTS.DOCUMENTATION_TEACHERS} element={<TeacherGuide />} />
        <Route path={ROUTE_CONSTANTS.DOCUMENTATION_STUDENTS} element={<StudentGuide />} />

        {/* Admin/Teacher Shared Routes */}
        <Route
          path={ROUTE_CONSTANTS.DASHBOARD}
          element={
            isAdminOrTeacher ? (
              <Layout><Dashboard /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.STUDENTS}
          element={
            isAdminOrTeacher ? (
              <Layout><StudentManagement /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.STUDENT_DETAILS}
          element={
            isAdminOrTeacher ? (
              <Layout><StudentDetails /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.ATTENDANCE_SLOTS}
          element={
            isAdminOrTeacher ? (
              <Layout><AttendanceSlots /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.ATTENDANCE_STATS}
          element={
            isAdminOrTeacher ? (
              <Layout><AttendanceStats /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.LEAVE_MANAGEMENT}
          element={
            isAdminOrTeacher ? (
              <Layout><SharedLeaveManagement /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.REVIEWS}
          element={
            isAdminOrTeacher ? (
              <Layout><Reviews /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />

        {/* Admin-Only Routes */}
        <Route
          path={ROUTE_CONSTANTS.TEACHERS}
          element={
            isAdmin ? (
              <Layout><TeacherManagements /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.TEACHER_DETAILS}
          element={
            isAdmin ? (
              <Layout><TeacherDetails /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.LECTURE_MANAGEMENT}
          element={
            isAdmin ? (
              <Layout><LectureManagement /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.IP_MANAGEMENT}
          element={
            isAdmin ? (
              <Layout><IPAddress /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />

        {/* Student Routes */}
        <Route
          path={ROUTE_CONSTANTS.STUDENT_DASHBOARD}
          element={
            isStudent ? (
              <Layout><StudentDashboard /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.STUDENT_MARK_ATTENDANCE}
          element={
            isStudent ? (
              <Layout><MarkAttendance /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.STUDENT_ATTENDANCE}
          element={
            isStudent ? (
              <Layout><Attendance /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route
          path={ROUTE_CONSTANTS.STUDENT_LEAVE}
          element={
            isStudent ? (
              <Layout><LeaveManagement /></Layout>
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />

        {/* Default Route - Redirect based on role */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "admin" ? (
                <Navigate to={ROUTE_CONSTANTS.DASHBOARD} />
              ) : user.role === "teacher" ? (
                <Navigate to={ROUTE_CONSTANTS.DASHBOARD} />
              ) : (
                <Navigate to={ROUTE_CONSTANTS.STUDENT_DASHBOARD} />
              )
            ) : (
              <Navigate to={ROUTE_CONSTANTS.HOME} />
            )
          }
        />
        <Route path={ROUTE_CONSTANTS.NOT_FOUND} element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;

const apiVersion = 'v1';

const ROUTES = {
  BASE_ROUTE: '/api/wfms',
  SWAGGER_ROUTE: '/api-docs',

  // Attendance Slots
  ATTENDANCE_SLOTS: `/${apiVersion}/attendance-slots`,
  ATTENDANCE_SLOT_CLOSE: `/${apiVersion}/attendance-slots/:id/close`,
  ATTENDANCE_SLOT_BY_ID: `/${apiVersion}/attendance-slots/:id`,

  // Student Attendance
  STUDENT_ATT_SLOTS: `/${apiVersion}/student/attendance-slots`,
  STUDENT_ATTENDANCE: `/${apiVersion}/student/attendance`,
  STUDENT_ATT_COUNTS: `/${apiVersion}/student/attendance-counts`,

  // Admin/Teacher Attendance
  ATTENDANCE: `/${apiVersion}/attendance`,
  ATTENDANCE_MARK: `/${apiVersion}/attendance/mark`,
  ATTENDANCE_ABSENT: `/${apiVersion}/attendance/absent`,
  ATTENDANCE_DETAILS: `/${apiVersion}/attendance/details`,
  ATTENDANCE_MARK_ABSENT: `/${apiVersion}/attendance/:id/mark-absent`,
  ATTENDANCE_STATUS: `/${apiVersion}/attendance/:id/status`,
  ATTENDANCE_STATS: `/${apiVersion}/attendance/stats`,

  // Leave - Student
  LEAVE_APPLY: `/${apiVersion}/leave/apply`,
  LEAVE_MY_REQUESTS: `/${apiVersion}/leave/my-requests`,
  LEAVE_CHECK_SLOT: `/${apiVersion}/leave/check-slot`,
  LEAVE_DETAILS_BY_ID: `/${apiVersion}/leave/details/:leaveRequestId`,
  LEAVE_BY_ID: `/${apiVersion}/leave/:requestId`,

  // Leave - Manage (approve/reject/resend/cancel)
  LEAVE_MANAGE: `/${apiVersion}/leave/:requestId/manage`,

  // Leave - Teacher/Admin List
  LEAVE_LIST: `/${apiVersion}/leave`,

  // Lectures
  LECTURES: `/${apiVersion}/lectures`,
  LECTURE_BY_ID: `/${apiVersion}/lectures/:id`,
  LECTURE_STUDENTS: `/${apiVersion}/lectures/:id/students`,
  LECTURE_TEACHER: `/${apiVersion}/lectures/:lectureId/teacher`,
};

export { ROUTES };

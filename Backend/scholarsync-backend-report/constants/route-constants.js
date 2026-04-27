const apiVersion = 'v1';

const ROUTES = {
  BASE_ROUTE: '/api/report',
  SWAGGER_ROUTE: '/api-docs',

  STUDENT_DETAILS: `/${apiVersion}/students/:id/details`,
  ATTENDANCE_DETAILS: `/${apiVersion}/attendance/details`,
  ATTENDANCE_STATS: `/${apiVersion}/attendance/stats`,
  LEAVE_STATS: `/${apiVersion}/leave/stats`,
};

export { ROUTES };

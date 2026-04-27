const apiVersion = 'v1';

const ROUTES = {
  BASE_ROUTE: '/api/iam',
  SWAGGER_ROUTE: '/api-docs',

  // Auth (Public)
  AUTH_LOGIN: `/${apiVersion}/auth/login`,
  AUTH_FORGOT_PASSWORD: `/${apiVersion}/auth/forgot-password`,
  AUTH_RESET_PASSWORD: `/${apiVersion}/auth/reset-password/:resetToken`,
  AUTH_REFRESH_TOKEN: `/${apiVersion}/auth/refresh-token`,

  // Auth (Protected)
  AUTH_ME: `/${apiVersion}/auth/me`,
  AUTH_UPDATE_PASSWORD: `/${apiVersion}/auth/update-password`,
  AUTH_LOGOUT: `/${apiVersion}/auth/logout`,
  AUTH_REGISTER: `/${apiVersion}/auth/register`,
  AUTH_BULK_REGISTER: `/${apiVersion}/auth/bulk/register`,

  // User Management
  USER_BY_ID: `/${apiVersion}/users/:id`,
  USER_STATUS: `/${apiVersion}/users/:id/status`,

  // List endpoints
  TEACHERS: `/${apiVersion}/teachers`,
  STUDENTS: `/${apiVersion}/students`,

  // Lecture Assignment
  LECTURES_MANAGE: `/${apiVersion}/lectures/manage`,

  // IP Management
  IP_MANAGE: `/${apiVersion}/ip/manage`,
  IP_DELETE: `/${apiVersion}/ip/:id`,
  IP_STATUS: `/${apiVersion}/ip/status`,
};

export { ROUTES };

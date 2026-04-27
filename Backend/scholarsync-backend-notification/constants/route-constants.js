const apiVersion = 'v1';

const ROUTES = {
  BASE_ROUTE: '/api/notification',
  SWAGGER_ROUTE: '/api-docs',

  // Internal service-to-service
  WELCOME_EMAIL: `/${apiVersion}/welcome-email`,
  PASSWORD_RESET_EMAIL: `/${apiVersion}/password-reset-email`,
  PASSWORD_RESET_CONFIRMATION: `/${apiVersion}/password-reset-confirmation`,
  ABSENT_NOTIFICATION: `/${apiVersion}/absent-notification`,

  // User-facing
  FEEDBACK_EMAILS: `/${apiVersion}/feedback-emails`,
};

export { ROUTES };

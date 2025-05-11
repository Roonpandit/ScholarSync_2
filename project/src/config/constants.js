// API URL
export const API_URL = 'http://localhost:2009/api'

// Attendance shifts
export const SHIFTS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening'
}

// Date format for displaying dates
export const DATE_FORMAT = 'MMM dd, yyyy'

// Time format for displaying times
export const TIME_FORMAT = 'h:mm a'

// Validation constants
export const VALIDATION = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  STUDENT_CODE_REGEX: /^[A-Za-z0-9]{3,10}$/
}
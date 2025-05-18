// Time utility functions for consistent time handling across the application

// Timezone offset for IST (India Standard Time)
const TIMEZONE_OFFSET = 5.5; // 5 hours and 30 minutes

// Convert UTC time to IST
const convertToIST = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(d.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
};

// Convert IST time to UTC
const convertToUTC = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(d.getTime() - (TIMEZONE_OFFSET * 60 * 60 * 1000));
};

// Get current date in IST
const getCurrentDateIST = () => {
  return convertToIST(new Date());
};

// Get current time in IST
const getCurrentTimeIST = () => {
  return convertToIST(new Date());
};

// Format date in YYYY-MM-DD format
const formatDate = (date) => {
  if (!date) return '';
  const d = convertToIST(date);
  return d.toISOString().split('T')[0];
};

// Format time in HH:mm format
const formatTime = (date) => {
  if (!date) return '';
  const d = convertToIST(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Format date and time in YYYY-MM-DD HH:mm format
const formatDateTime = (date) => {
  if (!date) return '';
  const d = convertToIST(date);
  return `${formatDate(d)} ${formatTime(d)}`;
};

// Check if a date is before another date in IST
const isDateBefore = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = convertToIST(date1);
  const d2 = convertToIST(date2);
  return d1 < d2;
};

// Check if two dates are the same in IST
const isSameDate = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = convertToIST(date1);
  const d2 = convertToIST(date2);
  return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
};

// Check if a date is within a range in IST
const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate || !endDate) return false;
  const d = convertToIST(date);
  const start = convertToIST(startDate);
  const end = convertToIST(endDate);
  return d >= start && d <= end;
};

// Get the start of the day in IST
const getStartOfDayIST = (date) => {
  if (!date) return null;
  const d = convertToIST(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Get the end of the day in IST
const getEndOfDayIST = (date) => {
  if (!date) return null;
  const d = convertToIST(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

// Add days to a date in IST
const addDays = (date, days) => {
  if (!date) return null;
  const d = convertToIST(date);
  return convertToIST(new Date(d.getTime() + (days * 24 * 60 * 60 * 1000)));
};

// Get the difference in days between two dates in IST
const getDaysDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const d1 = convertToIST(date1);
  const d2 = convertToIST(date2);
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

module.exports = {
  convertToIST,
  convertToUTC,
  getCurrentDateIST,
  getCurrentTimeIST,
  formatDate,
  formatTime,
  formatDateTime,
  isDateBefore,
  isSameDate,
  isDateInRange,
  getStartOfDayIST,
  getEndOfDayIST,
  addDays,
  getDaysDifference
};

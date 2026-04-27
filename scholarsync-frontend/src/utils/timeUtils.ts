// FORMAT date as "Mon, May 1" (or similar)
export const formatDateDisplay = (date: string | Date): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
};

// FORMAT time as 24-hour IST, e.g. "14:05"
export const formatTime24h = (date: string | Date): string => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
};

// FORMAT time in 24-hour format from UTC
export const formatTime24hUTC = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.getUTCHours().toString().padStart(2, '0') + ':' +
         d.getUTCMinutes().toString().padStart(2, '0');
};

// FORMAT date and time as "Mon, May 1 - 14:05"
export const formatDateTime = (date: string | Date): string => {
  if (!date) return "";
  const formattedDate = formatDateDisplay(date);
  const formattedTime = formatTime24h(date);
  return `${formattedDate} - ${formattedTime}`;
};

// CONVERT to IST Date object
export const convertToIST = (date: Date | string | null): Date | null => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  // Convert UTC to IST by adding 5.5 hours
  return new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
};

// CONVERT to UTC from IST
export const convertToUTC = (date: Date | string | null): Date | null => {
  if (!date) return null;
  const istDate = new Date(date);
  const ISTOffset = 5.5 * 60 * 60 * 1000; // in milliseconds
  return new Date(istDate.getTime() - ISTOffset);
};

// GET current time in IST as Date object
export const getCurrentTimeISTAsDate = (): Date => {
  return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
};

// GET current IST time (e.g., "14:05")
export const getCurrentTimeIST = (): string => {
  return formatTime24h(new Date());
};

// FORMAT UTC time string to IST
export const formatToIST = (utcString: string): string => {
  const date = new Date(utcString);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false // set to true if you want AM/PM format
  };

  const istTime = date.toLocaleTimeString("en-IN", options);

  return istTime;
};

// GET current IST date as Date object
export const getCurrentDateIST = (): Date | null => {
  return convertToIST(new Date());
};

// CHECK if date1 is before date2 (based on IST)
export const isDateBefore = (date1: Date | string, date2: Date | string): boolean => {
  if (!date1 || !date2) return false;
  const d1 = convertToIST(date1);
  const d2 = convertToIST(date2);
  if (!d1 || !d2) return false;
  return d1 < d2;
};

// CHECK if two dates fall on the same IST day
export const isSameDate = (date1: Date | string, date2: Date | string): boolean => {
  if (!date1 || !date2) return false;
  const d1 = convertToIST(date1);
  const d2 = convertToIST(date2);
  if (!d1 || !d2) return false;
  return d1.toDateString() === d2.toDateString();
};

// SUBTRACT IST offset from a UTC date (convert UTC to IST)
export const subtractISTOffset = (date: Date): Date => {
  // date is a Date object in UTC
  // IST = UTC + 5:30, so subtracting 5:30 means subtract 5*60 + 30 = 330 minutes
  const offsetMinutes = 330;
  return new Date(date.getTime() - offsetMinutes * 60 * 1000);
};

// SUBTRACT specified hours from a date
export const subtractHours = (date: Date | string | null, hours: number): Date | null => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const millisecondsPerHour = 60 * 60 * 1000;
  return new Date(d.getTime() - (hours * millisecondsPerHour));
};

// SUBTRACT 11 hours from a date
export const subtract11Hours = (date: Date | string | null): Date | null => {
  if (!date) return null;
  return subtractHours(date, 11);
};

// CONVERT UTC date to IST date
export const convertUTCtoIST = (date: Date | string | null): Date | null => {
  if (!date) return null;
  // Convert UTC to IST by subtracting 11 hours
  return subtract11Hours(new Date(date));
};

// CHECK if current time is within UTC time window
export const isWithinTimeWindowUTC = (startTimeUTC: string | Date, endTimeUTC: string | Date): boolean => {
  const nowUTC = new Date();
  // Convert to UTC by setting timezone offset to 0
  nowUTC.setHours(nowUTC.getUTCHours());
  nowUTC.setMinutes(nowUTC.getUTCMinutes());
  nowUTC.setSeconds(nowUTC.getUTCSeconds());

  const startTime = new Date(startTimeUTC);
  const endTime = new Date(endTimeUTC);

  // Convert slot times to UTC
  startTime.setHours(startTime.getUTCHours());
  startTime.setMinutes(startTime.getUTCMinutes());
  startTime.setSeconds(startTime.getUTCSeconds());

  endTime.setHours(endTime.getUTCHours());
  endTime.setMinutes(endTime.getUTCMinutes());
  endTime.setSeconds(endTime.getUTCSeconds());

  return nowUTC >= startTime && nowUTC <= endTime;
};

// GET current time in UTC
export const getCurrentTimeUTC = (): Date => {
  const now = new Date();
  // Convert to UTC by setting timezone offset to 0
  now.setHours(now.getUTCHours());
  now.setMinutes(now.getUTCMinutes());
  now.setSeconds(now.getUTCSeconds());
  return now;
};

// Format date as "May 19, 2025"
export const formatDate = (date: string | Date): string => {
  const localDate = new Date(date);
  return localDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time as 24-hour format, e.g. "14:05"
export const formatTime = (time: string | Date): string => {
  const localTime = new Date(time);
  return localTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Format date and time as "Mon, May 1 - 14:05"
export const formatDateandTime = (date: string | Date): string => {
  if (!date) return "";
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(date);
  return `${formattedDate} - ${formattedTime}`;
};
